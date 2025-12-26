import React from 'react';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Building,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp }) => (
  <div className="stat-card hover-lift">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${trendUp ? 'text-success' : 'text-destructive'}`}>
            <TrendingUp className={`w-4 h-4 ${!trendUp && 'rotate-180'}`} />
            {trend}
          </div>
        )}
      </div>
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
    </div>
  </div>
);

interface ActivityItem {
  id: string;
  action: string;
  target: string;
  time: string;
  type: 'success' | 'warning' | 'info';
}

const recentActivity: ActivityItem[] = [
  { id: '1', action: 'New student registered', target: 'John Doe - CS-2024', time: '5 min ago', type: 'success' },
  { id: '2', action: 'Attendance session locked', target: 'Data Structures - Section A', time: '15 min ago', type: 'info' },
  { id: '3', action: 'Low attendance alert', target: 'Computer Networks - 68%', time: '1 hour ago', type: 'warning' },
  { id: '4', action: 'Faculty account created', target: 'Dr. Sarah Smith', time: '2 hours ago', type: 'success' },
  { id: '5', action: 'Timetable updated', target: 'Monday Schedule - All Classes', time: '3 hours ago', type: 'info' },
];

const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your attendance management system</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 stagger-children">
          <StatCard
            title="Total Students"
            value="524"
            icon={<GraduationCap className="w-6 h-6 text-primary" />}
            trend="+12 this month"
            trendUp={true}
          />
          <StatCard
            title="Faculty Members"
            value="48"
            icon={<Users className="w-6 h-6 text-primary" />}
            trend="+3 this month"
            trendUp={true}
          />
          <StatCard
            title="Active Subjects"
            value="32"
            icon={<BookOpen className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="Classes"
            value="16"
            icon={<Building className="w-6 h-6 text-primary" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
              <button className="text-sm text-primary hover:text-primary/80 transition-colors">
                View all
              </button>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'success' ? 'bg-success/20 text-success' :
                    activity.type === 'warning' ? 'bg-warning/20 text-warning' :
                    'bg-primary/20 text-primary'
                  }`}>
                    {activity.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                     activity.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                     <Clock className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                    <p className="text-sm text-muted-foreground truncate">{activity.target}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Today's Overview */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Today's Overview</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sessions Today</span>
                  <span className="text-lg font-semibold text-foreground">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="text-lg font-semibold text-success">18</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">In Progress</span>
                  <span className="text-lg font-semibold text-warning">4</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="text-lg font-semibold text-muted-foreground">2</span>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Alerts</h2>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">15 Defaulters</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Below 75% attendance</p>
                </div>
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">3 Abuse Reports</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Pending review</p>
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
