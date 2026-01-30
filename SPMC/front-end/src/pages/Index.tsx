import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReferralTable } from "@/components/dashboard/ReferralTable";
import { referralsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Truck,
} from "lucide-react";

interface DashboardStats {
  total_referrals_today: number;
  pending_cases: number;
  critical_cases: number;
  completed_today: number;
  yesterday_completed: number;
  yesterday_total: number;
}

const Index = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_referrals_today: 0,
    pending_cases: 0,
    critical_cases: 0,
    completed_today: 0,
    yesterday_completed: 0,
    yesterday_total: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await referralsAPI.getDashboardStats();
        
        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Fetch all referrals to calculate today's stats
        const allReferrals = await referralsAPI.getAll();
        const referrals = allReferrals.results || allReferrals;
        
        // Calculate today's stats
        const todayReferrals = referrals.filter((ref: any) => 
          ref.created_at.startsWith(today)
        );
        const yesterdayReferrals = referrals.filter((ref: any) => 
          ref.created_at.startsWith(yesterday)
        );
        
        const pendingCases = referrals.filter((ref: any) => 
          ref.status === 'pending'
        ).length;
        
        const criticalCases = referrals.filter((ref: any) => 
          ref.priority === 'critical'
        ).length;
        
        const completedToday = referrals.filter((ref: any) => 
          ref.status === 'completed' && ref.updated_at.startsWith(today)
        ).length;
        
        const completedYesterday = referrals.filter((ref: any) => 
          ref.status === 'completed' && ref.updated_at.startsWith(yesterday)
        ).length;
        
        setStats({
          total_referrals_today: todayReferrals.length,
          pending_cases: pendingCases,
          critical_cases: criticalCases,
          completed_today: completedToday,
          yesterday_completed: completedYesterday,
          yesterday_total: yesterdayReferrals.length,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardStats();
      // Refresh every 2 minutes
      const interval = setInterval(fetchDashboardStats, 120000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-current">Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Welcome back, {user?.full_name || user?.username}. Here's today's overview.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Last updated: {loading ? 'Loading...' : 'Just now'}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Referrals Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {loading ? '...' : stats.total_referrals_today}
                </p>
                <p className="text-xs mt-1 text-green-600 dark:text-green-400">
                  {loading ? '...' : `${calculatePercentageChange(stats.total_referrals_today, stats.yesterday_total) >= 0 ? '+' : ''}${calculatePercentageChange(stats.total_referrals_today, stats.yesterday_total)}% from yesterday`}
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
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Cases</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {loading ? '...' : stats.pending_cases}
                </p>
                <p className="text-xs mt-1 text-yellow-600 dark:text-yellow-400">
                  {loading ? '...' : `${stats.critical_cases} critical`}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {loading ? '...' : stats.completed_today}
                </p>
                <p className="text-xs mt-1 text-green-600 dark:text-green-400">
                  {loading ? '...' : `${calculatePercentageChange(stats.completed_today, stats.yesterday_completed) >= 0 ? '+' : ''}${calculatePercentageChange(stats.completed_today, stats.yesterday_completed)} from yesterday`}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Ambulances</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {loading ? '...' : '6'}
                </p>
                <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">2 en route</p>
              </div>
              <div className="p-3 rounded-lg bg-cyan-500/10">
                <Truck className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full">
          <ReferralTable />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
