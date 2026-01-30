import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import { referralsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface ReportsData {
  summary: {
    total_referrals: number;
    successful_referrals: number;
    pending_referrals: number;
    cancelled_referrals: number;
    success_rate: number;
    cancellation_rate: number;
    recent_referrals: number;
    avg_processing_time_hours: number;
  };
  monthly_trends: Array<{
    month: string;
    count: number;
  }>;
  top_hospitals: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  status_distribution: Array<{
    status: string;
    count: number;
  }>;
  priority_distribution: Array<{
    priority: string;
    count: number;
  }>;
  specialty_distribution: Array<{
    name: string;
    count: number;
  }>;
}

const Reports = () => {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setLoading(true);
        const data = await referralsAPI.getReportsAnalytics();
        setReportsData(data);
      } catch (error) {
        console.error('Error fetching reports data:', error);
        toast({
          title: "Error",
          description: "Failed to load reports data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, [toast]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400">Loading reports data...</p>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!reportsData) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400">Failed to load reports data</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { summary, monthly_trends, top_hospitals, status_distribution, specialty_distribution } = reportsData;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400">View system reports and analytics from database</p>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400 mb-2">Total Referrals</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{summary.total_referrals.toLocaleString()}</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              {summary.recent_referrals} in last 7 days
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-gray-800 border border-green-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">Successful</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{summary.successful_referrals.toLocaleString()}</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              {summary.success_rate}% success rate
            </p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-gray-800 border border-yellow-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{summary.pending_referrals.toLocaleString()}</p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
              Avg. {summary.avg_processing_time_hours.toFixed(1)} hours
            </p>
          </div>
          
          <div className="bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Cancelled</h3>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{summary.cancelled_referrals.toLocaleString()}</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {summary.cancellation_rate}% cancellation rate
            </p>
          </div>
        </div>
        
        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Trends */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Trends</h3>
            <div className="space-y-3">
              {monthly_trends.map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{month.month}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{month.count}</span>
                    <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.max(5, (month.count / Math.max(...monthly_trends.map(m => m.count))) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Top Referring Hospitals */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Referring Hospitals</h3>
            <div className="space-y-3">
              {top_hospitals.length > 0 ? (
                top_hospitals.map((hospital, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{hospital.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{hospital.count} referrals</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">{hospital.percentage}%</p>
                      <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full" 
                          style={{ width: `${hospital.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No referral data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h3>
            <div className="space-y-3">
              {status_distribution.map((status, index) => {
                const percentage = (status.count / summary.total_referrals * 100).toFixed(1);
                const statusColors: Record<string, string> = {
                  pending: 'bg-yellow-500',
                  in_transit: 'bg-blue-500',
                  waiting: 'bg-orange-500',
                  accepted: 'bg-green-500',
                  completed: 'bg-emerald-500',
                  cancelled: 'bg-red-500'
                };
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${statusColors[status.status] || 'bg-gray-500'}`}></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {status.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{status.count}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Specialty Distribution */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Specialties</h3>
            <div className="space-y-3">
              {specialty_distribution.length > 0 ? (
                specialty_distribution.slice(0, 8).map((specialty, index) => {
                  const percentage = (specialty.count / summary.total_referrals * 100).toFixed(1);
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{specialty.name}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{specialty.count}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No specialty data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;