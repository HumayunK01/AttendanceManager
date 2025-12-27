import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  Loader2,
  Mail,
  X,
  BookOpen,
  Clock
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
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';

// --- Types ---

interface Faculty {
  id: string;
  name: string;
  email: string;
  subjectsCount?: number;
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

const TableRow = memo(({
  faculty,
  onEdit,
  onDelete,
  getInitials
}: {
  faculty: Faculty;
  onEdit: (f: Faculty) => void;
  onDelete: (f: Faculty) => void;
  getInitials: (name: string) => string;
}) => (
  <tr className="group hover:bg-white/5 transition-colors duration-200">
    <td className="py-2.5 px-5">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center border border-success/20 group-hover:scale-110 transition-transform duration-300 shadow-sm">
          <span className="text-[10px] font-black text-success tracking-tighter">
            {getInitials(faculty.name)}
          </span>
        </div>
        <div>
          <p className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
            {faculty.name}
          </p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 opacity-60">
            <Mail className="w-2.5 h-2.5" />
            {faculty.email}
          </p>
        </div>
      </div>
    </td>
    <td className="px-5">
      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[9px] font-black border border-primary/20 shadow-sm uppercase tracking-wider">
        {faculty.subjectsCount || 0} Subjects
      </span>
    </td>
    <td className="px-5 text-muted-foreground text-[11px]">
      {new Date(faculty.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })}
    </td>
    <td className="px-5">
      <div className="flex items-center justify-end gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(faculty)}
          className="w-7 h-7 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200 border border-transparent hover:border-primary/20"
        >
          <Pencil className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(faculty)}
          className="w-7 h-7 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all duration-200 border border-transparent hover:border-destructive/20"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </td>
  </tr>
));

TableRow.displayName = 'TableRow';

// --- Main Component ---

const FacultyPage: React.FC = () => {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeletePromptOpen, setIsDeletePromptOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchFaculty = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getFaculty();
      setFaculty(response.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load faculty data.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  const filteredFaculty = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return faculty;
    return faculty.filter(
      (f) => f.name.toLowerCase().includes(query) || f.email.toLowerCase().includes(query)
    );
  }, [faculty, searchQuery]);

  const stats = useMemo(() => {
    const totalSubjects = faculty.reduce((sum, f) => sum + Number(f.subjectsCount || 0), 0);
    const recentlyAdded = faculty.filter(f => {
      const daysDiff = (Date.now() - new Date(f.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;
    return { totalSubjects, recentlyAdded };
  }, [faculty]);

  const getInitials = useCallback((name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, []);

  const handleOpenDialog = useCallback((f?: Faculty) => {
    if (f) {
      setSelectedFaculty(f);
      setFormData({ name: f.name, email: f.email, password: '' });
    } else {
      setSelectedFaculty(null);
      setFormData({ name: '', email: '', password: '' });
    }
    setIsDialogOpen(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || (!selectedFaculty && !formData.password.trim())) return;

    setIsSubmitting(true);
    try {
      if (selectedFaculty) {
        await adminAPI.updateFaculty(selectedFaculty.id, {
          name: formData.name,
          email: formData.email,
        });
        setFaculty(prev => prev.map(f =>
          f.id === selectedFaculty.id ? { ...f, name: formData.name, email: formData.email } : f
        ));
        toast({ title: 'Success', description: 'Faculty updated successfully.' });
      } else {
        await adminAPI.createFaculty(formData);
        toast({ title: 'Success', description: 'Faculty account created.' });
        fetchFaculty();
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to sync with server.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFaculty) return;
    try {
      await adminAPI.deleteFaculty(selectedFaculty.id);
      setFaculty(prev => prev.filter(f => f.id !== selectedFaculty.id));
      toast({ title: 'Success', description: 'Faculty member removed.' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Action failed.', variant: 'destructive' });
    } finally {
      setIsDeletePromptOpen(false);
      setSelectedFaculty(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-xl font-black text-foreground flex items-center gap-2 tracking-tight">
              <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center border border-success/20">
                <Users className="w-4 h-4 text-success" />
              </div>
              Faculty Management
            </h1>
            <p className="text-[11px] text-muted-foreground ml-1 font-medium">Academic staff and course assignments</p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="h-9 gap-1.5 bg-success hover:bg-success/90 text-success-foreground shadow-md shadow-success/10 hover:shadow-lg hover:shadow-success/20 transition-all duration-300 rounded-xl px-5 text-[11px] font-black uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Faculty
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="glass-card p-4 rounded-xl border border-border/50 bg-gradient-to-br from-success/5 to-transparent group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Total Faculty</p>
                <p className="text-2xl font-black text-success tracking-tighter">{faculty.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center border border-success/20 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-success" />
              </div>
            </div>
          </div>
          <div className="glass-card p-4 rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 to-transparent group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Subjects</p>
                <p className="text-2xl font-black text-primary tracking-tighter">{stats.totalSubjects}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
          <div className="glass-card p-4 rounded-xl border border-border/50 bg-gradient-to-br from-warning/5 to-transparent group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">New (7d)</p>
                <p className="text-2xl font-black text-warning tracking-tighter">{stats.recentlyAdded}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-xs group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-secondary/30 border-border/50 focus:border-primary/50 rounded-xl transition-all shadow-sm text-[13px]"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent text-muted-foreground"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Table/Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 glass-card rounded-xl border-dashed">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2 opacity-50" />
            <p className="text-[11px] text-muted-foreground font-medium animate-pulse">Loading faculty roster...</p>
          </div>
        ) : filteredFaculty.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl">
            <div className="w-14 h-14 rounded-full bg-success/5 flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-success/40" />
            </div>
            <h3 className="text-lg font-black text-foreground mb-1">{searchQuery ? 'No matches' : 'No faculty yet'}</h3>
            <p className="text-[11px] text-muted-foreground max-w-sm mb-5">
              {searchQuery ? 'Try adjusting your search terms.' : 'Add faculty members to manage course assignments.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => handleOpenDialog()} className="h-9 px-5 rounded-xl font-black gap-1.5 text-[11px] uppercase tracking-wider">
                <Plus className="w-3.5 h-3.5" /> Add Faculty
              </Button>
            )}
          </div>
        ) : (
          <div className="glass-card overflow-hidden rounded-xl border-border/50 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/20">
                    <th className="text-left py-3 px-5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Personnel</th>
                    <th className="text-left py-3 px-5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Allocation</th>
                    <th className="text-left py-3 px-5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Joined</th>
                    <th className="text-right py-3 px-5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredFaculty.map((f) => (
                    <TableRow
                      key={f.id}
                      faculty={f}
                      onEdit={handleOpenDialog}
                      onDelete={(f) => { setSelectedFaculty(f); setIsDeletePromptOpen(true); }}
                      getInitials={getInitials}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-secondary/10 py-2.5 px-5 border-t border-border/50 flex items-center justify-between text-[9px] font-bold text-muted-foreground/50 tracking-widest uppercase">
              <span>Showing {filteredFaculty.length} {filteredFaculty.length === 1 ? 'Result' : 'Results'}</span>
              <span className="text-[8px] bg-secondary/30 px-1.5 py-0.5 rounded-md border border-border/50">v1.0</span>
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
              {selectedFaculty ? 'Update Faculty' : 'New Faculty'}
            </DialogTitle>
            <DialogDescription className="text-[13px] mt-1">
              Set up a new faculty account or update existing details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="space-y-4 px-1">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Full Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Dr. Alan Turing"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-10 bg-secondary/50 border-border/50 rounded-xl text-sm"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Technical Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@university.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                  className="h-10 bg-secondary/50 border-border/50 rounded-xl text-sm"
                  required
                />
              </div>
              {!selectedFaculty && (
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Access Credentials</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-10 bg-secondary/50 border-border/50 rounded-xl text-sm"
                    required
                  />
                  <p className="text-[9px] text-muted-foreground/50 font-black uppercase tracking-widest ml-1">Min. 6 bits</p>
                </div>
              )}
            </div>
            <DialogFooter className="pt-4 border-t border-border/20 px-1 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold h-10 text-sm">Discard</Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all h-10 text-sm">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (selectedFaculty ? 'Update' : 'Confirm')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Prompt */}
      <AlertDialog open={isDeletePromptOpen} onOpenChange={setIsDeletePromptOpen}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50 rounded-3xl shadow-2xl p-6 text-center">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-3 mx-auto border border-destructive/20">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl font-black text-center tracking-tight">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[13px] mt-1">
              This will permanently remove the faculty profile for: <br />
              <span className="font-black text-foreground mt-2 block p-2 bg-secondary/30 rounded-lg border border-border/50 uppercase tracking-tighter">
                {selectedFaculty?.name}
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

export default memo(FacultyPage);
