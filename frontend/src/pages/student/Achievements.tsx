import React, { useState, useEffect } from 'react';
import { Award, Crown, BookOpen, Shield, Flame, CheckCircle, Lock } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { studentAPI } from '@/lib/api';

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
        <div className={`
            relative p-6 rounded-2xl border transition-all duration-300
            ${achievement.unlocked
                ? 'bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:scale-[1.02]'
                : 'bg-secondary/20 border-border/50 opacity-60 grayscale'
            }
        `}>
            {!achievement.unlocked && (
                <div className="absolute top-4 right-4 text-muted-foreground/30">
                    <Lock className="w-5 h-5" />
                </div>
            )}

            <div className={`
                w-14 h-14 rounded-full flex items-center justify-center mb-4
                ${achievement.unlocked
                    ? 'bg-primary/20 text-primary ring-2 ring-primary/20'
                    : 'bg-muted text-muted-foreground'
                }
            `}>
                <IconComponent className="w-7 h-7" />
            </div>

            <h3 className={`font-bold text-lg mb-2 ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                {achievement.title}
            </h3>

            <p className="text-sm text-muted-foreground leading-relaxed">
                {achievement.description}
            </p>

            {achievement.unlocked && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-[100px] rounded-tr-2xl -z-10" />
            )}
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
            <div className="space-y-8 animate-fade-in pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
                            <Award className="w-8 h-8 text-primary" />
                            Achievements
                        </h1>
                        <p className="text-muted-foreground mt-1">Unlock badges by attending classes consistently</p>
                    </div>

                    <div className="glass-card px-6 py-4 rounded-xl border border-primary/20 bg-primary/5 min-w-[200px]">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Progress</span>
                            <span className="text-2xl font-black text-primary leading-none">
                                {unlockedCount}<span className="text-sm text-muted-foreground font-medium">/{achievements.length}</span>
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-48 rounded-2xl bg-secondary/20 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
