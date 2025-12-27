import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Plus,
  Search,
  GraduationCap,
  Loader2,
  Mail,
  UserX,
  UserCheck,
  X,
  TrendingDown,
  TrendingUp,
  Users as UsersIcon,
  Clock,
  Filter,
  Pencil,
  Trash2
} from 'lucide-react';
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

// --- Types ---

interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  className: string;
  classId: string;
  batchId?: number | null;
  batchName?: string | null;
  isActive: boolean;
  attendance?: number;
  totalSessions?: number;
  createdAt: string;
}

interface Class {
  id: number;
  program: string;
  division: string | null;
  batchYear: number;
}

interface Batch {
  id: number;
  name: string;
}

// --- Sub-components ---

const StatsCard = memo(({ title, value, icon: Icon, colorClass, gradientClass, iconBgClass, suffix = "" }: any) => (
  <div className={`glass-card p-4 rounded-xl border border-border/50 ${gradientClass} flex flex-col justify-between overflow-hidden relative group transition-all duration-300 hover:shadow-lg hover:shadow-${colorClass}/5`}>
    <div className={`absolute -right-4 -top-4 w-20 h-20 ${iconBgClass} rounded-full blur-2xl group-hover:opacity-70 transition-opacity duration-500`} />
    <div className="relative">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-9 h-9 rounded-xl ${iconBgClass} flex items-center justify-center border border-${colorClass}/20 shadow-inner`}>
          <Icon className={`w-5 h-5 text-${colorClass}`} />
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">{title}</p>
          <div className={`h-0.5 w-6 bg-${colorClass} rounded-full`} />
        </div>
      </div>
      <p className={`text-2xl font-black text-${colorClass === 'foreground' ? 'foreground' : colorClass} tracking-tight`}>
        {value}{suffix}
      </p>
    </div>
  </div>
));

StatsCard.displayName = 'StatsCard';

const StudentRow = memo(({
  student,
  onToggle,
  onEdit,
  onDelete,
  getInitials,
  getAttendanceColor
}: {
  student: Student;
  onToggle: (s: Student) => void;
  onEdit: (s: Student) => void;
  onDelete: (s: Student) => void;
  getInitials: (name: string) => string;
  getAttendanceColor: (att?: number, total?: number) => string;
}) => (
  <tr className="group hover:bg-white/5 transition-colors duration-200">
    <td className="py-3 px-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-300 shadow-inner">
          <span className="text-[11px] font-black text-primary tracking-tighter">
            {getInitials(student.name)}
          </span>
        </div>
        <div>
          <p className="text-sm font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
            {student.name}
          </p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 opacity-60">
            <Mail className="w-3 h-3 flex-shrink-0" />
            {student.email}
          </p>
        </div>
      </div>
    </td>
    <td className="px-6">
      <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-secondary/80 text-foreground text-[10px] font-black border border-border/50 uppercase tracking-wider">
        {student.rollNumber}
      </span>
    </td>
    <td className="px-6">
      <p className="text-[12px] font-medium text-muted-foreground whitespace-nowrap md:whitespace-normal md:max-w-[250px] lg:max-w-[400px]" title={student.className}>
        {student.className}
      </p>
    </td>
    <td className="px-6">
      {student.batchName ? (
        <span className="inline-flex items-center px-2 py-1 rounded-md bg-accent/10 text-accent text-[10px] font-black border border-accent/20 shadow-sm">
          {student.batchName}
        </span>
      ) : (
        <span className="text-muted-foreground/30 text-[10px] font-medium italic">No Batch</span>
      )}
    </td>
    <td className="px-6">
      <div className="flex flex-col gap-0.5">
        <span className={`text-sm font-black ${getAttendanceColor(student.attendance, student.totalSessions)}`}>
          {student.attendance !== undefined && (student.totalSessions || 0) > 0 ? `${student.attendance}%` : 'N/A'}
        </span>
        {student.attendance !== undefined && (student.totalSessions || 0) > 0 && student.attendance < 75 && (
          <span className="text-[9px] font-black uppercase text-destructive tracking-widest whitespace-nowrap">Defaulter</span>
        )}
      </div>
    </td>
    <td className="px-6">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${student.isActive
        ? 'bg-success/10 text-success border-success/20'
        : 'bg-destructive/10 text-destructive border-destructive/20'
        }`}>
        {student.isActive ? 'Active' : 'Inactive'}
      </span>
    </td>
    <td className="px-6">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(student)}
          className="w-8 h-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(student)}
          className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
        <div className="w-[1px] h-4 bg-border/50 mx-1" />
        <Switch
          checked={student.isActive}
          onCheckedChange={() => onToggle(student)}
          className="data-[state=checked]:bg-success scale-75"
        />
      </div>
    </td>
  </tr>
));

StudentRow.displayName = 'StudentRow';

// --- Main Component ---

const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', rollNo: '', classId: '', batchId: '' });
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [studentsRes, classesRes] = await Promise.all([
        adminAPI.getStudents(),
        adminAPI.getClasses()
      ]);
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to synchronize student database.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchBatches = async () => {
      if (!formData.classId) {
        setBatches([]);
        return;
      }
      try {
        const res = await adminAPI.getBatches(formData.classId);
        setBatches(res.data);
      } catch (error) {
        console.error(error);
        setBatches([]);
      }
    };
    if (isDialogOpen) {
      fetchBatches();
    }
  }, [formData.classId, isDialogOpen]);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return students.filter((s) => {
      const matchesSearch = !query ||
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.rollNumber.toLowerCase().includes(query);
      const matchesClass = filterClass === 'all' || s.classId === filterClass;
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && s.isActive) ||
        (filterStatus === 'inactive' && !s.isActive);
      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [students, searchQuery, filterClass, filterStatus]);

  const stats = useMemo(() => {
    const activeStudents = students.filter(s => s.isActive).length;
    const avgAttendance = students.length > 0
      ? students.reduce((sum, s) => sum + Number(s.attendance || 0), 0) / students.length
      : 0;
    const defaulters = students.filter(s => s.isActive && (s.totalSessions || 0) > 0 && (s.attendance || 0) < 75).length;
    const recentlyAdded = students.filter(s => (Date.now() - new Date(s.createdAt).getTime()) / 86400000 <= 7).length;

    return { activeStudents, avgAttendance: Math.round(avgAttendance), defaulters, recentlyAdded };
  }, [students]);

  const getInitials = useCallback((name: string) => {
    const parts = name.split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }, []);

  const getAttendanceColor = useCallback((attendance?: number, totalSessions?: number) => {
    if (attendance === undefined || (totalSessions || 0) === 0) return 'text-muted-foreground';
    if (attendance >= 75) return 'text-success';
    if (attendance >= 60) return 'text-warning';
    return 'text-destructive';
  }, []);

  const handleToggleStatus = async (student: Student) => {
    try {
      if (student.isActive) await adminAPI.deactivateStudent(student.id);
      else await adminAPI.activateStudent(student.id);

      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, isActive: !s.isActive } : s));
      toast({ title: 'Status Updated', description: `${student.name} is now ${student.isActive ? 'Inactive' : 'Active'}.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update student status.', variant: 'destructive' });
    }
  };

  const handleEdit = useCallback((student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      password: '', // Password is empty for edit
      rollNo: student.rollNumber,
      classId: String(student.classId), // Force to string for Select component
      batchId: student.batchId ? String(student.batchId) : ''
    });
    setIsDialogOpen(true);
  }, []);

  const handleDeletePrompt = useCallback((student: Student) => {
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDelete = async () => {
    if (!studentToDelete) return;
    try {
      setIsSubmitting(true);
      await adminAPI.deleteStudent(studentToDelete.id);
      toast({ title: 'Success', description: 'Student removed from database.' });
      fetchData();
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to delete student.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || (!editingStudent && !formData.password.trim()) || !formData.rollNo || !formData.classId) return;

    setIsSubmitting(true);
    try {
      let studentId;
      if (editingStudent) {
        studentId = editingStudent.id;
        await adminAPI.updateStudent(editingStudent.id, {
          name: formData.name,
          email: formData.email,
          rollNo: Number(formData.rollNo),
          classId: formData.classId
        });
        toast({ title: 'Success', description: 'Student configuration updated.' });
      } else {
        const res = await adminAPI.createStudent({
          ...formData,
          rollNo: Number(formData.rollNo)
        });
        studentId = res.data.id;
        toast({ title: 'Success', description: 'Student account provisioned successfully.' });
      }

      // Assign Batch
      if (studentId) {
        await adminAPI.assignStudentBatch(studentId, formData.batchId || null);
      }

      fetchData();
      setIsDialogOpen(false);
      setFormData({ name: '', email: '', password: '', rollNo: '', classId: '', batchId: '' });
      setEditingStudent(null);
    } catch (error: any) {
      toast({ title: 'Fault', description: error.response?.data?.error || 'Database sync failed.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5 tracking-tight">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              Students
            </h1>
            <p className="text-[13px] text-muted-foreground ml-1">Manage enrollments and monitor academic attendance</p>
          </div>
          <Button
            onClick={() => {
              setEditingStudent(null);
              setFormData({ name: '', email: '', password: '', rollNo: '', classId: '' });
              setIsDialogOpen(true);
            }}
            className="h-9 gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 rounded-lg px-6 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="font-bold">Add Student</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Students" value={students.length} icon={GraduationCap} colorClass="primary" gradientClass="bg-gradient-to-br from-primary/5 to-transparent" iconBgClass="bg-primary/10" />
          <StatsCard title="Active Students" value={stats.activeStudents} icon={UserCheck} colorClass="success" gradientClass="bg-gradient-to-br from-success/5 to-transparent" iconBgClass="bg-success/10" />
          <StatsCard title="Avg Attendance" value={stats.avgAttendance} icon={TrendingUp} colorClass="accent" gradientClass="bg-gradient-to-br from-accent/5 to-transparent" iconBgClass="bg-accent/10" suffix="%" />
          <StatsCard title="Defaulters" value={stats.defaulters} icon={TrendingDown} colorClass="destructive" gradientClass="bg-gradient-to-br from-destructive/5 to-transparent" iconBgClass="bg-destructive/10" />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by ID, name, or mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-secondary/30 border-border/50 focus:border-primary/50 rounded-xl transition-all shadow-sm text-sm"
            />
          </div>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="h-9 bg-secondary/30 border-border/50 rounded-xl text-[12px] font-bold">
              <div className="flex items-center gap-2">
                <Filter className="w-3 h-3 opacity-50" />
                <SelectValue placeholder="All Classes" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 rounded-xl max-w-[calc(100vw-2rem)] sm:max-w-[400px]">
              <SelectItem value="all" className="font-bold">All Classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)} className="whitespace-normal py-2.5 leading-relaxed">
                  {c.program} Y{c.batchYear}{c.division ? `-${c.division}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 bg-secondary/30 border-border/50 rounded-xl text-[12px] font-bold">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-3 h-3 opacity-50" />
                <SelectValue placeholder="All Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 rounded-xl">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 glass-card rounded-2xl border-dashed">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-3 opacity-50" />
            <p className="text-[13px] text-muted-foreground font-medium animate-pulse">Scanning student records...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border-dashed border-primary/20 bg-primary/5">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
              <GraduationCap className="w-8 h-8 text-primary opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1.5">No students yet</h3>
            <p className="text-[13px] text-muted-foreground max-w-sm mb-8 leading-relaxed">
              Your student database is currently empty. Get started by provisioning your first student account.
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="gap-2 shadow-xl shadow-primary/20 rounded-xl px-8"
            >
              <Plus className="w-4 h-4" />
              Add Your First Student
            </Button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1.5">No results found</h3>
            <p className="text-[13px] text-muted-foreground max-w-sm mb-6"> Refine your search parameters or check your active filters.</p>
            {(searchQuery || filterClass !== 'all' || filterStatus !== 'all') && (
              <Button
                variant="outline"
                onClick={() => { setSearchQuery(''); setFilterClass('all'); setFilterStatus('all'); }}
                className="rounded-xl border-border/50 font-bold px-6 h-9 text-xs"
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="glass-card overflow-hidden rounded-2xl border-border/50 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/20">
                    <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Student Info</th>
                    <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 whitespace-nowrap">Roll No</th>
                    <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 whitespace-nowrap">Academic Class</th>
                    <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 whitespace-nowrap">Batch</th>
                    <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 whitespace-nowrap">Attendance</th>
                    <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 whitespace-nowrap">Status</th>
                    <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredStudents.map((s) => (
                    <StudentRow
                      key={s.id}
                      student={s}
                      onToggle={handleToggleStatus}
                      onEdit={handleEdit}
                      onDelete={handleDeletePrompt}
                      getInitials={getInitials}
                      getAttendanceColor={getAttendanceColor}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50 sm:max-w-md rounded-3xl shadow-2xl">
          <DialogHeader className="pt-2 px-1">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                {editingStudent ? <Pencil className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
              </div>
              {editingStudent ? 'Update Student' : 'Add New Student'}
            </DialogTitle>
            <DialogDescription className="text-[13px] mt-1">
              {editingStudent ? 'Modify student credentials and academic profile.' : 'Create a new student record in the database.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="space-y-4 px-1">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Full Name</Label>
                <Input placeholder="Enrollment Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-10 bg-secondary/50 border-border/50 rounded-xl" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Email Address</Label>
                  <Input type="email" placeholder="student@edu.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })} className="h-10 bg-secondary/50 border-border/50 rounded-xl" required />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Password</Label>
                    {editingStudent && <span className="text-[9px] text-primary font-bold italic">Keep blank to skip</span>}
                  </div>
                  <Input type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="h-10 bg-secondary/50 border-border/50 rounded-xl" required={!editingStudent} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Roll Number</Label>
                  <Input type="number" placeholder="Enrollment No." value={formData.rollNo} onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })} className="h-10 bg-secondary/50 border-border/50 rounded-xl" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Academic Class</Label>
                  <Select value={formData.classId} onValueChange={(v) => setFormData({ ...formData, classId: v, batchId: '' })}>
                    <SelectTrigger className="h-10 bg-secondary/50 border-border/50 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 rounded-xl max-w-[calc(100vw-4rem)] sm:max-w-[400px]">
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)} className="whitespace-normal py-2.5 leading-relaxed">
                          {c.program} Y{c.batchYear}{c.division ? `-${c.division}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Batch Selection */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Practical Batch (Optional)</Label>
                <Select
                  value={formData.batchId || "none"}
                  onValueChange={(v) => setFormData({ ...formData, batchId: v === "none" ? "" : v })}
                  disabled={!formData.classId || batches.length === 0}
                >
                  <SelectTrigger className="h-10 bg-secondary/50 border-border/50 rounded-xl">
                    <SelectValue placeholder={!formData.classId ? "Select Class First" : batches.length === 0 ? "No Batches Available" : "Select Batch"} />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 rounded-xl">
                    <SelectItem value="none">None / Unassigned</SelectItem>
                    {batches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t border-border/20 px-1 gap-2">
              <Button type="button" variant="ghost" onClick={() => { setIsDialogOpen(false); setEditingStudent(null); }} className="rounded-xl font-bold h-10 text-sm">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl font-bold bg-primary hover:bg-primary/90 h-10 text-sm">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingStudent ? 'Update Member' : 'Create Student'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50 sm:max-w-[380px] rounded-3xl shadow-2xl p-0 overflow-hidden">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-destructive/10 flex items-center justify-center mx-auto mb-4 border border-destructive/20">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2 tracking-tight">Remove Student?</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed px-4">
              By confirming, <span className="text-foreground font-bold">{studentToDelete?.name}</span>'s profile will be permanently deleted. This action cannot be undone.
            </p>
          </div>
          <div className="bg-secondary/30 p-4 flex gap-3">
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 rounded-xl font-bold h-10 text-sm">Cancel</Button>
            <Button onClick={handleDelete} disabled={isSubmitting} variant="destructive" className="flex-1 rounded-xl font-bold h-10 text-sm shadow-lg shadow-destructive/20">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default memo(StudentsPage);

