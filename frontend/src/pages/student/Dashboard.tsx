import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, BookOpen, Loader2, Zap } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { studentAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

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
    if (pct >= 75) return 'stroke-primary';
    if (pct >= 60) return 'stroke-warning';
    return 'stroke-destructive';
  };

  return (
    <div className="progress-ring relative group" style={{ width: size, height: size }}>
      {/* Outer Glow */}
      <div className={cn(
        "absolute inset-0 rounded-full opacity-20 blur-xl transition-all duration-1000 group-hover:opacity-40",
        percentage >= 75 ? "bg-primary" : percentage >= 60 ? "bg-warning" : "bg-destructive"
      )} />

      <svg width={size} height={size} className="relative z-10">
        <circle
          className="stroke-muted/30"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${getColor(percentage)} transition-all duration-[1500ms] ease-out`}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          filter="drop-shadow(0 0 4px currentColor)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <span className="text-3xl font-black text-foreground tracking-tighter leading-none">{percentage}%</span>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, subtitle, color = 'primary', loading }) => {
  const colorMap = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    success: 'text-success bg-success/10 border-success/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    destructive: 'text-destructive bg-destructive/10 border-destructive/20',
  };

  return (
    <div className="group relative glass-card p-5 transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]">
      <div className={cn(
        "absolute -inset-px rounded-[24px] opacity-0 group-hover:opacity-10 transition-opacity duration-500",
        color === 'primary' ? "bg-primary" :
          color === 'success' ? "bg-success" :
            color === 'warning' ? "bg-warning" :
              "bg-destructive"
      )} />

      <div className="relative flex items-center justify-between gap-3 text-left">
        <div className="space-y-1 min-w-0">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] truncate">{title}</p>
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/30" />
          ) : (
            <h3 className="text-2xl font-black text-foreground tracking-tighter truncate">{value}</h3>
          )}
          {subtitle && <p className="text-[10px] text-muted-foreground/60 font-medium truncate uppercase tracking-wider">{subtitle}</p>}
        </div>
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:rotate-6 shrink-0",
          colorMap[color] || colorMap.primary
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

const StudentDashboard: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({ percentage: 0, totalClasses: 0, attended: 0, totalSubjects: 0 });

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
        attended: totalAttended,
        totalSubjects: mockSubjects.length
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPercentageColor = (pct: number) => {
    if (pct >= 75) return 'text-primary';
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
      <div className="max-w-[1600px] mx-auto space-y-6 animate-fade-in pb-8">

        {/* Defaulter Warning */}
        {isDefaulter && (
          <div className="defaulter-warning glass-card p-5 flex items-center gap-4 border border-destructive/20 bg-destructive/5">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center flex-shrink-0 border border-destructive/20 shadow-lg shadow-destructive/10">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black text-destructive uppercase tracking-widest mb-1">Critical Performance Alert</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                Your cumulative attendance is at <span className="text-destructive font-bold">{overallStats.percentage}%</span>, falling below the mandatory <span className="text-foreground font-bold">75%</span> threshold. Urgent improvement is required.
              </p>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 glass-card p-6 flex flex-col items-center justify-center group relative overflow-hidden bg-background/40 backdrop-blur-xl border-primary/10">
            {/* Background glow for progress card */}
            <div className={cn(
              "absolute -inset-24 opacity-10 blur-3xl rounded-full transition-all duration-1000 group-hover:opacity-20",
              overallStats.percentage >= 75 ? "bg-primary" : "bg-destructive"
            )} />

            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6 relative z-10">Your Total Attendance</p>
            <div className="relative z-10 flex flex-col items-center">
              <ProgressRing percentage={overallStats.percentage} size={150} strokeWidth={12} />
              <div className={cn(
                "mt-6 px-4 py-1.5 rounded-full text-xs font-bold border text-center transition-all",
                overallStats.percentage >= 75
                  ? 'bg-success/10 text-success border-success/20'
                  : overallStats.totalClasses > 0 ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-muted/10 text-muted-foreground border-border/20'
              )}>
                {overallStats.percentage >= 75 ? 'Great Job!' : overallStats.totalClasses > 0 ? 'Action Required' : 'No Data Yet'}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total subjects"
              value={overallStats.totalSubjects || 0}
              icon={BookOpen}
              subtitle="Enrolled this term"
              color="primary"
            />
            <StatCard
              title="Subjects on Track"
              value={subjects.filter(s => s.percentage >= 75).length}
              icon={TrendingUp}
              subtitle="Above 75% target"
              color="success"
            />
            <StatCard
              title="Low Attendance"
              value={lowAttendanceSubjects.length}
              icon={AlertTriangle}
              subtitle="Below 75% target"
              color={lowAttendanceSubjects.length > 0 ? "destructive" : "primary"}
            />

            {/* Detailed Stats Bar - High Density */}
            <div className="sm:col-span-3 glass-card p-5 border-border/30 bg-background/20">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Present Classes</p>
                  <p className="text-2xl font-black text-foreground tracking-tighter">
                    {overallStats.attended} <span className="text-sm font-medium text-muted-foreground uppercase tracking-normal font-medium">Out of</span> {overallStats.totalClasses}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">Total sessions logged</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Attendance Score</p>
                  <p className="text-2xl font-black text-foreground tracking-tighter">{overallStats.percentage}%</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Average across all</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current Status</p>
                  <div className="flex items-center gap-1.5">
                    <p className={cn(
                      "text-2xl font-black tracking-tighter uppercase",
                      overallStats.percentage >= 75 ? "text-success" : "text-destructive"
                    )}>
                      {overallStats.percentage >= 75 ? "Active" : "Alert"}
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">System connectivity ok</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Academic Standing</p>
                  <p className={cn(
                    "text-2xl font-black tracking-tighter uppercase",
                    overallStats.percentage >= 75 ? "text-primary" : overallStats.totalClasses > 0 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {overallStats.percentage >= 75 ? "Excellent" : overallStats.totalClasses > 0 ? "Warning" : "Neutral"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">Based on compliance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subject Insights */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-black text-foreground tracking-tight flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Subject Performance
            </h2>
          </div>

          <div className="glass-card overflow-hidden border-border/30">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="py-4 font-bold text-xs uppercase tracking-wider">Subject Name & Code</th>
                    <th className="py-4 font-bold text-xs uppercase tracking-wider">Present</th>
                    <th className="py-4 font-bold text-xs uppercase tracking-wider">Total</th>
                    <th className="py-4 font-bold text-xs uppercase tracking-wider">Attendance %</th>
                    <th className="py-4 font-bold text-xs uppercase tracking-wider text-right">Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {subjects.map((subject) => (
                    <tr key={subject.id} className="group hover:bg-primary/5 transition-colors">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center border border-border/50 text-[10px] font-black text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors uppercase">
                            {subject.code.substring(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{subject.name}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5 opacity-60">{subject.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-foreground font-bold tabular-nums">{subject.attended}</td>
                      <td className="text-muted-foreground font-medium tabular-nums">{subject.totalClasses}</td>
                      <td className="min-w-[140px]">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                subject.percentage >= 75 ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]' :
                                  subject.percentage >= 60 ? 'bg-warning' : 'bg-destructive'
                              )}
                              style={{ width: `${subject.percentage}%` }}
                            />
                          </div>
                          <span className={cn(
                            "text-xs font-black tabular-nums transition-colors w-10 text-right",
                            getPercentageColor(subject.percentage)
                          )}>
                            {subject.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="text-right">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-[0.15em]",
                          subject.percentage >= 75
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-destructive/10 text-destructive border border-destructive/20'
                        )}>
                          {subject.percentage >= 75 ? 'Secure' : 'Alert'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden divide-y divide-border/20 px-4">
              {subjects.map((subject) => (
                <div key={subject.id} className="py-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center border border-border/50 text-[10px] font-black text-muted-foreground uppercase">
                        {subject.code.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-foreground leading-tight">{subject.name}</p>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-0.5 opacity-60">{subject.code}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-[0.1em] border",
                      subject.percentage >= 75
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-destructive/10 text-destructive border-destructive/20'
                    )}>
                      {subject.percentage >= 75 ? 'Secure' : 'Alert'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          subject.percentage >= 75 ? 'bg-primary' :
                            subject.percentage >= 60 ? 'bg-warning' : 'bg-destructive'
                        )}
                        style={{ width: `${subject.percentage}%` }}
                      />
                    </div>
                    <span className={cn(
                      "text-sm font-black tabular-nums min-w-[36px] text-right",
                      getPercentageColor(subject.percentage)
                    )}>
                      {subject.percentage}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-4">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Attended</span>
                        <span className="text-xs font-bold text-foreground">{subject.attended} sessions</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Total</span>
                        <span className="text-xs font-bold text-muted-foreground">{subject.totalClasses} sessions</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Warning for low attendance subjects */}
        {lowAttendanceSubjects.length > 0 && (
          <div className="glass-card p-5 border-warning/20 bg-warning/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <AlertTriangle className="w-32 h-32 text-warning -mr-8 -mt-8" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 relative z-10 uppercase tracking-wider">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Low Attendance Analysis
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
              {lowAttendanceSubjects.map((subject) => (
                <div key={subject.id} className="p-4 rounded-xl bg-background/50 border border-warning/20 group hover:border-warning/50 transition-all duration-300">
                  <p className="text-[13px] font-black text-foreground mb-1 group-hover:text-warning transition-colors">{subject.name}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Attendance deficit: <span className="text-warning font-bold">{Math.ceil((0.75 * subject.totalClasses) - subject.attended)} units</span> required for 75% compliance.
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
