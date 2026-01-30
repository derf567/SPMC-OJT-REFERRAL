import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, X, Phone, Clock, MapPin, User, FileText, Activity, CheckCircle, Search, Truck } from "lucide-react";
import { referralsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

// Define the referral data structure from API
interface ReferralData {
  id: string;
  referral_id: string;
  patient_full_name: string;
  age: number;
  gender: string;
  chief_complaint: string;
  working_impression: string;
  specialty_needed_name: string;
  referring_hospital_name: string;
  referrer_name: string;
  status: string;
  priority: string;
  is_urgent: boolean;
  created_at: string;
  assigned_to_name?: string;
  triage_decision?: string;
  triage_notes?: string;
  // Add other fields as needed for detail view
  pertinent_history?: string;
  pertinent_physical_exam?: string;
  bp?: string;
  hr?: number;
  rr?: number;
  temp?: number;
  o2_sat?: number;
  gcs_score?: string;
  o2_support?: string;
  admission_status?: string;
  rtpcr_result?: string;
  management_done?: string;
  patient_category?: string;
  hrn?: string;
  current_address?: string;
  birthday?: string;
  reason_for_referral?: string;
  referrer_profession?: string;
  referrer_cellphone?: string;
  mode_of_transportation?: string;
  consent_secured?: boolean;
  referring_hospital_location?: string;
  referring_hospital_is_inside_davao?: boolean;
  transit_info?: any;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "in_transit":
      return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
    case "waiting":
      return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
    case "emergent":
      return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
    case "urgent":
      return "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30";
    case "schedule_opd":
      return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
    case "completed":
      return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
    case "pending":
      return "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30";
    default:
      return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "critical":
      return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
    case "urgent":
      return "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30";
    case "routine":
      return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
    default:
      return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
  }
};

const getRtpcrColor = (result: string) => {
  switch (result) {
    case "positive":
      return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
    case "negative":
      return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
    case "not_done":
      return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
    default:
      return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
  }
};

// Detailed referral modal component
const ReferralDetailModal = ({ 
  referral, 
  onClose, 
  handleStatusUpdate, 
  handleTransferToTriage, 
  user,
  setShowTriageModal 
}: { 
  referral: ReferralData; 
  onClose: () => void;
  handleStatusUpdate: (id: string, status: string) => void;
  handleTransferToTriage: (id: string) => void;
  user: any;
  setShowTriageModal: (show: boolean) => void;
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Referral Details - {referral.referral_id}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {referral.patient_full_name} • {referral.age} yrs • {referral.gender}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Patient Status Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Patient Status</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Chief Complaint</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.chief_complaint}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Working Impression</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.working_impression}</p>
              </div>
              {referral.pertinent_history && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pertinent History</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.pertinent_history}</p>
                </div>
              )}
              {referral.pertinent_physical_exam && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Physical Examination</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.pertinent_physical_exam}</p>
                </div>
              )}
            </div>

            {/* Vital Signs */}
            {(referral.bp || referral.hr || referral.rr || referral.temp || referral.o2_sat) && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Latest Vital Signs</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {referral.bp && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Blood Pressure</p>
                      <p className="font-medium text-gray-900 dark:text-white">{referral.bp}</p>
                    </div>
                  )}
                  {referral.hr && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Heart Rate</p>
                      <p className="font-medium text-gray-900 dark:text-white">{referral.hr} bpm</p>
                    </div>
                  )}
                  {referral.rr && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Respiratory Rate</p>
                      <p className="font-medium text-gray-900 dark:text-white">{referral.rr} /min</p>
                    </div>
                  )}
                  {referral.temp && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Temperature</p>
                      <p className="font-medium text-gray-900 dark:text-white">{referral.temp}°C</p>
                    </div>
                  )}
                  {referral.o2_sat && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">O2 Saturation</p>
                      <p className="font-medium text-gray-900 dark:text-white">{referral.o2_sat}%</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {referral.gcs_score && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">GCS Score</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.gcs_score}</p>
                </div>
              )}
              {referral.o2_support && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">O2 Support</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.o2_support}</p>
                </div>
              )}
              {referral.rtpcr_result && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">RTPCR Result</label>
                  <Badge className={getRtpcrColor(referral.rtpcr_result)}>
                    {referral.rtpcr_result.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Patient Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Patient Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              {referral.patient_category && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Patient Category</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {referral.patient_category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
              )}
              {referral.hrn && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">HRN</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.hrn}</p>
                </div>
              )}
              {referral.birthday && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Birthday</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.birthday}</p>
                </div>
              )}
              {referral.admission_status && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Admission Status</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {referral.admission_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
              )}
              {referral.current_address && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Address</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.current_address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Referring Hospital Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Referring Hospital</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Facility Name</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.referring_hospital_name}</p>
              </div>
              {referral.referring_hospital_location && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {referral.referring_hospital_is_inside_davao ? `Davao City - ${referral.referring_hospital_location}` : "Outside Davao City"}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Referrer Name</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.referrer_name}</p>
              </div>
              {referral.referrer_profession && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Profession</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.referrer_profession}</p>
                </div>
              )}
              {referral.referrer_cellphone && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Number</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <p className="text-sm text-gray-900 dark:text-white">{referral.referrer_cellphone}</p>
                  </div>
                </div>
              )}
              {referral.mode_of_transportation && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Transportation</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.mode_of_transportation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Service Needed Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Service Needed</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Specialty Needed</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.specialty_needed_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Urgency</label>
                <Badge className={referral.is_urgent ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                  {referral.is_urgent ? "Urgent" : "Routine"}
                </Badge>
              </div>
              {referral.reason_for_referral && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reason for Referral</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.reason_for_referral}</p>
                </div>
              )}
              {referral.management_done && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Management Done</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.management_done}</p>
                </div>
              )}
            </div>
          </div>

          {/* Transit Information (if available) */}
          {referral.transit_info && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Transit Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Watcher</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {referral.transit_info.watcher_name} ({referral.transit_info.watcher_age} yrs) - {referral.transit_info.relation_to_patient}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Number</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.transit_info.contact_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Escort Nurse</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.transit_info.escort_nurse}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Driver</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.transit_info.driver}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Ambulance Left</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.transit_info.time_ambulance_left}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Consent Secured</label>
                  <Badge className={referral.consent_secured ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {referral.consent_secured ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {user?.permissions?.can_transfer_referrals && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                handleTransferToTriage(referral.id || referral.referral_id);
                onClose();
              }}
            >
              Transfer to EDMAR/EDHO Triage
            </Button>
          )}
          {user?.permissions?.can_triage_referrals && (
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                setShowTriageModal(true);
                onClose();
              }}
            >
              Accept Referral
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const ReferralTable = () => {
  const [selectedReferral, setSelectedReferral] = useState<ReferralData | null>(null);
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [triageDecision, setTriageDecision] = useState("");
  const [triageNotes, setTriageNotes] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch referrals from API
  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        setLoading(true);
        const response = await referralsAPI.getAll();
        const allReferrals = response.results || response;
        
        // Filter referrals based on user role
        let filteredByRole = allReferrals;
        if (user?.permissions?.can_transfer_referrals && !user?.permissions?.can_triage_referrals) {
          // EDCC Personnel: Only show pending referrals (not yet transferred)
          filteredByRole = allReferrals.filter((ref: any) => ref.status === 'pending');
        } else if (user?.permissions?.can_triage_referrals) {
          // Triage Users: Only show waiting referrals (transferred from EDCC, not yet accepted)
          filteredByRole = allReferrals.filter((ref: any) => ref.status === 'waiting');
        }
        
        setReferrals(filteredByRole);
        console.log('Filtered referrals for role:', filteredByRole);
        console.log('Sample referral data:', filteredByRole[0]);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch referrals');
        console.error('Error fetching referrals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, [user]);

  // Handle status update
  const handleStatusUpdate = async (referralId: string, newStatus: string) => {
    try {
      await referralsAPI.updateStatus(referralId, newStatus);
      
      // Refresh the referrals list with role-based filtering
      const response = await referralsAPI.getAll();
      const allReferrals = response.results || response;
      
      let filteredByRole = allReferrals;
      if (user?.permissions?.can_transfer_referrals && !user?.permissions?.can_triage_referrals) {
        // EDCC Personnel: Only show pending referrals
        filteredByRole = allReferrals.filter((ref: any) => ref.status === 'pending');
      } else if (user?.permissions?.can_triage_referrals) {
        // Triage Users: Only show waiting referrals (not yet accepted)
        filteredByRole = allReferrals.filter((ref: any) => ref.status === 'waiting');
      }
      
      setReferrals(filteredByRole);
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: `Failed to update status: ${err.message}`,
      });
    }
  };

  // Handle transfer to triage (EDCC Personnel action)
  const handleTransferToTriage = async (referralId: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      '🚨 TRANSFER CONFIRMATION 🚨\n\n' +
      'Are you sure you want to transfer this referral to EDMAR/EDHO Triage?\n\n' +
      '⚠️  IMPORTANT:\n' +
      '• This referral will be removed from your EDCC queue\n' +
      '• It will appear in the EDMAR/EDHO Triage queue\n' +
      '• You will no longer be able to manage this referral\n' +
      '• This action cannot be undone\n\n' +
      'Click OK to proceed with the transfer.'
    );
    
    if (!confirmed) {
      return; // User cancelled
    }

    try {
      const response = await referralsAPI.transferToTriage(referralId);
      
      // Refresh the referrals list with role-based filtering
      const refreshResponse = await referralsAPI.getAll();
      const allReferrals = refreshResponse.results || refreshResponse;
      
      let filteredByRole = allReferrals;
      if (user?.permissions?.can_transfer_referrals && !user?.permissions?.can_triage_referrals) {
        // EDCC Personnel: Only show pending referrals
        filteredByRole = allReferrals.filter((ref: any) => ref.status === 'pending');
      } else if (user?.permissions?.can_triage_referrals) {
        // Triage Users: Only show waiting referrals (not yet accepted)
        filteredByRole = allReferrals.filter((ref: any) => ref.status === 'waiting');
      }
      
      setReferrals(filteredByRole);
      
      // Success notification
      toast({
        title: "Transfer Successful! 🚀",
        description: "The referral has been successfully transferred to EDMAR/EDHO Triage. It will now appear in their queue for review and decision.",
        className: "bg-green-50 border-green-200 text-green-800",
      });
    } catch (err: any) {
      console.error('Error transferring referral:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to transfer referral';
      toast({
        variant: "destructive",
        title: "Transfer Failed ❌",
        description: `Failed to transfer referral: ${errorMessage}`,
      });
    }
  };

  // Handle accept with triage decision (Triage user action)
  const handleAcceptWithTriageDecision = async () => {
    if (!selectedReferral || !triageDecision) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a triage decision before accepting the referral.",
      });
      return;
    }

    try {
      const response = await referralsAPI.acceptWithTriageDecision(
        selectedReferral.id || selectedReferral.referral_id,
        triageDecision,
        triageNotes
      );
      
      // Refresh the referrals list with role-based filtering
      const refreshResponse = await referralsAPI.getAll();
      const allReferrals = refreshResponse.results || refreshResponse;
      
      let filteredByRole = allReferrals;
      if (user?.permissions?.can_transfer_referrals && !user?.permissions?.can_triage_referrals) {
        filteredByRole = allReferrals.filter((ref: any) => ref.status === 'pending');
      } else if (user?.permissions?.can_triage_referrals) {
        // Triage Users: Only show waiting referrals (not yet accepted)
        filteredByRole = allReferrals.filter((ref: any) => ref.status === 'waiting');
      }
      
      setReferrals(filteredByRole);
      setShowTriageModal(false);
      setSelectedReferral(null);
      setTriageDecision("");
      setTriageNotes("");
      
      // Success notification with triage decision
      const decisionEmoji = triageDecision === 'emergent' ? '🚨' : 
                           triageDecision === 'urgent' ? '⚡' : '📅';
      const decisionText = triageDecision.replace('_', ' ').toUpperCase();
      
      toast({
        title: `Referral Accepted! ${decisionEmoji}`,
        description: `The referral has been accepted and marked as: ${decisionText}. Patient care team has been notified and appropriate care pathway initiated.`,
        className: "bg-green-50 border-green-200 text-green-800",
      });
    } catch (err: any) {
      console.error('Error accepting referral:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to accept referral';
      toast({
        variant: "destructive",
        title: "Accept Failed ❌",
        description: `Failed to accept referral: ${errorMessage}`,
      });
    }
  };

  // Handle assign to me
  const filteredReferrals = referrals.filter(referral =>
    referral.patient_full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referral_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.chief_complaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.specialty_needed_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referring_hospital_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referrer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (referral.hrn && referral.hrn.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 transition-colors duration-300">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600 dark:text-gray-400">Loading referrals...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 transition-colors duration-300">
        <div className="text-center">
          <div className="text-red-500 mb-2">Error loading referrals</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">{error}</div>
          <Button 
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-300">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {user?.permissions?.can_transfer_referrals && !user?.permissions?.can_triage_referrals 
                  ? 'Pending Referrals - EDCC Queue' 
                  : user?.permissions?.can_triage_referrals 
                  ? 'Triage Queue - EDMAR/EDHO' 
                  : 'SPMC Emergency Referrals'
                }
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.permissions?.can_transfer_referrals && !user?.permissions?.can_triage_referrals 
                  ? 'Review and transfer new referrals to triage team'
                  : user?.permissions?.can_triage_referrals 
                  ? 'Accept or reject referrals transferred from EDCC (accepted referrals will be removed from queue)'
                  : 'View only access'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {user?.role_display}
              </Badge>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search referrals by patient name, ID, complaint, specialty..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Badge variant="outline" className="text-xs">
              {filteredReferrals.length} referrals
            </Badge>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Patient Info</th>
                <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Medical Details</th>
                <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Vital Signs</th>
                <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Referring Hospital</th>
                <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Status</th>
                <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Priority</th>
                <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Date</th>
                <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No referrals match your search' : 
                     user?.permissions?.can_transfer_referrals && !user?.permissions?.can_triage_referrals 
                       ? 'No pending referrals in your queue'
                       : user?.permissions?.can_triage_referrals 
                       ? 'No referrals waiting for triage decision'
                       : 'No referrals found'
                    }
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((referral) => (
                  <tr key={referral.id || referral.referral_id} className="border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200">
                    <td className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {referral.patient_full_name?.split(' ').map(n => n[0]).join('') || 'N/A'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {referral.patient_full_name}
                          </p>
                          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-1">
                            <div className="flex items-center gap-4">
                              <span>{referral.age} yrs • {referral.gender?.charAt(0)?.toUpperCase()}</span>
                              {referral.hrn && <span>HRN: {referral.hrn}</span>}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[200px]">{referral.current_address}</span>
                            </div>
                            <div>ID: {referral.referral_id}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {referral.chief_complaint}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {referral.working_impression}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {referral.specialty_needed_name}
                          </Badge>
                          {referral.is_urgent && (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              URGENT
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs space-y-1">
                        {referral.bp && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">BP:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{referral.bp}</span>
                          </div>
                        )}
                        {referral.hr && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">HR:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{referral.hr} bpm</span>
                          </div>
                        )}
                        {referral.temp && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Temp:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{referral.temp}°C</span>
                          </div>
                        )}
                        {referral.o2_sat && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">O2:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{referral.o2_sat}%</span>
                          </div>
                        )}
                        {referral.gcs_score && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">GCS:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{referral.gcs_score}</span>
                          </div>
                        )}
                        {(!referral.bp && !referral.hr && !referral.temp && !referral.o2_sat && !referral.gcs_score) && (
                          <div className="text-gray-400 dark:text-gray-500 text-xs">
                            No vital signs recorded
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {referral.referring_hospital_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Dr. {referral.referrer_name}
                        </p>
                        {referral.referrer_cellphone && (
                          <div className="flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {referral.referrer_cellphone}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusColor(referral.status)}>
                        {referral.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={getPriorityColor(referral.priority)}>
                        {referral.priority?.charAt(0)?.toUpperCase() + referral.priority?.slice(1)}
                      </Badge>
                    </td>
                    <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(referral.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(referral.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setSelectedReferral(referral)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {user?.permissions?.can_transfer_referrals && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-500 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                            onClick={() => handleTransferToTriage(referral.id || referral.referral_id)}
                            title="Transfer to EDMAR/EDHO Triage"
                          >
                            <Truck className="w-4 h-4" />
                          </Button>
                        )}
                        {user?.permissions?.can_triage_referrals && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-500 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/20"
                            onClick={() => {
                              setSelectedReferral(referral);
                              setShowTriageModal(true);
                            }}
                            title="Accept Referral"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
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

      {/* Detail Modal */}
      {selectedReferral && (
        <ReferralDetailModal 
          referral={selectedReferral} 
          onClose={() => setSelectedReferral(null)}
          handleStatusUpdate={handleStatusUpdate}
          handleTransferToTriage={handleTransferToTriage}
          user={user}
          setShowTriageModal={setShowTriageModal}
        />
      )}

      {/* Triage Decision Modal */}
      {showTriageModal && selectedReferral && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Accept Referral
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedReferral.referral_id} - {selectedReferral.patient_full_name}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setShowTriageModal(false);
                  setTriageDecision("");
                  setTriageNotes("");
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Triage Decision *
                </label>
                <select
                  value={triageDecision}
                  onChange={(e) => setTriageDecision(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select triage decision...</option>
                  <option value="emergent">🚨 Emergent - Immediate attention required</option>
                  <option value="urgent">⚡ Urgent - Needs prompt care</option>
                  <option value="schedule_opd">📅 Schedule for OPD - Outpatient follow-up</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={triageNotes}
                  onChange={(e) => setTriageNotes(e.target.value)}
                  placeholder="Add any additional notes or instructions..."
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>

              {triageDecision && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Selected:</strong> {triageDecision === 'emergent' ? '🚨 Emergent' : 
                                                triageDecision === 'urgent' ? '⚡ Urgent' : 
                                                '📅 Schedule for OPD'}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    {triageDecision === 'emergent' ? 'Patient will be prioritized for immediate care' : 
                     triageDecision === 'urgent' ? 'Patient will receive prompt attention' : 
                     'Patient will be scheduled for outpatient follow-up'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowTriageModal(false);
                  setTriageDecision("");
                  setTriageNotes("");
                }}
              >
                Cancel
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleAcceptWithTriageDecision}
                disabled={!triageDecision}
              >
                Accept & Apply Decision
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};