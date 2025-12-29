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
  Trash2,
  Upload,
  FileSpreadsheet
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
import * as XLSX from 'xlsx';

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
  isSelected,
  onToggleSelect,
  onToggle,
  onEdit,
  onDelete,
  getInitials,
  getAttendanceColor,
  getBatchColor
}: {
  student: Student;
  isSelected: boolean;
  onToggleSelect: () => void;
  onToggle: (s: Student) => void;
  onEdit: (s: Student) => void;
  onDelete: (s: Student) => void;
  getInitials: (name: string) => string;
  getAttendanceColor: (att?: number, total?: number) => string;
  getBatchColor: (batchName: string) => { bg: string; text: string; border: string };
}) => (
  <tr className="group hover:bg-white/5 transition-colors duration-200">
    <td className="py-3 px-6">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        className="w-4 h-4 rounded border-border/50 text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer"
      />
    </td>
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
      {student.batchName ? (() => {
        const color = getBatchColor(student.batchName);
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-md ${color.bg} ${color.text} text-[10px] font-black border ${color.border} shadow-sm`}>
            {student.batchName}
          </span>
        );
      })() : (
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
  const [filterBatch, setFilterBatch] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', rollNo: '', classId: '', batchId: '' });
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkStudents, setBulkStudents] = useState('');
  const [bulkPassword, setBulkPassword] = useState('0123456789');
  const [bulkClassId, setBulkClassId] = useState('');
  const [bulkBatchId, setBulkBatchId] = useState('');
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, status: '' });
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
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
      const classId = formData.classId || bulkClassId;
      if (!classId) {
        setBatches([]);
        return;
      }
      try {
        const res = await adminAPI.getBatches(classId);
        setBatches(res.data);
      } catch (error) {
        console.error(error);
        setBatches([]);
      }
    };
    if (isDialogOpen || isBulkDialogOpen) {
      fetchBatches();
    }
  }, [formData.classId, bulkClassId, isDialogOpen, isBulkDialogOpen]);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return students.filter((s) => {
      const matchesSearch = !query ||
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.rollNumber.toLowerCase().includes(query);
      const matchesClass = filterClass === 'all' || String(s.classId) === filterClass;
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && s.isActive) ||
        (filterStatus === 'inactive' && !s.isActive);
      const matchesBatch = filterBatch === 'all' ||
        (filterBatch === 'no-batch' && !s.batchName) ||
        s.batchName === filterBatch;
      return matchesSearch && matchesClass && matchesStatus && matchesBatch;
    }).sort((a, b) => {
      // Sort by roll number (numeric comparison)
      const rollA = parseInt(a.rollNumber) || 0;
      const rollB = parseInt(b.rollNumber) || 0;
      return rollA - rollB;
    });
  }, [students, searchQuery, filterClass, filterStatus, filterBatch]);

  // Get unique batches from all students
  const uniqueBatches = useMemo(() => {
    const batchSet = new Set<string>();
    students.forEach(s => {
      if (s.batchName) {
        batchSet.add(s.batchName);
      }
    });
    return Array.from(batchSet).sort();
  }, [students]);

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

  const getBatchColor = useCallback((batchName: string) => {
    // Generate consistent color based on batch name
    const colors = [
      { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
      { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
      { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' },
      { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' },
      { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/20' },
      { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20' },
      { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20' },
      { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20' },
      { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20' },
      { bg: 'bg-teal-500/10', text: 'text-teal-500', border: 'border-teal-500/20' },
    ];

    // Simple hash function to get consistent color for same batch name
    let hash = 0;
    for (let i = 0; i < batchName.length; i++) {
      hash = batchName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
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
      setFormData({ name: '', email: '', password: '0123456789', rollNo: '', classId: '', batchId: '' });
      setEditingStudent(null);
    } catch (error: any) {
      toast({ title: 'Fault', description: error.response?.data?.error || 'Database sync failed.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkStudents.trim() || !bulkPassword.trim() || !bulkClassId) {
      toast({ title: 'Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }

    // Parse CSV format: name, email, rollNo, batchName (optional)
    const lines = bulkStudents.trim().split('\n').filter(line => line.trim());
    const studentsToAdd = lines.map(line => {
      const parts = line.split(',').map(s => s.trim());
      const [name, email, rollNo, batchName] = parts;
      return { name, email, rollNo, batchName: batchName || '' };
    }).filter(s => s.name && s.email && s.rollNo);

    if (studentsToAdd.length === 0) {
      toast({ title: 'Error', description: 'No valid students found. Format: Name, Email, RollNo, Batch (optional)', variant: 'destructive' });
      return;
    }

    // Fetch all batches for the selected class to match batch names
    let classBatches: Batch[] = [];
    try {
      const res = await adminAPI.getBatches(bulkClassId);
      classBatches = res.data;
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    }

    setIsSubmitting(true);
    setBulkProgress({ current: 0, total: studentsToAdd.length, status: 'Starting...' });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < studentsToAdd.length; i++) {
      const student = studentsToAdd[i];
      setBulkProgress({
        current: i + 1,
        total: studentsToAdd.length,
        status: `Adding ${student.name}...`
      });

      try {
        const res = await adminAPI.createStudent({
          name: student.name,
          email: student.email,
          password: bulkPassword,
          rollNo: Number(student.rollNo),
          classId: bulkClassId
        });

        // Assign batch if specified and found
        if (res.data.id && student.batchName) {
          const batch = classBatches.find(b =>
            b.name.toLowerCase() === student.batchName.toLowerCase()
          );
          if (batch) {
            await adminAPI.assignStudentBatch(res.data.id, String(batch.id));
          }
        }

        successCount++;

        // Small delay to prevent overwhelming the server and allow emails to send
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        failCount++;
        console.error(`Failed to add ${student.name}:`, error);
      }
    }

    setIsSubmitting(false);
    setBulkProgress({ current: 0, total: 0, status: '' });

    toast({
      title: 'Bulk Upload Complete',
      description: `Successfully added ${successCount} students. ${failCount > 0 ? `Failed: ${failCount}` : ''}`
    });

    if (successCount > 0) {
      fetchData();
      setIsBulkDialogOpen(false);
      setBulkStudents('');
      setBulkPassword('0123456789');
      setBulkClassId('');
      setBulkBatchId('');
    }
  };

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as any[];

        if (jsonData.length === 0) {
          toast({
            title: 'No Data Found',
            description: 'The Excel file appears to be empty.',
            variant: 'destructive'
          });
          return;
        }

        // Smart column detection - find Name, Email, and RollNo columns
        const firstRow = jsonData[0];
        const headers = Object.keys(firstRow);

        // Detect Name column (look for: name, student name, full name, etc.)
        const nameCol = headers.find(h =>
          /^(name|student.*name|full.*name|student)$/i.test(h.toString().trim())
        ) || headers[0]; // Default to first column

        // Detect Email column (look for: email, mail, e-mail, etc.)
        const emailCol = headers.find(h =>
          /^(email|e-mail|mail|student.*email)$/i.test(h.toString().trim())
        ) || headers[1]; // Default to second column

        // Detect Roll Number column (look for: roll, rollno, roll number, id, student id, etc.)
        const rollCol = headers.find(h =>
          /^(roll|rollno|roll.*no|roll.*number|id|student.*id|enrollment|enroll.*no)$/i.test(h.toString().trim())
        ) || headers[2]; // Default to third column

        // Detect Batch column (optional - look for: batch, group, section, etc.)
        const batchCol = headers.find(h =>
          /^(batch|group|section|practical.*batch)$/i.test(h.toString().trim())
        ) || headers[3]; // Default to fourth column if exists

        // Extract and format data
        const formattedStudents = jsonData
          .map(row => {
            const name = String(row[nameCol] || '').trim();
            const email = String(row[emailCol] || '').trim().toLowerCase();
            const rollNo = String(row[rollCol] || '').trim();
            const batch = batchCol ? String(row[batchCol] || '').trim() : '';

            // Validate email format (basic check)
            const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

            return { name, email, rollNo, batch, isValid: name && isValidEmail && rollNo };
          })
          .filter(student => student.isValid)
          .map(student => `${student.name}, ${student.email}, ${student.rollNo}${student.batch ? ', ' + student.batch : ''}`)
          .join('\n');

        if (formattedStudents) {
          setBulkStudents(formattedStudents);
          const count = formattedStudents.split('\n').length;
          toast({
            title: 'Excel Imported Successfully',
            description: `Imported ${count} student${count > 1 ? 's' : ''} from Excel file. Auto-detected columns: ${nameCol}, ${emailCol}, ${rollCol}.`
          });
        } else {
          toast({
            title: 'No Valid Data Found',
            description: 'Could not find valid student data. Please ensure your Excel has Name, Email, and Roll Number columns.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error reading Excel file:', error);
        toast({
          title: 'Import Failed',
          description: 'Failed to read Excel file. Please check the format.',
          variant: 'destructive'
        });
      }
    };

    reader.readAsBinaryString(file);

    // Reset input so same file can be uploaded again
    event.target.value = '';
  };

  const downloadTemplate = () => {
    // Create sample data
    const templateData = [
      ['Name', 'Email', 'Roll No', 'Batch'],
      ['John Doe', 'john.doe@example.com', '101', 'Batch A'],
      ['Jane Smith', 'jane.smith@example.com', '102', 'Batch B'],
      ['Bob Johnson', 'bob.johnson@example.com', '103', ''],
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Name
      { wch: 30 }, // Email
      { wch: 10 }, // Roll No
      { wch: 15 }, // Batch
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `student_import_template_${date}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);

    toast({
      title: 'Template Downloaded',
      description: 'Fill in the template with your student data and import it back.'
    });
  };

  const toggleStudentSelection = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.size === 0) return;

    setIsSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    for (const studentId of selectedStudents) {
      try {
        await adminAPI.deleteStudent(studentId);
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to delete student ${studentId}:`, error);
      }
    }

    setIsSubmitting(false);
    setIsBulkDeleteDialogOpen(false);
    setSelectedStudents(new Set());

    toast({
      title: 'Bulk Delete Complete',
      description: `Successfully deleted ${successCount} student${successCount > 1 ? 's' : ''}. ${failCount > 0 ? `Failed: ${failCount}` : ''}`
    });

    if (successCount > 0) {
      fetchData();
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
          <div className="flex gap-2">
            {selectedStudents.size > 0 && (
              <Button
                variant="destructive"
                onClick={() => setIsBulkDeleteDialogOpen(true)}
                className="h-9 gap-2 rounded-lg px-4 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedStudents.size})
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setBulkStudents('');
                setBulkPassword('0123456789');
                setBulkClassId('');
                setBulkBatchId('');
                setIsBulkDialogOpen(true);
              }}
              className="h-9 gap-2 rounded-lg px-4 text-sm border-primary/30 hover:bg-primary/5"
            >
              <Upload className="w-4 h-4" />
              <span className="font-bold">Bulk Upload</span>
            </Button>
            <Button
              onClick={() => {
                setEditingStudent(null);
                setFormData({ name: '', email: '', password: '0123456789', rollNo: '', classId: '', batchId: '' });
                setIsDialogOpen(true);
              }}
              className="h-9 gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 rounded-lg px-6 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="font-bold">Add Student</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Students" value={students.length} icon={GraduationCap} colorClass="primary" gradientClass="bg-gradient-to-br from-primary/5 to-transparent" iconBgClass="bg-primary/10" />
          <StatsCard title="Active Students" value={stats.activeStudents} icon={UserCheck} colorClass="success" gradientClass="bg-gradient-to-br from-success/5 to-transparent" iconBgClass="bg-success/10" />
          <StatsCard title="Avg Attendance" value={stats.avgAttendance} icon={TrendingUp} colorClass="accent" gradientClass="bg-gradient-to-br from-accent/5 to-transparent" iconBgClass="bg-accent/10" suffix="%" />
          <StatsCard title="Defaulters" value={stats.defaulters} icon={TrendingDown} colorClass="destructive" gradientClass="bg-gradient-to-br from-destructive/5 to-transparent" iconBgClass="bg-destructive/10" />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
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
          <Select value={filterBatch} onValueChange={setFilterBatch}>
            <SelectTrigger className="h-9 bg-secondary/30 border-border/50 rounded-xl text-[12px] font-bold">
              <div className="flex items-center gap-2">
                <Filter className="w-3 h-3 opacity-50" />
                <SelectValue placeholder="All Batches" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 rounded-xl">
              <SelectItem value="all" className="font-bold">All Batches</SelectItem>
              <SelectItem value="no-batch" className="italic text-muted-foreground">No Batch Assigned</SelectItem>
              {uniqueBatches.map((batch) => {
                const color = getBatchColor(batch);
                return (
                  <SelectItem key={batch} value={batch}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${color.bg.replace('/10', '')}`}></span>
                      {batch}
                    </div>
                  </SelectItem>
                );
              })}
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
            {(searchQuery || filterClass !== 'all' || filterStatus !== 'all' || filterBatch !== 'all') && (
              <Button
                variant="outline"
                onClick={() => { setSearchQuery(''); setFilterClass('all'); setFilterStatus('all'); setFilterBatch('all'); }}
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
                    <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
                      <input
                        type="checkbox"
                        checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-border/50 text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer"
                      />
                    </th>
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
                      isSelected={selectedStudents.has(s.id)}
                      onToggleSelect={() => toggleStudentSelection(s.id)}
                      onToggle={handleToggleStatus}
                      onEdit={handleEdit}
                      onDelete={handleDeletePrompt}
                      getInitials={getInitials}
                      getAttendanceColor={getAttendanceColor}
                      getBatchColor={getBatchColor}
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

      {/* Bulk Upload Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50 sm:max-w-2xl rounded-3xl shadow-2xl">
          <DialogHeader className="pt-2 px-1">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Upload className="w-4 h-4 text-primary" />
              </div>
              Bulk Student Upload
            </DialogTitle>
            <DialogDescription className="text-[13px] mt-1">
              Add multiple students at once. Emails will be sent automatically to each student.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-4 px-1">
            {/* Instructions */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-[11px] font-black text-foreground uppercase tracking-wider">Import Options</p>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    <strong>Manual Entry:</strong> Enter one student per line in format: <code className="bg-secondary px-1.5 py-0.5 rounded text-[11px] font-mono">Name, Email, RollNo, Batch</code>
                  </p>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    <strong>Excel Import:</strong> Download the template, fill it with student data (including batch names), then click "Import Excel" to upload
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 italic">
                    Example: John Doe, john@edu.com, 101, Batch A (Batch is optional)
                  </p>
                </div>
              </div>
            </div>

            {/* Student List Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Student List</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                    className="h-7 px-3 text-[10px] font-black uppercase tracking-wider gap-1.5 border-success/30 text-success hover:bg-success/10"
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    Download Template
                  </Button>
                  <input
                    type="file"
                    id="excel-upload"
                    accept=".xlsx,.xls"
                    onChange={handleExcelUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('excel-upload')?.click()}
                    className="h-7 px-3 text-[10px] font-black uppercase tracking-wider gap-1.5"
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    Import Excel
                  </Button>
                </div>
              </div>
              <textarea
                placeholder="John Doe, john@edu.com, 101, Batch A&#10;Jane Smith, jane@edu.com, 102, Batch B&#10;Bob Johnson, bob@edu.com, 103&#10;..."
                value={bulkStudents}
                onChange={(e) => setBulkStudents(e.target.value)}
                className="w-full h-40 px-3 py-2 bg-secondary/50 border border-border/50 rounded-xl text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Default Password</Label>
                <Input
                  type="text"
                  placeholder="Password for all students"
                  value={bulkPassword}
                  onChange={(e) => setBulkPassword(e.target.value)}
                  className="h-10 bg-secondary/50 border-border/50 rounded-xl"
                  required
                />
              </div>

              {/* Class */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Academic Class</Label>
                <Select value={bulkClassId} onValueChange={setBulkClassId}>
                  <SelectTrigger className="h-10 bg-secondary/50 border-border/50 rounded-xl">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
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

            {/* Progress Indicator */}
            {bulkProgress.total > 0 && (
              <div className="bg-secondary/30 border border-border/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black text-foreground uppercase tracking-wider">
                    Progress: {bulkProgress.current} / {bulkProgress.total}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">{Math.round((bulkProgress.current / bulkProgress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {bulkProgress.status}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-border/20 px-1 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsBulkDialogOpen(false)}
              disabled={isSubmitting}
              className="rounded-xl font-bold h-10 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpload}
              disabled={isSubmitting || !bulkStudents.trim() || !bulkPassword.trim() || !bulkClassId}
              className="flex-1 rounded-xl font-bold bg-primary hover:bg-primary/90 h-10 text-sm"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              {isSubmitting ? 'Uploading...' : 'Upload Students'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50 sm:max-w-[420px] rounded-3xl shadow-2xl p-0 overflow-hidden">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-destructive/10 flex items-center justify-center mx-auto mb-4 border border-destructive/20">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2 tracking-tight">Delete {selectedStudents.size} Students?</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed px-4">
              This will permanently delete <span className="text-foreground font-bold">{selectedStudents.size} student{selectedStudents.size > 1 ? 's' : ''}</span> from the database. This action cannot be undone.
            </p>
          </div>
          <div className="bg-secondary/30 p-4 flex gap-3">
            <Button variant="ghost" onClick={() => setIsBulkDeleteDialogOpen(false)} disabled={isSubmitting} className="flex-1 rounded-xl font-bold h-10 text-sm">Cancel</Button>
            <Button onClick={handleBulkDelete} disabled={isSubmitting} variant="destructive" className="flex-1 rounded-xl font-bold h-10 text-sm shadow-lg shadow-destructive/20">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default memo(StudentsPage);
