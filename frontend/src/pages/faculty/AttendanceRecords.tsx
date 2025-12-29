import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, BookOpen, Users } from 'lucide-react';
import FacultyLayout from '@/layouts/FacultyLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { facultyAPI, api, adminAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface AttendanceRecord {
    srNo: number;
    rollNo: string;
    fullName: string;
    attendance: Record<string, string>; // dateKey -> 'P' | 'A' | '-'
}

interface AttendanceData {
    dateHeaders: string[];
    records: AttendanceRecord[];
}

interface ClassSubjectOption {
    class_id: number;
    class_name: string;
    subject_id: number;
    subject_name: string;
}

interface Batch {
    id: number;
    name: string;
}

const AttendanceRecords: React.FC = () => {
    const [options, setOptions] = useState<ClassSubjectOption[]>([]);
    const [selectedOption, setSelectedOption] = useState<string>(''); // "classId-subjectId"
    const [batches, setBatches] = useState<Batch[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<string>(''); // batchId or 'all'
    const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchOptions();
    }, []);

    useEffect(() => {
        if (selectedOption) {
            const [classId] = selectedOption.split('-');
            fetchBatches(classId);
        }
    }, [selectedOption]);

    useEffect(() => {
        if (selectedOption && selectedBatch) {
            const [classId, subjectId] = selectedOption.split('-');
            fetchAttendanceRecords(classId, subjectId, selectedBatch === 'all' ? undefined : selectedBatch);
        }
    }, [selectedOption, selectedBatch]);

    const fetchOptions = async () => {
        try {
            const response = await api.get('/faculty/leaderboard');
            if (response.data.type === 'options') {
                setOptions(response.data.data);
                if (response.data.data.length > 0) {
                    const first = response.data.data[0];
                    setSelectedOption(`${first.class_id}-${first.subject_id}`);
                } else {
                    setIsLoading(false);
                }
            }
        } catch (error) {
            console.error('Failed to fetch options:', error);
            toast({
                title: 'Error',
                description: 'Failed to load class and subject options.',
                variant: 'destructive'
            });
            setIsLoading(false);
        }
    };

    const fetchBatches = async (classId: string) => {
        try {
            const response = await adminAPI.getBatches(classId);
            setBatches(response.data);
            // Default to 'all' if batches exist
            setSelectedBatch('all');
        } catch (error) {
            console.error('Failed to fetch batches:', error);
            setBatches([]);
            setSelectedBatch('all');
        }
    };

    const fetchAttendanceRecords = async (classId: string, subjectId: string, batchId?: string) => {
        setIsLoading(true);
        try {
            const response = await facultyAPI.getAttendanceRecords(classId, subjectId, batchId);
            setAttendanceData(response.data);
        } catch (error) {
            console.error('Failed to fetch attendance records:', error);
            toast({
                title: 'Error',
                description: 'Failed to load attendance records.',
                variant: 'destructive'
            });
            setAttendanceData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const exportToExcel = () => {
        if (!attendanceData || attendanceData.records.length === 0) {
            toast({
                title: 'No Data',
                description: 'There are no attendance records to export.',
                variant: 'destructive'
            });
            return;
        }

        // Build worksheet data
        const headers = ['Sr No', 'Roll No', 'Full Name', ...attendanceData.dateHeaders];

        const rows = attendanceData.records.map(record => {
            const row = [
                record.srNo,
                record.rollNo,
                record.fullName,
                ...attendanceData.dateHeaders.map(date => record.attendance[date] || '-')
            ];
            return row;
        });

        const worksheetData = [headers, ...rows];

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);

        // Set column widths
        const colWidths = [
            { wch: 8 },  // Sr No
            { wch: 12 }, // Roll No
            { wch: 25 }, // Full Name
            ...attendanceData.dateHeaders.map(() => ({ wch: 12 })) // Date columns
        ];
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance Records');

        // Generate filename
        const selectedOpt = options.find(opt => `${opt.class_id}-${opt.subject_id}` === selectedOption);
        const className = selectedOpt?.class_name.replace(/\s+/g, '_') || 'Class';
        const subjectName = selectedOpt?.subject_name.replace(/\s+/g, '_') || 'Subject';
        const batchName = selectedBatch === 'all' ? 'All' : batches.find(b => b.id.toString() === selectedBatch)?.name.replace(/\s+/g, '_') || 'Batch';
        const filename = `Attendance_${className}_${subjectName}_${batchName}_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Save file
        XLSX.writeFile(wb, filename);

        toast({
            title: 'Success',
            description: 'Attendance records exported successfully!',
        });
    };

    const selectedOpt = options.find(opt => `${opt.class_id}-${opt.subject_id}` === selectedOption);

    return (
        <FacultyLayout>
            <div className="space-y-6 animate-fade-in pb-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-0.5">
                        <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                            <FileSpreadsheet className="w-6 h-6 text-primary" />
                            Attendance Records
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium">
                            View and export attendance records with dynamic date columns.
                        </p>
                    </div>

                    {/* Export Button */}
                    <Button
                        onClick={exportToExcel}
                        disabled={!attendanceData || attendanceData.records.length === 0}
                        className="h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export to Excel
                    </Button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Class & Subject Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                            Class & Subject
                        </label>
                        <Select value={selectedOption} onValueChange={setSelectedOption}>
                            <SelectTrigger className="h-10 rounded-xl bg-secondary/50 border-border/50">
                                <div className="flex items-center gap-2 truncate">
                                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                                    <SelectValue placeholder="Select Class & Subject" />
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

                    {/* Batch Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                            Batch
                        </label>
                        <Select value={selectedBatch} onValueChange={setSelectedBatch} disabled={batches.length === 0}>
                            <SelectTrigger className="h-10 rounded-xl bg-secondary/50 border-border/50">
                                <div className="flex items-center gap-2 truncate">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <SelectValue placeholder="Select Batch" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 rounded-xl">
                                <SelectItem value="all">All Students</SelectItem>
                                {batches.map((batch) => (
                                    <SelectItem key={batch.id} value={batch.id.toString()}>
                                        {batch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Info Card */}
                {selectedOpt && (
                    <div className="glass-card p-4 rounded-xl border border-primary/20 bg-primary/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-primary/60 uppercase tracking-wider">Selected</p>
                                <p className="text-sm font-bold text-primary mt-0.5">
                                    {selectedOpt.class_name} - {selectedOpt.subject_name}
                                    {selectedBatch !== 'all' && batches.find(b => b.id.toString() === selectedBatch) &&
                                        ` (${batches.find(b => b.id.toString() === selectedBatch)?.name})`
                                    }
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-primary/60 uppercase tracking-wider">Total Sessions</p>
                                <p className="text-2xl font-black text-primary mt-0.5">
                                    {attendanceData?.dateHeaders.length || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Attendance Table */}
                <div className="glass-card rounded-xl border border-border/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 bg-secondary/20">
                                    <th className="px-4 py-3 text-left font-black text-muted-foreground text-[10px] uppercase tracking-wider sticky left-0 bg-secondary/20 z-10">
                                        Sr No
                                    </th>
                                    <th className="px-4 py-3 text-left font-black text-muted-foreground text-[10px] uppercase tracking-wider sticky left-[60px] bg-secondary/20 z-10">
                                        Roll No
                                    </th>
                                    <th className="px-4 py-3 text-left font-black text-muted-foreground text-[10px] uppercase tracking-wider sticky left-[140px] bg-secondary/20 z-10">
                                        Full Name
                                    </th>
                                    {attendanceData?.dateHeaders.map((date) => (
                                        <th key={date} className="px-4 py-3 text-center font-black text-muted-foreground text-[10px] uppercase tracking-wider min-w-[100px]">
                                            {date}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={3 + (attendanceData?.dateHeaders.length || 0)} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                <p className="text-xs text-muted-foreground font-medium">Loading attendance records...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : !attendanceData || attendanceData.records.length === 0 ? (
                                    <tr>
                                        <td colSpan={3 + (attendanceData?.dateHeaders.length || 0)} className="px-4 py-12 text-center text-muted-foreground">
                                            No attendance records found. Sessions will appear here after they are locked.
                                        </td>
                                    </tr>
                                ) : (
                                    attendanceData.records.map((record) => (
                                        <tr key={record.srNo} className="group hover:bg-secondary/30 transition-colors">
                                            <td className="px-4 py-3 font-medium sticky left-0 bg-background group-hover:bg-secondary/30 transition-colors z-10">
                                                {record.srNo}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs sticky left-[60px] bg-background group-hover:bg-secondary/30 transition-colors z-10">
                                                {record.rollNo}
                                            </td>
                                            <td className="px-4 py-3 font-bold sticky left-[140px] bg-background group-hover:bg-secondary/30 transition-colors z-10">
                                                {record.fullName}
                                            </td>
                                            {attendanceData.dateHeaders.map((date) => (
                                                <td key={date} className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs ${record.attendance[date] === 'P'
                                                            ? 'bg-success/20 text-success border border-success/30'
                                                            : record.attendance[date] === 'A'
                                                                ? 'bg-destructive/20 text-destructive border border-destructive/30'
                                                                : 'bg-secondary/50 text-muted-foreground'
                                                        }`}>
                                                        {record.attendance[date] || '-'}
                                                    </span>
                                                </td>
                                            ))}
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

export default AttendanceRecords;
