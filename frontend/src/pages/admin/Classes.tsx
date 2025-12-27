import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Building, Loader2, X, Users, GraduationCap } from 'lucide-react';
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

interface Class {
  id: string;
  name: string;
  year: number;
  division: string;
  studentCount?: number;
  createdAt: string;
}

const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({ name: '', year: 1, division: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getClasses();
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load classes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized filtered classes
  const filteredClasses = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return classes;

    return classes.filter(
      (cls) =>
        cls.name.toLowerCase().includes(query) ||
        cls.division.toLowerCase().includes(query) ||
        `year ${cls.year}`.includes(query)
    );
  }, [classes, searchQuery]);

  // Memoized stats
  const stats = useMemo(() => {
    const totalStudents = classes.reduce((sum, cls) => sum + (cls.studentCount || 0), 0);
    const recentlyAdded = classes.filter(cls => {
      const daysDiff = (Date.now() - new Date(cls.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;

    return { totalStudents, recentlyAdded };
  }, [classes]);

  const handleOpenDialog = useCallback((cls?: Class) => {
    if (cls) {
      setSelectedClass(cls);
      setFormData({ name: cls.name, year: cls.year, division: cls.division });
    } else {
      setSelectedClass(null);
      setFormData({ name: '', year: 1, division: '' });
    }
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedClass(null);
    setFormData({ name: '', year: 1, division: '' });
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.name.trim() || !formData.division.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedClass) {
        await adminAPI.updateClass(selectedClass.id, formData);
        setClasses(classes.map(c =>
          c.id === selectedClass.id ? { ...c, ...formData } : c
        ));
        toast({
          title: 'Success',
          description: 'Class updated successfully.',
        });
      } else {
        const response = await adminAPI.createClass(formData);
        const newClass = response.data || {
          id: Date.now().toString(),
          ...formData,
          studentCount: 0,
          createdAt: new Date().toISOString()
        };
        setClasses([newClass, ...classes]);
        toast({
          title: 'Success',
          description: 'Class created successfully.',
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
    if (!selectedClass) return;

    try {
      await adminAPI.deleteClass(selectedClass.id);
      setClasses(classes.filter(c => c.id !== selectedClass.id));
      toast({
        title: 'Success',
        description: 'Class deleted successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete class.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedClass(null);
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
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-warning/10 flex items-center justify-center">
                <Building className="w-6 h-6 lg:w-7 lg:h-7 text-warning" />
              </div>
              Classes
            </h1>
            <p className="text-muted-foreground mt-2 text-sm lg:text-base">
              Manage academic classes and divisions
            </p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            size="lg"
          >
            <Plus className="w-5 h-5" />
            Add Class
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Building className="w-5 h-5 text-warning" />
              </div>
              <p className="text-sm text-muted-foreground">Total Classes</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{classes.length}</p>
          </div>
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.totalStudents}</p>
          </div>
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">Recently Added</p>
            </div>
            <p className="text-2xl font-bold text-success">{stats.recentlyAdded}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name, division, or year..."
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

        {/* Cards Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading classes...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-4">
              <Building className="w-8 h-8 text-warning" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery ? 'No classes found' : 'No classes yet'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              {searchQuery
                ? 'Try adjusting your search terms or clear the search to see all classes.'
                : 'Get started by adding your first class to the system.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Class
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredClasses.map((cls) => (
                <div key={cls.id} className="glass-card p-5 hover-lift group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Building className="w-6 h-6 text-warning" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(cls)}
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                        aria-label={`Edit ${cls.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedClass(cls);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                        aria-label={`Delete ${cls.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground mb-1 text-lg group-hover:text-primary transition-colors">
                    {cls.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                      Year {cls.year}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-accent/10 text-accent text-xs font-semibold border border-accent/20">
                      Div {cls.division}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Students</span>
                    </div>
                    <span className="text-lg font-bold text-foreground">{cls.studentCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Results Count */}
            <div className="text-sm text-muted-foreground text-center">
              Showing {filteredClasses.length} of {classes.length} class{classes.length !== 1 ? 'es' : ''}
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedClass ? 'Edit Class' : 'Add New Class'}
            </DialogTitle>
            <DialogDescription>
              {selectedClass
                ? 'Update the class details below.'
                : 'Enter the details for the new class.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Class Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Computer Science"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-secondary/50 border-border/50 focus:border-primary"
                  required
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year" className="text-sm font-medium">
                    Year <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.year.toString()}
                    onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-secondary/50 border-border/50 focus:border-primary">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Year 1</SelectItem>
                      <SelectItem value="2">Year 2</SelectItem>
                      <SelectItem value="3">Year 3</SelectItem>
                      <SelectItem value="4">Year 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="division" className="text-sm font-medium">
                    Division <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="division"
                    placeholder="e.g., A"
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value.toUpperCase() })}
                    className="bg-secondary/50 border-border/50 focus:border-primary"
                    maxLength={2}
                    required
                  />
                </div>
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
                {selectedClass ? 'Update Class' : 'Create Class'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Delete Class</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{selectedClass?.name} - Year {selectedClass?.year} Division {selectedClass?.division}"</span>?
              This action cannot be undone and may affect related data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete Class
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default ClassesPage;
