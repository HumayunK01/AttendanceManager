import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Loader2, Eye } from 'lucide-react';
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
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await adminAPI.getAbuseReports();
      setReports(response.data);
    } catch (error) {
      // Mock data
      setReports([
        {
          id: '1',
          studentName: 'Alice Johnson',
          studentId: 'CS2024001',
          facultyName: 'Dr. John Smith',
          subjectName: 'Data Structures',
          reason: 'Incorrect Attendance',
          description: 'I was present in class on Dec 20th but marked absent. I have proof of my attendance via the lab sign-in sheet.',
          status: 'pending',
          createdAt: '2024-12-22T10:30:00Z',
        },
        {
          id: '2',
          studentName: 'Bob Williams',
          studentId: 'CS2024002',
          facultyName: 'Dr. Sarah Johnson',
          subjectName: 'Computer Networks',
          reason: 'System Error',
          description: 'The attendance session was locked before I could mark my attendance even though I was in the classroom.',
          status: 'pending',
          createdAt: '2024-12-21T14:15:00Z',
        },
        {
          id: '3',
          studentName: 'Carol Davis',
          studentId: 'CS2024003',
          facultyName: 'Prof. Michael Brown',
          subjectName: 'Operating Systems',
          reason: 'Proxy Attendance',
          description: 'Reporting that some students are marking proxy attendance using mobile phones during lectures.',
          status: 'resolved',
          createdAt: '2024-12-20T09:00:00Z',
        },
      ]);
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
        title: 'Report Resolved',
        description: 'The abuse report has been marked as resolved.',
      });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'An error occurred.',
        variant: 'destructive',
      });
    }
  };

  const pendingReports = reports.filter(r => r.status === 'pending');
  const resolvedReports = reports.filter(r => r.status === 'resolved');

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Abuse Reports</h1>
          <p className="text-muted-foreground mt-1">Review and manage attendance-related complaints</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingReports.length}</p>
                <p className="text-sm text-muted-foreground">Pending Reports</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{resolvedReports.length}</p>
                <p className="text-sm text-muted-foreground">Resolved Reports</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : reports.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="w-12 h-12 text-success mb-4" />
            <p className="text-lg font-medium text-foreground">No reports</p>
            <p className="text-sm text-muted-foreground">All clear! No abuse reports have been filed.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingReports.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Pending ({pendingReports.length})</h2>
                {pendingReports.map((report) => (
                  <div key={report.id} className="glass-card p-5 border-l-4 border-warning hover-lift">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                            {report.reason}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-medium text-foreground mb-1">{report.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.subjectName} • {report.facultyName}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {report.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleResolve(report)}
                          className="bg-success hover:bg-success/90"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
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
                <h2 className="text-lg font-semibold text-foreground">Resolved ({resolvedReports.length})</h2>
                {resolvedReports.map((report) => (
                  <div key={report.id} className="glass-card p-5 opacity-60">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                            Resolved
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-medium text-foreground mb-1">{report.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.subjectName} • {report.facultyName}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
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
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Filed on {selectedReport && new Date(selectedReport.createdAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Student</p>
                  <p className="font-medium text-foreground">{selectedReport.studentName}</p>
                  <p className="text-sm text-muted-foreground">{selectedReport.studentId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    selectedReport.status === 'pending' 
                      ? 'bg-warning/10 text-warning' 
                      : 'bg-success/10 text-success'
                  }`}>
                    {selectedReport.status === 'pending' ? 'Pending' : 'Resolved'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Reason</p>
                <p className="font-medium text-foreground">{selectedReport.reason}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Subject & Faculty</p>
                <p className="font-medium text-foreground">{selectedReport.subjectName}</p>
                <p className="text-sm text-muted-foreground">{selectedReport.facultyName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Description</p>
                <p className="text-foreground">{selectedReport.description}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
            {selectedReport?.status === 'pending' && (
              <Button
                onClick={() => handleResolve(selectedReport)}
                className="bg-success hover:bg-success/90"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
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
