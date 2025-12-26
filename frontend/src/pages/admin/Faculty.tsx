import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Users, Loader2, Mail } from 'lucide-react';
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
      const response = await adminAPI.getFaculty();
      setFaculty(response.data);
    } catch (error) {
      // Mock data
      setFaculty([
        { id: '1', name: 'Dr. John Smith', email: 'john.smith@university.edu', department: 'Computer Science', subjectsCount: 3, createdAt: '2024-01-15' },
        { id: '2', name: 'Dr. Sarah Johnson', email: 'sarah.j@university.edu', department: 'Information Technology', subjectsCount: 2, createdAt: '2024-01-15' },
        { id: '3', name: 'Prof. Michael Brown', email: 'm.brown@university.edu', department: 'Computer Science', subjectsCount: 4, createdAt: '2024-01-15' },
        { id: '4', name: 'Dr. Emily Davis', email: 'emily.d@university.edu', department: 'Electronics', subjectsCount: 2, createdAt: '2024-01-15' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFaculty = faculty.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (f?: Faculty) => {
    if (f) {
      setSelectedFaculty(f);
      setFormData({ name: f.name, email: f.email, password: '', department: f.department });
    } else {
      setSelectedFaculty(null);
      setFormData({ name: '', email: '', password: '', department: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.department || (!selectedFaculty && !formData.password)) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
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
          f.id === selectedFaculty.id ? { ...f, ...formData } : f
        ));
        toast({
          title: 'Faculty Updated',
          description: 'The faculty member has been updated successfully.',
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
        setFaculty([...faculty, newFaculty]);
        toast({
          title: 'Faculty Created',
          description: 'The faculty account has been created successfully.',
        });
      }
      setIsDialogOpen(false);
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
    if (!selectedFaculty) return;

    try {
      await adminAPI.deleteFaculty(selectedFaculty.id);
      setFaculty(faculty.filter(f => f.id !== selectedFaculty.id));
      toast({
        title: 'Faculty Deleted',
        description: 'The faculty account has been deleted successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'An error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedFaculty(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Faculty</h1>
            <p className="text-muted-foreground mt-1">Manage faculty accounts</p>
          </div>
          <Button 
            onClick={() => handleOpenDialog()} 
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Faculty
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50"
          />
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredFaculty.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">No faculty found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try adjusting your search' : 'Add your first faculty member to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Faculty</th>
                    <th>Department</th>
                    <th>Subjects</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaculty.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-success">
                              {f.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{f.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {f.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted-foreground">{f.department}</td>
                      <td>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium">
                          {f.subjectsCount || 0} subjects
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(f)}
                            className="hover:bg-secondary"
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
                            className="hover:bg-destructive/10 hover:text-destructive"
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
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{selectedFaculty ? 'Edit Faculty' : 'Add New Faculty'}</DialogTitle>
            <DialogDescription>
              {selectedFaculty ? 'Update the faculty details below.' : 'Enter the details for the new faculty member.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="e.g., Dr. John Smith"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g., john.smith@university.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-secondary/50"
              />
            </div>
            {!selectedFaculty && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter initial password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-secondary/50"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="e.g., Computer Science"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="bg-secondary/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedFaculty ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Faculty</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedFaculty?.name}"? This action cannot be undone.
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

export default FacultyPage;
