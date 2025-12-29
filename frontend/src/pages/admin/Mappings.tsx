import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Plus,
  Trash2,
  Search,
  Link2,
  Loader2,
  X,
  Users,
  BookOpen,
  Building,
  GraduationCap,
  Filter,
  CheckCircle2,
  AlertCircle,
  Mail
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { cn } from '@/lib/utils';

// --- Types ---

interface Mapping {
  id: string;
  facultyId: string;
  facultyName: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  createdAt: string;
}

interface Faculty {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Program {
  id: string;
  name: string;
}

interface Class {
  id: number;
  program: string;
  division: string | null;
  batchYear: number;
}

// --- Sub-components ---

const StatsCard = memo(({ title, value, icon: Icon, colorClass, gradientClass, iconBgClass }: any) => (
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
      <p className={`text-2xl font-black text-${colorClass === 'foreground' ? 'foreground' : colorClass} tracking-tight`}>{value}</p>
    </div>
  </div>
));

StatsCard.displayName = 'StatsCard';

const MobileMappingCard = memo(({
  mapping,
  onDelete,
  getInitials
}: {
  mapping: Mapping;
  onDelete: (m: Mapping) => void;
  getInitials: (name: string) => string;
}) => (
  <div className="glass-card p-5 space-y-5 border-border/30 group">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 shadow-inner",
          mapping.facultyName
            ? "bg-gradient-to-br from-success/20 to-success/5 border-success/20"
            : "bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20"
        )}>
          <span className={cn(
            "text-[11px] font-black tracking-tighter",
            mapping.facultyName ? "text-success" : "text-primary"
          )}>
            {getInitials(mapping.facultyName || "Self Study")}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn(
            "text-[15px] font-bold transition-colors tracking-tight truncate",
            mapping.facultyName ? "text-foreground group-hover:text-primary" : "text-muted-foreground italic"
          )}>
            {mapping.facultyName || "No Instructor (Self Study)"}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest shrink-0">Faculty Expert</span>
            <div className="h-[1px] w-4 bg-muted-foreground/10" />
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-success/10 text-success text-[8px] font-black uppercase tracking-tighter animate-pulse border border-success/20">
              <CheckCircle2 className="w-2.5 h-2.5" /> Synced
            </span>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(mapping)}
        className="w-9 h-9 rounded-xl hover:bg-destructive/10 text-destructive transition-all border border-transparent hover:border-destructive/20 shrink-0"
      >
        <Trash2 className="w-4.5 h-4.5" />
      </Button>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="bg-secondary/20 rounded-2xl p-4 border border-white/5 flex flex-col gap-1.5 shadow-inner min-w-0">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Subject Module</p>
        <p className="text-[13px] font-black text-foreground tracking-tight leading-tight truncate px-0.5">
          {mapping.subjectName}
        </p>
      </div>
      <div className="bg-secondary/20 rounded-2xl p-4 border border-white/5 flex flex-col gap-1.5 shadow-inner min-w-0">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Assigned Class</p>
        <p className="text-[13px] font-black text-foreground tracking-tight leading-tight truncate px-0.5">
          {mapping.className}
        </p>
      </div>
    </div>

    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.2em]">
      <span>Registry Link v1.02</span>
      <span className="text-muted-foreground/60">
        {new Date(mapping.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}
      </span>
    </div>
  </div>
));

const MappingRow = memo(({
  mapping,
  onDelete,
  getInitials
}: {
  mapping: Mapping;
  onDelete: (m: Mapping) => void;
  getInitials: (name: string) => string;
}) => (
  <tr className="group hover:bg-white/5 transition-colors duration-200">
    <td className="py-4 px-6">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center border group-hover:scale-110 transition-transform duration-300 shadow-inner shrink-0",
          mapping.facultyName
            ? "bg-gradient-to-br from-success/20 to-success/5 border-success/20"
            : "bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20"
        )}>
          <span className={cn(
            "text-[11px] font-black tracking-tighter",
            mapping.facultyName ? "text-success" : "text-primary"
          )}>
            {getInitials(mapping.facultyName || "Self Study")}
          </span>
        </div>
        <div className="min-w-0">
          <p className={cn(
            "text-sm font-bold transition-colors tracking-tight truncate max-w-[200px]",
            mapping.facultyName ? "text-foreground group-hover:text-primary" : "text-muted-foreground italic"
          )}>
            {mapping.facultyName || "No Instructor (Self Study)"}
          </p>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.15em] opacity-40">Personnel</p>
        </div>
      </div>
    </td>
    <td className="px-6">
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-sm font-bold text-foreground tracking-tight truncate max-w-[250px]">{mapping.subjectName}</p>
        <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-tighter">Academic Module</p>
      </div>
    </td>
    <td className="px-6">
      <p className="text-[12px] font-bold text-foreground/80 truncate max-w-[200px]" title={mapping.className}>
        {mapping.className}
      </p>
    </td>
    <td className="px-6">
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success border border-success/20 text-[10px] font-black uppercase tracking-wider shadow-sm">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Synced
      </span>
    </td>
    <td className="px-6">
      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(mapping)}
          className="w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all duration-200"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </td>
  </tr>
));

MobileMappingCard.displayName = 'MobileMappingCard';
MappingRow.displayName = 'MappingRow';

// --- Main Component ---

const MappingsPage: React.FC = () => {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpenConfirm, setIsDeleteDialogOpenConfirm] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<Mapping | null>(null);
  const [formData, setFormData] = useState({
    facultyId: '',
    programId: '',
    subjectId: '',
    classId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [mappingsRes, facultyRes, subjectsRes, classesRes, programsRes] = await Promise.all([
        adminAPI.getMappings(),
        adminAPI.getFaculty(),
        adminAPI.getSubjects(),
        adminAPI.getClasses(),
        adminAPI.getPrograms()
      ]);
      setMappings(mappingsRes.data);
      setFaculty(facultyRes.data);
      setSubjects(subjectsRes.data);
      setClasses(classesRes.data);
      setPrograms(programsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Error',
        description: 'Failed to synchronize mapping database.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getInitials = useCallback((name: string) => {
    const parts = name.split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }, []);

  // Filtered classes based on selected program
  const filteredClassesList = useMemo(() => {
    if (!formData.programId) return [];
    const selectedProgram = programs.find(p => String(p.id) === formData.programId); // Use string compare
    if (!selectedProgram) return [];

    return classes.filter(c => c.program === selectedProgram.name);
  }, [formData.programId, classes, programs]);

  const filteredMappings = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return mappings;

    return mappings.filter(
      (m) =>
        m.facultyName.toLowerCase().includes(query) ||
        m.subjectName.toLowerCase().includes(query) ||
        m.className.toLowerCase().includes(query)
    );
  }, [mappings, searchQuery]);

  const stats = useMemo(() => {
    return {
      totalFaculty: faculty.length,
      totalSubjects: subjects.length,
      totalClasses: classes.length
    };
  }, [faculty, subjects, classes]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setFormData({ facultyId: '', programId: '', subjectId: '', classId: '' });
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.subjectId || !formData.classId) {
      toast({
        title: 'Validation Failed',
        description: 'Ensure subject and class are selected.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await adminAPI.createMapping({
        facultyId: formData.facultyId === 'none' ? '' : formData.facultyId,
        subjectId: formData.subjectId,
        classId: formData.classId
      });

      toast({
        title: 'Success',
        description: 'Faculty-Subject linkage established successfully.',
      });
      fetchData();
      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: 'Fault',
        description: error.response?.data?.error || 'Database mapping conflict detected.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMapping) return;

    try {
      setIsSubmitting(true);
      await adminAPI.deleteMapping(selectedMapping.id);
      toast({ title: 'Success', description: 'Faculty mapping removed successfully.' });
      fetchData();
      setIsDeleteDialogOpenConfirm(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to remove mapping.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setSelectedMapping(null);
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
                <Link2 className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
              </div>
              <span className="truncate">Mappings</span>
            </h1>
            <p className="text-[11px] sm:text-[13px] text-muted-foreground ml-1 font-medium opacity-70">Configure faculty assignments and linkages</p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="h-11 sm:h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 rounded-xl px-6 text-sm font-bold w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            Assign Faculty
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-border/30 bg-gradient-to-br from-success/10 to-transparent group hover:shadow-xl hover:shadow-success/5 transition-all duration-500 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-success/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Faculty Pool</p>
                <p className="text-3xl font-black text-foreground tracking-tighter tabular-nums">{stats.totalFaculty}</p>
                <div className="h-1 w-6 bg-success rounded-full" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center border border-success/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                <Users className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-border/30 bg-gradient-to-br from-primary/10 to-transparent group hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Subject Modules</p>
                <p className="text-3xl font-black text-foreground tracking-tighter tabular-nums">{stats.totalSubjects}</p>
                <div className="h-1 w-6 bg-primary rounded-full" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-inner">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-border/30 bg-gradient-to-br from-warning/10 to-transparent group hover:shadow-xl hover:shadow-warning/5 transition-all duration-500 relative overflow-hidden sm:col-span-2 lg:col-span-1">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-warning/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Student Classes</p>
                <p className="text-3xl font-black text-foreground tracking-tighter tabular-nums">{stats.totalClasses}</p>
                <div className="h-1 w-6 bg-warning rounded-full" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-warning/20 flex items-center justify-center border border-warning/20 group-hover:scale-110 transition-all duration-500 shadow-inner">
                <Building className="w-6 h-6 text-warning" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by faculty, subject, or class metadata..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-secondary/30 border-border/50 focus:border-primary/50 rounded-xl transition-all shadow-sm text-sm"
          />
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 glass-card rounded-2xl border-dashed">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-3 opacity-50" />
            <p className="text-[13px] text-muted-foreground font-medium animate-pulse">Syncing linkage database...</p>
          </div>
        ) : filteredMappings.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border-dashed border-primary/20 bg-primary/5">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
              <Link2 className="w-8 h-8 text-primary opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1.5">{searchQuery ? 'No linkages found' : 'No Mappings Established'}</h3>
            <p className="text-[13px] text-muted-foreground max-w-sm mb-8 leading-relaxed">
              {searchQuery ? 'Refine your search parameters or check your active filters.' : 'Your academic matrix is currently empty. Start linking faculty to subjects.'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="gap-2 shadow-xl shadow-primary/20 rounded-xl px-8"
              >
                <Plus className="w-4 h-4" />
                Establish First Linkage
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
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-[30%]">Faculty Member</th>
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Subject Module</th>
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-[20%]">Target Class</th>
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-[120px]">Status</th>
                      <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-[80px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredMappings.map((m) => (
                      <MappingRow
                        key={m.id}
                        mapping={m}
                        onDelete={(m) => { setSelectedMapping(m); setIsDeleteDialogOpenConfirm(true); }}
                        getInitials={getInitials}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-secondary/10 py-3.5 px-6 border-t border-border/50 flex items-center justify-between text-[10px] font-bold text-muted-foreground/40 tracking-[0.25em] uppercase">
                <span>Core Registry Online</span>
                <span>{filteredMappings.length} Active Linkages</span>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredMappings.map((m) => (
                <MobileMappingCard
                  key={m.id}
                  mapping={m}
                  onDelete={(m) => { setSelectedMapping(m); setIsDeleteDialogOpenConfirm(true); }}
                  getInitials={getInitials}
                />
              ))}
              <div className="py-2 text-center text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
                End of Linkage Database
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50 sm:max-w-md rounded-3xl shadow-2xl">
          <DialogHeader className="pt-2 px-1">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                <Plus className="w-4 h-4 text-accent" />
              </div>
              Assign Faculty
            </DialogTitle>
            <DialogDescription className="text-[13px] mt-1">Assign faculty to specific subjects and student cohorts.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-4 px-1">
              {/* Faculty Select */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Faculty Member</Label>
                <Select value={formData.facultyId} onValueChange={(v) => setFormData({ ...formData, facultyId: v })}>
                  <SelectTrigger className="h-10 bg-secondary/50 border-border/50 rounded-xl"><SelectValue placeholder="Select faculty" /></SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 rounded-xl">
                    <SelectItem value="none" className="text-muted-foreground italic font-medium">No Instructor (Self Study / Project)</SelectItem>
                    {faculty.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Select */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Subject Module</Label>
                <Select value={formData.subjectId} onValueChange={(v) => setFormData({ ...formData, subjectId: v })}>
                  <SelectTrigger className="h-10 bg-secondary/50 border-border/50 rounded-xl"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 rounded-xl">
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name} {s.code ? `(${s.code})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Program Select */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Academic Program</Label>
                  <Select value={formData.programId} onValueChange={(v) => setFormData({ ...formData, programId: v, classId: '' })}>
                    <SelectTrigger className="h-10 bg-secondary/50 border-border/50 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 rounded-xl">
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Class Select */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Specific Class</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(v) => setFormData({ ...formData, classId: v })}
                    disabled={!formData.programId}
                  >
                    <SelectTrigger className="h-10 bg-secondary/50 border-border/50 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 rounded-xl max-w-[calc(100vw-4rem)] sm:max-w-[400px]">
                      {filteredClassesList.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)} className="whitespace-normal py-2.5 leading-relaxed">
                          Y{c.batchYear}{c.division ? `-${c.division}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t border-border/20 px-1 gap-2">
              <Button type="button" variant="ghost" onClick={handleCloseDialog} className="rounded-xl font-bold h-10 text-sm">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl font-bold bg-primary hover:bg-primary/90 h-10 text-sm">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Assignment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpenConfirm} onOpenChange={setIsDeleteDialogOpenConfirm}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50 sm:max-w-[380px] rounded-3xl shadow-2xl p-0 overflow-hidden">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-destructive/10 flex items-center justify-center mx-auto mb-4 border border-destructive/20">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2 tracking-tight">Sever Linkage?</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed px-4">
              By confirming, this faculty member will no longer be assigned to <span className="text-foreground font-bold">{selectedMapping?.subjectName}</span>.
            </p>
          </div>
          <div className="bg-secondary/30 p-4 flex gap-3">
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpenConfirm(false)} className="flex-1 rounded-xl font-bold h-10 text-sm">Cancel</Button>
            <Button onClick={handleDelete} disabled={isSubmitting} variant="destructive" className="flex-1 rounded-xl font-bold h-10 text-sm shadow-lg shadow-destructive/20">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Deletion'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default memo(MappingsPage);
