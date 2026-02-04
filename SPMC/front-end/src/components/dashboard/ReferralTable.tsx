import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, X, Phone, Clock, MapPin, User, FileText, Activity, CheckCircle, Search, Truck, AlertTriangle, Check, Calendar } from "lucide-react";
import { referralsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  is_emergent?: boolean;
  created_at: string;
  updated_at?: string;
  assigned_to_name?: string;
  triage_decision?: string;
  triage_notes?: string;
  assigned_department?: string;
  // User tracking fields
  created_by_user?: string;
  transferred_by_user?: string;
  transferred_at?: string;
  triaged_by_user?: string;
  triaged_at?: string;
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

// Department options for EDCC transfer
const DEPARTMENT_OPTIONS = [
  { value: 'emergency', label: 'Emergency Department', icon: '🚨', color: 'red' },
  { value: 'internal_medicine', label: 'Internal Medicine', icon: '🩺', color: 'blue' },
  { value: 'surgery', label: 'Surgery Department', icon: '🔪', color: 'purple' },
  { value: 'obstetrics_gynecology', label: 'Obstetrics and Gynecology', icon: '👶', color: 'pink' },
  { value: 'pediatrics', label: 'Pediatrics', icon: '🧸', color: 'yellow' },
  { value: 'orthopedics', label: 'Orthopedics', icon: '🦴', color: 'orange' },
  { value: 'cardiology', label: 'Cardiology', icon: '❤️', color: 'red' },
  { value: 'neurology', label: 'Neurology', icon: '🧠', color: 'indigo' },
  { value: 'anesthesiology', label: 'Anesthesiology', icon: '💉', color: 'green' },
  { value: 'radiology', label: 'Radiology', icon: '📡', color: 'cyan' },
  { value: 'pathology', label: 'Pathology', icon: '🔬', color: 'violet' },
  { value: 'other', label: 'Other Department', icon: '🏥', color: 'gray' },
];

// Get department color classes
const getDepartmentColorClasses = (color: string, isActive: boolean = false) => {
  const colorMap = {
    red: isActive 
      ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' 
      : 'border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20',
    blue: isActive 
      ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
      : 'border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20',
    purple: isActive 
      ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600' 
      : 'border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-900/20',
    pink: isActive 
      ? 'bg-pink-600 hover:bg-pink-700 text-white border-pink-600' 
      : 'border-pink-300 text-pink-600 hover:bg-pink-50 dark:border-pink-600 dark:text-pink-400 dark:hover:bg-pink-900/20',
    yellow: isActive 
      ? 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600' 
      : 'border-yellow-300 text-yellow-600 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:hover:bg-yellow-900/20',
    orange: isActive 
      ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600' 
      : 'border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400 dark:hover:bg-orange-900/20',
    green: isActive 
      ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
      : 'border-green-300 text-green-600 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20',
    indigo: isActive 
      ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600' 
      : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-600 dark:text-indigo-400 dark:hover:bg-indigo-900/20',
    cyan: isActive 
      ? 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600' 
      : 'border-cyan-300 text-cyan-600 hover:bg-cyan-50 dark:border-cyan-600 dark:text-cyan-400 dark:hover:bg-cyan-900/20',
    violet: isActive 
      ? 'bg-violet-600 hover:bg-violet-700 text-white border-violet-600' 
      : 'border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-600 dark:text-violet-400 dark:hover:bg-violet-900/20',
    gray: isActive 
      ? 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600' 
      : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-900/20',
  };
  return colorMap[color as keyof typeof colorMap] || colorMap.gray;
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
  handleTransferToTriage, 
  user,
  setShowTriageModal,
  setShowChangeDepartmentModal 
}: { 
  referral: ReferralData; 
  onClose: () => void;
  handleTransferToTriage: (id: string) => void;
  user: any;
  setShowTriageModal: (show: boolean) => void;
  setShowChangeDepartmentModal: (show: boolean) => void;
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
              {referral.assigned_department && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Department</label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-lg">
                      {DEPARTMENT_OPTIONS.find(d => d.value === referral.assigned_department)?.icon || '🏥'}
                    </span>
                    <Badge className={`text-xs ${getDepartmentColorClasses(
                      DEPARTMENT_OPTIONS.find(d => d.value === referral.assigned_department)?.color || 'gray',
                      false
                    )}`}>
                      {DEPARTMENT_OPTIONS.find(d => d.value === referral.assigned_department)?.label || referral.assigned_department}
                    </Badge>
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Urgency</label>
                <Badge className={
                  referral.is_emergent 
                    ? "bg-red-100 text-red-800" 
                    : referral.is_urgent 
                    ? "bg-amber-100 text-amber-800"
                    : "bg-blue-100 text-blue-800"
                }>
                  {referral.is_emergent 
                    ? "🚨 Emergent" 
                    : referral.is_urgent 
                    ? "⚡ Urgent" 
                    : "📋 Routine"}
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
          {user?.permissions?.can_triage_referrals && referral.assigned_department && (
            <Button 
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => {
                setShowChangeDepartmentModal(true);
                onClose();
              }}
            >
              Change Department
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
  const [sortBy, setSortBy] = useState<"priority" | "date" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showChangeDepartmentModal, setShowChangeDepartmentModal] = useState(false);
  const [selectedReferralForTransfer, setSelectedReferralForTransfer] = useState<ReferralData | null>(null);
  const [selectedReferralForDepartmentChange, setSelectedReferralForDepartmentChange] = useState<ReferralData | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [triageDecision, setTriageDecision] = useState("");
  const [triageNotes, setTriageNotes] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [dateError, setDateError] = useState("");
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedReferralForTimeline, setSelectedReferralForTimeline] = useState<ReferralData | null>(null);
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

  // Handle transfer to triage (EDCC Personnel action) - Show department selection modal
  const handleTransferToTriage = (referralId: string) => {
    const referral = referrals.find(r => (r.id || r.referral_id) === referralId);
    if (referral) {
      setSelectedReferralForTransfer(referral);
      setShowDepartmentModal(true);
    }
  };

  // Handle department selection and actual transfer
  const handleDepartmentTransfer = async () => {
    if (!selectedReferralForTransfer || !selectedDepartment) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a department before transferring the referral.",
      });
      return;
    }

    try {
      const response = await referralsAPI.transferToTriage(
        selectedReferralForTransfer.id || selectedReferralForTransfer.referral_id, 
        selectedDepartment
      );
      
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
      
      // Close modal and reset state
      setShowDepartmentModal(false);
      setSelectedReferralForTransfer(null);
      setSelectedDepartment("");
      
      // Success notification
      toast({
        title: "Transfer Successful! 🚀",
        description: response.message || "The referral has been successfully transferred to EDMAR/EDHO Triage.",
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

  // Handle department change (Triage user action)
  const handleDepartmentChange = async () => {
    if (!selectedReferralForDepartmentChange || !newDepartment) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a new department.",
      });
      return;
    }

    try {
      const response = await referralsAPI.changeDepartment(
        selectedReferralForDepartmentChange.id || selectedReferralForDepartmentChange.referral_id, 
        newDepartment
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
      
      // Close modal and reset state
      setShowChangeDepartmentModal(false);
      setSelectedReferralForDepartmentChange(null);
      setNewDepartment("");
      
      // Success notification
      toast({
        title: "Department Changed! 🔄",
        description: response.message || "The department assignment has been successfully updated.",
        className: "bg-blue-50 border-blue-200 text-blue-800",
      });
    } catch (err: any) {
      console.error('Error changing department:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to change department';
      toast({
        variant: "destructive",
        title: "Change Failed ❌",
        description: `Failed to change department: ${errorMessage}`,
      });
    }
  };

  // Validate selected date
  const validateScheduledDate = (selectedDate: string) => {
    if (!selectedDate) {
      setDateError("");
      return true;
    }

    const selected = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

    if (selected < today) {
      setDateError("❌ Cannot schedule appointments for past dates. Please select a future date.");
      return false;
    }

    // Check if it's the same day but current time has passed
    if (selected.getTime() === today.getTime() && scheduledTime) {
      const now = new Date();
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      const selectedDateTime = new Date();
      selectedDateTime.setHours(hours, minutes, 0, 0);
      
      if (selectedDateTime <= now) {
        setDateError("❌ Cannot schedule appointments for past times today. Please select a future time.");
        return false;
      }
    }

    setDateError("");
    return true;
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

    // Validate date and time for schedule_opd
    if (triageDecision === 'schedule_opd') {
      if (!scheduledDate || !scheduledTime) {
        toast({
          variant: "destructive",
          title: "Missing Schedule Information",
          description: "Please select both appointment date and time for OPD scheduling.",
        });
        return;
      }

      // Validate that the selected date is not in the past
      if (!validateScheduledDate(scheduledDate)) {
        return; // Error message already shown by validateScheduledDate
      }

      const selectedDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const now = new Date();
      if (selectedDateTime <= now) {
        setDateError("❌ Cannot schedule appointments for past date and time. Please select a future appointment slot.");
        return;
      }
    }

    try {
      await referralsAPI.acceptWithTriageDecision(
        selectedReferral.id || selectedReferral.referral_id,
        triageDecision,
        triageNotes,
        triageDecision === 'schedule_opd' ? scheduledDate : undefined,
        triageDecision === 'schedule_opd' ? scheduledTime : undefined
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
      setScheduledDate("");
      setScheduledTime("");
      setDateError("");
      
      // Success notification with triage decision
      const decisionEmoji = triageDecision === 'critical' ? '🚨' : 
                           triageDecision === 'urgent' ? '⚡' : '📅';
      const decisionText = triageDecision === 'critical' ? 'EMERGENT' :
                          triageDecision === 'urgent' ? 'URGENT' :
                          triageDecision.replace('_', ' ').toUpperCase();
      
      let successMessage = `The referral has been accepted and marked as: ${decisionText}. Patient care team has been notified and appropriate care pathway initiated.`;
      
      if (triageDecision === 'schedule_opd') {
        const appointmentDate = new Date(scheduledDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        successMessage = `The referral has been scheduled for OPD appointment on ${appointmentDate} at ${scheduledTime}. Patient will be notified of the appointment details.`;
      }
      
      toast({
        title: `Referral Accepted! ${decisionEmoji}`,
        description: successMessage,
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

  // Timeline modal functions
  const openTimelineModal = (referral: ReferralData) => {
    setSelectedReferralForTimeline(referral);
    setTimelineModalOpen(true);
  };

  const getTimelineSteps = (referral: ReferralData) => {
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

  // Handle assign to me
  const filteredReferrals = referrals
    .filter(referral => {
      // Search filter
      const matchesSearch = referral.patient_full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        referral.referral_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        referral.chief_complaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        referral.specialty_needed_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        referral.referring_hospital_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        referral.referrer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (referral.hrn && referral.hrn.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Department filter (only for triage users)
      const matchesDepartment = departmentFilter === "all" || 
        referral.assigned_department === departmentFilter ||
        (!referral.assigned_department && departmentFilter === "unassigned");
      
      return matchesSearch && matchesDepartment;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "priority":
          // Define priority order: emergent > urgent > routine
          const getUrgencyLevel = (ref: ReferralData) => {
            if (ref.is_emergent) return 3;
            if (ref.is_urgent) return 2;
            return 1; // routine
          };
          const aUrgency = getUrgencyLevel(a);
          const bUrgency = getUrgencyLevel(b);
          comparison = bUrgency - aUrgency; // Higher urgency first by default
          break;
        case "date":
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
        case "name":
          comparison = a.patient_full_name.localeCompare(b.patient_full_name);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

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
          
          {/* Department Filter Widget - Only show for triage users */}
          {user?.permissions?.can_triage_referrals && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Department</h3>
                <Badge variant="outline" className="text-xs">
                  {filteredReferrals.length} referrals
                </Badge>
              </div>
              
              {/* Department Filter Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                {/* All Departments Button */}
                <Button
                  variant={departmentFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDepartmentFilter("all")}
                  className={`text-xs h-auto py-2 px-3 flex flex-col items-center gap-1 ${
                    departmentFilter === "all" 
                      ? "bg-gray-600 hover:bg-gray-700 text-white" 
                      : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-900/20"
                  }`}
                >
                  <span className="text-lg">📋</span>
                  <span className="text-xs font-medium">All Depts</span>
                  <span className="text-xs opacity-75">({referrals.length})</span>
                </Button>

                {/* Individual Department Buttons */}
                {DEPARTMENT_OPTIONS.map((dept) => {
                  const deptCount = referrals.filter(r => r.assigned_department === dept.value).length;
                  const isActive = departmentFilter === dept.value;
                  
                  return (
                    <Button
                      key={dept.value}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDepartmentFilter(dept.value)}
                      className={`text-xs h-auto py-2 px-3 flex flex-col items-center gap-1 ${getDepartmentColorClasses(dept.color, isActive)}`}
                      disabled={deptCount === 0}
                    >
                      <span className="text-lg">{dept.icon}</span>
                      <span className="text-xs font-medium text-center leading-tight">
                        {dept.label.split(' ').slice(0, 2).join(' ')}
                      </span>
                      <span className="text-xs opacity-75">({deptCount})</span>
                    </Button>
                  );
                })}

                {/* Unassigned Button */}
                <Button
                  variant={departmentFilter === "unassigned" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDepartmentFilter("unassigned")}
                  className={`text-xs h-auto py-2 px-3 flex flex-col items-center gap-1 ${
                    departmentFilter === "unassigned" 
                      ? "bg-amber-600 hover:bg-amber-700 text-white" 
                      : "border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/20"
                  }`}
                >
                  <span className="text-lg">❓</span>
                  <span className="text-xs font-medium">Unassigned</span>
                  <span className="text-xs opacity-75">
                    ({referrals.filter(r => !r.assigned_department).length})
                  </span>
                </Button>
              </div>

              {/* Active Filter Indicator */}
              {departmentFilter !== "all" && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-blue-600 dark:text-blue-400">🔍</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Filtering by: {departmentFilter === "unassigned" 
                        ? "Unassigned Referrals" 
                        : DEPARTMENT_OPTIONS.find(d => d.value === departmentFilter)?.label}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      Showing {filteredReferrals.length} of {referrals.length} referrals
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDepartmentFilter("all")}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    Clear Filter
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Search Bar and Sort Controls */}
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
            
            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "priority" | "date" | "name")}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="priority">Sort by Priority</option>
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
              </select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-2"
                title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
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
                {user?.permissions?.can_triage_referrals && (
                  <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Department</th>
                )}
                <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Status</th>
                <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Date</th>
                <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={user?.permissions?.can_triage_referrals ? 8 : 7} className="p-8 text-center text-gray-500 dark:text-gray-400">
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
                    {user?.permissions?.can_triage_referrals && (
                      <td className="p-4">
                        {referral.assigned_department ? (
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {DEPARTMENT_OPTIONS.find(d => d.value === referral.assigned_department)?.icon || '🏥'}
                            </span>
                            <div>
                              <Badge className={`text-xs ${getDepartmentColorClasses(
                                DEPARTMENT_OPTIONS.find(d => d.value === referral.assigned_department)?.color || 'gray',
                                false
                              )}`}>
                                {DEPARTMENT_OPTIONS.find(d => d.value === referral.assigned_department)?.label || referral.assigned_department}
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 text-xs">
                            ❓ Unassigned
                          </Badge>
                        )}
                      </td>
                    )}
                    <td className="p-4">
                      <div
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openTimelineModal(referral)}
                        title="Click to view timeline"
                      >
                        <Badge className={getStatusColor(referral.status)}>
                          {referral.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </div>
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
          handleTransferToTriage={handleTransferToTriage}
          user={user}
          setShowTriageModal={setShowTriageModal}
          setShowChangeDepartmentModal={(show: boolean) => {
            if (show) {
              setSelectedReferralForDepartmentChange(selectedReferral);
              setNewDepartment(selectedReferral.assigned_department || "");
            }
            setShowChangeDepartmentModal(show);
          }}
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
                  setScheduledDate("");
                  setScheduledTime("");
                  setDateError("");
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
                  <option value="critical">🚨 Emergent - Immediate attention required (RED)</option>
                  <option value="urgent">⚡ Urgent - Needs prompt care (AMBER)</option>
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

              {/* Date and Time Selection for Schedule OPD */}
              {triageDecision === 'schedule_opd' && (
                <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-800 dark:text-green-200">📅 Schedule Appointment</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Appointment Date *
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => {
                          setScheduledDate(e.target.value);
                          validateScheduledDate(e.target.value);
                        }}
                        min={new Date().toISOString().split('T')[0]} // Only allow future dates
                        className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          dateError 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-green-500'
                        }`}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Appointment Time *
                      </label>
                      <select
                        value={scheduledTime}
                        onChange={(e) => {
                          setScheduledTime(e.target.value);
                          if (scheduledDate) {
                            validateScheduledDate(scheduledDate);
                          }
                        }}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">Select time...</option>
                        <option value="08:00">8:00 AM</option>
                        <option value="08:30">8:30 AM</option>
                        <option value="09:00">9:00 AM</option>
                        <option value="09:30">9:30 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="10:30">10:30 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="11:30">11:30 AM</option>
                        <option value="13:00">1:00 PM</option>
                        <option value="13:30">1:30 PM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="14:30">2:30 PM</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="15:30">3:30 PM</option>
                        <option value="16:00">4:00 PM</option>
                        <option value="16:30">4:30 PM</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Date Error Message */}
                  {dateError && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                        {dateError}
                      </p>
                    </div>
                  )}
                  
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Please select a future date and available time slot for the outpatient appointment.
                  </p>
                </div>
              )}

              {triageDecision && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Selected:</strong> {triageDecision === 'critical' ? '🚨 Emergent' : 
                                                triageDecision === 'urgent' ? '⚡ Urgent' : 
                                                '📅 Schedule for OPD'}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    {triageDecision === 'critical' ? 'Patient will be prioritized for immediate care' : 
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
                  setScheduledDate("");
                  setScheduledTime("");
                  setDateError("");
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

      {/* Department Selection Modal */}
      {showDepartmentModal && selectedReferralForTransfer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Select Department
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedReferralForTransfer.referral_id} - {selectedReferralForTransfer.patient_full_name}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setShowDepartmentModal(false);
                  setSelectedReferralForTransfer(null);
                  setSelectedDepartment("");
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">🏥 Department Assignment</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Select the appropriate department for this referral. The referral will be transferred to EDMAR/EDHO Triage 
                  and assigned to the selected department for specialized review.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department *
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select department...</option>
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.icon} {dept.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Patient Summary</h5>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p><strong>Chief Complaint:</strong> {selectedReferralForTransfer.chief_complaint}</p>
                  <p><strong>Specialty Needed:</strong> {selectedReferralForTransfer.specialty_needed_name}</p>
                  <p><strong>Referring Hospital:</strong> {selectedReferralForTransfer.referring_hospital_name}</p>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <div className="text-amber-600 dark:text-amber-400 mt-0.5">⚠️</div>
                  <div>
                    <h5 className="font-medium text-amber-800 dark:text-amber-200">Important</h5>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Once transferred, this referral will be removed from your EDCC queue and appear in the 
                      EDMAR/EDHO Triage queue for the selected department. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDepartmentModal(false);
                  setSelectedReferralForTransfer(null);
                  setSelectedDepartment("");
                }}
              >
                Cancel
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleDepartmentTransfer}
                disabled={!selectedDepartment}
              >
                Transfer to {selectedDepartment ? DEPARTMENT_OPTIONS.find(d => d.value === selectedDepartment)?.label : 'Department'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Department Modal */}
      {showChangeDepartmentModal && selectedReferralForDepartmentChange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Change Department Assignment
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedReferralForDepartmentChange.referral_id} - {selectedReferralForDepartmentChange.patient_full_name}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setShowChangeDepartmentModal(false);
                  setSelectedReferralForDepartmentChange(null);
                  setNewDepartment("");
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">🔄 Department Reassignment</h4>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Change the department assignment for this referral. This will update the department 
                  responsible for reviewing and processing this case.
                </p>
              </div>

              {/* Current Department */}
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Current Assignment</h5>
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {DEPARTMENT_OPTIONS.find(d => d.value === selectedReferralForDepartmentChange.assigned_department)?.icon || '🏥'}
                  </span>
                  <Badge className={`text-xs ${getDepartmentColorClasses(
                    DEPARTMENT_OPTIONS.find(d => d.value === selectedReferralForDepartmentChange.assigned_department)?.color || 'gray',
                    false
                  )}`}>
                    {DEPARTMENT_OPTIONS.find(d => d.value === selectedReferralForDepartmentChange.assigned_department)?.label || 'Unassigned'}
                  </Badge>
                </div>
              </div>

              {/* New Department Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Department *
                </label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select new department...</option>
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <option 
                      key={dept.value} 
                      value={dept.value}
                      disabled={dept.value === selectedReferralForDepartmentChange.assigned_department}
                    >
                      {dept.icon} {dept.label}
                      {dept.value === selectedReferralForDepartmentChange.assigned_department ? ' (Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Patient Summary</h5>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p><strong>Chief Complaint:</strong> {selectedReferralForDepartmentChange.chief_complaint}</p>
                  <p><strong>Specialty Needed:</strong> {selectedReferralForDepartmentChange.specialty_needed_name}</p>
                  <p><strong>Referring Hospital:</strong> {selectedReferralForDepartmentChange.referring_hospital_name}</p>
                </div>
              </div>

              {/* Preview of Change */}
              {newDepartment && newDepartment !== selectedReferralForDepartmentChange.assigned_department && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">📋 Change Preview</h5>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>From:</span>
                      <span className="font-medium">
                        {DEPARTMENT_OPTIONS.find(d => d.value === selectedReferralForDepartmentChange.assigned_department)?.label || 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>To:</span>
                      <span className="font-medium">
                        {DEPARTMENT_OPTIONS.find(d => d.value === newDepartment)?.label}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowChangeDepartmentModal(false);
                  setSelectedReferralForDepartmentChange(null);
                  setNewDepartment("");
                }}
              >
                Cancel
              </Button>
              <Button 
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={handleDepartmentChange}
                disabled={!newDepartment || newDepartment === selectedReferralForDepartmentChange.assigned_department}
              >
                Change to {newDepartment ? DEPARTMENT_OPTIONS.find(d => d.value === newDepartment)?.label : 'Department'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      <Dialog open={timelineModalOpen} onOpenChange={setTimelineModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Referral Timeline - {selectedReferralForTimeline?.referral_id}
            </DialogTitle>
            <DialogDescription>
              Track the complete journey of this referral from submission to completion
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedReferralForTimeline && getTimelineSteps(selectedReferralForTimeline).map((step, index) => {
              const IconComponent = step.icon;
              const isCompleted = step.completed;
              const isCurrent = selectedReferralForTimeline.status === step.status;

              return (
                <div key={step.status} className="flex items-start gap-4">
                  {/* Timeline connector */}
                  {index < getTimelineSteps(selectedReferralForTimeline).length - 1 && (
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
    </>
  );
};