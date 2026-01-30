import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { externalReferralsAPI } from "@/lib/api";
import { 
  User, 
  Activity, 
  MapPin, 
  FileText, 
  Truck, 
  CheckCircle,
  Phone,
  Building2
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
  priorityLevel: string; // "routine", "urgent", "emergent"
  
  // Laboratory Files
  laboratoryFiles: File[];
  
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
  priorityLevel: "urgent",
  
  laboratoryFiles: [],
  
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

const davaoLocations = [
  "Poblacion District", "Buhangin District", "Tugbok District", 
  "Talomo District", "Marilog District", "Calinan District",
  "Baguio District", "Paquibato District", "Toril District"
];

const ExternalReferral = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ReferralFormData>(initialFormData);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const steps = [
    { id: 1, name: "Patient Status", icon: Activity },
    { id: 2, name: "Patient Information", icon: User },
    { id: 3, name: "Specialty Needed", icon: FileText },
    { id: 4, name: "Referring Hospital", icon: MapPin },
    { id: 5, name: "Transit & Consent", icon: Truck }
  ];

  // Fetch hospitals and specialties on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hospitalsResponse, specialtiesResponse] = await Promise.all([
          externalReferralsAPI.getHospitals(),
          externalReferralsAPI.getSpecialties()
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

  const validateForm = () => {
    const errors = [];
    
    // Step 1 - Patient Status validation
    if (!formData.chiefComplaint.trim()) errors.push("Chief Complaint is required");
    if (!formData.pertinentHistory.trim()) errors.push("Pertinent History is required");
    if (!formData.pertinentPhysicalExam.trim()) errors.push("Pertinent Physical Exam is required");
    if (!formData.latestVitalSigns.bp.trim()) errors.push("Blood Pressure is required");
    if (!formData.latestVitalSigns.hr.trim()) errors.push("Heart Rate is required");
    if (!formData.latestVitalSigns.rr.trim()) errors.push("Respiratory Rate is required");
    if (!formData.latestVitalSigns.temp.trim()) errors.push("Temperature is required");
    if (!formData.latestVitalSigns.o2Sat.trim()) errors.push("O2 Saturation is required");
    if (!formData.gcsScore.trim()) errors.push("GCS Score is required");
    if (!formData.o2Support.trim()) errors.push("O2 Support is required");
    if (!formData.admissionStatus) errors.push("Admission Status is required");
    if (!formData.rtpcrResult) errors.push("RTPCR Result is required");
    
    // Step 2 - Patient Information validation
    if (!formData.patientCategory) errors.push("Patient Category is required");
    if (!formData.patientFullName.trim()) errors.push("Patient Full Name is required");
    if (!formData.currentAddress.trim()) errors.push("Current Address is required");
    if (!formData.birthday) errors.push("Birthday is required");
    if (!formData.age.trim()) errors.push("Age is required");
    if (!formData.gender) errors.push("Gender is required");
    
    // Step 3 - Specialty validation
    if (!formData.specialtyNeeded) errors.push("Specialty Needed is required");
    if (!formData.reasonForReferral.trim()) errors.push("Reason for Referral is required");
    
    // Laboratory files validation (optional but recommended)
    if (formData.laboratoryFiles.length === 0) {
      // This is just a warning, not an error
      console.warn("No laboratory files uploaded. Consider uploading relevant medical documents.");
    }
    
    // Step 4 - Referring Hospital validation
    if (!formData.referringFacilityName) errors.push("Referring Facility is required");
    if (!formData.referrerName.trim()) errors.push("Referrer Name is required");
    if (!formData.referrerProfession.trim()) errors.push("Referrer Profession is required");
    if (!formData.referrerCellphone.trim()) errors.push("Referrer Cellphone is required");
    if (!formData.modeOfTransportation.trim()) errors.push("Mode of Transportation is required");
    
    // Transit Info validation (if included)
    if (formData.includeTransitInfo) {
      if (!formData.transitInfo.watcherName.trim()) errors.push("Watcher's Name is required for transit");
      if (!formData.transitInfo.watcherAge.trim()) errors.push("Watcher's Age is required for transit");
      if (!formData.transitInfo.relationToPatient.trim()) errors.push("Relation to Patient is required for transit");
      if (!formData.transitInfo.contactNumber.trim()) errors.push("Contact Number is required for transit");
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Validate form first
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        alert('Please fix the following errors:\n\n' + validationErrors.join('\n'));
        setSubmitting(false);
        return;
      }
      
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
        specialty_needed: parseInt(formData.specialtyNeeded) || 1,
        other_specialty: formData.otherSpecialty || null,
        is_urgent: formData.priorityLevel === "urgent",
        is_emergent: formData.priorityLevel === "emergent",
        reason_for_referral: formData.reasonForReferral,
        
        // Referring Hospital
        referring_hospital: parseInt(formData.referringFacilityName) || 1,
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
            escort_nurse: formData.transitInfo.escortNurse || null,
            driver: formData.transitInfo.driver || null,
            referring_md: formData.transitInfo.referringMD || null,
            referring_facility: formData.transitInfo.referringFacility || null,
            latest_vs: formData.transitInfo.latestVS || null,
            gcs: formData.transitInfo.gcs || null,
            time_ambulance_left: formData.transitInfo.timeAmbulanceLeft || null,
          }
        })
      };

      console.log('Submitting data:', apiData); // Debug log
      console.log('Laboratory files to upload:', formData.laboratoryFiles.length, 'files'); // Debug log
      
      // TODO: Implement file upload functionality
      // For now, we'll submit the referral without files
      // In a full implementation, files would be uploaded separately or as FormData
      
      const response = await externalReferralsAPI.create(apiData);
      
      let successMessage = `Referral submitted successfully! Reference ID: ${response.referral_id}\n\nYour referral has been sent to SPMC Emergency Dispatch and Communication Center for review.`;
      
      if (formData.laboratoryFiles.length > 0) {
        successMessage += `\n\nNote: ${formData.laboratoryFiles.length} laboratory file(s) were selected. Please ensure all medical documents are properly attached for review.`;
      }
      
      alert(successMessage);
      
      // Reset form
      setFormData(initialFormData);
      setCurrentStep(1);
      
    } catch (error: any) {
      console.error('Error creating referral:', error);
      
      // Better error handling
      let errorMessage = 'Failed to submit referral: ';
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          // Validation errors
          if (typeof data === 'object') {
            const errorDetails = [];
            for (const [field, messages] of Object.entries(data)) {
              if (Array.isArray(messages)) {
                errorDetails.push(`${field}: ${messages.join(', ')}`);
              } else {
                errorDetails.push(`${field}: ${messages}`);
              }
            }
            errorMessage += '\n\nValidation errors:\n' + errorDetails.join('\n');
          } else {
            errorMessage += 'Invalid data provided';
          }
        } else if (status === 500) {
          errorMessage += 'Server error. Please try again later.';
        } else {
          errorMessage += `HTTP ${status} error`;
        }
      } else if (error.request) {
        // Network error
        errorMessage += 'Network error. Please check your connection.';
      } else {
        // Other error
        errorMessage += error.message || 'Unknown error';
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
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
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                  <option value="not_done">Not Done</option>
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
                  <option value="emergency_room">Emergency Room</option>
                  <option value="ward">Ward</option>
                  <option value="intensive_care_unit">Intensive Care Unit</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Working Impression
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
                  Management Done
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
                  <option value="new_patient">New Patient of SPMC</option>
                  <option value="known_patient">Old or Known Patient of SPMC</option>
                </select>
              </div>

              {formData.patientCategory === "known_patient" && (
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
                  <option value="male">Male</option>
                  <option value="female">Female</option>
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
                  {specialties.map((specialty) => (
                    <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
                  ))}
                </select>
              </div>

              {specialties.find(s => s.id == formData.specialtyNeeded)?.name === "Others" && (
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
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority Level *
                  </label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                    value={formData.priorityLevel}
                    onChange={(e) => updateFormData('priorityLevel', e.target.value)}
                  >
                    <option value="urgent">⚡ Urgent - Needs prompt care (Amber Priority)</option>
                    <option value="emergent">🚨 Emergent - Immediate attention required (Red Priority)</option>
                  </select>
                  
                  <div className={`p-3 rounded-lg border ${
                    formData.priorityLevel === "emergent" 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  }`}>
                    <p className={`text-sm font-medium ${
                      formData.priorityLevel === "emergent" 
                        ? 'text-red-800 dark:text-red-200' 
                        : 'text-amber-800 dark:text-amber-200'
                    }`}>
                      {formData.priorityLevel === "emergent" 
                        ? '🚨 EMERGENT PRIORITY: This referral will be flagged for immediate attention' 
                        : '⚡ URGENT PRIORITY: This referral will be flagged for prompt care'}
                    </p>
                    <p className={`text-xs mt-1 ${
                      formData.priorityLevel === "emergent" 
                        ? 'text-red-600 dark:text-red-300' 
                        : 'text-amber-600 dark:text-amber-300'
                    }`}>
                      {formData.priorityLevel === "emergent" 
                        ? 'Use for life-threatening conditions requiring immediate intervention' 
                        : 'Use for conditions that need prompt medical attention but are not immediately life-threatening'}
                    </p>
                  </div>
                </div>
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

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">Laboratory Upload</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 mb-3">
                    Please upload pertinent laboratories and medical images (X-rays, CT scans, lab results, etc.)
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                        Upload Files (Images, PDFs, Documents)
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          updateFormData('laboratoryFiles', files);
                        }}
                      />
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Supported formats: Images (JPG, PNG, GIF), PDF, Word documents. Max 10MB per file.
                      </p>
                    </div>
                    
                    {formData.laboratoryFiles.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                          Selected Files ({formData.laboratoryFiles.length}):
                        </p>
                        <div className="space-y-1">
                          {formData.laboratoryFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded border">
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                📎 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newFiles = formData.laboratoryFiles.filter((_, i) => i !== index);
                                  updateFormData('laboratoryFiles', newFiles);
                                }}
                                className="text-red-500 hover:text-red-700 text-sm ml-2"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
                <select 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  value={formData.referringFacilityName}
                  onChange={(e) => updateFormData('referringFacilityName', e.target.value)}
                >
                  <option value="">Select hospital</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
                  ))}
                </select>
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
          <div className="space-y-8 pb-8">
            {/* Consent Section */}
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-3">Consent to Transfer</h4>
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500 mt-1 flex-shrink-0"
                      checked={formData.consentSecured}
                      onChange={(e) => updateFormData('consentSecured', e.target.checked)}
                    />
                    <span className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
                      Was a consent form to transfer secured from the patient/relative prior to this referral?
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Transit Template Section */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="flex items-start space-x-3 mb-6">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1 flex-shrink-0"
                  checked={formData.includeTransitInfo}
                  onChange={(e) => updateFormData('includeTransitInfo', e.target.checked)}
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                    Include Transit Template (for patient transfer)
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                    Check this if the patient will be transferred via ambulance
                  </span>
                </div>
              </label>

              {formData.includeTransitInfo && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-6 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Transit Template Information
                  </h4>
                  
                  {/* Patient & Watcher Info */}
                  <div className="mb-8">
                    <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-4 border-b border-blue-200 dark:border-blue-700 pb-2">Patient & Watcher Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Watcher's Name *
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                          placeholder="Full name of watcher"
                          value={formData.transitInfo.watcherName}
                          onChange={(e) => updateNestedFormData('transitInfo', 'watcherName', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Watcher's Age *
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                          placeholder="Age in years"
                          value={formData.transitInfo.watcherAge}
                          onChange={(e) => updateNestedFormData('transitInfo', 'watcherAge', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Relation to Patient *
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                          placeholder="e.g., Wife, Son, Mother"
                          value={formData.transitInfo.relationToPatient}
                          onChange={(e) => updateNestedFormData('transitInfo', 'relationToPatient', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Contact Number *
                        </label>
                        <input
                          type="tel"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                          placeholder="09XXXXXXXXX"
                          value={formData.transitInfo.contactNumber}
                          onChange={(e) => updateNestedFormData('transitInfo', 'contactNumber', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Transit Team */}
                  <div className="mb-8">
                    <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-4 border-b border-blue-200 dark:border-blue-700 pb-2">Transit Team</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Escort Nurse
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                          placeholder="Nurse name"
                          value={formData.transitInfo.escortNurse}
                          onChange={(e) => updateNestedFormData('transitInfo', 'escortNurse', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Driver
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                          placeholder="Driver name"
                          value={formData.transitInfo.driver}
                          onChange={(e) => updateNestedFormData('transitInfo', 'driver', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Referring MD/Contact
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                          placeholder="Dr. Name / Contact"
                          value={formData.transitInfo.referringMD}
                          onChange={(e) => updateNestedFormData('transitInfo', 'referringMD', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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

                  {/* Medical Information */}
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-4 border-b border-blue-200 dark:border-blue-700 pb-2">Medical Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Latest Vital Signs
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                          rows={3}
                          placeholder="BP: 120/80, HR: 80, RR: 20, Temp: 36.5°C, O2Sat: 98%"
                          value={formData.transitInfo.latestVS}
                          onChange={(e) => updateNestedFormData('transitInfo', 'latestVS', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          GCS Score
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                          placeholder="15 (E4V5M6) or Alert"
                          value={formData.transitInfo.gcs}
                          onChange={(e) => updateNestedFormData('transitInfo', 'gcs', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">SPMC Referral System</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Emergency Dispatch and Communication Center</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Emergency Hotline</p>
              <p className="text-lg font-bold text-blue-600">(082) 227-2731</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[900px]">
          {/* Form Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Patient Referral Form</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Submit a referral request to Southern Philippines Medical Center
            </p>
          </div>

          {/* Progress Steps */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-300 ${
                    currentStep >= step.id 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      currentStep >= step.id 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.name}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 sm:w-16 h-0.5 ml-3 sm:ml-6 transition-colors duration-300 ${
                      currentStep > step.id 
                        ? 'bg-blue-600' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center sm:hidden">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Step {currentStep} of {steps.length}: {steps[currentStep - 1].name}
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 pb-9">
            <div className={`${currentStep === 5 ? 'min-h-[800px]' : 'min-h-[600px]'}`}>
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="w-full sm:w-auto flex items-center gap-2"
              >
                Previous
              </Button>

              <div className="flex gap-3 w-full sm:w-auto">
                {currentStep < steps.length ? (
                  <Button
                    onClick={nextStep}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Submit Referral
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Phone className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Need Assistance?</h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm mt-1">
                For urgent referrals or technical support, contact SPMC Emergency Dispatch:
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-blue-900 dark:text-blue-100 font-medium">📞 (082) 227-2731</p>
                <p className="text-blue-900 dark:text-blue-100 font-medium">� emergency@spmc.gov.ph</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExternalReferral;