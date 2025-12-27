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
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Subjects', href: '/admin/subjects', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'Classes', href: '/admin/classes', icon: <Building className="w-5 h-5" /> },
  { label: 'Faculty', href: '/admin/faculty', icon: <Users className="w-5 h-5" /> },
  { label: 'Students', href: '/admin/students', icon: <GraduationCap className="w-5 h-5" /> },
  { label: 'Mappings', href: '/admin/mappings', icon: <Link2 className="w-5 h-5" /> },
  { label: 'Timetable', href: '/admin/timetable', icon: <Calendar className="w-5 h-5" /> },
  { label: 'Abuse Reports', href: '/admin/reports', icon: <AlertTriangle className="w-5 h-5" /> },
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
          "hidden lg:flex lg:flex-col border-r border-border bg-sidebar sticky top-0 h-screen transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo & Toggle */}
        <div className={cn(
          "h-16 flex items-center border-b border-sidebar-border overflow-hidden transition-all duration-300",
          isCollapsed ? "justify-center px-0" : "justify-between px-6"
        )}>
          {!isCollapsed && (
            <div className="flex items-center gap-3 animate-in fade-in duration-300">
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
          "flex-1 py-6 px-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar",
          isCollapsed && "scrollbar-none"
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
                <div className="absolute left-full ml-4 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-border shadow-md">
                  {item.label}
                </div>
              )}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-sidebar-border">
          <div className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 hover:bg-sidebar-accent/50 group/user",
            isCollapsed && "justify-center px-0"
          )}>
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20 shadow-sm transition-transform group-hover/user:scale-105">
              <User className="w-5 h-5 text-primary" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-base font-black text-foreground truncate tracking-tight leading-tight">{user?.name}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] opacity-60">Administrator</p>
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
              <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-destructive text-destructive-foreground text-[11px] font-bold uppercase tracking-wider rounded-lg opacity-0 invisible group-hover/logout:opacity-100 group-hover/logout:visible transition-all whitespace-nowrap z-50 shadow-xl">
                Sign out
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-b border-border z-40">
        <div className="flex items-center justify-between h-full px-4">
          <span className="font-semibold text-foreground text-xl tracking-tight">Attendly</span>
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
          'lg:hidden fixed top-16 left-0 bottom-0 w-64 bg-sidebar border-r border-border z-40 transform transition-transform duration-300',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="py-6 px-3 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:pt-0 pt-16 overflow-auto custom-scrollbar">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
