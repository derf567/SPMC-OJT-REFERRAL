import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { referralsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, RefreshCw, Search, Eye, Send, XCircle, Clock, FileText, CheckCircle, MapPin, X, Bell, MoreVertical, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import jsPDF from "jspdf";

type SectionKey = "endorsements" | "transit";
type EndorsementStatusFilter =
  | "all"
  | "waiting_acceptance"
  | "awaiting_triage_verification"
  | "dispositioned";
type TransitStatusFilter =
  | "all"
  | "awaiting_transit_template_submission"
  | "delayed"
  | "in_transit";

interface TransitInfo {
  watcher_name: string;
  watcher_age: number;
  relation_to_patient: string;
  contact_number: string;
  escort_nurse?: string;
  driver?: string;
  remarks?: string;
}

interface DepartmentAcceptance {
  id: number;
  department_code?: string;
  department_name: string;
  status: "pending" | "accepted" | "rejected";
  accepted_by_name?: string;
  accepted_at?: string;
  notes?: string;
  is_main_service?: boolean;
}

interface Referral {
  id: number;
  referral_id: string;
  patient_full_name: string;
  age?: number;
  gender?: string;
  status: string;
  chief_complaint?: string;
  specialty_needed_name?: string;
  referring_hospital_name?: string;
  created_at: string;
  updated_at?: string;
  triage_decision?: string;
  triage_remarks?: string;
  main_service_code?: string;
  assigned_department?: string;
  assigned_departments?: string[];
  delay_notified_at?: string;
  delay_reason?: string;
  triage_verified_by_name?: string;
  triage_verified_at?: string;
  triage_verification_notes?: string;
  transit_info?: TransitInfo;
  department_acceptances?: DepartmentAcceptance[];
}

interface TimelineStep {
  status: string;
  label: string;
  description: string;
  icon: any;
  color: "green" | "blue" | "cyan" | "orange" | "red";
  completed: boolean;
  date?: string | null;
}

const ENDORSEMENT_STATUSES = new Set([
  "waiting_acceptance",
  "awaiting_triage_verification",
  "dispositioned",
]);

const TRANSIT_STATUSES = new Set([
  "dispositioned",
  "in_transit",
]);

const DEPARTMENT_BADGE_MAP: Record<string, string> = {
  emergency: "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800/60",
  internal_medicine: "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800/60",
  surgery: "bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-800/60",
  obstetrics_gynecology: "bg-pink-100 text-pink-800 border border-pink-200 dark:bg-pink-900/40 dark:text-pink-200 dark:border-pink-800/60",
  pediatrics: "bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-800/60",
  orthopedics: "bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800/60",
  cardiology: "bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-800/60",
  neurology: "bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-800/60",
  anesthesiology: "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800/60",
  radiology: "bg-cyan-100 text-cyan-800 border border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-200 dark:border-cyan-800/60",
  pathology: "bg-violet-100 text-violet-800 border border-violet-200 dark:bg-violet-900/40 dark:text-violet-200 dark:border-violet-800/60",
};

const TriageReferrals = () => {
  const { user } = useAuth();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>("endorsements");
  const [search, setSearch] = useState("");
  const [endorsementStatusFilter, setEndorsementStatusFilter] = useState<EndorsementStatusFilter>("all");
  const [transitStatusFilter, setTransitStatusFilter] = useState<TransitStatusFilter>("all");

  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [timelineReferral, setTimelineReferral] = useState<Referral | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const [sendTemplateTarget, setSendTemplateTarget] = useState<Referral | null>(null);
  const [sendTemplateOpen, setSendTemplateOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");

  const [cancelTarget, setCancelTarget] = useState<Referral | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [notifyTarget, setNotifyTarget] = useState<Referral | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyRemarks, setNotifyRemarks] = useState("");
  const [cancelReferralTarget, setCancelReferralTarget] = useState<Referral | null>(null);
  const [cancelReferralOpen, setCancelReferralOpen] = useState(false);
  const [cancelReferralReason, setCancelReferralReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openKebabId, setOpenKebabId] = useState<string | null>(null);
  const kebabRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) {
        setOpenKebabId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const downloadPatientPDF = async (referral: Referral, statusLabel: string) => {
    let r: any = referral;
    try { r = await referralsAPI.getById(referral.id.toString()); } catch (_) {}
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
    ly = row("Status",       statusLabel, leftX, ly);
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

  const canSendTransitTemplate = Boolean(
    user?.permissions?.can_triage_referrals || user?.permissions?.can_transfer_referrals,
  );

  const canCancelInTransit = Boolean(
    user?.permissions?.can_triage_referrals || user?.permissions?.can_transfer_referrals,
  );
  const canNotifyReendorsement = canSendTransitTemplate;
  const canCancelReferral = canSendTransitTemplate;

  const normalizeResponse = (response: any): Referral[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  };

  const fetchQueue = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await referralsAPI.getAll();
      const rows = normalizeResponse(response);
      setReferrals(rows);
    } catch (error: any) {
      console.error("Error fetching endorsement/transit queue:", error);
      toast.error(error.message || "Failed to load endorsement/transit queue");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(() => fetchQueue(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const isScheduleOpdCase = (referral: Referral) =>
    referral.triage_decision === "schedule_opd" || referral.status === "schedule_opd";

  const endorsements = useMemo(() => {
    return referrals.filter((r) => ENDORSEMENT_STATUSES.has(r.status) && !isScheduleOpdCase(r));
  }, [referrals]);

  const transit = useMemo(() => {
    return referrals.filter((r) => TRANSIT_STATUSES.has(r.status) && !isScheduleOpdCase(r));
  }, [referrals]);

  const getDisplayStatus = (referral: Referral, section: SectionKey) => {
    if (section === "transit") {
      if (referral.status === "in_transit") return "in_transit";
      if (referral.status === "dispositioned" && referral.delay_notified_at) return "delayed";
      if (referral.status === "dispositioned") return "awaiting_transit_template_submission";
    }
    return referral.status;
  };

  const currentRows = useMemo(() => {
    const source = activeSection === "endorsements" ? endorsements : transit;
    const byStatus = source.filter((r) => {
      if (activeSection === "endorsements") {
        return endorsementStatusFilter === "all" || r.status === endorsementStatusFilter;
      }
      const displayStatus = getDisplayStatus(r, "transit");
      return transitStatusFilter === "all" || displayStatus === transitStatusFilter;
    });

    const q = search.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter((r) =>
      r.referral_id.toLowerCase().includes(q) ||
      r.patient_full_name.toLowerCase().includes(q) ||
      (r.referring_hospital_name || "").toLowerCase().includes(q),
    );
  }, [
    activeSection,
    endorsements,
    transit,
    search,
    endorsementStatusFilter,
    transitStatusFilter,
  ]);

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  const formatReadable = (value?: string) => {
    if (!value) return "N/A";
    return value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatTriageCall = (decision?: string) => {
    if (!decision) return "N/A";
    const triageCallLabels: Record<string, string> = {
      emergent: "Emergent",
      urgent: "Urgent",
      schedule_opd: "Schedule OPD",
    };
    return triageCallLabels[decision] || formatReadable(decision);
  };

  const formatDepartmentCode = (code?: string) => {
    if (!code) return "N/A";

    const matched = selectedReferral?.department_acceptances?.find(
      (item) => item.department_code === code || item.department_name.toLowerCase().replace(/\s+/g, "_") === code,
    );
    if (matched?.department_name) return matched.department_name;

    return formatReadable(code);
  };

  const getMainServiceCode = (referral: Referral) => referral.main_service_code || referral.assigned_department;

  const getCoManageCodes = (referral: Referral) =>
    (referral.assigned_departments || []).filter((code) => code !== getMainServiceCode(referral));

  const getAcceptedDepartments = (referral: Referral) =>
    (referral.department_acceptances || []).filter((item) => item.status === "accepted");

  const getTriageCallBadgeClass = (decision?: string) => {
    if (decision === "emergent") {
      return "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800/60";
    }
    if (decision === "urgent") {
      return "bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800/60";
    }
    if (decision === "schedule_opd") {
      return "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800/60";
    }
    return "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
  };

  const getDepartmentBadgeClass = (code?: string) => {
    if (!code) {
      return "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
    }
    return DEPARTMENT_BADGE_MAP[code] || "bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700";
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      waiting_acceptance: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      awaiting_triage_verification: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      dispositioned: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      in_transit: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
      delayed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      awaiting_transit_template_submission: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    };
    const label: Record<string, string> = {
      waiting_acceptance: "Assigned / Waiting Acceptance",
      awaiting_triage_verification: "Ready to send Transit Template",
      dispositioned: "Disposition Finalized",
      in_transit: "In Transit",
      delayed: "Delayed",
      awaiting_transit_template_submission: "Awaiting transit template submission",
    };

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] || "bg-gray-100 text-gray-700"}`}>
        {label[status] || status}
      </span>
    );
  };

  const openDetails = async (referral: Referral) => {
    try {
      const data = await referralsAPI.getById(referral.id.toString());
      setSelectedReferral(data);
      setDetailsOpen(true);
    } catch (error: any) {
      console.error("Error loading details:", error);
      toast.error(error.message || "Failed to load referral details");
    }
  };

  const openTimeline = async (referral: Referral) => {
    try {
      const data = await referralsAPI.getById(referral.id.toString());
      setTimelineReferral(data);
      setTimelineOpen(true);
    } catch (error: any) {
      console.error("Error loading timeline:", error);
      toast.error(error.message || "Failed to load timeline");
    }
  };

  const getTimelineSteps = (referral: Referral): TimelineStep[] => {
    const isCancelled = referral.status === "cancelled";
    const isScheduleOPD = referral.status === "schedule_opd" || referral.triage_decision === "schedule_opd";
    const dispositionFinalized =
      Boolean(referral.triage_decision) ||
      (referral.assigned_departments && referral.assigned_departments.length > 0) ||
      referral.status === "waiting_acceptance" ||
      referral.status === "awaiting_triage_verification" ||
      referral.status === "dispositioned" ||
      referral.status === "in_transit";

    const endorsementComplete =
      referral.status === "awaiting_triage_verification" ||
      referral.status === "dispositioned" ||
      referral.status === "in_transit" ||
      referral.status === "completed";

    const inTransit = referral.status === "in_transit" || referral.status === "completed";
    const isCompleted = referral.status === "completed" || isScheduleOPD;

    return [
      {
        status: "pending",
        label: "Request Submitted",
        description: "Referral request submitted",
        icon: FileText,
        color: "green",
        completed: true,
        date: referral.created_at,
      },
      {
        status: "disposition_finalized",
        label: "Disposition Finalized",
        description: "EDCC/EDMA assigned departments",
        icon: Clock,
        color: "blue",
        completed: isCancelled ? false : dispositionFinalized,
        date: referral.updated_at,
      },
      {
        status: "endorsement_complete",
        label: "Endorsement Complete",
        description: "Main Service accepted referral",
        icon: CheckCircle,
        color: "cyan",
        completed: isCancelled ? false : (isScheduleOPD ? false : endorsementComplete),
        date: endorsementComplete ? referral.updated_at : null,
      },
      {
        status: "in_transit",
        label: "In Transit",
        description: "Transit template submitted and patient in transport",
        icon: MapPin,
        color: "orange",
        completed: isCancelled ? false : (isScheduleOPD ? false : inTransit),
        date: inTransit ? referral.updated_at : null,
      },
      {
        status: "completed",
        label: isCancelled ? "Cancelled" : "Complete",
        description: isCancelled
          ? "Referral has been cancelled"
          : isScheduleOPD
            ? "Scheduled for Outpatient Department"
            : "Referral process completed",
        icon: isCancelled ? X : CheckCircle,
        color: isCancelled ? "red" : "green",
        completed: isCompleted || isCancelled,
        date: isCompleted || isCancelled ? referral.updated_at : null,
      },
    ];
  };

  const getTimelineColors = (step: TimelineStep) => {
    if (!step.completed) {
      return {
        bg: "bg-gray-200 dark:bg-gray-700",
        border: "border-gray-300 dark:border-gray-600",
        icon: "text-gray-400 dark:text-gray-500",
      };
    }

    const colorMap: Record<string, { bg: string; border: string; icon: string }> = {
      green: { bg: "bg-green-500", border: "border-green-200", icon: "text-white" },
      blue: { bg: "bg-blue-500", border: "border-blue-200", icon: "text-white" },
      cyan: { bg: "bg-cyan-500", border: "border-cyan-200", icon: "text-white" },
      orange: { bg: "bg-orange-500", border: "border-orange-200", icon: "text-white" },
      red: { bg: "bg-red-500", border: "border-red-200", icon: "text-white" },
    };

    return colorMap[step.color];
  };

  const handleSendTransitTemplate = async () => {
    if (!sendTemplateTarget) return;
    try {
      setSubmitting(true);
      await referralsAPI.approveForTransit(sendTemplateTarget.id.toString(), verificationNotes);
      toast.success("Transit template sent to referrer");
      setSendTemplateOpen(false);
      setSendTemplateTarget(null);
      setVerificationNotes("");
      fetchQueue(true);
    } catch (error: any) {
      console.error("Error sending transit template:", error);
      toast.error(error.message || "Failed to send transit template");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelInTransit = async () => {
    if (!cancelTarget) return;
    if (!cancellationReason.trim()) {
      toast.error("Cancellation reason is required");
      return;
    }

    try {
      setSubmitting(true);
      await referralsAPI.markInTransitCancelled(cancelTarget.id.toString(), cancellationReason);
      toast.success("In-transit referral cancelled");
      setCancelOpen(false);
      setCancelTarget(null);
      setCancellationReason("");
      fetchQueue(true);
    } catch (error: any) {
      console.error("Error cancelling in-transit referral:", error);
      toast.error(error.message || "Failed to cancel in-transit referral");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotifyReendorsement = async () => {
    if (!notifyTarget) return;

    const notes = notifyRemarks.trim()
      ? `Reendorsement notified. Remarks: ${notifyRemarks.trim()}`
      : "Reendorsement notified.";

    try {
      setSubmitting(true);
      await referralsAPI.updateStatus(notifyTarget.id.toString(), notifyTarget.status, notes);
      toast.success("Reendorsement has been notified");
      setNotifyOpen(false);
      setNotifyTarget(null);
      setNotifyRemarks("");
      fetchQueue(true);
    } catch (error: any) {
      console.error("Error notifying reendorsement:", error);
      toast.error(error.message || "Failed to notify reendorsement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReferral = async () => {
    if (!cancelReferralTarget) return;
    if (!cancelReferralReason.trim()) {
      toast.error("Cancellation reason is required");
      return;
    }

    try {
      setSubmitting(true);
      await referralsAPI.cancelReferral(cancelReferralTarget.id.toString(), cancelReferralReason);
      toast.success("Referral cancelled successfully");
      setCancelReferralOpen(false);
      setCancelReferralTarget(null);
      setCancelReferralReason("");
      fetchQueue(true);
    } catch (error: any) {
      console.error("Error cancelling referral:", error);
      toast.error(error.message || "Failed to cancel referral");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Endorsement and Transit</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Two sections: Endorsements for assigned/triage-called referrals, and Transit for referrals with transit template workflow.
            </p>
          </div>
          <Button variant="outline" onClick={() => fetchQueue(true)} disabled={loading || refreshing}>
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-900/20">
            <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300">Endorsements Queue</p>
            <p className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-100">{endorsements.length}</p>
          </div>
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800/50 dark:bg-indigo-900/20">
            <p className="text-xs uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Transit Queue</p>
            <p className="mt-1 text-2xl font-bold text-indigo-900 dark:text-indigo-100">{transit.length}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-900/20">
            <p className="text-xs uppercase tracking-wide text-red-700 dark:text-red-300">Delayed Transfers</p>
            <p className="mt-1 text-2xl font-bold text-red-900 dark:text-red-100">
              {transit.filter((ref) => Boolean(ref.delay_notified_at)).length}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveSection("endorsements")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeSection === "endorsements"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Endorsements ({endorsements.length})
              </button>
              <button
                onClick={() => setActiveSection("transit")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeSection === "transit"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Transit ({transit.length})
              </button>
            </div>

            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
              <div className="flex flex-wrap gap-2">
                {activeSection === "endorsements" ? (
                  <>
                    {[
                      { value: "all", label: "All statuses" },
                      { value: "waiting_acceptance", label: "Assigned / Waiting Acceptance" },
                      { value: "awaiting_triage_verification", label: "Ready to send Transit Template" },
                      { value: "dispositioned", label: "Disposition Finalized" },
                    ].map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setEndorsementStatusFilter(item.value as EndorsementStatusFilter)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          endorsementStatusFilter === item.value
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      { value: "all", label: "All statuses" },
                      { value: "awaiting_transit_template_submission", label: "Awaiting template submission" },
                      { value: "delayed", label: "Delayed" },
                      { value: "in_transit", label: "In Transit" },
                    ].map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setTransitStatusFilter(item.value as TransitStatusFilter)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          transitStatusFilter === item.value
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </>
                )}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  placeholder="Search referral, patient, hospital"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            </div>
          ) : currentRows.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
              No referrals found for this section.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Referral</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Patient</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Hospital</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Updated</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currentRows.map((referral) => {
                    const displayStatus = getDisplayStatus(referral, activeSection);
                    return (
                    <tr key={referral.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{referral.referral_id}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatTriageCall(referral.triage_decision)}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{referral.patient_full_name}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {getMainServiceCode(referral) && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                              Main: {formatDepartmentCode(getMainServiceCode(referral))}
                            </span>
                          )}
                          {getCoManageCodes(referral).slice(0, 2).map((code) => (
                            <span
                              key={`${referral.id}-cm-${code}`}
                              className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-800 dark:bg-purple-900/40 dark:text-purple-200"
                            >
                              Co-Manage: {formatDepartmentCode(code)}
                            </span>
                          ))}
                          {getCoManageCodes(referral).length > 2 && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                              +{getCoManageCodes(referral).length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{referral.referring_hospital_name || "N/A"}</td>
                      <td className="px-4 py-3">{statusBadge(displayStatus)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(referral.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 border-slate-300 bg-white/70 px-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-700/60"
                            onClick={() => openDetails(referral)}
                            title="Details"
                            aria-label="Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Details
                          </Button>
                          {activeSection === "endorsements" && referral.status === "awaiting_triage_verification" && canSendTransitTemplate && (
                            <Button
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700"
                              onClick={() => {
                                setSendTemplateTarget(referral);
                                setSendTemplateOpen(true);
                              }}
                            >
                              <Send className="mr-1 h-4 w-4" />
                              Send Template
                            </Button>
                          )}

                          {activeSection === "endorsements" && referral.status === "dispositioned" && (
                            <span className="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                              Template Sent
                            </span>
                          )}

                          {activeSection === "transit" && referral.status === "in_transit" && canCancelInTransit && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                              onClick={() => {
                                setCancelTarget(referral);
                                setCancelOpen(true);
                              }}
                              title="Cancel in-transit"
                              aria-label="Cancel in-transit"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}

                          {activeSection === "transit" && displayStatus === "delayed" && canNotifyReendorsement && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-amber-400 hover:bg-amber-900/20 hover:text-amber-300"
                              onClick={() => {
                                setNotifyTarget(referral);
                                setNotifyOpen(true);
                              }}
                              title="Notify reendorsement"
                              aria-label="Notify reendorsement"
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 border-blue-200 bg-blue-50 px-2 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/35"
                            onClick={() => openTimeline(referral)}
                            title="Timeline"
                            aria-label="Timeline"
                          >
                            <Clock className="h-3.5 w-3.5" />
                            Timeline
                          </Button>

                          {canCancelReferral && referral.status !== "cancelled" && referral.status !== "completed" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                              onClick={() => {
                                setCancelReferralTarget(referral);
                                setCancelReferralOpen(true);
                              }}
                              title="Cancel referral"
                              aria-label="Cancel referral"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Kebab menu */}
                          <div className="relative" ref={openKebabId === referral.referral_id ? kebabRef : null}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenKebabId(openKebabId === referral.referral_id ? null : referral.referral_id);
                              }}
                              title="More options"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                            {openKebabId === referral.referral_id && (
                              <div className="absolute right-0 top-9 z-50 min-w-[160px] rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                <button
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                                  onClick={() => {
                                    const statusLabel = (() => {
                                      const ds = getDisplayStatus(referral, activeSection);
                                      const labels: Record<string, string> = {
                                        waiting_acceptance: "Waiting Acceptance",
                                        awaiting_triage_verification: "Ready for Transit Template",
                                        dispositioned: "Disposition Finalized",
                                        in_transit: "In Transit",
                                        delayed: "Delayed",
                                        awaiting_transit_template_submission: "Awaiting Transit Template",
                                      };
                                      return labels[ds] || ds.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                                    })();
                                    downloadPatientPDF(referral, statusLabel);
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                  Download Patient Info
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Referral Details</DialogTitle>
            <DialogDescription>
              {selectedReferral?.referral_id} - {selectedReferral?.patient_full_name}
            </DialogDescription>
          </DialogHeader>

          {selectedReferral && (
            <div className="space-y-5 text-sm">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Status</p>
                  <div className="mt-1">{statusBadge(getDisplayStatus(selectedReferral, activeSection))}</div>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Updated</p>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">{formatDate(selectedReferral.updated_at)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Specialty</p>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">{selectedReferral.specialty_needed_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Referring Hospital</p>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">{selectedReferral.referring_hospital_name || "N/A"}</p>
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-900/20">
                <p className="mb-3 font-semibold text-blue-700 dark:text-blue-300">Endorsement Assignment Details</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Triage Call</p>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getTriageCallBadgeClass(
                          selectedReferral.triage_decision,
                        )}`}
                      >
                        {formatTriageCall(selectedReferral.triage_decision)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Assigned Main Service</p>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getDepartmentBadgeClass(
                          getMainServiceCode(selectedReferral),
                        )}`}
                      >
                        {formatDepartmentCode(getMainServiceCode(selectedReferral))}
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500 dark:text-gray-400">
                      Assigned Co-Manage Departments ({getCoManageCodes(selectedReferral).length})
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {getCoManageCodes(selectedReferral).map((code) => (
                          <span
                            key={code}
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getDepartmentBadgeClass(code)}`}
                          >
                            {formatDepartmentCode(code)}
                          </span>
                        ))}
                      {getCoManageCodes(selectedReferral).length === 0 && (
                        <span className="text-gray-600 dark:text-gray-300">None</span>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500 dark:text-gray-400">Accepted Departments</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {getAcceptedDepartments(selectedReferral).map((item) => (
                          <span
                            key={`accepted-${item.id}`}
                            className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300"
                          >
                            {item.department_name}
                          </span>
                        ))}
                      {getAcceptedDepartments(selectedReferral).length === 0 && (
                        <span className="text-gray-600 dark:text-gray-300">None yet</span>
                      )}
                    </div>
                  </div>
                </div>
                {selectedReferral.triage_remarks && (
                  <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-700/50 dark:bg-yellow-900/20">
                    <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700 dark:text-yellow-300 mb-1">Remarks</p>
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{selectedReferral.triage_remarks}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">Chief Complaint</p>
                <p className="mt-1 text-gray-900 dark:text-gray-100">{selectedReferral.chief_complaint || "N/A"}</p>
              </div>

              {selectedReferral.triage_verification_notes && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800/50 dark:bg-orange-900/20">
                  <p className="font-semibold text-orange-700 dark:text-orange-300">Triage Verification Notes</p>
                  <p className="mt-2 text-gray-800 dark:text-gray-200">{selectedReferral.triage_verification_notes}</p>
                </div>
              )}

              {selectedReferral.transit_info && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-900/20">
                  <p className="font-semibold text-blue-700 dark:text-blue-300">Transit Information</p>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <p className="text-gray-800 dark:text-gray-200">Watcher: {selectedReferral.transit_info.watcher_name}</p>
                    <p className="text-gray-800 dark:text-gray-200">Age: {selectedReferral.transit_info.watcher_age}</p>
                    <p className="text-gray-800 dark:text-gray-200">Relation: {selectedReferral.transit_info.relation_to_patient}</p>
                    <p className="text-gray-800 dark:text-gray-200">Contact: {selectedReferral.transit_info.contact_number}</p>
                    {selectedReferral.transit_info.escort_nurse && (
                      <p className="text-gray-800 dark:text-gray-200">Escort Nurse: {selectedReferral.transit_info.escort_nurse}</p>
                    )}
                    {selectedReferral.transit_info.driver && (
                      <p className="text-gray-800 dark:text-gray-200">Driver: {selectedReferral.transit_info.driver}</p>
                    )}
                  </div>
                  {selectedReferral.transit_info.remarks && (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-700/50 dark:bg-amber-900/20">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 mb-1">Transit Remarks</p>
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{selectedReferral.transit_info.remarks}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedReferral.department_acceptances && selectedReferral.department_acceptances.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
                  <p className="mb-3 font-semibold text-gray-800 dark:text-gray-200">Department Decisions</p>
                  <div className="space-y-2">
                    {selectedReferral.department_acceptances.map((item) => (
                      <div key={item.id} className="rounded-md bg-white px-3 py-2 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{item.department_name}</p>
                          <span className={`text-xs uppercase tracking-wide font-semibold ${
                            item.status === 'accepted' ? 'text-green-600 dark:text-green-400' :
                            item.status === 'rejected' ? 'text-red-600 dark:text-red-400' :
                            'text-gray-500 dark:text-gray-400'
                          }`}>{item.status}</span>
                        </div>
                        {item.notes && (
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 italic border-t border-gray-100 dark:border-gray-700 pt-1">
                            Notes: {item.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={timelineOpen} onOpenChange={setTimelineOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Referral Timeline</DialogTitle>
            <DialogDescription>
              Track progress of referral {timelineReferral?.referral_id}
            </DialogDescription>
          </DialogHeader>

          {timelineReferral && (
            <div className="space-y-6">
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Patient:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{timelineReferral.patient_full_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Age/Gender:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {timelineReferral.age || "N/A"} yrs, {timelineReferral.gender || "N/A"}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-500 dark:text-gray-400">Chief Complaint:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{timelineReferral.chief_complaint || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                {getTimelineSteps(timelineReferral).map((step, index) => {
                  const IconComponent = step.icon;
                  const steps = getTimelineSteps(timelineReferral);
                  const currentPendingIndex = steps.findIndex((s) => !s.completed);
                  const isLast = index === steps.length - 1;
                  const colors = getTimelineColors(step);

                  return (
                    <div key={step.status} className="relative flex gap-4 pb-8">
                      {!isLast && (
                        <div className={`absolute left-6 top-12 h-full w-0.5 ${step.completed ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"}`} />
                      )}

                      <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 ${colors.bg} ${colors.border}`}>
                        <IconComponent className={`h-5 w-5 ${colors.icon}`} />
                      </div>

                      <div className="flex-1 pt-1">
                        <h4 className={`font-semibold ${step.completed ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                          {step.label}
                        </h4>
                        <p className={`text-sm ${step.completed ? "text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-400"}`}>
                          {step.description}
                        </p>
                        <div className="mt-2">
                          {step.completed ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/20 px-2 py-0.5 text-xs text-green-700 dark:text-green-300">
                              <CheckCircle className="h-3 w-3" />
                              Completed
                            </span>
                          ) : index === currentPendingIndex ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-700 dark:text-yellow-300">
                              <Clock className="h-3 w-3" />
                              In Progress
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-gray-400/30 bg-gray-200/70 px-2 py-0.5 text-xs text-gray-600 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
                              <Clock className="h-3 w-3" />
                              Pending
                            </span>
                          )}
                        </div>
                        {step.date && step.completed && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{new Date(step.date).toLocaleString()}</p>
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

      <Dialog open={cancelReferralOpen} onOpenChange={setCancelReferralOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cancel Referral</DialogTitle>
            <DialogDescription>
              This cancels the referral and will remove it from active endorsement/transit workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{cancelReferralTarget?.patient_full_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{cancelReferralTarget?.referral_id}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cancellation reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReferralReason}
                onChange={(e) => setCancelReferralReason(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                placeholder="Reason for cancellation"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelReferralOpen(false)} disabled={submitting}>
                Keep Referral
              </Button>
              <Button variant="destructive" onClick={handleCancelReferral} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Cancel Referral
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={sendTemplateOpen} onOpenChange={setSendTemplateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Transit Template</DialogTitle>
            <DialogDescription>
              This will finalize disposition and notify the referrer to complete the transit template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{sendTemplateTarget?.patient_full_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{sendTemplateTarget?.referral_id}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Verification notes (optional)</label>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                placeholder="Add notes before sending"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSendTemplateOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSendTransitTemplate} disabled={submitting} className="bg-orange-600 hover:bg-orange-700">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Transit Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cancel In-Transit Referral</DialogTitle>
            <DialogDescription>EDCC/EDMA can cancel referrals currently in transit status.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{cancelTarget?.patient_full_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{cancelTarget?.referral_id}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cancellation reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                placeholder="State why this referral must be cancelled"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={submitting}>
                Keep Referral
              </Button>
              <Button variant="destructive" onClick={handleCancelInTransit} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Notify Reendorsement</DialogTitle>
            <DialogDescription>
              This delayed referral will be flagged for reendorsement follow-up.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notifyTarget?.patient_full_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{notifyTarget?.referral_id}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Remarks (for delay/reendorsement)
              </label>
              <textarea
                value={notifyRemarks}
                onChange={(e) => setNotifyRemarks(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                placeholder="Add remarks before notifying reendorsement"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNotifyOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleNotifyReendorsement} disabled={submitting} className="bg-red-600 hover:bg-red-700">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Notify Reendorsement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TriageReferrals;
