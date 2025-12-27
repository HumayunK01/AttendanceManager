import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye,
  User,
  BookOpen,
  Calendar,
  FileText,
  X,
  Filter,
  Users,
  Building,
  CheckCircle2,
  ChevronRight,
  Search
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

const ReportCard = memo(({ report, onView, onResolve, formatDate }: {
  report: AbuseReport;
  onView: (r: AbuseReport) => void;
  onResolve: (r: AbuseReport) => void;
  formatDate: (d: string) => string;
}) => (
  <div className={`glass-card p-5 border-l-4 ${report.status === 'pending' ? 'border-warning' : 'border-success'} overflow-hidden relative group transition-all duration-300 hover:shadow-lg ${report.status === 'resolved' ? 'opacity-70 hover:opacity-100' : ''}`}>
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
      <div className="flex items-start gap-4 flex-1">
        <div className={`w-12 h-12 rounded-2xl ${report.status === 'pending' ? 'bg-warning/10 border-warning/20' : 'bg-success/10 border-success/20'} border flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
          {report.status === 'pending' ? <AlertTriangle className="w-6 h-6 text-warning" /> : <CheckCircle2 className="w-6 h-6 text-success" />}
        </div>
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${report.status === 'pending' ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-success/10 text-success border border-success/20'}`}>
              {report.reason}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest flex items-center gap-1 opacity-60">
              <Calendar className="w-3 h-3" />
              {formatDate(report.createdAt)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary opacity-60" />
              <p className="text-sm font-bold text-foreground tracking-tight">{report.studentName}</p>
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter opacity-40">#{report.studentId}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent opacity-60" />
              <p className="text-sm font-medium text-muted-foreground tracking-tight truncate">
                <span className="font-bold text-foreground/80">{report.subjectName}</span> • {report.facultyName}
              </p>
            </div>
          </div>

          <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-1 italic font-medium opacity-80">
            "{report.description}"
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(report)}
          className="h-9 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all active:scale-95 gap-2"
        >
          <Eye className="w-3.5 h-3.5" />
          Details
        </Button>
        {report.status === 'pending' && (
          <Button
            size="sm"
            onClick={() => onResolve(report)}
            className="h-9 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-success hover:bg-success/90 text-success-foreground shadow-lg shadow-success/20 transition-all active:scale-95 gap-2"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Resolve
          </Button>
        )}
      </div>
    </div>
  </div>
));

ReportCard.displayName = 'ReportCard';

// --- Main Component ---

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<AbuseReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<AbuseReport | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getAbuseReports();
      setReports(response.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load abuse reports. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (report: AbuseReport) => {
    try {
      await adminAPI.resolveAbuseReport(report.id);
      setReports(reports.map(r =>
        r.id === report.id ? { ...r, status: 'resolved' as const } : r
      ));
      toast({
        title: 'Success',
        description: 'Report marked as resolved successfully.',
      });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to resolve report.',
        variant: 'destructive',
      });
    }
  };

  const filteredReports = useMemo(() => {
    if (filterStatus === 'all') return reports;
    return reports.filter(r => r.status === filterStatus);
  }, [reports, filterStatus]);

  const stats = useMemo(() => {
    const pending = reports.filter(r => r.status === 'pending').length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    const recentReports = reports.filter(r => {
      const daysDiff = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;

    return { pending, resolved, total: reports.length, recentReports };
  }, [reports]);

  const handleClearFilter = useCallback(() => {
    setFilterStatus('all');
  }, []);

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
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5 tracking-tight">
              <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center border border-destructive/20 text-destructive">
                <AlertTriangle className="w-5 h-5" />
              </div>
              Abuse Reports
            </h1>
            <p className="text-[13px] text-muted-foreground ml-1">Review and manage student complaints regarding lecture attendance</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Reports"
            value={stats.total}
            icon={FileText}
            colorClass="primary"
            gradientClass="bg-gradient-to-br from-primary/5 to-transparent"
            iconBgClass="bg-primary/10"
          />
          <StatsCard
            title="Pending"
            value={stats.pending}
            icon={AlertTriangle}
            colorClass="warning"
            gradientClass="bg-gradient-to-br from-warning/5 to-transparent"
            iconBgClass="bg-warning/10"
          />
          <StatsCard
            title="Resolved"
            value={stats.resolved}
            icon={CheckCircle2}
            colorClass="success"
            gradientClass="bg-gradient-to-br from-success/5 to-transparent"
            iconBgClass="bg-success/10"
          />
          <StatsCard
            title="Recent (7d)"
            value={stats.recentReports}
            icon={Calendar}
            colorClass="accent"
            gradientClass="bg-gradient-to-br from-accent/5 to-transparent"
            iconBgClass="bg-accent/10"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 group">
            <div className="p-1 px-2 rounded-lg bg-card border border-border/50 text-muted-foreground text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Filter className="w-3 h-3 text-primary" />
              Filter Status
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 h-9 bg-card border-border/50 focus:border-primary/50 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm">
                <SelectValue placeholder="All Reports" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 bg-card/95 backdrop-blur-xl">
                <SelectItem value="all" className="text-xs font-bold focus:bg-primary focus:text-primary-foreground rounded-lg m-1 cursor-pointer uppercase tracking-widest">All Reports</SelectItem>
                <SelectItem value="pending" className="text-xs font-bold focus:bg-primary focus:text-primary-foreground rounded-lg m-1 cursor-pointer uppercase tracking-widest">Pending</SelectItem>
                <SelectItem value="resolved" className="text-xs font-bold focus:bg-primary focus:text-primary-foreground rounded-lg m-1 cursor-pointer uppercase tracking-widest">Resolved</SelectItem>
              </SelectContent>
            </Select>
            {filterStatus !== 'all' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearFilter}
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all border border-border/50"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 glass-card rounded-2xl border-dashed">
              <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50 mb-4" />
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] animate-pulse">Syncing reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border-dashed border-2">
              <div className="w-16 h-16 rounded-full bg-success/5 flex items-center justify-center border border-success/10 mb-6">
                <CheckCircle2 className="w-9 h-9 text-success/40" />
              </div>
              <h3 className="text-xl font-black text-foreground tracking-tight mb-2">
                All Clean!
              </h3>
              <p className="text-[13px] text-muted-foreground max-w-sm mx-auto font-medium">
                {filterStatus === 'all'
                  ? "No abuse reports have been filed by students yet. The attendance system is running smoothly."
                  : `There are no ${filterStatus} reports matching your current filter selection.`}
              </p>
              {filterStatus !== 'all' && (
                <Button
                  onClick={handleClearFilter}
                  variant="outline"
                  className="mt-6 h-9 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary/50"
                >
                  View All Reports
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onView={(r) => {
                    setSelectedReport(r);
                    setIsDialogOpen(true);
                  }}
                  onResolve={handleResolve}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 flex items-center justify-between opacity-50 px-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Admin Oversight System Active</span>
          </div>
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">Confidential High-Priority Access</p>
        </div>
      </div>

      {/* Report Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 sm:max-w-[500px] overflow-hidden p-0 shadow-2xl rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-primary/5 pointer-events-none" />

          <DialogHeader className="p-6 pb-0 relative">
            <div className="flex items-center gap-4 mb-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-inner ${selectedReport?.status === 'pending' ? 'bg-warning/10 border-warning/20' : 'bg-success/10 border-success/20'}`}>
                {selectedReport?.status === 'pending' ? <AlertTriangle className="w-5 h-5 text-warning" /> : <CheckCircle2 className="w-5 h-5 text-success" />}
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-foreground">
                  Report Investigation
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  File ID: {selectedReport?.id?.substring(0, 8) || 'N/A'} • {selectedReport && formatDate(selectedReport.createdAt)}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedReport && (
            <div className="p-6 pt-6 space-y-6 relative overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Student / Reporter</Label>
                  <div className="p-3 bg-secondary/30 rounded-2xl border border-border/30">
                    <p className="text-sm font-black text-foreground tracking-tight">{selectedReport.studentName}</p>
                    <p className="text-[11px] font-bold text-primary tracking-widest uppercase opacity-60">#{selectedReport.studentId}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Current Status</Label>
                  <div className={`p-3 rounded-2xl border flex items-center gap-2 ${selectedReport.status === 'pending' ? 'bg-warning/5 border-warning/20 text-warning' : 'bg-success/5 border-success/20 text-success'}`}>
                    {selectedReport.status === 'pending' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span className="text-[11px] font-black uppercase tracking-widest">{selectedReport.status}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Report Motivation / Reason</Label>
                <div className="p-3 px-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                  <p className="text-xs font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {selectedReport.reason}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Subject & Instructor</Label>
                <div className="p-3 bg-secondary/30 rounded-2xl border border-border/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center border border-accent/20">
                      <BookOpen className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-sm font-bold text-foreground tracking-tight">{selectedReport.subjectName}</span>
                  </div>
                  <div className="h-4 w-px bg-border/50 mx-2" />
                  <span className="text-xs font-medium text-muted-foreground">{selectedReport.facultyName}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Report Narrative</Label>
                <div className="p-4 bg-card border border-border/50 rounded-2xl relative shadow-inner">
                  <div className="absolute top-2 left-2 text-primary/10 select-none">
                    <CheckCircle className="w-12 h-12 -rotate-12" />
                  </div>
                  <p className="text-[13px] text-foreground leading-[1.6] relative z-10 font-medium italic">
                    "{selectedReport.description}"
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="p-6 bg-secondary/40 border-t border-border/50">
            <div className="flex items-center justify-end gap-3 w-full">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="h-10 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-secondary/80 transition-all active:scale-95"
              >
                Close View
              </Button>
              {selectedReport?.status === 'pending' && (
                <Button
                  onClick={() => handleResolve(selectedReport)}
                  className="h-10 px-8 rounded-xl text-[11px] font-black uppercase tracking-widest bg-success hover:bg-success/90 text-success-foreground shadow-lg shadow-success/20 transition-all active:scale-95 gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark as Resolved
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ReportsPage;
