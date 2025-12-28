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
            <div className="w-8 h-8 rounded-full bg-yellow-400/20 border border-yellow-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.3)] animate-pulse-slow">
                <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </div>
        );
    }
    if (rank === 2) {
        return (
            <div className="w-8 h-8 rounded-full bg-slate-300/20 border border-slate-300/50 flex items-center justify-center">
                <Award className="w-5 h-5 text-slate-400" />
            </div>
        );
    }
    if (rank === 3) {
        return (
            <div className="w-8 h-8 rounded-full bg-amber-600/20 border border-amber-600/50 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-600" />
            </div>
        );
    }
    return (
        <div className="w-8 h-8 rounded-full bg-secondary/30 border border-border flex items-center justify-center font-bold text-muted-foreground text-sm">
            {rank}
        </div>
    );
};

const TopCard = ({ entry }: { entry: LeaderboardEntry }) => {
    const isFirst = entry.rank === 1;
    const sizeClass = isFirst ? 'scale-105 z-10' : 'scale-90 opacity-90 mt-2';
    const borderClass = isFirst ? 'border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'border-border/50';
    const bgClass = isFirst ? 'bg-gradient-to-b from-yellow-500/10 to-background' : 'glass-card';

    return (
        <div className={`relative p-4 rounded-xl border ${borderClass} ${bgClass} flex flex-col items-center justify-center text-center transition-all duration-300 ${sizeClass} overflow-visible`}>
            {entry.rank === 1 && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <Crown className="w-8 h-8 text-yellow-500 fill-yellow-500 drop-shadow-lg animate-bounce-slow" />
                </div>
            )}
            {entry.rank === 2 && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <Award className="w-8 h-8 text-slate-300 fill-slate-300/20 drop-shadow-lg" />
                </div>
            )}
            {entry.rank === 3 && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <Award className="w-8 h-8 text-amber-700 fill-amber-700/20 drop-shadow-lg" />
                </div>
            )}

            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-3">
                <span className="text-lg font-bold text-primary">{entry.name.charAt(0)}</span>
            </div>

            <h3 className="font-bold text-foreground line-clamp-1 text-sm mb-0.5 max-w-[120px]">{entry.name}</h3>
            <p className="text-[10px] text-muted-foreground mb-2">{entry.rollNo}</p>

            <div className={`text-xl font-black ${isFirst ? 'text-yellow-500' : 'text-primary'}`}>
                {entry.percentage}%
            </div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Attendance</p>
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
    const rest = data.slice(3);

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Calculating rankings...</p>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="space-y-8 animate-fade-in pb-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
                            <Trophy className="w-8 h-8 text-primary" />
                            Class Leaderboard
                        </h1>
                        <p className="text-muted-foreground mt-1">Compete with your classmates for the best attendance record</p>
                    </div>

                    {currentUserRank && (
                        <div className="glass-card px-5 py-3 rounded-xl border border-primary/20 flex items-center gap-6 bg-primary/5">
                            <div className="text-right">
                                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Your Rank</p>
                                <p className="text-2xl font-black text-primary leading-none">#{currentUserRank.rank}</p>
                            </div>
                            <div className="h-8 w-[1px] bg-border/50" />
                            <div className="text-right">
                                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Score</p>
                                <p className="text-2xl font-black text-foreground leading-none">{currentUserRank.percentage}%</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Top 3 Podium */}
                {topThree.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 items-end max-w-3xl mx-auto py-8">
                        {/* Second Place */}
                        {topThree[1] && <TopCard entry={topThree[1]} />}

                        {/* First Place */}
                        {topThree[0] && <TopCard entry={topThree[0]} />}

                        {/* Third Place */}
                        {topThree[2] && <TopCard entry={topThree[2]} />}
                    </div>
                )}

                {/* The Rest List */}
                <div className="glass-card rounded-2xl border border-border/50 overflow-hidden shadow-xl max-w-4xl mx-auto">
                    <div className="p-4 border-b border-border/50 bg-secondary/20 flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                            <Target className="w-4 h-4 text-primary" />
                            Class Standings
                        </h3>
                        <span className="text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
                            {data.length} Students
                        </span>
                    </div>

                    <div className="divide-y divide-border/30">
                        {data.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No data available yet.</div>
                        ) : (
                            <>
                                {/* If user is in top 3, we don't duplicate them here unless requested, 
                    but typically leaderboard lists everyone or just the rest. 
                    Let's list the 'rest' here. */}
                                {data.map((student) => (
                                    <div
                                        key={student.id}
                                        className={`flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors ${student.isCurrentUser ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <RankBadge rank={student.rank} />
                                            <div>
                                                <p className={`font-bold text-sm ${student.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                                                    {student.name} {student.isCurrentUser && '(You)'}
                                                </p>
                                                <p className="text-xs text-muted-foreground font-mono">{student.rollNo}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="hidden sm:block text-right">
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Attended</p>
                                                <p className="text-xs font-medium">{student.attended} / {student.totalClasses}</p>
                                            </div>
                                            <div className="w-16 text-right">
                                                <span className={`text-lg font-bold ${student.percentage >= 75 ? 'text-green-500' : student.percentage >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                    {student.percentage}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

            </div>
        </StudentLayout>
    );
};

export default Leaderboard;
