import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  BookOpen,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Network,
  Users
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
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';

// --- Types ---

interface SubjectClass {
  id: number;
  program: string;
  division: string | null;
  batchYear: number;
}

interface Subject {
  id: string;
  name: string;
  createdAt: string;
  classes: SubjectClass[];
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

const MobileSubjectCard = memo(({ subject, onEdit, onDelete, onAssign }: { subject: Subject; onEdit: (s: Subject) => void; onDelete: (s: Subject) => void; onAssign: (s: Subject) => void }) => (
  <div className="glass-card p-4 space-y-4 border-border/30 group">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shrink-0 shadow-inner">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors tracking-tight truncate">
            {subject.name}
          </p>
          <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest opacity-60 truncate">Academic Subject</p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAssign(subject)}
          className="w-8 h-8 rounded-lg hover:bg-accent/10 text-accent p-0"
        >
          <Network className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(subject)}
          className="w-8 h-8 rounded-lg hover:bg-primary/10 text-primary p-0"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(subject)}
          className="w-8 h-8 rounded-lg hover:bg-destructive/10 text-destructive p-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>

    <div className="space-y-2.5">
      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Assigned Classes</p>
      <div className="flex flex-wrap gap-1.5">
        {subject.classes && subject.classes.length > 0 ? (
          subject.classes.map((c, i) => (
            <div key={`${c.id}-${i}`} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50 border border-border/50 text-[10px] font-bold text-muted-foreground">
              <Users className="w-3 h-3 opacity-50" />
              {c.program} Y{c.batchYear}{c.division ? `-${c.division}` : ''}
            </div>
          ))
        ) : (
          <span className="text-[10px] text-muted-foreground/40 italic">No classes assigned</span>
        )}
      </div>
    </div>

    <div className="pt-3 border-t border-border/20 flex items-center justify-between text-[10px] text-muted-foreground font-medium">
      <span className="uppercase tracking-widest text-[9px] opacity-40">Created At</span>
      <span>
        {new Date(subject.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </span>
    </div>
  </div>
));

const TableRow = memo(({ subject, onEdit, onDelete, onAssign }: { subject: Subject; onEdit: (s: Subject) => void; onDelete: (s: Subject) => void; onAssign: (s: Subject) => void }) => (
  <tr className="group hover:bg-white/5 transition-colors duration-200">
    <td className="py-3 px-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-300 shadow-inner">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
            {subject.name}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">Academic Subject</p>
        </div>
      </div>
    </td>
    <td className="px-6 py-3">
      <div className="flex flex-wrap gap-1.5 max-w-[400px]">
        {subject.classes && subject.classes.length > 0 ? (
          subject.classes.map((c, i) => (
            <div key={`${c.id}-${i}`} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50 border border-border/50 text-[10px] font-bold text-muted-foreground whitespace-nowrap">
              <Users className="w-3 h-3 opacity-50" />
              {c.program} Y{c.batchYear}{c.division ? `-${c.division}` : ''}
            </div>
          ))
        ) : (
          <span className="text-[11px] text-muted-foreground/40 italic">Not Assigned</span>
        )}
      </div>
    </td>
    <td className="px-6 py-3 text-muted-foreground text-[12px] font-medium tracking-tight whitespace-nowrap">
      {new Date(subject.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })}
    </td>
    <td className="px-6 py-3">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onAssign(subject)}
          title="Assign to Class"
          className="w-8 h-8 rounded-lg hover:bg-accent/10 hover:text-accent border border-transparent hover:border-accent/20 transition-all duration-200"
        >
          <Network className="w-3.5 h-3.5" />
        </Button>
        <div className="w-[1px] h-4 bg-border/50 mx-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(subject)}
          className="w-8 h-8 rounded-lg hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all duration-200"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(subject)}
          className="w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all duration-200"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </td>
  </tr>
));

MobileSubjectCard.displayName = 'MobileSubjectCard';
TableRow.displayName = 'TableRow';

// --- Main Component ---

const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [assignData, setAssignData] = useState({ classId: '' });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [subjectsRes, classesRes] = await Promise.all([
        adminAPI.getSubjects(),
        adminAPI.getClasses()
      ]);
      setSubjects(subjectsRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to synchronize data.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredSubjects = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return subjects;
    return subjects.filter(s => s.name.toLowerCase().includes(query));
  }, [subjects, searchQuery]);

  const stats = useMemo(() => {
    const total = subjects.length;
    const recent = subjects.filter(s => (Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 7).length;
    return { total, recent };
  }, [subjects]);

  const handleOpenDialog = useCallback((subject?: Subject) => {
    if (subject) {
      setSelectedSubject(subject);
      setFormData({ name: subject.name });
    } else {
      setSelectedSubject(null);
      setFormData({ name: '' });
    }
    setIsDialogOpen(true);
  }, []);

  const handleOpenAssignDialog = useCallback((subject: Subject) => {
    setSelectedSubject(subject);
    setAssignData({ classId: '' });
    setIsAssignDialogOpen(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (selectedSubject) {
        await adminAPI.updateSubject(selectedSubject.id, formData);
        setSubjects(prev => prev.map(s => s.id === selectedSubject.id ? { ...s, ...formData } : s));
        toast({ title: 'Success', description: 'Subject updated successfully.' });
      } else {
        const res = await adminAPI.createSubject(formData);
        // Add classes: [] to match type
        const newSubject = { ...res.data, classes: [] };
        setSubjects(prev => [newSubject, ...prev]);
        toast({ title: 'Success', description: 'Subject created successfully.' });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to save subject.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !assignData.classId) return;

    setIsSubmitting(true);
    try {
      await adminAPI.createMapping({
        subjectId: selectedSubject.id,
        classId: assignData.classId,
        facultyId: '' // Explicitly empty
      });

      // Update local state to show new assignment immediately
      const assignedClass = classes.find(c => String(c.id) === assignData.classId);
      if (assignedClass) {
        setSubjects(prev => prev.map(s => {
          if (s.id === selectedSubject.id) {
            const currentClasses = s.classes || [];
            // Check dupe just in case
            if (currentClasses.some(c => c.id === assignedClass.id)) return s;
            return { ...s, classes: [...currentClasses, assignedClass] };
          }
          return s;
        }));
      }

      toast({ title: 'Success', description: `Assigned ${selectedSubject.name} to class.` });
      setIsAssignDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'Failed to assign subject.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSubject) return;
    try {
      await adminAPI.deleteSubject(selectedSubject.id);
      setSubjects(prev => prev.filter(s => s.id !== selectedSubject.id));
      toast({ title: 'Success', description: 'Subject deleted successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete subject.', variant: 'destructive' });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedSubject(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in pb-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5 tracking-tight">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-sm">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              Subjects
            </h1>
            <p className="text-[11px] sm:text-[13px] text-muted-foreground ml-1 opacity-70">Manage institutional curriculum and course definitions</p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="h-11 sm:h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 rounded-xl px-6 text-sm font-bold w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            title="Total Subjects"
            value={stats.total}
            icon={BookOpen}
            colorClass="primary"
            gradientClass="bg-gradient-to-br from-primary/5 to-transparent"
            iconBgClass="bg-primary/10"
          />
          <StatsCard
            title="New (7d)"
            value={stats.recent}
            icon={Plus}
            colorClass="success"
            gradientClass="bg-gradient-to-br from-success/5 to-transparent"
            iconBgClass="bg-success/10"
          />
          <StatsCard
            title="System Status"
            value="Active"
            icon={CheckCircle2}
            colorClass="foreground"
            gradientClass="hover:bg-secondary/20"
            iconBgClass="bg-secondary/40"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search subjects..."
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

        {/* Content Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 glass-card rounded-2xl border-dashed">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-3 opacity-50" />
            <p className="text-[13px] text-muted-foreground font-medium animate-pulse">Syncing curriculum...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-5">
              <BookOpen className="w-8 h-8 text-primary/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1.5">{searchQuery ? 'No subjects found' : 'Curriculum empty'}</h3>
            <p className="text-[13px] text-muted-foreground max-w-sm mb-6">
              Start by adding academic subjects to manage your institutional course load.
            </p>
            {!searchQuery && (
              <Button onClick={() => handleOpenDialog()} className="h-9 px-6 rounded-lg font-bold gap-2 text-sm">
                <Plus className="w-4 h-4" /> Add Subject
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
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Subject Label</th>
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Assigned Classes</th>
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-[150px]">Created At</th>
                      <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-[150px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredSubjects.map((s) => (
                      <TableRow
                        key={s.id}
                        subject={s}
                        onEdit={handleOpenDialog}
                        onDelete={(sb) => {
                          setSelectedSubject(sb);
                          setIsDeleteDialogOpen(true);
                        }}
                        onAssign={handleOpenAssignDialog}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-secondary/10 py-3.5 px-6 border-t border-border/50 flex items-center justify-between text-[10px] font-bold text-muted-foreground/50 tracking-widest uppercase">
                <span>Total: {filteredSubjects.length} Curriculum Units</span>
                <span className="text-[9px] bg-secondary/30 px-2 py-0.5 rounded-md border border-border/50">Curriculum v1.0.4</span>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredSubjects.map((s) => (
                <MobileSubjectCard
                  key={s.id}
                  subject={s}
                  onEdit={handleOpenDialog}
                  onDelete={(sb) => {
                    setSelectedSubject(sb);
                    setIsDeleteDialogOpen(true);
                  }}
                  onAssign={handleOpenAssignDialog}
                />
              ))}
              <div className="py-2 text-center text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
                Showing {filteredSubjects.length} Curriculum Records
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50 sm:max-w-md rounded-3xl shadow-2xl">
          <DialogHeader className="pt-2 px-1">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {selectedSubject ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
              {selectedSubject ? 'Modify Subject' : 'New Subject'}
            </DialogTitle>
            <DialogDescription className="text-[13px] mt-1">
              {selectedSubject ? 'Update subject details.' : 'Define academic subjects and their institutional labels.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="space-y-4 px-1">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Subject Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Computer Graphics"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  className="h-10 bg-secondary/50 border-border/50 rounded-xl text-sm"
                  required
                  autoFocus
                />
              </div>

              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-wider italic">
                  Ensure subject names match official course catalogs for accurate reporting.
                </p>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/20 px-1 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold h-10 text-sm">Discard</Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all h-10 text-sm">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (selectedSubject ? 'Update' : 'Confirm')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Class Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50 sm:max-w-md rounded-3xl shadow-2xl">
          <DialogHeader className="pt-2 px-1">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Network className="w-4 h-4" />
              </div>
              Assign to Class
            </DialogTitle>
            <DialogDescription className="text-[13px] mt-1">
              Map <span className="font-bold text-foreground">{selectedSubject?.name}</span> to an academic class curriculum.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignSubmit} className="space-y-5 pt-4">
            <div className="space-y-4 px-1">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Select Class</Label>
                <Select value={assignData.classId} onValueChange={(v) => setAssignData({ classId: v })}>
                  <SelectTrigger className="h-10 bg-secondary/50 border-border/50 rounded-xl">
                    <SelectValue placeholder="Select a class..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 rounded-xl max-h-[200px]">
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)} className="py-2.5">
                        {c.program} Y{c.batchYear}{c.division ? `-${c.division}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-xl bg-accent/5 border border-accent/10 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-wider italic">
                  This makes the subject active for the selected class. You can assign a faculty member later.
                </p>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/20 px-1 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsAssignDialogOpen(false)} className="rounded-xl font-bold h-10 text-sm">Cancel</Button>
              <Button type="submit" disabled={isSubmitting || !assignData.classId} className="flex-1 rounded-xl font-bold shadow-lg shadow-accent/20 bg-accent text-accent-foreground hover:bg-accent/90 transition-all h-10 text-sm">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign Class'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50 rounded-3xl shadow-2xl p-6 text-center">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-3 mx-auto border border-destructive/20">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl font-black text-center tracking-tight">Delete Subject?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[13px] mt-1">
              You are about to remove <span className="font-black text-foreground uppercase tracking-tighter px-1 py-0.5 bg-secondary/30 rounded">{selectedSubject?.name}</span> permanently. <br />
              This will affect all associated mappings and timetables.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl font-bold h-10 text-sm px-6">Discard</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-white rounded-xl font-black h-10 text-sm px-6 shadow-lg shadow-destructive/20"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default SubjectsPage;
