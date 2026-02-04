import { useState, useEffect } from "react";
import { ReferrerDashboardLayout } from "@/components/layout/ReferrerDashboardLayout";
import { referralsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  TrendingUp,
  Calendar,
  Archive,
  BarChart3,
  Filter,
  Search,
} from "lucide-react";

interface ReferrerStats {
  total_referrals: number;
  pending_referrals: number;
  accepted_referrals: number;
  completed_referrals: number;
  this_month: number;
  last_month: number;
}

const ReferrerDashboard = () => {
  const [stats, setStats] = useState<ReferrerStats>({
    total_referrals: 0,
    pending_referrals: 0,
    accepted_referrals: 0,
    completed_referrals: 0,
    this_month: 0,
    last_month: 0,
  });
  const [recentReferrals, setRecentReferrals] = useState<any[]>([]);
  const [allReferrals, setAllReferrals] = useState<any[]>([]);
  const [filteredReferrals, setFilteredReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const location = useLocation();

  // Determine current section based on route
  const getCurrentSection = () => {
    const path = location.pathname;
    if (path === '/referrer/referred') return 'referred';
    if (path === '/referrer/archived') return 'archived';
    if (path === '/referrer/reports') return 'reports';
    return 'dashboard';
  };

  const currentSection = getCurrentSection();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch my submitted referrals (for referrers)
        const response = await referralsAPI.getMySubmittedReferrals();
        const referrals = response.results || response;
        
        if (Array.isArray(referrals)) {
          setAllReferrals(referrals);
          
          // Calculate stats
          const now = new Date();
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          
          const stats = {
            total_referrals: referrals.length,
            pending_referrals: referrals.filter(r => r.status === 'pending').length,
            accepted_referrals: referrals.filter(r => ['waiting', 'in_transit', 'emergent', 'urgent', 'schedule_opd'].includes(r.status)).length,
            completed_referrals: referrals.filter(r => r.status === 'completed').length,
            this_month: referrals.filter(r => new Date(r.created_at) >= thisMonth).length,
            last_month: referrals.filter(r => {
              const createdAt = new Date(r.created_at);
              return createdAt >= lastMonth && createdAt <= lastMonthEnd;
            }).length,
          };
          
          setStats(stats);
          
          // Get recent referrals (last 5)
          const sortedReferrals = referrals
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);
          setRecentReferrals(sortedReferrals);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  // Filter referrals based on status and search term
  useEffect(() => {
    let filtered = allReferrals;
    
    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(r => !['completed', 'cancelled'].includes(r.status));
      } else if (statusFilter === 'completed') {
        filtered = filtered.filter(r => r.status === 'completed');
      } else {
        filtered = filtered.filter(r => r.status === statusFilter);
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.patient_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referral_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredReferrals(filtered);
  }, [allReferrals, statusFilter, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
      case "waiting":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "in_transit":
        return "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "emergent":
        return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
      case "urgent":
        return "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30";
      case "schedule_opd":
        return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
      case "completed":
        return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "⏳ Pending Review";
      case "waiting":
        return "👨‍⚕️ Under Triage";
      case "in_transit":
        return "🚑 In Transit";
      case "emergent":
        return "🚨 Emergent";
      case "urgent":
        return "⚡ Urgent";
      case "schedule_opd":
        return "📅 Scheduled OPD";
      case "completed":
        return "✅ Completed";
      default:
        return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Render different sections based on current route
  const renderDashboardSection = () => {
    switch (currentSection) {
      case 'referred':
        return renderReferredSection();
      case 'archived':
        return renderArchivedSection();
      case 'reports':
        return renderReportsSection();
      default:
        return renderMainDashboard();
    }
  };

  const renderMainDashboard = () => (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-current">Referrer Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Welcome back, {user?.full_name || user?.username}. Here's your referral overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/referral">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              New Referral
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.total_referrals}
              </p>
              <p className="text-xs mt-1 text-green-600 dark:text-green-400">
                All time submissions
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
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.pending_referrals}
              </p>
              <p className="text-xs mt-1 text-yellow-600 dark:text-yellow-400">
                Awaiting EDCC review
              </p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Accepted/Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.accepted_referrals}
              </p>
              <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                In treatment process
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10">
              <AlertTriangle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.completed_referrals}
              </p>
              <p className="text-xs mt-1 text-green-600 dark:text-green-400">
                Successfully treated
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Comparison */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Activity</h3>
          <TrendingUp className="w-5 h-5 text-green-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
              {stats.this_month}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">referrals submitted</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Last Month</p>
            <p className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-2">
              {stats.last_month}
            </p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className={`text-xs ${
                calculatePercentageChange(stats.this_month, stats.last_month) >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {calculatePercentageChange(stats.this_month, stats.last_month) >= 0 ? '+' : ''}
                {calculatePercentageChange(stats.this_month, stats.last_month)}% change
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/referral" className="block">
          <div className="bg-green-600 hover:bg-green-700 rounded-lg p-6 text-white transition-colors cursor-pointer">
            <Plus className="w-8 h-8 mb-3" />
            <h4 className="font-semibold text-lg">New Referral</h4>
            <p className="text-sm text-green-100 mt-1">Submit a new patient referral</p>
          </div>
        </Link>
        
        <Link to="/referrer/referred" className="block">
          <div className="bg-blue-600 hover:bg-blue-700 rounded-lg p-6 text-white transition-colors cursor-pointer">
            <FileText className="w-8 h-8 mb-3" />
            <h4 className="font-semibold text-lg">My Referrals</h4>
            <p className="text-sm text-blue-100 mt-1">View active referrals</p>
          </div>
        </Link>
        
        <Link to="/referrer/reports" className="block">
          <div className="bg-purple-600 hover:bg-purple-700 rounded-lg p-6 text-white transition-colors cursor-pointer">
            <Calendar className="w-8 h-8 mb-3" />
            <h4 className="font-semibold text-lg">Reports</h4>
            <p className="text-sm text-purple-100 mt-1">View referral analytics</p>
          </div>
        </Link>
      </div>

      {/* Recent Referrals */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-300">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Referrals</h3>
            <Link to="/referrer/referred" className="text-green-600 hover:text-green-800 text-sm font-medium">
              View All →
            </Link>
          </div>
        </div>
        
        <div className="p-6">
          {recentReferrals.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No referrals submitted yet</p>
              <Link to="/referral">
                <button className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                  Submit Your First Referral
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentReferrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {referral.patient_full_name?.split(' ').map((n: string) => n[0]).join('') || 'N/A'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {referral.patient_full_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {referral.chief_complaint} • {referral.specialty_needed_name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(referral.created_at).toLocaleDateString()} • ID: {referral.referral_id}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(referral.status)}`}>
                      {getStatusLabel(referral.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReferredSection = () => (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-current">My Referrals</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Track all your submitted referrals and their current status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/referral">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              New Referral
            </button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by patient name, ID, or complaint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Referrals List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Referrals ({filteredReferrals.length})
          </h3>
        </div>
        
        <div className="p-6">
          {filteredReferrals.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all' ? 'No referrals match your filters' : 'No referrals found'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReferrals.map((referral) => (
                <div key={referral.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-medium">
                        {referral.patient_full_name?.split(' ').map((n: string) => n[0]).join('') || 'N/A'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {referral.patient_full_name}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(referral.status)}`}>
                            {getStatusLabel(referral.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <strong>Chief Complaint:</strong> {referral.chief_complaint}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <strong>Specialty:</strong> {referral.specialty_needed_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <strong>Hospital:</strong> {referral.referring_hospital_name}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 mt-2">
                          <span>ID: {referral.referral_id}</span>
                          <span>Submitted: {new Date(referral.created_at).toLocaleDateString()}</span>
                          {referral.updated_at && (
                            <span>Updated: {new Date(referral.updated_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderArchivedSection = () => {
    const archivedReferrals = allReferrals.filter(r => r.status === 'completed' || r.status === 'cancelled');
    
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-current">Archived Referrals</h1>
            <p className="text-gray-500 dark:text-gray-400">
              View completed and cancelled referrals.
            </p>
          </div>
        </div>

        {/* Archived Referrals */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Archived Referrals ({archivedReferrals.length})
            </h3>
          </div>
          
          <div className="p-6">
            {archivedReferrals.length === 0 ? (
              <div className="text-center py-8">
                <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No archived referrals yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {archivedReferrals.map((referral) => (
                  <div key={referral.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center text-white font-medium">
                          {referral.patient_full_name?.split(' ').map((n: string) => n[0]).join('') || 'N/A'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {referral.patient_full_name}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(referral.status)}`}>
                              {getStatusLabel(referral.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <strong>Chief Complaint:</strong> {referral.chief_complaint}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <strong>Specialty:</strong> {referral.specialty_needed_name}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 mt-2">
                            <span>ID: {referral.referral_id}</span>
                            <span>Completed: {new Date(referral.updated_at || referral.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderReportsSection = () => {
    const monthlyData: { [key: string]: number } = {};
    const specialtyData: { [key: string]: number } = {};
    
    // Process data for reports
    allReferrals.forEach(referral => {
      const month = new Date(referral.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      monthlyData[month] = (monthlyData[month] || 0) + 1;
      
      const specialty = referral.specialty_needed_name || 'Unknown';
      specialtyData[specialty] = (specialtyData[specialty] || 0) + 1;
    });

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-current">Reports & Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400">
              View detailed analytics of your referral activity.
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.total_referrals}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.total_referrals > 0 ? Math.round((stats.completed_referrals / stats.total_referrals) * 100) : 0}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.this_month}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. per Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {Object.keys(monthlyData).length > 0 ? Math.round(stats.total_referrals / Object.keys(monthlyData).length) : 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Monthly Breakdown */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(monthlyData).map(([month, count]) => (
              <div key={month} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white">{month}</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">{count} referrals</span>
              </div>
            ))}
          </div>
        </div>

        {/* Specialty Breakdown */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Referrals by Specialty</h3>
          <div className="space-y-3">
            {Object.entries(specialtyData).map(([specialty, count]) => (
              <div key={specialty} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white">{specialty}</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">{count} referrals</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <ReferrerDashboardLayout>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 transition-colors duration-300">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
            <span className="text-gray-600 dark:text-gray-400">Loading dashboard...</span>
          </div>
        </div>
      </ReferrerDashboardLayout>
    );
  }

  return (
    <ReferrerDashboardLayout>
      {renderDashboardSection()}
    </ReferrerDashboardLayout>
  );
};

export default ReferrerDashboard;