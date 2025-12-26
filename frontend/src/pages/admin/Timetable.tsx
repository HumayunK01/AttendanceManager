import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Clock, Loader2 } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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

interface TimetableSlot {
  id: string;
  mappingId: string;
  facultyName: string;
  subjectName: string;
  className: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Mapping {
  id: string;
  facultyName: string;
  subjectName: string;
  className: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimetablePage: React.FC = () => {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  const [formData, setFormData] = useState({ mappingId: '', dayOfWeek: 0, startTime: '', endTime: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [slotsRes, mappingsRes] = await Promise.all([
        adminAPI.getTimetable(),
        adminAPI.getMappings()
      ]);
      setSlots(slotsRes.data);
      setMappings(mappingsRes.data);
    } catch (error) {
      // Mock data
      setSlots([
        { id: '1', mappingId: '1', facultyName: 'Dr. John Smith', subjectName: 'Data Structures', className: 'CS Y1-A', dayOfWeek: 0, startTime: '09:00', endTime: '10:00' },
        { id: '2', mappingId: '2', facultyName: 'Dr. John Smith', subjectName: 'Database Management', className: 'CS Y2-A', dayOfWeek: 0, startTime: '11:00', endTime: '12:00' },
        { id: '3', mappingId: '3', facultyName: 'Dr. Sarah Johnson', subjectName: 'Computer Networks', className: 'CS Y2-A', dayOfWeek: 1, startTime: '10:00', endTime: '11:00' },
        { id: '4', mappingId: '4', facultyName: 'Prof. Michael Brown', subjectName: 'Operating Systems', className: 'CS Y1-B', dayOfWeek: 1, startTime: '14:00', endTime: '15:00' },
        { id: '5', mappingId: '1', facultyName: 'Dr. John Smith', subjectName: 'Data Structures', className: 'CS Y1-A', dayOfWeek: 2, startTime: '09:00', endTime: '10:00' },
        { id: '6', mappingId: '3', facultyName: 'Dr. Sarah Johnson', subjectName: 'Computer Networks', className: 'CS Y2-A', dayOfWeek: 3, startTime: '11:00', endTime: '12:00' },
      ]);
      setMappings([
        { id: '1', facultyName: 'Dr. John Smith', subjectName: 'Data Structures', className: 'CS Y1-A' },
        { id: '2', facultyName: 'Dr. John Smith', subjectName: 'Database Management', className: 'CS Y2-A' },
        { id: '3', facultyName: 'Dr. Sarah Johnson', subjectName: 'Computer Networks', className: 'CS Y2-A' },
        { id: '4', facultyName: 'Prof. Michael Brown', subjectName: 'Operating Systems', className: 'CS Y1-B' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const slotsForDay = slots.filter(s => s.dayOfWeek === selectedDay).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleSubmit = async () => {
    if (!formData.mappingId || !formData.startTime || !formData.endTime) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await adminAPI.createTimetableSlot(formData);
      const selectedMapping = mappings.find(m => m.id === formData.mappingId);
      
      const newSlot = response.data || { 
        id: Date.now().toString(), 
        mappingId: formData.mappingId,
        facultyName: selectedMapping?.facultyName || '',
        subjectName: selectedMapping?.subjectName || '',
        className: selectedMapping?.className || '',
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
      };
      setSlots([...slots, newSlot]);
      toast({
        title: 'Slot Created',
        description: 'The timetable slot has been created.',
      });
      setIsDialogOpen(false);
      setFormData({ mappingId: '', dayOfWeek: selectedDay, startTime: '', endTime: '' });
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
    if (!selectedSlot) return;

    try {
      await adminAPI.deleteTimetableSlot(selectedSlot.id);
      setSlots(slots.filter(s => s.id !== selectedSlot.id));
      toast({
        title: 'Slot Deleted',
        description: 'The timetable slot has been deleted.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'An error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedSlot(null);
    }
  };

  const openCreateDialog = () => {
    setFormData({ mappingId: '', dayOfWeek: selectedDay, startTime: '', endTime: '' });
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Timetable</h1>
            <p className="text-muted-foreground mt-1">Manage lecture schedules</p>
          </div>
          <Button 
            onClick={openCreateDialog} 
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Slot
          </Button>
        </div>

        {/* Day Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {DAYS.map((day, index) => (
            <button
              key={day}
              onClick={() => setSelectedDay(index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedDay === index
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Timetable Slots */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : slotsForDay.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No slots for {DAYS[selectedDay]}</p>
            <p className="text-sm text-muted-foreground mb-4">Add a timetable slot to get started</p>
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Slot
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {slotsForDay.map((slot) => (
              <div key={slot.id} className="glass-card p-4 flex items-center gap-4 hover-lift">
                <div className="flex items-center gap-3 min-w-[120px]">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{slot.startTime}</p>
                    <p className="text-xs text-muted-foreground">{slot.endTime}</p>
                  </div>
                </div>
                <div className="h-12 w-px bg-border" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{slot.subjectName}</p>
                  <p className="text-sm text-muted-foreground">
                    {slot.facultyName} • {slot.className}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedSlot(slot);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add Timetable Slot</DialogTitle>
            <DialogDescription>
              Create a new lecture slot for {DAYS[formData.dayOfWeek]}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Day</Label>
              <Select
                value={formData.dayOfWeek.toString()}
                onValueChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value) })}
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day, index) => (
                    <SelectItem key={day} value={index.toString()}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Faculty-Subject-Class</Label>
              <Select
                value={formData.mappingId}
                onValueChange={(value) => setFormData({ ...formData, mappingId: value })}
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select mapping" />
                </SelectTrigger>
                <SelectContent>
                  {mappings.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.subjectName} - {m.facultyName} ({m.className})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="bg-secondary/50"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this timetable slot? This action cannot be undone.
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

export default TimetablePage;
