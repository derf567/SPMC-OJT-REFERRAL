import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { referralsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Stethoscope, FileText, Eye, Clock, User, MapPin, CheckCircle, XCircle, Loader2, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [decision, setDecision] = useState<'accept' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const response = await referralsAPI.getAll();
      
      // Handle both array and object responses
      const data = Array.isArray(response) ? response : (response.results || []);
      
      console.log('Fetched referrals:', data);
      setReferrals(data);
      
      // Calculate stats based on actual statuses
      const total = data.length;
      const pending = data.filter((r: any) => r.status === 'waiting_acceptance').length;
      const inProgress = data.filter((r: any) => 
        r.status === 'dispositioned' || 
        r.status === 'in_transit'
      ).length;
      const completed = data.filter((r: any) => r.status === 'completed').length;
      
      setStats({ total, pending, inProgress, completed });
    } catch (error) {
      console.error('Error fetching referrals:', error);
      setReferrals([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'pending': { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' },
      'in_triage': { label: 'In Triage', className: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
      'waiting_acceptance': { label: 'Waiting Acceptance', className: 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30' },
      'dispositioned': { label: 'Dispositioned', className: 'bg-green-500/20 text-green-600 border-green-500/30' },
      'in_transit': { label: 'In Transit', className: 'bg-purple-500/20 text-purple-600 border-purple-500/30' },
      'emergent': { label: 'Emergent', className: 'bg-red-500/20 text-red-600 border-red-500/30' },
      'urgent': { label: 'Urgent', className: 'bg-orange-500/20 text-orange-600 border-orange-500/30' },
      'schedule_opd': { label: 'Schedule OPD', className: 'bg-indigo-500/20 text-indigo-600 border-indigo-500/30' },
      'completed': { label: 'Completed', className: 'bg-gray-500/20 text-gray-600 border-gray-500/30' },
      'cancelled': { label: 'Cancelled', className: 'bg-red-500/20 text-red-600 border-red-500/30' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-500/20 text-gray-600 border-gray-500/30' };
    return (
      <Badge className={`${config.className} border`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDecision = (referral: any, decisionType: 'accept' | 'reject') => {
    setSelectedReferral(referral);
    setDecision(decisionType);
    setNotes('');
    setShowDecisionDialog(true);
  };

  const submitDecision = async () => {
    if (!selectedReferral || !decision) return;

    // Find the department acceptance for this doctor's department
    const userDepartment = user?.department;
    if (!userDepartment) {
      toast.error('Your department is not set');
      return;
    }

    try {
      setSubmitting(true);
      
      await referralsAPI.departmentDecision(
        selectedReferral.id.toString(),
        userDepartment,
        decision,
        notes
      );

      toast.success(`Referral ${decision === 'accept' ? 'accepted' : 'rejected'} successfully!`);
      
      // Refresh referrals
      await fetchReferrals();
      
      // Close dialog
      setShowDecisionDialog(false);
      setSelectedReferral(null);
      setDecision(null);
      setNotes('');
    } catch (error: any) {
      console.error('Error submitting decision:', error);
      toast.error(error.message || 'Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  };

  const canMakeDecision = (referral: any) => {
    // Check if referral is waiting for acceptance
    if (referral.status !== 'waiting_acceptance') return false;
    
    // Check if this department has a pending acceptance
    const userDepartment = user?.department;
    if (!userDepartment || !referral.department_acceptances) return false;
    
    const departmentAcceptance = referral.department_acceptances.find(
      (acc: any) => acc.department_code === userDepartment
    );
    
    return departmentAcceptance && departmentAcceptance.status === 'pending';
  };

  const getDepartmentAcceptanceStatus = (referral: any) => {
    const userDepartment = user?.department;
    if (!userDepartment || !referral.department_acceptances) return null;
    
    const departmentAcceptance = referral.department_acceptances.find(
      (acc: any) => acc.department_code === userDepartment
    );
    
    return departmentAcceptance;
  };

  const dashboardReferrals = useMemo(() => {
    return referrals.filter((referral: any) => {
      if (["completed", "cancelled", "uncoordinated"].includes(referral.status)) {
        return false;
      }

      const acceptanceStatus = Array.isArray(referral.department_acceptances)
        ? referral.department_acceptances.find((acc: any) => acc.department_code === user?.department)
        : null;
      if (acceptanceStatus?.status === "rejected") {
        return false;
      }

      return true;
    });
  }, [referrals, user?.department]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Stethoscope className="w-7 h-7 text-blue-600" />
              Doctor Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              View referrals assigned to {user?.department ? user.department.replace('_', ' ').toUpperCase() : 'your department'}
            </p>
          </div>
          <button
            onClick={() => navigate('/doctor/reports')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            View Reports
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 text-green-600 font-bold text-xl">✓</div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Stethoscope className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">View-Only Access</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                You have read-only access to referrals assigned to your department. 
                You can view patient information and referral details but cannot modify them.
              </p>
            </div>
          </div>
        </div>

        {/* Referrals List */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Department Referrals
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Referrals assigned to your department by Triage
            </p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : dashboardReferrals.length === 0 ? (
              <div className="text-center py-12">
                <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No active referrals found for your department</p>
              </div>
            ) : (
              <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-4">
                {Array.isArray(dashboardReferrals) && dashboardReferrals.map((referral) => {
                  const acceptanceStatus = getDepartmentAcceptanceStatus(referral);
                  const canDecide = canMakeDecision(referral);
                  
                  return (
                    <div
                      key={referral.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {referral.patient_full_name}
                            </h3>
                            {getStatusBadge(referral.status)}
                            {referral.triage_decision === 'emergent' && (
                              <Badge className="bg-red-500/20 text-red-600 border-red-500/30 border">
                                🚨 Emergent
                              </Badge>
                            )}
                            {referral.triage_decision === 'urgent' && (
                              <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30 border">
                                ⚡ Urgent
                              </Badge>
                            )}
                            {acceptanceStatus && (
                              <Badge className={
                                acceptanceStatus.status === 'accepted' 
                                  ? 'bg-green-500/20 text-green-600 border-green-500/30 border'
                                  : acceptanceStatus.status === 'rejected'
                                  ? 'bg-red-500/20 text-red-600 border-red-500/30 border'
                                  : 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30 border'
                              }>
                                {acceptanceStatus.status === 'accepted' && '✓ Accepted'}
                                {acceptanceStatus.status === 'rejected' && '✗ Rejected'}
                                {acceptanceStatus.status === 'pending' && '⏱ Pending'}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{referral.age}y, {referral.gender}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">{referral.referring_hospital_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <span className="truncate">{referral.chief_complaint}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{formatDate(referral.created_at)}</span>
                            </div>
                          </div>
                          {referral.triage_remarks && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                              <span className="font-medium">Triage Remarks:</span> {referral.triage_remarks}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 border-slate-300 bg-white/70 px-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-700/60"
                            onClick={() => navigate(`/referral/view/${referral.id}`)}
                            title="Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Details
                          </Button>
                          {canDecide && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDecision(referral, 'accept')}
                                className="h-8 rounded-md border-emerald-500/60 bg-emerald-50 px-3 text-emerald-700 hover:border-emerald-600 hover:bg-emerald-100 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:border-emerald-400 dark:hover:bg-emerald-500/25"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDecision(referral, 'reject')}
                                className="h-8 rounded-md border-rose-500/60 bg-rose-50 px-3 text-rose-700 hover:border-rose-600 hover:bg-rose-100 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:border-rose-400 dark:hover:bg-rose-500/25"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decision Dialog */}
      <Dialog open={showDecisionDialog} onOpenChange={setShowDecisionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {decision === 'accept' ? 'Accept Referral' : 'Reject Referral'}
            </DialogTitle>
            <DialogDescription>
              {decision === 'accept' 
                ? 'Confirm that your department can accept this referral.'
                : 'Provide a reason for rejecting this referral.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReferral && (
            <div className="space-y-4">
              {/* Patient Info */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedReferral.patient_full_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedReferral.age}y, {selectedReferral.gender} • {selectedReferral.chief_complaint}
                </p>
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes {decision === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={decision === 'accept' ? 'Optional notes...' : 'Please provide a reason for rejection...'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  rows={4}
                  required={decision === 'reject'}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDecisionDialog(false);
                    setSelectedReferral(null);
                    setDecision(null);
                    setNotes('');
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitDecision}
                  disabled={submitting || (decision === 'reject' && !notes.trim())}
                  className={decision === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      {decision === 'accept' ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
