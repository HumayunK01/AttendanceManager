import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Plus, Pencil, Trash2, Search, BookOpen, Loader2, X } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';

// --- Types ---

interface Subject {
  id: string;
  name: string;
  createdAt: string;
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

const TableRow = memo(({ subject, onEdit, onDelete }: { subject: Subject; onEdit: (s: Subject) => void; onDelete: (s: Subject) => void }) => (
  <tr className="group hover:bg-white/5 transition-colors duration-200">
    <td className="py-3 px-6 font-bold text-foreground text-sm">{subject.name}</td>
    <td className="px-6 text-muted-foreground text-[12px]">
      {new Date(subject.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })}
    </td>
    <td className="px-6">
      <div className="flex items-center justify-end gap-2">
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

TableRow.displayName = 'TableRow';

// --- Main Component ---

const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchSubjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getSubjects();
      setSubjects(response.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load subjects.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const filteredSubjects = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return subjects;
    return subjects.filter(s => s.name.toLowerCase().includes(query));
  }, [subjects, searchQuery]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (selectedSubject) {
        await adminAPI.updateSubject(selectedSubject.id, formData);
        setSubjects(prev => prev.map(s => s.id === selectedSubject.id ? { ...s, ...formData } : s));
        toast({ title: 'Success', description: 'Subject updated.' });
      } else {
        const res = await adminAPI.createSubject(formData);
        const newSubject = res.data || {
          id: Date.now().toString(),
          ...formData,
          createdAt: new Date().toISOString()
        };
        setSubjects(prev => [newSubject, ...prev]);
        toast({ title: 'Success', description: 'Subject created.' });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSubject) return;
    try {
      await adminAPI.deleteSubject(selectedSubject.id);
      setSubjects(prev => prev.filter(s => s.id !== selectedSubject.id));
      toast({ title: 'Success', description: 'Subject deleted.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Delete failed.', variant: 'destructive' });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedSubject(null);
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
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              Subjects
            </h1>
            <p className="text-[13px] text-muted-foreground ml-1">Manage academic subjects and course codes</p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="h-9 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 rounded-lg px-6 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="font-bold">Add Subject</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Total Subjects"
            value={subjects.length}
            icon={BookOpen}
            colorClass="primary"
            gradientClass="bg-gradient-to-br from-primary/5 to-transparent"
            iconBgClass="bg-primary/10"
          />
          <StatsCard
            title="Search Results"
            value={filteredSubjects.length}
            icon={Search}
            colorClass="accent"
            gradientClass="bg-gradient-to-br from-accent/5 to-transparent"
            iconBgClass="bg-accent/10"
          />
          <StatsCard
            title="New This Week"
            value={subjects.filter(s => (Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 7).length}
            icon={Plus}
            colorClass="success"
            gradientClass="bg-gradient-to-br from-success/5 to-transparent"
            iconBgClass="bg-success/10"
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

        {/* Table/Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 glass-card rounded-2xl border-dashed">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-3 opacity-50" />
            <p className="text-[13px] text-muted-foreground font-medium animate-pulse">Fetching subjects...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-5">
              <BookOpen className="w-8 h-8 text-primary/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1.5">No subjects found</h3>
            <p className="text-[13px] text-muted-foreground max-w-sm mb-6">
              Start adding subjects to manage your curriculum.
            </p>
            {!searchQuery && (
              <Button onClick={() => handleOpenDialog()} className="h-9 px-6 rounded-lg font-bold gap-2 text-sm">
                <Plus className="w-4 h-4" /> Add Subject
              </Button>
            )}
          </div>
        ) : (
          <div className="glass-card overflow-hidden rounded-2xl border-border/50 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/20">
                    <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Subject Name</th>
                    <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-40">Created</th>
                    <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredSubjects.map(s => (
                    <TableRow key={s.id} subject={s} onEdit={handleOpenDialog} onDelete={(sb) => { setSelectedSubject(sb); setIsDeleteDialogOpen(true); }} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-secondary/10 py-3 px-6 border-t border-border/50 flex items-center justify-between text-[10px] font-bold text-muted-foreground/50 tracking-widest uppercase">
              <span>Showing {filteredSubjects.length} Results</span>
              <span className="text-[9px] bg-secondary/30 px-2 py-0.5 rounded-md border border-border/50">Admin Console v1.0</span>
            </div>
          </div>
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
              {selectedSubject ? 'Update Subject' : 'New Subject'}
            </DialogTitle>
            <DialogDescription className="text-[13px] mt-1">
              Set up or update subject details in your curricula.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="space-y-4 px-1">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Subject Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Data Structures"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  className="h-10 bg-secondary/50 border-border/50 rounded-xl text-sm"
                  required
                  autoFocus
                />
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

      {/* Delete Prompt */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50 rounded-3xl shadow-2xl p-6">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-3 mx-auto border border-destructive/20">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl font-black text-center tracking-tight">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[13px] mt-1">
              This will permanently remove the subject: <br />
              <span className="font-black text-foreground mt-2 block p-2 bg-secondary/30 rounded-lg border border-border/50">
                {selectedSubject?.name}
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

export default SubjectsPage;
