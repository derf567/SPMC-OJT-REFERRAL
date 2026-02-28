import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { referralsAPI, departmentsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, ClipboardList, CheckCircle, Clock, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Department {
  id: number;
  code: string;
  name: string;
  contact_number: string;
  is_active: boolean;
}

interface DepartmentAcceptance {
  id: number;
  department_code: string;
  department_name: string;
  status: 'pending' | 'accepted' | 'rejected';
  accepted_by_name?: string;
  accepted_at?: string;
  notes?: string;
}

interface AcceptanceSummary {
  total: number;
  accepted: number;
  rejected: number;
  pending: number;
  majority_needed: number;
}

interface TriageReferral {
  id: number;
  referral_id: string;
  patient_full_name: string;
  age: number;
  gender: string;
  status: string;
  chief_complaint: string;
  working_impression: string;
  specialty_needed_name: string;
  referring_hospital_name: string;
  created_at: string;
  in_triage: boolean;
  triage_remarks?: string;
  department_acceptances: DepartmentAcceptance[];
  acceptance_summary: AcceptanceSummary;
  assigned_departments: string[];
}

export default function TriageReferrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<TriageReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedReferral, setSelectedReferral] = useState<TriageReferral | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    fetchTriageReferrals();
    fetchDepartments();
  }, [statusFilter]);

  const fetchTriageReferrals = async () => {
    try {
      setLoading(true);
      const response = await referralsAPI.getTriageReferrals(statusFilter);
      setReferrals(response);
    } catch (error: any) {
      console.error('Error fetching triage referrals:', error);
      toast.error('Failed to load triage referrals');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentsAPI.getAll();
      // Handle both array response and paginated response
      const deptData = Array.isArray(response) ? response : (response.results || []);
      setDepartments(deptData);
      console.log('Departments loaded:', deptData);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
      setDepartments([]); // Set empty array on error
    }
  };

  const handleAssignDepartments = (referral: TriageReferral) => {
    setSelectedReferral(referral);
    setShowAssignDialog(true);
  };

  const handleViewDetails = (referral: TriageReferral) => {
    setSelectedReferral(referral);
    setShowDetailsDialog(true);
  };

  const handleMarkComplete = (referral: TriageReferral) => {
    setSelectedReferral(referral);
    setCompletionNotes('');
    setShowCompleteDialog(true);
  };

  const handleMarkCancelled = (referral: TriageReferral) => {
    setSelectedReferral(referral);
    setCancellationReason('');
    setShowCancelDialog(true);
  };

  const submitComplete = async () => {
    if (!selectedReferral) return;

    try {
      setSubmitting(true);
      await referralsAPI.markInTransitCompleted(selectedReferral.id.toString(), completionNotes);
      toast.success('Referral marked as completed successfully!');
      setShowCompleteDialog(false);
      fetchTriageReferrals(); // Reload list
    } catch (error: any) {
      console.error('Error marking as completed:', error);
      toast.error(error.message || 'Failed to mark as completed');
    } finally {
      setSubmitting(false);
    }
  };

  const submitCancel = async () => {
    if (!selectedReferral) return;

    if (!cancellationReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    try {
      setSubmitting(true);
      await referralsAPI.markInTransitCancelled(selectedReferral.id.toString(), cancellationReason);
      toast.success('Referral marked as cancelled');
      setShowCancelDialog(false);
      fetchTriageReferrals(); // Reload list
    } catch (error: any) {
      console.error('Error marking as cancelled:', error);
      toast.error(error.message || 'Failed to mark as cancelled');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      in_triage: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pending Assignment' },
      waiting_acceptance: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Waiting Acceptance' },
      dispositioned: { bg: 'bg-green-100', text: 'text-green-800', label: 'Dispositioned' },
      in_transit: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'In Transit' },
    };
    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-800">Triage Referrals</h1>
        </div>
        <button
          onClick={fetchTriageReferrals}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Status
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">All Statuses</option>
          <option value="in_triage">Pending Assignment</option>
          <option value="waiting_acceptance">Waiting Acceptance</option>
          <option value="dispositioned">Dispositioned</option>
        </select>
      </div>

      {/* Referrals Table */}
      {referrals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No referrals in triage</p>
          <p className="text-gray-400 text-sm mt-2">
            Transfer referrals from Active Referrals to see them here
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referral ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chief Complaint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acceptance Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {referral.referral_id}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {referral.patient_full_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {referral.age} yrs, {referral.gender}
                      </div>
                      <div className="text-xs text-gray-500">
                        {referral.referring_hospital_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {referral.chief_complaint}
                      </div>
                      <div className="text-xs text-gray-500">
                        {referral.specialty_needed_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(referral.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {referral.acceptance_summary.total > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-1 text-sm">
                              <span className="font-medium">
                                {referral.acceptance_summary.accepted}/{referral.acceptance_summary.total}
                              </span>
                              <span className="text-gray-500">accepted</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Need {referral.acceptance_summary.majority_needed} for approval
                            </div>
                          </div>
                          {referral.acceptance_summary.accepted >= referral.acceptance_summary.majority_needed && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {referral.status === 'in_triage' && (
                          <button
                            onClick={() => handleAssignDepartments(referral)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            Assign Departments
                          </button>
                        )}
                        {referral.status === 'waiting_acceptance' && (
                          <button
                            onClick={() => handleViewDetails(referral)}
                            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                          >
                            View Status
                          </button>
                        )}
                        {referral.status === 'dispositioned' && (
                          <button
                            onClick={() => handleViewDetails(referral)}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                          >
                            View Details
                          </button>
                        )}
                        {referral.status === 'in_transit' && (
                          <>
                            <button
                              onClick={() => handleMarkComplete(referral)}
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Complete
                            </button>
                            <button
                              onClick={() => handleMarkCancelled(referral)}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-1"
                            >
                              <XCircle className="w-4 h-4" />
                              Cancel
                            </button>
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

      {/* Assign Departments Dialog */}
      {showAssignDialog && selectedReferral && (
        <AssignDepartmentsDialog
          referral={selectedReferral}
          departments={departments}
          onClose={() => {
            setShowAssignDialog(false);
            setSelectedReferral(null);
          }}
          onSuccess={() => {
            fetchTriageReferrals();
            setShowAssignDialog(false);
            setSelectedReferral(null);
          }}
        />
      )}

      {/* Details Dialog */}
      {showDetailsDialog && selectedReferral && (
        <DetailsDialog
          referral={selectedReferral}
          departments={departments}
          onClose={() => {
            setShowDetailsDialog(false);
            setSelectedReferral(null);
          }}
        />
      )}

      {/* Complete Dialog */}
      {showCompleteDialog && selectedReferral && (
        <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Mark as Completed
              </DialogTitle>
              <DialogDescription>
                Confirm that the patient has arrived and treatment is completed
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Patient Info */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedReferral.patient_full_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Referral ID: {selectedReferral.referral_id}
                </p>
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Completion Notes (Optional)
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Add any notes about the completion..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white resize-none"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowCompleteDialog(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitComplete}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Marking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Completed
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Cancel Dialog */}
      {showCancelDialog && selectedReferral && (
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Cancel Referral
              </DialogTitle>
              <DialogDescription>
                Mark this referral as cancelled (patient did not arrive or expired)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Patient Info */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedReferral.patient_full_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Referral ID: {selectedReferral.referral_id}
                </p>
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g., Patient did not arrive, Patient expired, etc."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white resize-none"
                  rows={3}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitCancel}
                  disabled={submitting || !cancellationReason.trim()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Referral
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
    </DashboardLayout>
  );
}

// Assign Departments Dialog Component
function AssignDepartmentsDialog({ 
  referral, 
  departments, 
  onClose, 
  onSuccess 
}: {
  referral: TriageReferral;
  departments: Department[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [triageDecision, setTriageDecision] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selectedDepts.length === 0) {
      toast.error('Please select at least one department');
      return;
    }

    if (!triageDecision) {
      toast.error('Please select a triage decision (Emergent/Urgent/Schedule OPD)');
      return;
    }

    // Validate scheduled date/time for OPD
    if (triageDecision === 'schedule_opd') {
      if (!scheduledDate || !scheduledTime) {
        toast.error('Please select appointment date and time for OPD scheduling');
        return;
      }

      // Check if date is not in the past
      const selectedDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const now = new Date();
      if (selectedDateTime <= now) {
        toast.error('Cannot schedule appointments in the past. Please select a future date and time.');
        return;
      }
    }

    try {
      setSubmitting(true);
      
      await referralsAPI.assignDepartments(
        referral.id.toString(), 
        selectedDepts, 
        remarks,
        triageDecision,
        triageDecision === 'schedule_opd' ? scheduledDate : undefined,
        triageDecision === 'schedule_opd' ? scheduledTime : undefined
      );
      
      toast.success('Departments assigned successfully with triage decision!');
      onSuccess();
    } catch (error: any) {
      console.error('Error assigning departments:', error);
      toast.error(error.message || 'Failed to assign departments');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Assign Departments</h2>
        
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Referral:</span> {referral.referral_id}
          </p>
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Patient:</span> {referral.patient_full_name}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Chief Complaint:</span> {referral.chief_complaint}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Departments <span className="text-red-500">*</span>
            <span className="text-gray-500 font-normal ml-2">(can select multiple)</span>
          </label>
          <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {!departments || departments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No departments available</p>
            ) : (
              departments.map((dept) => (
                <label 
                  key={dept.code} 
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedDepts.includes(dept.code)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDepts([...selectedDepts, dept.code]);
                      } else {
                        setSelectedDepts(selectedDepts.filter(d => d !== dept.code));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1 text-sm font-medium text-gray-900">{dept.name}</span>
                  <span className="text-sm text-gray-500">{dept.contact_number}</span>
                </label>
              ))
            )}
          </div>
          {selectedDepts.length > 0 && (
            <p className="text-xs text-gray-600 mt-2">
              {selectedDepts.length} department(s) selected. 
              Majority needed: {Math.floor(selectedDepts.length / 2) + 1}
            </p>
          )}
        </div>

        {/* Triage Decision */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Triage Decision <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTriageDecision('emergent')}
              className={`p-3 border-2 rounded-lg text-center transition-all ${
                triageDecision === 'emergent'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-red-300 text-gray-700'
              }`}
            >
              <div className="text-2xl mb-1">🚨</div>
              <div className="font-medium text-sm">Emergent</div>
              <div className="text-xs text-gray-500">Immediate care</div>
            </button>
            
            <button
              type="button"
              onClick={() => setTriageDecision('urgent')}
              className={`p-3 border-2 rounded-lg text-center transition-all ${
                triageDecision === 'urgent'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 hover:border-orange-300 text-gray-700'
              }`}
            >
              <div className="text-2xl mb-1">⚡</div>
              <div className="font-medium text-sm">Urgent</div>
              <div className="text-xs text-gray-500">Priority case</div>
            </button>
            
            <button
              type="button"
              onClick={() => setTriageDecision('schedule_opd')}
              className={`p-3 border-2 rounded-lg text-center transition-all ${
                triageDecision === 'schedule_opd'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-green-300 text-gray-700'
              }`}
            >
              <div className="text-2xl mb-1">📅</div>
              <div className="font-medium text-sm">Schedule OPD</div>
              <div className="text-xs text-gray-500">Outpatient</div>
            </button>
          </div>
        </div>

        {/* Scheduled Date/Time for OPD */}
        {triageDecision === 'schedule_opd' && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-3">Schedule Appointment</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Remarks
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Add any remarks or special instructions..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={submitting}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Assigning...' : 'Assign Departments'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Details Dialog Component
function DetailsDialog({
  referral,
  departments,
  onClose
}: {
  referral: TriageReferral;
  departments: Department[];
  onClose: () => void;
}) {
  const getDepartmentContact = (code: string) => {
    const dept = departments.find(d => d.code === code);
    return dept?.contact_number || 'N/A';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Department Acceptance Status</h2>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Referral:</span> {referral.referral_id}
          </p>
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Patient:</span> {referral.patient_full_name}
          </p>
          {referral.triage_remarks && (
            <p className="text-sm text-gray-700 mt-2">
              <span className="font-medium">Remarks:</span> {referral.triage_remarks}
            </p>
          )}
        </div>

        {/* Progress Summary */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">Acceptance Progress</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-800">{referral.acceptance_summary.total}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Accepted</p>
              <p className="text-2xl font-bold text-green-600">{referral.acceptance_summary.accepted}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{referral.acceptance_summary.pending}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Needed</p>
              <p className="text-2xl font-bold text-blue-600">{referral.acceptance_summary.majority_needed}</p>
            </div>
          </div>
        </div>

        {/* Department List */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-800">Assigned Departments</h3>
          {referral.department_acceptances.map((acceptance) => (
            <div key={acceptance.id} className="bg-white border border-gray-200 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(acceptance.status)}
                    <p className="font-medium text-gray-900">{acceptance.department_name}</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Contact:</span> {getDepartmentContact(acceptance.department_code)}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  acceptance.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  acceptance.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {acceptance.status.charAt(0).toUpperCase() + acceptance.status.slice(1)}
                </span>
              </div>
              {acceptance.accepted_by_name && (
                <p className="text-xs text-gray-500">
                  By: {acceptance.accepted_by_name} on {new Date(acceptance.accepted_at!).toLocaleString()}
                </p>
              )}
              {acceptance.notes && (
                <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                  <span className="font-medium">Notes:</span> {acceptance.notes}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
