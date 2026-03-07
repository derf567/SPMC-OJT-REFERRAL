import { useState, useEffect, useRef } from 'react';
import { referralsAPI, departmentsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, ClipboardList, CheckCircle, Clock, XCircle, FileText, MapPin, X, Edit, Eye, UserPlus, CornerUpRight, CheckSquare, MoreVertical } from 'lucide-react';
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
  is_main_service?: boolean;
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
  triage_decision?: string;
  delay_reason?: string;
  delay_notified_at?: string;
  department_acceptances: DepartmentAcceptance[];
  acceptance_summary: AcceptanceSummary;
  assigned_departments: string[];
}

export default function TriageReferrals() {
  const [referrals, setReferrals] = useState<TriageReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedReferral, setSelectedReferral] = useState<TriageReferral | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showApproveForTransitDialog, setShowApproveForTransitDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Timeline modal state
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedReferralForTimeline, setSelectedReferralForTimeline] = useState<TriageReferral | null>(null);
  
  // Dropdown menu state
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  
  // Use ref to track if modal is open to prevent flickering during re-renders
  const isModalOpenRef = useRef(false);

  useEffect(() => {
    fetchTriageReferrals();
    fetchDepartments();
    
    // Set up auto-refresh every 10 seconds to catch department decisions
    // BUT: Only refresh if no modal is open to prevent flickering
    const interval = setInterval(() => {
      if (!isModalOpenRef.current) {
        fetchTriageReferrals();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [statusFilter]);

  // Handle viewDetails URL parameter from notification click (DISABLED - use manual View Status button instead)
  // This was causing modal to reopen infinitely
  useEffect(() => {
    // Do nothing - let users manually click "View Status" button
  }, []);

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
    isModalOpenRef.current = true;
  };

  const handleViewDetails = (referral: TriageReferral) => {
    setSelectedReferral(referral);
    setShowDetailsDialog(true);
    isModalOpenRef.current = true;
  };

  const handleMarkComplete = (referral: TriageReferral) => {
    setSelectedReferral(referral);
    setCompletionNotes('');
    setShowCompleteDialog(true);
    isModalOpenRef.current = true;
  };

  const handleMarkCancelled = (referral: TriageReferral) => {
    setSelectedReferral(referral);
    setCancellationReason('');
    setShowCancelDialog(true);
    isModalOpenRef.current = true;
  };

  const handleApproveForTransit = (referral: TriageReferral) => {
    setSelectedReferral(referral);
    setShowApproveForTransitDialog(true);
    isModalOpenRef.current = true;
  };

  const closeModal = () => {
    setShowAssignDialog(false);
    setShowDetailsDialog(false);
    setShowCompleteDialog(false);
    setShowCancelDialog(false);
    setShowApproveForTransitDialog(false);
    setSelectedReferral(null);
    isModalOpenRef.current = false;
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
      in_triage: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', label: 'Pending Assignment' },
      waiting_acceptance: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-300', label: 'Waiting Acceptance' },
      awaiting_triage_verification: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300', label: 'Awaiting Verification' },
      dispositioned: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', label: 'Dispositioned' },
      in_transit: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-300', label: 'In Transit' },
      completed: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300', label: 'Completed' },
    };
    const badge = badges[status] || { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300', label: status };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
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

  // Timeline functions
  const openTimelineModal = (referral: TriageReferral) => {
    setSelectedReferralForTimeline(referral);
    setTimelineModalOpen(true);
  };

  const getStepColors = (color: string, completed: boolean) => {
    if (!completed) {
      return {
        bg: 'bg-gray-200 dark:bg-gray-700',
        border: 'border-gray-300 dark:border-gray-600',
        icon: 'text-gray-400 dark:text-gray-500'
      };
    }

    const colorMap: Record<string, { bg: string; border: string; icon: string }> = {
      green: { bg: 'bg-green-500', border: 'border-green-200', icon: 'text-white' },
      blue: { bg: 'bg-blue-500', border: 'border-blue-200', icon: 'text-white' },
      cyan: { bg: 'bg-cyan-500', border: 'border-cyan-200', icon: 'text-white' },
      purple: { bg: 'bg-purple-500', border: 'border-purple-200', icon: 'text-white' },
      orange: { bg: 'bg-orange-500', border: 'border-orange-200', icon: 'text-white' },
      red: { bg: 'bg-red-500', border: 'border-red-200', icon: 'text-white' }
    };

    return colorMap[color] || colorMap.green;
  };

  const getTimelineSteps = (referral: TriageReferral) => {
    const isCancelled = referral.status === 'cancelled';
    const isScheduleOPD = referral.status === 'schedule_opd';
    
    // Check if disposition finalized (triage has made a decision and assigned departments)
    const dispositionFinalized = (
      referral.triage_decision || 
      (referral.assigned_departments && referral.assigned_departments.length > 0) ||
      referral.status === 'waiting_acceptance' ||
      referral.status === 'awaiting_triage_verification'
    );
    const mainServiceAccepted = referral.status === 'awaiting_triage_verification' ||
                                 referral.status === 'dispositioned' || 
                                 referral.status === 'in_transit' || 
                                 referral.status === 'completed' ||
                                 isScheduleOPD;
    const inTransit = referral.status === 'in_transit' || referral.status === 'completed';
    const isCompleted = referral.status === 'completed' || isScheduleOPD;

    return [
      {
        status: 'pending',
        label: 'Request Submitted',
        description: 'Referral request submitted',
        icon: FileText,
        color: 'green',
        completed: true,
        date: referral.created_at,
      },
      {
        status: 'disposition_finalized',
        label: 'Disposition Finalized',
        description: 'EDCC/EDMA assigned departments',
        icon: Clock,
        color: 'blue',
        completed: Boolean(isCancelled ? false : (dispositionFinalized || mainServiceAccepted || inTransit || isCompleted)),
        date: referral.created_at,
      },
      {
        status: 'endorsement_complete',
        label: 'Endorsement Complete',
        description: 'Main Service accepted',
        icon: CheckCircle,
        color: 'cyan',
        completed: Boolean(isCancelled ? false : (isScheduleOPD ? false : (mainServiceAccepted || inTransit || isCompleted))),
        date: null,
      },
      {
        status: 'in_transit',
        label: 'In Transit',
        description: 'Patient in transport',
        icon: MapPin,
        color: 'orange',
        completed: Boolean(isCancelled ? false : (isScheduleOPD ? false : inTransit)),
        date: null,
      },
      {
        status: 'completed',
        label: isCancelled ? 'Cancelled' : 'Complete',
        description: isCancelled ? 'Referral cancelled' : isScheduleOPD ? 'Scheduled for OPD' : 'Process completed',
        icon: isCancelled ? X : CheckCircle,
        color: isCancelled ? 'red' : 'green',
        completed: Boolean(isCompleted || isCancelled),
        date: null,
      }
    ];
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Triage Referrals</h1>
        </div>
        <button
          onClick={fetchTriageReferrals}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors shadow-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Filter by Status
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="in_triage">Pending Assignment</option>
          <option value="waiting_acceptance">Waiting Acceptance</option>
          <option value="awaiting_triage_verification">Awaiting Verification</option>
          <option value="dispositioned">Dispositioned</option>
        </select>
      </div>

      {/* Referrals Table */}
      {referrals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center border border-gray-200 dark:border-gray-700">
          <ClipboardList className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">No referrals in triage</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Transfer referrals from Active Referrals to see them here
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Referral ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Patient Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Chief Complaint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acceptance Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {referrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {referral.referral_id}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {referral.patient_full_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {referral.age} yrs, {referral.gender}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {referral.referring_hospital_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {referral.chief_complaint}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
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
                              <span className="font-medium text-gray-900 dark:text-white">
                                {referral.acceptance_summary.accepted}/{referral.acceptance_summary.total}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">accepted</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Need {referral.acceptance_summary.majority_needed} for approval
                            </div>
                          </div>
                          {referral.acceptance_summary.accepted >= referral.acceptance_summary.majority_needed && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-wrap gap-2">
                        {referral.status === 'in_triage' && (
                          <button
                            onClick={() => handleAssignDepartments(referral)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-md transition-colors border border-purple-200 dark:border-purple-800"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Assign Departments
                          </button>
                        )}
                        
                        {referral.status === 'waiting_acceptance' && (
                          <>
                            <button
                              onClick={() => handleViewDetails(referral)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors border border-gray-200 dark:border-gray-600"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Status
                            </button>
                            <button
                              disabled={referral.acceptance_summary.rejected < referral.acceptance_summary.majority_needed}
                              onClick={() => referral.acceptance_summary.rejected >= referral.acceptance_summary.majority_needed && handleAssignDepartments(referral)}
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors border relative group ${
                                referral.acceptance_summary.rejected >= referral.acceptance_summary.majority_needed
                                  ? 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 border-orange-200 dark:border-orange-800 cursor-pointer'
                                  : 'text-orange-400 dark:text-orange-700 bg-orange-50/50 dark:bg-orange-900/10 border-orange-200/50 dark:border-orange-800/30 cursor-not-allowed opacity-60'
                              }`}
                              title={referral.acceptance_summary.rejected >= referral.acceptance_summary.majority_needed ? 'Reassign to new departments' : 'Waiting for department responses'}
                            >
                              <CornerUpRight className="w-4 h-4" />
                              {/* Hover Tooltip */}
                              <span className="absolute bottom-full mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Reassign
                              </span>
                            </button>
                          </>
                        )}
                        
                        {referral.status === 'awaiting_triage_verification' && (
                          <>
                            <button
                              onClick={() => handleViewDetails(referral)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors border border-gray-200 dark:border-gray-600"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Status
                            </button>
                            <button
                              onClick={() => handleApproveForTransit(referral)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md transition-colors border border-green-200 dark:border-green-800"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              Approve Transit
                            </button>
                          </>
                        )}
                        
                        {referral.status === 'dispositioned' && (
                          <button
                            onClick={() => handleViewDetails(referral)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md transition-colors border border-green-200 dark:border-green-800"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Details
                          </button>
                        )}
                        
                        {referral.status === 'in_transit' && (
                          <>
                            <button
                              onClick={() => handleMarkComplete(referral)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md transition-colors border border-green-200 dark:border-green-800"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Complete
                            </button>
                            <button
                              onClick={() => handleMarkCancelled(referral)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors border border-red-200 dark:border-red-800"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                          </>
                        )}
                        
                        {/* Timeline Button - Icon Only (moved to end) */}
                        <button
                          onClick={() => openTimelineModal(referral)}
                          className="inline-flex items-center justify-center w-8 h-8 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors border border-blue-200 dark:border-blue-800"
                          title="View timeline"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        
                        {/* Burger Menu with Edit (moved to end) - Hidden for completed referrals */}
                        {referral.status !== 'completed' && (
                          <div className="relative">
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === referral.id ? null : referral.id)}
                              className="inline-flex items-center justify-center w-8 h-8 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors border border-gray-200 dark:border-gray-600"
                              title="More actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {openDropdownId === referral.id && (
                              <>
                                {/* Backdrop to close dropdown */}
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => setOpenDropdownId(null)}
                                />
                                
                                {/* Dropdown Menu */}
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                                  <button
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      window.location.href = `/referral/edit/${referral.id}`;
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                  >
                                    <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    <span>Edit Referral</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
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
          onClose={closeModal}
          onSuccess={() => {
            fetchTriageReferrals();
            closeModal();
          }}
        />
      )}

      {/* Details Dialog */}
      {showDetailsDialog && selectedReferral && (
        <DetailsDialog
          referral={selectedReferral}
          departments={departments}
          onClose={closeModal}
          onReassign={() => {
            closeModal();
            handleAssignDepartments(selectedReferral);
          }}
        />
      )}

      {/* Complete Dialog */}
      {showCompleteDialog && selectedReferral && (
        <Dialog open={showCompleteDialog} onOpenChange={closeModal}>
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
                  onClick={closeModal}
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
        <Dialog open={showCancelDialog} onOpenChange={closeModal}>
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
                  onClick={closeModal}
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

      {/* Approve for Transit Dialog */}
      {showApproveForTransitDialog && selectedReferral && (
        <ApproveForTransitDialog
          referral={selectedReferral}
          departments={departments}
          onClose={() => {
            setShowApproveForTransitDialog(false);
            setSelectedReferral(null);
          }}
          onSuccess={() => {
            fetchTriageReferrals();
            setShowApproveForTransitDialog(false);
            setSelectedReferral(null);
          }}
        />
      )}

      {/* Timeline Modal */}
      {timelineModalOpen && selectedReferralForTimeline && (
        <Dialog open={timelineModalOpen} onOpenChange={setTimelineModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">Referral Timeline</DialogTitle>
              <DialogDescription className="text-gray-400">
                Track the progress of referral {selectedReferralForTimeline.referral_id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Patient Info */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Patient Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <span className="ml-2 font-medium text-white">
                      {selectedReferralForTimeline.patient_full_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Age/Gender:</span>
                    <span className="ml-2 font-medium text-white">
                      {selectedReferralForTimeline.age} yrs, {selectedReferralForTimeline.gender}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">Chief Complaint:</span>
                    <span className="ml-2 font-medium text-white">
                      {selectedReferralForTimeline.chief_complaint}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative">
                {getTimelineSteps(selectedReferralForTimeline).map((step, index) => {
                  const Icon = step.icon;
                  const isLast = index === getTimelineSteps(selectedReferralForTimeline).length - 1;
                  const colors = getStepColors(step.color, step.completed);
                  
                  return (
                    <div key={step.status} className="flex gap-4 pb-8 relative">
                      {/* Vertical Line */}
                      {!isLast && (
                        <div 
                          className={`absolute left-6 top-12 w-0.5 h-full ${
                            step.completed ? 'bg-green-500' : 'bg-gray-700'
                          }`}
                        />
                      )}
                      
                      {/* Icon Circle */}
                      <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 ${colors.bg} ${colors.border}`}>
                        <Icon className={`w-6 h-6 ${colors.icon}`} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <h4 className={`font-semibold ${step.completed ? 'text-white' : 'text-gray-500'}`}>
                          {step.label}
                        </h4>
                        <p className={`text-sm ${step.completed ? 'text-gray-400' : 'text-gray-500'}`}>
                          {step.description}
                        </p>
                        {/* Status Badge */}
                        <div className="mt-2">
                          {step.completed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </span>
                          ) : index === getTimelineSteps(selectedReferralForTimeline).findIndex(s => !s.completed) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                              <Clock className="w-3 h-3" />
                              In Progress
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-700/50 text-gray-500 text-xs rounded-full border border-gray-600">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </div>
                        {/* Contextual Description */}
                        {!step.completed && index === getTimelineSteps(selectedReferralForTimeline).findIndex(s => !s.completed) && (
                          <p className="text-xs text-yellow-400/80 mt-1 italic">
                            {step.status === 'disposition_finalized' && 'Waiting for EDCC/EDMA to assign departments'}
                            {step.status === 'endorsement_complete' && 'Waiting for Main Service to accept referral'}
                            {step.status === 'in_transit' && 'Waiting for transit form submission'}
                            {step.status === 'completed' && 'Waiting for process completion'}
                          </p>
                        )}
                        {step.date && step.completed && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(step.date).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
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
  const [mainServiceCode, setMainServiceCode] = useState<string>('');
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
        mainServiceCode,
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
              {selectedDepts.length} department(s) selected
            </p>
          )}
        </div>

        {/* Main Service Selection */}
        {selectedDepts.length > 0 && (
          <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Main Service <span className="text-gray-500 font-normal ml-2">(optional - primary department)</span>
              <span className="text-gray-500 font-normal ml-2">(if not selected, all are co-manage)</span>
            </label>
            <div className="space-y-2">
              {departments
                .filter(dept => selectedDepts.includes(dept.code))
                .map((dept) => (
                  <label 
                    key={dept.code} 
                    className="flex items-center space-x-3 p-3 border border-purple-200 hover:bg-purple-100 rounded cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="main_service"
                      value={dept.code}
                      checked={mainServiceCode === dept.code}
                      onChange={(e) => setMainServiceCode(e.target.value)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{dept.name}</span>
                      <p className="text-xs text-gray-500">Main service - final decision authority</p>
                    </div>
                    <span className="text-sm text-gray-500">{dept.contact_number}</span>
                  </label>
                ))}
            </div>
            {mainServiceCode && (
              <p className="text-xs text-purple-600 mt-2">
                ✓ {departments.find(d => d.code === mainServiceCode)?.name} selected as main service
              </p>
            )}
            {!mainServiceCode && selectedDepts.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                No main service selected - all {selectedDepts.length} department(s) will be co-manage
              </p>
            )}
          </div>
        )}

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
  onClose,
  onReassign
}: {
  referral: TriageReferral;
  departments: Department[];
  onClose: () => void;
  onReassign?: () => void;
}) {
  const [currentReferral, setCurrentReferral] = useState(referral);
  
  useEffect(() => {
    // Auto-refresh the referral data every 5 seconds while dialog is open
    const interval = setInterval(async () => {
      try {
        const response = await referralsAPI.getById(referral.id.toString());
        setCurrentReferral(response);
      } catch (error) {
        console.error('Error refreshing referral:', error);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [referral.id]);

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

  const handleReassign = () => {
    onReassign?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Department Acceptance Status</h2>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Referral:</span> {currentReferral.referral_id}
          </p>
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Patient:</span> {currentReferral.patient_full_name}
          </p>
          {currentReferral.triage_remarks && (
            <p className="text-sm text-gray-700 mt-2">
              <span className="font-medium">Remarks:</span> {currentReferral.triage_remarks}
            </p>
          )}
          {currentReferral.delay_reason && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
              <p className="text-sm text-orange-900">
                <span className="font-medium">⏱️ Transfer Delay:</span> {currentReferral.delay_reason}
              </p>
              {currentReferral.delay_notified_at && (
                <p className="text-xs text-orange-700 mt-1">
                  Reported: {new Date(currentReferral.delay_notified_at).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Progress Summary */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">Acceptance Progress</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-800">{currentReferral.acceptance_summary.total}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Accepted</p>
              <p className="text-2xl font-bold text-green-600">{currentReferral.acceptance_summary.accepted}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{currentReferral.acceptance_summary.pending}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Needed</p>
              <p className="text-2xl font-bold text-blue-600">{currentReferral.acceptance_summary.majority_needed}</p>
            </div>
          </div>
        </div>

        {/* Department List */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-800">Assigned Departments</h3>
          {currentReferral.department_acceptances.length === 0 ? (
            <p className="text-sm text-gray-500">No departments assigned</p>
          ) : (
            <>
              {/* Main Service Departments */}
              {currentReferral.department_acceptances.some(a => a.is_main_service) && (
                <div>
                  <p className="text-xs font-semibold text-purple-700 mb-2">Main Service (Primary)</p>
                  {currentReferral.department_acceptances
                    .filter(a => a.is_main_service)
                    .map((acceptance) => (
                      <div key={acceptance.id} className="bg-purple-50 border border-purple-300 p-4 rounded-lg mb-2">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(acceptance.status)}
                              <p className="font-medium text-gray-900">{acceptance.department_name}</p>
                              <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-semibold rounded">
                                Main Service
                              </span>
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
              )}
              
              {/* Co-Manage Departments */}
              {currentReferral.department_acceptances.some(a => !a.is_main_service) && (
                <div>
                  <p className="text-xs font-semibold text-blue-700 mb-2">Co-Manage (Supporting)</p>
                  {currentReferral.department_acceptances
                    .filter(a => !a.is_main_service)
                    .map((acceptance) => (
                      <div key={acceptance.id} className="bg-white border border-gray-200 p-4 rounded-lg mb-2">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(acceptance.status)}
                              <p className="font-medium text-gray-900">{acceptance.department_name}</p>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                                Co-Manage
                              </span>
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
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            disabled={currentReferral.acceptance_summary.rejected < currentReferral.acceptance_summary.majority_needed}
            onClick={handleReassign}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentReferral.acceptance_summary.rejected >= currentReferral.acceptance_summary.majority_needed
                ? 'bg-orange-500 text-white hover:bg-orange-600 cursor-pointer'
                : 'bg-orange-300 text-orange-100 cursor-not-allowed opacity-60'
            }`}
            title={currentReferral.acceptance_summary.rejected >= currentReferral.acceptance_summary.majority_needed ? 'Reassign to new departments' : 'Waiting for department responses'}
          >
            Reassign to New Departments
          </button>
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

// Approve for Transit Dialog Component
function ApproveForTransitDialog({
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
  const [verificationNotes, setVerificationNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getDepartmentContact = (code: string) => {
    const dept = departments.find(d => d.code === code);
    return dept?.contact_number || 'N/A';
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      await referralsAPI.approveForTransit(
        referral.id.toString(),
        verificationNotes
      );
      
      toast.success('Referral approved for transit! Referrer will be notified to fill the transit form.');
      onSuccess();
    } catch (error: any) {
      console.error('Error approving for transit:', error);
      toast.error(error.message || 'Failed to approve for transit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Approve Referral for Transit</h2>
        
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
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

        {/* Department Acceptance Summary */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-3">Department Acceptance Summary</h3>
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
              <p className="text-xs text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{referral.acceptance_summary.rejected}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{referral.acceptance_summary.pending}</p>
            </div>
          </div>
        </div>

        {/* Accepted Departments List */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-800 mb-3">Departments That Accepted - Call for Verification</h3>
          <div className="space-y-3">
            {referral.department_acceptances
              .filter(a => a.status === 'accepted')
              .map((acceptance) => (
                <div key={acceptance.id} className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{acceptance.department_name}</p>
                      {acceptance.accepted_by_name && (
                        <p className="text-xs text-gray-600 mt-1">
                          Accepted by: {acceptance.accepted_by_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border border-green-100 mt-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">Contact Number:</p>
                    <p className="text-lg font-bold text-green-600">
                      {getDepartmentContact(acceptance.department_code)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Verification Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Notes (Optional)
          </label>
          <textarea
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            placeholder="Add any notes about your verification call with the department..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            rows={4}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={submitting}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Approving...' : 'Approve for Transit'}
          </button>
        </div>
      </div>
    </div>
  );
}
