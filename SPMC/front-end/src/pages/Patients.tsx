import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { referralsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Search, 
  Eye, 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  FileText,
  X,
  Clock
} from "lucide-react";

interface Patient {
  patient_full_name: string;
  age: number;
  gender: string;
  hrn?: string;
  patient_category: string;
  current_address: string;
  birthday: string;
  total_referrals: number;
  latest_referral_date: string;
  latest_referral_id: string;
  latest_status: string;
  latest_specialty?: string;
  latest_hospital?: string;
}

interface PatientHistory {
  id: string;
  referral_id: string;
  chief_complaint: string;
  working_impression: string;
  specialty_needed_name: string;
  referring_hospital_name: string;
  status: string;
  priority: string;
  created_at: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "in_transit":
      return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
    case "waiting":
      return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
    case "accepted":
      return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
    case "completed":
      return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
    case "pending":
      return "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30";
    default:
      return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
  }
};

const PatientHistoryModal = ({ 
  patient, 
  onClose 
}: { 
  patient: Patient; 
  onClose: () => void; 
}) => {
  const [history, setHistory] = useState<PatientHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await referralsAPI.getPatientHistory(patient.patient_full_name);
        setHistory(response);
      } catch (error) {
        console.error('Error fetching patient history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [patient.patient_full_name]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Patient History - {patient.patient_full_name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {patient.age} yrs • {patient.gender} • {patient.total_referrals} referrals
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Patient Info */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Patient Category</label>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {patient.patient_category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            </div>
            {patient.hrn && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">HRN</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{patient.hrn}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Birthday</label>
              <p className="text-sm text-gray-900 dark:text-white mt-1">{patient.birthday}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Latest Referral</label>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {new Date(patient.latest_referral_date).toLocaleDateString()}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
              <p className="text-sm text-gray-900 dark:text-white mt-1">{patient.current_address}</p>
            </div>
          </div>
        </div>

        {/* Referral History */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Referral History</h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-600 dark:text-gray-400">Loading history...</span>
            </div>
          ) : history.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No referral history found</p>
          ) : (
            <div className="space-y-4">
              {history.map((referral) => (
                <div key={referral.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{referral.referral_id}</h4>
                        <Badge className={getStatusColor(referral.status)}>
                          {referral.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {referral.specialty_needed_name}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white mb-1">
                        <strong>Chief Complaint:</strong> {referral.chief_complaint}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Impression:</strong> {referral.working_impression}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        From: {referral.referring_hospital_name}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(referral.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [stats, setStats] = useState({
    total_patients: 0,
    active_cases: 0,
    pending_cases: 0
  });
  const { user } = useAuth();

  // Fetch patients from API
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await referralsAPI.getPatients();
        const patientsData = response.results || response;
        setPatients(patientsData);
        
        // Calculate stats
        const totalPatients = patientsData.length;
        const activeCases = patientsData.filter((p: Patient) => 
          ['pending', 'in_transit', 'waiting'].includes(p.latest_status)
        ).length;
        const pendingCases = patientsData.filter((p: Patient) => 
          p.latest_status === 'pending'
        ).length;
        
        setStats({
          total_patients: totalPatients,
          active_cases: activeCases,
          pending_cases: pendingCases
        });
        
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch patients');
        console.error('Error fetching patients:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient =>
    patient.patient_full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.hrn && patient.hrn.toLowerCase().includes(searchTerm.toLowerCase())) ||
    patient.latest_referral_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading patients...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="text-red-500 mb-2">Error loading patients</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm mb-4">{error}</div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patients</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {user?.role_display} - Manage patient information and referral history
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400 mb-1">Total Patients</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total_patients}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-gray-800 border border-green-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-1">Active Cases</h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.active_cases}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-gray-800 border border-yellow-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-1">Pending</h3>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending_cases}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Patients List */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-300">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients by name, HRN, or referral ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Badge variant="outline" className="text-xs">
                {filteredPatients.length} patients
              </Badge>
            </div>
          </div>
          
          <div className="p-6">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'No patients found' : 'No patients yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm 
                    ? 'Try adjusting your search terms' 
                    : 'Patients will appear here when referrals are submitted'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPatients.map((patient) => (
                  <div 
                    key={patient.patient_full_name} 
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {patient.patient_full_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {patient.patient_full_name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {patient.age} yrs • {patient.gender} 
                              {patient.hrn && ` • ${patient.hrn}`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{patient.current_address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>Born: {patient.birthday}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <FileText className="w-4 h-4" />
                            <span>{patient.total_referrals} referral(s)</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>Latest: {new Date(patient.latest_referral_date).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <Badge className={getStatusColor(patient.latest_status)}>
                            {patient.latest_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          {patient.latest_specialty && (
                            <Badge variant="outline" className="text-xs">
                              {patient.latest_specialty}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPatient(patient)}
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patient History Modal */}
      {selectedPatient && (
        <PatientHistoryModal 
          patient={selectedPatient} 
          onClose={() => setSelectedPatient(null)} 
        />
      )}
    </DashboardLayout>
  );
};

export default Patients;