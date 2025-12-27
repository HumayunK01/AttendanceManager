import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, GraduationCap, Loader2, Mail, UserX, UserCheck, X, TrendingDown, TrendingUp, Users as UsersIcon } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';

interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  className: string;
  classId: string;
  isActive: boolean;
  attendance?: number;
  createdAt: string;
}

interface Class {
  id: string;
  name: string;
  year: number;
  division: string;
}

const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', rollNumber: '', classId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [studentsRes, classesRes] = await Promise.all([
        adminAPI.getStudents(),
        adminAPI.getClasses()
      ]);
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load students. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized filtered students
  const filteredStudents = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return students.filter((student) => {
      const matchesSearch = !query ||
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.rollNumber.toLowerCase().includes(query);
      const matchesClass = filterClass === 'all' || student.classId === filterClass;
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && student.isActive) ||
        (filterStatus === 'inactive' && !student.isActive);
      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [students, searchQuery, filterClass, filterStatus]);

  // Memoized stats
  const stats = useMemo(() => {
    const activeStudents = students.filter(s => s.isActive).length;
    const avgAttendance = students.length > 0
      ? students.reduce((sum, s) => sum + (s.attendance || 0), 0) / students.length
      : 0;
    const defaulters = students.filter(s => s.isActive && (s.attendance || 0) < 75).length;
    const recentlyAdded = students.filter(s => {
      const daysDiff = (Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;

    return { activeStudents, avgAttendance: Math.round(avgAttendance), defaulters, recentlyAdded };
  }, [students]);

  // Get initials for avatar
  const getInitials = useCallback((name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, []);

  const getAttendanceColor = useCallback((attendance?: number) => {
    if (!attendance) return 'text-muted-foreground';
    if (attendance >= 75) return 'text-success';
    if (attendance >= 60) return 'text-warning';
    return 'text-destructive';
  }, []);

  const handleToggleStatus = async (student: Student) => {
    try {
      if (student.isActive) {
        await adminAPI.deactivateStudent(student.id);
      } else {
        await adminAPI.activateStudent(student.id);
      }
      setStudents(students.map(s =>
        s.id === student.id ? { ...s, isActive: !s.isActive } : s
      ));
      toast({
        title: 'Success',
        description: `${student.name} has been ${student.isActive ? 'deactivated' : 'activated'}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update student status.',
        variant: 'destructive',
      });
    }
  };

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setFormData({ name: '', email: '', password: '', rollNumber: '', classId: '' });
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.rollNumber.trim() || !formData.classId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await adminAPI.createStudent(formData);
      const selectedClass = classes.find(c => c.id === formData.classId);
      const newStudent = response.data || {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        rollNumber: formData.rollNumber,
        classId: formData.classId,
        className: selectedClass ? `${selectedClass.name} Year ${selectedClass.year} - ${selectedClass.division}` : '',
        isActive: true,
        attendance: 0,
        createdAt: new Date().toISOString()
      };
      setStudents([newStudent, ...students]);
      toast({
        title: 'Success',
        description: 'Student account created successfully.',
      });
      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterClass('all');
    setFilterStatus('all');
    setSearchQuery('');
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 lg:w-7 lg:h-7 text-primary" />
              </div>
              Students
            </h1>
            <p className="text-muted-foreground mt-2 text-sm lg:text-base">
              Manage student accounts and track attendance
            </p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            size="lg"
          >
            <Plus className="w-5 h-5" />
            Add Student
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{students.length}</p>
          </div>
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">Active Students</p>
            </div>
            <p className="text-2xl font-bold text-success">{stats.activeStudents}</p>
          </div>
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">Avg Attendance</p>
            </div>
            <p className="text-2xl font-bold text-accent">{stats.avgAttendance}%</p>
          </div>
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground">Defaulters</p>
            </div>
            <p className="text-2xl font-bold text-destructive">{stats.defaulters}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name, email, or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-secondary/50 border-border/50 focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-full sm:w-56 bg-secondary/50 border-border/50">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} Y{cls.year} - {cls.division}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40 bg-secondary/50 border-border/50">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          {(searchQuery || filterClass !== 'all' || filterStatus !== 'all') && (
            <Button
              variant="outline"
              size="default"
              onClick={handleClearFilters}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery || filterClass !== 'all' || filterStatus !== 'all' ? 'No students found' : 'No students yet'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                {searchQuery || filterClass !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by adding your first student to the system.'}
              </p>
              {!(searchQuery || filterClass !== 'all' || filterStatus !== 'all') && (
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Your First Student
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-1/4">Student</th>
                      <th className="w-32">Roll Number</th>
                      <th className="w-1/5">Class</th>
                      <th className="w-24">Attendance</th>
                      <th className="w-28">Status</th>
                      <th className="w-20 text-right">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="group">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20 group-hover:scale-110 transition-transform">
                              <span className="text-sm font-bold text-primary">
                                {getInitials(student.name)}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{student.name}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5" />
                                {student.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-secondary/80 text-foreground text-sm font-mono font-semibold border border-border/50">
                            {student.rollNumber}
                          </span>
                        </td>
                        <td className="text-sm text-muted-foreground">{student.className}</td>
                        <td>
                          <div className="flex flex-col gap-1">
                            <span className={`font-bold text-base ${getAttendanceColor(student.attendance)}`}>
                              {student.attendance !== undefined ? `${student.attendance}%` : 'N/A'}
                            </span>
                            {student.attendance !== undefined && student.attendance < 75 && (
                              <span className="text-xs text-destructive font-medium">Defaulter</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${student.isActive
                              ? 'bg-success/10 text-success border-success/20'
                              : 'bg-destructive/10 text-destructive border-destructive/20'
                            }`}>
                            {student.isActive ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                Active
                              </>
                            ) : (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                Inactive
                              </>
                            )}
                          </span>
                        </td>
                        <td>
                          <div className="flex justify-end">
                            <Switch
                              checked={student.isActive}
                              onCheckedChange={() => handleToggleStatus(student)}
                              aria-label={`Toggle ${student.name} status`}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Results Count */}
              <div className="px-6 py-4 border-t border-border/50 text-sm text-muted-foreground text-center">
                Showing {filteredStudents.length} of {students.length} student{students.length !== 1 ? 's' : ''}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Add New Student</DialogTitle>
            <DialogDescription>
              Enter the details for the new student account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-secondary/50 border-border/50 focus:border-primary"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., john.doe@student.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                  className="bg-secondary/50 border-border/50 focus:border-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter initial password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-secondary/50 border-border/50 focus:border-primary"
                  minLength={6}
                  required
                />
                <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rollNumber" className="text-sm font-medium">
                    Roll Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="rollNumber"
                    placeholder="e.g., CS2024001"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value.toUpperCase() })}
                    className="bg-secondary/50 border-border/50 focus:border-primary font-mono"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classId" className="text-sm font-medium">
                    Class <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  >
                    <SelectTrigger className="bg-secondary/50 border-border/50 focus:border-primary">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} Y{cls.year} - {cls.division}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Student
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default StudentsPage;
