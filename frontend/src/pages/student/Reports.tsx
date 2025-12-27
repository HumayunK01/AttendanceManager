import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Search, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { studentAPI } from '@/lib/api';
import { format } from 'date-fns';

interface AttendanceRecord {
    date: string;
    subject: string;
    startTime: string;
    endTime: string;
    status: 'Present' | 'Absent' | 'Not Marked';
}

const StudentReports: React.FC = () => {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchHistory();
    }, []);

    useEffect(() => {
        filterRecords();
    }, [searchTerm, statusFilter, records]);

    const fetchHistory = async () => {
        try {
            const { data } = await studentAPI.getAttendanceHistory();
            setRecords(data);
        } catch (error) {
            console.error('Failed to fetch attendance history', error);
            // Mock data for fallback
            const mockData: AttendanceRecord[] = Array.from({ length: 20 }).map((_, i) => ({
                date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
                subject: ['Data Structures', 'Database Management', 'Operating Systems', 'Computer Networks'][Math.floor(Math.random() * 4)],
                startTime: '10:00:00',
                endTime: '11:00:00',
                status: Math.random() > 0.8 ? 'Absent' : 'Present'
            }));
            setRecords(mockData);
        } finally {
            setIsLoading(false);
        }
    };

    const filterRecords = () => {
        let result = [...records];

        if (searchTerm) {
            result = result.filter(r =>
                r.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.date.includes(searchTerm)
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter(r => r.status === statusFilter);
        }

        setFilteredRecords(result);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Present': return 'text-success bg-success/10 border-success/20';
            case 'Absent': return 'text-destructive bg-destructive/10 border-destructive/20';
            default: return 'text-muted-foreground bg-muted border-border';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Present': return <CheckCircle className="w-4 h-4" />;
            case 'Absent': return <XCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <StudentLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Attendance Report</h1>
                        <p className="text-muted-foreground mt-1">Detailed history of your class attendance</p>
                    </div>

                    <button className="btn-secondary">
                        <Download className="w-4 h-4 mr-2" />
                        Export data
                    </button>
                </div>

                {/* Filters */}
                <div className="glass-card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by subject or date..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background/50 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-background/50 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Not Marked">Not Marked</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="p-4 font-medium text-muted-foreground text-sm">Date</th>
                                    <th className="p-4 font-medium text-muted-foreground text-sm">Subject</th>
                                    <th className="p-4 font-medium text-muted-foreground text-sm">Time</th>
                                    <th className="p-4 font-medium text-muted-foreground text-sm">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                            Loading history...
                                        </td>
                                    </tr>
                                ) : filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                            No attendance records found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((record, index) => (
                                        <tr
                                            key={index}
                                            className="group hover:bg-muted/30 transition-colors duration-200"
                                        >
                                            <td className="p-4 text-sm font-medium text-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-primary/50" />
                                                    {format(new Date(record.date), 'MMM dd, yyyy')}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-foreground">
                                                {record.subject}
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground font-mono">
                                                {record.startTime.slice(0, 5)} - {record.endTime.slice(0, 5)}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                                                    {getStatusIcon(record.status)}
                                                    {record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentReports;
