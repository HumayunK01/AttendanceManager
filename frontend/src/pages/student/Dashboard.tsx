import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, BookOpen, Loader2 } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { studentAPI } from '@/lib/api';

interface SubjectAttendance {
  id: string;
  name: string;
  code: string;
  totalClasses: number;
  attended: number;
  percentage: number;
}

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ percentage, size = 120, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = (pct: number) => {
    if (pct >= 75) return 'stroke-success';
    if (pct >= 60) return 'stroke-warning';
    return 'stroke-destructive';
  };

  return (
    <div className="progress-ring relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="stroke-muted"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${getColor(percentage)} transition-all duration-1000 ease-out`}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{percentage}%</span>
      </div>
    </div>
  );
};

const StudentDashboard: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({ percentage: 0, totalClasses: 0, attended: 0 });

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const [attendanceRes, percentageRes] = await Promise.all([
        studentAPI.getAttendance(),
        studentAPI.getOverallPercentage()
      ]);
      setSubjects(attendanceRes.data);
      setOverallStats(percentageRes.data);
    } catch (error) {
      // Mock data
      const mockSubjects = [
        { id: '1', name: 'Data Structures', code: 'CS201', totalClasses: 30, attended: 27, percentage: 90 },
        { id: '2', name: 'Database Management', code: 'CS301', totalClasses: 28, attended: 22, percentage: 79 },
        { id: '3', name: 'Computer Networks', code: 'CS401', totalClasses: 25, attended: 17, percentage: 68 },
        { id: '4', name: 'Operating Systems', code: 'CS302', totalClasses: 26, attended: 24, percentage: 92 },
        { id: '5', name: 'Software Engineering', code: 'CS501', totalClasses: 20, attended: 18, percentage: 90 },
      ];
      setSubjects(mockSubjects);

      const totalAttended = mockSubjects.reduce((sum, s) => sum + s.attended, 0);
      const totalClasses = mockSubjects.reduce((sum, s) => sum + s.totalClasses, 0);
      setOverallStats({
        percentage: Math.round((totalAttended / totalClasses) * 100),
        totalClasses,
        attended: totalAttended
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPercentageColor = (pct: number) => {
    if (pct >= 75) return 'text-success';
    if (pct >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const isDefaulter = overallStats.totalClasses > 0 && overallStats.percentage < 75;
  const lowAttendanceSubjects = subjects.filter(s => s.percentage < 75 && s.totalClasses > 0);

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Attendance Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your attendance across all subjects</p>
        </div>

        {/* Defaulter Warning */}
        {isDefaulter && (
          <div className="defaulter-warning glass-card p-4 flex items-center gap-4 border">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-destructive">Defaulter Warning</p>
              <p className="text-sm text-muted-foreground">
                Your overall attendance is below 75%. You may face academic penalties if attendance doesn't improve.
              </p>
            </div>
          </div>
        )}

        {/* Overall Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 glass-card p-6 flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground mb-4">Overall Attendance</p>
            {overallStats.totalClasses > 0 ? (
              <>
                <ProgressRing percentage={overallStats.percentage} size={140} strokeWidth={10} />
                <p className={`mt-4 text-sm font-medium ${getPercentageColor(overallStats.percentage)}`}>
                  {overallStats.percentage >= 75 ? 'Good Standing' : 'Below Required'}
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[140px] text-muted-foreground">
                <span className="text-4xl font-bold mb-2">--</span>
                <span className="text-sm">No classes yet</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Total Subjects</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{subjects.length}</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-success" />
                <span className="text-sm text-muted-foreground">Good Attendance</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {subjects.filter(s => s.percentage >= 75).length}
              </p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="text-sm text-muted-foreground">Low Attendance</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{lowAttendanceSubjects.length}</p>
            </div>
          </div>
        </div>

        {/* Subject-wise Attendance */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Subject-wise Attendance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Classes Attended</th>
                  <th>Total Classes</th>
                  <th>Percentage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td>
                      <div>
                        <p className="font-medium text-foreground">{subject.name}</p>
                        <p className="text-sm text-muted-foreground">{subject.code}</p>
                      </div>
                    </td>
                    <td className="text-foreground">{subject.attended}</td>
                    <td className="text-muted-foreground">{subject.totalClasses}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${subject.percentage >= 75 ? 'bg-success' :
                                subject.percentage >= 60 ? 'bg-warning' : 'bg-destructive'
                              }`}
                            style={{ width: `${subject.percentage}%` }}
                          />
                        </div>
                        <span className={`font-medium ${getPercentageColor(subject.percentage)}`}>
                          {subject.percentage}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${subject.percentage >= 75
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                        }`}>
                        {subject.percentage >= 75 ? 'Good' : 'Low'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Warning for low attendance subjects */}
        {lowAttendanceSubjects.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Subjects Requiring Attention
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lowAttendanceSubjects.map((subject) => (
                <div key={subject.id} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="font-medium text-foreground">{subject.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Need {Math.ceil((0.75 * subject.totalClasses) - subject.attended)} more classes to reach 75%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
