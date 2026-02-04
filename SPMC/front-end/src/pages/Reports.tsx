import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import { referralsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Building2,
  Users,
  Filter
} from "lucide-react";

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

type TimeFilter = 'week' | 'month' | 'year';

const Reports = () => {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [referralsByTime, setReferralsByTime] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [loadingTimeData, setLoadingTimeData] = useState(false);
  const [loadingDepartmentData, setLoadingDepartmentData] = useState(false);
  const { toast } = useToast();

  // Generate years for dropdown (current year and 4 years back)
  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Fetch referrals by time period from API
  const fetchReferralsByTimePeriod = async () => {
    try {
      setLoadingTimeData(true);
      const data = await referralsAPI.getReferralsByTimePeriod(timeFilter, selectedYear);
      setReferralsByTime(data);
    } catch (error) {
      console.error('Error fetching referrals by time period:', error);
      toast({
        title: "Error",
        description: "Failed to load time period data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingTimeData(false);
    }
  };

  // Fetch department data from API
  const fetchDepartmentData = async () => {
    try {
      setLoadingDepartmentData(true);
      const data = await referralsAPI.getDepartmentAnalytics();
      setDepartmentData(data);
    } catch (error) {
      console.error('Error fetching department data:', error);
      toast({
        title: "Error",
        description: "Failed to load department data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingDepartmentData(false);
    }
  };

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
    fetchDepartmentData();
  }, [toast]);

  // Fetch referrals by time period when filter or year changes
  useEffect(() => {
    fetchReferralsByTimePeriod();
  }, [timeFilter, selectedYear]);

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

  const { summary, top_hospitals, specialty_distribution } = reportsData;
  const maxReferrals = Math.max(...referralsByTime.map(item => item.count), 1);
  const totalDepartmentReferrals = departmentData.reduce((sum, dept) => sum + dept.count, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400">Comprehensive referral system analytics and insights</p>
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
        
        {/* Referrals by Time Period with Filters */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Referrals by {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
              </div>
              <div className="flex gap-2">
                {(['week', 'month', 'year'] as TimeFilter[]).map((filter) => (
                  <Button
                    key={filter}
                    variant={timeFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeFilter(filter)}
                    className="text-xs"
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>
              {timeFilter !== 'year' && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            {loadingTimeData ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : referralsByTime.length > 0 ? (
              referralsByTime.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.period}</span>
                    {timeFilter === 'week' && item.full_period && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.full_period}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{item.count}</span>
                    <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                      <div 
                        className="bg-blue-600 dark:bg-blue-400 h-3 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${Math.max(5, (item.count / maxReferrals) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No data available for the selected period</p>
            )}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Referring Hospitals - Bar Chart */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Referring Hospitals</h3>
            </div>
            <div className="space-y-4">
              {top_hospitals.length > 0 ? (
                top_hospitals.slice(0, 8).map((hospital, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                          {hospital.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {hospital.count}
                        </Badge>
                        <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[40px] text-right">
                          {hospital.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${hospital.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No hospital data available</p>
              )}
            </div>
          </div>

          {/* Top Referring Departments - Pie Chart */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Referring Departments</h3>
            </div>
            
            {/* Pie Chart Visualization */}
            {loadingDepartmentData ? (
              <div className="flex items-center justify-center mb-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : departmentData.length > 0 ? (
              <>
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-64 h-64">
                    <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
                      {departmentData.map((dept, index) => {
                        const percentage = (dept.count / totalDepartmentReferrals) * 100;
                        const circumference = 2 * Math.PI * 25; // 2πr where r=25
                        const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                        
                        // Calculate the offset based on previous segments
                        const previousPercentages = departmentData
                          .slice(0, index)
                          .reduce((acc, d) => acc + (d.count / totalDepartmentReferrals) * 100, 0);
                        const strokeDashoffset = -(previousPercentages / 100) * circumference;
                        
                        return (
                          <circle
                            key={index}
                            cx="50"
                            cy="50"
                            r="25"
                            fill="transparent"
                            stroke={dept.color}
                            strokeWidth="12"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-300 hover:stroke-width-14"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {totalDepartmentReferrals}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2">
                  {departmentData.map((dept, index) => {
                    const percentage = ((dept.count / totalDepartmentReferrals) * 100).toFixed(1);
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: dept.color }}
                          ></div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                            {dept.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {dept.count}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[35px] text-right">
                            ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No department data available</p>
            )}
          </div>
        </div>

        {/* Top Specialties */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Specialties</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {specialty_distribution.length > 0 ? (
              specialty_distribution.slice(0, 8).map((specialty, index) => {
                const percentage = (specialty.count / summary.total_referrals * 100).toFixed(1);
                return (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2 truncate">
                      {specialty.name}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {specialty.count}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {percentage}%
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full">
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No specialty data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;