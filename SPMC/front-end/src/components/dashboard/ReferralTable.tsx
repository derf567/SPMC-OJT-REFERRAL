import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { EditActionButton } from "@/components/ui/edit-action-button";
import { Badge } from "@/components/ui/badge";
import { Eye, X, Phone, Clock, MapPin, User, FileText, Activity, CheckCircle, Search, Check, AlertCircle, XCircle, UserPlus, Loader2, MoreVertical, Download } from "lucide-react";
import { referralsAPI, departmentsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import jsPDF from "jspdf";

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
  assigned_departments?: string[];
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
  referrer_profession_other?: string;
  referrer_cellphone?: string;
  mode_of_transportation?: string;
  consent_secured?: boolean;
  referring_hospital_location?: string;
  referring_hospital_is_inside_davao?: boolean;
  transit_info?: any;
  // New hospital fields
  hospital_doh_level?: string;
  hospital_location?: string;
  hospital_contact_numbers?: string[];
  contact_numbers?: string[];
  vital_signs_date?: string;
  vital_signs_time?: string;
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
  user,
  setShowTriageModal
}: { 
  referral: ReferralData; 
  onClose: () => void;
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
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Initial Impression</label>
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
            {(referral.bp ||
              referral.hr ||
              referral.rr ||
              referral.temp ||
              referral.o2_sat ||
              referral.gcs_score ||
              referral.o2_support ||
              referral.rtpcr_result ||
              referral.vital_signs_time ||
              referral.vital_signs_date) && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Latest Vital Signs</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* First Row */}
                  {referral.bp && (
                    <div className="text-center p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Blood Pressure</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{referral.bp}</p>
                    </div>
                  )}
                  {referral.hr && (
                    <div className="text-center p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Heart Rate</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{referral.hr} bpm</p>
                    </div>
                  )}
                  {referral.rr && (
                    <div className="text-center p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Respiratory Rate</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{referral.rr} /min</p>
                    </div>
                  )}
                  {/* Second Row */}
                  {referral.temp && (
                    <div className="text-center p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Temperature</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{referral.temp}°C</p>
                    </div>
                  )}
                  {referral.o2_sat && (
                    <div className="text-center p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">O2 Saturation</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{referral.o2_sat}%</p>
                    </div>
                  )}
                  {(referral.vital_signs_time || referral.vital_signs_date) && (
                    <div className="text-center p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time Taken</p>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {referral.vital_signs_date && (
                          <p className="text-xs">{new Date(referral.vital_signs_date).toLocaleDateString()}</p>
                        )}
                        {referral.vital_signs_time && (
                          <p className="text-sm">{referral.vital_signs_time}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {referral.gcs_score && (
                    <div className="text-center p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">GCS Score</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{referral.gcs_score}</p>
                    </div>
                  )}
                  {referral.o2_support && (
                    <div className="text-center p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">O2 Support</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{referral.o2_support}</p>
                    </div>
                  )}
                  {referral.rtpcr_result && (
                    <div className="text-center p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">RTPCR Result</p>
                      <div className="mt-1 flex justify-center">
                        <Badge className={getRtpcrColor(referral.rtpcr_result)}>
                          {referral.rtpcr_result.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
              {referral.hospital_doh_level && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">DOH Level</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1 capitalize">{referral.hospital_doh_level}</p>
                </div>
              )}
              {referral.hospital_location && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.hospital_location}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Referrer Name</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{referral.referrer_name}</p>
              </div>
              {referral.referrer_profession && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Profession</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {referral.referrer_profession === 'others' && referral.referrer_profession_other
                      ? referral.referrer_profession_other
                      : referral.referrer_profession.replace(/_/g, ' ')}
                  </p>
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
          {user?.permissions?.can_triage_referrals && referral.status === 'waiting' && (
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                // Don't close the view dialog - just show triage modal
                // The selectedReferral is already set from the view dialog
                setShowTriageModal(true);
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
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [showChangeDepartmentModal, setShowChangeDepartmentModal] = useState(false);
  const [selectedReferralForDepartmentChange, setSelectedReferralForDepartmentChange] = useState<ReferralData | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [newDepartment, setNewDepartment] = useState("");
  const [triageDecision, setTriageDecision] = useState("");
  const [triageNotes, setTriageNotes] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [dateError, setDateError] = useState("");
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedReferralForTimeline, setSelectedReferralForTimeline] = useState<ReferralData | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedReferralForCancel, setSelectedReferralForCancel] = useState<ReferralData | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [showAssignDepartmentsDialog, setShowAssignDepartmentsDialog] = useState(false);
  const [selectedReferralForAssign, setSelectedReferralForAssign] = useState<ReferralData | null>(null);
  const [openKebabId, setOpenKebabId] = useState<string | null>(null);
  const [kebabPos, setKebabPos] = useState<{ top: number; left: number } | null>(null);
  const kebabRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Close kebab menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) {
        setOpenKebabId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const downloadPatientPDF = (referral: ReferralData) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();   // 210
    const pageH = doc.internal.pageSize.getHeight();  // 297
    const margin = 10;
    const colGap = 6;
    const colW = (pageW - margin * 2 - colGap) / 2;  // ~87mm each
    const labelW = 30;
    const valueW = colW - labelW - 2;

    // ── helpers ──────────────────────────────────────────────────────────────
    const val = (v: any) => (v != null && v !== "" ? String(v) : "N/A");

    // Render a section header; returns new y
    const sectionHeader = (title: string, x: number, y: number) => {
      doc.setFillColor(30, 64, 175);
      doc.rect(x, y, colW, 5, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255);
      doc.text(title.toUpperCase(), x + 2, y + 3.5);
      doc.setTextColor(0);
      return y + 7;
    };

    // Render a label+value row; returns new y
    const row = (label: string, value: any, x: number, y: number) => {
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, x, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(val(value), valueW);
      // cap at 2 lines to stay compact
      const capped = lines.slice(0, 2);
      if (lines.length > 2) capped[1] = capped[1].slice(0, -3) + "...";
      doc.text(capped, x + labelW, y);
      return y + capped.length * 3.8 + 1;
    };

    // ── Page border ───────────────────────────────────────────────────────────
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.5);
    doc.rect(margin - 2, margin - 2, pageW - (margin - 2) * 2, pageH - (margin - 2) * 2);

    // ── Title ─────────────────────────────────────────────────────────────────
    let y = margin + 4;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text("SPMC Patient Referral Information", pageW / 2, y, { align: "center" });
    y += 5;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}   |   Referral ID: ${referral.referral_id}`, pageW / 2, y, { align: "center" });
    y += 3;
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 4;

    // ── Two-column layout ─────────────────────────────────────────────────────
    const leftX = margin;
    const rightX = margin + colW + colGap;

    // LEFT COLUMN
    let ly = y;
    ly = sectionHeader("Referral Details", leftX, ly);
    ly = row("Referral ID",   referral.referral_id, leftX, ly);
    ly = row("Status",        referral.status?.replace(/_/g, " ").toUpperCase(), leftX, ly);
    ly = row("Priority",      referral.priority, leftX, ly);
    ly = row("Date Created",  referral.created_at ? new Date(referral.created_at).toLocaleString() : null, leftX, ly);
    ly += 2;

    ly = sectionHeader("Patient Information", leftX, ly);
    ly = row("Full Name",     referral.patient_full_name, leftX, ly);
    ly = row("Age / Gender",  `${val(referral.age)} yrs / ${val(referral.gender)}`, leftX, ly);
    ly = row("Birthday",      referral.birthday, leftX, ly);
    ly = row("HRN",           referral.hrn, leftX, ly);
    ly = row("Address",       referral.current_address, leftX, ly);
    ly = row("Category",      referral.patient_category?.replace(/_/g, " "), leftX, ly);
    ly += 2;

    ly = sectionHeader("Vital Signs", leftX, ly);
    ly = row("Blood Pressure", referral.bp, leftX, ly);
    ly = row("Heart Rate",    referral.hr ? `${referral.hr} bpm` : null, leftX, ly);
    ly = row("Resp. Rate",    referral.rr ? `${referral.rr} breaths/min` : null, leftX, ly);
    ly = row("Temperature",   referral.temp ? `${referral.temp} °C` : null, leftX, ly);
    ly = row("O2 Saturation", referral.o2_sat ? `${referral.o2_sat}%` : null, leftX, ly);
    ly = row("GCS Score",     referral.gcs_score, leftX, ly);
    ly = row("O2 Support",    referral.o2_support, leftX, ly);
    ly = row("Admission",     referral.admission_status?.replace(/_/g, " "), leftX, ly);
    ly = row("RT-PCR",        referral.rtpcr_result, leftX, ly);
    ly += 2;

    ly = sectionHeader("Referring Facility", leftX, ly);
    ly = row("Hospital",      referral.referring_hospital_name, leftX, ly);
    ly = row("Referrer",      referral.referrer_name, leftX, ly);
    ly = row("Profession",    
      referral.referrer_profession === 'others' && referral.referrer_profession_other
        ? referral.referrer_profession_other
        : referral.referrer_profession, 
      leftX, ly);
    ly = row("Cellphone",     referral.referrer_cellphone, leftX, ly);
    ly = row("Transport",     referral.mode_of_transportation, leftX, ly);
    ly = row("Specialty",     referral.specialty_needed_name, leftX, ly);

    // RIGHT COLUMN
    let ry = y;
    ry = sectionHeader("Clinical Information", rightX, ry);
    ry = row("Chief Complaint",   referral.chief_complaint, rightX, ry);
    ry = row("Initial Impression",referral.working_impression, rightX, ry);
    ry += 2;

    ry = sectionHeader("Pertinent History", rightX, ry);
    // Allow up to 4 lines for longer text fields
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text("History:", rightX, ry);
    doc.setFont("helvetica", "normal");
    const histLines = doc.splitTextToSize(val(referral.pertinent_history), colW - 2).slice(0, 4);
    doc.text(histLines, rightX, ry + 4);
    ry += histLines.length * 3.8 + 6;

    ry = sectionHeader("Physical Exam", rightX, ry);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text("Findings:", rightX, ry);
    doc.setFont("helvetica", "normal");
    const examLines = doc.splitTextToSize(val(referral.pertinent_physical_exam), colW - 2).slice(0, 4);
    doc.text(examLines, rightX, ry + 4);
    ry += examLines.length * 3.8 + 6;

    ry = sectionHeader("Management Done", rightX, ry);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text("Management:", rightX, ry);
    doc.setFont("helvetica", "normal");
    const mgmtLines = doc.splitTextToSize(val(referral.management_done), colW - 2).slice(0, 4);
    doc.text(mgmtLines, rightX, ry + 4);
    ry += mgmtLines.length * 3.8 + 6;

    ry = sectionHeader("Reason for Referral", rightX, ry);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text("Reason:", rightX, ry);
    doc.setFont("helvetica", "normal");
    const reasonLines = doc.splitTextToSize(val(referral.reason_for_referral), colW - 2).slice(0, 5);
    doc.text(reasonLines, rightX, ry + 4);
    ry += reasonLines.length * 3.8 + 6;

    // ── Footer ────────────────────────────────────────────
    const footerY = pageH - margin;
    doc.setDrawColor(200);
    doc.line(margin, footerY - 4, pageW - margin, footerY - 4);
    doc.setFontSize(6);
    doc.setTextColor(150);
    doc.text("Southern Philippines Medical Center — Confidential Patient Record", pageW / 2, footerY, { align: "center" });

    doc.save(`referral-${referral.referral_id}-${referral.patient_full_name.replace(/\s+/g, "_")}.pdf`);
    setOpenKebabId(null);
  };
  
  // Referral Requests page is exclusively for unassigned/new requests.
  const getReferralRequestsQueue = (allReferrals: any[]) =>
    allReferrals.filter((ref: any) => ref.status === "pending");

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const response = await referralsAPI.getAll();
      const allReferrals = response.results || response;
      
      const queue = getReferralRequestsQueue(allReferrals);
      setReferrals(queue);
      console.log('Referral Requests queue:', queue);
      console.log('Sample referral data:', queue[0]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch referrals');
      console.error('Error fetching referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch referrals from API
  useEffect(() => {
    fetchReferrals();
  }, [user]);
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
      
      setReferrals(getReferralRequestsQueue(allReferrals));
      
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

  // Handle confirm arrival (HIS Department action)
  const handleConfirmArrival = async (referralId: string) => {
    try {
      const response = await referralsAPI.confirmArrival(Number(referralId));
      
      // Refresh the referrals list
      const refreshResponse = await referralsAPI.getAll();
      const allReferrals = refreshResponse.results || refreshResponse;
      
      setReferrals(getReferralRequestsQueue(allReferrals));
      
      // Success notification
      toast({
        title: "Arrival Confirmed! ✅",
        description: response.message || "The referral has been marked as arrived and moved to archived referrals.",
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

    // Validate that at least one department is selected
    if (!selectedDepartments || selectedDepartments.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing Department",
        description: "Please select at least one department.",
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
        selectedDepartments,
        triageNotes,
        triageDecision === 'schedule_opd' ? scheduledDate : undefined,
        triageDecision === 'schedule_opd' ? scheduledTime : undefined
      );
      
      // Refresh the referrals list with role-based filtering
      const refreshResponse = await referralsAPI.getAll();
      const allReferrals = refreshResponse.results || refreshResponse;
      
      setReferrals(getReferralRequestsQueue(allReferrals));
      setShowTriageModal(false);
      setSelectedReferral(null);
      setTriageDecision("");
      setTriageNotes("");
      setScheduledDate("");
      setScheduledTime("");
      setDateError("");
      setSelectedDepartments([]); // Reset multiple departments selection
      
      // Success notification with triage decision
      const decisionEmoji = triageDecision === 'emergent' ? '🚨' : 
                           triageDecision === 'urgent' ? '⚡' : '📅';
      const decisionText = triageDecision === 'emergent' ? 'EMERGENT' :
                          triageDecision === 'urgent' ? 'URGENT' :
                          triageDecision.replace('_', ' ').toUpperCase();
      
      const deptNames = selectedDepartments.map(dept => 
        DEPARTMENT_OPTIONS.find(d => d.value === dept)?.label || dept
      ).join(', ');
      
      let successMessage = `The referral has been accepted and marked as: ${decisionText}. Assigned to ${deptNames}. Patient care team has been notified and appropriate care pathway initiated.`;
      
      if (triageDecision === 'schedule_opd') {
        const appointmentDate = new Date(scheduledDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        successMessage = `The referral has been scheduled for OPD appointment on ${appointmentDate} at ${scheduledTime}. Assigned to ${deptNames}. Patient will be notified of the appointment details.`;
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
    const getLatestDate = (...dates: Array<string | undefined | null>) => {
      const validDates = dates
        .filter((date): date is string => Boolean(date))
        .map((date) => ({ raw: date, ts: new Date(date).getTime() }))
        .filter((entry) => !Number.isNaN(entry.ts))
        .sort((a, b) => b.ts - a.ts);

      return validDates.length > 0 ? validDates[0].raw : null;
    };

    const isCancelled = referral.status === 'cancelled';
    const isScheduleOPD = referral.status === 'schedule_opd' || referral.triage_decision === 'schedule_opd';
    
    // Check if disposition finalized (triage has made a decision and assigned departments)
    // This should only be true when triage has actually processed the referral
    const dispositionFinalized = (
      referral.triage_decision || 
      (referral.assigned_departments && referral.assigned_departments.length > 0) ||
      referral.status === 'waiting_acceptance' ||
      referral.status === 'awaiting_triage_verification'
    );
    
    // Check if main service accepted (endorsement complete)
    // This includes when departments have accepted (awaiting_triage_verification) or when dispositioned
    const mainServiceAccepted = referral.status === 'awaiting_triage_verification' ||
                                 referral.status === 'dispositioned' || 
                                 referral.status === 'in_transit' || 
                                 referral.status === 'completed';
    
    // Check if in transit (transit template submitted)
    const inTransit = referral.status === 'in_transit' || referral.status === 'completed';
    
    // Check if completed
    const isCompleted = referral.status === 'completed' || isScheduleOPD;

    const steps = [
      {
        status: 'pending',
        label: 'Request Submitted',
        description: 'Referral request submitted and awaiting review',
        icon: FileText,
        color: 'green',
        completed: true, // Always lit
        date: referral.created_at,
        user: referral.created_by_user || 'Referrer',
        action: 'Created referral request'
      },
      {
        status: 'disposition_finalized',
        label: 'Disposition Finalized',
        description: 'EDCC/EDMA assigned triage level and departments',
        icon: Clock,
        color: 'blue',
        completed: isCancelled
          ? false
          : (isScheduleOPD ? dispositionFinalized : (dispositionFinalized || mainServiceAccepted || inTransit || isCompleted)),
        date: getLatestDate(referral.triaged_at, referral.transferred_at),
        user: referral.triaged_by_user || referral.transferred_by_user || 'EDCC/EDMA',
        action: referral.triage_decision 
          ? `Assigned ${referral.triage_decision.replace('_', ' ').toUpperCase()} priority with Main Service` 
          : 'Assigned to departments'
      },
      {
        status: 'endorsement_complete',
        label: 'Endorsement Complete',
        description: 'Main Service department accepted the referral',
        icon: CheckCircle,
        color: 'cyan',
        completed: isCancelled ? false : (isScheduleOPD ? false : (mainServiceAccepted || inTransit || isCompleted)),
        date: referral.status === 'dispositioned' || referral.status === 'in_transit' || referral.status === 'completed' ? referral.updated_at : null,
        user: 'Main Service Department',
        action: 'Main Service accepted referral'
      },
      {
        status: 'in_transit',
        label: 'In Transit',
        description: 'Transit template submitted - patient in transport',
        icon: MapPin,
        color: 'orange',
        completed: isCancelled ? false : (isScheduleOPD ? false : inTransit),
        date: referral.status === 'in_transit' || referral.status === 'completed' ? referral.updated_at : null,
        user: referral.created_by_user || 'Referrer',
        action: 'Transit form submitted'
      },
      {
        status: 'completed',
        label: isCancelled ? 'Cancelled' : 'Complete',
        description: isCancelled 
          ? 'Referral has been cancelled' 
          : isScheduleOPD 
            ? 'Scheduled for Outpatient Department' 
            : 'Referral process completed successfully',
        icon: isCancelled ? X : CheckCircle,
        color: isCancelled ? 'red' : 'green',
        completed: isCompleted || isCancelled,
        date: (referral.status === 'completed' || referral.status === 'cancelled' || isScheduleOPD) ? referral.updated_at : null,
        user: isCancelled 
          ? (referral.triaged_by_user || referral.transferred_by_user || referral.created_by_user || 'Staff')
          : isScheduleOPD 
            ? 'EDCC/EDMA'
            : 'EDCC/EDMA',
        action: isCancelled 
          ? 'Referral cancelled' 
          : isScheduleOPD 
            ? 'Marked as Schedule OPD and routed to Outpatient Department' 
            : 'Patient arrived and admitted'
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
      
      return matchesSearch;
    })
    .sort((a, b) => {
      // For triage users: Always prioritize 'waiting' status (needs action) at the top
      if (user?.permissions?.can_triage_referrals) {
        const aIsWaiting = a.status === 'waiting';
        const bIsWaiting = b.status === 'waiting';
        
        // If one is waiting and the other is not, waiting comes first
        if (aIsWaiting && !bIsWaiting) return -1;
        if (!aIsWaiting && bIsWaiting) return 1;
        
        // If both are waiting or both are not waiting, continue with normal sorting
      }
      
      let comparison = 0;
      
      switch (sortBy) {
        case "priority":
          // Define priority order based on department needs
          const getDepartmentPriority = (ref: ReferralData) => {
            const specialty = ref.specialty_needed_name?.toLowerCase() || '';
            
            // Priority 5: Cardiology & Emergency/Trauma
            if (specialty.includes('cardiology') || specialty.includes('emergency') || specialty.includes('trauma')) {
              return 5;
            }
            // Priority 4: Surgery & Neurology
            if (specialty.includes('surgery') || specialty.includes('neurology')) {
              return 4;
            }
            // Priority 3: Internal Medicine & Orthopedics
            if (specialty.includes('internal medicine') || specialty.includes('orthopedics')) {
              return 3;
            }
            // Priority 2: Pediatrics
            if (specialty.includes('pediatrics')) {
              return 2;
            }
            // Priority 1: Others
            return 1;
          };
          const aPriority = getDepartmentPriority(a);
          const bPriority = getDepartmentPriority(b);
          comparison = bPriority - aPriority; // Higher priority first by default
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

  // Handle cancel referral
  const handleCancelReferral = async () => {
    if (!selectedReferralForCancel || !cancellationReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a cancellation reason.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCancelling(true);
      await referralsAPI.cancelReferral(
        String(selectedReferralForCancel.id || selectedReferralForCancel.referral_id),
        cancellationReason
      );
      
      toast({
        title: "Success! ✅",
        description: "Referral cancelled successfully.",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      setShowCancelDialog(false);
      setCancellationReason("");
      setSelectedReferralForCancel(null);
      fetchReferrals(); // Reload referrals
    } catch (error: any) {
      console.error('Error cancelling referral:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel referral.",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

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
                  : user?.permissions?.is_his_department
                  ? 'Incoming Referrals - HIS Department'
                  : 'SPMC Emergency Referrals'
                }
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.permissions?.can_transfer_referrals && !user?.permissions?.can_triage_referrals 
                  ? 'Review and transfer new referrals to triage team'
                  : user?.permissions?.can_triage_referrals 
                  ? 'Accept or reject referrals transferred from EDCC (accepted referrals will be removed from queue)'
                  : user?.permissions?.is_his_department
                  ? 'Confirm patient arrivals for urgent, emergent, scheduled OPD, and in-transit referrals'
                  : 'View only access'
                }
              </p>
              {user?.permissions?.can_triage_referrals && (
                <div className="mt-2">
                  {(() => {
                    const waitingCount = referrals.filter(r => r.status === 'waiting').length;
                    if (waitingCount > 0) {
                      return (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                          <AlertCircle className="w-4 h-4" />
                          <span>{waitingCount} referral{waitingCount !== 1 ? 's' : ''} need{waitingCount === 1 ? 's' : ''} your action</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {user?.role_display}
              </Badge>
            </div>
          </div>
          
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
                       : user?.permissions?.is_his_department
                       ? 'No incoming referrals to confirm'
                       : 'No referrals found'
                    }
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((referral) => {
                  // Highlight waiting referrals for triage users (needs action)
                  const needsAction = user?.permissions?.can_triage_referrals && referral.status === 'waiting';
                  const rowClasses = needsAction 
                    ? "border-b border-gray-200/50 dark:border-gray-700/50 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100/70 dark:hover:bg-blue-900/20 transition-colors duration-200 border-l-4 border-l-blue-500"
                    : "border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200";
                  
                  return (
                  <tr key={referral.id || referral.referral_id} className={rowClasses}>
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
                          {referral.is_urgent && referral.status !== 'pending' && (
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
                        {referral.o2_support && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">O2 Sup:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{referral.o2_support}</span>
                          </div>
                        )}
                        {referral.rtpcr_result && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">RTPCR:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{referral.rtpcr_result.replace('_', ' ').toUpperCase()}</span>
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
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(referral.status)}>
                          {referral.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTimelineModal(referral)}
                          className="h-7 gap-1.5 border-blue-200 bg-blue-50 px-2 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/35 whitespace-nowrap"
                          title="Timeline"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          Timeline
                        </Button>
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
                          variant="outline" 
                          size="sm" 
                          className="h-8 gap-1.5 border-slate-300 bg-white/70 px-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-700/60"
                          onClick={() => setSelectedReferral(referral)}
                          title="Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </Button>
                        {/* Edit button for EDCC/Triage users */}
                        {user?.permissions?.can_triage_referrals && (
                          <EditActionButton
                            onClick={() => {
                              const editUrl = `/referral/edit/${referral.id}`;
                              window.location.href = editUrl;
                            }}
                            title="Edit Referral"
                            aria-label="Edit Referral"
                          >
                            Edit
                          </EditActionButton>
                        )}
                        {user?.permissions?.can_triage_referrals && referral.status === 'waiting' && (
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
                        {user?.permissions?.is_his_department && ['urgent', 'emergent', 'schedule_opd', 'in_transit'].includes(referral.status) && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-purple-500 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                            onClick={() => handleConfirmArrival(referral.id || referral.referral_id)}
                            title="Confirm Arrival"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        {/* Assign Departments button for EDCC/EDMA users */}
                        {user?.permissions?.can_transfer_referrals && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 flex items-center gap-1.5"
                            onClick={async () => {
                              // First, transfer to triage if not already in triage
                              try {
                                await referralsAPI.transferToTriageTab(referral.id || referral.referral_id);
                                // Then open the assign departments dialog
                                setSelectedReferralForAssign(referral);
                                setShowAssignDepartmentsDialog(true);
                              } catch (error: any) {
                                console.error('Error transferring to triage:', error);
                                toast({
                                  title: "Transfer Error",
                                  description: error.message || 'Failed to transfer referral to triage',
                                  variant: "destructive",
                                });
                              }
                            }}
                            title="Call & Endorse - Assign Departments"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span className="text-xs font-medium">Call & Endorse</span>
                          </Button>
                        )}
                        {/* Cancel button - available for all users if referral is not already cancelled/completed */}
                        {referral.status !== 'cancelled' && referral.status !== 'completed' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/20"
                            onClick={() => {
                              setSelectedReferralForCancel(referral);
                              setShowCancelDialog(true);
                            }}
                            title="Cancel Referral"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {/* Kebab menu */}
                        <div className="relative" ref={openKebabId === (referral.id || referral.referral_id) ? kebabRef : null}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={(e) => {
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setKebabPos({ top: rect.bottom + 4, left: rect.right - 192 });
                              setOpenKebabId(openKebabId === (referral.id || referral.referral_id) ? null : (referral.id || referral.referral_id));
                            }}
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                          {openKebabId === (referral.id || referral.referral_id) && kebabPos && (
                            <div style={{ position: 'fixed', top: kebabPos.top, left: kebabPos.left }} className="z-50 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1">
                              <button
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => downloadPatientPDF(referral)}
                              >
                                <Download className="w-4 h-4" />
                                Download Patient Info
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                  );
                })
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
          user={user}
          setShowTriageModal={setShowTriageModal}
        />
      )}

      {/* Triage Decision Modal */}
      {showTriageModal && selectedReferral && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
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
              {/* Department Selection - Multiple Selection with Checkboxes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Assigned Departments * (Select one or more)
                </label>
                {selectedReferral.assigned_department && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Initial Assignment from EDCC:</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {DEPARTMENT_OPTIONS.find(d => d.value === selectedReferral.assigned_department)?.icon || '🏥'}
                      </span>
                      <Badge className={`text-xs ${getDepartmentColorClasses(
                        DEPARTMENT_OPTIONS.find(d => d.value === selectedReferral.assigned_department)?.color || 'gray',
                        false
                      )}`}>
                        {DEPARTMENT_OPTIONS.find(d => d.value === selectedReferral.assigned_department)?.label || selectedReferral.assigned_department}
                      </Badge>
                    </div>
                  </div>
                )}
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-700">
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <label 
                      key={dept.value} 
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-600/50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDepartments.includes(dept.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDepartments([...selectedDepartments, dept.value]);
                          } else {
                            setSelectedDepartments(selectedDepartments.filter(d => d !== dept.value));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-lg">{dept.icon}</span>
                      <span className="text-sm text-gray-900 dark:text-white flex-1">{dept.label}</span>
                    </label>
                  ))}
                </div>
                {selectedDepartments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedDepartments.map(deptValue => {
                      const dept = DEPARTMENT_OPTIONS.find(d => d.value === deptValue);
                      return dept ? (
                        <Badge 
                          key={deptValue}
                          className={`text-xs ${getDepartmentColorClasses(dept.color, false)}`}
                        >
                          {dept.icon} {dept.label}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Select all departments that should be involved in this patient's care.
                </p>
              </div>

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
                  <option value="emergent">🚨 Emergent - Immediate attention required (RED)</option>
                  <option value="urgent">⚡ Urgent - Needs prompt care (AMBER)</option>
                  <option value="schedule_opd">📅 Schedule for OPD - Outpatient follow-up</option>
                </select>
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

              {/* Remarks Section - Prominent at the bottom */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-300 dark:border-yellow-700">
                <label className="block text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-2 flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  Remarks / Additional Instructions
                </label>
                <textarea
                  value={triageNotes}
                  onChange={(e) => setTriageNotes(e.target.value)}
                  placeholder="Enter any important remarks, special instructions, or notes for the care team..."
                  className="w-full p-3 border border-yellow-300 dark:border-yellow-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={4}
                />
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">
                  These remarks will be visible to all departments involved in the patient's care.
                </p>
              </div>
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
                  setSelectedDepartments([]);
                }}
              >
                Cancel
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleAcceptWithTriageDecision}
                disabled={!triageDecision || selectedDepartments.length === 0}
              >
                Accept & Apply Decision
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Department Selection Modal - REMOVED: Department selection now happens in Triage tab */}
      {/* showDepartmentModal is no longer used */}

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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Referral Timeline</DialogTitle>
            <DialogDescription className="text-gray-400">
              Track the progress of referral {selectedReferralForTimeline?.referral_id}
            </DialogDescription>
          </DialogHeader>

          {selectedReferralForTimeline && (
            <div className="space-y-6">
              {/* Patient Information */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Patient Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <span className="ml-2 font-medium text-white">{selectedReferralForTimeline.patient_full_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Age/Gender:</span>
                    <span className="ml-2 font-medium text-white">
                      {selectedReferralForTimeline.age} yrs, {selectedReferralForTimeline.gender}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">Chief Complaint:</span>
                    <span className="ml-2 font-medium text-white">{selectedReferralForTimeline.chief_complaint}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative">
                {getTimelineSteps(selectedReferralForTimeline).map((step, index) => {
                  const IconComponent = step.icon;
                  const isCompleted = step.completed;
                  const isLast = index === getTimelineSteps(selectedReferralForTimeline).length - 1;

                  // Get color classes
                  const getColorClasses = () => {
                    if (isCompleted) {
                      switch (step.color) {
                        case 'yellow': return { bg: 'bg-yellow-500', border: 'border-yellow-200', icon: 'text-white' };
                        case 'blue': return { bg: 'bg-blue-500', border: 'border-blue-200', icon: 'text-white' };
                        case 'cyan': return { bg: 'bg-cyan-500', border: 'border-cyan-200', icon: 'text-white' };
                        case 'green': return { bg: 'bg-green-500', border: 'border-green-200', icon: 'text-white' };
                        case 'purple': return { bg: 'bg-purple-500', border: 'border-purple-200', icon: 'text-white' };
                        case 'red': return { bg: 'bg-red-500', border: 'border-red-200', icon: 'text-white' };
                        case 'orange': return { bg: 'bg-orange-500', border: 'border-orange-200', icon: 'text-white' };
                        default: return { bg: 'bg-gray-500', border: 'border-gray-200', icon: 'text-white' };
                      }
                    }
                    return { bg: 'bg-gray-700', border: 'border-gray-600', icon: 'text-gray-500' };
                  };

                  const colors = getColorClasses();

                  return (
                    <div key={step.status} className="flex gap-4 pb-8 relative">
                      {/* Vertical Line */}
                      {!isLast && (
                        <div 
                          className={`absolute left-6 top-12 w-0.5 h-full ${
                            isCompleted ? 'bg-green-500' : 'bg-gray-700'
                          }`}
                        />
                      )}
                      
                      {/* Icon Circle */}
                      <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 ${colors.bg} ${colors.border}`}>
                        <IconComponent className={`w-6 h-6 ${colors.icon}`} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <h4 className={`font-semibold ${isCompleted ? 'text-white' : 'text-gray-500'}`}>
                          {step.label}
                        </h4>
                        <p className={`text-sm ${isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>
                          {step.description}
                        </p>
                        {/* Status Badge */}
                        <div className="mt-2">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </span>
                          ) : index === getTimelineSteps(selectedReferralForTimeline).findIndex(s => !s.completed) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                              <Clock className="w-3 h-3" />
                              In Progress
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-700/50 text-gray-500 text-xs rounded-full border border-gray-600">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </div>
                        {/* Contextual Description */}
                        {!isCompleted && index === getTimelineSteps(selectedReferralForTimeline).findIndex(s => !s.completed) && (
                          <p className="text-xs text-yellow-400/80 mt-1 italic">
                            {step.status === 'disposition_finalized' && 'Waiting for EDCC/EDMA to assign departments'}
                            {step.status === 'endorsement_complete' && 'Waiting for Main Service to accept referral'}
                            {step.status === 'in_transit' && 'Waiting for transit form submission'}
                            {step.status === 'completed' && 'Waiting for process completion'}
                          </p>
                        )}
                        {step.date && isCompleted && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(step.date).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Referral Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Cancel Referral
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this referral?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Patient Info */}
            {selectedReferralForCancel && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedReferralForCancel.patient_full_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Referral ID: {selectedReferralForCancel.referral_id}
                </p>
              </div>
            )}

            {/* Reason Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please provide a reason for cancelling this referral..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white resize-none"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                disabled={cancelling}
              >
                Keep Referral
              </Button>
              <Button
                onClick={handleCancelReferral}
                disabled={cancelling || !cancellationReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {cancelling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Referral
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Departments Dialog */}
      {showAssignDepartmentsDialog && selectedReferralForAssign && (
        <AssignDepartmentsDialogForReferralTable
          referral={selectedReferralForAssign}
          onClose={() => {
            setShowAssignDepartmentsDialog(false);
            setSelectedReferralForAssign(null);
          }}
          onSuccess={() => {
            setShowAssignDepartmentsDialog(false);
            setSelectedReferralForAssign(null);
            // Refresh the referrals list
            const fetchReferrals = async () => {
              try {
                const response = await referralsAPI.getAll();
                const allReferrals = response.results || response;
                setReferrals(getReferralRequestsQueue(allReferrals));
              } catch (error) {
                console.error('Error fetching referrals:', error);
              }
            };
            fetchReferrals();
          }}
        />
      )}
    </>
  );
};

// Assign Departments Dialog Component for ReferralTable
function AssignDepartmentsDialogForReferralTable({ 
  referral, 
  onClose, 
  onSuccess 
}: {
  referral: ReferralData;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [mainServiceCode, setMainServiceCode] = useState<string>('');
  const [triageDecision, setTriageDecision] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [depts, setDepts] = useState<any[]>([]);

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const response = await departmentsAPI.getAll();
        const deptData = Array.isArray(response) ? response : (response.results || []);
        setDepts(deptData);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    fetchDepts();
  }, []);

  const handleSubmit = async () => {
    if (selectedDepts.length === 0) {
      toast({
        title: "Validation Error",
        description: 'Please select at least one department',
        variant: "destructive",
      });
      return;
    }

    if (!triageDecision) {
      toast({
        title: "Validation Error",
        description: 'Please select a triage decision (Emergent/Urgent/Schedule OPD)',
        variant: "destructive",
      });
      return;
    }

    // Validate scheduled date/time for OPD
    if (triageDecision === 'schedule_opd') {
      if (!scheduledDate || !scheduledTime) {
        toast({
          title: "Validation Error",
          description: 'Please select appointment date and time for OPD scheduling',
          variant: "destructive",
        });
        return;
      }

      const selectedDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const now = new Date();
      if (selectedDateTime <= now) {
        toast({
          title: "Validation Error",
          description: 'Cannot schedule appointments in the past. Please select a future date and time.',
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setSubmitting(true);
      
      await referralsAPI.assignDepartments(
        referral.id?.toString() || referral.referral_id, 
        selectedDepts,
        mainServiceCode,
        remarks,
        triageDecision,
        triageDecision === 'schedule_opd' ? scheduledDate : undefined,
        triageDecision === 'schedule_opd' ? scheduledTime : undefined
      );
      
      toast({
        title: "Success",
        description: 'Departments assigned successfully with triage decision!',
        className: "bg-green-50 border-green-200 text-green-800",
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error assigning departments:', error);
      toast({
        title: "Assignment Error",
        description: error.message || 'Failed to assign departments',
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Assign Departments</h2>
        
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
            <span className="font-medium">Referral:</span> {referral.referral_id}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
            <span className="font-medium">Patient:</span> {referral.patient_full_name}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Chief Complaint:</span> {referral.chief_complaint}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Departments <span className="text-red-500">*</span>
            <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">(can select multiple)</span>
          </label>
          <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700">
            {!depts || depts.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No departments available</p>
            ) : (
              depts.map((dept) => (
                <label 
                  key={dept.code} 
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-600 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedDepts.includes(dept.code)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDepts([...selectedDepts, dept.code]);
                      } else {
                        setSelectedDepts(selectedDepts.filter(d => d !== dept.code));
                      }
                    }}
                    className="rounded border-gray-300 dark:border-gray-500 text-blue-600 focus:ring-blue-500 dark:bg-gray-600"
                  />
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{dept.name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{dept.contact_number}</span>
                </label>
              ))
            )}
          </div>
          {selectedDepts.length > 0 && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {selectedDepts.length} department(s) selected
            </p>
          )}
        </div>

        {/* Main Service Selection */}
        {selectedDepts.length > 0 && (
          <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Main Service <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">(optional - primary department)</span>
            </label>
            <div className="space-y-2">
              {depts
                .filter(dept => selectedDepts.includes(dept.code))
                .map((dept) => (
                  <label 
                    key={dept.code} 
                    className="flex items-center space-x-3 p-3 border border-purple-200 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded cursor-pointer bg-white dark:bg-gray-800"
                  >
                    <input
                      type="radio"
                      name="main_service"
                      value={dept.code}
                      checked={mainServiceCode === dept.code}
                      onChange={(e) => setMainServiceCode(e.target.value)}
                      className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{dept.name}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Main service - final decision authority</p>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{dept.contact_number}</span>
                  </label>
                ))}
            </div>
          </div>
        )}

        {/* Triage Decision */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Triage Decision <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTriageDecision('emergent')}
              className={`p-3 border-2 rounded-lg text-center transition-all ${
                triageDecision === 'emergent'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700'
              }`}
            >
              <div className="text-2xl mb-1">🚨</div>
              <div className="font-medium text-sm">Emergent</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Immediate care</div>
            </button>
            
            <button
              type="button"
              onClick={() => setTriageDecision('urgent')}
              className={`p-3 border-2 rounded-lg text-center transition-all ${
                triageDecision === 'urgent'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                  : 'border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700'
              }`}
            >
              <div className="text-2xl mb-1">⚡</div>
              <div className="font-medium text-sm">Urgent</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Priority case</div>
            </button>
            
            <button
              type="button"
              onClick={() => setTriageDecision('schedule_opd')}
              className={`p-3 border-2 rounded-lg text-center transition-all ${
                triageDecision === 'schedule_opd'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700'
              }`}
            >
              <div className="text-2xl mb-1">📅</div>
              <div className="font-medium text-sm">Schedule OPD</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Outpatient</div>
            </button>
          </div>
        </div>

        {/* Scheduled Date/Time for OPD */}
        {triageDecision === 'schedule_opd' && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
            <h4 className="font-medium text-gray-800 dark:text-white mb-3">Schedule Appointment</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Remarks
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            rows={3}
            placeholder="Add any remarks or special instructions..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={submitting}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Assigning...' : 'Assign Departments'}
          </button>
        </div>
      </div>
    </div>
  );
}

