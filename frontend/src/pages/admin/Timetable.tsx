import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Trash2, Calendar, Clock, Loader2, BookOpen, Users, Building } from 'lucide-react';
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
      setIsLoading(true);
      const [slotsRes, mappingsRes] = await Promise.all([
        adminAPI.getTimetable(),
        adminAPI.getMappings()
      ]);
      setSlots(slotsRes.data);
      setMappings(mappingsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load timetable. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized slots for selected day
  const slotsForDay = useMemo(() => {
    return slots
      .filter(s => s.dayOfWeek === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [slots, selectedDay]);

  // Memoized stats
  const stats = useMemo(() => {
    const totalSlots = slots.length;
    const slotsPerDay = DAYS.map((_, idx) => slots.filter(s => s.dayOfWeek === idx).length);
    const busiestDay = slotsPerDay.indexOf(Math.max(...slotsPerDay));
    const uniqueFaculty = new Set(slots.map(s => s.facultyName)).size;
    const uniqueSubjects = new Set(slots.map(s => s.subjectName)).size;

    return { totalSlots, busiestDay, uniqueFaculty, uniqueSubjects };
  }, [slots]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setFormData({ mappingId: '', dayOfWeek: selectedDay, startTime: '', endTime: '' });
  }, [selectedDay]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.mappingId || !formData.startTime || !formData.endTime) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    // Validate time range
    if (formData.startTime >= formData.endTime) {
      toast({
        title: 'Validation Error',
        description: 'End time must be after start time.',
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
        title: 'Success',
        description: 'Timetable slot created successfully.',
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
    if (!selectedSlot) return;

    try {
      await adminAPI.deleteTimetableSlot(selectedSlot.id);
      setSlots(slots.filter(s => s.id !== selectedSlot.id));
      toast({
        title: 'Success',
        description: 'Timetable slot deleted successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete slot.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedSlot(null);
    }
  };

  const openCreateDialog = useCallback(() => {
    setFormData({ mappingId: '', dayOfWeek: selectedDay, startTime: '', endTime: '' });
    setIsDialogOpen(true);
  }, [selectedDay]);

  const formatTime = useCallback((time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 lg:w-7 lg:h-7 text-primary" />
              </div>
              Timetable
            </h1>
            <p className="text-muted-foreground mt-2 text-sm lg:text-base">
              Manage weekly lecture schedules
            </p>
          </div>
          <Button
            onClick={openCreateDialog}
            className="gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            size="lg"
          >
            <Plus className="w-5 h-5" />
            Add Slot
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Total Slots</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalSlots}</p>
          </div>
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">Busiest Day</p>
            </div>
            <p className="text-2xl font-bold text-accent">{DAYS[stats.busiestDay]}</p>
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
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-warning" />
              </div>
              <p className="text-sm text-muted-foreground">Active Subjects</p>
            </div>
            <p className="text-2xl font-bold text-warning">{stats.uniqueSubjects}</p>
          </div>
        </div>

        {/* Day Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {DAYS.map((day, index) => (
            <button
              key={day}
              onClick={() => setSelectedDay(index)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border-2 ${selectedDay === index
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                  : 'bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground hover:border-border'
                }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Timetable Slots */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading timetable...</p>
          </div>
        ) : slotsForDay.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No slots for {DAYS[selectedDay]}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Add a timetable slot to schedule lectures for this day.
            </p>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Slot for {DAYS[selectedDay]}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {slotsForDay.map((slot) => (
                <div key={slot.id} className="glass-card p-5 flex items-center gap-4 hover-lift group">
                  {/* Time Section */}
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform border-2 border-primary/20">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground">{formatTime(slot.startTime)}</p>
                      <p className="text-sm text-muted-foreground">{formatTime(slot.endTime)}</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-14 w-px bg-border/50" />

                  {/* Details Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-lg mb-1 group-hover:text-primary transition-colors truncate">
                          {slot.subjectName}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="w-4 h-4 text-success" />
                            <span>{slot.facultyName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Building className="w-4 h-4 text-warning" />
                            <span>{slot.className}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSlot(slot);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0"
                        aria-label={`Delete ${slot.subjectName} slot`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Slot Count */}
            <div className="text-sm text-muted-foreground text-center">
              {slotsForDay.length} slot{slotsForDay.length !== 1 ? 's' : ''} scheduled for {DAYS[selectedDay]}
            </div>
          </>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Add Timetable Slot</DialogTitle>
            <DialogDescription>
              Create a new lecture slot for {DAYS[formData.dayOfWeek]}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Day <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.dayOfWeek.toString()}
                  onValueChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value) })}
                >
                  <SelectTrigger className="bg-secondary/50 border-border/50 focus:border-primary">
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
                <Label className="text-sm font-medium">
                  Faculty-Subject-Class <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.mappingId}
                  onValueChange={(value) => setFormData({ ...formData, mappingId: value })}
                >
                  <SelectTrigger className="bg-secondary/50 border-border/50 focus:border-primary">
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
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" />
                    Start Time <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="bg-secondary/50 border-border/50 focus:border-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" />
                    End Time <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="bg-secondary/50 border-border/50 focus:border-primary"
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
                Create Slot
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Delete Timetable Slot</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete the <span className="font-semibold text-foreground">{selectedSlot?.subjectName}</span> slot
              on <span className="font-semibold text-foreground">{selectedSlot && DAYS[selectedSlot.dayOfWeek]}</span> at{' '}
              <span className="font-semibold text-foreground">{selectedSlot && formatTime(selectedSlot.startTime)}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete Slot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default TimetablePage;
