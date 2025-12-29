import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Users, CheckCircle, XCircle, Loader2, Search } from 'lucide-react';
import FacultyLayout from '@/layouts/FacultyLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { formatTime12Hour } from '@/lib/timeUtils';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  status: 'present' | 'absent' | 'unmarked';
}

interface SessionInfo {
  id: string;
  subjectName: string;
  className: string;
  batchName?: string;
  date: string;
  startTime: string;
  isLocked: boolean;
}

const AttendanceSession: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  // Validate sessionId on mount
  useEffect(() => {
    if (!sessionId || sessionId === 'undefined' || isNaN(parseInt(sessionId))) {
      toast({
        title: 'Invalid Session',
        description: 'The session ID is invalid. Redirecting to dashboard.',
        variant: 'destructive',
      });
      navigate('/faculty');
      return;
    }
    fetchSessionData();
  }, [sessionId]);

  const fetchSessionData = async () => {
    // Double-check sessionId is valid
    if (!sessionId || sessionId === 'undefined' || isNaN(parseInt(sessionId))) {
      return;
    }

    try {
      setIsLoading(true);

      // Fetch students for this session
      const studentsRes = await api.get(`/attendance/session/${sessionId}/students`);
      const studentsData = studentsRes.data || [];

      // Extract session info from the first record (all records have the same session info)
      if (studentsData.length > 0) {
        const firstRecord = studentsData[0];
        setSessionInfo({
          id: sessionId!,
          subjectName: firstRecord.subject_name || 'Unknown',
          className: firstRecord.class_name || 'Unknown',
          batchName: firstRecord.batch_name,
          date: new Date(firstRecord.session_date).toLocaleDateString(),
          startTime: firstRecord.start_time,
          isLocked: firstRecord.locked || false,
        });
      }

      // Transform the data to match our interface
      const transformedStudents = studentsData.map((s: any) => ({
        id: s.student_id,
        name: s.student_name,
        rollNumber: s.roll_no?.toString() || 'N/A',
        status: s.status === 'P' ? 'present' : s.status === 'A' ? 'absent' : 'unmarked'
      }));

      setStudents(transformedStudents);



    } catch (error) {
      console.error('Failed to fetch session data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance session.',
        variant: 'destructive',
      });

      // Fallback to empty state
      setStudents([]);
      setSessionInfo({
        id: sessionId!,
        subjectName: 'Unknown',
        className: 'Unknown',
        date: new Date().toLocaleDateString(),
        startTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        isLocked: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAttendance = async (student: Student, status: 'present' | 'absent') => {
    if (sessionInfo?.isLocked) {
      toast({
        title: 'Session Locked',
        description: 'Cannot modify attendance after session is locked.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.post('/attendance/mark', {
        sessionId: parseInt(sessionId!),
        studentId: student.id,
        status: status === 'present' ? 'P' : 'A',
        editedBy: 1,
      });
      setStudents(students.map(s =>
        s.id === student.id ? { ...s, status } : s
      ));
    } catch (error) {
      // Optimistic update for demo
      setStudents(students.map(s =>
        s.id === student.id ? { ...s, status } : s
      ));
    }
  };

  const handleLockSession = async () => {
    setIsLocking(true);
    try {
      await api.post(`/attendance/session/${sessionId}/lock`);
      setSessionInfo(prev => prev ? { ...prev, isLocked: true } : null);
      toast({
        title: 'Session Locked',
        description: 'The attendance session has been locked. No further changes can be made.',
      });
    } catch (error: any) {
      console.error('Failed to lock session:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to lock session.',
        variant: 'destructive',
      });
    } finally {
      setIsLocking(false);
      setIsLockDialogOpen(false);
    }
  };

  const handleMarkAll = async (status: 'present' | 'absent') => {
    if (sessionInfo?.isLocked) {
      toast({
        title: 'Session Locked',
        description: 'Cannot modify attendance after session is locked.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Mark all students with the given status
      const promises = students.map(student =>
        api.post('/attendance/mark', {
          sessionId: parseInt(sessionId!),
          studentId: student.id,
          status: status === 'present' ? 'P' : 'A',
          editedBy: 1,
        })
      );

      await Promise.all(promises);

      // Update all students' status
      setStudents(students.map(s => ({ ...s, status })));

      toast({
        title: 'Success',
        description: `Marked all students as ${status}.`,
      });
    } catch (error) {
      console.error('Failed to mark all:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all students.',
        variant: 'destructive',
      });
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const unmarkedCount = students.filter(s => s.status === 'unmarked').length;

  if (isLoading) {
    return (
      <FacultyLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/faculty')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                {sessionInfo?.subjectName}
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <span>{sessionInfo?.className}</span>
                {sessionInfo?.batchName && (
                  <span className="bg-accent/10 text-accent px-2 py-0.5 rounded text-xs font-bold border border-accent/20">
                    {sessionInfo.batchName}
                  </span>
                )}
                <span>•</span>
                <span>{sessionInfo?.date}</span>
                <span>•</span>
                <span>{formatTime12Hour(sessionInfo?.startTime || '')}</span>
              </p>
            </div>
          </div>

          {!sessionInfo?.isLocked && (
            <Button
              onClick={() => setIsLockDialogOpen(true)}
              className="bg-warning hover:bg-warning/90 text-warning-foreground"
            >
              <Lock className="w-4 h-4 mr-2" />
              Lock Session
            </Button>
          )}

          {sessionInfo?.isLocked && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Session Locked</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{presentCount}</p>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Present</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{absentCount}</p>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Absent</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{unmarkedCount}</p>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Unmarked</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Bulk Actions */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50"
            />
          </div>

          {!sessionInfo?.isLocked && (
            <div className="flex gap-2 w-full md:w-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkAll('present')}
                className="flex-1 md:flex-none h-9 px-4 rounded-lg text-[11px] font-black uppercase tracking-wider border-success/20 text-success hover:bg-success/10"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                <span className="hidden sm:inline">Mark All</span> Present
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkAll('absent')}
                className="flex-1 md:flex-none h-9 px-4 rounded-lg text-[11px] font-black uppercase tracking-wider border-destructive/20 text-destructive hover:bg-destructive/10"
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                <span className="hidden sm:inline">Mark All</span> Absent
              </Button>
            </div>
          )}
        </div>

        {/* Students List */}
        <div className="glass-card overflow-x-auto custom-scrollbar">
          <table className="data-table min-w-[600px]">
            <thead>
              <tr>
                <th>Roll No.</th>
                <th>Name</th>
                <th>Status</th>
                <th>Mark Attendance</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>
                    <span className="font-mono text-sm">{student.rollNumber}</span>
                  </td>
                  <td className="font-medium text-foreground whitespace-nowrap">{student.name}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${student.status === 'present' ? 'bg-success/10 text-success' :
                      student.status === 'absent' ? 'bg-destructive/10 text-destructive' :
                        'bg-muted text-muted-foreground'
                      }`}>
                      {student.status === 'present' && <CheckCircle className="w-3 h-3" />}
                      {student.status === 'absent' && <XCircle className="w-3 h-3" />}
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={student.status === 'present' ? 'default' : 'outline'}
                        onClick={() => handleMarkAttendance(student, 'present')}
                        disabled={sessionInfo?.isLocked}
                        className={`h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider ${student.status === 'present'
                          ? 'bg-success hover:bg-success/90 text-success-foreground border-success'
                          : 'border-success/20 text-success hover:bg-success/10'
                          }`}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant={student.status === 'absent' ? 'default' : 'outline'}
                        onClick={() => handleMarkAttendance(student, 'absent')}
                        disabled={sessionInfo?.isLocked}
                        className={`h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider ${student.status === 'absent'
                          ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground border-destructive'
                          : 'border-destructive/20 text-destructive hover:bg-destructive/10'
                          }`}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Absent
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lock Confirmation */}
      <AlertDialog open={isLockDialogOpen} onOpenChange={setIsLockDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Lock Attendance Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to lock this session? Once locked, no further changes can be made to the attendance records.
              <br /><br />
              <strong>Summary:</strong>
              <br />
              Present: {presentCount} | Absent: {absentCount} | Unmarked: {unmarkedCount}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLockSession}
              disabled={isLocking}
              className="bg-warning hover:bg-warning/90"
            >
              {isLocking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Lock Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FacultyLayout>
  );
};

export default AttendanceSession;
