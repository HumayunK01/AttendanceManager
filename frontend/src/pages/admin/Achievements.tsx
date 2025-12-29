import React, { useState, useEffect } from 'react';
import {
    Award,
    Plus,
    Trash2,
    AlertCircle,
    Loader2,
    Crown,
    BookOpen,
    Shield,
    Flame,
    CheckCircle,
    Info,
    Star,
    Zap,
    Target,
    Trophy,
    Medal,
    GraduationCap,
    Clock,
    Calendar,
    Users,
    Activity
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { adminAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Achievement {
    id: number;
    title: string;
    description: string;
    icon: string;
    criteria: any;
}

const AchievementsPage = () => {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Form State
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newIcon, setNewIcon] = useState('Award');
    const [criteriaType, setCriteriaType] = useState('perfect_subject');
    const [criteriaValue, setCriteriaValue] = useState<number>(0);
    const [criteriaExtra, setCriteriaExtra] = useState<number>(0);

    const icons = [
        'Award', 'Crown', 'BookOpen', 'Shield', 'Flame', 'CheckCircle',
        'Star', 'Zap', 'Target', 'Trophy', 'Medal', 'GraduationCap',
        'Clock', 'Calendar', 'Users', 'Activity'
    ];
    const criteriaTypes = [
        { value: 'perfect_subject', label: '100% Attendance in Subject' },
        { value: 'min_overall', label: 'Min Overall %' },
        { value: 'no_absent_days', label: 'No Absents in Last X Days' },
        { value: 'all_subjects_min', label: 'Min % in All Subjects' },
        { value: 'min_subjects_above_x', label: 'X Subjects Above %' },
        { value: 'max_absent_days_streak', label: 'Max Days Absent Streak (Negative)' }, // Example of broader logic
        { value: 'early_bird', label: 'Early Arrival (Future)' }, // Placeholder for future logic
    ];

    useEffect(() => {
        fetchAchievements();
    }, []);

    const fetchAchievements = async () => {
        try {
            const res = await adminAPI.getAchievements();
            setAchievements(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            const criteriaPayload: any = { type: criteriaType };
            if (criteriaType !== 'perfect_subject' && criteriaType !== 'min_subjects_above_x') {
                criteriaPayload.value = Number(criteriaValue);
            }
            if (criteriaType === 'min_subjects_above_x') {
                criteriaPayload.percentage = Number(criteriaValue);
                criteriaPayload.count = Number(criteriaExtra);
            }

            await adminAPI.createAchievement({
                title: newTitle,
                description: newDesc,
                icon: newIcon,
                criteria: criteriaPayload
            });

            toast({ title: 'Success', description: 'Achievement created successfully' });
            setIsAddOpen(false);
            fetchAchievements();

            // Reset form
            setNewTitle('');
            setNewDesc('');
            setCriteriaValue(0);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to create achievement', variant: 'destructive' });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure? This will remove the achievement for all students.')) return;
        try {
            await adminAPI.deleteAchievement(id);
            toast({ title: 'Deleted', description: 'Achievement removed' });
            fetchAchievements();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete achievement', variant: 'destructive' });
        }
    };

    const IconComponent = ({ name, className }: { name: string, className?: string }) => {
        const iconsMap: any = {
            Crown, Award, BookOpen, Shield, Flame, CheckCircle,
            Star, Zap, Target, Trophy, Medal, GraduationCap,
            Clock, Calendar, Users, Activity
        };
        const Icon = iconsMap[name] || Award;
        return <Icon className={className} />;
    };

    const getCriteriaLabel = (criteria: any) => {
        if (!criteria || typeof criteria !== 'object') return 'Custom Rule';
        switch (criteria.type) {
            case 'perfect_subject': return '100% Subject Attendance';
            case 'min_overall': return `Min ${criteria.value}% Overall`;
            case 'no_absent_days': return `No Absents in ${criteria.value} Days`;
            case 'all_subjects_min': return `Min ${criteria.value}% in All Subjects`;
            case 'min_subjects_above_x': return `${criteria.count} Subjects Above ${criteria.percentage}%`;
            case 'max_absent_days_streak': return `Max ${criteria.value} Day Absent Streak`;
            default: return 'Defined Criteria';
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6 animate-fade-in">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5 tracking-tight">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
                                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                            </div>
                            Achievements
                        </h1>
                        <p className="text-[11px] sm:text-[13px] text-muted-foreground ml-1 font-medium opacity-70">Design and manage digital honors for your academic network</p>
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-11 sm:h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 rounded-xl px-6 text-sm font-bold w-full sm:w-auto shrink-0 animate-pulse-subtle">
                                <Plus className="w-4 h-4" /> Add Achievement
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50 sm:max-w-lg rounded-3xl shadow-2xl">
                            <DialogHeader className="pt-2">
                                <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Award className="w-5 h-5" />
                                    </div>
                                    Forge New Badge
                                </DialogTitle>
                                <DialogDescription className="text-[13px] mt-1">Design a unique milestone and set the algorithmic rules for distribution.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Title</Label>
                                    <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Iron Man" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Description</Label>
                                    <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Badge description..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Icon</Label>
                                        <Select value={newIcon} onValueChange={setNewIcon}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {icons.map(icon => (
                                                    <SelectItem key={icon} value={icon}>
                                                        <div className="flex items-center gap-2">
                                                            <IconComponent name={icon} className="w-4 h-4" /> {icon}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Criteria Type</Label>
                                        <Select value={criteriaType} onValueChange={setCriteriaType}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {criteriaTypes.map(c => (
                                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {criteriaType !== 'perfect_subject' && criteriaType !== 'min_subjects_above_x' && (
                                    <div className="grid gap-2">
                                        <Label>Threshold Value (Days/Percent/Count)</Label>
                                        <Input type="number" value={criteriaValue} onChange={(e) => setCriteriaValue(Number(e.target.value))} />
                                    </div>
                                )}
                                {criteriaType === 'min_subjects_above_x' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Min Percent</Label>
                                            <Input
                                                type="number"
                                                value={criteriaValue}
                                                onChange={(e) => setCriteriaValue(Number(e.target.value))}
                                                placeholder="e.g 90"
                                                className="h-10 bg-secondary/50 border-border/50 rounded-xl"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Subject Count</Label>
                                            <Input
                                                type="number"
                                                value={criteriaExtra}
                                                onChange={(e) => setCriteriaExtra(Number(e.target.value))}
                                                placeholder="e.g 3"
                                                className="h-10 bg-secondary/50 border-border/50 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter className="pt-4 border-t border-border/20 gap-2">
                                <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl font-bold h-10 text-sm">Cancel</Button>
                                <Button onClick={handleCreate} className="flex-1 rounded-xl font-bold bg-primary hover:bg-primary/90 h-10 text-sm shadow-lg shadow-primary/20">
                                    Finalize Archetype
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 glass-card rounded-2xl border-dashed">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4 opacity-50" />
                        <p className="text-[13px] text-muted-foreground font-medium animate-pulse uppercase tracking-widest">Scanning Repository...</p>
                    </div>
                ) : achievements.length === 0 ? (
                    <div className="glass-card flex flex-col items-center justify-center py-24 px-4 text-center rounded-2xl border-dashed border-primary/20 bg-primary/5">
                        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                            <Zap className="w-8 h-8 text-primary opacity-50" />
                        </div>
                        <h3 className="text-xl font-black text-foreground mb-1.5 tracking-tight">Empty Hall of Fame</h3>
                        <p className="text-[13px] text-muted-foreground max-w-sm mb-8 leading-relaxed">
                            No active milestones were found in the system. Let's create the first honor for your students.
                        </p>
                        <Button
                            onClick={() => setIsAddOpen(true)}
                            className="gap-2 shadow-xl shadow-primary/20 rounded-xl px-8 font-black"
                        >
                            <Plus className="w-4 h-4" />
                            Initialize Badge v1.0
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {achievements.map((ach) => (
                            <div key={ach.id} className="glass-card p-6 rounded-3xl border border-border/30 relative group hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 bg-gradient-to-br from-white/[0.02] to-transparent overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full -mr-8 -mt-8 group-hover:bg-primary/10 transition-colors" />

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                        <IconComponent name={ach.icon} className="w-7 h-7 text-primary" />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl text-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all duration-200 border border-transparent hover:border-destructive/20"
                                        onClick={() => handleDelete(ach.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="space-y-2 relative z-10">
                                    <h3 className="font-black text-lg text-foreground tracking-tight leading-none truncate group-hover:text-primary transition-colors">{ach.title}</h3>
                                    <p className="text-[13px] text-muted-foreground/80 leading-relaxed line-clamp-2 h-10 font-medium">{ach.description}</p>
                                </div>

                                <div className="mt-6 pt-5 border-t border-white/5 relative z-10">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Requirement</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse" />
                                            <span className="text-[11px] font-black text-foreground/70 uppercase tracking-tighter">
                                                {getCriteriaLabel(ach.criteria)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AchievementsPage;
