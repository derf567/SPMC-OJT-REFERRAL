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
  
  // Global filter that controls all sections
  const [globalFilter, setGlobalFilter] = useState<TimeFilter>('month');
  const [globalYear, setGlobalYear] = useState(new Date().getFullYear());
  const [globalMonth, setGlobalMonth] = useState(0); // 0 = All, 1-12 = specific month
  const [globalWeek, setGlobalWeek] = useState(0); // 0 = All, 1-52 = specific week
  const [weekFilterMonth, setWeekFilterMonth] = useState(0); // Month filter for week view (0 = All)
  
  const [referralsByTime, setReferralsByTime] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [loadingTimeData, setLoadingTimeData] = useState(false);
  const [loadingDepartmentData, setLoadingDepartmentData] = useState(false);
  
  // Data states
  const [hospitalsData, setHospitalsData] = useState<any[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  
  const [specialtiesData, setSpecialtiesData] = useState<any[]>([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);
  
  // Coordinated/Uncoordinated data
  const [coordinatedData, setCoordinatedData] = useState<any[]>([]);
  const [uncoordinatedData, setUncoordinatedData] = useState<any[]>([]);
  const [loadingCoordinated, setLoadingCoordinated] = useState(false);
  
  const { toast } = useToast();

  // Generate years for dropdown (current year and 4 years back)
  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Fetch all filtered data using global filter
  const fetchAllFilteredData = async () => {
    try {
      setLoadingTimeData(true);
      setLoadingDepartmentData(true);
      setLoadingHospitals(true);
      setLoadingSpecialties(true);
      setLoadingCoordinated(true);

      const [
        referralsByTimeData,
        departmentsData,
        hospitalsData,
        specialtiesData,
        coordinatedData,
        uncoordinatedData
      ] = await Promise.all([
        referralsAPI.getReferralsByTimePeriod(
          globalFilter, 
          globalYear, 
          globalFilter === 'week' ? weekFilterMonth : globalMonth, 
          globalWeek
        ),
        referralsAPI.getTopDepartments(globalFilter, globalYear, globalMonth, globalWeek),
        referralsAPI.getTopHospitals(globalFilter, globalYear, globalMonth, globalWeek),
        referralsAPI.getTopSpecialties(globalFilter, globalYear, globalMonth, globalWeek),
        referralsAPI.getCoordinatedReferrals(globalFilter, globalYear, globalMonth, globalWeek),
        referralsAPI.getUncoordinatedReferrals(globalFilter, globalYear, globalMonth, globalWeek)
      ]);

      setReferralsByTime(referralsByTimeData);
      setDepartmentData(departmentsData);
      setHospitalsData(hospitalsData);
      setSpecialtiesData(specialtiesData);
      setCoordinatedData(coordinatedData);
      setUncoordinatedData(uncoordinatedData);
    } catch (error) {
      console.error('Error fetching filtered data:', error);
      toast({
        title: "Error",
        description: "Failed to load filtered data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingTimeData(false);
      setLoadingDepartmentData(false);
      setLoadingHospitals(false);
      setLoadingSpecialties(false);
      setLoadingCoordinated(false);
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
  }, [toast]);

  // Fetch all filtered data when global filter or year changes
  useEffect(() => {
    fetchAllFilteredData();
  }, [globalFilter, globalYear, globalMonth, globalWeek, weekFilterMonth]);

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

  const { summary } = reportsData;
  const maxReferrals = Math.max(...referralsByTime.map(item => item.count), 1);
  const totalDepartmentReferrals = departmentData.reduce((sum, dept) => sum + dept.count, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400">Comprehensive referral system analytics and insights</p>
          </div>
          
          {/* Global Filter */}
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Global Filter:</span>
            </div>
            <div className="flex gap-2">
              {(['week', 'month', 'year'] as TimeFilter[]).map((filter) => (
                <Button
                  key={filter}
                  variant={globalFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGlobalFilter(filter)}
                  className="text-sm"
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Button>
              ))}
            </div>
            
            {/* Year Selector */}
            {globalFilter !== 'year' && (
              <select
                value={globalYear}
                onChange={(e) => setGlobalYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}
            
            {/* Month Selector */}
            {globalFilter === 'month' && (
              <select
                value={globalMonth}
                onChange={(e) => setGlobalMonth(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={0}>All Months</option>
                <option value={1}>January</option>
                <option value={2}>February</option>
                <option value={3}>March</option>
                <option value={4}>April</option>
                <option value={5}>May</option>
                <option value={6}>June</option>
                <option value={7}>July</option>
                <option value={8}>August</option>
                <option value={9}>September</option>
                <option value={10}>October</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
              </select>
            )}
            
            {/* Week Selector */}
            {globalFilter === 'week' && (
              <>
                <select
                  value={weekFilterMonth}
                  onChange={(e) => {
                    setWeekFilterMonth(Number(e.target.value));
                    setGlobalWeek(0); // Reset week when month changes
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={0}>All Months</option>
                  <option value={1}>January</option>
                  <option value={2}>February</option>
                  <option value={3}>March</option>
                  <option value={4}>April</option>
                  <option value={5}>May</option>
                  <option value={6}>June</option>
                  <option value={7}>July</option>
                  <option value={8}>August</option>
                  <option value={9}>September</option>
                  <option value={10}>October</option>
                  <option value={11}>November</option>
                  <option value={12}>December</option>
                </select>
                <select
                  value={globalWeek}
                  onChange={(e) => setGlobalWeek(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={0}>All Weeks</option>
                  {Array.from({ length: 52 }, (_, i) => i + 1).map(week => (
                    <option key={week} value={week}>Week {week}</option>
                  ))}
                </select>
              </>
            )}
            
            {/* Year Selector for Year filter */}
            {globalFilter === 'year' && (
              <select
                value={globalYear}
                onChange={(e) => setGlobalYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}
          </div>
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
        
        {/* Referrals by Time Period */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Referrals by {globalFilter.charAt(0).toUpperCase() + globalFilter.slice(1)}</h3>
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
                    {(globalFilter === 'week' || globalFilter === 'month') && item.full_period && (
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
              {loadingHospitals ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : hospitalsData.length > 0 ? (
                hospitalsData.slice(0, 8).map((hospital, index) => (
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
            {loadingSpecialties ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : specialtiesData.length > 0 ? (
              specialtiesData.slice(0, 8).map((specialty, index) => {
                const total = specialtiesData.reduce((sum, s) => sum + s.count, 0);
                const percentage = (specialty.count / total * 100).toFixed(1);
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

        {/* Coordinated and Uncoordinated Referrals - Graphs and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coordinated Referrals */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Coordinated Referrals</h3>
              <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                Received by Department
              </Badge>
            </div>
            
            {/* Graph Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Trend Overview</h4>
              {loadingCoordinated ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : coordinatedData.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Coordinated</span>
                    <span className="font-bold text-green-600 dark:text-green-400 text-2xl">{coordinatedData.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4">
                    <div 
                      className="bg-green-600 dark:bg-green-400 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2" 
                      style={{ width: '100%' }}
                    >
                      <span className="text-xs text-white font-medium">100%</span>
                    </div>
                  </div>
                  
                  {/* Status breakdown */}
                  <div className="mt-4 space-y-2">
                    {(() => {
                      const statusCounts = coordinatedData.reduce((acc: any, ref: any) => {
                        acc[ref.status] = (acc[ref.status] || 0) + 1;
                        return acc;
                      }, {});
                      const total = coordinatedData.length;
                      
                      return Object.entries(statusCounts).map(([status, count]: [string, any]) => {
                        const percentage = (count / total * 100).toFixed(1);
                        return (
                          <div key={status} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span className="text-xs text-gray-700 dark:text-gray-300">{status}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-900 dark:text-white">{count}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">({percentage}%)</span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No data available</p>
              )}
            </div>

            {/* Table Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Records (Top 10)</h4>
              <div className="overflow-x-auto max-h-96">
                {loadingCoordinated ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : coordinatedData.length > 0 ? (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">ID</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Patient</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coordinatedData.slice(0, 10).map((referral, index) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="py-2 px-2 text-blue-600 dark:text-blue-400 font-medium">{referral.referral_id}</td>
                          <td className="py-2 px-2 text-gray-900 dark:text-white truncate max-w-[120px]">{referral.patient_name}</td>
                          <td className="py-2 px-2">
                            <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                              {referral.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No coordinated referrals for the selected period</p>
                )}
              </div>
            </div>
          </div>

          {/* Uncoordinated Referrals */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Uncoordinated Referrals</h3>
              <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                Cancelled
              </Badge>
            </div>
            
            {/* Graph Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Trend Overview</h4>
              {loadingCoordinated ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              ) : uncoordinatedData.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Uncoordinated</span>
                    <span className="font-bold text-red-600 dark:text-red-400 text-2xl">{uncoordinatedData.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4">
                    <div 
                      className="bg-red-600 dark:bg-red-400 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2" 
                      style={{ width: '100%' }}
                    >
                      <span className="text-xs text-white font-medium">100%</span>
                    </div>
                  </div>
                  
                  {/* Top cancellation reasons */}
                  <div className="mt-4 space-y-2">
                    {(() => {
                      const reasonCounts = uncoordinatedData.reduce((acc: any, ref: any) => {
                        const reason = ref.reason.substring(0, 30) + (ref.reason.length > 30 ? '...' : '');
                        acc[reason] = (acc[reason] || 0) + 1;
                        return acc;
                      }, {});
                      const total = uncoordinatedData.length;
                      
                      return Object.entries(reasonCounts).slice(0, 5).map(([reason, count]: [string, any]) => {
                        const percentage = (count / total * 100).toFixed(1);
                        return (
                          <div key={reason} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[150px]" title={reason}>{reason}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-900 dark:text-white">{count}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">({percentage}%)</span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No data available</p>
              )}
            </div>

            {/* Table Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Records (Top 10)</h4>
              <div className="overflow-x-auto max-h-96">
                {loadingCoordinated ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div>
                ) : uncoordinatedData.length > 0 ? (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">ID</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Patient</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uncoordinatedData.slice(0, 10).map((referral, index) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="py-2 px-2 text-red-600 dark:text-red-400 font-medium">{referral.referral_id}</td>
                          <td className="py-2 px-2 text-gray-900 dark:text-white truncate max-w-[120px]">{referral.patient_name}</td>
                          <td className="py-2 px-2 text-gray-700 dark:text-gray-300 truncate max-w-[150px]" title={referral.reason}>{referral.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No uncoordinated referrals for the selected period</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;