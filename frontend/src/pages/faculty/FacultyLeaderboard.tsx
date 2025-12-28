import React, { useState, useEffect } from 'react';
import { Award, Trophy, Medal, Search, Users, Filter, BookOpen, AlertCircle } from 'lucide-react';
import FacultyLayout from '@/layouts/FacultyLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface LeaderboardEntry {
    rank: number;
    id: string;
    rollNo: string;
    name: string;
    attended: number;
    total: number;
    percentage: number;
}

interface ClassSubjectOption {
    class_id: number;
    class_name: string;
    subject_id: number;
    subject_name: string;
}

const FacultyLeaderboard: React.FC = () => {
    const [options, setOptions] = useState<ClassSubjectOption[]>([]);
    const [selectedOption, setSelectedOption] = useState<string>(''); // Combined "classId-subjectId"
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        fetchOptions();
    }, []);

    useEffect(() => {
        if (selectedOption) {
            const [classId, subjectId] = selectedOption.split('-');
            fetchLeaderboard(classId, subjectId);
        }
    }, [selectedOption]);

    const fetchOptions = async () => {
        try {
            const response = await api.get('/faculty/leaderboard');
            if (response.data.type === 'options') {
                setOptions(response.data.data);
                if (response.data.data.length > 0) {
                    // Auto select first
                    const first = response.data.data[0];
                    setSelectedOption(`${first.class_id}-${first.subject_id}`);
                } else {
                    setIsLoading(false);
                }
            } else {
                console.warn('Unexpected response type:', response.data);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Failed to fetch options:', error);
            setIsLoading(false);
        }
    };

    const fetchLeaderboard = async (classId: string, subjectId: string) => {
        setIsLoading(true);
        try {
            const response = await api.get('/faculty/leaderboard', {
                params: { classId, subjectId }
            });
            setLeaderboard(response.data.data);
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            toast({
                title: 'Error',
                description: 'Failed to load leaderboard data.',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const filteredData = leaderboard.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNo.toString().includes(searchQuery)
    );

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />;
            case 2: return <Medal className="w-5 h-5 text-gray-400 fill-gray-400/20" />;
            case 3: return <Medal className="w-5 h-5 text-amber-700 fill-amber-700/20" />;
            default: return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
        }
    };

    // Calculate class stats
    const classAvg = leaderboard.length > 0
        ? Math.round(leaderboard.reduce((acc, curr) => acc + curr.percentage, 0) / leaderboard.length)
        : 0;

    const activeStudents = leaderboard.filter(s => s.percentage >= 75).length;

    return (
        <FacultyLayout>
            <div className="space-y-6 animate-fade-in pb-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-0.5">
                        <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                            <Award className="w-6 h-6 text-primary" />
                            Leaderboard
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium">
                            Track top performers and class engagement stats.
                        </p>
                    </div>

                    {/* Class Selector */}
                    <div className="w-full md:w-64">
                        <Select value={selectedOption} onValueChange={setSelectedOption}>
                            <SelectTrigger className="h-10 rounded-xl bg-secondary/50 border-border/50">
                                <div className="flex items-center gap-2 truncate">
                                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                                    <SelectValue placeholder="Select Class" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 rounded-xl max-h-[300px]">
                                {options.map((opt) => (
                                    <SelectItem key={`${opt.class_id}-${opt.subject_id}`} value={`${opt.class_id}-${opt.subject_id}`}>
                                        <span className="font-medium">{opt.class_name}</span>
                                        <span className="text-xs text-muted-foreground ml-2">({opt.subject_name})</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glass-card p-4 rounded-xl border border-primary/20 bg-primary/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-primary/60 uppercase tracking-wider">Class Average</p>
                                <p className="text-2xl font-black text-primary mt-0.5">{classAvg}%</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Filter className="w-5 h-5 text-primary" />
                            </div>
                        </div>
                    </div>
                    <div className="glass-card p-4 rounded-xl border border-success/20 bg-success/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-success/60 uppercase tracking-wider">In Safe Zone ({'>'}75%)</p>
                                <p className="text-2xl font-black text-success mt-0.5">{activeStudents} <span className="text-xs text-muted-foreground font-medium text-success/60">/ {leaderboard.length}</span></p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-success" />
                            </div>
                        </div>
                    </div>
                    <div className="glass-card p-4 rounded-xl border border-warning/20 bg-warning/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-warning/60 uppercase tracking-wider">At Risk ({'<'}75%)</p>
                                <p className="text-2xl font-black text-warning mt-0.5">{leaderboard.length - activeStudents}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-warning" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search student by name or roll no..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 rounded-xl bg-secondary/30 border-border/50 focus:bg-background transition-all"
                    />
                </div>

                {/* Leaderboard Table */}
                <div className="glass-card rounded-xl border border-border/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 bg-secondary/20">
                                    <th className="px-4 py-3 text-left font-black text-muted-foreground text-[10px] uppercase tracking-wider w-16">Rank</th>
                                    <th className="px-4 py-3 text-left font-black text-muted-foreground text-[10px] uppercase tracking-wider">Student</th>
                                    <th className="px-4 py-3 text-center font-black text-muted-foreground text-[10px] uppercase tracking-wider">Attended</th>
                                    <th className="px-4 py-3 text-right font-black text-muted-foreground text-[10px] uppercase tracking-wider">Percentage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                <p className="text-xs text-muted-foreground font-medium">Loading rankings...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                                            No students found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((student) => (
                                        <tr key={student.id} className="group hover:bg-secondary/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/50 font-bold group-hover:bg-background transition-colors">
                                                    {getRankIcon(student.rank)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground">{student.name}</span>
                                                    <span className="text-[10px] font-mono text-muted-foreground">{student.rollNo}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary/50 text-xs font-medium">
                                                    {student.attended} <span className="text-muted-foreground text-[10px]">/ {student.total}</span>
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden hidden sm:block">
                                                        <div
                                                            className={cn(
                                                                "h-full rounded-full transition-all duration-500",
                                                                student.percentage >= 75 ? "bg-success" :
                                                                    student.percentage >= 60 ? "bg-warning" : "bg-destructive"
                                                            )}
                                                            style={{ width: `${student.percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className={cn(
                                                        "font-black text-sm w-12",
                                                        student.percentage >= 75 ? "text-success" :
                                                            student.percentage >= 60 ? "text-warning" : "text-destructive"
                                                    )}>
                                                        {student.percentage}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </FacultyLayout>
    );
};

export default FacultyLeaderboard;
