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
  FileText,
  X,
  Clock,
  Check,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  updated_at?: string;
  // User tracking fields
  created_by_user?: string;
  transferred_by_user?: string;
  transferred_at?: string;
  triaged_by_user?: string;
  triaged_at?: string;
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
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
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
        setError(err.message || 'Failed to fetch archived referrals');
        console.error('Error fetching archived referrals:', err);
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

  const openTimelineModal = (referral: any) => {
    setSelectedReferral(referral);
    setTimelineModalOpen(true);
  };

  const getTimelineSteps = (referral: any) => {
    const steps = [
      {
        status: 'pending',
        label: 'Request Submitted',
        description: 'Referral request submitted and awaiting review',
        icon: FileText,
        color: 'yellow',
        completed: true,
        date: referral.created_at,
        user: referral.created_by_user || 'System',
        action: 'Created referral'
      },
      {
        status: 'waiting',
        label: 'Under Triage',
        description: 'Referral is being reviewed by EDCC staff',
        icon: Clock,
        color: 'blue',
        completed: ['waiting', 'in_transit', 'emergent', 'urgent', 'schedule_opd', 'completed', 'cancelled'].includes(referral.status),
        date: referral.transferred_at || referral.created_at,
        user: referral.transferred_by_user || 'EDCC Staff',
        action: 'Forwarded to EDMAR Triage'
      },
      {
        status: 'in_transit',
        label: 'In Transit',
        description: 'Patient is being transported to the facility',
        icon: MapPin,
        color: 'purple',
        completed: ['in_transit', 'emergent', 'urgent', 'schedule_opd', 'completed', 'cancelled'].includes(referral.status),
        date: referral.status === 'in_transit' ? referral.updated_at : null,
        user: referral.triaged_by_user || 'EDMAR Staff',
        action: 'Initiated patient transport'
      },
      {
        status: 'emergent',
        label: 'Emergent Care',
        description: 'Patient requires immediate emergency care',
        icon: AlertTriangle,
        color: 'red',
        completed: ['emergent', 'urgent', 'schedule_opd', 'completed', 'cancelled'].includes(referral.status),
        date: referral.status === 'emergent' ? referral.triaged_at || referral.updated_at : null,
        user: referral.triaged_by_user || 'EDMAR Staff',
        action: 'Marked as emergent case'
      },
      {
        status: 'urgent',
        label: 'Urgent Care',
        description: 'Patient requires urgent medical attention',
        icon: AlertTriangle,
        color: 'orange',
        completed: ['urgent', 'schedule_opd', 'completed', 'cancelled'].includes(referral.status),
        date: referral.status === 'urgent' ? referral.triaged_at || referral.updated_at : null,
        user: referral.triaged_by_user || 'EDMAR Staff',
        action: 'Marked as urgent case'
      },
      {
        status: 'schedule_opd',
        label: 'Scheduled OPD',
        description: 'Patient appointment scheduled for outpatient department',
        icon: Calendar,
        color: 'green',
        completed: ['schedule_opd', 'completed', 'cancelled'].includes(referral.status),
        date: referral.status === 'schedule_opd' ? referral.triaged_at || referral.updated_at : null,
        user: referral.triaged_by_user || 'EDMAR Staff',
        action: 'Scheduled OPD appointment'
      },
      {
        status: 'completed',
        label: 'Completed',
        description: 'Referral process completed successfully',
        icon: CheckCircle,
        color: 'gray',
        completed: referral.status === 'completed',
        date: referral.status === 'completed' ? referral.updated_at : null,
        user: referral.triaged_by_user || 'EDMAR Staff',
        action: 'Marked as completed'
      },
      {
        status: 'cancelled',
        label: 'Cancelled',
        description: 'Referral has been cancelled',
        icon: X,
        color: 'red',
        completed: referral.status === 'cancelled',
        date: referral.status === 'cancelled' ? referral.updated_at : null,
        user: referral.triaged_by_user || referral.transferred_by_user || 'Staff',
        action: 'Cancelled referral'
      }
    ];

    return steps;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading archived referrals...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="text-red-500 mb-2">Error loading archived referrals</div>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Archived Referrals</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {user?.role_display} - View archived referral information and patient history
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400 mb-1">Total Archived</h3>
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
        
        {/* Archived Referrals List */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-300">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search archived referrals by patient name, HRN, or referral ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Badge variant="outline" className="text-xs">
                {filteredPatients.length} archived referrals
              </Badge>
            </div>
          </div>
          
          <div className="p-6">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'No archived referrals found' : 'No archived referrals yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm 
                    ? 'Try adjusting your search terms' 
                    : 'Archived referrals will appear here when referrals are completed'
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
                          <button
                            onClick={() => openTimelineModal({
                              status: patient.latest_status,
                              created_at: patient.latest_referral_date,
                              updated_at: patient.latest_referral_date,
                              referral_id: patient.latest_referral_id,
                              patient_full_name: patient.patient_full_name
                            })}
                            className={`px-2 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(patient.latest_status)}`}
                          >
                            {patient.latest_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </button>
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

      {/* Timeline Modal */}
      <Dialog open={timelineModalOpen} onOpenChange={setTimelineModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Referral Timeline - {selectedReferral?.referral_id}
            </DialogTitle>
            <DialogDescription>
              Track the complete journey of this referral from submission to completion
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedReferral && getTimelineSteps(selectedReferral).map((step, index) => {
              const IconComponent = step.icon;
              const isCompleted = step.completed;
              const isCurrent = selectedReferral.status === step.status;

              return (
                <div key={step.status} className="flex items-start gap-4">
                  {/* Timeline connector */}
                  {index < getTimelineSteps(selectedReferral).length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200 dark:bg-gray-700"></div>
                  )}

                  {/* Status icon */}
                  <div className={`relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? `bg-${step.color}-500 text-white`
                      : isCurrent
                        ? `bg-${step.color}-100 dark:bg-${step.color}-900/30 text-${step.color}-600 dark:text-${step.color}-400 border-2 border-${step.color}-500`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <IconComponent className="w-6 h-6" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-semibold ${
                        isCompleted
                          ? 'text-gray-900 dark:text-white'
                          : isCurrent
                            ? `text-${step.color}-600 dark:text-${step.color}-400`
                            : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.label}
                      </h4>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {step.description}
                    </p>
                    {step.date && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(step.date).toLocaleString()}
                        </p>
                        {step.user && step.action && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="font-medium">{step.user}</span>
                            <span className="text-gray-400">•</span>
                            <span>{step.action}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Patients;