import React, { useState, useEffect } from 'react';
import { Plus, Search, GraduationCap, Loader2, Mail, UserX, UserCheck } from 'lucide-react';
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
      const [studentsRes, classesRes] = await Promise.all([
        adminAPI.getStudents(),
        adminAPI.getClasses()
      ]);
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      // Mock data
      setStudents([
        { id: '1', name: 'Alice Johnson', email: 'alice@student.edu', rollNumber: 'CS2024001', className: 'CS Year 1 - A', classId: '1', isActive: true, attendance: 92, createdAt: '2024-01-15' },
        { id: '2', name: 'Bob Williams', email: 'bob@student.edu', rollNumber: 'CS2024002', className: 'CS Year 1 - A', classId: '1', isActive: true, attendance: 78, createdAt: '2024-01-15' },
        { id: '3', name: 'Carol Davis', email: 'carol@student.edu', rollNumber: 'CS2024003', className: 'CS Year 1 - B', classId: '2', isActive: true, attendance: 65, createdAt: '2024-01-15' },
        { id: '4', name: 'David Brown', email: 'david@student.edu', rollNumber: 'CS2024004', className: 'CS Year 2 - A', classId: '3', isActive: false, attendance: 45, createdAt: '2024-01-15' },
        { id: '5', name: 'Emma Wilson', email: 'emma@student.edu', rollNumber: 'IT2024001', className: 'IT Year 1 - A', classId: '4', isActive: true, attendance: 88, createdAt: '2024-01-15' },
      ]);
      setClasses([
        { id: '1', name: 'Computer Science', year: 1, division: 'A' },
        { id: '2', name: 'Computer Science', year: 1, division: 'B' },
        { id: '3', name: 'Computer Science', year: 2, division: 'A' },
        { id: '4', name: 'Information Technology', year: 1, division: 'A' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === 'all' || student.classId === filterClass;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && student.isActive) ||
      (filterStatus === 'inactive' && !student.isActive);
    return matchesSearch && matchesClass && matchesStatus;
  });

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
        title: student.isActive ? 'Student Deactivated' : 'Student Activated',
        description: `${student.name} has been ${student.isActive ? 'deactivated' : 'activated'}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'An error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.rollNumber || !formData.classId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
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
      setStudents([...students, newStudent]);
      toast({
        title: 'Student Created',
        description: 'The student account has been created successfully.',
      });
      setIsDialogOpen(false);
      setFormData({ name: '', email: '', password: '', rollNumber: '', classId: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'An error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAttendanceColor = (attendance?: number) => {
    if (!attendance) return 'text-muted-foreground';
    if (attendance >= 75) return 'text-success';
    if (attendance >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Students</h1>
            <p className="text-muted-foreground mt-1">Manage student accounts and status</p>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)} 
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Student
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50"
            />
          </div>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-full sm:w-48 bg-secondary/50">
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
            <SelectTrigger className="w-full sm:w-40 bg-secondary/50">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GraduationCap className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">No students found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try adjusting your search' : 'Add your first student to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll Number</th>
                    <th>Class</th>
                    <th>Attendance</th>
                    <th>Status</th>
                    <th className="text-right">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {student.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{student.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary text-foreground text-sm font-mono">
                          {student.rollNumber}
                        </span>
                      </td>
                      <td className="text-muted-foreground">{student.className}</td>
                      <td>
                        <span className={`font-medium ${getAttendanceColor(student.attendance)}`}>
                          {student.attendance !== undefined ? `${student.attendance}%` : 'N/A'}
                        </span>
                        {student.attendance !== undefined && student.attendance < 75 && (
                          <span className="ml-2 text-xs text-destructive">Defaulter</span>
                        )}
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          student.isActive 
                            ? 'bg-success/10 text-success' 
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {student.isActive ? (
                            <>
                              <UserCheck className="w-3 h-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3" />
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
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Enter the details for the new student account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="e.g., John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g., john.doe@student.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter initial password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-secondary/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number</Label>
                <Input
                  id="rollNumber"
                  placeholder="e.g., CS2024001"
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="classId">Class</Label>
                <Select
                  value={formData.classId}
                  onValueChange={(value) => setFormData({ ...formData, classId: value })}
                >
                  <SelectTrigger className="bg-secondary/50">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default StudentsPage;
