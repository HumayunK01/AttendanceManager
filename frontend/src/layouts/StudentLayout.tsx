import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Award,
  PanelLeft,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/student', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Timetable', href: '/student/timetable', icon: <Calendar className="w-5 h-5" /> },
  { label: 'Leaderboard', href: '/student/leaderboard', icon: <GraduationCap className="w-5 h-5" /> },
  { label: 'Achievements', href: '/student/achievements', icon: <Award className="w-5 h-5" /> },
  { label: 'Reports', href: '/student/reports', icon: <BarChart3 className="w-5 h-5" /> },
];

interface StudentLayoutProps {
  children: React.ReactNode;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (href: string) => {
    if (href === '/student') {
      return location.pathname === '/student';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col border-r border-border bg-sidebar sticky top-0 h-screen transition-all duration-300 ease-in-out z-40",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo & Toggle */}
        <div className={cn(
          "h-16 flex items-center border-b border-sidebar-border overflow-hidden transition-all duration-300 flex-shrink-0",
          isCollapsed ? "justify-center px-0 w-20" : "justify-between px-6 w-64"
        )}>
          {!isCollapsed && (
            <div className="flex items-center gap-2 animate-in fade-in duration-300">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
              <span className="font-semibold text-foreground whitespace-nowrap text-xl tracking-tight">Attendly</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors",
              isCollapsed ? "" : ""
            )}
          >
            {isCollapsed ? <PanelLeft className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 py-6 px-3 space-y-1 custom-scrollbar transition-all duration-300",
          isCollapsed ? "overflow-visible scrollbar-none" : "overflow-y-auto overflow-x-hidden"
        )}>
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center rounded-lg text-sm font-medium transition-all duration-200 group relative',
                isCollapsed ? "justify-center px-0 h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5",
                isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              {!isCollapsed && (
                <span className="transition-all duration-300 whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              )}
              {isActive(item.href) && !isCollapsed && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-popover text-popover-foreground text-[11px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] border border-border shadow-2xl pointer-events-none">
                  {item.label}
                </div>
              )}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-sidebar-border">
          <div className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 hover:bg-sidebar-accent/50 group/user relative",
            isCollapsed && "justify-center px-0"
          )}>
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20 shadow-sm transition-transform group-hover/user:scale-105">
              <User className="w-5 h-5 text-primary" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-base font-black text-foreground truncate tracking-tight leading-tight">{user?.name}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] opacity-60">Student</p>
              </div>
            )}

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-3 py-2 bg-popover text-popover-foreground rounded-xl opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all whitespace-nowrap z-[100] border border-border shadow-2xl pointer-events-none">
                <p className="text-sm font-black text-foreground tracking-tight">{user?.name}</p>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Authentication Verified</p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={cn(
              "mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all group/logout relative",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0 group-hover/logout:-translate-x-0.5 transition-transform" />
            {!isCollapsed && <span>Sign out</span>}

            {isCollapsed && (
              <div className="absolute left-full ml-4 px-3 py-2 bg-destructive text-destructive-foreground text-[10px] font-black uppercase tracking-[0.2em] rounded-xl opacity-0 invisible group-hover/logout:opacity-100 group-hover/logout:visible transition-all whitespace-nowrap z-[100] shadow-2xl pointer-events-none">
                Terminate Session
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className={cn(
        "lg:hidden fixed top-0 left-0 right-0 h-16 z-50 transition-all duration-300",
        isMobileMenuOpen ? "bg-transparent border-none" : "bg-background/80 backdrop-blur-xl border-b border-border/50"
      )}>
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          <div className="flex items-center">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-10 h-10 flex items-center justify-center text-foreground transition-all active:scale-90"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={cn(
          'lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-sidebar/95 backdrop-blur-xl border-r border-border/50 z-40 transform transition-transform duration-500 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full pt-16">
          <div className="p-4 border-b border-border/30">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 pl-2">Navigation Matrix</p>
          </div>

          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-300 group',
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary border-l-2 border-primary translate-x-1'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1'
                )}
              >
                <div className={cn(
                  "flex-shrink-0 transition-transform group-hover:scale-110",
                  isActive(item.href) ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.icon}
                </div>
                <span className="tracking-tight">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-sidebar-border space-y-3 bg-background/20">
            {/* User Info */}
            <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-sidebar-accent/30 border border-border/30">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20 shadow-md">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-foreground truncate tracking-tight leading-tight">{user?.name}</p>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Authentication Secured</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] hover:bg-destructive/10 hover:text-destructive transition-all border border-transparent hover:border-destructive/20 active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              Terminate Session
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:pt-0 pt-16 overflow-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(24,24,27,0.5),transparent)]">
        <div className="p-4 sm:p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;
