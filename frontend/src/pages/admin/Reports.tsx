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

const ReportRow = memo(({ report, onView, onResolve, formatDate }: {
  report: AbuseReport;
  onView: (r: AbuseReport) => void;
  onResolve: (r: AbuseReport) => void;
  formatDate: (d: string) => string;
}) => (
  <tr className="group hover:bg-white/5 transition-colors duration-200">
    <td className="py-3 px-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-300 shadow-inner">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
            {report.studentName}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-60">#{report.studentId}</p>
        </div>
      </div>
    </td>
    <td className="px-6">
      <div className="flex flex-col">
        <p className="text-sm font-bold text-foreground tracking-tight">{report.subjectName}</p>
        <p className="text-[10px] text-muted-foreground font-medium opacity-60 uppercase">{report.facultyName}</p>
      </div>
    </td>
    <td className="px-6">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[10px] font-black uppercase tracking-wider">
        <AlertTriangle className="w-3 h-3" />
        {report.reason.replace('_', ' ')}
      </span>
    </td>
    <td className="px-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Calendar className="w-3.5 h-3.5 opacity-40" />
        <span className="text-[11px] font-medium">{formatDate(report.createdAt)}</span>
      </div>
    </td>
    <td className="px-6">
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onView(report)}
          className="w-8 h-8 rounded-lg hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all"
        >
          <Eye className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onResolve(report)}
          className="w-8 h-8 rounded-lg hover:bg-success/10 hover:text-success border border-transparent hover:border-success/20 transition-all"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </td>
  </tr>
));

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
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5 tracking-tight">
              <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center border border-destructive/20 text-destructive">
                <ShieldAlert className="w-5 h-5" />
              </div>
              System Logs & Integrity
            </h1>
            <p className="text-[13px] text-muted-foreground ml-1">Vulnerability assessment and automated behavior flags</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Active Flags"
            value={stats.pending}
            icon={AlertTriangle}
            colorClass="warning"
            gradientClass="bg-warning/5"
            iconBgClass="bg-warning/10"
          />
          <StatsCard
            title="Total Logs"
            value={stats.total}
            icon={FileText}
            colorClass="primary"
            gradientClass="bg-primary/5"
            iconBgClass="bg-primary/10"
          />
          <StatsCard
            title="Resolved"
            value={stats.resolved}
            icon={CheckCircle2}
            colorClass="success"
            gradientClass="bg-success/5"
            iconBgClass="bg-success/10"
          />
          <StatsCard
            title="Recent (7d)"
            value={stats.recentReports}
            icon={History}
            colorClass="accent"
            gradientClass="bg-accent/5"
            iconBgClass="bg-accent/10"
          />
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by student, ID, or subject module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-secondary/30 border-border/50 rounded-xl text-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-48 h-9 bg-secondary/30 border-border/50 rounded-xl text-xs font-bold uppercase tracking-widest">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/50 backdrop-blur-xl">
              <SelectItem value="all">All Logs</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
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
          <div className="glass-card overflow-hidden rounded-2xl border-border/50 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/20">
                    <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Flagged Student</th>
                    <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Course Context</th>
                    <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Category</th>
                    <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Timestamp</th>
                    <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Resolve</th>
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
          </div>
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
