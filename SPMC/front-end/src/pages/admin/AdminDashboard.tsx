import { useEffect, useState } from "react";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Link } from "react-router-dom";
import { UserCheck, Building2, BarChart3, Clock, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { adminAPI } from "@/lib/api";
import { toast } from "sonner";

interface DashboardStats {
  pending_doctors: number;
  total_doctors: number;
  total_referrals: number;
  recent_referrals: number;
  recent_registrations: number;
}

interface PendingDoctor {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  created_at: string;
  approval_status: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, doctorsData] = await Promise.all([adminAPI.getDashboardStats(), adminAPI.getPendingDoctors()]);
      setStats(statsData);

      const doctors = Array.isArray(doctorsData) ? doctorsData : [];
      setPendingDoctors(doctors.filter((doctor: PendingDoctor) => doctor.approval_status === "pending"));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  if (loading || !stats) {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage doctor approvals and monitor system activity</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/approvals">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Doctor Approvals</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.pending_doctors || 0}</p>
                  <p className="text-xs mt-1 text-orange-600 dark:text-orange-400">Requires attention</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <UserCheck className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </Link>

          <Link to="/admin/departments">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Departments</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">12</p>
                  <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">Manage contact numbers</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </Link>

          <Link to="/admin/reports">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Recent Activity</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.recent_registrations || 0}</p>
                  <p className="text-xs mt-1 text-green-600 dark:text-green-400">New users this week</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Building2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </Link>

          <Link to="/admin/reports">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Referrals</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total_referrals || 0}</p>
                  <p className="text-xs mt-1 text-purple-600 dark:text-purple-400">{stats.recent_referrals || 0} this week</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Link to="/admin/approvals">
            <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg p-6 text-white cursor-pointer hover:shadow-xl transition-all transform hover:scale-[1.02]">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Review Doctor Approvals</h3>
                  <p className="text-orange-100 text-sm mb-4">
                    {stats.pending_doctors || 0} pending doctor account{(stats.pending_doctors || 0) !== 1 ? "s" : ""} waiting for approval
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>Review Accounts</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
                <UserCheck className="w-8 h-8 opacity-80" />
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Incoming Doctor Registrations</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and approve new doctor accounts</p>
              </div>
              <Link to="/admin/approvals">
                <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">View All →</button>
              </Link>
            </div>
          </div>

          <div className="p-6">
            {pendingDoctors.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingDoctors.slice(0, 5).map((doctor) => {
                  const fullName = doctor.full_name || `${doctor.first_name} ${doctor.last_name}`;
                  const initials = `${doctor.first_name[0]}${doctor.last_name[0]}`;
                  return (
                    <Link
                      key={doctor.id}
                      to="/admin/approvals"
                      className="block border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-medium">{initials}</div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{fullName}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Doctor • {doctor.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">Submitted {formatDate(doctor.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                            Pending Review
                          </span>
                          <AlertCircle className="w-5 h-5 text-orange-600" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;
