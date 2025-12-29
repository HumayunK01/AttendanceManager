import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, User, Users, MapPin, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { studentAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatTime12Hour } from '@/lib/timeUtils';

interface TimetableSlot {
    id: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    subjectName: string;
    facultyName: string | null;
    batchName: string | null;
    batchId: number | null;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
];

const StudentTimetable: React.FC = () => {
    const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1); // Default to Monday if Sunday

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            const response = await studentAPI.getTimetable();
            setTimetable(response.data);
        } catch (error) {
            console.error('Failed to fetch timetable:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getDaySlots = (dayIndex: number) => {
        return timetable.filter(slot => slot.dayOfWeek === dayIndex);
    };

    if (isLoading) {
        return (
            <StudentLayout>
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                    <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Generating Your Schedule...</p>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="max-w-[1600px] mx-auto space-y-6 animate-fade-in pb-8 px-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-foreground tracking-tighter flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-primary" />
                            Academic Timetable
                        </h1>
                        <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em]">
                            Centralized View • Semester SH 2025
                        </p>
                    </div>
                </div>

                {/* Mobile Day Selector */}
                <div className="flex lg:hidden items-center justify-between glass-card p-2 border-white/5">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedDay(prev => prev > 1 ? prev - 1 : 6)}
                        className="active:scale-90"
                    >
                        <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <div className="text-center">
                        <span className="font-black text-[10px] uppercase tracking-[0.3em] text-muted-foreground/50 block">Selected Day</span>
                        <span className="font-black text-sm uppercase tracking-widest text-primary">{DAYS[selectedDay - 1]}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedDay(prev => prev < 6 ? prev + 1 : 1)}
                        className="active:scale-90"
                    >
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </Button>
                </div>

                {/* Desktop View: Engineered Grid (Time on X, Days on Y) */}
                <div className="hidden lg:block glass-card overflow-hidden border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.3)] bg-[#0a0a0b] p-1">
                    <div className="grid grid-cols-[140px_repeat(4,1fr)_80px_repeat(3,1fr)] grid-rows-[90px_repeat(6,120px)] border-collapse rounded-2xl overflow-hidden bg-background/20">
                        {/* Corner Control */}
                        <div className="p-4 border-b border-r border-white/5 bg-[#0e0e10] flex flex-col items-center justify-center sticky top-0 left-0 z-30 group">
                            <Calendar className="w-5 h-5 text-primary/40 group-hover:text-primary transition-colors duration-500" />
                            <div className="mt-2 text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">6-Day Cycle</div>
                        </div>

                        {/* Time Map (X-Axis) */}
                        {[...TIME_SLOTS.slice(0, 4), 'LUNCH', ...TIME_SLOTS.slice(5)].map((time, idx) => (
                            <div key={time} className={cn(
                                "flex flex-col items-center justify-center border-b border-r border-white/5 sticky top-0 z-20 backdrop-blur-xl transition-all duration-300",
                                time === 'LUNCH' ? "bg-primary/[0.04] border-x border-primary/10" : "bg-[#0e0e10]/95"
                            )}>
                                {time === 'LUNCH' ? (
                                    <div className="flex flex-col items-center gap-1.5">
                                        <span className="text-[11px] font-black text-primary tracking-widest uppercase">{formatTime12Hour('13:00')}</span>
                                        <div className="flex items-center gap-2 my-0.5 opacity-30">
                                            <div className="w-1 h-1 rounded-full bg-primary" />
                                            <div className="w-6 h-[1px] bg-primary/50" />
                                            <div className="w-1 h-1 rounded-full bg-primary" />
                                        </div>
                                        <span className="text-[11px] font-black text-primary/60 tracking-widest uppercase">
                                            {formatTime12Hour('14:00')}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[11px] font-black text-foreground tracking-widest uppercase">{formatTime12Hour(time)}</span>
                                            <div className="flex items-center gap-2 my-1 opacity-20">
                                                <div className="w-1 h-1 rounded-full bg-primary" />
                                                <div className="w-6 h-[1px] bg-primary/50" />
                                                <div className="w-1 h-1 rounded-full bg-primary" />
                                            </div>
                                            <span className="text-[11px] font-black text-muted-foreground/60 tracking-widest uppercase">
                                                {formatTime12Hour(`${parseInt(time.split(':')[0]) + 1}:00`)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Day Sequence (Y-Axis) */}
                        {DAYS.map((day, idx) => (
                            <div
                                key={day}
                                className={cn(
                                    "border-b border-r border-white/5 flex flex-col items-center justify-center bg-[#0B0B0D] sticky left-0 z-20 group transition-all duration-500",
                                    new Date().getDay() === idx + 1 ? "bg-primary/[0.02]" : "hover:bg-white/[0.01]"
                                )}
                                style={{ gridRow: `${idx + 2}` }}
                            >
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300",
                                    new Date().getDay() === idx + 1 ? "text-primary scale-110" : "text-muted-foreground/50 group-hover:text-foreground/80"
                                )}>{day}</span>
                                {new Date().getDay() === idx + 1 && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-primary animate-ping" />
                                        <span className="text-[8px] font-black text-primary/60 uppercase tracking-widest">Today</span>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Background Grid Infrastructure */}
                        {DAYS.map((_, dIdx) => (
                            [...TIME_SLOTS.slice(0, 4), 'LUNCH', ...TIME_SLOTS.slice(5)].map((_, tIdx) => (
                                <div key={`${dIdx}-${tIdx}`} className="border-b border-r border-white/5 bg-transparent" />
                            ))
                        ))}

                        {/* Static Lunch Column (Visual Only) */}
                        <div
                            className="col-start-6 col-end-7 row-start-2 row-end-8 bg-primary/[0.02] flex flex-col items-center justify-around border-x border-primary/5 z-10 pointer-events-none"
                        >
                            {'BREAK'.split('').map((char, i) => (
                                <span key={i} className="text-xs font-black text-primary/10 select-none tracking-tighter">{char}</span>
                            ))}
                        </div>

                        {/* Dynamic Course Assignments */}
                        {(() => {
                            // Helper to process and group slots
                            const processedSlots = new Map<string, TimetableSlot[]>();

                            timetable.forEach(slot => {
                                const key = `${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`;
                                if (!processedSlots.has(key)) {
                                    processedSlots.set(key, []);
                                }
                                processedSlots.get(key)?.push(slot);
                            });

                            return Array.from(processedSlots.values()).map((group, groupIdx) => {
                                const firstSlot = group[0];
                                const startHour = parseInt(firstSlot.startTime.split(':')[0]);
                                const endHour = parseInt(firstSlot.endTime.split(':')[0]);
                                const duration = endHour - startHour;
                                const dayRow = firstSlot.dayOfWeek + 1;

                                // Linear Grid Logic
                                const colStart = startHour - 9 + 2;
                                let colEnd = colStart + duration;

                                // Handle Lunch Crossing (12:00 to 14:00 spans 3 grid units)
                                if (startHour < 13 && endHour > 13) {
                                    colEnd += 1;
                                }

                                if (dayRow < 2 || dayRow > 7) return null;

                                return (
                                    <div
                                        key={`group-${groupIdx}`}
                                        style={{
                                            gridRow: `${dayRow}`,
                                            gridColumn: `${colStart} / ${colEnd}`
                                        }}
                                        className={cn(
                                            "p-1.5 z-10 flex flex-col gap-1",
                                            duration === 1 ? "w-[160px]" : "w-full"
                                        )}
                                    >
                                        {group.map((slot, idx) => (
                                            <div
                                                key={slot.id}
                                                className={cn(
                                                    "w-full rounded-lg px-2 flex flex-col justify-center transition-all duration-300 border shadow-lg group relative overflow-hidden",
                                                    slot.batchName
                                                        ? "bg-[#0F0A16] border-purple-500/10 hover:border-purple-500/30"
                                                        : !slot.facultyName
                                                            ? "bg-[#0A1610] border-emerald-500/10 hover:border-emerald-500/30"
                                                            : "bg-[#09090B] border-white/[0.03] hover:border-primary/30",
                                                    "cursor-default flex-1 py-1"
                                                )}
                                            >
                                                <div className="flex items-center justify-between gap-1.5 relative z-10 min-h-0">
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className={cn(
                                                            "font-bold tracking-tight uppercase leading-none line-clamp-2",
                                                            slot.batchName ? "text-foreground/90" : !slot.facultyName ? "text-emerald-500" : "text-foreground/90",
                                                            group.length > 2
                                                                ? (slot.batchName ? "text-[10px]" : "text-[10px]")
                                                                : (slot.batchName ? "text-[11px]" : "text-[13px]")
                                                        )}>
                                                            {slot.subjectName}
                                                        </h4>
                                                        {!slot.batchName && (
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <div className={cn(
                                                                    "w-[2px] rounded-full",
                                                                    !slot.facultyName ? "bg-emerald-500/50" : "bg-primary/50",
                                                                    group.length > 1 ? "h-1.5" : "h-2"
                                                                )} />
                                                                <p className={cn(
                                                                    "font-black tracking-wider uppercase leading-none line-clamp-1",
                                                                    !slot.facultyName ? "text-emerald-500/50" : "text-muted-foreground/50",
                                                                    group.length > 2 ? "text-[8px]" : "text-[9px]"
                                                                )}>
                                                                    {slot.facultyName || "Self Study"}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {slot.batchName && (
                                                        <div className={cn(
                                                            "flex-shrink-0 rounded bg-purple-500/5 border border-purple-500/10 flex items-center justify-center",
                                                            group.length > 2 ? "px-1 h-4" : "px-1.5 h-5"
                                                        )}>
                                                            <span className={cn(
                                                                "font-black text-purple-400 uppercase tracking-wider",
                                                                group.length > 2 ? "text-[8px]" : "text-[9px]"
                                                            )}>
                                                                {slot.batchName}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                {/* Mobile View: List based on Selected Day */}
                <div className="lg:hidden space-y-4">
                    {TIME_SLOTS.map(time => {
                        const slots = getDaySlots(selectedDay).filter(s => s.startTime.startsWith(time.split(':')[0]));

                        if (time === '13:00') {
                            return (
                                <div key={time} className="glass-card p-4 flex items-center justify-center border-primary/10 bg-primary/5">
                                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40">LUNCH BREAK</span>
                                </div>
                            );
                        }

                        return (
                            <div key={time} className="space-y-3">
                                {slots.length > 0 ? (
                                    slots.map(slot => (
                                        <div key={slot.id} className={cn(
                                            "glass-card p-4 border-white/5 relative overflow-hidden group active:scale-[0.98] transition-all duration-300",
                                            slot.batchName
                                                ? "bg-[#0F0A16]/40"
                                                : !slot.facultyName
                                                    ? "bg-[#0A1610]/40"
                                                    : "bg-[#09090B]/40"
                                        )}>
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-[3px] h-10 rounded-full",
                                                    slot.batchName ? "bg-purple-500" : !slot.facultyName ? "bg-emerald-500" : "bg-primary"
                                                )} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-2.5 h-2.5 text-muted-foreground/30" />
                                                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-tighter">
                                                                {formatTime12Hour(slot.startTime)} - {formatTime12Hour(slot.endTime)}
                                                            </span>
                                                        </div>
                                                        {slot.batchName ? (
                                                            <span className="text-[7px] font-black text-purple-400/40 uppercase tracking-widest">
                                                                {slot.batchName}
                                                            </span>
                                                        ) : !slot.facultyName && (
                                                            <span className="text-[7px] font-black text-emerald-500/40 uppercase tracking-widest">
                                                                PROJECT
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className={cn(
                                                        "text-[14px] font-black tracking-tight uppercase leading-tight truncate mb-0.5",
                                                        !slot.facultyName && !slot.batchName ? "text-emerald-500" : "text-foreground/90"
                                                    )}>
                                                        {slot.subjectName}
                                                    </h3>
                                                    <p className={cn(
                                                        "text-[10px] font-black tracking-wider uppercase truncate",
                                                        !slot.facultyName ? "text-emerald-500/50" : "text-muted-foreground/60"
                                                    )}>
                                                        {slot.facultyName || "Self Study"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center gap-4 px-4 py-3 opacity-20">
                                        <span className="text-[10px] font-black text-muted-foreground">{formatTime12Hour(time)}</span>
                                        <div className="h-px flex-1 bg-border" />
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">No Lecture</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </StudentLayout>
    );
};

// Simple Button component for day selection since I don't have the full UI library context
const Button: React.FC<any> = ({ children, variant, size, className, ...props }) => (
    <button
        className={cn(
            "inline-flex items-center justify-center rounded-xl transition-all duration-300 font-bold",
            variant === 'ghost' ? "hover:bg-secondary/50" : "bg-primary text-primary-foreground hover:opacity-90",
            size === 'icon' ? "w-10 h-10" : "px-4 py-2 text-sm",
            className
        )}
        {...props}
    >
        {children}
    </button>
);

export default StudentTimetable;
