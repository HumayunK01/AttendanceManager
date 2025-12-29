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
                    <div className="space-y-3">
                        {filteredSessions.map((session) => {
                            const percentage = getAttendancePercentage(session);
                            return (
                                <div
                                    key={session.id}
                                    className="glass-card p-4 rounded-xl border border-border/50 transition-all duration-300 hover:border-primary/20"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                        {/* Session Info */}
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3 mb-2">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
                                                    <Calendar className="w-5 h-5 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-[15px] font-black text-foreground tracking-tight">
                                                        {session.subjectName}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-muted-foreground font-medium">
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            {session.className}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{session.sessionDate}</span>
                                                        <span>•</span>
                                                        <span>{formatTime12Hour(session.startTime)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 ml-13">
                                                <div className="flex items-center gap-1.5">
                                                    <CheckCircle className="w-3.5 h-3.5 text-success" />
                                                    <span className="text-[12px] font-bold text-success">
                                                        {session.presentCount}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <XCircle className="w-3.5 h-3.5 text-destructive" />
                                                    <span className="text-[12px] font-bold text-destructive">
                                                        {session.absentCount}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span className="text-[12px] font-bold text-foreground">
                                                        {session.totalStudents} Total
                                                    </span>
                                                </div>
                                                <div className="ml-auto">
                                                    <span className={`text-[12px] font-black ${percentage >= 75 ? 'text-success' :
                                                        percentage >= 50 ? 'text-warning' :
                                                            'text-destructive'
                                                        }`}>
                                                        {percentage}% Present
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 lg:flex-col lg:items-stretch">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => navigate(`/faculty/attendance/${session.id}`)}
                                                className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider flex-1 lg:flex-none"
                                            >
                                                <Eye className="w-3 h-3 mr-1.5" />
                                                View
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleExportCSV(session.id)}
                                                className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider border-success/20 text-success hover:bg-success/10 flex-1 lg:flex-none"
                                            >
                                                <Download className="w-3 h-3 mr-1.5" />
                                                CSV
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleExportPDF(session.id)}
                                                className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider border-destructive/20 text-destructive hover:bg-destructive/10 flex-1 lg:flex-none"
                                            >
                                                <Download className="w-3 h-3 mr-1.5" />
                                                PDF
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    {session.locked && (
                                        <div className="mt-3 pt-3 border-t border-border/30">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-success/10 text-success border border-success/20 text-[9px] font-black uppercase tracking-wider">
                                                <CheckCircle className="w-2.5 h-2.5" />
                                                Locked & Finalized
                                            </span>
                                        </div>
                                    )}
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
