import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReferrerDashboardLayout } from "@/components/layout/ReferrerDashboardLayout";
import { Badge } from "@/components/ui/badge";
import { referralsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  Calendar,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle,
  Stethoscope,
} from "lucide-react";

interface ArchivedReferral {
  id: string;
  referral_id: string;
  patient_full_name: string;
  age: number;
  gender: string;
  hrn?: string;
  chief_complaint: string;
  working_impression: string;
  specialty_needed_name: string;
  referring_hospital_name: string;
  assigned_department?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_by_user?: string;
  transferred_by_user?: string;
  transferred_at?: string;
  triaged_by_user?: string;
  triaged_at?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
    case "uncoordinated":
      return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
    case "in_transit":
      return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
    case "waiting":
      return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
    case "accepted":
      return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
    case "pending":
      return "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30";
    default:
      return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
  }
};

const getStatusDisplay = (status: string) => {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getDepartmentDisplay = (departmentCode?: string) => {
  if (!departmentCode) return 'Unassigned';
  
  const departments: Record<string, string> = {
    'emergency': 'Emergency Department',
    'internal_medicine': 'Internal Medicine',
    'surgery': 'Surgery Department',
    'obstetrics_gynecology': 'Obstetrics and Gynecology',
    'pediatrics': 'Pediatrics',
    'orthopedics': 'Orthopedics',
    'cardiology': 'Cardiology',
    'neurology': 'Neurology',
    'anesthesiology': 'Anesthesiology',
    'radiology': 'Radiology',
    'pathology': 'Pathology',
    'other': 'Other Department'
  };
  
  return departments[departmentCode] || departmentCode.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
};

const Patients = () => {
  const [referrals, setReferrals] = useState<ArchivedReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total_archived: 0,
    completed: 0,
    uncoordinated: 0
  });
  const { user } = useAuth();

  // Determine which layout to use
  const Layout = user?.role === 'referrer' ? ReferrerDashboardLayout : DashboardLayout;

  // Fetch archived referrals from API
  useEffect(() => {
    const fetchArchivedReferrals = async () => {
      try {
        setLoading(true);
        const response = await referralsAPI.getAll();
        const allReferrals = response.results || response;
        
        // Filter to only show completed or uncoordinated referrals
        const archivedReferrals = allReferrals.filter((r: any) => 
          r.status === 'completed' || r.status === 'uncoordinated'
        );
        
        setReferrals(archivedReferrals);
        
        // Calculate stats
        const totalArchived = archivedReferrals.length;
        const completed = archivedReferrals.filter((r: any) => r.status === 'completed').length;
        const uncoordinated = archivedReferrals.filter((r: any) => r.status === 'uncoordinated').length;
        
        setStats({
          total_archived: totalArchived,
          completed: completed,
          uncoordinated: uncoordinated
        });
        
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch archived referrals');
        console.error('Error fetching archived referrals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedReferrals();
  }, []);

  // Filter referrals based on search term
  const filteredReferrals = referrals.filter(referral =>
    referral.patient_full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (referral.hrn && referral.hrn.toLowerCase().includes(searchTerm.toLowerCase())) ||
    referral.referral_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.chief_complaint.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading archived referrals...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-red-500 mb-2">Error loading archived referrals</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Archived Referrals</h1>
          <p className="text-gray-500 dark:text-gray-400">
            View completed and uncoordinated referrals
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400 mb-1">Total Archived</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total_archived}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-gray-800 border border-green-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-1">Completed</h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-1">Uncoordinated</h3>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.uncoordinated}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Archived Referrals List */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-300">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient name, HRN, referral ID, or complaint..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Badge variant="outline" className="text-xs">
                {filteredReferrals.length} referral{filteredReferrals.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
          
          <div className="p-6">
            {filteredReferrals.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'No archived referrals found' : 'No archived referrals yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm 
                    ? 'Try adjusting your search terms' 
                    : 'Archived referrals will appear here when referrals are completed or uncoordinated'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReferrals.map((referral) => (
                  <div 
                    key={referral.id} 
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {referral.patient_full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {referral.patient_full_name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {referral.referral_id} • {referral.age} yrs • {referral.gender}
                              {referral.hrn && ` • HRN: ${referral.hrn}`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-sm">
                          <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                            <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{referral.chief_complaint}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Stethoscope className="w-4 h-4 flex-shrink-0" />
                            <span>{getDepartmentDisplay(referral.assigned_department)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{referral.referring_hospital_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{new Date(referral.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(referral.status)}`}>
                            {getStatusDisplay(referral.status)}
                          </span>
                          {referral.status === 'uncoordinated' && referral.cancellation_reason && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                              Reason: {referral.cancellation_reason}
                            </span>
                          )}
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
    </Layout>
  );
};

export default Patients;