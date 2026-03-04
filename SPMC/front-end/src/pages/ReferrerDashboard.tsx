import { useState, useEffect } from "react";
import { ReferrerDashboardLayout } from "@/components/layout/ReferrerDashboardLayout";
import { TransferActionDropdown } from "@/components/ui/TransferActionDropdown";
import { TransitFormDialog } from "@/components/ui/TransitFormDialog";
import { referralsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  TrendingUp,
  Calendar,
  Archive,
  BarChart3,
  Check,
  X,
  User,
  MapPin,
  PhoneCall,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ReferrerStats {
  total_referrals: number;
  pending_referrals: number;
  accepted_referrals: number;
  completed_referrals: number;
  this_month: number;
  last_month: number;
}

const ReferrerDashboard = () => {
  const [stats, setStats] = useState<ReferrerStats>({
    total_referrals: 0,
    pending_referrals: 0,
    accepted_referrals: 0,
    completed_referrals: 0,
    this_month: 0,
    last_month: 0,
  });
  const [recentReferrals, setRecentReferrals] = useState<any[]>([]);
  const [allReferrals, setAllReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [transitDecisionModalOpen, setTransitDecisionModalOpen] = useState(false);
  const [transitDecisionReferral, setTransitDecisionReferral] = useState<any>(null);
  const [transitFormModalOpen, setTransitFormModalOpen] = useState(false);
  const [transitFormReferral, setTransitFormReferral] = useState<any>(null);
  const { user } = useAuth();
  const location = useLocation();

  // Determine current section based on route
  const getCurrentSection = () => {
    const path = location.pathname;
    if (path === '/referrer/referred') return 'referred';
    if (path === '/referrer/archived') return 'archived';
    if (path === '/referrer/reports') return 'reports';
    return 'dashboard';
  };

  const currentSection = getCurrentSection();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch my submitted referrals (for referrers)
        const response = await referralsAPI.getMySubmittedReferrals();
        const referrals = response.results || response;
        
        if (Array.isArray(referrals)) {
          setAllReferrals(referrals);
          
          // Calculate stats
          const now = new Date();
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          
          const stats = {
            total_referrals: referrals.length,
            pending_referrals: referrals.filter(r => r.status === 'pending').length,
            accepted_referrals: referrals.filter(r => ['waiting', 'in_transit', 'emergent', 'urgent', 'schedule_opd'].includes(r.status)).length,
            completed_referrals: referrals.filter(r => r.status === 'completed').length,
            this_month: referrals.filter(r => new Date(r.created_at) >= thisMonth).length,
            last_month: referrals.filter(r => {
              const createdAt = new Date(r.created_at);
              return createdAt >= lastMonth && createdAt <= lastMonthEnd;
            }).length,
          };
          
          setStats(stats);
          
          // Get recent referrals (last 5) - exclude completed and uncoordinated
          const sortedReferrals = referrals
            .filter(r => r.status !== 'completed' && r.status !== 'uncoordinated')
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);
          setRecentReferrals(sortedReferrals);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
      case "waiting":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "waiting_acceptance":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "dispositioned":
        return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
      case "in_transit":
        return "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "emergent":
        return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
      case "urgent":
        return "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30";
      case "schedule_opd":
        return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
      case "completed":
        return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
    }
  };

  const getStatusLabel = (status: string, referral?: any) => {
    // Show emergent label if triage decision is emergent
    if (referral?.triage_decision === 'emergent' && status === 'in_transit') {
      return "🚨 Emergent - In Transit";
    }
    
    // Show transit decision status if available
    if (referral?.transit_decision) {
      if (referral.transit_decision === 'now') {
        return "🚑 Transport Initiated";
      } else if (referral.transit_decision === 'scheduled') {
        return "📅 Transport Scheduled";
      }
    }

    switch (status) {
      case "pending":
        return "⏳ Pending Review";
      case "waiting":
        return "👨‍⚕️ Under Triage";
      case "waiting_acceptance":
        return "⏱ Waiting Department Response";
      case "dispositioned":
        return "✅ Accepted - Fill In-Transit Form";
      case "in_transit":
        return "🚑 In Transit";
      case "emergent":
        return "🚨 Emergent";
      case "urgent":
        return "⚡ Urgent";
      case "schedule_opd":
        return "📅 Scheduled OPD";
      case "completed":
        return "✅ Completed";
      default:
        return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const openTimelineModal = (referral: any) => {
    setSelectedReferral(referral);
    setTimelineModalOpen(true);
  };

  const handleTransitDecision = async (decision: 'now' | 'scheduled', scheduledDate?: string, scheduledTime?: string) => {
    if (!transitDecisionReferral) return;

    try {
      const response = await referralsAPI.respondToTriageCall(
        transitDecisionReferral.id, 
        decision,
        scheduledDate,
        scheduledTime
      );

      // Update the referral in the local state
      const updatedReferrals = allReferrals.map(r => 
        r.id === transitDecisionReferral.id 
          ? { ...r, ...response }
          : r
      );
      setAllReferrals(updatedReferrals);

      // Update recent referrals if needed
      const updatedRecentReferrals = recentReferrals.map(r => 
        r.id === transitDecisionReferral.id 
          ? { ...r, ...response }
          : r
      );
      setRecentReferrals(updatedRecentReferrals);

      setTransitDecisionModalOpen(false);
      setTransitDecisionReferral(null);
    } catch (error) {
      console.error('Error responding to triage call:', error);
    }
  };

  const getTimelineSteps = (referral: any) => {
    const steps = [
      {
        status: 'pending',
        label: 'Request Submitted',
        description: 'Referral request submitted and awaiting review',
        icon: FileText,
        color: 'yellow',
        completed: true,
        date: referral.created_at,
        user: referral.created_by_user || 'System',
        action: 'Created referral'
      },
      {
        status: 'in_triage',
        label: 'Under Triage',
        description: 'Referral is being reviewed by EDCC/Triage staff',
        icon: Clock,
        color: 'blue',
        completed: ['in_triage', 'waiting_acceptance', 'dispositioned', 'in_transit', 'emergent', 'urgent', 'schedule_opd', 'completed', 'cancelled'].includes(referral.status),
        date: referral.transferred_at || referral.created_at,
        user: referral.transferred_by_user || 'EDCC Staff',
        action: 'Forwarded to Triage'
      }
    ];

    // Add Waiting Department Acceptance step
    steps.push({
      status: 'waiting_acceptance',
      label: 'Waiting Department Acceptance',
      description: 'Departments are reviewing and deciding on the referral',
      icon: Clock,
      color: 'cyan',
      completed: ['waiting_acceptance', 'dispositioned', 'in_transit', 'completed', 'cancelled'].includes(referral.status),
      date: referral.triaged_at || referral.updated_at,
      user: referral.triaged_by_user || 'Triage Staff',
      action: referral.triage_decision ? `Assigned to departments with ${referral.triage_decision.replace('_', ' ').toUpperCase()} priority` : 'Assigned to departments'
    });

    // Add Dispositioned step
    steps.push({
      status: 'dispositioned',
      label: 'Dispositioned',
      description: 'Majority of departments accepted - ready for transit',
      icon: CheckCircle,
      color: 'green',
      completed: ['dispositioned', 'in_transit', 'completed', 'cancelled'].includes(referral.status),
      date: referral.status === 'dispositioned' || referral.status === 'in_transit' || referral.status === 'completed' ? referral.updated_at : null,
      user: 'Department Doctors',
      action: 'Departments accepted referral'
    });

    // Add In Transit step
    steps.push({
      status: 'in_transit',
      label: 'In Transit',
      description: 'Patient is being transported to the facility',
      icon: MapPin,
      color: 'purple',
      completed: ['in_transit', 'completed', 'cancelled'].includes(referral.status),
      date: referral.status === 'in_transit' || referral.status === 'completed' ? referral.updated_at : null,
      user: referral.created_by_user || 'Referrer',
      action: 'Transit form filled - patient in transport'
    });

    // Add final status steps
    steps.push(
      {
        status: 'completed',
        label: 'Completed',
        description: 'Referral process completed successfully',
        icon: CheckCircle,
        color: 'gray',
        completed: referral.status === 'completed',
        date: referral.status === 'completed' ? referral.updated_at : null,
        user: 'EDCC/Triage Staff',
        action: 'Patient arrived and treated'
      },
      {
        status: 'cancelled',
        label: 'Cancelled',
        description: 'Referral has been cancelled',
        icon: X,
        color: 'red',
        completed: referral.status === 'cancelled',
        date: referral.status === 'cancelled' ? referral.updated_at : null,
        user: referral.triaged_by_user || referral.transferred_by_user || 'Staff',
        action: 'Referral cancelled'
      }
    );

    return steps;
  };

  // Render different sections based on current route
  const renderDashboardSection = () => {
    switch (currentSection) {
      case 'referred':
        return renderReferredSection();
      case 'archived':
        return renderArchivedSection();
      case 'reports':
        return renderReportsSection();
      default:
        return renderMainDashboard();
    }
  };

  const renderMainDashboard = () => (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-current">Referrer Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Welcome back, {user?.full_name || user?.username}. Here's your referral overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/referral">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              New Referral
            </button>
          </Link>
        </div>
      </div>

      {/* Dispositioned - In Transit Form Needed */}
      {recentReferrals.some(r => r.status === 'dispositioned') && (
        <div className="bg-green-100 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 rounded-lg p-4 mb-6 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600 animate-bounce" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                ✅ Referral Accepted - Fill In-Transit Form
              </h3>
              <p className="text-green-700 dark:text-green-300 mt-1">
                You have {recentReferrals.filter(r => r.status === 'dispositioned').length} referral(s) 
                accepted by departments. Please fill out the In-Transit form to proceed with patient transport.
              </p>
            </div>
            <div className="flex-shrink-0">
              <TransferActionDropdown
                referralId={recentReferrals.find(r => r.status === 'dispositioned')?.id || ''}
                patientName={recentReferrals.find(r => r.status === 'dispositioned')?.patient_full_name || ''}
                hasDelayNotification={!!recentReferrals.find(r => r.status === 'dispositioned')?.delay_notified_at}
                onFillForm={() => {
                  const referral = recentReferrals.find(r => r.status === 'dispositioned');
                  if (referral) {
                    setTransitFormReferral(referral);
                    setTransitFormModalOpen(true);
                  }
                }}
                onDelaySuccess={() => {
                  // Refresh the dashboard data
                  const fetchDashboardData = async () => {
                    try {
                      const response = await referralsAPI.getMySubmittedReferrals();
                      const referrals = response.results || response;
                      if (Array.isArray(referrals)) {
                        setAllReferrals(referrals);
                        const sortedReferrals = referrals
                          .filter(r => r.status !== 'completed' && r.status !== 'uncoordinated')
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .slice(0, 5);
                        setRecentReferrals(sortedReferrals);
                      }
                    } catch (error) {
                      console.error('Error refreshing dashboard:', error);
                    }
                  };
                  fetchDashboardData();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Emergent Notification */}
      {recentReferrals.some(r => r.triage_decision === 'emergent' && r.status === 'in_transit') && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600 animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                🚨 EMERGENT - Transfer Patient Immediately
              </h3>
              <p className="text-red-700 dark:text-red-300 mt-1">
                You have {recentReferrals.filter(r => r.triage_decision === 'emergent' && r.status === 'in_transit').length} referral(s) 
                marked as EMERGENT by EDMAR staff. Patient requires immediate emergency care. Please transfer the patient immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Triage Call Notifications */}
      {recentReferrals.some(r => r.status === 'urgent' && r.triage_decision === 'urgent' && !r.transit_decision) && (
        <div className="bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <PhoneCall className="w-6 h-6 text-orange-600 animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                🚨 Urgent Triage Call Required
              </h3>
              <p className="text-orange-700 dark:text-orange-300 mt-1">
                You have {recentReferrals.filter(r => r.status === 'urgent' && r.triage_decision === 'urgent' && !r.transit_decision).length} referral(s) 
                marked as urgent by EDMAR staff. Please respond to determine transport timing.
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => {
                  const urgentReferral = recentReferrals.find(r => r.status === 'urgent' && r.triage_decision === 'urgent' && !r.transit_decision);
                  if (urgentReferral) {
                    setTransitDecisionReferral(urgentReferral);
                    setTransitDecisionModalOpen(true);
                  }
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Respond Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Referrals - Moved to top */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-300">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Referrals</h3>
            <Link to="/referrer/referred" className="text-green-600 hover:text-green-800 text-sm font-medium">
              View All →
            </Link>
          </div>
        </div>
        
        <div className="p-6">
          {recentReferrals.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No referrals submitted yet</p>
              <Link to="/referral">
                <button className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                  Submit Your First Referral
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentReferrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {referral.patient_full_name?.split(' ').map((n: string) => n[0]).join('') || 'N/A'}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {referral.patient_full_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {referral.chief_complaint} • {referral.specialty_needed_name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(referral.created_at).toLocaleDateString()} • ID: {referral.referral_id}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Show dispositioned badge with glow effect */}
                    {referral.status === 'dispositioned' && (
                      <span className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 animate-pulse shadow-lg shadow-green-500/50">
                        <CheckCircle className="w-3 h-3" />
                        Fill In-Transit Form
                      </span>
                    )}
                    {/* Show emergent badge if marked as emergent */}
                    {referral.triage_decision === 'emergent' && referral.status === 'in_transit' && (
                      <span className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        Transfer Immediately
                      </span>
                    )}
                    {/* Show triage call button if referral is marked as urgent by EDMAR */}
                    {referral.status === 'urgent' && referral.triage_decision === 'urgent' && !referral.transit_decision && (
                      <button
                        onClick={() => {
                          setTransitDecisionReferral(referral);
                          setTransitDecisionModalOpen(true);
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 animate-pulse"
                      >
                        <PhoneCall className="w-3 h-3" />
                        Triage Call
                      </button>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(referral.status)}`}>
                      {getStatusLabel(referral.status, referral)}
                    </span>
                    {(referral.status === 'completed' || referral.status === 'uncoordinated') && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        referral.status === 'completed' 
                          ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'
                          : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                      }`}>
                        {referral.status === 'completed' ? '✅ Completed' : '❌ Uncoordinated'}
                      </span>
                    )}
                    <button
                      onClick={() => openTimelineModal(referral)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium flex items-center gap-1 underline whitespace-nowrap"
                      title="View referral timeline"
                    >
                      <Clock className="w-3 h-3" />
                      Timeline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.total_referrals}
              </p>
              <p className="text-xs mt-1 text-green-600 dark:text-green-400">
                All time submissions
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.pending_referrals}
              </p>
              <p className="text-xs mt-1 text-yellow-600 dark:text-yellow-400">
                Awaiting EDCC review
              </p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Accepted/Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.accepted_referrals}
              </p>
              <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                In treatment process
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10">
              <AlertTriangle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.completed_referrals}
              </p>
              <p className="text-xs mt-1 text-green-600 dark:text-green-400">
                Successfully treated
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Comparison */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Activity</h3>
          <TrendingUp className="w-5 h-5 text-green-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
              {stats.this_month}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">referrals submitted</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Last Month</p>
            <p className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-2">
              {stats.last_month}
            </p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className={`text-xs ${
                calculatePercentageChange(stats.this_month, stats.last_month) >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {calculatePercentageChange(stats.this_month, stats.last_month) >= 0 ? '+' : ''}
                {calculatePercentageChange(stats.this_month, stats.last_month)}% change
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/referral" className="block">
          <div className="bg-green-600 hover:bg-green-700 rounded-lg p-6 text-white transition-colors cursor-pointer">
            <Plus className="w-8 h-8 mb-3" />
            <h4 className="font-semibold text-lg">New Referral</h4>
            <p className="text-sm text-green-100 mt-1">Submit a new patient referral</p>
          </div>
        </Link>
        
        <Link to="/referrer/referred" className="block">
          <div className="bg-blue-600 hover:bg-blue-700 rounded-lg p-6 text-white transition-colors cursor-pointer">
            <FileText className="w-8 h-8 mb-3" />
            <h4 className="font-semibold text-lg">My Referrals</h4>
            <p className="text-sm text-blue-100 mt-1">View active referrals</p>
          </div>
        </Link>
        
        <Link to="/referrer/reports" className="block">
          <div className="bg-purple-600 hover:bg-purple-700 rounded-lg p-6 text-white transition-colors cursor-pointer">
            <Calendar className="w-8 h-8 mb-3" />
            <h4 className="font-semibold text-lg">Reports</h4>
            <p className="text-sm text-purple-100 mt-1">View referral analytics</p>
          </div>
        </Link>
      </div>
    </div>
  );

  const renderReferredSection = () => {
    const activeReferrals = allReferrals.filter(r => 
      r.status !== 'completed' && r.status !== 'uncoordinated'
    );
    const completedReferrals = allReferrals.filter(r => 
      r.status === 'completed' || r.status === 'uncoordinated'
    );

    const renderReferralCard = (referral: any) => (
      <div key={referral.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
            {referral.patient_full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'N/A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                {referral.patient_full_name}
              </h4>
              {/* Show dispositioned badge with glow effect */}
              {referral.status === 'dispositioned' && (
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1 animate-pulse shadow-lg shadow-green-500/50 flex-shrink-0">
                  <CheckCircle className="w-3 h-3" />
                  Fill Form
                </span>
              )}
              {/* Show emergent badge if marked as emergent */}
              {referral.triage_decision === 'emergent' && referral.status === 'in_transit' && (
                <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1 animate-pulse flex-shrink-0">
                  <AlertTriangle className="w-3 h-3" />
                  Transfer Now
                </span>
              )}
              {/* Show triage call button if marked as urgent */}
              {referral.status === 'urgent' && referral.triage_decision === 'urgent' && !referral.transit_decision && (
                <button
                  onClick={() => {
                    setTransitDecisionReferral(referral);
                    setTransitDecisionModalOpen(true);
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1 animate-pulse flex-shrink-0"
                >
                  <PhoneCall className="w-3 h-3" />
                  Call
                </button>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
              {referral.chief_complaint}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(referral.status)}`}>
                {getStatusLabel(referral.status, referral)}
              </span>
              {(referral.status === 'completed' || referral.status === 'uncoordinated') && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                  referral.status === 'completed' 
                    ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'
                    : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                }`}>
                  {referral.status === 'completed' ? '✅' : '❌'}
                </span>
              )}
              {/* Show Edit button only if status is pending */}
              {referral.status === 'pending' && (
                <Link 
                  to={`/referral/edit/${referral.id}`}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs underline font-medium"
                >
                  ✏️ Edit
                </Link>
              )}
              {/* Show View button for all referrals */}
              <Link
                to={`/referral/view/${referral.id}`}
                className="text-green-600 hover:text-green-800 dark:text-green-400 text-xs underline font-medium"
              >
                👁️ View
              </Link>
              <button
                onClick={() => openTimelineModal(referral)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs underline"
              >
                Timeline
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              ID: {referral.referral_id}
            </p>
          </div>
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-current">My Referrals</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Track all your submitted referrals - active and completed.
            </p>
          </div>
          <Link to="/referral">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              New Referral
            </button>
          </Link>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Active Referrals */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Active
                </h3>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                  {activeReferrals.length}
                </span>
              </div>
            </div>
            <div className="p-4 max-h-[700px] overflow-y-auto">
              {activeReferrals.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No active referrals</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeReferrals.map(renderReferralCard)}
                </div>
              )}
            </div>
          </div>

          {/* Right: Completed/Uncoordinated Referrals */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Archive className="w-5 h-5 text-gray-600" />
                  Completed
                </h3>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 rounded-full text-sm font-medium">
                  {completedReferrals.length}
                </span>
              </div>
            </div>
            <div className="p-4 max-h-[700px] overflow-y-auto">
              {completedReferrals.length === 0 ? (
                <div className="text-center py-12">
                  <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No completed referrals</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedReferrals.map(renderReferralCard)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderArchivedSection = () => {
    const archivedReferrals = allReferrals.filter(r => r.status === 'completed' || r.status === 'cancelled');
    
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-current">Archived Referrals</h1>
            <p className="text-gray-500 dark:text-gray-400">
              View completed and cancelled referrals.
            </p>
          </div>
        </div>

        {/* Archived Referrals */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Archived Referrals ({archivedReferrals.length})
            </h3>
          </div>
          
          <div className="p-6">
            {archivedReferrals.length === 0 ? (
              <div className="text-center py-8">
                <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No archived referrals yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {archivedReferrals.map((referral) => (
                  <div key={referral.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center text-white font-medium">
                          {referral.patient_full_name?.split(' ').map((n: string) => n[0]).join('') || 'N/A'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {referral.patient_full_name}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(referral.status)}`}>
                                {getStatusLabel(referral.status, referral)}
                              </span>
                              {(referral.status === 'completed' || referral.status === 'uncoordinated') && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                  referral.status === 'completed' 
                                    ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'
                                    : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                                }`}>
                                  {referral.status === 'completed' ? '✅ Completed' : '❌ Uncoordinated'}
                                </span>
                              )}
                              <button
                                onClick={() => openTimelineModal(referral)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium flex items-center gap-1 underline"
                                title="View referral timeline"
                              >
                                <Clock className="w-3 h-3" />
                                View Timeline
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <strong>Chief Complaint:</strong> {referral.chief_complaint}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <strong>Specialty:</strong> {referral.specialty_needed_name}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 mt-2">
                            <span>ID: {referral.referral_id}</span>
                            <span>Completed: {new Date(referral.updated_at || referral.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderReportsSection = () => {
    const monthlyData: { [key: string]: number } = {};
    const specialtyData: { [key: string]: number } = {};
    
    // Process data for reports
    allReferrals.forEach(referral => {
      const month = new Date(referral.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      monthlyData[month] = (monthlyData[month] || 0) + 1;
      
      const specialty = referral.specialty_needed_name || 'Unknown';
      specialtyData[specialty] = (specialtyData[specialty] || 0) + 1;
    });

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-current">Reports & Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400">
              View detailed analytics of your referral activity.
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.total_referrals}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.total_referrals > 0 ? Math.round((stats.completed_referrals / stats.total_referrals) * 100) : 0}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.this_month}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. per Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {Object.keys(monthlyData).length > 0 ? Math.round(stats.total_referrals / Object.keys(monthlyData).length) : 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Monthly Breakdown */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(monthlyData).map(([month, count]) => (
              <div key={month} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white">{month}</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">{count} referrals</span>
              </div>
            ))}
          </div>
        </div>

        {/* Specialty Breakdown */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Referrals by Specialty</h3>
          <div className="space-y-3">
            {Object.entries(specialtyData).map(([specialty, count]) => (
              <div key={specialty} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white">{specialty}</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">{count} referrals</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <ReferrerDashboardLayout>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 transition-colors duration-300">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
            <span className="text-gray-600 dark:text-gray-400">Loading dashboard...</span>
          </div>
        </div>
      </ReferrerDashboardLayout>
    );
  }

  return (
    <ReferrerDashboardLayout>
      {renderDashboardSection()}

      {/* Timeline Modal */}
      <Dialog open={timelineModalOpen} onOpenChange={setTimelineModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Referral Timeline - {selectedReferral?.patient_full_name}
            </DialogTitle>
            <DialogDescription>
              Track the complete journey of this referral from submission to completion
            </DialogDescription>
          </DialogHeader>

          {selectedReferral && (
            <div className="space-y-6">
              {/* Referral Info */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Referral ID:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{selectedReferral.referral_id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Specialty:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{selectedReferral.specialty_needed_name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Chief Complaint:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{selectedReferral.chief_complaint}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Current Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedReferral.status)}`}>
                      {getStatusLabel(selectedReferral.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                {getTimelineSteps(selectedReferral).map((step, index) => {
                  const IconComponent = step.icon;
                  const isCompleted = step.completed;
                  const isCurrent = selectedReferral.status === step.status;

                  // Get color classes based on step color
                  const getColorClasses = () => {
                    if (isCompleted) {
                      switch (step.color) {
                        case 'yellow': return 'bg-yellow-500 text-white';
                        case 'blue': return 'bg-blue-500 text-white';
                        case 'cyan': return 'bg-cyan-500 text-white';
                        case 'green': return 'bg-green-500 text-white';
                        case 'purple': return 'bg-purple-500 text-white';
                        case 'red': return 'bg-red-500 text-white';
                        case 'orange': return 'bg-orange-500 text-white';
                        default: return 'bg-gray-500 text-white';
                      }
                    } else if (isCurrent) {
                      switch (step.color) {
                        case 'yellow': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-2 border-yellow-500';
                        case 'blue': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-2 border-blue-500';
                        case 'cyan': return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border-2 border-cyan-500';
                        case 'green': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-2 border-green-500';
                        case 'purple': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-2 border-purple-500';
                        case 'red': return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-2 border-red-500';
                        case 'orange': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-2 border-orange-500';
                        default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 border-2 border-gray-500';
                      }
                    } else {
                      return 'bg-gray-200 dark:bg-gray-700 text-gray-400';
                    }
                  };

                  const getTitleColorClass = () => {
                    if (isCompleted) return 'text-gray-900 dark:text-white';
                    if (isCurrent) {
                      switch (step.color) {
                        case 'yellow': return 'text-yellow-600 dark:text-yellow-400';
                        case 'blue': return 'text-blue-600 dark:text-blue-400';
                        case 'cyan': return 'text-cyan-600 dark:text-cyan-400';
                        case 'green': return 'text-green-600 dark:text-green-400';
                        case 'purple': return 'text-purple-600 dark:text-purple-400';
                        case 'red': return 'text-red-600 dark:text-red-400';
                        case 'orange': return 'text-orange-600 dark:text-orange-400';
                        default: return 'text-gray-600 dark:text-gray-400';
                      }
                    }
                    return 'text-gray-500 dark:text-gray-400';
                  };

                  return (
                    <div key={step.status} className="flex items-start gap-4">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getColorClasses()}`}>
                          {isCompleted ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <IconComponent className="w-5 h-5" />
                          )}
                        </div>
                        {index < getTimelineSteps(selectedReferral).length - 1 && (
                          <div className={`w-0.5 h-8 ${
                            isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                          }`} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-8">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium ${getTitleColorClass()}`}>
                            {step.label}
                          </h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {step.description}
                        </p>
                        {step.date && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(step.date).toLocaleString()}
                            </p>
                            {step.user && step.action && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span className="font-medium">{step.user}</span>
                                <span className="text-gray-400">•</span>
                                <span>{step.action}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transit Decision Modal */}
      <Dialog open={transitDecisionModalOpen} onOpenChange={setTransitDecisionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-orange-600" />
              Triage Call - Transit Decision
            </DialogTitle>
            <DialogDescription>
              EDMAR staff has marked this referral as urgent. Please decide when the patient should be transported.
            </DialogDescription>
          </DialogHeader>

          {transitDecisionReferral && (
            <div className="space-y-4">
              {/* Patient Info */}
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {transitDecisionReferral.patient_full_name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Chief Complaint:</strong> {transitDecisionReferral.chief_complaint}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Referral ID:</strong> {transitDecisionReferral.referral_id}
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mt-2">
                  ⚡ Marked as URGENT by EDMAR Triage
                </p>
              </div>

              {/* Decision Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => handleTransitDecision('now')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-5 h-5" />
                  Transport Now (Immediate)
                </button>
                
                <button
                  onClick={() => {
                    // For scheduled transport, we'd need additional inputs for date/time
                    // For now, let's handle immediate transport
                    const scheduledDate = new Date();
                    scheduledDate.setHours(scheduledDate.getHours() + 2); // 2 hours from now
                    handleTransitDecision('scheduled', 
                      scheduledDate.toISOString().split('T')[0], 
                      scheduledDate.toTimeString().split(' ')[0].substring(0, 5)
                    );
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Schedule Transport (2 hours from now)
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Both EDCC and EDMAR will be notified of your decision
              </p>
                                          </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transit Form Modal */}
      {transitFormReferral && (
        <TransitFormDialog
          open={transitFormModalOpen}
          onOpenChange={setTransitFormModalOpen}
          referralId={transitFormReferral.id}
          patientName={transitFormReferral.patient_full_name}
          onSuccess={() => {
            setTransitFormModalOpen(false);
            // Refresh the dashboard data
            const fetchDashboardData = async () => {
              try {
                const response = await referralsAPI.getMySubmittedReferrals();
                const referrals = response.results || response;
                if (Array.isArray(referrals)) {
                  setAllReferrals(referrals);
                  const sortedReferrals = referrals
                    .filter(r => r.status !== 'completed' && r.status !== 'uncoordinated')
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5);
                  setRecentReferrals(sortedReferrals);
                }
              } catch (error) {
                console.error('Error refreshing dashboard:', error);
              }
            };
            fetchDashboardData();
          }}
        />
      )}
    </ReferrerDashboardLayout>
  );
};

export default ReferrerDashboard;