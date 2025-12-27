import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, ArrowLeft, Info } from 'lucide-react';
import FacultyLayout from '@/layouts/FacultyLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatTime12Hour } from '@/lib/timeUtils';

interface TimetableSlot {
    id: string;
    subjectName: string;
    className: string;
    startTime: string;
    endTime: string;
}

// Map route day numbers to day names
const dayMap: { [key: number]: string } = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
};

const FacultySchedule: React.FC = () => {
    const { day } = useParams<{ day: string }>();
    const [slots, setSlots] = useState<TimetableSlot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { toast } = useToast();

    const dayNumber = parseInt(day || '1');
    const dayName = dayMap[dayNumber] || 'Unknown';

    useEffect(() => {
        fetchDaySchedule();
    }, [day]);

    const fetchDaySchedule = async () => {
        try {
            setIsLoading(true);

            const response = await api.get('/faculty/today-timetable');
            const timetableData = response.data || [];

            console.log('All timetable data:', timetableData.map((s: any) => ({ subject: s.subject, day_of_week: s.day_of_week })));
            console.log('Filtering for day:', dayNumber, 'which is', dayName);

            // Filter for the selected day
            const daySlots = timetableData
                .filter((slot: any) => slot.day_of_week === dayNumber)
                .map((slot: any) => ({
                    id: slot.timetable_slot_id,
                    subjectName: slot.subject,
                    className: slot.class,
                    startTime: slot.start_time,
                    endTime: slot.end_time,
                }));

            console.log('Found slots:', daySlots);
            setSlots(daySlots);
        } catch (error) {
            console.error('Failed to fetch schedule:', error);
            toast({
                title: 'Error',
                description: 'Failed to load schedule.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FacultyLayout>
            <div className="space-y-5 animate-fade-in pb-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/faculty')}
                        className="w-9 h-9 rounded-xl hover:bg-primary/10"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="space-y-0.5">
                        <h1 className="text-xl font-black text-foreground tracking-tight">{dayName}'s Schedule</h1>
                        <p className="text-[11px] text-muted-foreground font-medium">
                            View-only schedule for {dayName}
                        </p>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="glass-card p-4 rounded-xl border border-primary/20 bg-primary/5">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Info className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-foreground mb-1">View Only</p>
                            <p className="text-[11px] text-muted-foreground">
                                This is a read-only view of your {dayName} schedule. To start attendance sessions, go to Today's Schedule.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Schedule List */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 glass-card rounded-xl border-dashed">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                        <p className="text-[11px] text-muted-foreground font-medium">Loading schedule...</p>
                    </div>
                ) : slots.length === 0 ? (
                    <div className="glass-card flex flex-col items-center justify-center py-12 text-center rounded-xl">
                        <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                            <Calendar className="w-7 h-7 text-primary/40" />
                        </div>
                        <h3 className="text-lg font-black text-foreground mb-1">No Classes on {dayName}</h3>
                        <p className="text-[11px] text-muted-foreground max-w-sm">
                            You don't have any classes scheduled for {dayName}.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {slots.map((slot) => (
                            <div
                                key={slot.id}
                                className="glass-card p-4 rounded-xl border border-border/50 transition-all duration-300"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                                    {/* Time */}
                                    <div className="flex items-center gap-2.5 lg:min-w-[120px]">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <Clock className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-foreground tracking-tight">{formatTime12Hour(slot.startTime)}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold">{formatTime12Hour(slot.endTime)}</p>
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
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </FacultyLayout>
    );
};

export default FacultySchedule;
