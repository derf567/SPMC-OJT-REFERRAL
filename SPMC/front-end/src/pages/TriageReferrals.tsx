import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { referralsAPI } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, RefreshCw, Search, Eye, Clock, FileText, CheckCircle, MapPin, X, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransitFormDialog } from "@/components/ui/TransitFormDialog";

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
  department_name: string;
  status: "pending" | "accepted" | "rejected";
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
  assigned_departments?: string[];
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

const PatientArrivalPage = () => {
  const navigate = useNavigate();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [timelineReferral, setTimelineReferral] = useState<Referral | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const [cancelTarget, setCancelTarget] = useState<Referral | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Transit form edit state
  const [editTransitOpen, setEditTransitOpen] = useState(false);
  const [editTransitReferral, setEditTransitReferral] = useState<Referral | null>(null);

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
      const inTransitRows = rows.filter((r) => r.status === "in_transit");
      setReferrals(inTransitRows);
    } catch (error: any) {
      console.error("Error fetching patient arrival queue:", error);
      toast.error(error.message || "Failed to load patient arrival queue");
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

  const currentRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return referrals;

    return referrals.filter((r) =>
      r.referral_id.toLowerCase().includes(q) ||
      r.patient_full_name.toLowerCase().includes(q) ||
      (r.referring_hospital_name || "").toLowerCase().includes(q),
    );
  }, [referrals, search]);

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      in_transit: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      uncoordinated: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };
    const label: Record<string, string> = {
      in_transit: "In Transit",
      completed: "Completed",
      cancelled: "Cancelled",
      uncoordinated: "Cancelled",
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
    const isCancelled = referral.status === "cancelled" || referral.status === "uncoordinated";
    const isScheduleOPD = referral.status === "schedule_opd" || referral.triage_decision === "schedule_opd";
    const dispositionFinalized =
      Boolean(referral.triage_decision) ||
      (referral.assigned_departments && referral.assigned_departments.length > 0) ||
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
        completed: isCancelled ? false : (isScheduleOPD ? false : dispositionFinalized),
        date: dispositionFinalized ? referral.updated_at : null,
      },
      {
        status: "in_transit",
        label: "In Transit",
        description: "Patient is en route to SPMC",
        icon: MapPin,
        color: "orange",
        completed: isCancelled ? false : (isScheduleOPD ? false : inTransit),
        date: inTransit ? referral.updated_at : null,
      },
      {
        status: "completed",
        label: isCancelled ? "Cancelled" : "Arrival Confirmed",
        description: isCancelled
          ? "Referral has been cancelled"
          : isScheduleOPD
            ? "Scheduled for Outpatient Department"
            : "Patient has arrived and referral completed",
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

  const handleMarkComplete = async (referral: Referral) => {
    try {
      setSubmitting(true);
      await referralsAPI.markInTransitCompleted(referral.id.toString(), "Patient arrived at SPMC.");
      toast.success("Patient arrival marked as complete");
      navigate("/patients");
    } catch (error: any) {
      console.error("Error marking referral complete:", error);
      toast.error(error.message || "Failed to complete referral");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelInTransit = async () => {
    if (!cancelTarget) return;
    if (!cancellationReason.trim()) {
      toast.error("Cancellation remarks are required");
      return;
    }

    try {
      setSubmitting(true);
      await referralsAPI.markInTransitCancelled(cancelTarget.id.toString(), cancellationReason.trim());
      toast.success("Referral marked as cancelled");
      setCancelOpen(false);
      setCancelTarget(null);
      setCancellationReason("");
      navigate("/patients");
    } catch (error: any) {
      console.error("Error cancelling in-transit referral:", error);
      toast.error(error.message || "Failed to cancel referral");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditTransit = async (referral: Referral) => {
    try {
      const data = await referralsAPI.getById(referral.id.toString());
      setEditTransitReferral(data);
      setEditTransitOpen(true);
    } catch (error: any) {
      console.error("Error loading referral:", error);
      toast.error(error.message || "Failed to load referral details");
    }
  };

  const handleTransitFormSuccess = () => {
    setEditTransitOpen(false);
    setEditTransitReferral(null);
    fetchQueue(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patient Arrival</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage patients currently in transit. Complete when arrived, or cancel with remarks if not arrived.
            </p>
          </div>
          <Button variant="outline" onClick={() => fetchQueue(true)} disabled={loading || refreshing}>
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              placeholder="Search referral, patient, hospital"
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            </div>
          ) : currentRows.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
              No in-transit referrals found.
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
                  {currentRows.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{referral.referral_id}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{referral.patient_full_name}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{referral.referring_hospital_name || "N/A"}</td>
                      <td className="px-4 py-3">{statusBadge(referral.status)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(referral.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
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

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-blue-400 hover:bg-blue-700/40 hover:text-blue-100"
                            onClick={() => openEditTransit(referral)}
                            title="Edit transit form"
                            aria-label="Edit transit form"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            className="bg-green-600 text-white hover:bg-green-700"
                            disabled={submitting}
                            onClick={() => handleMarkComplete(referral)}
                          >
                            Complete
                          </Button>

                          <Button
                            size="sm"
                            className="bg-red-600 text-white hover:bg-red-700"
                            disabled={submitting}
                            onClick={() => {
                              setCancelTarget(referral);
                              setCancelOpen(true);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                  <div className="mt-1">{statusBadge(selectedReferral.status)}</div>
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
                      <div key={item.id} className="flex items-center justify-between rounded-md bg-white px-3 py-2 dark:bg-gray-800">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{item.department_name}</p>
                        <span className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300">{item.status}</span>
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

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cancel Arrival</DialogTitle>
            <DialogDescription>
              Please provide remarks for why this in-transit referral is being marked as cancelled.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{cancelTarget?.patient_full_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{cancelTarget?.referral_id}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cancellation remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                placeholder="Patient did not arrive, ambulance issue, or other remarks"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={submitting}>
                Back
              </Button>
              <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleCancelInTransit} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transit Form Edit Dialog */}
      {editTransitReferral && (
        <TransitFormDialog
          open={editTransitOpen}
          onOpenChange={setEditTransitOpen}
          referralId={editTransitReferral.id.toString()}
          patientName={editTransitReferral.patient_full_name}
          onSuccess={handleTransitFormSuccess}
          existingData={editTransitReferral.transit_info || null}
          isEditMode={true}
        />
      )}
    </DashboardLayout>
  );
};

export default PatientArrivalPage;
