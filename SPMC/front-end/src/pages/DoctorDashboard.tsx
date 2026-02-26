import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { referralsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Stethoscope, FileText, Eye, Clock, User, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const response = await referralsAPI.getAll();
      
      // Handle both array and object responses
      const data = Array.isArray(response) ? response : (response.results || []);
      
      console.log('Fetched referrals:', data);
      setReferrals(data);
      
      // Calculate stats
      const total = data.length;
      const pending = data.filter((r: any) => r.status === 'pending_triage' || r.status === 'transferred_to_triage').length;
      const inProgress = data.filter((r: any) => 
        r.status === 'accepted_by_triage' || 
        r.status === 'in_transit' || 
        r.status === 'arrived_at_spmc'
      ).length;
      const completed = data.filter((r: any) => r.status === 'completed').length;
      
      setStats({ total, pending, inProgress, completed });
    } catch (error) {
      console.error('Error fetching referrals:', error);
      setReferrals([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'pending_triage': { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' },
      'transferred_to_triage': { label: 'Transferred', className: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
      'accepted_by_triage': { label: 'Accepted', className: 'bg-green-500/20 text-green-600 border-green-500/30' },
      'in_transit': { label: 'In Transit', className: 'bg-purple-500/20 text-purple-600 border-purple-500/30' },
      'arrived_at_spmc': { label: 'Arrived', className: 'bg-indigo-500/20 text-indigo-600 border-indigo-500/30' },
      'completed': { label: 'Completed', className: 'bg-gray-500/20 text-gray-600 border-gray-500/30' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-500/20 text-gray-600 border-gray-500/30' };
    return (
      <Badge className={`${config.className} border`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Stethoscope className="w-7 h-7 text-blue-600" />
              Doctor Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              View referrals assigned to {user?.department ? user.department.replace('_', ' ').toUpperCase() : 'your department'}
            </p>
          </div>
          <button
            onClick={() => navigate('/doctor/reports')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            View Reports
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 text-green-600 font-bold text-xl">✓</div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Stethoscope className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">View-Only Access</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                You have read-only access to referrals assigned to your department. 
                You can view patient information and referral details but cannot modify them.
              </p>
            </div>
          </div>
        </div>

        {/* Referrals List */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Department Referrals
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Referrals assigned to your department by Triage
            </p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-12">
                <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No referrals found for your department</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.isArray(referrals) && referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {referral.patient_full_name}
                          </h3>
                          {getStatusBadge(referral.status)}
                          {referral.is_emergent && (
                            <Badge className="bg-red-500/20 text-red-600 border-red-500/30 border">
                              Emergent
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{referral.age}y, {referral.gender}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{referral.referring_hospital_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>{referral.chief_complaint}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(referral.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/referral/view/${referral.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
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

export default DoctorDashboard;
