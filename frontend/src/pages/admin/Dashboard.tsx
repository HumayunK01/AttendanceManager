import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  BookOpen,
  GraduationCap,
  Building,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  BarChart3,
  Calendar,
  UserPlus,
  FileText,
  ArrowRight,
  Activity,
  TrendingDown,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AdminLayout from '@/layouts/AdminLayout';
import { adminAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
  onClick?: () => void;
  subtitle?: string;
  color?: 'primary' | 'success' | 'warning' | 'accent' | 'destructive';
}

const StatCard: React.FC<StatCardProps> = React.memo(({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  loading,
  onClick,
  subtitle,
  color = 'primary'
}) => {
  const colorMap = {
    primary: 'text-primary bg-primary/10 border-primary/20 shadow-primary/10',
    success: 'text-success bg-success/10 border-success/20 shadow-success/10',
    warning: 'text-warning bg-warning/10 border-warning/20 shadow-warning/10',
    accent: 'text-accent bg-accent/10 border-accent/20 shadow-accent/10',
    destructive: 'text-destructive bg-destructive/10 border-destructive/20 shadow-destructive/10',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative glass-card p-4 sm:p-5 transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]",
        onClick ? "cursor-pointer" : ""
      )}
    >
      {/* Glow Effect */}
      <div className={cn(
        "absolute -inset-px rounded-[24px] opacity-0 group-hover:opacity-10 transition-opacity duration-500",
        color === 'primary' ? "bg-primary" :
          color === 'success' ? "bg-success" :
            color === 'warning' ? "bg-warning" :
              color === 'accent' ? "bg-accent" :
                "bg-destructive"
      )} />

      <div className="relative flex items-center justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] truncate">{title}</p>
          <div className="flex items-baseline flex-wrap gap-1.5 min-w-0">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/30" />
            ) : (
              <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tighter truncate">{value}</h3>
            )}
            {trend && !loading && (
              <span className={cn(
                "text-[8px] sm:text-[9px] font-black flex items-center gap-0.5 px-1 py-0.5 rounded-md shrink-0",
                trendUp ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}>
                {trendUp ? <TrendingUp className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> : <TrendingDown className="w-2 h-2 sm:w-2.5 sm:h-2.5" />}
                {trend}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[10px] text-muted-foreground/60 font-medium truncate">{subtitle}</p>}
        </div>

        <div className={cn(
          "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:rotate-6 shrink-0",
          colorMap[color]
        )}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      {onClick && (
        <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-[9px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-1 group-hover:translate-y-0">
          <span>Analytics</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </div>
      )}
    </div>
  );
});

StatCard.displayName = 'StatCard';

interface AttendanceTrendData {
  day: string;
  attendance: number;
}

interface AttendanceDistribution {
  name: string;
  value: number;
  color: string;
}

interface SystemLog {
  source: string;
  action: string;
  time: string;
  type: 'SUCCESS' | 'WARNING';
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    subjects: 0,
    classes: 0,
  });
  const [abuseReportsCount, setAbuseReportsCount] = useState(0);
  const [attendanceTrendData, setAttendanceTrendData] = useState<AttendanceTrendData[]>([]);
  const [attendanceDistribution, setAttendanceDistribution] = useState<AttendanceDistribution[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [studentsData, setStudentsData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [studentsRes, facultyRes, subjectsRes, classesRes, abuseRes, dashboardStatsRes] = await Promise.all([
        adminAPI.getStudents(),
        adminAPI.getFaculty(),
        adminAPI.getSubjects(),
        adminAPI.getClasses(),
        adminAPI.getAbuseReports(),
        adminAPI.getDashboardStats(),
      ]);

      const students = studentsRes.data || [];
      setStudentsData(students);

      setStats({
        students: students.length,
        faculty: facultyRes.data?.length || 0,
        subjects: subjectsRes.data?.length || 0,
        classes: classesRes.data?.length || 0,
      });

      setAbuseReportsCount(abuseRes.data?.length || 0);

      // Calculate attendance distribution
      const highAttendance = students.filter((s: any) => s.attendance >= 90).length;
      const avgAttendance = students.filter((s: any) => s.attendance >= 75 && s.attendance < 90).length;
      const lowAttendance = students.filter((s: any) => s.attendance < 75).length;

      setAttendanceDistribution([
        { name: 'High', value: highAttendance, color: 'hsl(var(--success))' },
        { name: 'Avg', value: avgAttendance, color: 'hsl(var(--primary))' },
        { name: 'Low', value: lowAttendance, color: 'hsl(var(--destructive))' },
      ]);

      // Use real attendance trend data from backend
      const dashboardStats = dashboardStatsRes.data;
      if (dashboardStats.attendanceTrend && dashboardStats.attendanceTrend.length > 0) {
        setAttendanceTrendData(dashboardStats.attendanceTrend.map((item: any) => ({
          day: item.day,
          attendance: parseInt(item.attendance) || 0
        })));
      } else {
        // Fallback to calculated average if no session data available
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const avgAttendanceRate = students.length > 0
          ? students.reduce((sum: number, s: any) => sum + (s.attendance || 0), 0) / students.length
          : 0;

        setAttendanceTrendData(days.map(day => ({
          day,
          attendance: Math.round(avgAttendanceRate)
        })));
      }

      // Generate system logs with real session data
      const logs: SystemLog[] = [];

      if (dashboardStats.todaySessions > 0) {
        logs.push({
          source: 'SESSION_MGR',
          action: `${dashboardStats.todaySessions} sessions today`,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          type: 'SUCCESS'
        });
      }

      if (students.length > 0) {
        logs.push({
          source: 'STUDENT_SVC',
          action: `${students.length} active students`,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          type: 'SUCCESS'
        });
      }

      if (abuseRes.data?.length > 0) {
        logs.push({
          source: 'ABUSE_DETECTOR',
          action: `${abuseRes.data.length} reports pending`,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          type: 'WARNING'
        });
      }

      logs.push({
        source: 'AUTH_MDW',
        action: 'Session active',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        type: 'SUCCESS'
      });

      setSystemLogs(logs);

      // Store session stats for use in other parts of the dashboard
      setStats(prev => ({
        ...prev,
        todaySessions: dashboardStats.todaySessions || 0,
        completedSessions: dashboardStats.completedSessions || 0,
        inProgressSessions: dashboardStats.inProgressSessions || 0,
      }));

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const avgAttendance = useMemo(() => {
    if (!studentsData || studentsData.length === 0) return 0;
    const total = studentsData.reduce((sum, s) => {
      const attendance = parseFloat(s.attendance);
      return sum + (isNaN(attendance) ? 0 : attendance);
    }, 0);
    const avg = total / studentsData.length;
    return isNaN(avg) ? 0 : Math.round(avg);
  }, [studentsData]);

  const defaultersCount = useMemo(() => {
    return studentsData.filter(s => s.attendance < 75).length;
  }, [studentsData]);

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-6 animate-fade-in pb-8">
        {/* Elite Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 sm:gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20">
                System Active
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter">
              Welcome back, <span className="text-primary">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 opacity-70">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Infrastructure operational.
            </p>
          </div>

        </div>

        {/* Technical Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Students"
            value={stats.students}
            icon={GraduationCap}
            trend="+12%"
            trendUp={true}
            loading={loading}
            onClick={() => navigate('/admin/students')}
            subtitle="Active headcount"
            color="primary"
          />
          <StatCard
            title="Verified Faculty"
            value={stats.faculty}
            icon={Users}
            loading={loading}
            onClick={() => navigate('/admin/faculty')}
            subtitle="Teaching staff"
            color="success"
          />
          <StatCard
            title="Course Load"
            value={stats.subjects}
            icon={BookOpen}
            trend="-2"
            trendUp={false}
            loading={loading}
            onClick={() => navigate('/admin/subjects')}
            subtitle="Curriculum"
            color="accent"
          />
          <StatCard
            title="Infrastructure"
            value={stats.classes}
            icon={Building}
            loading={loading}
            onClick={() => navigate('/admin/classes')}
            subtitle="Classrooms"
            color="warning"
          />
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Attendance Area Chart */}
          <div className="lg:col-span-2 glass-card p-4 sm:p-5 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-[11px] font-black text-foreground uppercase tracking-widest">Network Pulse</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">Real-time attendance ingestion</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-70">Attendance</span>
                </div>
              </div>
            </div>

            <div className="h-[220px] sm:h-[260px] lg:h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="attendance"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#chartGradient)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribution Card */}
          <div className="glass-card p-5 flex flex-col items-center justify-center text-center">
            <h2 className="text-[11px] font-black text-foreground uppercase tracking-widest mb-1">Density</h2>
            <p className="text-[10px] text-muted-foreground mb-4">Performance breakdown</p>

            <div className="h-[140px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceDistribution}
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={6}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {attendanceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-foreground tracking-tighter">{avgAttendance}%</span>
                <span className="text-[8px] font-black text-muted-foreground uppercase opacity-70">Avg</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full mt-4">
              {attendanceDistribution.map((item, idx) => (
                <div key={idx} className="bg-secondary/20 p-2 rounded-xl border border-border/20">
                  <p className="text-[11px] font-black text-foreground">{item.value}</p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Low Level Logs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-base font-black text-foreground tracking-tight">System Logs</h2>
              </div>
              <Button variant="ghost" className="text-[9px] font-black text-primary uppercase tracking-wider h-8">
                View All
              </Button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border/30 bg-background/50 backdrop-blur-sm shadow-sm custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="p-3 sm:p-4 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] w-1/4">Source</th>
                    <th className="p-3 sm:p-4 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] w-1/2">Action</th>
                    <th className="p-3 sm:p-4 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] w-1/6">Time</th>
                    <th className="p-3 sm:p-4 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {systemLogs.length > 0 ? systemLogs.map((log, idx) => (
                    <tr key={idx} className="group hover:bg-primary/5 transition-colors">
                      <td className="p-3 sm:p-4">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground truncate block">{log.source}</span>
                      </td>
                      <td className="p-3 sm:p-4">
                        <span className="text-[12px] sm:text-[13px] font-bold text-foreground block truncate">{log.action}</span>
                      </td>
                      <td className="p-3 sm:p-4 text-[11px] font-medium text-muted-foreground whitespace-nowrap">{log.time}</td>
                      <td className="p-3 sm:p-4 text-right">
                        <span className={cn(
                          "text-[8px] font-black px-1.5 py-0.5 rounded-md tracking-widest",
                          log.type === 'SUCCESS' ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                        )}>
                          {log.type}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-sm text-muted-foreground animate-pulse">
                        Synchronizing logs...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-black text-foreground tracking-tight">Status Alerts</h2>
            <div className="space-y-3">
              <div
                className="glass-card p-4 border-destructive/20 bg-destructive/5 group cursor-pointer"
                onClick={() => navigate('/admin/students')}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center border border-destructive/20 text-destructive shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[11px] font-black text-foreground uppercase tracking-wide">Defaulter Alert</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                      {defaultersCount} {defaultersCount === 1 ? 'student has' : 'students have'} dropped below 75% threshold.
                    </p>
                    <button className="text-[9px] font-black text-destructive uppercase tracking-widest mt-2 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Action <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="glass-card p-4 border-warning/20 bg-warning/5 group cursor-pointer"
                onClick={() => navigate('/admin/reports')}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20 text-warning shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[11px] font-black text-foreground uppercase tracking-wide">Abuse Reports</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                      {abuseReportsCount} {abuseReportsCount === 1 ? 'report requires' : 'reports require'} triage.
                    </p>
                    <button className="text-[9px] font-black text-warning uppercase tracking-widest mt-2 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Review <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
