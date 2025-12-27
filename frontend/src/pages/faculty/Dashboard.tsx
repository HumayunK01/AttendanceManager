import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Users, Play, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import FacultyLayout from '@/layouts/FacultyLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface TimetableSlot {
  id: string;
  subjectName: string;
  className: string;
  startTime: string;
  endTime: string;
  studentCount?: number;
  sessionId?: string;
  sessionStatus?: 'not_started' | 'in_progress' | 'completed';
}

const FacultyDashboard: React.FC = () => {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchTodaySchedule();
  }, []);

  const fetchTodaySchedule = async () => {
    try {
      setIsLoading(true);

      const response = await api.get('/faculty/today-timetable');
      const timetableData = response.data || [];

      // Transform and enrich the data
      const enrichedSlots = timetableData.map((slot: any) => {
        // Determine status based on existing session or time
        let sessionStatus: 'not_started' | 'in_progress' | 'completed';

        if (slot.session_id) {
          // Session exists
          if (slot.session_locked) {
            sessionStatus = 'completed';
          } else {
            sessionStatus = 'in_progress';
          }
        } else {
          // No session yet, check time
          sessionStatus = determineSessionStatus(slot.start_time, slot.end_time);
        }

        return {
          id: slot.timetable_slot_id,
          subjectName: slot.subject,
          className: slot.class,
          startTime: slot.start_time,
          endTime: slot.end_time,
          studentCount: 0,
          sessionId: slot.session_id || undefined,
          sessionStatus,
        };
      });

      setSlots(enrichedSlots);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to load today\'s schedule.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const determineSessionStatus = (startTime: string, endTime: string): 'not_started' | 'in_progress' | 'completed' => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const slotStart = startHour * 60 + startMin;
    const slotEnd = endHour * 60 + endMin;

    if (currentTime < slotStart) return 'not_started';
    if (currentTime >= slotStart && currentTime <= slotEnd) return 'in_progress';
    return 'completed';
  };

  const handleStartSession = async (slot: TimetableSlot) => {
    try {
      const response = await api.post('/attendance/session', {
        timetableSlotId: slot.id,
      });

      const sessionId = response.data?.sessionId;
      toast({
        title: 'Session Started',
        description: 'Attendance session has been created.',
      });
      navigate(`/faculty/attendance/${sessionId}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to start session.',
        variant: 'destructive',
      });
    }
  };

  const stats = useMemo(() => {
    const total = slots.length;
    const completed = slots.filter(s => s.sessionStatus === 'completed').length;
    const inProgress = slots.filter(s => s.sessionStatus === 'in_progress').length;
    const upcoming = slots.filter(s => s.sessionStatus === 'not_started').length;
    return { total, completed, inProgress, upcoming };
  }, [slots]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <FacultyLayout>
      <div className="space-y-5 animate-fade-in pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-xl font-black text-foreground tracking-tight">Today's Schedule</h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              {today}
            </p>
          </div>
          <div className="glass-card px-4 py-2 inline-flex items-center gap-2 rounded-xl border border-border/50">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[11px] font-black text-foreground uppercase tracking-wider">{stats.total} Lectures</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="glass-card p-4 rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Total</p>
                <p className="text-2xl font-black text-primary tracking-tighter">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
          <div className="glass-card p-4 rounded-xl border border-border/50 bg-gradient-to-br from-warning/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Active</p>
                <p className="text-2xl font-black text-warning tracking-tighter">{stats.inProgress}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
            </div>
          </div>
          <div className="glass-card p-4 rounded-xl border border-border/50 bg-gradient-to-br from-success/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Done</p>
                <p className="text-2xl font-black text-success tracking-tighter">{stats.completed}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center border border-success/20">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
            </div>
          </div>
          <div className="glass-card p-4 rounded-xl border border-border/50 bg-gradient-to-br from-accent/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Upcoming</p>
                <p className="text-2xl font-black text-accent tracking-tighter">{stats.upcoming}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                <Clock className="w-5 h-5 text-accent" />
              </div>
            </div>
          </div>
        </div>

        {/* Lectures List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 glass-card rounded-xl border-dashed">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2 opacity-50" />
            <p className="text-[11px] text-muted-foreground font-medium animate-pulse">Loading schedule...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-12 text-center rounded-xl">
            <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-primary/40" />
            </div>
            <h3 className="text-lg font-black text-foreground mb-1">No Lectures Today</h3>
            <p className="text-[11px] text-muted-foreground max-w-sm">
              You have no classes scheduled for today. Enjoy your day off!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className={cn(
                  "glass-card p-4 rounded-xl border transition-all duration-300 hover:shadow-md",
                  slot.sessionStatus === 'in_progress' && "border-l-4 border-warning bg-warning/5"
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  {/* Time */}
                  <div className="flex items-center gap-2.5 lg:min-w-[120px]">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-base font-black text-foreground tracking-tight">{slot.startTime}</p>
                      <p className="text-[10px] text-muted-foreground font-bold">{slot.endTime}</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden lg:block h-10 w-px bg-border" />

                  {/* Subject Info */}
                  <div className="flex-1">
                    <h3 className="text-[15px] font-black text-foreground tracking-tight mb-0.5">{slot.subjectName}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground font-medium">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {slot.className}
                      </span>
                    </div>
                  </div>

                  {/* Status & Action */}
                  <div className="flex items-center gap-2">
                    {slot.sessionStatus === 'completed' && (
                      <>
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-success/10 text-success text-[9px] font-black border border-success/20 uppercase tracking-wider">
                          Completed
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/faculty/attendance/${slot.sessionId}`)}
                          className="h-9 px-4 rounded-xl text-[11px] font-black uppercase tracking-wider"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1.5" />
                          Report
                        </Button>
                      </>
                    )}

                    {slot.sessionStatus === 'in_progress' && (
                      <>
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-warning/10 text-warning text-[9px] font-black border border-warning/20 uppercase tracking-wider">
                          In Progress
                        </span>
                        <Button
                          onClick={() => navigate(`/faculty/attendance/${slot.sessionId}`)}
                          variant="outline"
                          size="sm"
                          className="h-9 px-4 rounded-xl border-warning text-warning hover:bg-warning/10 text-[11px] font-black uppercase tracking-wider"
                        >
                          Continue
                        </Button>
                      </>
                    )}

                    {slot.sessionStatus === 'not_started' && (
                      <>
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-muted text-muted-foreground text-[9px] font-black border border-border uppercase tracking-wider">
                          Upcoming
                        </span>
                        <Button
                          onClick={() => handleStartSession(slot)}
                          size="sm"
                          className="h-9 px-4 rounded-xl bg-success hover:bg-success/90 text-success-foreground shadow-md shadow-success/20 text-[11px] font-black uppercase tracking-wider"
                        >
                          <Play className="w-3.5 h-3.5 mr-1.5" />
                          Start
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FacultyLayout>
  );
};

export default FacultyDashboard;
