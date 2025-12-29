import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Download,
    FileText,
    Users,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    Eye,
    Loader2
} from 'lucide-react';
import FacultyLayout from '@/layouts/FacultyLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatTime12Hour } from '@/lib/timeUtils';

interface AttendanceSession {
    id: number;
    subjectName: string;
    className: string;
    sessionDate: string;
    startTime: string;
    locked: boolean;
    presentCount: number;
    absentCount: number;
    totalStudents: number;
}

const FacultyReports: React.FC = () => {
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [filteredSessions, setFilteredSessions] = useState<AttendanceSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'locked' | 'unlocked'>('all');
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        filterSessions();
    }, [sessions, searchQuery, statusFilter]);

    const fetchSessions = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/faculty/attendance-sessions');

            const sessionsData = response.data.map((session: any) => ({
                id: session.id,
                subjectName: session.subject_name,
                className: session.class_name,
                sessionDate: new Date(session.session_date).toLocaleDateString('en-GB'),
                startTime: session.start_time,
                locked: session.locked,
                presentCount: session.present_count || 0,
                absentCount: session.absent_count || 0,
                totalStudents: session.total_students || 0,
            }));

            setSessions(sessionsData);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
            toast({
                title: 'Error',
                description: 'Failed to load attendance sessions.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const filterSessions = () => {
        let filtered = sessions;

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(
                (session) =>
                    session.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    session.className.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter === 'locked') {
            filtered = filtered.filter((s) => s.locked);
        } else if (statusFilter === 'unlocked') {
            filtered = filtered.filter((s) => !s.locked);
        }

        setFilteredSessions(filtered);
    };

    const handleExportCSV = async (sessionId: number) => {
        try {
            const response = await api.get(`/faculty/attendance-sessions/${sessionId}/export/csv`, {
                responseType: 'blob',
            });

            // Extract filename from Content-Disposition header
            const contentDisposition = response.headers['content-disposition'];
            let filename = `attendance_${sessionId}.csv`; // fallback
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename=(.+)/);
                if (filenameMatch) {
                    filename = filenameMatch[1].replace(/["']/g, '');
                }
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast({
                title: 'Success',
                description: 'Attendance exported as CSV.',
            });
        } catch (error) {
            console.error('Export failed:', error);
            toast({
                title: 'Error',
                description: 'Failed to export attendance.',
                variant: 'destructive',
            });
        }
    };

    const handleExportPDF = async (sessionId: number) => {
        try {
            const response = await api.get(`/faculty/attendance-sessions/${sessionId}/export/pdf`, {
                responseType: 'blob',
            });

            // Extract filename from Content-Disposition header
            const contentDisposition = response.headers['content-disposition'];
            let filename = `attendance_${sessionId}.pdf`; // fallback
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename=(.+)/);
                if (filenameMatch) {
                    filename = filenameMatch[1].replace(/["']/g, '');
                }
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast({
                title: 'Success',
                description: 'Attendance exported as PDF.',
            });
        } catch (error) {
            console.error('Export failed:', error);
            toast({
                title: 'Error',
                description: 'Failed to export attendance.',
                variant: 'destructive',
            });
        }
    };

    const getAttendancePercentage = (session: AttendanceSession) => {
        if (session.totalStudents === 0) return 0;
        return Math.round((session.presentCount / session.totalStudents) * 100);
    };

    return (
        <FacultyLayout>
            <div className="space-y-5 animate-fade-in pb-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div className="space-y-0.5">
                        <h1 className="text-xl font-black text-foreground tracking-tight">Attendance Reports</h1>
                        <p className="text-[11px] text-muted-foreground font-medium">
                            View and export past attendance sessions
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search by subject or class..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 rounded-xl bg-secondary/50 border-border/50 text-[13px]"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                        <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl bg-secondary/50 border-border/50 text-[13px]">
                            <Filter className="w-3.5 h-3.5 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sessions</SelectItem>
                            <SelectItem value="locked">Locked Only</SelectItem>
                            <SelectItem value="unlocked">Unlocked Only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Sessions List */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 glass-card rounded-xl">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                        <p className="text-[11px] text-muted-foreground font-medium">Loading sessions...</p>
                    </div>
                ) : filteredSessions.length === 0 ? (
                    <div className="glass-card flex flex-col items-center justify-center py-12 text-center rounded-xl">
                        <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                            <FileText className="w-7 h-7 text-primary/40" />
                        </div>
                        <h3 className="text-lg font-black text-foreground mb-1">No Sessions Found</h3>
                        <p className="text-[11px] text-muted-foreground max-w-sm">
                            {searchQuery || statusFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Start taking attendance to see reports here'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredSessions.map((session) => {
                            const percentage = getAttendancePercentage(session);
                            return (
                                <div
                                    key={session.id}
                                    className="glass-card group p-5 rounded-2xl border border-white/5 transition-all duration-500 hover:bg-white/[0.04] hover:shadow-2xl hover:border-primary/20"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                        {/* Session Identifiers */}
                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                                <Calendar className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-lg font-black text-foreground tracking-tight truncate">
                                                    {session.subjectName}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground font-medium">
                                                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                                                        <Users className="w-3.5 h-3.5" />
                                                        {session.className}
                                                    </span>
                                                    <span className="hidden xs:inline text-muted-foreground/30">•</span>
                                                    <span className="whitespace-nowrap">{session.sessionDate}</span>
                                                    <span className="hidden xs:inline text-muted-foreground/30">•</span>
                                                    <span className="whitespace-nowrap">{formatTime12Hour(session.startTime)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats and Status */}
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-8">
                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1 rounded-md bg-success/10">
                                                        <CheckCircle className="w-3.5 h-3.5 text-success" />
                                                    </div>
                                                    <span className="text-sm font-black text-foreground">
                                                        {session.presentCount} <span className="text-[10px] text-muted-foreground uppercase font-medium">Present</span>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1 rounded-md bg-destructive/10">
                                                        <XCircle className="w-3.5 h-3.5 text-destructive" />
                                                    </div>
                                                    <span className="text-sm font-black text-foreground">
                                                        {session.absentCount} <span className="text-[10px] text-muted-foreground uppercase font-medium">Absent</span>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="h-8 w-px bg-white/10 hidden sm:block" />
                                                <div className="flex flex-col">
                                                    <span className={cn(
                                                        "text-lg font-black tracking-tighter leading-none",
                                                        percentage >= 75 ? 'text-success' : percentage >= 50 ? 'text-warning' : 'text-destructive'
                                                    )}>
                                                        {percentage}%
                                                    </span>
                                                    <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/60">Attendance</span>
                                                </div>

                                                {session.locked && (
                                                    <div className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20 shadow-[0_0_15px_-5px_rgba(34,197,94,0.3)]">
                                                        <CheckCircle className="w-3 h-3" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Locked</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-row lg:flex-col items-center lg:items-stretch gap-2 lg:min-w-[140px] border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-6">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => navigate(`/faculty/attendance/${session.id}`)}
                                                className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex-1 bg-white/5 hover:bg-white/10 border-white/10 transition-all duration-300"
                                            >
                                                <Eye className="w-3.5 h-3.5 mr-2" />
                                                View Details
                                            </Button>
                                            <div className="flex gap-2 flex-1 lg:flex-none">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleExportCSV(session.id)}
                                                    className="h-9 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-success/20 text-success bg-success/5 hover:bg-success/10 transition-all duration-300 flex-1"
                                                    title="Export CSV"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleExportPDF(session.id)}
                                                    className="h-9 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 transition-all duration-300 flex-1"
                                                    title="Export PDF"
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </FacultyLayout>
    );
};

export default FacultyReports;
