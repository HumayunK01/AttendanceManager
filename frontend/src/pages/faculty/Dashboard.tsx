import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Play, Loader2 } from 'lucide-react';
import FacultyLayout from '@/layouts/FacultyLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { facultyAPI } from '@/lib/api';

interface Lecture {
  id: string;
  subjectName: string;
  subjectCode: string;
  className: string;
  startTime: string;
  endTime: string;
  studentCount: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  sessionId?: string;
}

const FacultyDashboard: React.FC = () => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchTodayLectures();
  }, []);

  const fetchTodayLectures = async () => {
    try {
      const response = await facultyAPI.getTodayLectures();
      setLectures(response.data);
    } catch (error) {
      // Mock data
      setLectures([
        { id: '1', subjectName: 'Data Structures', subjectCode: 'CS201', className: 'CS Y1-A', startTime: '09:00', endTime: '10:00', studentCount: 60, status: 'completed', sessionId: 'session-1' },
        { id: '2', subjectName: 'Database Management', subjectCode: 'CS301', className: 'CS Y2-A', startTime: '11:00', endTime: '12:00', studentCount: 55, status: 'ongoing', sessionId: 'session-2' },
        { id: '3', subjectName: 'Data Structures', subjectCode: 'CS201', className: 'CS Y1-B', startTime: '14:00', endTime: '15:00', studentCount: 58, status: 'upcoming' },
        { id: '4', subjectName: 'Operating Systems', subjectCode: 'CS302', className: 'CS Y2-A', startTime: '16:00', endTime: '17:00', studentCount: 55, status: 'upcoming' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = async (lecture: Lecture) => {
    try {
      const response = await facultyAPI.startSession(lecture.id);
      const sessionId = response.data?.sessionId || `session-${Date.now()}`;
      toast({
        title: 'Session Started',
        description: 'Attendance session has been started.',
      });
      navigate(`/faculty/attendance/${sessionId}`);
    } catch (error: any) {
      // Demo navigation
      navigate(`/faculty/attendance/session-${lecture.id}`);
    }
  };

  const getStatusColor = (status: Lecture['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success';
      case 'ongoing':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: Lecture['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'ongoing':
        return 'In Progress';
      default:
        return 'Upcoming';
    }
  };

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <FacultyLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Today's Schedule</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {today}
            </p>
          </div>
          <div className="glass-card px-4 py-2 inline-flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm text-foreground">{lectures.length} lectures today</span>
          </div>
        </div>

        {/* Lectures List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : lectures.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No lectures scheduled</p>
            <p className="text-sm text-muted-foreground">You have no classes scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-4 stagger-children">
            {lectures.map((lecture) => (
              <div 
                key={lecture.id} 
                className={`glass-card p-5 hover-lift ${
                  lecture.status === 'ongoing' ? 'border-l-4 border-warning' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Time */}
                  <div className="flex items-center gap-3 lg:min-w-[140px]">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{lecture.startTime}</p>
                      <p className="text-sm text-muted-foreground">{lecture.endTime}</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden lg:block h-12 w-px bg-border" />

                  {/* Subject Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-foreground">{lecture.subjectName}</h3>
                      <span className="text-sm text-muted-foreground">({lecture.subjectCode})</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {lecture.studentCount} students
                      </span>
                      <span>•</span>
                      <span>{lecture.className}</span>
                    </div>
                  </div>

                  {/* Status & Action */}
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lecture.status)}`}>
                      {getStatusText(lecture.status)}
                    </span>
                    
                    {lecture.status === 'upcoming' && (
                      <Button 
                        onClick={() => handleStartSession(lecture)}
                        className="bg-success hover:bg-success/90"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Session
                      </Button>
                    )}
                    
                    {lecture.status === 'ongoing' && (
                      <Button 
                        onClick={() => navigate(`/faculty/attendance/${lecture.sessionId}`)}
                        variant="outline"
                        className="border-warning text-warning hover:bg-warning/10"
                      >
                        Continue
                      </Button>
                    )}
                    
                    {lecture.status === 'completed' && (
                      <Button 
                        variant="ghost"
                        onClick={() => navigate(`/faculty/attendance/${lecture.sessionId}`)}
                      >
                        View Report
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FacultyLayout>
  );
};

export default FacultyDashboard;
