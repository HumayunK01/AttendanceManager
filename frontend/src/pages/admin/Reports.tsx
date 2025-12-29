import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  AlertTriangle,
  Loader2,
  Eye,
  User,
  BookOpen,
  Calendar,
  FileText,
  X,
  Filter,
  CheckCircle2,
  ShieldAlert,
  Search,
  History,
  Info
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

// --- Types ---

interface AbuseReport {
  id: string;
  studentName: string;
  studentId: string;
  facultyName: string;
  subjectName: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

// --- Sub-components ---

const StatsCard = memo(({ title, value, icon: Icon, colorClass, gradientClass, iconBgClass }: any) => (
  <div className={`glass-card p-4 rounded-xl border border-border/50 ${gradientClass} flex flex-col justify-between overflow-hidden relative group transition-all duration-300 hover:shadow-lg hover:shadow-${colorClass}/5`}>
    <div className={`absolute -right-4 -top-4 w-20 h-20 ${iconBgClass} rounded-full blur-2xl group-hover:opacity-70 transition-opacity duration-500`} />
    <div className="relative">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-9 h-9 rounded-xl ${iconBgClass} flex items-center justify-center border border-${colorClass}/20 shadow-inner`}>
          <Icon className={`w-5 h-5 text-${colorClass}`} />
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">{title}</p>
          <div className={`h-0.5 w-6 bg-${colorClass} rounded-full`} />
        </div>
      </div>
      <p className={`text-2xl font-black text-${colorClass === 'foreground' ? 'foreground' : colorClass} tracking-tight`}>{value}</p>
    </div>
  </div>
));

StatsCard.displayName = 'StatsCard';

const MobileReportCard = memo(({ report, onView, onResolve, formatDate }: {
  report: AbuseReport;
  onView: (r: AbuseReport) => void;
  onResolve: (r: AbuseReport) => void;
  formatDate: (d: string) => string;
}) => (
  <div className="glass-card p-5 space-y-5 border-border/30 group relative overflow-hidden">
    <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/5 blur-3xl rounded-full -mr-8 -mt-8" />

    <div className="flex items-start justify-between gap-4 relative z-10">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shrink-0 shadow-inner">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-black text-foreground group-hover:text-primary transition-colors tracking-tight truncate">
            {report.studentName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest shrink-0">#{report.studentId}</span>
            <div className="h-[1px] w-4 bg-muted-foreground/10" />
            <span className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border",
              report.status === 'pending'
                ? "bg-warning/10 text-warning border-warning/20 animate-pulse"
                : "bg-success/10 text-success border-success/20"
            )}>
              {report.status === 'pending' ? <AlertTriangle className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
              {report.status}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onView(report)}
          className="w-9 h-9 rounded-xl hover:bg-primary/10 text-primary transition-all border border-transparent hover:border-primary/20 shrink-0"
        >
          <Eye className="w-4.5 h-4.5" />
        </Button>
        {report.status === 'pending' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onResolve(report)}
            className="w-9 h-9 rounded-xl hover:bg-success/10 text-success transition-all border border-transparent hover:border-success/20 shrink-0"
          >
            <CheckCircle2 className="w-4.5 h-4.5" />
          </Button>
        )}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 relative z-10">
      <div className="bg-secondary/20 rounded-2xl p-4 border border-white/5 flex flex-col gap-1.5 shadow-inner min-w-0">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Academic Context</p>
        <p className="text-[13px] font-black text-foreground tracking-tight leading-tight truncate px-0.5">
          {report.subjectName}
        </p>
      </div>
      <div className="bg-secondary/20 rounded-2xl p-4 border border-white/5 flex flex-col gap-1.5 shadow-inner min-w-0 text-right">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Report Category</p>
        <span className="text-[11px] font-black text-orange-500 tracking-tight uppercase px-0.5 truncate">
          {report.reason.replace('_', ' ')}
        </span>
      </div>
    </div>

    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.2em] relative z-10">
      <div className="flex items-center gap-1.5">
        <Calendar className="w-3 h-3 opacity-40" />
        <span>{formatDate(report.createdAt)}</span>
      </div>
      <span className="text-muted-foreground/60">{report.facultyName}</span>
    </div>
  </div>
));

const ReportRow = memo(({ report, onView, onResolve, formatDate }: {
  report: AbuseReport;
  onView: (r: AbuseReport) => void;
  onResolve: (r: AbuseReport) => void;
  formatDate: (d: string) => string;
}) => (
  <tr className="group hover:bg-white/5 transition-colors duration-200 border-l-2 border-transparent hover:border-l-primary/30">
    <td className="py-4 px-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-300 shadow-inner shrink-0 text-primary">
          <User className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors tracking-tight truncate max-w-[200px]">
            {report.studentName}
          </p>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.15em] opacity-40">#{report.studentId}</p>
        </div>
      </div>
    </td>
    <td className="px-6">
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-sm font-bold text-foreground tracking-tight truncate max-w-[250px]">{report.subjectName}</p>
        <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-tighter truncate max-w-[200px]">By {report.facultyName}</p>
      </div>
    </td>
    <td className="px-6">
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[10px] font-black uppercase tracking-wider shadow-sm">
        <AlertTriangle className="w-3.5 h-3.5" />
        {report.reason.replace('_', ' ')}
      </span>
    </td>
    <td className="px-6">
      <div className="flex items-center gap-2 text-muted-foreground/60">
        <Calendar className="w-4 h-4 opacity-40" />
        <span className="text-[11px] font-black uppercase tracking-widest">{formatDate(report.createdAt)}</span>
      </div>
    </td>
    <td className="px-6">
      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onView(report)}
          className="w-8 h-8 rounded-lg hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all"
        >
          <Eye className="w-4 h-4" />
        </Button>
        {report.status === 'pending' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onResolve(report)}
            className="w-8 h-8 rounded-lg hover:bg-success/10 hover:text-success border border-transparent hover:border-success/20 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </td>
  </tr>
));

MobileReportCard.displayName = 'MobileReportCard';
ReportRow.displayName = 'ReportRow';

// --- Main Component ---

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<AbuseReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<AbuseReport | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isResolving, setIsResolving] = useState(false);
  const { toast } = useToast();

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getAbuseReports();
      setReports(response.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast({
        title: 'Sync Failed',
        description: 'Could not synchronize with the report database.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResolve = async (report: AbuseReport) => {
    try {
      setIsResolving(true);
      await adminAPI.resolveAbuseReport(report.id);
      toast({
        title: 'Conflict Resolved',
        description: `Flags cleared for ${report.studentName}.`,
      });
      fetchReports();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Action Failed',
        description: error.response?.data?.message || 'Failed to resolve the flag.',
        variant: 'destructive',
      });
    } finally {
      setIsResolving(false);
      setSelectedReport(null);
    }
  };

  const filteredReports = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let filtered = reports;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    if (query) {
      filtered = filtered.filter(
        r =>
          r.studentName.toLowerCase().includes(query) ||
          r.subjectName.toLowerCase().includes(query) ||
          r.studentId.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [reports, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    const pending = reports.filter(r => r.status === 'pending').length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    const recentReports = reports.filter(r => {
      const daysDiff = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;

    return { pending, resolved, total: reports.length, recentReports };
  }, [reports]);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5 tracking-tight">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center border border-destructive/20 shadow-sm shrink-0">
                <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
              </div>
              <span className="truncate">System Logs</span>
            </h1>
            <p className="text-[11px] sm:text-[13px] text-muted-foreground ml-1 font-medium opacity-70">Integrity assessment and behavior monitoring</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-border/30 bg-gradient-to-br from-warning/10 to-transparent group hover:shadow-xl hover:shadow-warning/5 transition-all duration-500 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-warning/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Active Flags</p>
                <p className="text-3xl font-black text-foreground tracking-tighter tabular-nums">{stats.pending}</p>
                <div className="h-1 w-6 bg-warning rounded-full" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-warning/20 flex items-center justify-center border border-warning/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner text-warning">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-border/30 bg-gradient-to-br from-primary/10 to-transparent group hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Total Logs</p>
                <p className="text-3xl font-black text-foreground tracking-tighter tabular-nums">{stats.total}</p>
                <div className="h-1 w-6 bg-primary rounded-full" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-inner text-primary">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-border/30 bg-gradient-to-br from-success/10 to-transparent group hover:shadow-xl hover:shadow-success/5 transition-all duration-500 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-success/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Resolved</p>
                <p className="text-3xl font-black text-foreground tracking-tighter tabular-nums">{stats.resolved}</p>
                <div className="h-1 w-6 bg-success rounded-full" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center border border-success/20 group-hover:scale-110 transition-all duration-500 shadow-inner text-success">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-border/30 bg-gradient-to-br from-accent/10 to-transparent group hover:shadow-xl hover:shadow-accent/5 transition-all duration-500 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Recent (7d)</p>
                <p className="text-3xl font-black text-foreground tracking-tighter tabular-nums">{stats.recentReports}</p>
                <div className="h-1 w-6 bg-accent rounded-full" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center border border-accent/20 group-hover:scale-110 transition-all duration-500 shadow-inner text-accent">
                <History className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Filter by student ID or subject module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-secondary/30 border-border/50 focus:border-primary/50 rounded-xl text-sm transition-all"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full lg:w-48 h-10 bg-secondary/30 border-border/50 focus:border-primary/50 rounded-xl text-[10px] font-black uppercase tracking-[0.15em]">
              <div className="flex items-center gap-2">
                <Filter className="w-3 h-3 opacity-40 shrink-0" />
                <SelectValue placeholder="All Logs" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/50 backdrop-blur-xl">
              <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest py-2.5 leading-relaxed">All Status Logs</SelectItem>
              <SelectItem value="pending" className="text-[10px] font-black uppercase tracking-widest py-2.5 leading-relaxed">Pending Review</SelectItem>
              <SelectItem value="resolved" className="text-[10px] font-black uppercase tracking-widest py-2.5 leading-relaxed">Resolved Flags</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 glass-card rounded-2xl border-dashed">
            <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50 mb-4" />
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] animate-pulse">Analyzing logs...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border-dashed border-2 border-success/20 bg-success/5">
            <div className="w-16 h-16 rounded-3xl bg-success/10 flex items-center justify-center mb-6 border border-success/20">
              <CheckCircle2 className="w-8 h-8 text-success opacity-50" />
            </div>
            <h3 className="text-xl font-black text-foreground tracking-tight mb-1.5">No Integrity Issues Detected</h3>
            <p className="text-[13px] text-muted-foreground max-w-sm font-medium">
              The system is currently running with zero abnormal flags. All enrollment and attendance data appears consistent.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block glass-card overflow-hidden rounded-2xl border-border/50 shadow-xl bg-background/50 backdrop-blur-sm">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-secondary/20">
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-[30%]">Flagged Student</th>
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Module Context</th>
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-[180px]">Category</th>
                      <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-[150px]">Registry Date</th>
                      <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 w-[100px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredReports.map((report) => (
                      <ReportRow
                        key={report.id}
                        report={report}
                        onView={(r) => { setSelectedReport(r); setIsDialogOpen(true); }}
                        onResolve={handleResolve}
                        formatDate={formatDate}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-secondary/10 py-3.5 px-6 border-t border-border/50 flex items-center justify-between text-[10px] font-bold text-muted-foreground/40 tracking-[0.25em] uppercase">
                <span>Integrity System Online</span>
                <span>{filteredReports.length} Registered Events</span>
              </div>
            </div>

            {/* Mobile View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredReports.map((report) => (
                <MobileReportCard
                  key={report.id}
                  report={report}
                  onView={(r) => { setSelectedReport(r); setIsDialogOpen(true); }}
                  onResolve={handleResolve}
                  formatDate={formatDate}
                />
              ))}
              <div className="py-2 text-center text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
                Log Repository Bottom
              </div>
            </div>
          </>
        )}

        <div className="pt-2 flex items-center justify-between opacity-50 px-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Integrity Protocol v4.2 Active</span>
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50 sm:max-w-[450px] rounded-3xl shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Info className="w-5 h-5 text-orange-500" />
              </div>
              Vulnerability Details
            </DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-widest font-bold opacity-60">Log ID: {selectedReport?.id}</DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subject Member</Label>
                  <p className="text-[13px] font-bold text-foreground">{selectedReport.studentName}</p>
                </div>
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</Label>
                  <p className="text-[11px] font-black uppercase text-warning">{selectedReport.status}</p>
                </div>
              </div>

              <div className="space-y-1.5 p-4 rounded-2xl bg-secondary/30 border border-border/50">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70">System Assessment</Label>
                <p className="text-[13px] leading-relaxed text-muted-foreground italic">"{selectedReport.description}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subject</Label>
                  <p className="text-xs font-bold">{selectedReport.subjectName}</p>
                </div>
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Faculty Member</Label>
                  <p className="text-xs font-bold">{selectedReport.facultyName}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-secondary/30 p-4 border-t border-border/20 flex gap-3">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 rounded-xl font-bold h-10 text-sm">Dismiss</Button>
            {selectedReport?.status === 'pending' && (
              <Button
                onClick={() => handleResolve(selectedReport)}
                disabled={isResolving}
                className="flex-1 rounded-xl font-bold bg-success hover:bg-success/90 h-10 text-sm shadow-lg shadow-success/20"
              >
                {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Force Clear Flags'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default memo(ReportsPage);
