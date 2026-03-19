import { useEffect, useMemo, useState } from "react";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Check, X, Clock, Building2, Mail, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminAPI } from "@/lib/api";
import { toast } from "sonner";

interface PendingDoctor {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  department: string;
  department_display: string;
  created_at: string;
  is_active: boolean;
  approval_status: string;
  spmc_id?: string;
  spmc_id_file?: string | null;
}

const REFRESH_MS = 15000;

const AccountApproval = () => {
  const [allDoctors, setAllDoctors] = useState<PendingDoctor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<PendingDoctor | null>(null);

  const fetchDoctors = async (showError = true) => {
    try {
      if (loading) setLoading(true);
      const doctorsData = await adminAPI.getPendingDoctors();
      setAllDoctors(Array.isArray(doctorsData) ? doctorsData : []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      if (showError) {
        toast.error(`Failed to load doctors: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => fetchDoctors(false), REFRESH_MS);
    const onFocus = () => fetchDoctors(false);
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchDoctors(false);
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const filteredDoctors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allDoctors.filter((doctor) => {
      const statusMatch = statusFilter === "all" || doctor.approval_status === statusFilter;
      if (!statusMatch) return false;
      if (!q) return true;
      return (
        doctor.first_name.toLowerCase().includes(q) ||
        doctor.last_name.toLowerCase().includes(q) ||
        doctor.email.toLowerCase().includes(q) ||
        doctor.username.toLowerCase().includes(q)
      );
    });
  }, [allDoctors, searchTerm, statusFilter]);

  const handleApproveDoctor = async (id: number) => {
    if (!confirm("Are you sure you want to approve this doctor account?")) return;
    try {
      setActionLoading(true);
      await adminAPI.approveDoctor(id);
      toast.success("Doctor account approved successfully");
      await fetchDoctors(false);
      setSelectedDoctor(null);
    } catch (error) {
      console.error("Error approving doctor account:", error);
      toast.error("Failed to approve doctor account");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDoctor = async (id: number) => {
    if (!confirm("Are you sure you want to reject this doctor account?")) return;
    try {
      setActionLoading(true);
      await adminAPI.rejectDoctor(id);
      toast.success("Doctor account rejected successfully");
      await fetchDoctors(false);
      setSelectedDoctor(null);
    } catch (error) {
      console.error("Error rejecting doctor account:", error);
      toast.error("Failed to reject doctor account");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-orange-500/20 text-orange-600 border-orange-500/30" },
      approved: { label: "Approved", className: "bg-green-500/20 text-green-600 border-green-500/30" },
      rejected: { label: "Rejected", className: "bg-red-500/20 text-red-600 border-red-500/30" },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={`${config.className} border`}>{config.label}</Badge>;
  };

  const isImageFile = (url?: string | null) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
  };

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Doctor Account Approval</h1>
          <p className="text-gray-500 dark:text-gray-400">Review and manage doctor registrations</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, username, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="pending">Pending</option>
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredDoctors.length} of {allDoctors.length} doctor accounts
        </div>

        <div className="space-y-4">
          {filteredDoctors.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No doctor accounts found</p>
            </div>
          ) : (
            filteredDoctors.map((doctor) => {
              const initials = `${doctor.first_name?.[0] || ""}${doctor.last_name?.[0] || ""}`.toUpperCase() || "DR";
              return (
                <div
                  key={`doctor-${doctor.id}`}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
                        {initials}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{doctor.full_name}</h3>
                          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 border">Doctor</Badge>
                          {getStatusBadge(doctor.approval_status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span>{doctor.department_display || doctor.department || "-"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{doctor.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Submitted {formatDate(doctor.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedDoctor(doctor)}>
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      {doctor.approval_status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApproveDoctor(doctor.id)}
                            disabled={actionLoading}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectDoctor(doctor.id)}
                            disabled={actionLoading}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Doctor Account Details</DialogTitle>
              <DialogDescription>Review complete information for this doctor account</DialogDescription>
            </DialogHeader>

            {selectedDoctor && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Full Name:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedDoctor.full_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Department:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedDoctor.department_display || selectedDoctor.department || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">SPMC ID:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedDoctor.spmc_id || "-"}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedDoctor.created_at)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Email:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedDoctor.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Username:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedDoctor.username}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">SPMC ID File</h4>
                  {selectedDoctor.spmc_id_file ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <a
                          href={selectedDoctor.spmc_id_file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-800 underline break-all"
                        >
                          Open uploaded SPMC ID file
                        </a>
                      </div>
                      {isImageFile(selectedDoctor.spmc_id_file) && (
                        <img
                          src={selectedDoctor.spmc_id_file}
                          alt="Doctor SPMC ID"
                          className="w-full max-h-80 object-contain border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                        />
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No uploaded SPMC ID file</p>
                  )}
                </div>

                {selectedDoctor.approval_status === "pending" && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApproveDoctor(selectedDoctor.id)}
                      disabled={actionLoading}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve Account
                    </Button>
                    <Button
                      className="flex-1"
                      variant="destructive"
                      onClick={() => handleRejectDoctor(selectedDoctor.id)}
                      disabled={actionLoading}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject Account
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default AccountApproval;
