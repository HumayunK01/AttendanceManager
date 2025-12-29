import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  Loader2,
  BookOpen,
  Users,
  Building,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  Filter,
  ArrowRight
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
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

interface TimetableSlot {
  id: string;
  mappingId: string;
  facultyName: string;
  subjectName: string;
  className: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  batchId?: string | null;
  batchName?: string | null;
}

interface Mapping {
  id: string;
  facultyName: string;
  subjectName: string;
  className: string;
  classId: string;
}

interface Batch {
  id: number;
  name: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

const MobileTimetableCard = memo(({
  slot,
  onEdit,
  onDelete,
  formatTime
}: {
  slot: TimetableSlot;
  onEdit: (s: TimetableSlot) => void;
  onDelete: (s: TimetableSlot) => void;
  formatTime: (t: string) => string;
}) => (
  <div className="glass-card p-5 space-y-5 border-border/30 group">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shrink-0 shadow-inner text-primary">
          <Clock className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-black text-foreground tracking-tight tabular-nums">
              {formatTime(slot.startTime)}
            </p>
            <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
            <p className="text-[15px] font-black text-foreground tracking-tight tabular-nums">
              {formatTime(slot.endTime)}
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.15em] opacity-40 mt-1">
            Session Window
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(slot)}
          className="w-9 h-9 rounded-xl hover:bg-primary/10 text-primary transition-all border border-transparent hover:border-primary/20 shrink-0"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(slot)}
          className="w-9 h-9 rounded-xl hover:bg-destructive/10 text-destructive transition-all border border-transparent hover:border-destructive/20 shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>

    <div className="space-y-3">
      <div className="bg-secondary/20 rounded-2xl p-4 border border-white/5 space-y-3 shadow-inner">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Subject Module</p>
          <p className="text-[14px] font-black text-foreground tracking-tight truncate leading-tight">
            {slot.subjectName}
          </p>
        </div>
        <div className="h-[1px] w-full bg-white/5" />
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Instructor Assignment</p>
          <p className="text-[14px] font-black text-foreground tracking-tight truncate leading-tight">
            {slot.facultyName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-[10px] font-black border border-primary/20 uppercase tracking-[0.1em] shadow-sm">
          {slot.className}
        </span>
        {slot.batchName ? (
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-black border border-purple-500/20 uppercase tracking-[0.1em] shadow-sm">
            Practical • {slot.batchName}
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black border border-blue-500/20 uppercase tracking-[0.1em] shadow-sm">
            Theory Session
          </span>
        )}
      </div>
    </div>
  </div>
));

const TableRow = memo(({
  slot,
  onEdit,
  onDelete,
  formatTime
}: {
  slot: TimetableSlot;
  onEdit: (s: TimetableSlot) => void;
  onDelete: (s: TimetableSlot) => void;
  formatTime: (t: string) => string;
}) => (
  <tr className="group hover:bg-white/5 transition-colors duration-200">
    <td className="py-4 px-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-300 shadow-inner text-primary shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors tracking-tight tabular-nums whitespace-nowrap">
            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
          </p>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.15em] opacity-40">Session Time</p>
        </div>
      </div>
    </td>
    <td className="px-6 font-bold text-foreground text-sm tracking-tight">
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="truncate max-w-[200px]">{slot.subjectName}</p>
        <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-tighter">Academic Module</p>
      </div>
    </td>
    <td className="px-6">
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-sm font-bold text-foreground tracking-tight truncate max-w-[180px]">{slot.facultyName}</p>
        <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-tighter">Instructor</p>
      </div>
    </td>
    <td className="px-6">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black border border-primary/20 uppercase tracking-widest shadow-sm">
          {slot.className}
        </span>
        {slot.batchName ? (
          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[9px] font-black border border-purple-500/20 uppercase tracking-wider shadow-sm">
            Practical • {slot.batchName}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-black border border-blue-500/20 uppercase tracking-wider shadow-sm">
            Theory
          </span>
        )}
      </div>
    </td>
    <td className="px-6">
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(slot)}
          className="w-8 h-8 rounded-lg hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all duration-200"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(slot)}
          className="w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all duration-200"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </td>
  </tr>
));

MobileTimetableCard.displayName = 'MobileTimetableCard';
TableRow.displayName = 'TableRow';

TableRow.displayName = 'TableRow';

// --- Main Component ---

const TimetablePage: React.FC = () => {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1); // 1=Monday
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  const [formData, setFormData] = useState({ mappingId: '', dayOfWeek: 1, startTime: '', endTime: '', batchId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
      toast({ title: 'Error', description: 'Failed to synchronize schedule.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSlots = useMemo(() => {
    let result = slots.filter(s => s.dayOfWeek === selectedDay);
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(s =>
        s.facultyName.toLowerCase().includes(q) ||
        s.subjectName.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [slots, selectedDay, searchQuery]);

  const stats = useMemo(() => {
    const total = slots.length;
    const slotsPerDay = DAYS.map((_, idx) => slots.filter(s => s.dayOfWeek === idx + 1).length); // idx+1 because days are 1-6
    const busiestDay = DAYS[slotsPerDay.indexOf(Math.max(...slotsPerDay))] || 'N/A';
    const uniqueFaculty = new Set(slots.map(s => s.facultyName)).size;
    return { total, busiestDay, uniqueFaculty };
  }, [slots]);

  const handleOpenDialog = useCallback((slot?: TimetableSlot) => {
    if (slot) {
      setSelectedSlot(slot);
      setFormData({
        mappingId: slot.mappingId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        batchId: slot.batchId?.toString() || 'none'
      });
    } else {
      setSelectedSlot(null);
      setFormData({ mappingId: '', dayOfWeek: selectedDay, startTime: '', endTime: '', batchId: 'none' });
    }
    setIsDialogOpen(true);
  }, [selectedDay]);

  // Fetch batches when mapping changes
  useEffect(() => {
    const fetchBatches = async () => {
      if (formData.mappingId) {
        const mapping = mappings.find(m => String(m.id) === formData.mappingId);
        if (mapping?.classId) {
          try {
            const response = await adminAPI.getBatches(mapping.classId);
            setBatches(response.data);
          } catch (error) {
            console.error('Failed to fetch batches:', error);
            setBatches([]);
          }
        }
      } else {
        setBatches([]);
      }
    };
    fetchBatches();
  }, [formData.mappingId, mappings]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formData.mappingId || !formData.startTime || !formData.endTime) {
      return toast({ title: 'System Warning', description: 'Configure all session parameters.', variant: 'destructive' });
    }

    setIsSubmitting(true);
    try {
      // Convert 'none' to undefined for Theory lectures
      const payload = {
        ...formData,
        batchId: formData.batchId === 'none' ? undefined : formData.batchId
      };

      if (selectedSlot) {
        await adminAPI.updateTimetableSlot(selectedSlot.id, payload);
        toast({ title: 'Success', description: 'Schedule updated successfully.' });
      } else {
        await adminAPI.createTimetableSlot(payload);
        toast({ title: 'Success', description: 'Session added to timetable.' });
      }
      fetchData();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Deployment Error', description: error.response?.data?.message || 'Schedule conflict detected.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSlot) return;
    try {
      await adminAPI.deleteTimetableSlot(selectedSlot.id);
      setSlots(prev => prev.filter(s => s.id !== selectedSlot.id));
      toast({ title: 'Success', description: 'Session removed from schedule.' });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Deletion failed.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedSlot(null);
    }
  };

  const formatTime = useCallback((time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hr = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    return `${hr % 12 || 12}:${m} ${ampm}`;
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5 tracking-tight">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <span className="truncate">Timetable</span>
            </h1>
            <p className="text-[11px] sm:text-[13px] text-muted-foreground ml-1 font-medium opacity-70">Coordinate institutional lectures across all classes</p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="h-11 sm:h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 rounded-xl px-6 text-sm font-bold w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Schedule Slot
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-border/30 bg-gradient-to-br from-primary/10 to-transparent group hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Weekly Sessions</p>
                <p className="text-3xl font-black text-foreground tracking-tighter tabular-nums">{stats.total}</p>
                <div className="h-1 w-6 bg-primary rounded-full" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                <Clock className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-border/30 bg-gradient-to-br from-accent/10 to-transparent group hover:shadow-xl hover:shadow-accent/5 transition-all duration-500 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Peak Demand</p>
                <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{stats.busiestDay}</p>
                <div className="h-1 w-6 bg-accent rounded-full" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center border border-accent/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-inner">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-border/30 bg-gradient-to-br from-success/10 to-transparent group hover:shadow-xl hover:shadow-success/5 transition-all duration-500 relative overflow-hidden sm:col-span-2 lg:col-span-1">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-success/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Active Experts</p>
                <p className="text-3xl font-black text-foreground tracking-tighter tabular-nums">{stats.uniqueFaculty}</p>
                <div className="h-1 w-6 bg-success rounded-full" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center border border-success/20 group-hover:scale-110 transition-all duration-500 shadow-inner">
                <Users className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <div className="relative w-full lg:max-w-xs group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Filter by subject or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-secondary/30 border-border/50 focus:border-primary/50 rounded-xl transition-all shadow-sm text-sm w-full"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mask-fade-right">
            {DAYS.map((day, idx) => (
              <button
                key={day}
                onClick={() => setSelectedDay(idx + 1)}
                className={cn(
                  "h-9 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap shrink-0",
                  selectedDay === idx + 1
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                    : 'bg-secondary/30 text-muted-foreground border-border/50 hover:bg-secondary/50 active:scale-95'
                )}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 glass-card rounded-2xl border-dashed">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-3 opacity-50" />
            <p className="text-[13px] text-muted-foreground font-medium animate-pulse">Syncing institutional clock...</p>
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-5">
              <Calendar className="w-8 h-8 text-primary/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1.5">No sessions scheduled</h3>
            <p className="text-[13px] text-muted-foreground max-w-sm mb-6">
              Start building your weekly timetable for {DAYS[selectedDay]}.
            </p>
            {!searchQuery && (
              <Button onClick={() => handleOpenDialog()} className="h-9 px-6 rounded-lg font-bold gap-2 text-sm">
                <Plus className="w-4 h-4" /> Add Slot
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block glass-card overflow-hidden rounded-2xl border-border/50 shadow-xl bg-background/50 backdrop-blur-sm">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-secondary/20">
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-[25%] shrink-0">Time Slot</th>
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Academic Module</th>
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-[20%] shrink-0">Instructor</th>
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-[20%] shrink-0">Target Class</th>
                      <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-[100px] shrink-0">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredSlots.map(slot => (
                      <TableRow key={slot.id} slot={slot} onEdit={handleOpenDialog} onDelete={(s) => { setSelectedSlot(s); setIsDeleteDialogOpen(true); }} formatTime={formatTime} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-secondary/10 py-3.5 px-6 border-t border-border/50 flex items-center justify-between text-[10px] font-bold text-muted-foreground/40 tracking-[0.25em] uppercase">
                <span>{filteredSlots.length} Sessions on {DAYS[selectedDay - 1]}</span>
                <span className="text-[9px] bg-secondary/20 px-2 py-0.5 rounded-md border border-border/10">Sync Horizon v1.4</span>
              </div>
            </div>

            {/* Mobile View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredSlots.map(slot => (
                <MobileTimetableCard key={slot.id} slot={slot} onEdit={handleOpenDialog} onDelete={(s) => { setSelectedSlot(s); setIsDeleteDialogOpen(true); }} formatTime={formatTime} />
              ))}
              <div className="py-2 text-center text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">
                Registry Bottom / {DAYS[selectedDay - 1]}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Creator/Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50 sm:max-w-md rounded-3xl shadow-2xl">
          <DialogHeader className="pt-2 px-1">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {selectedSlot ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
              {selectedSlot ? 'Modify Session' : 'New Schedule Slot'}
            </DialogTitle>
            <DialogDescription className="text-[13px] mt-1">
              Configure timing and instructor assignment for this session.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="space-y-4 px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Operating Day</Label>
                  <Select value={formData.dayOfWeek.toString()} onValueChange={v => setFormData(f => ({ ...f, dayOfWeek: parseInt(v) }))}>
                    <SelectTrigger className="h-10 bg-secondary/50 border-border/50 rounded-xl text-sm capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 backdrop-blur-xl">
                      {DAYS.map((d, i) => <SelectItem key={i} value={(i + 1).toString()}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Mapped Entity</Label>
                  <Select value={formData.mappingId} onValueChange={v => setFormData(f => ({ ...f, mappingId: v }))}>
                    <SelectTrigger className="h-10 bg-secondary/50 border-border/50 rounded-xl text-sm">
                      <SelectValue placeholder="Select Mapping">
                        {formData.mappingId ? (
                          mappings.find(m => String(m.id) === formData.mappingId)?.subjectName
                        ) : (
                          "Select Mapping"
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 backdrop-blur-xl max-h-[250px]">
                      {mappings.map(m => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          <div className="flex flex-col text-left py-0.5">
                            <span className="font-bold">{m.subjectName}</span>
                            <span className="text-[10px] opacity-60 font-medium">{m.facultyName} • {m.className}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 flex-1">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-foreground/70 ml-1">Start Time</Label>
                  <div className="relative group/time">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within/time:text-primary transition-colors pointer-events-none z-10" />
                    <Input
                      type="time"
                      value={(formData.startTime || '').substring(0, 5)}
                      onChange={e => setFormData(f => ({ ...f, startTime: e.target.value }))}
                      className="h-10 pl-9 bg-secondary/50 border-border/50 rounded-xl text-sm focus:ring-1 focus:ring-primary/20 [color-scheme:dark] text-foreground font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 flex-1">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-foreground/70 ml-1">End Time</Label>
                  <div className="relative group/time">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within/time:text-primary transition-colors pointer-events-none z-10" />
                    <Input
                      type="time"
                      value={(formData.endTime || '').substring(0, 5)}
                      onChange={e => setFormData(f => ({ ...f, endTime: e.target.value }))}
                      className="h-10 pl-9 bg-secondary/50 border-border/50 rounded-xl text-sm focus:ring-1 focus:ring-primary/20 [color-scheme:dark] text-foreground font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Batch Selector - Theory vs Practical */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Lecture Type</Label>
                <Select value={formData.batchId} onValueChange={v => setFormData(f => ({ ...f, batchId: v }))} disabled={!formData.mappingId}>
                  <SelectTrigger className="h-10 bg-secondary/50 border-border/50 rounded-xl text-sm">
                    <SelectValue placeholder="Select mapping first">
                      {formData.batchId === 'none' ? (
                        <span className="flex items-center gap-2">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[9px] font-black border border-blue-500/20">THEORY</span>
                          All Students
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 text-[9px] font-black border border-purple-500/20">PRACTICAL</span>
                          {batches.find(b => b.id.toString() === formData.batchId)?.name}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 backdrop-blur-xl">
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[9px] font-black border border-blue-500/20">THEORY</span>
                        <span className="text-sm">All Students</span>
                      </div>
                    </SelectItem>
                    {batches.length > 0 ? (
                      batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 text-[9px] font-black border border-purple-500/20">PRACTICAL</span>
                            <span className="text-sm">{batch.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                        {formData.mappingId ? 'No batches available for this class' : 'Select a mapping first'}
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {batches.length > 0 && (
                  <p className="text-[10px] text-muted-foreground italic">
                    {batches.length} batch{batches.length !== 1 ? 'es' : ''} available for practical lectures
                  </p>
                )}
              </div>


              <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-widest italic">
                  System automatically checks for scheduling conflicts across faculty and classes.
                </p>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/20 px-1 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold h-10 text-sm">Discard</Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all h-10 text-sm">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (selectedSlot ? 'Save Changes' : 'Confirm Slot')}
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
            <AlertDialogTitle className="text-xl font-black text-center tracking-tight">Confirm Removal</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[13px] mt-1">
              Are you sure you want to remove the <span className="font-black text-foreground">{selectedSlot?.subjectName}</span> session? <br />
              This action will permanently purge it from the {DAYS[selectedSlot?.dayOfWeek || 0]} schedule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl font-bold h-10 text-sm px-6">Discard</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-white rounded-xl font-black h-10 text-sm px-6 shadow-lg shadow-destructive/20">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default TimetablePage;
