import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Trash2, Search, Link2, Loader2, X, Users, BookOpen, Building } from 'lucide-react';
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

interface Mapping {
  id: string;
  facultyId: string;
  facultyName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
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

interface Class {
  id: string;
  name: string;
  year: number;
  division: string;
}

const MappingsPage: React.FC = () => {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<Mapping | null>(null);
  const [formData, setFormData] = useState({ facultyId: '', subjectId: '', classId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [mappingsRes, facultyRes, subjectsRes, classesRes] = await Promise.all([
        adminAPI.getMappings(),
        adminAPI.getFaculty(),
        adminAPI.getSubjects(),
        adminAPI.getClasses()
      ]);
      setMappings(mappingsRes.data);
      setFaculty(facultyRes.data);
      setSubjects(subjectsRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load mappings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized filtered mappings
  const filteredMappings = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return mappings;

    return mappings.filter(
      (mapping) =>
        mapping.facultyName.toLowerCase().includes(query) ||
        mapping.subjectName.toLowerCase().includes(query) ||
        mapping.subjectCode.toLowerCase().includes(query) ||
        mapping.className.toLowerCase().includes(query)
    );
  }, [mappings, searchQuery]);

  // Memoized stats
  const stats = useMemo(() => {
    const uniqueFaculty = new Set(mappings.map(m => m.facultyId)).size;
    const uniqueSubjects = new Set(mappings.map(m => m.subjectId)).size;
    const uniqueClasses = new Set(mappings.map(m => m.classId)).size;
    const recentlyAdded = mappings.filter(m => {
      const daysDiff = (Date.now() - new Date(m.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;

    return { uniqueFaculty, uniqueSubjects, uniqueClasses, recentlyAdded };
  }, [mappings]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setFormData({ facultyId: '', subjectId: '', classId: '' });
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.facultyId || !formData.subjectId || !formData.classId) {
      toast({
        title: 'Validation Error',
        description: 'Please select all fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await adminAPI.createMapping(formData);
      const selectedFaculty = faculty.find(f => f.id === formData.facultyId);
      const selectedSubject = subjects.find(s => s.id === formData.subjectId);
      const selectedClass = classes.find(c => c.id === formData.classId);

      const newMapping = response.data || {
        id: Date.now().toString(),
        facultyId: formData.facultyId,
        facultyName: selectedFaculty?.name || '',
        subjectId: formData.subjectId,
        subjectName: selectedSubject?.name || '',
        subjectCode: selectedSubject?.code || '',
        classId: formData.classId,
        className: selectedClass ? `${selectedClass.name} Y${selectedClass.year}-${selectedClass.division}` : '',
        createdAt: new Date().toISOString()
      };
      setMappings([newMapping, ...mappings]);
      toast({
        title: 'Success',
        description: 'Mapping created successfully.',
      });
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
    if (!selectedMapping) return;

    try {
      await adminAPI.deleteMapping(selectedMapping.id);
      setMappings(mappings.filter(m => m.id !== selectedMapping.id));
      toast({
        title: 'Success',
        description: 'Mapping deleted successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete mapping.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedMapping(null);
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
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Link2 className="w-6 h-6 lg:w-7 lg:h-7 text-accent" />
              </div>
              Mappings
            </h1>
            <p className="text-muted-foreground mt-2 text-sm lg:text-base">
              Assign faculty to subjects and classes
            </p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            size="lg"
          >
            <Plus className="w-5 h-5" />
            Create Mapping
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">Total Mappings</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{mappings.length}</p>
          </div>
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">Active Faculty</p>
            </div>
            <p className="text-2xl font-bold text-success">{stats.uniqueFaculty}</p>
          </div>
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Assigned Subjects</p>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.uniqueSubjects}</p>
          </div>
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Building className="w-5 h-5 text-warning" />
              </div>
              <p className="text-sm text-muted-foreground">Active Classes</p>
            </div>
            <p className="text-2xl font-bold text-warning">{stats.uniqueClasses}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by faculty, subject, or class..."
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
            <p className="text-muted-foreground">Loading mappings...</p>
          </div>
        ) : filteredMappings.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <Link2 className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery ? 'No mappings found' : 'No mappings yet'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              {searchQuery
                ? 'Try adjusting your search terms or clear the search to see all mappings.'
                : 'Get started by creating your first faculty-subject-class mapping.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Mapping
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMappings.map((mapping) => (
                <div key={mapping.id} className="glass-card p-5 hover-lift group relative overflow-hidden">
                  {/* Gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform border-2 border-accent/20">
                        <Link2 className="w-6 h-6 text-accent" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMapping(mapping);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                        aria-label={`Delete mapping for ${mapping.facultyName}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-3.5 h-3.5 text-success" />
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Faculty</p>
                        </div>
                        <p className="font-semibold text-foreground group-hover:text-accent transition-colors">{mapping.facultyName}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <BookOpen className="w-3.5 h-3.5 text-primary" />
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Subject</p>
                        </div>
                        <p className="font-semibold text-foreground">
                          {mapping.subjectName}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-mono font-bold mt-1 border border-primary/20">
                          {mapping.subjectCode}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Building className="w-3.5 h-3.5 text-warning" />
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Class</p>
                        </div>
                        <p className="font-semibold text-foreground">{mapping.className}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Results Count */}
            <div className="text-sm text-muted-foreground text-center">
              Showing {filteredMappings.length} of {mappings.length} mapping{mappings.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Mapping</DialogTitle>
            <DialogDescription>
              Assign a faculty member to teach a subject for a specific class.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-success" />
                  Faculty <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.facultyId}
                  onValueChange={(value) => setFormData({ ...formData, facultyId: value })}
                >
                  <SelectTrigger className="bg-secondary/50 border-border/50 focus:border-primary">
                    <SelectValue placeholder="Select faculty member" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculty.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.subjectId}
                  onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                >
                  <SelectTrigger className="bg-secondary/50 border-border/50 focus:border-primary">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Building className="w-4 h-4 text-warning" />
                  Class <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.classId}
                  onValueChange={(value) => setFormData({ ...formData, classId: value })}
                >
                  <SelectTrigger className="bg-secondary/50 border-border/50 focus:border-primary">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} Year {c.year} - {c.division}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                Create Mapping
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Delete Mapping</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete this mapping? This will unassign{' '}
              <span className="font-semibold text-foreground">{selectedMapping?.facultyName}</span> from teaching{' '}
              <span className="font-semibold text-foreground">{selectedMapping?.subjectName}</span> to{' '}
              <span className="font-semibold text-foreground">{selectedMapping?.className}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete Mapping
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default MappingsPage;
