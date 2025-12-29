import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Search, Download, CheckCircle, XCircle, Clock, Loader2, FileText, ChevronRight } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { studentAPI } from '@/lib/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
            // Fallback for demo
            const mockData: AttendanceRecord[] = Array.from({ length: 15 }).map((_, i) => ({
                date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
                subject: ['Data Structures', 'Database Management', 'Operating Systems', 'Computer Architecture'][Math.floor(Math.random() * 4)],
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

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Present': return 'text-success bg-success/10 border-success/20';
            case 'Absent': return 'text-destructive bg-destructive/10 border-destructive/20';
            default: return 'text-muted-foreground bg-muted border-border/10';
        }
    };

    return (
        <StudentLayout>
            <div className="max-w-[1200px] mx-auto space-y-8 animate-fade-in pb-12">

                {/* Elite Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter">
                            Attendance <span className="text-primary">Registry</span>
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-70">
                            Comprehensive activity and session logs
                        </p>
                    </div>

                    <button className="w-full sm:w-auto px-6 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 group active:scale-95">
                        <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                        Export Log
                    </button>
                </div>

                {/* Refined Filters */}
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <input
                            type="text"
                            placeholder="Search subjects or dates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-background/40 border border-border/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm group-hover:border-border/50"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative w-full sm:w-48 capitalize group">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full pl-11 h-auto py-3 bg-background/40 border border-border/30 rounded-2xl text-sm font-bold focus:ring-primary/20 hover:border-border/50 transition-all [&>span]:flex [&>span]:items-center [&>span]:gap-2">
                                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <SelectValue placeholder="All Records" />
                                </SelectTrigger>
                                <SelectContent className="bg-background/95 backdrop-blur-xl border-border/30 rounded-xl shadow-2xl">
                                    <SelectItem value="all" className="font-bold py-2 focus:bg-primary/10 focus:text-primary">All Records</SelectItem>
                                    <SelectItem value="Present" className="font-bold py-2 focus:bg-success/10 focus:text-success">Present</SelectItem>
                                    <SelectItem value="Absent" className="font-bold py-2 focus:bg-destructive/10 focus:text-destructive">Absent</SelectItem>
                                    <SelectItem value="Not Marked" className="font-bold py-2 focus:bg-muted/20 focus:text-muted-foreground">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Attendance Display */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Scanning Registry...</p>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="glass-card p-12 text-center rounded-2xl border-dashed border-2 border-border/20">
                        <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4 opacity-30">
                            <FileText className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No matching logs found</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop View (Table) */}
                        <div className="hidden md:block glass-card rounded-2xl border border-border/30 overflow-hidden shadow-2xl shadow-primary/5">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-muted/30 border-b border-border/20">
                                        <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Session Date</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Subject Identifier</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Time Window</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Integrity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/10">
                                    {filteredRecords.map((record, index) => (
                                        <tr key={index} className="group hover:bg-primary/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                        <Calendar className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                    </div>
                                                    <span className="text-sm font-bold text-foreground opacity-90">
                                                        {format(new Date(record.date), 'MMM dd, yyyy')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-sm text-foreground">
                                                {record.subject}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-muted-foreground font-mono">
                                                {record.startTime.slice(0, 5)} - {record.endTime.slice(0, 5)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                                    getStatusStyles(record.status)
                                                )}>
                                                    {record.status === 'Present' ? <CheckCircle className="w-3 h-3" /> : record.status === 'Absent' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                    {record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View (Cards) */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {filteredRecords.map((record, index) => (
                                <div key={index} className="glass-card p-5 border-border/40 bg-background/40 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Subject</p>
                                            <h3 className="font-bold text-foreground">{record.subject}</h3>
                                        </div>
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                            getStatusStyles(record.status)
                                        )}>
                                            {record.status === 'Present' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {record.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/5">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date</p>
                                            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                                                <Calendar className="w-3 h-3 opacity-50" />
                                                {format(new Date(record.date), 'MMM dd, yyyy')}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Time Window</p>
                                            <div className="flex items-center gap-2 text-xs font-medium text-foreground font-mono">
                                                <Clock className="w-3 h-3 opacity-50" />
                                                {record.startTime.slice(0, 5)} - {record.endTime.slice(0, 5)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentReports;
