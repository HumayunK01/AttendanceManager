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
    <td className="py-3 px-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center border border-success/20 group-hover:scale-110 transition-transform duration-300 shadow-inner">
          <span className="text-[11px] font-black text-success tracking-tighter">
            {getInitials(mapping.facultyName)}
          </span>
        </div>
        <div>
          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
            {mapping.facultyName}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-60">Professor</p>
        </div>
      </div>
    </td>
    <td className="px-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-bold text-foreground tracking-tight">{mapping.subjectName}</p>
      </div>
    </td>
    <td className="px-6">
      <p className="text-[12px] font-medium text-muted-foreground md:max-w-[250px] lg:max-w-[400px] truncate md:whitespace-normal" title={mapping.className}>
        {mapping.className}
      </p>
    </td>
    <td className="px-6">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10 text-success border border-success/20 text-[10px] font-black uppercase tracking-wider">
        <CheckCircle2 className="w-3 h-3" />
        Synced
      </span>
    </td>
    <td className="px-6">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(mapping)}
          className="w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all duration-200"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </td>
  </tr>
));

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

    if (!formData.facultyId || !formData.subjectId || !formData.classId) {
      toast({
        title: 'Validation Failed',
        description: 'Ensure faculty, subject, and class are all selected.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await adminAPI.createMapping({
        facultyId: formData.facultyId,
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
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5 tracking-tight">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                <Link2 className="w-5 h-5 text-accent" />
              </div>
              Course Mappings
            </h1>
            <p className="text-[13px] text-muted-foreground ml-1">Configure faculty assignments and curriculum linkages</p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="h-9 gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 rounded-lg px-6 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="font-bold">Create Linkage</span>
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard title="Faculty" value={stats.totalFaculty} icon={Users} colorClass="success" gradientClass="bg-success/5" iconBgClass="bg-success/10" />
          <StatsCard title="Subjects" value={stats.totalSubjects} icon={BookOpen} colorClass="primary" gradientClass="bg-primary/5" iconBgClass="bg-primary/10" />
          <StatsCard title="Classes" value={stats.totalClasses} icon={Building} colorClass="warning" gradientClass="bg-warning/5" iconBgClass="bg-warning/10" />
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by faculty, subject, or class metadata..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-secondary/30 border-border/50 focus:border-primary/50 rounded-xl transition-all shadow-sm text-sm"
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
          <div className="glass-card overflow-hidden rounded-2xl border-border/50 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/20">
                    <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Faculty Member</th>
                    <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Subject Module</th>
                    <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Target Class</th>
                    <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Status</th>
                    <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Action</th>
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
          </div>
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
              Establish Linkage
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
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Linkage'}
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
