import { useState, useEffect } from "react";
import { ReferrerDashboardLayout } from "@/components/layout/ReferrerDashboardLayout";
import { TransferActionDropdown } from "@/components/ui/TransferActionDropdown";
import { TransitFormDialog } from "@/components/ui/TransitFormDialog";
import { EditActionButton } from "@/components/ui/edit-action-button";
import { referralsAPI, departmentsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  Clock,
  Eye,
  CheckCircle,
  AlertTriangle,
  Plus,
  TrendingUp,
  Archive,
  X,
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
  const [recentStatusFilter, setRecentStatusFilter] = useState<string>('all');
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [contactDetailsModalOpen, setContactDetailsModalOpen] = useState(false);
  const [contactDetailsReferral, setContactDetailsReferral] = useState<any>(null);
  const [contactDetailsFocusCode, setContactDetailsFocusCode] = useState<string | null>(null);
  const [transitTemplateDetailsModalOpen, setTransitTemplateDetailsModalOpen] = useState(false);
  const [transitTemplateDetailsReferral, setTransitTemplateDetailsReferral] = useState<any>(null);
  const [transitDecisionModalOpen, setTransitDecisionModalOpen] = useState(false);
  const [transitDecisionReferral, setTransitDecisionReferral] = useState<any>(null);
  const [transitFormModalOpen, setTransitFormModalOpen] = useState(false);
  const [transitFormReferral, setTransitFormReferral] = useState<any>(null);

  // Reports section state
  const [reportFilter, setReportFilter] = useState<'week' | 'month'>('month');
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);

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
        
        // Fetch my submitted referrals and department contacts
        const [response, deptResponse] = await Promise.all([
          referralsAPI.getMySubmittedReferrals(),
          departmentsAPI.getAll(),
        ]);
        const referrals = response.results || response;
        const deptRows = deptResponse.results || deptResponse || [];
        if (Array.isArray(deptRows)) {
          setDepartments(deptRows);
        }
        
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

  const getDepartmentDetails = (code?: string) => {
    if (!code) return null;
    return departments.find((dept: any) => dept.code === code);
  };

  const getDepartmentDisplay = (code?: string) => {
    if (!code) return "N/A";
    const department = getDepartmentDetails(code);
    if (department?.name) return department.name;
    return code.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const getDepartmentContactText = (code?: string) => {
    if (!code) return "Contact unavailable";
    const department = getDepartmentDetails(code);
    return department?.contact_number || "Contact unavailable";
  };

  const getMainServiceCode = (referral: any) => {
    if (referral.main_service_code) return referral.main_service_code;
    if (Array.isArray(referral.assigned_departments) && referral.assigned_departments.length > 0) {
      return referral.assigned_departments[0];
    }
    return undefined;
  };

  const getCoManageCodes = (referral: any) => {
    const assigned = Array.isArray(referral.assigned_departments) ? referral.assigned_departments : [];
    const mainServiceCode = getMainServiceCode(referral);
    return assigned.filter((code: string) => code !== mainServiceCode);
  };

  const openContactDetailsModal = (referral: any, focusCode?: string) => {
    setContactDetailsReferral(referral);
    setContactDetailsFocusCode(focusCode || null);
    setContactDetailsModalOpen(true);
  };

  const openTransitTemplateDetailsModal = (referral: any) => {
    setTransitTemplateDetailsReferral(referral);
    setTransitTemplateDetailsModalOpen(true);
  };

  const formatTelLink = (value?: string) => {
    if (!value) return "";
    return value.replace(/[^\d+]/g, "");
  };

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

  const statusFilterOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'waiting_acceptance', label: 'Waiting Acceptance' },
    { value: 'dispositioned', label: 'Dispositioned' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'schedule_opd', label: 'Schedule OPD' },
  ];

  const filteredRecentReferrals = recentStatusFilter === 'all'
    ? recentReferrals
    : recentReferrals.filter((referral) => referral.status === recentStatusFilter);

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
    const getLatestDate = (...dates: Array<string | undefined | null>) => {
      const validDates = dates
        .filter((date): date is string => Boolean(date))
        .map((date) => ({ raw: date, ts: new Date(date).getTime() }))
        .filter((entry) => !Number.isNaN(entry.ts))
        .sort((a, b) => b.ts - a.ts);

      return validDates.length > 0 ? validDates[0].raw : null;
    };

    const isCancelled = referral.status === 'cancelled';
    const isScheduleOPD = referral.status === 'schedule_opd' || referral.triage_decision === 'schedule_opd';
    
    // Check if disposition finalized (triage has made a decision and assigned departments)
    // This should only be true when triage has actually processed the referral
    const dispositionFinalized = (
      referral.triage_decision || 
      (referral.assigned_departments && referral.assigned_departments.length > 0) ||
      referral.status === 'waiting_acceptance' ||
      referral.status === 'awaiting_triage_verification'
    );
    
    // Check if main service accepted (endorsement complete)
    // This includes when departments have accepted (awaiting_triage_verification) or when dispositioned
    const mainServiceAccepted = referral.status === 'awaiting_triage_verification' ||
                                 referral.status === 'dispositioned' || 
                                 referral.status === 'in_transit' || 
                                 referral.status === 'completed';
    
    // Check if in transit (transit template submitted)
    const inTransit = referral.status === 'in_transit' || referral.status === 'completed';
    
    // Check if completed
    const isCompleted = referral.status === 'completed' || isScheduleOPD;

    const steps = [
      {
        status: 'pending',
        label: 'Request Submitted',
        description: 'Referral request submitted and awaiting review',
        icon: FileText,
        color: 'green',
        completed: true, // Always lit
        date: referral.created_at,
        user: referral.created_by_user || 'Referrer',
        action: 'Created referral request'
      },
      {
        status: 'disposition_finalized',
        label: 'Disposition Finalized',
        description: 'EDCC/EDMA assigned triage level and departments',
        icon: Clock,
        color: 'blue',
        completed: isCancelled
          ? false
          : (isScheduleOPD ? dispositionFinalized : (dispositionFinalized || mainServiceAccepted || inTransit || isCompleted)),
        date: getLatestDate(referral.triaged_at, referral.transferred_at),
        user: referral.triaged_by_user || referral.transferred_by_user || 'EDCC/EDMA',
        action: referral.triage_decision 
          ? `Assigned ${referral.triage_decision.replace('_', ' ').toUpperCase()} priority with Main Service` 
          : 'Assigned to departments'
      },
      {
        status: 'endorsement_complete',
        label: 'Endorsement Complete',
        description: 'Main Service department accepted the referral',
        icon: CheckCircle,
        color: 'cyan',
        completed: isCancelled ? false : (isScheduleOPD ? false : (mainServiceAccepted || inTransit || isCompleted)),
        date: referral.status === 'dispositioned' || referral.status === 'in_transit' || referral.status === 'completed' ? referral.updated_at : null,
        user: 'Main Service Department',
        action: 'Main Service accepted referral'
      },
      {
        status: 'in_transit',
        label: 'In Transit',
        description: 'Transit template submitted - patient in transport',
        icon: MapPin,
        color: 'orange',
        completed: isCancelled ? false : (isScheduleOPD ? false : inTransit),
        date: referral.status === 'in_transit' || referral.status === 'completed' ? referral.updated_at : null,
        user: referral.created_by_user || 'Referrer',
        action: 'Transit form submitted'
      },
      {
        status: 'completed',
        label: isCancelled ? 'Cancelled' : 'Complete',
        description: isCancelled 
          ? 'Referral has been cancelled' 
          : isScheduleOPD 
            ? 'Scheduled for Outpatient Department' 
            : 'Referral process completed successfully',
        icon: isCancelled ? X : CheckCircle,
        color: isCancelled ? 'red' : 'green',
        completed: isCompleted || isCancelled,
        date: (referral.status === 'completed' || referral.status === 'cancelled' || isScheduleOPD) ? referral.updated_at : null,
        user: isCancelled 
          ? (referral.triaged_by_user || referral.transferred_by_user || referral.created_by_user || 'Staff')
          : isScheduleOPD 
            ? 'EDCC/EDMA'
            : 'EDCC/EDMA',
        action: isCancelled 
          ? 'Referral cancelled' 
          : isScheduleOPD 
            ? 'Marked as Schedule OPD and routed to Outpatient Department' 
            : 'Patient arrived and admitted'
      }
    ];

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

  const renderReportsSection = () => {
    const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    const PENDING_STATUSES = ['pending', 'waiting', 'waiting_acceptance', 'dispositioned', 'in_transit', 'emergent', 'urgent', 'schedule_opd'];
    const coordinated = allReferrals.filter(r => r.status === 'completed');
    const cancelled = allReferrals.filter(r => r.status === 'cancelled' || r.status === 'uncoordinated');
    const pending = allReferrals.filter(r => PENDING_STATUSES.includes(r.status));

    // Chart data
    const getChartData = () => {
      if (reportFilter === 'month') {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return months.map((label, i) => ({
          period: label,
          count: allReferrals.filter(r => {
            const d = new Date(r.created_at);
            return d.getFullYear() === reportYear && d.getMonth() === i;
          }).length
        }));
      }
      const weeks: { period: string; count: number }[] = [];
      const year = new Date().getFullYear();
      const firstDay = new Date(year, reportMonth - 1, 1);
      const lastDay = new Date(year, reportMonth, 0);
      let ws = new Date(firstDay); let wn = 1;
      while (ws <= lastDay) {
        const we = new Date(ws); we.setDate(we.getDate() + 6);
        if (we > lastDay) we.setTime(lastDay.getTime());
        weeks.push({ period: `Wk ${wn}`, count: allReferrals.filter(r => { const d = new Date(r.created_at); return d >= ws && d <= we; }).length });
        ws.setDate(ws.getDate() + 7); wn++;
      }
      return weeks;
    };

    const chartData = getChartData();
    const maxVal = Math.max(...chartData.map(d => d.count), 1);
    const step = Math.max(1, Math.ceil(maxVal / 4));
    const gridVals = Array.from({ length: 5 }, (_, i) => i * step);
    const actualMax = Math.max(maxVal, gridVals[gridVals.length - 1]);

    // Fixed SVG dimensions — small and tight
    const VW = 500; const VH = 130;
    const pL = 30; const pR = 8; const pT = 10; const pB = 28;
    const cW = VW - pL - pR; const cH = VH - pT - pB;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Analytics for your submitted referrals</p>
        </div>

        {/* 3 summary cards — Coordinated, Pending, Cancelled only */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 dark:bg-gray-800 border border-green-200 dark:border-gray-700 px-4 py-3 rounded-lg">
            <p className="text-xs font-medium text-green-700 dark:text-green-400">Coordinated</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 leading-tight">{coordinated.length}</p>
            <p className="text-xs text-green-500 mt-0.5">{allReferrals.length > 0 ? Math.round((coordinated.length / allReferrals.length) * 100) : 0}% success rate</p>
          </div>
          <div className="bg-yellow-50 dark:bg-gray-800 border border-yellow-200 dark:border-gray-700 px-4 py-3 rounded-lg">
            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 leading-tight">{pending.length}</p>
            <p className="text-xs text-yellow-500 mt-0.5">Active referrals</p>
          </div>
          <div className="bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-gray-700 px-4 py-3 rounded-lg">
            <p className="text-xs font-medium text-red-700 dark:text-red-400">Cancelled</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400 leading-tight">{cancelled.length}</p>
            <p className="text-xs text-red-500 mt-0.5">{allReferrals.length > 0 ? Math.round((cancelled.length / allReferrals.length) * 100) : 0}% cancellation rate</p>
          </div>
        </div>

        {/* Chart — compact */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">            <TrendingUp className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              Referrals by {reportFilter === 'month' ? 'Month' : 'Week'}
            </span>
            <div className="ml-auto flex items-center gap-1">
              {(['week', 'month'] as const).map(f => (
                <button key={f} onClick={() => setReportFilter(f)}
                  className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                    reportFilter === f ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                  }`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
              {reportFilter === 'month' && (
                <select value={reportYear} onChange={e => setReportYear(Number(e.target.value))}
                  className="px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              )}
              {reportFilter === 'week' && (
                <select value={reportMonth} onChange={e => setReportMonth(Number(e.target.value))}
                  className="px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                    <option key={i+1} value={i+1}>{m}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="h-36 w-full max-w-2xl mx-auto">
            <svg className="w-full h-full" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet">
            <line x1={pL} y1={pT} x2={pL} y2={pT+cH} stroke="#6b7280" strokeWidth="1"/>
            <line x1={pL} y1={pT+cH} x2={pL+cW} y2={pT+cH} stroke="#6b7280" strokeWidth="1"/>
            {gridVals.map((v, i) => {
              const yp = pT + cH - (v / actualMax) * cH;
              return (
                <g key={i}>
                  <line x1={pL} y1={yp} x2={pL+cW} y2={yp} stroke="#e5e7eb" strokeWidth="0.8" opacity="0.8"/>
                  <text x={pL-3} y={yp} textAnchor="end" dominantBaseline="middle" fill="#9ca3af" fontSize="7">{v}</text>
                </g>
              );
            })}
            {chartData.map((item, idx) => {
              const sp = cW / chartData.length;
              const bw = Math.max(6, sp * 0.45);
              const x = pL + idx * sp + (sp - bw) / 2;
              const bh = Math.max((item.count / actualMax) * cH, item.count > 0 ? 1.5 : 0);
              const y = pT + cH - bh;
              const lx = pL + idx * sp + sp / 2;
              return (
                <g key={idx}>
                  <rect x={x} y={y} width={bw} height={bh} fill="#3b82f6" rx="1.5"/>
                  {item.count > 0 && <text x={x+bw/2} y={y-2} textAnchor="middle" fill="#6b7280" fontSize="7" fontWeight="600">{item.count}</text>}
                  <text x={lx} y={pT+cH+9} textAnchor="middle" fill="#9ca3af" fontSize="7"
                    transform={chartData.length > 6 ? `rotate(-40 ${lx} ${pT+cH+9})` : undefined}>
                    {item.period}
                  </text>
                </g>
              );
            })}
            </svg>
          </div>
        </div>

        {/* Detail panels — 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Coordinated */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-3 py-2 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0"/>
              <span className="text-xs font-semibold text-green-800 dark:text-green-300">Coordinated Referrals</span>
              <span className="ml-auto text-xs font-bold text-green-600 dark:text-green-400">{coordinated.length}</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-56 overflow-y-auto">
              {coordinated.length === 0
                ? <p className="text-center text-gray-400 text-xs py-4">No coordinated referrals yet</p>
                : coordinated.map(r => (
                  <div key={r.id} className="px-3 py-2">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{r.patient_name || 'Unknown Patient'}</p>
                    <p className="text-xs text-gray-400 truncate">{r.hospital_name || r.referring_hospital_name || '—'} · {new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Cancelled */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0"/>
              <span className="text-xs font-semibold text-red-800 dark:text-red-300">Cancelled Referrals</span>
              <span className="ml-auto text-xs font-bold text-red-600 dark:text-red-400">{cancelled.length}</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-56 overflow-y-auto">
              {cancelled.length === 0
                ? <p className="text-center text-gray-400 text-xs py-4">No cancelled referrals</p>
                : cancelled.map(r => (
                  <div key={r.id} className="px-3 py-2">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{r.patient_name || 'Unknown Patient'}</p>
                    <p className="text-xs text-gray-400 truncate">{r.hospital_name || r.referring_hospital_name || '—'} · {new Date(r.created_at).toLocaleDateString()}</p>
                    {r.cancellation_reason && <p className="text-xs text-red-400 italic truncate">Reason: {r.cancellation_reason}</p>}
                  </div>
                ))}
            </div>
          </div>

          {/* Pending */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-3 py-2 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0"/>
              <span className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">Pending Referrals</span>
              <span className="ml-auto text-xs font-bold text-yellow-600 dark:text-yellow-400">{pending.length}</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-56 overflow-y-auto">
              {pending.length === 0
                ? <p className="text-center text-gray-400 text-xs py-4">No pending referrals</p>
                : pending.map(r => (
                  <div key={r.id} className="px-3 py-2">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{r.patient_name || 'Unknown Patient'}</p>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <p className="text-xs text-gray-400 truncate">{r.hospital_name || r.referring_hospital_name || '—'} · {new Date(r.created_at).toLocaleDateString()}</p>
                      <span className={`text-xs px-1 py-0.5 rounded-full border flex-shrink-0 ${getStatusColor(r.status)}`}>{getStatusLabel(r.status)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
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

      {/* Waiting Acceptance/In Transit - single containers, multiple data rows */}
      {recentReferrals.some(r => r.status === 'waiting_acceptance' || r.status === 'in_transit' || r.status === 'dispositioned') && (
        <div className="mb-4 space-y-3 animate-pulse">
          <div className="bg-white dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 animate-bounce flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                  Referrals For Department Contact / Transit
                </h3>
                <p className="text-green-700 dark:text-green-300 mt-1 text-sm">
                  {recentReferrals.filter(r => r.status === 'waiting_acceptance' || r.status === 'in_transit').length} referral(s) currently active for coordination.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 p-3 shadow-sm">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                <PhoneCall className="w-4 h-4" />
                Contact Main Service and Co-Manage
              </h4>
              <div className="mt-2 space-y-2">
                {recentReferrals.filter(r => r.status === 'waiting_acceptance' || r.status === 'in_transit').map((referral) => (
                  <div key={`contact-${referral.id}`} className="rounded-lg border border-yellow-200 dark:border-yellow-700 bg-white dark:bg-gray-800/40 p-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">{referral.patient_full_name}</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">ID: {referral.referral_id}</p>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {(() => {
                        const mainServiceCode = getMainServiceCode(referral);
                        if (!mainServiceCode) {
                          return (
                            <p className="text-xs text-yellow-700 dark:text-yellow-300">Main Service: Not assigned</p>
                          );
                        }
                        const mainContact = getDepartmentContactText(mainServiceCode);
                        return (
                          <button
                            type="button"
                            onClick={() => openContactDetailsModal(referral, mainServiceCode)}
                            className="inline-flex items-center gap-1 rounded-md border border-yellow-300 dark:border-yellow-600 bg-white dark:bg-yellow-900/30 px-2 py-1 hover:bg-yellow-50 dark:hover:bg-yellow-800/40 transition-colors"
                            title={`View full details for ${getDepartmentDisplay(mainServiceCode)}`}
                          >
                            <span className="text-[10px] uppercase tracking-wide text-yellow-700 dark:text-yellow-300 font-semibold">Main</span>
                            <span className="text-xs font-semibold text-yellow-900 dark:text-yellow-100">{getDepartmentDisplay(mainServiceCode)}</span>
                            <span className="text-[11px] text-yellow-700 dark:text-yellow-300">{mainContact}</span>
                          </button>
                        );
                      })()}

                      {getCoManageCodes(referral).length > 0 ? (
                        getCoManageCodes(referral).map((code: string) => {
                          const coContact = getDepartmentContactText(code);
                          return (
                            <button
                              type="button"
                              key={`co-manage-${referral.id}-${code}`}
                              onClick={() => openContactDetailsModal(referral, code)}
                              className="inline-flex items-center gap-1 rounded-md border border-yellow-200 dark:border-yellow-700 bg-white dark:bg-gray-800/50 px-2 py-1 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                              title={`View full details for ${getDepartmentDisplay(code)}`}
                            >
                              <span className="text-[10px] uppercase tracking-wide text-yellow-700 dark:text-yellow-300 font-semibold">Co</span>
                              <span className="text-xs font-semibold text-yellow-900 dark:text-yellow-100">{getDepartmentDisplay(code)}</span>
                              <span className="text-[11px] text-yellow-700 dark:text-yellow-300">{coContact}</span>
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">Co-Manage: None</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                Please contact the assigned department(s) before transport.
              </p>
            </div>

            {recentReferrals.some(r => r.status === 'dispositioned') && (
            <div className="rounded-lg border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 p-3 shadow-sm">
              <h4 className="font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Fill Up Transit Template
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">
                Transit template actions per referral.
              </p>
              <div className="mt-3 space-y-2">
                {recentReferrals.filter(r => r.status === 'dispositioned').map((referral) => (
                  <button
                    key={`transit-${referral.id}`}
                    type="button"
                    onClick={() => openTransitTemplateDetailsModal(referral)}
                    className="w-full rounded-lg border border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/30 p-3 text-left hover:bg-orange-100 dark:hover:bg-orange-800/40 transition-colors"
                  >
                    <p className="text-xs uppercase tracking-wide font-semibold text-orange-700 dark:text-orange-300">
                      {referral.patient_full_name}
                    </p>
                    <p className="text-sm font-semibold text-orange-900 dark:text-orange-100 mt-1">
                      Referral ID: {referral.referral_id}
                    </p>
                    <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                      View complete details and fill-up actions
                    </p>
                  </button>
                ))}
              </div>
            </div>
            )}
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
          <div className="mt-3 flex flex-wrap gap-2">
            {statusFilterOptions.map((option) => (
              <button
                key={`recent-filter-${option.value}`}
                type="button"
                onClick={() => setRecentStatusFilter(option.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  recentStatusFilter === option.value
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-green-500 hover:text-green-700 dark:hover:text-green-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6">
          {filteredRecentReferrals.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {recentReferrals.length === 0 ? 'No referrals submitted yet' : 'No referrals match this status'}
              </p>
              <Link to="/referral">
                <button className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                  Submit Your First Referral
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecentReferrals.map((referral) => (
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
                        {referral.status === 'completed' ? '✅ Completed' : '❌ Cancelled'}
                      </span>
                    )}
                    <button
                      onClick={() => openTimelineModal(referral)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/35 whitespace-nowrap"
                      title="Timeline"
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
              {/* Show dispositioned actions dropdown */}
              {referral.status === 'dispositioned' && (
                <div className="flex-shrink-0">
                  <TransferActionDropdown
                    referralId={referral.id || ''}
                    patientName={referral.patient_full_name || ''}
                    triggerLabel="Fill Form"
                    hasDelayNotification={!!referral.delay_notified_at}
                    onFillForm={() => {
                      setTransitFormReferral(referral);
                      setTransitFormModalOpen(true);
                    }}
                    onDelaySuccess={() => {
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
                <EditActionButton asChild title="Edit Referral" aria-label="Edit Referral">
                  <Link to={`/referral/edit/${referral.id}`}>Edit</Link>
                </EditActionButton>
              )}
              {/* Show View button for all referrals */}
              <Link
                to={`/referral/view/${referral.id}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white/70 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-700/60"
                title="Details"
              >
                <Eye className="w-3 h-3" />
                Details
              </Link>
              <button
                onClick={() => openTimelineModal(referral)}
                className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/35"
                title="Timeline"
              >
                <Clock className="w-3 h-3" />
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

          {/* Right: Completed/Cancelled Referrals */}
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
                                  {referral.status === 'completed' ? '✅ Completed' : '❌ Cancelled'}
                                </span>
                              )}
                              <button
                                onClick={() => openTimelineModal(referral)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/35"
                                title="Timeline"
                              >
                                <Clock className="w-3 h-3" />
                                Timeline
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Referral Timeline</DialogTitle>
            <DialogDescription className="text-gray-400">
              Track the progress of referral {selectedReferral?.referral_id}
            </DialogDescription>
          </DialogHeader>

          {selectedReferral && (
            <div className="space-y-6">
              {/* Patient Information */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Patient Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <span className="ml-2 font-medium text-white">{selectedReferral.patient_full_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Age/Gender:</span>
                    <span className="ml-2 font-medium text-white">
                      {selectedReferral.age} yrs, {selectedReferral.gender}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">Chief Complaint:</span>
                    <span className="ml-2 font-medium text-white">{selectedReferral.chief_complaint}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative">
                {getTimelineSteps(selectedReferral).map((step, index) => {
                  const IconComponent = step.icon;
                  const isCompleted = step.completed;
                  const isLast = index === getTimelineSteps(selectedReferral).length - 1;

                  // Get color classes based on step color
                  const getColorClasses = () => {
                    if (isCompleted) {
                      switch (step.color) {
                        case 'yellow': return { bg: 'bg-yellow-500', border: 'border-yellow-200', icon: 'text-white' };
                        case 'blue': return { bg: 'bg-blue-500', border: 'border-blue-200', icon: 'text-white' };
                        case 'cyan': return { bg: 'bg-cyan-500', border: 'border-cyan-200', icon: 'text-white' };
                        case 'green': return { bg: 'bg-green-500', border: 'border-green-200', icon: 'text-white' };
                        case 'purple': return { bg: 'bg-purple-500', border: 'border-purple-200', icon: 'text-white' };
                        case 'red': return { bg: 'bg-red-500', border: 'border-red-200', icon: 'text-white' };
                        case 'orange': return { bg: 'bg-orange-500', border: 'border-orange-200', icon: 'text-white' };
                        default: return { bg: 'bg-gray-500', border: 'border-gray-200', icon: 'text-white' };
                      }
                    }
                    return { bg: 'bg-gray-700', border: 'border-gray-600', icon: 'text-gray-500' };
                  };

                  const colors = getColorClasses();

                  return (
                    <div key={step.status} className="flex gap-4 pb-8 relative">
                      {/* Vertical Line */}
                      {!isLast && (
                        <div 
                          className={`absolute left-6 top-12 w-0.5 h-full ${
                            isCompleted ? 'bg-green-500' : 'bg-gray-700'
                          }`}
                        />
                      )}
                      
                      {/* Icon Circle */}
                      <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 ${colors.bg} ${colors.border}`}>
                        <IconComponent className={`w-6 h-6 ${colors.icon}`} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <h4 className={`font-semibold ${isCompleted ? 'text-white' : 'text-gray-500'}`}>
                          {step.label}
                        </h4>
                        <p className={`text-sm ${isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>
                          {step.description}
                        </p>
                        {/* Status Badge */}
                        <div className="mt-2">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </span>
                          ) : index === getTimelineSteps(selectedReferral).findIndex(s => !s.completed) ? (
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
                        {!isCompleted && index === getTimelineSteps(selectedReferral).findIndex(s => !s.completed) && (
                          <p className="text-xs text-yellow-400/80 mt-1 italic">
                            {step.status === 'disposition_finalized' && 'Waiting for EDCC/EDMA to assign departments'}
                            {step.status === 'endorsement_complete' && 'Waiting for Main Service to accept referral'}
                            {step.status === 'in_transit' && 'Waiting for transit form submission'}
                            {step.status === 'completed' && 'Waiting for process completion'}
                          </p>
                        )}
                        {step.date && isCompleted && (
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
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Details Modal */}
      <Dialog open={contactDetailsModalOpen} onOpenChange={setContactDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-green-600" />
              Department Contact Details
            </DialogTitle>
            <DialogDescription>
              Complete Main Service and Co-Manage contact information for referral coordination.
            </DialogDescription>
          </DialogHeader>

          {contactDetailsReferral && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">Referral ID:</span> {contactDetailsReferral.referral_id}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  <span className="font-semibold">Patient:</span> {contactDetailsReferral.patient_full_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  <span className="font-semibold">Chief Complaint:</span> {contactDetailsReferral.chief_complaint || "N/A"}
                </p>
              </div>

              <div className="space-y-3">
                {(() => {
                  const mainServiceCode = getMainServiceCode(contactDetailsReferral);
                  const coManageCodes = getCoManageCodes(contactDetailsReferral);
                  const rows = [
                    ...(mainServiceCode
                      ? [{ role: "Main Service", code: mainServiceCode }]
                      : []),
                    ...coManageCodes.map((code: string) => ({ role: "Co-Manage", code })),
                  ];

                  if (rows.length === 0) {
                    return (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">
                        No assigned department details are available yet.
                      </div>
                    );
                  }

                  return rows.map((item) => {
                    const contact = getDepartmentContactText(item.code);
                    const tel = formatTelLink(contact);
                    const isFocused = contactDetailsFocusCode === item.code;
                    return (
                      <div
                        key={`${contactDetailsReferral.id}-${item.role}-${item.code}`}
                        className={`rounded-lg border p-3 ${isFocused
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40"
                        }`}
                      >
                        <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">{item.role}</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white mt-1">{getDepartmentDisplay(item.code)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Code: {item.code}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-200 mt-2">Contact: {contact}</p>
                        {tel && (
                          <a
                            href={`tel:${tel}`}
                            className="inline-flex items-center mt-2 text-sm font-medium text-green-700 dark:text-green-300 hover:underline"
                          >
                            Call this department
                          </a>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Remarks</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  {contactDetailsReferral.triage_remarks || "No EDCC/EDMA assignment remarks provided."}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transit Template Details Modal */}
      <Dialog open={transitTemplateDetailsModalOpen} onOpenChange={setTransitTemplateDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Transit Template Details
            </DialogTitle>
            <DialogDescription>
              Complete details and actions for the referral transit template.
            </DialogDescription>
          </DialogHeader>

          {transitTemplateDetailsReferral && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-semibold">Referral ID:</span> {transitTemplateDetailsReferral.referral_id}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <span className="font-semibold">Patient:</span> {transitTemplateDetailsReferral.patient_full_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <span className="font-semibold">Chief Complaint:</span> {transitTemplateDetailsReferral.chief_complaint || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <span className="font-semibold">Triage Decision:</span> {transitTemplateDetailsReferral.triage_decision || "N/A"}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <TransferActionDropdown
                      referralId={transitTemplateDetailsReferral.id || ''}
                      patientName={transitTemplateDetailsReferral.patient_full_name || ''}
                      hasDelayNotification={!!transitTemplateDetailsReferral.delay_notified_at}
                      onFillForm={() => {
                        setTransitTemplateDetailsModalOpen(false);
                        setTransitFormReferral(transitTemplateDetailsReferral);
                        setTransitFormModalOpen(true);
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

              <div className="space-y-3">
                {(() => {
                  const mainServiceCode = getMainServiceCode(transitTemplateDetailsReferral);
                  const coManageCodes = getCoManageCodes(transitTemplateDetailsReferral);
                  const rows = [
                    ...(mainServiceCode
                      ? [{ role: "Main Service", code: mainServiceCode }]
                      : []),
                    ...coManageCodes.map((code: string) => ({ role: "Co-Manage", code })),
                  ];

                  if (rows.length === 0) {
                    return (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">
                        No assigned department details are available yet.
                      </div>
                    );
                  }

                  return rows.map((item) => {
                    const contact = getDepartmentContactText(item.code);
                    const tel = formatTelLink(contact);
                    return (
                      <div
                        key={`${transitTemplateDetailsReferral.id}-${item.role}-${item.code}`}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 p-3"
                      >
                        <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">{item.role}</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white mt-1">{getDepartmentDisplay(item.code)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Code: {item.code}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-200 mt-2">Contact: {contact}</p>
                        {tel && (
                          <a
                            href={`tel:${tel}`}
                            className="inline-flex items-center mt-2 text-sm font-medium text-green-700 dark:text-green-300 hover:underline"
                          >
                            Call this department
                          </a>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Remarks</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  {transitTemplateDetailsReferral.triage_remarks || transitTemplateDetailsReferral.triage_notes || "No remarks provided."}
                </p>
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
                  <Clock className="w-5 h-5" />
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


