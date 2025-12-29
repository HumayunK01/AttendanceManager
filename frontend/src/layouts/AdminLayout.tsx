import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  Link2,
  AlertTriangle,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Building,
  PanelLeft,
  Circle,
  User,
  Award
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
  { label: 'Subjects', href: '/admin/subjects', icon: <BookOpen className="w-[18px] h-[18px]" /> },
  { label: 'Classes', href: '/admin/classes', icon: <Building className="w-[18px] h-[18px]" /> },
  { label: 'Faculty', href: '/admin/faculty', icon: <Users className="w-[18px] h-[18px]" /> },
  { label: 'Students', href: '/admin/students', icon: <GraduationCap className="w-[18px] h-[18px]" /> },
  { label: 'Mappings', href: '/admin/mappings', icon: <Link2 className="w-[18px] h-[18px]" /> },
  { label: 'Timetable', href: '/admin/timetable', icon: <Calendar className="w-[18px] h-[18px]" /> },
  { label: 'Gamification', href: '/admin/achievements', icon: <Award className="w-[18px] h-[18px]" /> },
  { label: 'System Logs', href: '/admin/reports', icon: <AlertTriangle className="w-[18px] h-[18px]" /> },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
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
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col border-r border-border/50 bg-sidebar sticky top-0 h-screen transition-all duration-300 ease-in-out z-50",
          isCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Logo & Toggle */}
        <div className={cn(
          "h-[70px] flex items-center border-b border-border/40 overflow-hidden transition-all duration-300",
          isCollapsed ? "justify-center px-0" : "justify-between px-6"
        )}>
          {!isCollapsed && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-400">
              <div className="w-fit h-10 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
              </div>
              <span className="font-bold text-foreground whitespace-nowrap text-xl tracking-tight">Attendly</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "p-2 rounded-xl hover:bg-sidebar-accent text-sidebar-foreground transition-all active:scale-95 group/toggle",
              isCollapsed ? "hover:scale-110" : ""
            )}
          >
            {isCollapsed ? <PanelLeft className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 py-8 px-3.5 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar",
          isCollapsed && "scrollbar-none px-2"
        )}>
          {!isCollapsed && (
            <div className="px-3 mb-4">
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Navigation</p>
            </div>
          )}

          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center rounded-xl text-[13px] font-bold transition-all duration-200 group relative h-10',
                isCollapsed ? "justify-center px-0 w-10 mx-auto" : "gap-3 px-3.5",
                isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
              )}
            >
              <div className={cn(
                "flex-shrink-0 transition-transform group-hover:scale-110",
                isActive(item.href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {item.icon}
              </div>

              {!isCollapsed && (
                <span className="transition-all duration-300 whitespace-nowrap overflow-hidden tracking-tight">
                  {item.label}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-popover text-popover-foreground text-[11px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-border shadow-2xl">
                  {item.label}
                </div>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border/40 bg-sidebar/50 backdrop-blur-sm">
          <div className={cn(
            "flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all duration-200 group/user",
            isCollapsed && "justify-center px-0"
          )}>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20 shadow-inner transition-transform group-hover/user:scale-105">
              <User className="w-5 h-5 text-primary" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-bottom-1 duration-400">
                <p className="text-[14px] font-black text-foreground truncate tracking-tight leading-tight mb-0.5">{user?.name}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.1em] opacity-60">Admin Portal</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={cn(
              "mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-all group/logout relative",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0 group-hover/logout:-translate-x-0.5 transition-transform" />
            {!isCollapsed && <span className="mt-0.5">Sign out</span>}

            {isCollapsed && (
              <div className="absolute left-full ml-4 px-3 py-2 bg-destructive text-destructive-foreground text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover/logout:opacity-100 group-hover/logout:visible transition-all whitespace-nowrap z-50 shadow-xl">
                Sign out
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-b border-border z-40">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
            <span className="font-bold text-foreground text-xl tracking-tight">Attendly</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
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
          'lg:hidden fixed inset-y-0 left-0 w-72 bg-sidebar border-r border-border/50 z-50 transform transition-transform duration-300 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-fit h-10 flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
            </div>
            <span className="font-bold text-foreground text-lg tracking-tight">Attendly</span>
          </div>
        </div>

        <nav className="py-6 px-4 space-y-1.5 overflow-y-auto">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-4 px-4 py-3.5 rounded-xl text-[13px] font-bold transition-all duration-200',
                isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
              )}
            >
              <div className={cn(isActive(item.href) ? "text-primary" : "text-muted-foreground")}>
                {item.icon}
              </div>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-5 bg-sidebar/80 backdrop-blur-md border-t border-border/40">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] text-destructive bg-destructive/5 hover:bg-destructive/10 border border-destructive/20 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:pt-0 pt-16 overflow-auto custom-scrollbar">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
