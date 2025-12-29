import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Plus, Pencil, Trash2, Search, Building, Loader2, X, GraduationCap, Users, Layers } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';

// --- Types ---

interface Class {
  id: string;
  program: string;
  division: string;
  batchYear: number;
  isActive: boolean;
  createdAt: string;
  totalStudents: number;
  totalBatches?: number;
}

interface Program {
  id: number;
  name: string;
}

interface Division {
  id: number;
  name: string;
}

interface Batch {
  id: number;
  class_id: number;
  name: string;
  created_at: string;
}

interface FormData {
  programId: string;
  divisionId: string;
  batchYear: number;
  isActive: boolean;
}

// --- Sub-components ---

const StatsCard = memo(({ title, value, subValue, icon: Icon, colorClass, gradientClass, iconBgClass }: any) => (
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
      <div className="flex items-baseline gap-2">
        <p className={`text-2xl font-black text-${colorClass === 'foreground' ? 'foreground' : colorClass} tracking-tight`}>{value}</p>
        {subValue && <p className="text-[10px] font-medium text-muted-foreground">{subValue}</p>}
      </div>
    </div>
  </div>
));

StatsCard.displayName = 'StatsCard';

const MobileClassCard = memo(({ cls, onEdit, onDelete, onManageBatches }: { cls: Class; onEdit: (cls: Class) => void; onDelete: (cls: Class) => void; onManageBatches: (cls: Class) => void }) => (
  <div className="glass-card p-5 space-y-5 border-border/30 group">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black border border-primary/20 uppercase tracking-wider shrink-0 max-w-[180px]">
            <span className="truncate">{cls.program}</span>
          </span>
          {cls.isActive ? (
            <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)] shrink-0" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-black text-foreground tracking-tight">
            Batch {cls.batchYear}
          </h3>
          {cls.division && (
            <span className="text-[11px] font-black text-accent uppercase tracking-widest bg-accent/5 px-2 py-0.5 rounded-md border border-accent/10">
              {cls.division}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onManageBatches(cls)}
          className="w-8 h-8 rounded-lg hover:bg-accent/10 text-accent transition-colors"
        >
          <Layers className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(cls)}
          className="w-8 h-8 rounded-lg hover:bg-success/10 text-success transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(cls)}
          className="w-8 h-8 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-3">
      <div className="bg-secondary/20 rounded-2xl p-3.5 border border-white/5 text-center flex flex-col justify-center gap-1.5 shadow-inner">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Students</p>
        <p className="text-xl font-black text-foreground tracking-tight leading-none">{cls.totalStudents || 0}</p>
      </div>
      <div className="bg-secondary/20 rounded-2xl p-3.5 border border-white/5 text-center flex flex-col justify-center gap-1.5 shadow-inner">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Batches</p>
        <p className="text-xl font-black text-blue-500 tracking-tight leading-none">{cls.totalBatches || 0}</p>
      </div>
      <div className="bg-secondary/20 rounded-2xl p-3.5 border border-white/5 text-center flex flex-col justify-center gap-1.5 shadow-inner">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Status</p>
        <p className={cn(
          "text-[10px] font-black uppercase tracking-widest",
          cls.isActive ? "text-success" : "text-muted-foreground/40"
        )}>
          {cls.isActive ? 'Active' : 'Offline'}
        </p>
      </div>
    </div>

    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.2em]">
      <span>Record Stamped</span>
      <span className="text-muted-foreground/60">
        {new Date(cls.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}
      </span>
    </div>
  </div>
));

const TableRow = memo(({ cls, onEdit, onDelete, onManageBatches }: { cls: Class; onEdit: (cls: Class) => void; onDelete: (cls: Class) => void; onManageBatches: (cls: Class) => void }) => (
  <tr className="group hover:bg-white/5 transition-colors duration-200">
    <td className="py-3 px-6">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-bold border border-primary/20 group-hover:bg-primary/20 transition-all duration-300 max-w-[240px] lg:max-w-[350px]">
              <span className="truncate">{cls.program}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[300px] bg-background/95 backdrop-blur-md border-border/50 text-foreground p-3 shadow-2xl rounded-xl">
            <p className="text-sm font-medium leading-relaxed">{cls.program}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </td>
    <td className="px-6 py-3">
      {cls.division ? (
        <span className="inline-flex items-center px-2 py-1 rounded-md bg-accent/10 text-accent text-[10px] font-black border border-accent/20 shadow-sm tracking-wider">
          {cls.division}
        </span>
      ) : (
        <span className="text-muted-foreground/40 text-[11px] font-medium">—</span>
      )}
    </td>
    <td className="px-6 py-3 font-bold text-foreground tabular-nums tracking-tight text-sm">{cls.batchYear}</td>
    <td className="px-6 py-3">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/40 text-xs font-bold border border-border/50 text-muted-foreground">
        <Users className="w-3 h-3 text-muted-foreground/70" />
        {cls.totalStudents || 0}
      </div>
    </td>
    <td className="px-6 py-3">
      <button
        onClick={() => onManageBatches(cls)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border transition-all duration-200 ${(cls.totalBatches || 0) > 0
          ? 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20'
          : 'bg-secondary/40 text-muted-foreground border-border/50 hover:bg-secondary/60'
          }`}
        title="Manage Batches"
      >
        <Layers className="w-3 h-3" />
        {cls.totalBatches || 0}
      </button>
    </td>
    <td className="px-6 py-3 text-right">
      {cls.isActive ? (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-success/10 text-success border border-success/20 shadow-sm">
          <span className="w-1 h-1 rounded-full bg-success animate-pulse" />
          Active
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-muted text-muted-foreground border border-border shadow-sm">
          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
          Inactive
        </span>
      )}
    </td>
    <td className="px-6 py-3">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onManageBatches(cls)}
          className="w-8 h-8 rounded-lg hover:bg-accent/10 hover:text-accent border border-transparent hover:border-accent/20 transition-all duration-200"
          title="Manage Batches"
        >
          <Layers className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(cls)}
          className="w-8 h-8 rounded-lg hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all duration-200"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(cls)}
          className="w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all duration-200"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </td>
  </tr>
));

MobileClassCard.displayName = 'MobileClassCard';
TableRow.displayName = 'TableRow';

// --- Main Component ---

const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
  const [isDivisionDialogOpen, setIsDivisionDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState<FormData>({
    programId: '',
    divisionId: '',
    batchYear: new Date().getFullYear(),
    isActive: true
  });
  const [programName, setProgramName] = useState('');
  const [divisionName, setDivisionName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [selectedClassForBatches, setSelectedClassForBatches] = useState<Class | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [newBatchName, setNewBatchName] = useState('');
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [classesRes, programsRes, divisionsRes] = await Promise.all([
        adminAPI.getClasses(),
        adminAPI.getPrograms(),
        adminAPI.getDivisions()
      ]);
      setClasses(classesRes.data);
      setPrograms(programsRes.data);
      setDivisions(divisionsRes.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load data.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredClasses = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return classes;
    return classes.filter(cls =>
      cls.program.toLowerCase().includes(query) ||
      cls.division.toLowerCase().includes(query) ||
      cls.batchYear.toString().includes(query)
    );
  }, [classes, searchQuery]);

  const stats = useMemo(() => ({
    total: classes.length,
    active: classes.filter(c => c.isActive).length,
    programCount: programs.length,
    activePrograms: new Set(classes.map(c => c.program)).size
  }), [classes, programs]);

  const handleOpenDialog = useCallback((cls?: Class) => {
    if (cls) {
      setSelectedClass(cls);
      setFormData({
        programId: programs.find(p => p.name === cls.program)?.id.toString() || '',
        divisionId: divisions.find(d => d.name === cls.division)?.id.toString() || '',
        batchYear: cls.batchYear,
        isActive: cls.isActive
      });
    } else {
      setSelectedClass(null);
      setFormData({
        programId: '',
        divisionId: '',
        batchYear: new Date().getFullYear(),
        isActive: true
      });
    }
    setIsDialogOpen(true);
  }, [programs, divisions]);

  const handleManageBatches = async (cls: Class) => {
    setSelectedClassForBatches(cls);
    setIsBatchDialogOpen(true);
    setBatches([]);
    try {
      const res = await adminAPI.getBatches(cls.id);
      setBatches(res.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch batches.', variant: 'destructive' });
    }
  };

  const handleCreateBatch = async () => {
    if (!selectedClassForBatches || !newBatchName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await adminAPI.createBatch(selectedClassForBatches.id, newBatchName);
      setBatches(prev => [...prev, res.data]);
      setNewBatchName('');
      toast({ title: 'Success', description: 'Batch created.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create batch.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBatch = async (id: number) => {
    try {
      await adminAPI.deleteBatch(id.toString());
      setBatches(prev => prev.filter(b => b.id !== id));
      toast({ title: 'Success', description: 'Batch deleted.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'Delete failed.', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.programId) return toast({ title: 'Error', description: 'Select a program.', variant: 'destructive' });

    setIsSubmitting(true);
    try {
      const payload = {
        programId: parseInt(formData.programId),
        divisionId: formData.divisionId ? parseInt(formData.divisionId) : null,
        batchYear: formData.batchYear,
        isActive: formData.isActive
      };

      if (selectedClass) {
        await adminAPI.updateClass(selectedClass.id, payload);
        const program = programs.find(p => p.id.toString() === formData.programId);
        const division = divisions.find(d => d.id.toString() === formData.divisionId);
        setClasses(prev => prev.map(c => c.id === selectedClass.id ? {
          ...c,
          program: program?.name || '',
          division: division?.name || '',
          batchYear: formData.batchYear,
          isActive: formData.isActive
        } : c));
        toast({ title: 'Success', description: 'Class updated.' });
      } else {
        const res = await adminAPI.createClass(payload);
        const program = programs.find(p => p.id.toString() === formData.programId);
        const division = divisions.find(d => d.id.toString() === formData.divisionId);
        const newClass = res.data || {
          id: Date.now().toString(),
          program: program?.name || '',
          division: division?.name || '',
          batchYear: formData.batchYear,
          isActive: formData.isActive,
          createdAt: new Date().toISOString()
        };
        setClasses(prev => [newClass, ...prev]);
        toast({ title: 'Success', description: 'Class created.' });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClass) return;
    try {
      await adminAPI.deleteClass(selectedClass.id);
      setClasses(prev => prev.filter(c => c.id !== selectedClass.id));
      toast({ title: 'Success', description: 'Class deleted.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Delete failed.', variant: 'destructive' });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedClass(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5 tracking-tight">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20 shadow-sm shrink-0">
                <Building className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
              </div>
              <span className="truncate">Classes</span>
            </h1>
            <p className="text-[11px] sm:text-[13px] text-muted-foreground ml-1 opacity-70">Manage academic programs and divisions</p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="h-11 sm:h-10 gap-2 bg-success hover:bg-success/90 text-success-foreground shadow-lg shadow-success/20 hover:shadow-xl hover:shadow-success/30 transition-all duration-300 rounded-xl px-6 text-sm font-bold w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Class
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            title="Total Classes"
            value={stats.total}
            icon={Building}
            colorClass="primary"
            gradientClass="bg-gradient-to-br from-primary/5 to-transparent"
            iconBgClass="bg-primary/10"
          />
          <StatsCard
            title="Active Classes"
            value={stats.active}
            icon={Building}
            colorClass="success"
            gradientClass="bg-gradient-to-br from-success/5 to-transparent"
            iconBgClass="bg-success/10"
          />
          <StatsCard
            title="Programs"
            value={stats.programCount}
            subValue={`(${stats.activePrograms} In Use)`}
            icon={GraduationCap}
            colorClass="accent"
            gradientClass="bg-gradient-to-br from-accent/5 to-transparent"
            iconBgClass="bg-accent/10"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-secondary/30 border-border/50 focus:border-primary/50 rounded-xl transition-all shadow-sm text-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Table/Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 glass-card rounded-2xl border-dashed">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-3 opacity-50" />
            <p className="text-[13px] text-muted-foreground font-medium animate-pulse">Fetching class data...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-accent/5 flex items-center justify-center mb-5">
              <Building className="w-8 h-8 text-accent/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1.5">No matching classes</h3>
            <p className="text-[13px] text-muted-foreground max-w-sm mb-6">
              Adjust your search or add a new class to get started.
            </p>
            {!searchQuery && (
              <Button onClick={() => handleOpenDialog()} className="h-9 px-6 rounded-lg font-bold gap-2 text-sm">
                <Plus className="w-4 h-4" /> Add Class
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block glass-card overflow-hidden rounded-2xl border-border/50 shadow-xl bg-background/50 backdrop-blur-sm">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-secondary/20">
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 focus:outline-none">Program</th>
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 font-black">Division</th>
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-[120px]">Batch Year</th>
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-[100px]">Students</th>
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-[100px]">Batches</th>
                      <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-[100px]">Status</th>
                      <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-[150px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredClasses.map(cls => (
                      <TableRow
                        key={cls.id}
                        cls={cls}
                        onEdit={handleOpenDialog}
                        onDelete={(c) => { setSelectedClass(c); setIsDeleteDialogOpen(true); }}
                        onManageBatches={handleManageBatches}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-secondary/10 py-3.5 px-6 border-t border-border/50 flex items-center justify-between text-[10px] font-bold text-muted-foreground/50 tracking-widest uppercase">
                <span>Total: {filteredClasses.length} Active Records</span>
                <span className="text-[9px] bg-secondary/30 px-2 py-0.5 rounded-md border border-border/50">Core System v1.1.2</span>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredClasses.map(cls => (
                <MobileClassCard
                  key={cls.id}
                  cls={cls}
                  onEdit={handleOpenDialog}
                  onDelete={(c) => { setSelectedClass(c); setIsDeleteDialogOpen(true); }}
                  onManageBatches={handleManageBatches}
                />
              ))}
              <div className="py-2 text-center text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
                End of Academic Inventory
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- Dialogs --- */}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50 sm:max-w-md rounded-3xl shadow-2xl">
          <DialogHeader className="pt-2 px-1">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              {selectedClass ? 'Update Class' : 'New Class'}
            </DialogTitle>
            <DialogDescription className="text-[13px] mt-1">
              Set up a new cohort or update existing details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="space-y-4 px-1">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Program Curricula</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsProgramDialogOpen(true)} className="h-5 text-[9px] font-black uppercase tracking-wider gap-1 hover:bg-primary/10 hover:text-primary">
                    <Plus className="w-2.5 h-2.5" /> Add New
                  </Button>
                </div>
                <Select value={formData.programId} onValueChange={v => setFormData(f => ({ ...f, programId: v }))}>
                  <SelectTrigger className="h-10 bg-secondary/50 border-border/50 rounded-xl text-sm">
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 backdrop-blur-xl">
                    {programs.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Class Division</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsDivisionDialogOpen(true)} className="h-5 text-[9px] font-black uppercase tracking-wider gap-1 hover:bg-accent/10 hover:text-accent">
                    <Plus className="w-2.5 h-2.5" /> Add New
                  </Button>
                </div>
                <Select value={formData.divisionId || 'none'} onValueChange={v => setFormData(f => ({ ...f, divisionId: v === 'none' ? '' : v }))}>
                  <SelectTrigger className="h-10 bg-secondary/50 border-border/50 rounded-xl text-sm">
                    <SelectValue placeholder="Standard Division (Optional)" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 backdrop-blur-xl">
                    <SelectItem value="none">None / Individual</SelectItem>
                    {divisions.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Batch Year</Label>
                  <Input
                    type="number"
                    value={formData.batchYear}
                    onChange={e => setFormData(f => ({ ...f, batchYear: parseInt(e.target.value) || 2024 }))}
                    className="h-10 bg-secondary/50 border-border/50 rounded-xl tabular-nums text-sm"
                  />
                </div>
                <div className="space-y-1.5 flex flex-col justify-end">
                  <div className="h-10 flex items-center justify-between px-3 bg-secondary/30 border border-border/50 rounded-xl">
                    <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Active</span>
                    <Switch checked={formData.isActive} onCheckedChange={c => setFormData(f => ({ ...f, isActive: c }))} className="scale-75 origin-right" />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t border-border/20 px-1 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold h-10 text-sm">Discard</Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all h-10 text-sm">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (selectedClass ? 'Update' : 'Confirm')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog for Program Creation */}
      <Dialog open={isProgramDialogOpen} onOpenChange={setIsProgramDialogOpen}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50 sm:max-w-xs rounded-2xl p-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight">New Program</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground text-center block">Unique Identifier</Label>
              <Input
                placeholder="E.G. BTECH-CSE"
                value={programName}
                onChange={e => setProgramName(e.target.value.toUpperCase())}
                className="h-10 text-center font-bold tracking-widest bg-secondary/50 rounded-xl border-border/50 focus:border-primary shadow-inner text-sm"
              />
            </div>
            <Button
              onClick={async () => {
                if (!programName.trim()) return;
                setIsSubmitting(true);
                try {
                  await adminAPI.createProgram({ name: programName });
                  const res = await adminAPI.getPrograms();
                  setPrograms(res.data);
                  setIsProgramDialogOpen(false);
                  setProgramName('');
                } finally { setIsSubmitting(false); }
              }}
              disabled={isSubmitting}
              className="w-full h-10 rounded-xl font-black bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20 text-xs"
            >
              FINALIZE
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for Division Creation */}
      <Dialog open={isDivisionDialogOpen} onOpenChange={setIsDivisionDialogOpen}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50 sm:max-w-xs rounded-2xl p-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-center">New Division</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="E.G. SEC-A"
              value={divisionName}
              onChange={e => setDivisionName(e.target.value.toUpperCase())}
              className="h-10 text-center font-black tracking-widest bg-secondary/50 rounded-xl text-sm"
            />
            <Button
              onClick={async () => {
                if (!divisionName.trim()) return;
                setIsSubmitting(true);
                try {
                  await adminAPI.createDivision({ name: divisionName });
                  const res = await adminAPI.getDivisions();
                  setDivisions(res.data);
                  setIsDivisionDialogOpen(false);
                  setDivisionName('');
                } finally { setIsSubmitting(false); }
              }}
              disabled={isSubmitting}
              className="w-full h-10 rounded-xl font-black bg-accent/20 text-accent hover:bg-accent/30 border border-accent/20 text-xs"
            >
              ADD DIVISION
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for Batch Management */}
      <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50 sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                <Layers className="w-4 h-4 text-accent" />
              </div>
              Manage Batches
            </DialogTitle>
            <DialogDescription className="text-[13px] mt-1">
              Create student subgroups for Class {selectedClassForBatches?.program || ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            {/* Create New */}
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">New Batch Name</Label>
                <Input
                  placeholder="E.G. Batch A"
                  value={newBatchName}
                  onChange={e => setNewBatchName(e.target.value)}
                  className="h-9 bg-secondary/50 rounded-xl border-border/50 text-sm"
                />
              </div>
              <Button
                onClick={handleCreateBatch}
                disabled={isSubmitting || !newBatchName.trim()}
                className="h-9 rounded-xl font-bold bg-primary hover:bg-primary/90 text-sm px-4"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>

            {/* List */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Existing Batches</Label>
              <div className="bg-secondary/20 rounded-xl border border-border/50 overflow-hidden max-h-[200px] overflow-y-auto">
                {batches.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground italic">No batches created yet.</div>
                ) : (
                  batches.map(batch => (
                    <div key={batch.id} className="flex items-center justify-between p-3 border-b border-border/50 last:border-0 hover:bg-secondary/40 transition-colors">
                      <span className="text-sm font-semibold">{batch.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBatch(batch.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Prompt */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50 rounded-3xl shadow-2xl p-6">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-3 mx-auto border border-destructive/20">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl font-black text-center tracking-tight">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[13px] mt-1">
              This will permanently remove the class profile for <br />
              <span className="font-black text-foreground mt-2 block p-2 bg-secondary/30 rounded-lg border border-border/50">
                {selectedClass?.program} - Batch {selectedClass?.batchYear}
                {selectedClass?.division && ` (${selectedClass.division})`}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl font-bold h-10 text-sm px-6">Discard</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-white rounded-xl font-black h-10 text-sm px-6 shadow-lg shadow-destructive/20">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default ClassesPage;
