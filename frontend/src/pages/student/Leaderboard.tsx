import React, { useState, useEffect } from 'react';
import {
    Trophy,
    Medal,
    Crown,
    TrendingUp,
    User,
    Loader2,
    Award,
    Target
} from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { studentAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
    id: string;
    name: string;
    rollNo: string;
    attended: number;
    totalClasses: number;
    percentage: number;
    rank: number;
    isCurrentUser: boolean;
}

const RankBadge = ({ rank }: { rank: number }) => {
    if (rank === 1) {
        return (
            <div className="w-8 h-8 rounded-full bg-yellow-400/20 border border-yellow-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            </div>
        );
    }
    if (rank === 2) {
        return (
            <div className="w-8 h-8 rounded-full bg-slate-300/20 border border-slate-300/50 flex items-center justify-center">
                <Award className="w-4 h-4 text-slate-400" />
            </div>
        );
    }
    if (rank === 3) {
        return (
            <div className="w-8 h-8 rounded-full bg-amber-600/20 border border-amber-600/50 flex items-center justify-center">
                <Award className="w-4 h-4 text-amber-600" />
            </div>
        );
    }
    return (
        <div className="w-8 h-8 rounded-full bg-secondary/30 border border-border flex items-center justify-center font-bold text-muted-foreground text-[10px]">
            {rank}
        </div>
    );
};

const TopCard = ({ entry }: { entry: LeaderboardEntry }) => {
    const isFirst = entry.rank === 1;
    const sizeClass = isFirst ? 'scale-105 z-10' : 'scale-100 mt-4 sm:scale-95';
    const borderClass = isFirst ? 'border-yellow-500/30' : 'border-border/30';
    const bgClass = isFirst ? 'bg-yellow-500/5' : 'bg-background/40';

    return (
        <div className={cn(
            "relative p-4 sm:p-6 rounded-2xl border backdrop-blur-xl transition-all duration-500 group",
            borderClass, bgClass, sizeClass
        )}>
            {/* Rank Indicator */}
            <div className={cn(
                "absolute -top-3 -right-3 w-8 h-8 rounded-full border-2 border-background flex items-center justify-center font-black text-xs shadow-xl",
                isFirst ? "bg-yellow-500 text-black shadow-yellow-500/20" :
                    entry.rank === 2 ? "bg-slate-400 text-black shadow-slate-400/20" :
                        "bg-amber-600 text-black shadow-amber-600/20"
            )}>
                {entry.rank}
            </div>

            <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                    <div className={cn(
                        "w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border-2 transition-transform duration-500 group-hover:rotate-6",
                        isFirst ? "bg-yellow-500/10 border-yellow-500/20" : "bg-primary/10 border-primary/20"
                    )}>
                        <User className={cn("w-6 h-6 sm:w-8 sm:h-8", isFirst ? "text-yellow-500" : "text-primary")} />
                    </div>
                </div>

                <div className="space-y-1 w-full overflow-hidden">
                    <h3 className="font-bold text-foreground text-sm sm:text-base truncate px-1">
                        {entry.name}
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                        {entry.rollNo}
                    </p>
                </div>

                <div className="mt-4 pt-4 border-t border-border/10 w-full">
                    <div className={cn(
                        "text-2xl sm:text-3xl font-black tracking-tighter",
                        isFirst ? "text-yellow-500" : "text-primary"
                    )}>
                        {entry.percentage}%
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider opacity-60">
                        Attendance Rate
                    </p>
                </div>
            </div>
        </div>
    );
};

const Leaderboard = () => {
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await studentAPI.getLeaderboard();
            setData(res.data);
            const current = res.data.find((item: LeaderboardEntry) => item.isCurrentUser);
            setCurrentUserRank(current || null);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const topThree = data.slice(0, 3);

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] animate-pulse">Calculating rankings...</p>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="max-w-[1200px] mx-auto space-y-8 animate-fade-in pb-12">

                {/* Simplified Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="text-center sm:text-left space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter">
                            Class <span className="text-primary">Leaderboard</span>
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-70">
                            Academic Performance Rankings
                        </p>
                    </div>

                    {currentUserRank && (
                        <div className="glass-card px-6 py-4 rounded-2xl border border-primary/20 flex items-center gap-8 bg-primary/5">
                            <div className="text-center">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Your Rank</p>
                                <p className="text-2xl font-black text-primary tracking-tighter">#{currentUserRank.rank}</p>
                            </div>
                            <div className="h-10 w-[1px] bg-border/20" />
                            <div className="text-center">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Attendance</p>
                                <p className="text-2xl font-black text-foreground tracking-tighter">{currentUserRank.percentage}%</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Top 3 Podium - Responsive Stack/Grid */}
                {topThree.length > 0 && (
                    <div className="flex flex-col sm:grid sm:grid-cols-3 gap-6 sm:gap-4 items-end pt-8 px-4">
                        {/* Second Place - Shown first on mobile? Or order it 2, 1, 3 on desktop, 1, 2, 3 on mobile */}
                        <div className="order-2 sm:order-1 w-full">
                            {topThree[1] && <TopCard entry={topThree[1]} />}
                        </div>
                        {/* First Place */}
                        <div className="order-1 sm:order-2 w-full">
                            {topThree[0] && <TopCard entry={topThree[0]} />}
                        </div>
                        {/* Third Place */}
                        <div className="order-3 sm:order-3 w-full">
                            {topThree[2] && <TopCard entry={topThree[2]} />}
                        </div>
                    </div>
                )}

                {/* Standings List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                            <Target className="w-4 h-4 text-primary" />
                            Class Standings
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-secondary text-[10px] font-black text-muted-foreground">
                                {data.length} Total
                            </span>
                        </h2>
                    </div>

                    <div className="glass-card rounded-2xl border border-border/30 overflow-hidden shadow-2xl shadow-primary/5">
                        <div className="divide-y divide-border/20">
                            {data.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No rankings recorded yet</p>
                                </div>
                            ) : (
                                data.map((student) => (
                                    <div
                                        key={student.id}
                                        className={cn(
                                            "flex items-center justify-between p-4 sm:px-6 transition-all duration-300 group hover:bg-primary/[0.02]",
                                            student.isCurrentUser ? 'bg-primary/5' : ''
                                        )}
                                    >
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="flex-shrink-0">
                                                <RankBadge rank={student.rank} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className={cn(
                                                    "text-sm font-bold truncate",
                                                    student.isCurrentUser ? 'text-primary' : 'text-foreground font-semibold'
                                                )}>
                                                    {student.name} {student.isCurrentUser && <span className="text-[10px] opacity-60 ml-1">(You)</span>}
                                                </p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5 opacity-60 truncate">
                                                    {student.rollNo}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 sm:gap-12">
                                            <div className="hidden md:block text-right">
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Sessions</p>
                                                <p className="text-xs font-bold text-foreground tabular-nums opacity-80">
                                                    {student.attended} / {student.totalClasses}
                                                </p>
                                            </div>
                                            <div className="w-20 text-right">
                                                <p className="text-[9px] md:hidden font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Score</p>
                                                <span className={cn(
                                                    "text-lg font-black tracking-tighter tabular-nums",
                                                    student.percentage >= 75 ? 'text-success' : student.percentage >= 60 ? 'text-warning' : 'text-destructive'
                                                )}>
                                                    {student.percentage}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default Leaderboard;
