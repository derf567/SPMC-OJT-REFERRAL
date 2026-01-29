import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { referralsAPI, hospitalsAPI, specialtiesAPI } from "@/lib/api";
import { 
  User, 
  Activity, 
  MapPin, 
  FileText, 
  Truck, 
  CheckCircle,
  AlertCircle,
  Phone,
  Calendar,
  Clock
} from "lucide-react";

interface ReferralFormData {
  // Patient Status
  chiefComplaint: string;
  pertinentHistory: string;
  pertinentPhysicalExam: string;
  latestVitalSigns: {
    bp: string;
    hr: string;
    rr: string;
    temp: string;
    o2Sat: string;
  };
  gcsScore: string;
  o2Support: string;
  admissionStatus: string;
  rtpcrResult: string;
  workingImpression: string;
  managementDone: string;
  
  // Patient Information
  patientCategory: string;
  hrn: string;
  patientFullName: string;
  currentAddress: string;
  birthday: string;
  age: string;
  gender: string;
  
  // Specialty Needed
  specialtyNeeded: string;
  otherSpecialty: string;
  isUrgent: boolean;
  
  // Referring Hospital
  isInsideDavaoCity: boolean;
  hospitalLocation: string;
  referringFacilityName: string;
  referrerName: string;
  referrerProfession: string;
  referrerCellphone: string;
  modeOfTransportation: string;
  
  // Consent & Transfer
  consentSecured: boolean;
  reasonForReferral: string;
  
  // Transit Template
  includeTransitInfo: boolean;
  transitInfo: {
    watcherName: string;
    watcherAge: string;
    relationToPatient: string;
    contactNumber: string;
    escortNurse: string;
    driver: string;
    referringMD: string;
    referringFacility: string;
    latestVS: string;
    gcs: string;
    timeAmbulanceLeft: string;
  };
}

const initialFormData: ReferralFormData = {
  chiefComplaint: "",
  pertinentHistory: "",
  pertinentPhysicalExam: "",
  latestVitalSigns: { bp: "", hr: "", rr: "", temp: "", o2Sat: "" },
  gcsScore: "",
  o2Support: "",
  admissionStatus: "",
  rtpcrResult: "",
  workingImpression: "",
  managementDone: "",
  
  patientCategory: "",
  hrn: "",
  patientFullName: "",
  currentAddress: "",
  birthday: "",
  age: "",
  gender: "",
  
  specialtyNeeded: "",
  otherSpecialty: "",
  isUrgent: false,
  
  isInsideDavaoCity: true,
  hospitalLocation: "",
  referringFacilityName: "",
  referrerName: "",
  referrerProfession: "",
  referrerCellphone: "",
  modeOfTransportation: "",
  
  consentSecured: false,
  reasonForReferral: "",
  
  includeTransitInfo: false,
  transitInfo: {
    watcherName: "",
    watcherAge: "",
    relationToPatient: "",
    contactNumber: "",
    escortNurse: "",
    driver: "",
    referringMD: "",
    referringFacility: "",
    latestVS: "",
    gcs: "",
    timeAmbulanceLeft: ""
  }
};

const specialties = [
  "Cardiology", "Emergency Medicine", "Internal Medicine", "Surgery", 
  "Obstetrics and Gynecology", "Pediatrics", "Orthopedics", "Neurology",
  "Psychiatry", "Radiology", "Anesthesiology", "Pathology", "Others"
];

const davaoLocations = [
  "Poblacion District", "Buhangin District", "Tugbok District", 
  "Talomo District", "Marilog District", "Calinan District",
  "Baguio District", "Paquibato District", "Toril District"
];

const NewReferral = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ReferralFormData>(initialFormData);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch hospitals and specialties on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hospitalsResponse, specialtiesResponse] = await Promise.all([
          hospitalsAPI.getAll(),
          specialtiesAPI.getAll()
        ]);
        
        setHospitals(hospitalsResponse.results || hospitalsResponse);
        setSpecialties(specialtiesResponse.results || specialtiesResponse);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const steps = [
    { id: 1, name: "Patient Status", icon: Activity },
    { id: 2, name: "Patient Information", icon: User },
    { id: 3, name: "Specialty Needed", icon: FileText },
    { id: 4, name: "Referring Hospital", icon: MapPin },
    { id: 5, name: "Transit & Consent", icon: Truck }
  ];

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedFormData = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof ReferralFormData] as any,
        [field]: value
      }
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // Transform form data to match API expectations
      const apiData = {
        // Patient Status
        chief_complaint: formData.chiefComplaint,
        pertinent_history: formData.pertinentHistory,
        pertinent_physical_exam: formData.pertinentPhysicalExam,
        bp: formData.latestVitalSigns.bp,
        hr: parseInt(formData.latestVitalSigns.hr) || 0,
        rr: parseInt(formData.latestVitalSigns.rr) || 0,
        temp: parseFloat(formData.latestVitalSigns.temp) || 0,
        o2_sat: parseInt(formData.latestVitalSigns.o2Sat) || 0,
        gcs_score: formData.gcsScore,
        o2_support: formData.o2Support,
        admission_status: formData.admissionStatus,
        rtpcr_result: formData.rtpcrResult,
        working_impression: formData.workingImpression,
        management_done: formData.managementDone,
        
        // Patient Information
        patient_category: formData.patientCategory,
        hrn: formData.hrn || null,
        patient_full_name: formData.patientFullName,
        current_address: formData.currentAddress,
        birthday: formData.birthday,
        age: parseInt(formData.age) || 0,
        gender: formData.gender,
        
        // Specialty Needed
        specialty_needed: parseInt(formData.specialtyNeeded) || 1, // Will need to get specialty ID
        other_specialty: formData.otherSpecialty || null,
        is_urgent: formData.isUrgent,
        reason_for_referral: formData.reasonForReferral,
        
        // Referring Hospital
        referring_hospital: parseInt(formData.referringFacilityName) || 1, // Will need to get hospital ID
        referrer_name: formData.referrerName,
        referrer_profession: formData.referrerProfession,
        referrer_cellphone: formData.referrerCellphone,
        mode_of_transportation: formData.modeOfTransportation,
        
        // Consent
        consent_secured: formData.consentSecured,
        
        // Transit Info (if included)
        ...(formData.includeTransitInfo && {
          transit_info: {
            watcher_name: formData.transitInfo.watcherName,
            watcher_age: parseInt(formData.transitInfo.watcherAge) || 0,
            relation_to_patient: formData.transitInfo.relationToPatient,
            contact_number: formData.transitInfo.contactNumber,
            escort_nurse: formData.transitInfo.escortNurse,
            driver: formData.transitInfo.driver,
            referring_md: formData.transitInfo.referringMD,
            referring_facility: formData.transitInfo.referringFacility,
            latest_vs: formData.transitInfo.latestVS,
            gcs: formData.transitInfo.gcs,
            time_ambulance_left: formData.transitInfo.timeAmbulanceLeft,
          }
        })
      };

      const response = await referralsAPI.create(apiData);
      alert(`Referral created successfully! ID: ${response.referral_id}`);
      
      // Reset form or redirect
      setFormData(initialFormData);
      setCurrentStep(1);
      
    } catch (error: any) {
      console.error('Error creating referral:', error);
      alert('Failed to create referral: ' + (error.message || 'Unknown error'));
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chief Complaint *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  rows={3}
                  placeholder="Describe the main complaint..."
                  value={formData.chiefComplaint}
                  onChange={(e) => updateFormData('chiefComplaint', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pertinent History *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  rows={3}
                  placeholder="Medical history, previous conditions..."
                  value={formData.pertinentHistory}
                  onChange={(e) => updateFormData('pertinentHistory', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pertinent Physical Exam or Laboratories *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  rows={3}
                  placeholder="Physical examination findings, lab results..."
                  value={formData.pertinentPhysicalExam}
                  onChange={(e) => updateFormData('pertinentPhysicalExam', e.target.value)}
                />
              </div>
            </div>

            {/* Vital Signs */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Latest Vital Signs *</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Blood Pressure
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                    placeholder="120/80"
                    value={formData.latestVitalSigns.bp}
                    onChange={(e) => updateNestedFormData('latestVitalSigns', 'bp', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Heart Rate
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                    placeholder="80"
                    value={formData.latestVitalSigns.hr}
                    onChange={(e) => updateNestedFormData('latestVitalSigns', 'hr', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Respiratory Rate
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                    placeholder="20"
                    value={formData.latestVitalSigns.rr}
                    onChange={(e) => updateNestedFormData('latestVitalSigns', 'rr', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Temperature
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                    placeholder="36.5"
                    value={formData.latestVitalSigns.temp}
                    onChange={(e) => updateNestedFormData('latestVitalSigns', 'temp', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    O2 Saturation
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                    placeholder="98"
                    value={formData.latestVitalSigns.o2Sat}
                    onChange={(e) => updateNestedFormData('latestVitalSigns', 'o2Sat', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  GCS Score or AVPU *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  placeholder="15 (E4V5M6) or Alert"
                  value={formData.gcsScore}
                  onChange={(e) => updateFormData('gcsScore', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  O2 Support *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  placeholder="Room air, Nasal cannula 2L/min"
                  value={formData.o2Support}
                  onChange={(e) => updateFormData('o2Support', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  RTPCR Result *
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  value={formData.rtpcrResult}
                  onChange={(e) => updateFormData('rtpcrResult', e.target.value)}
                >
                  <option value="">Select result</option>
                  <option value="Positive">Positive</option>
                  <option value="Negative">Negative</option>
                  <option value="Not Done">Not Done</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admission Status *
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  value={formData.admissionStatus}
                  onChange={(e) => updateFormData('admissionStatus', e.target.value)}
                >
                  <option value="">Select status</option>
                  <option value="Emergency Room">Emergency Room</option>
                  <option value="Ward">Ward</option>
                  <option value="Intensive Care Unit">Intensive Care Unit</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Working Impression (Automatic)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  rows={3}
                  placeholder="Primary diagnosis or impression..."
                  value={formData.workingImpression}
                  onChange={(e) => updateFormData('workingImpression', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Management Done (Automatic)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  rows={3}
                  placeholder="Treatments, medications given..."
                  value={formData.managementDone}
                  onChange={(e) => updateFormData('managementDone', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Patient Category *
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  value={formData.patientCategory}
                  onChange={(e) => updateFormData('patientCategory', e.target.value)}
                >
                  <option value="">Select category</option>
                  <option value="New Patient of SPMC">New Patient of SPMC</option>
                  <option value="Old or Known Patient of SPMC">Old or Known Patient of SPMC</option>
                </select>
              </div>

              {formData.patientCategory === "Old or Known Patient of SPMC" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hospital Record Number (HRN)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                    placeholder="SPMC-YYYY-XXXXXX or N/A"
                    value={formData.hrn}
                    onChange={(e) => updateFormData('hrn', e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Patient's Full Name *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  placeholder="Last Name, First Name Middle Name"
                  value={formData.patientFullName}
                  onChange={(e) => updateFormData('patientFullName', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Birthday *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  value={formData.birthday}
                  onChange={(e) => updateFormData('birthday', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  placeholder="Age in years"
                  value={formData.age}
                  onChange={(e) => updateFormData('age', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gender *
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  value={formData.gender}
                  onChange={(e) => updateFormData('gender', e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Patient Current Complete Address *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  rows={3}
                  placeholder="Complete address including barangay, city, province"
                  value={formData.currentAddress}
                  onChange={(e) => updateFormData('currentAddress', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Which Specialty/Service is Needed *
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  value={formData.specialtyNeeded}
                  onChange={(e) => updateFormData('specialtyNeeded', e.target.value)}
                >
                  <option value="">Select specialty</option>
                  {specialties.map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
                </select>
              </div>

              {formData.specialtyNeeded === "Others" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Please specify the required specialty or service needed
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                    placeholder="Specify other specialty"
                    value={formData.otherSpecialty}
                    onChange={(e) => updateFormData('otherSpecialty', e.target.value)}
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={formData.isUrgent}
                    onChange={(e) => updateFormData('isUrgent', e.target.checked)}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mark as Urgent
                  </span>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Referral *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  rows={4}
                  placeholder="Explain why the patient needs to be referred to SPMC..."
                  value={formData.reasonForReferral}
                  onChange={(e) => updateFormData('reasonForReferral', e.target.value)}
                />
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Laboratory Upload</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Please upload pertinent laboratories and images or send directly through Viber (0915) 541 3040
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Hospital Location *
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="hospitalLocation"
                      className="text-blue-600 focus:ring-blue-500"
                      checked={formData.isInsideDavaoCity}
                      onChange={() => updateFormData('isInsideDavaoCity', true)}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Inside Davao City
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="hospitalLocation"
                      className="text-blue-600 focus:ring-blue-500"
                      checked={!formData.isInsideDavaoCity}
                      onChange={() => updateFormData('isInsideDavaoCity', false)}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Outside Davao City
                    </span>
                  </label>
                </div>
              </div>

              {formData.isInsideDavaoCity && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Choose Location in Davao City
                  </label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                    value={formData.hospitalLocation}
                    onChange={(e) => updateFormData('hospitalLocation', e.target.value)}
                  >
                    <option value="">Select location</option>
                    {davaoLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Complete Name of Referring Facility *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  placeholder="Hospital/Clinic name"
                  value={formData.referringFacilityName}
                  onChange={(e) => updateFormData('referringFacilityName', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name of the Referrer *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  placeholder="Dr. Full Name"
                  value={formData.referrerName}
                  onChange={(e) => updateFormData('referrerName', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profession of the Referrer *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  placeholder="e.g., Emergency Medicine Physician"
                  value={formData.referrerProfession}
                  onChange={(e) => updateFormData('referrerProfession', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cellphone Number of the Referrer *
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  placeholder="09XXXXXXXXX"
                  value={formData.referrerCellphone}
                  onChange={(e) => updateFormData('referrerCellphone', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mode of Transportation *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  placeholder="Ambulance, Private vehicle, etc."
                  value={formData.modeOfTransportation}
                  onChange={(e) => updateFormData('modeOfTransportation', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200">Consent to Transfer</h4>
                  <label className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      checked={formData.consentSecured}
                      onChange={(e) => updateFormData('consentSecured', e.target.checked)}
                    />
                    <span className="text-sm text-green-700 dark:text-green-300">
                      Was a consent form to transfer secured from the patient/relative prior to this referral?
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.includeTransitInfo}
                  onChange={(e) => updateFormData('includeTransitInfo', e.target.checked)}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Include Transit Template (for patient transfer)
                </span>
              </label>
            </div>

            {formData.includeTransitInfo && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Transit Template</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Watcher's Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                      value={formData.transitInfo.watcherName}
                      onChange={(e) => updateNestedFormData('transitInfo', 'watcherName', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Watcher's Age
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                      value={formData.transitInfo.watcherAge}
                      onChange={(e) => updateNestedFormData('transitInfo', 'watcherAge', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Relation to Patient
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                      placeholder="Wife, Son, etc."
                      value={formData.transitInfo.relationToPatient}
                      onChange={(e) => updateNestedFormData('transitInfo', 'relationToPatient', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                      value={formData.transitInfo.contactNumber}
                      onChange={(e) => updateNestedFormData('transitInfo', 'contactNumber', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Escort Nurse
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                      value={formData.transitInfo.escortNurse}
                      onChange={(e) => updateNestedFormData('transitInfo', 'escortNurse', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Driver
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                      value={formData.transitInfo.driver}
                      onChange={(e) => updateNestedFormData('transitInfo', 'driver', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Referring MD/Contact
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                      value={formData.transitInfo.referringMD}
                      onChange={(e) => updateNestedFormData('transitInfo', 'referringMD', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Time Ambulance Left
                    </label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                      value={formData.transitInfo.timeAmbulanceLeft}
                      onChange={(e) => updateNestedFormData('transitInfo', 'timeAmbulanceLeft', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Referral</h1>
          <p className="text-gray-500 dark:text-gray-400">SPMC Emergency Dispatch and Communication Center Referral Form</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-300 ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    currentStep >= step.id 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.name}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 ml-6 transition-colors duration-300 ${
                    currentStep > step.id 
                      ? 'bg-blue-600' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              Previous
            </Button>

            <div className="flex gap-3">
              {currentStep < steps.length ? (
                <Button
                  onClick={nextStep}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Submit Referral
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewReferral;