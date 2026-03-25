import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { referralsAPI } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, CheckCircle, AlertTriangle, Clock, MapPin, Stethoscope } from "lucide-react";

interface ReferralRow {
  id: string;
  referral_id: string;
  patient_full_name: string;
  age: number;
  gender: string;
  hrn?: string;
  chief_complaint?: string;
  referring_hospital_name?: string;
  assigned_department?: string;
  assigned_departments?: string[];
  main_service_code?: string;
  department_acceptances?: Array<{
    department_code?: string;
    department_name?: string;
    status?: string;
  }>;
  status: string;
  created_at: string;
}

const archivedStatuses = new Set(["completed", "cancelled", "uncoordinated"]);

const getDepartmentDisplay = (departmentCode?: string) => {
  if (!departmentCode) return "Unassigned";
  return departmentCode.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
    case "rejected":
    case "cancelled":
    case "uncoordinated":
      return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
  }
};

const getStatusDisplay = (status: string) =>
  status.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

const DepartmentArchive = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const departmentCode = (user?.department || user?.permissions?.department || "").toLowerCase();

  const isAssignedToDepartment = (referral: ReferralRow) => {
    if (!departmentCode) return false;

    const assignedDepartment = (referral.assigned_department || "").toLowerCase();
    const mainServiceCode = (referral.main_service_code || "").toLowerCase();
    const assignedDepartments = Array.isArray(referral.assigned_departments)
      ? referral.assigned_departments.map((d) => String(d).toLowerCase())
      : [];
    const acceptanceDepartments = Array.isArray(referral.department_acceptances)
      ? referral.department_acceptances.flatMap((item) => [
          String(item.department_code || "").toLowerCase(),
          String(item.department_name || "").toLowerCase().replace(/\s+/g, "_"),
        ])
      : [];

    return (
      assignedDepartment === departmentCode ||
      mainServiceCode === departmentCode ||
      assignedDepartments.includes(departmentCode) ||
      acceptanceDepartments.includes(departmentCode)
    );
  };

  const getMyDepartmentAcceptanceStatus = (referral: ReferralRow) => {
    if (!departmentCode || !Array.isArray(referral.department_acceptances)) return null;
    const match = referral.department_acceptances.find((item) => {
      const code = String(item.department_code || "").toLowerCase();
      const nameAsCode = String(item.department_name || "").toLowerCase().replace(/\s+/g, "_");
      return code === departmentCode || nameAsCode === departmentCode;
    });
    return match?.status || null;
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await referralsAPI.getAll();
        const all = (Array.isArray(response) ? response : response?.results || []) as ReferralRow[];
        const filtered = all.filter((r) => {
          if (!isAssignedToDepartment(r)) return false;
          const isArchivedByStatus = archivedStatuses.has(r.status);
          const isRejectedByDepartment = getMyDepartmentAcceptanceStatus(r) === "rejected";
          return isArchivedByStatus || isRejectedByDepartment;
        });
        setRows(filtered);
      } catch (err: any) {
        setError(err?.message || "Failed to load archived referrals");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [departmentCode]);

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.patient_full_name,
        r.referral_id,
        r.hrn || "",
        r.chief_complaint || "",
        r.referring_hospital_name || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, searchTerm]);

  const stats = useMemo(() => {
    const completed = rows.filter((r) => r.status === "completed").length;
    const unresolved = rows.filter((r) => {
      const acceptanceStatus = getMyDepartmentAcceptanceStatus(r);
      return r.status === "cancelled" || r.status === "uncoordinated" || acceptanceStatus === "rejected";
    }).length;
    return { total: rows.length, completed, unresolved };
  }, [rows, departmentCode]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading department archive...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="text-red-500 mb-2">Error loading archive</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Department Archive</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Past referrals assigned to {getDepartmentDisplay(departmentCode) || "your department"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400">Total Archived</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-gray-800 border border-green-200 dark:border-gray-700 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-400">Completed</h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-gray-700 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">Uncoordinated/Rejected</h3>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.unresolved}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient, HRN, referral ID, complaint..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="p-6">
            {filteredRows.length === 0 ? (
              <div className="text-center py-12">
                <Stethoscope className="w-14 h-14 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {searchTerm ? "No archived referrals found" : "No archived referrals for your department"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  {searchTerm
                    ? "Try a different keyword."
                    : "Completed, uncoordinated, or department-rejected referrals will appear here."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRows.map((referral) => (
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
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer"
                    title="Open referral details"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{referral.patient_full_name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {referral.referral_id} | {referral.age} yrs | {referral.gender}
                          {referral.hrn ? ` | HRN: ${referral.hrn}` : ""}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="truncate">{referral.chief_complaint || "No chief complaint"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{referral.referring_hospital_name || "Unknown facility"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(referral.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={`${getStatusColor(getMyDepartmentAcceptanceStatus(referral) === "rejected" ? "rejected" : referral.status)} border`}>
                          {getMyDepartmentAcceptanceStatus(referral) === "rejected" ? "Rejected" : getStatusDisplay(referral.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DepartmentArchive;
