import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Link2, Loader2 } from 'lucide-react';
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
      // Mock data
      setMappings([
        { id: '1', facultyId: '1', facultyName: 'Dr. John Smith', subjectId: '1', subjectName: 'Data Structures', subjectCode: 'CS201', classId: '1', className: 'CS Y1-A', createdAt: '2024-01-15' },
        { id: '2', facultyId: '1', facultyName: 'Dr. John Smith', subjectId: '2', subjectName: 'Database Management', subjectCode: 'CS301', classId: '3', className: 'CS Y2-A', createdAt: '2024-01-15' },
        { id: '3', facultyId: '2', facultyName: 'Dr. Sarah Johnson', subjectId: '3', subjectName: 'Computer Networks', subjectCode: 'CS401', classId: '3', className: 'CS Y2-A', createdAt: '2024-01-15' },
        { id: '4', facultyId: '3', facultyName: 'Prof. Michael Brown', subjectId: '4', subjectName: 'Operating Systems', subjectCode: 'CS302', classId: '2', className: 'CS Y1-B', createdAt: '2024-01-15' },
      ]);
      setFaculty([
        { id: '1', name: 'Dr. John Smith' },
        { id: '2', name: 'Dr. Sarah Johnson' },
        { id: '3', name: 'Prof. Michael Brown' },
      ]);
      setSubjects([
        { id: '1', name: 'Data Structures', code: 'CS201' },
        { id: '2', name: 'Database Management', code: 'CS301' },
        { id: '3', name: 'Computer Networks', code: 'CS401' },
        { id: '4', name: 'Operating Systems', code: 'CS302' },
      ]);
      setClasses([
        { id: '1', name: 'Computer Science', year: 1, division: 'A' },
        { id: '2', name: 'Computer Science', year: 1, division: 'B' },
        { id: '3', name: 'Computer Science', year: 2, division: 'A' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMappings = mappings.filter(
    (mapping) =>
      mapping.facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mapping.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mapping.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
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
      setMappings([...mappings, newMapping]);
      toast({
        title: 'Mapping Created',
        description: 'The faculty-subject-class mapping has been created.',
      });
      setIsDialogOpen(false);
      setFormData({ facultyId: '', subjectId: '', classId: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'An error occurred.',
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
        title: 'Mapping Deleted',
        description: 'The mapping has been deleted successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'An error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedMapping(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Faculty-Subject Mappings</h1>
            <p className="text-muted-foreground mt-1">Assign faculty to subjects and classes</p>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)} 
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Mapping
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search mappings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50"
          />
        </div>

        {/* Cards Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredMappings.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-12 text-center">
            <Link2 className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No mappings found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try adjusting your search' : 'Create your first mapping to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMappings.map((mapping) => (
              <div key={mapping.id} className="glass-card p-5 hover-lift">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-primary" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedMapping(mapping);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Faculty</p>
                    <p className="font-medium text-foreground">{mapping.facultyName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Subject</p>
                    <p className="font-medium text-foreground">
                      {mapping.subjectName}
                      <span className="ml-2 text-xs text-muted-foreground">({mapping.subjectCode})</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Class</p>
                    <p className="font-medium text-foreground">{mapping.className}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create New Mapping</DialogTitle>
            <DialogDescription>
              Assign a faculty member to teach a subject for a specific class.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Faculty</Label>
              <Select
                value={formData.facultyId}
                onValueChange={(value) => setFormData({ ...formData, facultyId: value })}
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select faculty" />
                </SelectTrigger>
                <SelectContent>
                  {faculty.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={formData.subjectId}
                onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={formData.classId}
                onValueChange={(value) => setFormData({ ...formData, classId: value })}
              >
                <SelectTrigger className="bg-secondary/50">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Mapping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mapping</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this mapping? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default MappingsPage;
