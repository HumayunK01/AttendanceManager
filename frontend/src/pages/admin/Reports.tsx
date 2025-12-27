import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertTriangle, CheckCircle, Loader2, Eye, User, BookOpen, Calendar, FileText, X, Filter } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
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

  // Memoized filtered reports
  const filteredReports = useMemo(() => {
    if (filterStatus === 'all') return reports;
    return reports.filter(r => r.status === filterStatus);
  }, [reports, filterStatus]);

  // Memoized stats
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const pendingReports = filteredReports.filter(r => r.status === 'pending');
  const resolvedReports = filteredReports.filter(r => r.status === 'resolved');

  return (
    <AdminLayout>
      <div className="space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 lg:w-7 lg:h-7 text-destructive" />
            </div>
            Abuse Reports
          </h1>
          <p className="text-muted-foreground mt-2 text-sm lg:text-base">
            Review and manage attendance-related complaints
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Total Reports</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
          </div>
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
            <p className="text-2xl font-bold text-success">{stats.resolved}</p>
          </div>
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>
            <p className="text-2xl font-bold text-accent">{stats.recentReports}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 bg-secondary/50 border-border/50">
                <SelectValue placeholder="All Reports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filterStatus !== 'all' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilter}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {filterStatus === 'all' ? 'No reports' : `No ${filterStatus} reports`}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {filterStatus === 'all'
                ? 'All clear! No abuse reports have been filed.'
                : `There are no ${filterStatus} reports at the moment.`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingReports.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Pending ({pendingReports.length})
                </h2>
                {pendingReports.map((report) => (
                  <div key={report.id} className="glass-card p-5 border-l-4 border-warning hover-lift group">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-warning/10 text-warning border border-warning/20">
                            {report.reason}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(report.createdAt)}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            <p className="font-semibold text-foreground">{report.studentName}</p>
                            <span className="text-sm text-muted-foreground">({report.studentId})</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <BookOpen className="w-4 h-4 text-accent" />
                            <span>{report.subjectName} • {report.facultyName}</span>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 pl-6">
                          {report.description}
                        </p>
                      </div>

                      <div className="flex gap-2 lg:flex-col">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setIsDialogOpen(true);
                          }}
                          className="flex-1 lg:flex-none gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleResolve(report)}
                          className="flex-1 lg:flex-none bg-success hover:bg-success/90 gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {resolvedReports.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  Resolved ({resolvedReports.length})
                </h2>
                {resolvedReports.map((report) => (
                  <div key={report.id} className="glass-card p-5 border-l-4 border-success opacity-70 hover:opacity-100 transition-opacity">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-success/10 text-success border border-success/20">
                            Resolved
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(report.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          <p className="font-semibold text-foreground">{report.studentName}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BookOpen className="w-4 h-4 text-accent" />
                          <span>{report.subjectName} • {report.facultyName}</span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setIsDialogOpen(true);
                        }}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Report Details</DialogTitle>
            <DialogDescription>
              Filed on {selectedReport && formatDate(selectedReport.createdAt)}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-5 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Student</p>
                  <p className="font-semibold text-foreground">{selectedReport.studentName}</p>
                  <p className="text-sm text-muted-foreground">{selectedReport.studentId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${selectedReport.status === 'pending'
                      ? 'bg-warning/10 text-warning border-warning/20'
                      : 'bg-success/10 text-success border-success/20'
                    }`}>
                    {selectedReport.status === 'pending' ? 'Pending' : 'Resolved'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Reason</p>
                <p className="font-semibold text-foreground">{selectedReport.reason}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Subject & Faculty</p>
                <p className="font-semibold text-foreground">{selectedReport.subjectName}</p>
                <p className="text-sm text-muted-foreground">{selectedReport.facultyName}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Description</p>
                <p className="text-foreground leading-relaxed">{selectedReport.description}</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
            {selectedReport?.status === 'pending' && (
              <Button
                onClick={() => handleResolve(selectedReport)}
                className="bg-success hover:bg-success/90 gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Resolved
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ReportsPage;
