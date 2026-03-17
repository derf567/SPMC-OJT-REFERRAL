import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { referralsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Building2,
  Search,
  Eye,
  X,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";

interface OutpatientData {
  id: string;
  referral_id: string;
  patient_full_name: string;
  age: number;
  gender: string;
  current_address: string;
  referring_hospital_name: string;
  referrer_name: string;
  referrer_cellphone: string;
  specialty_needed_name: string;
  scheduled_date: string;
  scheduled_time: string;
  triage_notes?: string;
  created_at: string;
}

// Outpatient Detail Modal
const OutpatientDetailModal = ({ 
  outpatient, 
  onClose,
  showCompleted 
}: { 
  outpatient: OutpatientData; 
  onClose: () => void;
  showCompleted: boolean;
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {showCompleted ? 'Completed' : 'Outpatient'} Appointment - {outpatient.referral_id}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {outpatient.patient_full_name} • {outpatient.age} yrs • {outpatient.gender}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Appointment Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Appointment Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Scheduled Date</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1 font-medium">
                  📅 {new Date(outpatient.scheduled_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Scheduled Time</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1 font-medium">
                  🕐 {outpatient.scheduled_time}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Referral Received</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  📨 {new Date(outpatient.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} at {new Date(outpatient.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <div className="mt-1">
                  {showCompleted ? (
                    <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
                      ✅ Completed
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30">
                      📅 Scheduled
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Specialty</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{outpatient.specialty_needed_name}</p>
              </div>
              {outpatient.triage_notes && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Triage Notes</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{outpatient.triage_notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Patient Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Patient Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{outpatient.patient_full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Age & Gender</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{outpatient.age} years • {outpatient.gender}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{outpatient.current_address}</p>
              </div>
            </div>
          </div>

          {/* Referring Hospital */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Referring Hospital</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Hospital Name</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{outpatient.referring_hospital_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Referring Doctor</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">Dr. {outpatient.referrer_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Number</label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-900 dark:text-white">{outpatient.referrer_cellphone}</p>
                </div>
              </div>
            </div>
          </div>
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

const Outpatient = () => {
  const [outpatients, setOutpatients] = useState<OutpatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOutpatient, setSelectedOutpatient] = useState<OutpatientData | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mark appointment as completed
  const handleMarkAsCompleted = async (outpatient: OutpatientData) => {
    // Check if user has permission to complete appointments
    if (!user?.permissions?.can_triage_referrals) {
      toast({
        variant: "destructive",
        title: "Permission Denied ❌",
        description: "Only triage users can mark appointments as completed. EDCC users have view-only access to outpatient appointments.",
      });
      return;
    }

    const confirmed = window.confirm(
      `✅ MARK APPOINTMENT AS COMPLETED\n\n` +
      `Patient: ${outpatient.patient_full_name}\n` +
      `Appointment: ${new Date(outpatient.scheduled_date).toLocaleDateString()} at ${outpatient.scheduled_time}\n\n` +
      `Are you sure you want to mark this appointment as completed?\n` +
      `This will move the appointment to the completed/archived status.`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      await referralsAPI.markAsCompleted(outpatient.id);
      
      // Refresh the outpatients list
      const response = await referralsAPI.getAll();
      const allReferrals = response.results || response;
      
      // Filter for schedule_opd status referrals based on showCompleted toggle
      const scheduledReferrals = allReferrals.filter((ref: any) => {
        const isScheduledOPD = ref.triage_decision === 'schedule_opd' && ref.scheduled_date;
        if (showCompleted) {
          return isScheduledOPD && ref.status === 'completed';
        } else {
          return isScheduledOPD && ref.status !== 'completed';
        }
      });
      
      setOutpatients(scheduledReferrals);
      
      toast({
        title: "Appointment Completed! ✅",
        description: `${outpatient.patient_full_name}'s appointment has been marked as completed and moved to archives.`,
        className: "bg-green-50 border-green-200 text-green-800",
      });
    } catch (err: any) {
      console.error('Error marking appointment as completed:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to mark appointment as completed';
      toast({
        variant: "destructive",
        title: "Update Failed ❌",
        description: `Failed to mark appointment as completed: ${errorMessage}`,
      });
    }
  };

  // Fetch outpatient appointments
  useEffect(() => {
    const fetchOutpatients = async () => {
      try {
        setLoading(true);
        const response = await referralsAPI.getAll();
        const allReferrals = response.results || response;
        
        // Filter for schedule_opd status referrals based on showCompleted toggle
        const scheduledReferrals = allReferrals.filter((ref: any) => {
          const isScheduledOPD = ref.triage_decision === 'schedule_opd' && ref.scheduled_date;
          if (showCompleted) {
            return isScheduledOPD && ref.status === 'completed';
          } else {
            return isScheduledOPD && ref.status !== 'completed';
          }
        });
        
        setOutpatients(scheduledReferrals);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch outpatient appointments');
        console.error('Error fetching outpatients:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOutpatients();
  }, [showCompleted]);

  // Filter outpatients based on search term
  const filteredOutpatients = outpatients.filter(outpatient =>
    outpatient.patient_full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    outpatient.referral_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    outpatient.referring_hospital_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    outpatient.specialty_needed_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 transition-colors duration-300">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600 dark:text-gray-400">Loading outpatient appointments...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 transition-colors duration-300">
          <div className="text-center">
            <div className="text-red-500 mb-2">Error loading outpatient appointments</div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">{error}</div>
            <Button 
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Outpatient Appointments</h1>
          <p className="text-gray-500 dark:text-gray-400">Scheduled OPD appointments from referral triage</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-300">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {showCompleted ? 'Completed Appointments' : 'Scheduled Appointments'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {showCompleted 
                    ? 'Appointments that have been completed and archived'
                    : user?.permissions?.can_triage_referrals
                    ? 'Patients scheduled for outpatient department visits'
                    : 'View-only access to scheduled outpatient appointments'
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={!showCompleted ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowCompleted(false)}
                  className="text-xs"
                >
                  📅 Active ({!showCompleted ? filteredOutpatients.length : '...'})
                </Button>
                <Button
                  variant={showCompleted ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowCompleted(true)}
                  className="text-xs"
                >
                  ✅ Completed ({showCompleted ? filteredOutpatients.length : '...'})
                </Button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient name, ID, hospital..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Badge variant="outline" className="text-xs">
                {filteredOutpatients.length} appointments
              </Badge>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Patient Info</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Appointment</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Received</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Specialty</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Referring Hospital</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOutpatients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                        {searchTerm 
                          ? 'No appointments match your search' 
                          : showCompleted 
                          ? 'No completed appointments found'
                          : 'No scheduled appointments found'
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredOutpatients.map((outpatient) => (
                      <tr key={outpatient.id} className="border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200">
                        <td className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                              {outpatient.patient_full_name?.split(' ').map(n => n[0]).join('') || 'N/A'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                {outpatient.patient_full_name}
                              </p>
                              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-1">
                                <div className="flex items-center gap-4">
                                  <span>{outpatient.age} yrs • {outpatient.gender?.charAt(0)?.toUpperCase()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate max-w-[200px]">{outpatient.current_address}</span>
                                </div>
                                <div>ID: {outpatient.referral_id}</div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {new Date(outpatient.scheduled_date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {outpatient.scheduled_time}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {new Date(outpatient.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(outpatient.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {(() => {
                                const now = new Date();
                                const created = new Date(outpatient.created_at);
                                const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
                                const diffInDays = Math.floor(diffInHours / 24);
                                
                                if (diffInHours < 1) return 'Just now';
                                if (diffInHours < 24) return `${diffInHours}h ago`;
                                if (diffInDays < 7) return `${diffInDays}d ago`;
                                return `${Math.floor(diffInDays / 7)}w ago`;
                              })()}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
                            {outpatient.specialty_needed_name}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {outpatient.referring_hospital_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Dr. {outpatient.referrer_name}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 gap-1.5 border-slate-300 bg-white/70 px-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-700/60"
                              onClick={() => setSelectedOutpatient(outpatient)}
                              title="Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Details
                            </Button>
                            {!showCompleted && user?.permissions?.can_triage_referrals && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-green-500 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/20"
                                onClick={() => handleMarkAsCompleted(outpatient)}
                                title="Mark as Completed"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            )}
                            {!showCompleted && !user?.permissions?.can_triage_referrals && (
                              <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 text-xs">
                                📅 View Only
                              </Badge>
                            )}
                            {showCompleted && (
                              <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 text-xs">
                                ✅ Completed
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOutpatient && (
        <OutpatientDetailModal 
          outpatient={selectedOutpatient} 
          onClose={() => setSelectedOutpatient(null)}
          showCompleted={showCompleted}
        />
      )}
    </DashboardLayout>
  );
};

export default Outpatient;
