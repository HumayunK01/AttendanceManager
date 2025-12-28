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
import { useToast } from '@/components/ui/use-toast';
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

    return (
        <AdminLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
                        <p className="text-muted-foreground">Manage gamification badges and criteria.</p>
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" /> Add Achievement
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Achievement</DialogTitle>
                                <DialogDescription>Define a new badge and unlocking rules.</DialogDescription>
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
                                            <Label>Min Percent</Label>
                                            <Input
                                                type="number"
                                                value={criteriaValue}
                                                onChange={(e) => setCriteriaValue(Number(e.target.value))}
                                                placeholder="e.g 90"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Subject Count</Label>
                                            <Input
                                                type="number"
                                                value={criteriaExtra}
                                                onChange={(e) => setCriteriaExtra(Number(e.target.value))}
                                                placeholder="e.g 3"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreate}>Create Achievement</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {achievements.map((ach) => (
                            <div key={ach.id} className="glass-card p-6 rounded-xl border border-border/50 relative group hover:border-primary/30 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <IconComponent name={ach.icon} className="w-6 h-6" />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDelete(ach.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <h3 className="font-bold text-lg mb-1">{ach.title}</h3>
                                <p className="text-sm text-muted-foreground mb-4 h-10 line-clamp-2">{ach.description}</p>

                                <div className="bg-secondary/30 p-2 rounded text-xs font-mono text-muted-foreground truncate">
                                    Criteria: {ach.criteria}
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
