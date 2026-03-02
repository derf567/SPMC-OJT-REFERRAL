import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { referralsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  FileText,
  Clock,
  CheckCircle,
  Activity,
  Truck,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react";
import { FraudReportModal } from "@/components/ui/FraudReportModal";

interface DashboardStats {
  total_referrals_today: number;
  pending_cases: number;
  critical_cases: number;
  completed_today: number;
  yesterday_completed: number;
  yesterday_total: number;
  total_patients: number;
}

interface Referral {
  id: number;
  referral_id: string;
  patient_full_name: string;
  status: string;
  priority: string;
  specialty_needed?: {
    id: number;
    name: string;
  };
  referring_hospital?: {
    id: number;
    name: string;
  };
  created_at: string;
  triage_decision?: string;
  assigned_departments?: string[];
}

const Index = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_referrals_today: 0,
    pending_cases: 0,
    critical_cases: 0,
    completed_today: 0,
    yesterday_completed: 0,
    yesterday_total: 0,
    total_patients: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Referral containers
  const [requestsReferrals, setRequestsReferrals] = useState<Referral[]>([]);
  const [activeReferrals, setActiveReferrals] = useState<Referral[]>([]);
  const [dispositionedReferrals, setDispositionedReferrals] = useState<Referral[]>([]);
  const [inTransitReferrals, setInTransitReferrals] = useState<Referral[]>([]);
  const [showFraudModal, setShowFraudModal] = useState(false);
  const [selectedReferralForReport, setSelectedReferralForReport] = useState<Referral | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, allReferralsResponse] = await Promise.all([
          referralsAPI.getDashboardStats(),
          referralsAPI.getAll()
        ]);
        
        setStats({
          total_referrals_today: statsResponse.total_referrals_today || 0,
          pending_cases: statsResponse.pending_referrals || 0,
          critical_cases: statsResponse.critical_referrals || 0,
          completed_today: statsResponse.completed_today || 0,
          yesterday_completed: statsResponse.completed_yesterday || 0,
          yesterday_total: statsResponse.total_referrals_yesterday || 0,
          total_patients: statsResponse.total_patients || 0,
        });
        
        // Handle different API response formats
        const allReferrals = Array.isArray(allReferralsResponse) 
          ? allReferralsResponse 
          : (allReferralsResponse.results || allReferralsResponse.data || []);
        
        // Categorize referrals into 4 containers
        console.log('=== DASHBOARD DEBUG ===');
        console.log('API Response:', allReferralsResponse);
        console.log('Total referrals fetched:', allReferrals.length);
        console.log('All referrals:', allReferrals);
        
        // Log each referral's status
        allReferrals.forEach((r: Referral, index: number) => {
          console.log(`Referral ${index + 1}:`, {
            id: r.id,
            referral_id: r.referral_id,
            patient: r.patient_full_name,
            status: r.status,
            status_type: typeof r.status
          });
        });
        
        // REQUESTS: Not entertained yet, going to triage
        const requests = allReferrals.filter((r: Referral) => {
          const isPending = r.status === 'pending';
          console.log(`Checking ${r.referral_id}: status="${r.status}", isPending=${isPending}`);
          return isPending;
        });
        
        // ACTIVE: Under endorsement (triage decision made, awaiting department assignment)
        // Includes: waiting, in_triage, waiting_acceptance
        const active = allReferrals.filter((r: Referral) => 
          r.status === 'waiting' || 
          r.status === 'in_triage' || 
          r.status === 'waiting_acceptance'
        );
        
        // DISPOSITIONED: Departments assigned, transit template sent, awaiting completion
        // Includes: emergent, urgent, schedule_opd
        const dispositioned = allReferrals.filter((r: Referral) => 
          r.status === 'emergent' || 
          r.status === 'urgent' || 
          r.status === 'schedule_opd'
        );
        
        // IN TRANSIT: Transit template completed, patient en route
        const inTransit = allReferrals.filter((r: Referral) => 
          r.status === 'in_transit'
        );
        
        console.log('Filtered Requests (pending):', requests.length, requests);
        console.log('Filtered Active (waiting/in_triage/waiting_acceptance):', active.length, active);
        console.log('Filtered Dispositioned (emergent/urgent/schedule_opd):', dispositioned.length, dispositioned);
        console.log('Filtered In Transit (in_transit):', inTransit.length, inTransit);
        console.log('=== END DEBUG ===');
        
        setRequestsReferrals(requests);
        setActiveReferrals(active);
        setDispositionedReferrals(dispositioned);
        setInTransitReferrals(inTransit);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
      // Refresh every 2 minutes
      const interval = setInterval(fetchDashboardData, 120000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400',
      'in_triage': 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400',
      'waiting_acceptance': 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-400',
      'waiting': 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400',
      'emergent': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400',
      'urgent': 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400',
      'schedule_opd': 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400',
      'dispositioned': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400',
      'in_transit': 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Pending',
      'in_triage': 'In Triage',
      'waiting_acceptance': 'Waiting Acceptance',
      'waiting': 'Waiting',
      'emergent': 'Emergent',
      'urgent': 'Urgent',
      'schedule_opd': 'Schedule OPD',
      'dispositioned': 'Dispositioned',
      'in_transit': 'In Transit',
    };
    return labels[status] || status;
  };

  const renderReferralCard = (referral: Referral) => {
    // Check if referral is endorsed (has assigned departments)
    const isEndorsed = referral.assigned_departments && referral.assigned_departments.length > 0;
    
    // Determine glow color based on status and endorsement
    const getGlowClasses = () => {
      if (referral.status === 'pending') {
        return 'border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-900/10 animate-pulse shadow-lg shadow-yellow-200 dark:shadow-yellow-900/50';
      }
      if (referral.status === 'emergent') {
        if (!isEndorsed) {
          return 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10 animate-pulse shadow-lg shadow-red-200 dark:shadow-red-900/50';
        }
        return 'border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-900/10 animate-pulse shadow-lg shadow-orange-200 dark:shadow-orange-900/50';
      }
      if (referral.status === 'urgent') {
        if (!isEndorsed) {
          return 'border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-900/10 animate-pulse shadow-lg shadow-orange-200 dark:shadow-orange-900/50';
        }
        return 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10 animate-pulse shadow-lg shadow-blue-200 dark:shadow-blue-900/50';
      }
      if (referral.status === 'schedule_opd') {
        return 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/10 animate-pulse shadow-lg shadow-purple-200 dark:shadow-purple-900/50';
      }
      return 'border-gray-200 dark:border-gray-700';
    };

    // Check if user can report fraud (EDCC/EDMA only)
    const canReportFraud = user?.permissions?.can_transfer_referrals || user?.permissions?.can_triage_referrals;
    
    return (
      <div
        key={referral.id}
        className={`border rounded-lg p-4 transition-all ${getGlowClasses()}`}
      >
        <Link
          to={`/referral/view/${referral.id}`}
          className="block hover:bg-gray-50 dark:hover:bg-gray-700/30 -m-4 p-4 rounded-lg"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {referral.referral_id}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(referral.status)}`}>
                  {getStatusLabel(referral.status)}
                </span>
                {/* Show endorsement status for active referrals */}
                {(referral.status === 'emergent' || referral.status === 'urgent' || referral.status === 'schedule_opd') && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                    isEndorsed 
                      ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 animate-pulse'
                  }`}>
                    {isEndorsed ? 'Endorsed' : 'Not Yet Endorsed'}
                  </span>
                )}
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                {referral.patient_full_name}
              </h4>
              {/* Show assigned departments if endorsed */}
              {isEndorsed && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Departments: {referral.assigned_departments?.join(', ')}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">{formatDate(referral.created_at)}</span>
              </div>
            </div>
          </div>
        </Link>
        
        {/* Report Button - Only show for EDCC/EDMA */}
        {canReportFraud && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedReferralForReport(referral);
                setShowFraudModal(true);
              }}
              className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Report Request</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-current">Dashboard</h1>
              {user?.role === 'view_only' && user?.department && (
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                  {user.department.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              Welcome back, {user?.full_name || user?.username}. Here's today's overview.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Last updated: {loading ? 'Loading...' : 'Just now'}</span>
          </div>
        </div>

        {/* 4 Referral Containers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requests Container */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <FileText className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Requests
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Not entertained yet, going to triage
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {requestsReferrals.length}
                </span>
              </div>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {requestsReferrals.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No pending requests</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {requestsReferrals.slice(0, 3).map(renderReferralCard)}
                  </div>
                  {requestsReferrals.length > 3 && (
                    <Link 
                      to="/active-referrals"
                      className="block mt-4 text-center text-sm text-yellow-600 dark:text-yellow-400 hover:underline"
                    >
                      View all {requestsReferrals.length} requests →
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Active Container */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Active
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Under endorsement (EDMA assigns departments)
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {activeReferrals.length}
                </span>
              </div>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {activeReferrals.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No active referrals</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {activeReferrals.slice(0, 3).map(renderReferralCard)}
                  </div>
                  {activeReferrals.length > 3 && (
                    <Link 
                      to="/active-referrals"
                      className="block mt-4 text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View all {activeReferrals.length} active referrals →
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Dispositioned Container */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <ClipboardCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Dispositioned
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Departments coordinated, transit template sent
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {dispositionedReferrals.length}
                </span>
              </div>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {dispositionedReferrals.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No dispositioned referrals</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {dispositionedReferrals.slice(0, 3).map(renderReferralCard)}
                  </div>
                  {dispositionedReferrals.length > 3 && (
                    <Link 
                      to="/active-referrals"
                      className="block mt-4 text-center text-sm text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      View all {dispositionedReferrals.length} dispositioned →
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* In Transit Container */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Truck className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      In Transit
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Transit template completed, patient en route
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {inTransitReferrals.length}
                </span>
              </div>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {inTransitReferrals.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No referrals in transit</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {inTransitReferrals.slice(0, 3).map(renderReferralCard)}
                  </div>
                  {inTransitReferrals.length > 3 && (
                    <Link 
                      to="/active-referrals"
                      className="block mt-4 text-center text-sm text-green-600 dark:text-green-400 hover:underline"
                    >
                      View all {inTransitReferrals.length} in transit →
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Fraud Report Modal */}
      {showFraudModal && selectedReferralForReport && (
        <FraudReportModal
          referral={{
            id: selectedReferralForReport.id,
            referral_id: selectedReferralForReport.referral_id,
            patient_full_name: selectedReferralForReport.patient_full_name,
            referring_hospital_name: selectedReferralForReport.referring_hospital?.name,
          }}
          onClose={() => {
            setShowFraudModal(false);
            setSelectedReferralForReport(null);
          }}
          onSuccess={() => {
            // Optionally refresh the dashboard data
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default Index;
