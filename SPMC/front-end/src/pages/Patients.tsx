import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReferrerDashboardLayout } from "@/components/layout/ReferrerDashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { referralsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from "jspdf";
import {
  Search,
  Calendar,
  Clock,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle,
  Stethoscope,
  MoreVertical,
  Download,
} from "lucide-react";

interface ArchivedReferral {
  id: string;
  referral_id: string;
  patient_full_name: string;
  age: number;
  gender: string;
  hrn?: string;
  chief_complaint: string;
  working_impression: string;
  specialty_needed_name: string;
  referring_hospital_name: string;
  assigned_department?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_by_user?: string;
  transferred_by_user?: string;
  transferred_at?: string;
  triaged_by_user?: string;
  triaged_at?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
    case "cancelled":
    case "uncoordinated":
      return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
    case "in_transit":
      return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
    case "waiting":
      return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
    case "accepted":
      return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
    case "pending":
      return "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30";
    default:
      return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
  }
};

const getStatusDisplay = (status: string) => {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getDepartmentDisplay = (departmentCode?: string) => {
  if (!departmentCode) return 'Unassigned';
  
  const departments: Record<string, string> = {
    'emergency': 'Emergency Department',
    'internal_medicine': 'Internal Medicine',
    'surgery': 'Surgery Department',
    'obstetrics_gynecology': 'Obstetrics and Gynecology',
    'pediatrics': 'Pediatrics',
    'orthopedics': 'Orthopedics',
    'cardiology': 'Cardiology',
    'neurology': 'Neurology',
    'anesthesiology': 'Anesthesiology',
    'radiology': 'Radiology',
    'pathology': 'Pathology',
    'other': 'Other Department'
  };
  
  return departments[departmentCode] || departmentCode.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
};

const Patients = () => {
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState<ArchivedReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total_archived: 0,
    completed: 0,
    uncoordinated: 0
  });
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedReferralForTimeline, setSelectedReferralForTimeline] = useState<any>(null);
  const [openKebabId, setOpenKebabId] = useState<string | null>(null);
  const kebabRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();

  // Determine which layout to use
  const Layout = user?.role === 'referrer' ? ReferrerDashboardLayout : DashboardLayout;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) {
        setOpenKebabId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const downloadPatientPDF = async (referral: ArchivedReferral) => {
    let r: any = referral;
    try { r = await referralsAPI.getById(referral.id); } catch (_) {}
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 10;
    const colGap = 6;
    const colW = (pageW - margin * 2 - colGap) / 2;
    const labelW = 30;
    const valueW = colW - labelW - 2;
    const val = (v: any) => (v != null && v !== "" ? String(v) : "N/A");
    const sectionHeader = (title: string, x: number, y: number) => {
      doc.setFillColor(30, 64, 175);
      doc.rect(x, y, colW, 5, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255);
      doc.text(title.toUpperCase(), x + 2, y + 3.5);
      doc.setTextColor(0);
      return y + 7;
    };
    const row = (label: string, value: any, x: number, y: number) => {
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, x, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(val(value), valueW);
      const capped = lines.slice(0, 2);
      if (lines.length > 2) capped[1] = capped[1].slice(0, -3) + "...";
      doc.text(capped, x + labelW, y);
      return y + capped.length * 3.8 + 1;
    };
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.5);
    doc.rect(margin - 2, margin - 2, pageW - (margin - 2) * 2, pageH - (margin - 2) * 2);
    let y = margin + 4;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text("SPMC Patient Referral Information", pageW / 2, y, { align: "center" });
    y += 5;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}   |   Referral ID: ${r.referral_id}`, pageW / 2, y, { align: "center" });
    y += 3;
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 4;
    const leftX = margin;
    const rightX = margin + colW + colGap;
    let ly = y;
    ly = sectionHeader("Referral Details", leftX, ly);
    ly = row("Referral ID",  r.referral_id, leftX, ly);
    ly = row("Status",       r.status?.replace(/_/g, " ").toUpperCase(), leftX, ly);
    ly = row("Priority",     r.priority, leftX, ly);
    ly = row("Date Created", r.created_at ? new Date(r.created_at).toLocaleString() : null, leftX, ly);
    ly += 2;
    ly = sectionHeader("Patient Information", leftX, ly);
    ly = row("Full Name",    r.patient_full_name, leftX, ly);
    ly = row("Age / Gender", `${val(r.age)} yrs / ${val(r.gender)}`, leftX, ly);
    ly = row("Birthday",     r.birthday, leftX, ly);
    ly = row("HRN",          r.hrn, leftX, ly);
    ly = row("Address",      r.current_address, leftX, ly);
    ly = row("Category",     r.patient_category?.replace(/_/g, " "), leftX, ly);
    ly += 2;
    ly = sectionHeader("Vital Signs", leftX, ly);
    ly = row("Blood Pressure", r.bp, leftX, ly);
    ly = row("Heart Rate",   r.hr ? `${r.hr} bpm` : null, leftX, ly);
    ly = row("Resp. Rate",   r.rr ? `${r.rr} breaths/min` : null, leftX, ly);
    ly = row("Temperature",  r.temp ? `${r.temp} °C` : null, leftX, ly);
    ly = row("O2 Saturation",r.o2_sat ? `${r.o2_sat}%` : null, leftX, ly);
    ly = row("GCS Score",    r.gcs_score, leftX, ly);
    ly = row("O2 Support",   r.o2_support, leftX, ly);
    ly = row("Admission",    r.admission_status?.replace(/_/g, " "), leftX, ly);
    ly = row("RT-PCR",       r.rtpcr_result, leftX, ly);
    ly += 2;
    ly = sectionHeader("Referring Facility", leftX, ly);
    ly = row("Hospital",     r.referring_hospital_name, leftX, ly);
    ly = row("Referrer",     r.referrer_name, leftX, ly);
    ly = row("Profession",   r.referrer_profession, leftX, ly);
    ly = row("Cellphone",    r.referrer_cellphone, leftX, ly);
    ly = row("Transport",    r.mode_of_transportation, leftX, ly);
    ly = row("Specialty",    r.specialty_needed_name, leftX, ly);
    let ry = y;
    ry = sectionHeader("Clinical Information", rightX, ry);
    ry = row("Chief Complaint",    r.chief_complaint, rightX, ry);
    ry = row("Initial Impression", r.working_impression, rightX, ry);
    ry += 2;
    ry = sectionHeader("Pertinent History", rightX, ry);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text("History:", rightX, ry);
    doc.setFont("helvetica", "normal");
    const histLines = doc.splitTextToSize(val(r.pertinent_history), colW - 2).slice(0, 4);
    doc.text(histLines, rightX, ry + 4);
    ry += histLines.length * 3.8 + 6;
    ry = sectionHeader("Physical Exam", rightX, ry);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text("Findings:", rightX, ry);
    doc.setFont("helvetica", "normal");
    const examLines = doc.splitTextToSize(val(r.pertinent_physical_exam), colW - 2).slice(0, 4);
    doc.text(examLines, rightX, ry + 4);
    ry += examLines.length * 3.8 + 6;
    ry = sectionHeader("Management Done", rightX, ry);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text("Management:", rightX, ry);
    doc.setFont("helvetica", "normal");
    const mgmtLines = doc.splitTextToSize(val(r.management_done), colW - 2).slice(0, 4);
    doc.text(mgmtLines, rightX, ry + 4);
    ry += mgmtLines.length * 3.8 + 6;
    ry = sectionHeader("Reason for Referral", rightX, ry);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text("Reason:", rightX, ry);
    doc.setFont("helvetica", "normal");
    const reasonLines = doc.splitTextToSize(val(r.reason_for_referral), colW - 2).slice(0, 5);
    doc.text(reasonLines, rightX, ry + 4);
    const footerY = pageH - margin;
    doc.setDrawColor(200);
    doc.line(margin, footerY - 4, pageW - margin, footerY - 4);
    doc.setFontSize(6);
    doc.setTextColor(150);
    doc.text("Southern Philippines Medical Center — Confidential Patient Record", pageW / 2, footerY, { align: "center" });
    doc.save(`referral-${r.referral_id}-${r.patient_full_name.replace(/\s+/g, "_")}.pdf`);
    setOpenKebabId(null);
  };

  // Fetch archived referrals from API
  useEffect(() => {
    const fetchArchivedReferrals = async () => {
      try {
        setLoading(true);
        const response = await referralsAPI.getAll();
        const allReferrals = response.results || response;
        
        // Show archived referrals using current and legacy cancellation statuses
        const archivedReferrals = allReferrals.filter((r: any) => 
          r.status === 'completed' || r.status === 'cancelled' || r.status === 'uncoordinated'
        );
        
        setReferrals(archivedReferrals);
        
        // Calculate stats
        const totalArchived = archivedReferrals.length;
        const completed = archivedReferrals.filter((r: any) => r.status === 'completed').length;
        const uncoordinated = archivedReferrals.filter((r: any) => r.status === 'cancelled' || r.status === 'uncoordinated').length;
        
        setStats({
          total_archived: totalArchived,
          completed: completed,
          uncoordinated: uncoordinated
        });
        
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch archived referrals');
        console.error('Error fetching archived referrals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedReferrals();
  }, []);

  // Filter referrals based on search term
  const filteredReferrals = referrals.filter(referral =>
    referral.patient_full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (referral.hrn && referral.hrn.toLowerCase().includes(searchTerm.toLowerCase())) ||
    referral.referral_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.chief_complaint.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTimelineSteps = (referral: any) => {
    const getLatestDate = (...dates: Array<string | undefined | null>) => {
      const validDates = dates
        .filter((date): date is string => Boolean(date))
        .map((date) => ({ raw: date, ts: new Date(date).getTime() }))
        .filter((entry) => !Number.isNaN(entry.ts))
        .sort((a, b) => b.ts - a.ts);

      return validDates.length > 0 ? validDates[0].raw : null;
    };

    const status = referral?.status;
    const isCancelled = status === "cancelled" || status === "uncoordinated";
    const isCompleted = status === "completed";
    const isInTransit = status === "in_transit" || isCompleted;
    const dispositionFinalized =
      !!referral?.triage_decision ||
      !!referral?.triaged_at ||
      !!referral?.assigned_department ||
      (Array.isArray(referral?.assigned_departments) && referral.assigned_departments.length > 0);

    return [
      {
        title: "Referral Submitted",
        description: "Referral created by the referrer",
        completed: true,
        date: referral?.created_at || null,
      },
      {
        title: "Triage and Assignment",
        description: "EDCC/EDMA triage and department assignment",
        completed: isCancelled ? false : dispositionFinalized,
        date: dispositionFinalized
          ? getLatestDate(referral?.triaged_at, referral?.transferred_at, referral?.updated_at)
          : null,
      },
      {
        title: "Transit Coordination",
        description: "Transfer in progress or ongoing coordination",
        completed: isCancelled ? false : isInTransit,
        date: isInTransit ? referral?.updated_at : null,
      },
      {
        title: isCancelled ? "Referral Cancelled" : "Referral Completed",
        description: isCancelled
          ? "Referral was not coordinated or was cancelled"
          : "Referral process completed",
        completed: isCompleted || isCancelled,
        date: (isCompleted || isCancelled) ? referral?.updated_at : null,
      },
    ];
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading archived referrals...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-red-500 mb-2">Error loading archived referrals</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Archived Referrals</h1>
          <p className="text-gray-500 dark:text-gray-400">
            View completed and cancelled referrals
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400 mb-1">Total Archived</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total_archived}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-gray-800 border border-green-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-1">Completed</h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-1">Uncoordinated</h3>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.uncoordinated}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Archived Referrals List */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-300">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient name, HRN, referral ID, or complaint..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Badge variant="outline" className="text-xs">
                {filteredReferrals.length} referral{filteredReferrals.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
          
          <div className="p-6">
            {filteredReferrals.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'No archived referrals found' : 'No archived referrals yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm 
                    ? 'Try adjusting your search terms' 
                    : 'Archived referrals will appear here when referrals are completed or cancelled'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReferrals.map((referral) => (
                  <div 
                    key={referral.id} 
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/referral/view/${referral.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/referral/view/${referral.id}`);
                      }
                    }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                    title="Open full referral details"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {referral.patient_full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {referral.patient_full_name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {referral.referral_id} • {referral.age} yrs • {referral.gender}
                              {referral.hrn && ` • HRN: ${referral.hrn}`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-sm">
                          <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                            <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{referral.chief_complaint}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Stethoscope className="w-4 h-4 flex-shrink-0" />
                            <span>{getDepartmentDisplay(referral.assigned_department)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{referral.referring_hospital_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{new Date(referral.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(referral.status)}`}>
                            {getStatusDisplay(referral.status)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReferralForTimeline(referral);
                              setTimelineModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/35"
                            title="Timeline"
                          >
                            <Clock className="w-3 h-3" />
                            Timeline
                          </button>
                          {(referral.status === 'cancelled' || referral.status === 'uncoordinated') && referral.cancellation_reason && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                              Reason: {referral.cancellation_reason}
                            </span>
                          )}

                          {/* Kebab menu */}
                          <div className="relative" ref={openKebabId === referral.id ? kebabRef : null}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenKebabId(openKebabId === referral.id ? null : referral.id);
                              }}
                              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {openKebabId === referral.id && (
                              <div className="absolute left-0 top-8 z-50 min-w-[160px] rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                <button
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadPatientPDF(referral);
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                  Download Patient Info
                                </button>
                              </div>
                            )}
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

      <Dialog open={timelineModalOpen} onOpenChange={setTimelineModalOpen}>
        <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Referral Timeline</DialogTitle>
            <DialogDescription className="text-gray-300">
              Track the current progress of this referral.
            </DialogDescription>
          </DialogHeader>

          {selectedReferralForTimeline && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {selectedReferralForTimeline.patient_full_name}
                </h3>
                <p className="text-sm text-gray-400">
                  ID: {selectedReferralForTimeline.referral_id}
                </p>
              </div>

              <div className="space-y-3">
                {getTimelineSteps(selectedReferralForTimeline).map((step, index, steps) => {
                  const isCompleted = step.completed;
                  const isLast = index === steps.length - 1;

                  return (
                    <div key={step.title} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-5 h-5 rounded-full border-2 ${isCompleted ? 'bg-green-500 border-green-500' : 'bg-gray-700 border-gray-600'}`} />
                        {!isLast && (
                          <div className={`w-0.5 h-8 ${isCompleted ? 'bg-green-500' : 'bg-gray-700'}`} />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <h4 className={`font-semibold ${isCompleted ? 'text-white' : 'text-gray-500'}`}>
                          {step.title}
                        </h4>
                        <p className={`text-sm ${isCompleted ? 'text-gray-300' : 'text-gray-500'}`}>
                          {step.description}
                        </p>
                        {step.date && (
                          <p className="text-xs text-gray-400 mt-1">
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
    </Layout>
  );
};

export default Patients;
