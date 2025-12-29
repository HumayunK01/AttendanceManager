import React, { useState, useEffect } from 'react';
import { Award, Crown, BookOpen, Shield, Flame, CheckCircle, Lock, Loader2, Sparkles } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { studentAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
}

const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
    const IconComponent = {
        'Crown': Crown,
        'Award': Award,
        'BookOpen': BookOpen,
        'Shield': Shield,
        'Flame': Flame,
        'CheckCircle': CheckCircle
    }[achievement.icon] || Award;

    return (
        <div className={cn(
            "group relative p-6 rounded-2xl border transition-all duration-500 overflow-hidden",
            achievement.unlocked
                ? 'glass-card bg-primary/5 border-primary/20 shadow-xl shadow-primary/5 hover:scale-[1.02] hover:bg-primary/10'
                : 'bg-secondary/10 border-border/20 opacity-70 grayscale backdrop-blur-sm'
        )}>
            {/* Background Accent */}
            {achievement.unlocked && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full -mr-16 -mt-16 transition-all duration-500 group-hover:bg-primary/20" />
            )}

            {!achievement.unlocked && (
                <div className="absolute top-4 right-4">
                    <Lock className="w-5 h-5 text-muted-foreground/40" />
                </div>
            )}

            <div className="relative z-10 flex flex-col h-full">
                <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-500",
                    achievement.unlocked
                        ? 'bg-primary/20 text-primary border border-primary/30 group-hover:rotate-6'
                        : 'bg-muted/30 text-muted-foreground border border-border/20'
                )}>
                    <IconComponent className="w-8 h-8" />
                </div>

                <div className="space-y-2 flex-grow">
                    <h3 className={cn(
                        "text-lg font-black tracking-tight transition-colors",
                        achievement.unlocked ? 'text-foreground group-hover:text-primary' : 'text-muted-foreground'
                    )}>
                        {achievement.title}
                    </h3>

                    <p className="text-sm text-muted-foreground/80 leading-relaxed font-medium">
                        {achievement.description}
                    </p>
                </div>

                {achievement.unlocked && (
                    <div className="mt-5 pt-4 border-t border-border/10 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-success uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" />
                            Badge Unlocked
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(var(--success),0.5)]" />
                    </div>
                )}
            </div>
        </div>
    );
};

const Achievements = () => {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAchievements();
    }, []);

    const fetchAchievements = async () => {
        try {
            const res = await studentAPI.getAchievements();
            setAchievements(res.data);
        } catch (error) {
            console.error('Failed to fetch achievements', error);
        } finally {
            setLoading(false);
        }
    };

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const progress = achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0;

    return (
        <StudentLayout>
            <div className="max-w-[1200px] mx-auto space-y-8 animate-fade-in pb-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6 text-center sm:text-left">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter">
                            Your <span className="text-primary">Achievements</span>
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-70">
                            Milestones & Recognition Badges
                        </p>
                    </div>

                    <div className="glass-card px-6 py-4 rounded-2xl border border-primary/20 bg-primary/5 min-w-[240px] w-full sm:w-auto">
                        <div className="flex justify-between items-end mb-3">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Progression Score</span>
                            <span className="text-2xl font-black text-primary tracking-tighter">
                                {unlockedCount}<span className="text-sm text-muted-foreground font-medium mx-1">/</span>{achievements.length}
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-secondary/50 overflow-hidden relative border border-border/10">
                            <div
                                className="h-full bg-gradient-to-r from-primary via-emerald-400 to-primary transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%`, backgroundSize: '200% 100%' }}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Syncing badges...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                        {achievements.map((achievement) => (
                            <AchievementCard key={achievement.id} achievement={achievement} />
                        ))}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default Achievements;
