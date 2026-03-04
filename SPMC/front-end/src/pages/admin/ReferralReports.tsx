import { useState, useEffect } from "react";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Eye, CheckCircle, XCircle, Clock, User, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ReferralReport {
  id: number;
  referral: number;
  referral_id: string;
  reported_by_name: string;
  reported_user_name: string;
  reason: string;
  description: string;
  status: string;
  reviewed_by_name?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam/Fake Referral',
  duplicate: 'Duplicate Referral',
  fraudulent: 'Fraudulent Information',
  inappropriate: 'Inappropriate Content',
  test_data: 'Test/Practice Data',
  other: 'Other',
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'under_review':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'resolved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'dismissed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const ReferralReports = () => {
  const [reports, setReports] = useState<ReferralReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReferralReport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [banUser, setBanUser] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/reports/', {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch reports');

      const data = await response.json();
      setReports(data.results || data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkUnderReview = async (reportId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/reports/${reportId}/review/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to update report');

      toast({
        title: "Success",
        description: "Report marked as under review",
      });

      fetchReports();
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: "Error",
        description: "Failed to update report",
        variant: "destructive",
      });
    }
  };

  const handleResolve = async () => {
    if (!selectedReport) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/reports/${selectedReport.id}/resolve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          review_notes: reviewNotes,
          ban_user: banUser,
        }),
      });

      if (!response.ok) throw new Error('Failed to resolve report');

      const data = await response.json();

      toast({
        title: "Success",
        description: banUser 
          ? "Report resolved and user has been banned" 
          : "Report resolved successfully",
      });

      setShowResolveModal(false);
      setReviewNotes('');
      setBanUser(false);
      setSelectedReport(null);
      fetchReports();
    } catch (error) {
      console.error('Error resolving report:', error);
      toast({
        title: "Error",
        description: "Failed to resolve report",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = async (reportId: number) => {
    const notes = prompt('Enter reason for dismissing this report:');
    if (!notes) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/reports/${reportId}/dismiss/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          review_notes: notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to dismiss report');

      toast({
        title: "Success",
        description: "Report dismissed",
      });

      fetchReports();
    } catch (error) {
      console.error('Error dismissing report:', error);
      toast({
        title: "Error",
        description: "Failed to dismiss report",
        variant: "destructive",
      });
    }
  };

  const filteredReports = filterStatus === 'all' 
    ? reports 
    : reports.filter(r => r.status === filterStatus);

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading reports...</div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Referral Reports</h1>
            <p className="text-gray-500 dark:text-gray-400">Review and manage reported referrals</p>
          </div>
          <Button onClick={fetchReports} variant="outline" className="dark:border-gray-600 dark:text-gray-300">
            Refresh
          </Button>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filter by Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Reports</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        {/* Reports Table */}
        {filteredReports.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No reports found</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Referral
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Reported By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Reported User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {report.referral_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">{report.reported_by_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{report.reported_user_name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="text-xs">
                          {REASON_LABELS[report.reason] || report.reason}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(report.status)}>
                          {report.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report);
                              setShowDetailModal(true);
                            }}
                            className="text-blue-600 dark:text-blue-400"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {report.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkUnderReview(report.id)}
                              className="text-blue-600 dark:text-blue-400"
                            >
                              <Clock className="w-4 h-4" />
                            </Button>
                          )}
                          {(report.status === 'pending' || report.status === 'under_review') && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setShowResolveModal(true);
                                }}
                                className="text-green-600 dark:text-green-400"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDismiss(report.id)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Referral ID</label>
                  <p className="text-gray-900 dark:text-white">{selectedReport.referral_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <Badge className={getStatusColor(selectedReport.status)}>
                    {selectedReport.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Reported By</label>
                  <p className="text-gray-900 dark:text-white">{selectedReport.reported_by_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Reported User</label>
                  <p className="text-gray-900 dark:text-white">{selectedReport.reported_user_name || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Reason</label>
                <p className="text-gray-900 dark:text-white">{REASON_LABELS[selectedReport.reason]}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedReport.description}</p>
              </div>
              {selectedReport.review_notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Review Notes</label>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedReport.review_notes}</p>
                </div>
              )}
              {selectedReport.reviewed_by_name && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Reviewed By</label>
                  <p className="text-gray-900 dark:text-white">{selectedReport.reviewed_by_name}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Modal */}
      <Dialog open={showResolveModal} onOpenChange={setShowResolveModal}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Resolve Report</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Add review notes and optionally ban the reported user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Review Notes
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={4}
                placeholder="Enter your review notes..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="banUser"
                checked={banUser}
                onChange={(e) => setBanUser(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="banUser" className="text-sm text-gray-700 dark:text-gray-300">
                Ban the reported user
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResolveModal(false);
                  setReviewNotes('');
                  setBanUser(false);
                }}
                className="dark:border-gray-600 dark:text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolve}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Resolve Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
};

export default ReferralReports;
