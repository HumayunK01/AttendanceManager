import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, BookOpen, Users } from 'lucide-react';
import FacultyLayout from '@/layouts/FacultyLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { facultyAPI, api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatTime12Hour } from '@/lib/timeUtils';
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

const RecordsTable = ({ data, isLoading, emptyMessage }: { data: AttendanceData | null, isLoading: boolean, emptyMessage: string }) => (
    <div className="glass-card rounded-xl border border-border/50 overflow-hidden mt-4">
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm min-w-[800px]">
                <thead>
                    <tr className="border-b border-border/50 bg-secondary/20">
                        <th className="px-4 py-3 text-left font-black text-muted-foreground text-[10px] uppercase tracking-wider sticky left-0 bg-secondary z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">Sr No</th>
                        <th className="px-4 py-3 text-left font-black text-muted-foreground text-[10px] uppercase tracking-wider sticky left-[60px] bg-secondary z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">Roll No</th>
                        <th className="px-4 py-3 text-left font-black text-muted-foreground text-[10px] uppercase tracking-wider sticky left-[140px] bg-secondary z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">Full Name</th>
                        {data?.dateHeaders.map((dateTime) => {
                            const parts = dateTime.match(/^(\d{2}-\d{2}-\d{4}) (\d{2}:\d{2}-\d{2}:\d{2})(?: \((.*)\))?$/);
                            const date = parts ? parts[1] : dateTime.split(' ')[0];
                            const timeRange = parts ? parts[2] : (dateTime.split(' ')[1] || '');
                            const batchInfo = parts ? parts[3] : '';

                            return (
                                <th key={dateTime} className="px-4 py-3 text-center font-black text-muted-foreground text-[10px] uppercase tracking-wider min-w-[140px]">
                                    <div className="flex flex-col gap-0.5">
                                        <span>{date}</span>
                                        {timeRange && (
                                            <span className="text-[9px] text-primary font-bold">
                                                {timeRange.includes('-') ?
                                                    `${formatTime12Hour(timeRange.split('-')[0])} - ${formatTime12Hour(timeRange.split('-')[1])}`
                                                    : timeRange}
                                            </span>
                                        )}
                                        {batchInfo && <span className="text-[9px] text-muted-foreground">{batchInfo}</span>}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                    {isLoading ? (
                        <tr>
                            <td colSpan={100} className="px-4 py-12 text-center">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs text-muted-foreground font-medium">Loading...</p>
                                </div>
                            </td>
                        </tr>
                    ) : !data || data.records.length === 0 ? (
                        <tr>
                            <td colSpan={100} className="px-4 py-12 text-center text-muted-foreground">
                                <span className="text-[11px] font-medium uppercase tracking-widest opacity-50">{emptyMessage}</span>
                            </td>
                        </tr>
                    ) : (
                        data.records.map((record) => (
                            <tr key={record.srNo} className="group hover:bg-secondary/30 transition-colors">
                                <td className="px-4 py-3 font-medium sticky left-0 bg-background group-hover:bg-secondary/30 transition-colors z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">{record.srNo}</td>
                                <td className="px-4 py-3 font-mono text-xs sticky left-[60px] bg-background group-hover:bg-secondary/30 transition-colors z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">{record.rollNo}</td>
                                <td className="px-4 py-3 font-bold sticky left-[140px] bg-background group-hover:bg-secondary/30 transition-colors z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] whitespace-nowrap">{record.fullName}</td>
                                {data.dateHeaders.map((date) => (
                                    <td key={date} className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs ${record.attendance[date] === 'P' ? 'bg-success/20 text-success border border-success/30' :
                                            record.attendance[date] === 'A' ? 'bg-destructive/20 text-destructive border border-destructive/30' :
                                                'bg-secondary/50 text-muted-foreground'
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
);

const AttendanceRecords: React.FC = () => {
    const [options, setOptions] = useState<ClassSubjectOption[]>([]);
    const [selectedOption, setSelectedOption] = useState<string>(''); // "classId-subjectId"
    const [batches, setBatches] = useState<Batch[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<string>('all'); // batchId or 'all'

    const [theoryData, setTheoryData] = useState<AttendanceData | null>(null);
    const [practicalData, setPracticalData] = useState<AttendanceData | null>(null);

    const [isLoadingTheory, setIsLoadingTheory] = useState(false);
    const [isLoadingPractical, setIsLoadingPractical] = useState(false);

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
        if (selectedOption) {
            const [classId, subjectId] = selectedOption.split('-');
            // Fetch Theory (Batch agnostic usually, or ignores batch)
            fetchTheoryRecords(classId, subjectId);
        }
    }, [selectedOption]); // Theory only depends on Class/Subject

    useEffect(() => {
        if (selectedOption) {
            const [classId, subjectId] = selectedOption.split('-');
            // Fetch Practical (Depends on Batch)
            fetchPracticalRecords(classId, subjectId, selectedBatch === 'all' ? undefined : selectedBatch);
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
                }
            }
        } catch (error) {
            console.error('Failed to fetch options:', error);
            toast({ title: 'Error', description: 'Failed to load options.', variant: 'destructive' });
        }
    };

    const fetchBatches = async (classId: string) => {
        try {
            const response = await facultyAPI.getBatches(classId);
            setBatches(response.data);
            setSelectedBatch('all'); // Default to all
        } catch (error) {
            console.error('Failed to fetch batches:', error);
            setBatches([]);
        }
    };

    const fetchTheoryRecords = async (classId: string, subjectId: string) => {
        setIsLoadingTheory(true);
        try {
            const response = await facultyAPI.getAttendanceRecords(classId, subjectId, undefined, 'theory');
            setTheoryData(response.data);
        } catch (error) {
            console.error('Failed to fetch theory records:', error);
            toast({ title: 'Error', description: 'Failed to load theory records.', variant: 'destructive' });
        } finally {
            setIsLoadingTheory(false);
        }
    };

    const fetchPracticalRecords = async (classId: string, subjectId: string, batchId?: string) => {
        setIsLoadingPractical(true);
        try {
            const response = await facultyAPI.getAttendanceRecords(classId, subjectId, batchId, 'practical');
            setPracticalData(response.data);
        } catch (error) {
            console.error('Failed to fetch practical records:', error);
            toast({ title: 'Error', description: 'Failed to load practical records.', variant: 'destructive' });
        } finally {
            setIsLoadingPractical(false);
        }
    };

    const exportToExcel = (type: 'theory' | 'practical') => {
        const data = type === 'theory' ? theoryData : practicalData;
        if (!data || data.records.length === 0) {
            toast({ title: 'No Data', description: 'No records to export.', variant: 'destructive' });
            return;
        }

        const headers = ['Sr No', 'Roll No', 'Full Name', ...data.dateHeaders];
        const rows = data.records.map(record => [
            record.srNo,
            record.rollNo,
            record.fullName,
            ...data.dateHeaders.map(date => record.attendance[date] || '-')
        ]);

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

        const colWidths = [
            { wch: 8 }, { wch: 12 }, { wch: 25 },
            ...data.dateHeaders.map(() => ({ wch: 15 }))
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

        const selectedOpt = options.find(opt => `${opt.class_id}-${opt.subject_id}` === selectedOption);
        const className = selectedOpt?.class_name.replace(/\s+/g, '_') || 'Class';
        const subjectName = selectedOpt?.subject_name.replace(/\s+/g, '_') || 'Subject';
        const batchNameStr = type === 'practical' && selectedBatch !== 'all'
            ? batches.find(b => b.id.toString() === selectedBatch)?.name.replace(/\s+/g, '_') || 'Batch'
            : 'All';

        const filename = `Attendance_${type.toUpperCase()}_${className}_${subjectName}_${batchNameStr}_${new Date().toISOString().split('T')[0]}.xlsx`;

        XLSX.writeFile(wb, filename);
        toast({ title: 'Success', description: `${type === 'theory' ? 'Theory' : 'Practical'} records exported successfully!` });
    };

    const selectedOpt = options.find(opt => `${opt.class_id}-${opt.subject_id}` === selectedOption);

    return (
        <FacultyLayout>
            <div className="space-y-6 animate-fade-in pb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-0.5">
                        <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                            <FileSpreadsheet className="w-6 h-6 text-primary" />
                            Attendance Records
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium">
                            View theory and practical attendance separately.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-wider">Class & Subject</label>
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

                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-wider">Practical Batch Filter</label>
                        <Select value={selectedBatch} onValueChange={setSelectedBatch} disabled={batches.length === 0}>
                            <SelectTrigger className="h-10 rounded-xl bg-secondary/50 border-border/50">
                                <div className="flex items-center gap-2 truncate">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <SelectValue placeholder="Filter Practicals by Batch" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 rounded-xl">
                                <SelectItem value="all">All Batches</SelectItem>
                                {batches.map((batch) => (
                                    <SelectItem key={batch.id} value={batch.id.toString()}>{batch.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {selectedOpt && (
                    <Tabs defaultValue="theory" className="w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <TabsList className="bg-secondary/50 p-1 rounded-xl w-full sm:w-auto h-auto">
                                <TabsTrigger value="theory" className="flex-1 sm:flex-none rounded-lg px-6 py-2 text-xs font-black uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    Theory
                                </TabsTrigger>
                                <TabsTrigger value="practical" className="flex-1 sm:flex-none rounded-lg px-6 py-2 text-xs font-black uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    Practical
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="theory" className="mt-4 space-y-4">
                            <div className="flex justify-end">
                                <Button onClick={() => exportToExcel('theory')} disabled={!theoryData?.records.length} className="w-full sm:w-auto h-10 text-[11px] rounded-xl font-black uppercase tracking-wider bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
                                    <Download className="w-4 h-4 mr-2" /> Export Theory
                                </Button>
                            </div>
                            <RecordsTable data={theoryData} isLoading={isLoadingTheory} emptyMessage="No theory attendance records found." />
                        </TabsContent>

                        <TabsContent value="practical" className="mt-4 space-y-4">
                            <div className="flex justify-end">
                                <Button onClick={() => exportToExcel('practical')} disabled={!practicalData?.records.length} className="w-full sm:w-auto h-10 text-[11px] rounded-xl font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border border-purple-500/20">
                                    <Download className="w-4 h-4 mr-2" /> Export Practical
                                </Button>
                            </div>
                            <RecordsTable data={practicalData} isLoading={isLoadingPractical} emptyMessage="No practical attendance records found." />
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </FacultyLayout>
    );
};

export default AttendanceRecords;
