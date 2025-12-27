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
  TrendingDown
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AdminLayout from '@/layouts/AdminLayout';
import { adminAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
  onClick?: () => void;
  subtitle?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = React.memo(({
  title,
  value,
  icon,
  trend,
  trendUp,
  loading,
  onClick,
  subtitle,
  color = 'primary'
}) => (
  <div
    className={`stat-card hover-lift group relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
  >
    {/* Animated background gradient */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

    <div className="relative flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm text-muted-foreground mb-1 font-medium">{title}</p>
        {loading ? (
          <div className="flex items-center gap-2 my-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-muted-foreground text-sm">Loading...</span>
          </div>
        ) : (
          <>
            <p className="text-4xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground/70">{subtitle}</p>
            )}
          </>
        )}
        {trend && !loading && (
          <div className={`flex items-center gap-1 mt-3 text-sm font-medium ${trendUp ? 'text-success' : 'text-destructive'}`}>
            {trendUp ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className={`w-14 h-14 rounded-2xl bg-${color}/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-${color}/20`}>
        {icon}
      </div>
    </div>

    {onClick && (
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="w-4 h-4 text-primary" />
      </div>
    )}
  </div>
));

StatCard.displayName = 'StatCard';

interface ActivityItem {
  id: string;
  action: string;
  target: string;
  time: string;
  type: 'success' | 'warning' | 'info';
}

// Optimized chart data - memoized to prevent re-renders
const attendanceTrendData = [
  { day: 'Mon', attendance: 85, sessions: 12 },
  { day: 'Tue', attendance: 88, sessions: 14 },
  { day: 'Wed', attendance: 82, sessions: 13 },
  { day: 'Thu', attendance: 90, sessions: 15 },
  { day: 'Fri', attendance: 87, sessions: 11 },
  { day: 'Sat', attendance: 78, sessions: 8 },
];

const attendanceDistribution = [
  { name: 'Excellent (>90%)', value: 320, color: '#10b981' },
  { name: 'Good (75-90%)', value: 150, color: '#f59e0b' },
  { name: 'Poor (<75%)', value: 54, color: '#ef4444' },
];

const recentActivity: ActivityItem[] = [
  { id: '1', action: 'New student registered', target: 'John Doe - CS-2024', time: '5 min ago', type: 'success' },
  { id: '2', action: 'Attendance session locked', target: 'Data Structures - Section A', time: '15 min ago', type: 'info' },
  { id: '3', action: 'Low attendance alert', target: 'Computer Networks - 68%', time: '1 hour ago', type: 'warning' },
  { id: '4', action: 'Faculty account created', target: 'Dr. Sarah Smith', time: '2 hours ago', type: 'success' },
  { id: '5', action: 'Timetable updated', target: 'Monday Schedule - All Classes', time: '3 hours ago', type: 'info' },
];

// Optimized tooltip styles - defined once
const chartTooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.4)',
};

const chartLabelStyle = { color: 'hsl(var(--foreground))' };
const chartItemStyle = { color: 'hsl(var(--foreground))' };

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    subjects: 0,
    classes: 0,
  });
  const [abuseReportsCount, setAbuseReportsCount] = useState(0);

  // Memoized navigation handlers
  const navigateToStudents = useCallback(() => navigate('/admin/students'), [navigate]);
  const navigateToFaculty = useCallback(() => navigate('/admin/faculty'), [navigate]);
  const navigateToSubjects = useCallback(() => navigate('/admin/subjects'), [navigate]);
  const navigateToClasses = useCallback(() => navigate('/admin/classes'), [navigate]);
  const navigateToTimetable = useCallback(() => navigate('/admin/timetable'), [navigate]);
  const navigateToReports = useCallback(() => navigate('/admin/reports'), [navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Parallel API calls for optimal performance
      const [studentsRes, facultyRes, subjectsRes, classesRes, abuseRes] = await Promise.all([
        adminAPI.getStudents(),
        adminAPI.getFaculty(),
        adminAPI.getSubjects(),
        adminAPI.getClasses(),
        adminAPI.getAbuseReports(),
      ]);

      setStats({
        students: studentsRes.data.length || 0,
        faculty: facultyRes.data.length || 0,
        subjects: subjectsRes.data.length || 0,
        classes: classesRes.data.length || 0,
      });

      setAbuseReportsCount(abuseRes.data.length || 0);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Memoized activity items to prevent re-renders
  const activityItems = useMemo(() => recentActivity, []);

  return (
    <AdminLayout>
      <div className="space-y-6 lg:space-y-8 animate-fade-in">
        {/* Enhanced Header with Quick Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-2 text-sm lg:text-base">
              <Activity className="w-4 h-4" />
              Real-time overview of your attendance management system
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToStudents}
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Student</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToTimetable}
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Timetable</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToReports}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Reports</span>
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Grid with Click Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 stagger-children">
          <StatCard
            title="Total Students"
            value={stats.students}
            icon={<GraduationCap className="w-7 h-7 text-primary" />}
            loading={loading}
            onClick={navigateToStudents}
            subtitle="Active enrollments"
          />
          <StatCard
            title="Faculty Members"
            value={stats.faculty}
            icon={<Users className="w-7 h-7 text-success" />}
            loading={loading}
            onClick={navigateToFaculty}
            subtitle="Teaching staff"
            color="success"
          />
          <StatCard
            title="Active Subjects"
            value={stats.subjects}
            icon={<BookOpen className="w-7 h-7 text-accent" />}
            loading={loading}
            onClick={navigateToSubjects}
            subtitle="Course offerings"
            color="accent"
          />
          <StatCard
            title="Classes"
            value={stats.classes}
            icon={<Building className="w-7 h-7 text-warning" />}
            loading={loading}
            onClick={navigateToClasses}
            subtitle="Active sections"
            color="warning"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Attendance Trend Chart */}
          <div className="glass-card p-4 lg:p-6 hover-lift">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <div>
                <h2 className="text-lg lg:text-xl font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Weekly Attendance Trend
                </h2>
                <p className="text-xs lg:text-sm text-muted-foreground mt-1">Average attendance percentage</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={attendanceTrendData}>
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="day"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  labelStyle={chartLabelStyle}
                  itemStyle={chartItemStyle}
                />
                <Area
                  type="monotone"
                  dataKey="attendance"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorAttendance)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Attendance Distribution Pie Chart */}
          <div className="glass-card p-4 lg:p-6 hover-lift">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <div>
                <h2 className="text-lg lg:text-xl font-semibold text-foreground">Student Distribution</h2>
                <p className="text-xs lg:text-sm text-muted-foreground mt-1">By attendance percentage</p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={attendanceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1000}
                  >
                    {attendanceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    labelStyle={chartLabelStyle}
                    itemStyle={chartItemStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:gap-3 mt-4">
              {attendanceDistribution.map((item, idx) => (
                <div key={idx} className="text-center p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  </div>
                  <p className="text-base lg:text-lg font-bold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.name.split(' ')[0]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 glass-card p-4 lg:p-6 hover-lift">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h2 className="text-lg lg:text-xl font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Activity
              </h2>
              <button className="text-xs lg:text-sm text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1">
                View all
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2 lg:space-y-3">
              {activityItems.map((activity, idx) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 lg:gap-4 p-3 lg:p-4 rounded-xl hover:bg-secondary/40 transition-all duration-300 border border-transparent hover:border-border/50 group"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${activity.type === 'success' ? 'bg-success/20 text-success' :
                      activity.type === 'warning' ? 'bg-warning/20 text-warning' :
                        'bg-primary/20 text-primary'
                    }`}>
                    {activity.type === 'success' ? <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5" /> :
                      activity.type === 'warning' ? <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5" /> :
                        <Clock className="w-4 h-4 lg:w-5 lg:h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground mb-0.5">{activity.action}</p>
                    <p className="text-xs lg:text-sm text-muted-foreground truncate">{activity.target}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap bg-secondary/50 px-2 py-1 rounded-md">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats & Alerts */}
          <div className="space-y-4 lg:space-y-6">
            {/* Today's Overview */}
            <div className="glass-card p-4 lg:p-6 hover-lift">
              <h2 className="text-lg lg:text-xl font-semibold text-foreground mb-4 lg:mb-5 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Today's Overview
              </h2>
              <div className="space-y-3 lg:space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">Sessions Today</span>
                  <span className="text-lg lg:text-xl font-bold text-foreground">24</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 hover:bg-success/20 transition-colors">
                  <span className="text-sm font-medium text-success">Completed</span>
                  <span className="text-lg lg:text-xl font-bold text-success">18</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10 hover:bg-warning/20 transition-colors">
                  <span className="text-sm font-medium text-warning">In Progress</span>
                  <span className="text-lg lg:text-xl font-bold text-warning">4</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">Pending</span>
                  <span className="text-lg lg:text-xl font-bold text-muted-foreground">2</span>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="glass-card p-4 lg:p-6 hover-lift">
              <h2 className="text-lg lg:text-xl font-semibold text-foreground mb-4 lg:mb-5 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Alerts
              </h2>
              <div className="space-y-3">
                <div
                  className="p-3 lg:p-4 rounded-xl bg-destructive/10 border border-destructive/30 hover:border-destructive/50 transition-all cursor-pointer group"
                  onClick={navigateToStudents}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 group-hover:animate-pulse" />
                      <span className="text-sm font-bold">15 Defaulters</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-muted-foreground">Students below 75% attendance threshold</p>
                </div>
                <div
                  className="p-3 lg:p-4 rounded-xl bg-warning/10 border border-warning/30 hover:border-warning/50 transition-all cursor-pointer group"
                  onClick={navigateToReports}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-warning">
                      <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 group-hover:animate-pulse" />
                      <span className="text-sm font-bold">{abuseReportsCount} Abuse Reports</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-warning opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-muted-foreground">Pending review and action</p>
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
