import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Users, Loader2, Mail, X, BookOpen, UserCheck } from 'lucide-react';
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

interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  subjectsCount?: number;
  createdAt: string;
}

const FacultyPage: React.FC = () => {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', department: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getFaculty();
      setFaculty(response.data);
    } catch (error) {
      console.error('Failed to fetch faculty:', error);
      toast({
        title: 'Error',
        description: 'Failed to load faculty. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized filtered faculty
  const filteredFaculty = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return faculty;

    return faculty.filter(
      (f) =>
        f.name.toLowerCase().includes(query) ||
        f.email.toLowerCase().includes(query) ||
        f.department.toLowerCase().includes(query)
    );
  }, [faculty, searchQuery]);

  // Memoized stats
  const stats = useMemo(() => {
    const totalSubjects = faculty.reduce((sum, f) => sum + (f.subjectsCount || 0), 0);
    const departments = new Set(faculty.map(f => f.department)).size;
    const recentlyAdded = faculty.filter(f => {
      const daysDiff = (Date.now() - new Date(f.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;

    return { totalSubjects, departments, recentlyAdded };
  }, [faculty]);

  // Get initials for avatar
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
      setFormData({ name: f.name, email: f.email, password: '', department: f.department });
    } else {
      setSelectedFaculty(null);
      setFormData({ name: '', email: '', password: '', department: '' });
    }
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedFaculty(null);
    setFormData({ name: '', email: '', password: '', department: '' });
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.department.trim() || (!selectedFaculty && !formData.password.trim())) {
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
      if (selectedFaculty) {
        await adminAPI.updateFaculty(selectedFaculty.id, {
          name: formData.name,
          email: formData.email,
          department: formData.department,
        });
        setFaculty(faculty.map(f =>
          f.id === selectedFaculty.id ? { ...f, name: formData.name, email: formData.email, department: formData.department } : f
        ));
        toast({
          title: 'Success',
          description: 'Faculty member updated successfully.',
        });
      } else {
        const response = await adminAPI.createFaculty(formData);
        const newFaculty = response.data || {
          id: Date.now().toString(),
          name: formData.name,
          email: formData.email,
          department: formData.department,
          subjectsCount: 0,
          createdAt: new Date().toISOString()
        };
        setFaculty([newFaculty, ...faculty]);
        toast({
          title: 'Success',
          description: 'Faculty account created successfully.',
        });
      }
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

  const handleDelete = async () => {
    if (!selectedFaculty) return;

    try {
      await adminAPI.deleteFaculty(selectedFaculty.id);
      setFaculty(faculty.filter(f => f.id !== selectedFaculty.id));
      toast({
        title: 'Success',
        description: 'Faculty account deleted successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete faculty.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedFaculty(null);
    }
  };

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-success/10 flex items-center justify-center">
                <Users className="w-6 h-6 lg:w-7 lg:h-7 text-success" />
              </div>
              Faculty
            </h1>
            <p className="text-muted-foreground mt-2 text-sm lg:text-base">
              Manage faculty accounts and assignments
            </p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            size="lg"
          >
            <Plus className="w-5 h-5" />
            Add Faculty
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">Total Faculty</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{faculty.length}</p>
          </div>
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Total Subjects</p>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.totalSubjects}</p>
          </div>
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">Departments</p>
            </div>
            <p className="text-2xl font-bold text-accent">{stats.departments}</p>
          </div>
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-warning" />
              </div>
              <p className="text-sm text-muted-foreground">Recently Added</p>
            </div>
            <p className="text-2xl font-bold text-warning">{stats.recentlyAdded}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name, email, or department..."
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

        {/* Table */}
        <div className="glass-card overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading faculty...</p>
            </div>
          ) : filteredFaculty.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? 'No faculty found' : 'No faculty yet'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                {searchQuery
                  ? 'Try adjusting your search terms or clear the search to see all faculty.'
                  : 'Get started by adding your first faculty member to the system.'}
              </p>
              {!searchQuery && (
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Your First Faculty
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-1/3">Faculty</th>
                      <th className="w-1/4">Department</th>
                      <th className="w-1/6">Subjects</th>
                      <th className="w-32 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFaculty.map((f) => (
                      <tr key={f.id} className="group">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center border-2 border-success/20 group-hover:scale-110 transition-transform">
                              <span className="text-sm font-bold text-success">
                                {getInitials(f.name)}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{f.name}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5" />
                                {f.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-sm font-medium border border-accent/20">
                            {f.department}
                          </span>
                        </td>
                        <td>
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                            {f.subjectsCount || 0}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(f)}
                              className="hover:bg-primary/10 hover:text-primary transition-colors"
                              aria-label={`Edit ${f.name}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedFaculty(f);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                              aria-label={`Delete ${f.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Results Count */}
              <div className="px-6 py-4 border-t border-border/50 text-sm text-muted-foreground text-center">
                Showing {filteredFaculty.length} of {faculty.length} faculty member{faculty.length !== 1 ? 's' : ''}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedFaculty ? 'Edit Faculty' : 'Add New Faculty'}
            </DialogTitle>
            <DialogDescription>
              {selectedFaculty
                ? 'Update the faculty member details below.'
                : 'Enter the details for the new faculty member.'}
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
                  placeholder="e.g., Dr. John Smith"
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
                  placeholder="e.g., john.smith@university.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                  className="bg-secondary/50 border-border/50 focus:border-primary"
                  required
                />
              </div>
              {!selectedFaculty && (
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
              )}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium">
                  Department <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="department"
                  placeholder="e.g., Computer Science"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="bg-secondary/50 border-border/50 focus:border-primary"
                  required
                />
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
                {selectedFaculty ? 'Update Faculty' : 'Create Faculty'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Delete Faculty</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{selectedFaculty?.name}"</span>?
              This action cannot be undone and may affect related data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete Faculty
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default FacultyPage;
