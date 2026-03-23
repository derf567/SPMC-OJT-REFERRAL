import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { externalReferralsAPI, referrerAPI, referralsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { AboutUsDialog } from "@/components/ui/AboutUsDialog";
import { 
  fetchRegions, 
  fetchProvinces, 
  fetchCitiesMunicipalities,
  type Region,
  type Province,
  type CityMunicipality
} from "@/services/psaApi";
import { 
  User, 
  Activity, 
  MapPin, 
  FileText, 
  Truck, 
  CheckCircle,
  Phone,
  Building2,
  Info,
  ArrowLeft
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
    vitalSignsDate: string;
    timeTaken: string;
  };
  gcsScore: string;
  o2Support: string;
  admissionStatus: string;
  admissionStatusOther: string;
  rtpcrResult: string;
  workingImpression: string;
  managementDone: string;
  
  // Patient Information
  patientCategory: string;
  hrn: string;
  patientFirstName: string;
  patientMiddleName: string;
  patientLastName: string;
  patientSuffix: string;
  currentAddress: string;
  birthday: string;
  age: string;
  gender: string;
  
  // Specialty Needed
  specialtyNeeded: string;
  otherSpecialty: string;
  
  // Laboratory Files
  laboratoryFiles: File[];
  
  // Referring Hospital
  isInsideDavaoCity: boolean;
  hospitalLocation: string;
  referringFacilityName: string;
  hospitalDohLevel: string;
  hospitalContactNumbers: string[];
  // Detailed address fields
  hospitalRegion: string;
  hospitalStreet: string;
  hospitalBarangay: string;
  hospitalDistrict: string;
  hospitalCity: string;
  hospitalProvince: string;
  referrerName: string;
  referrerProfession: string;
  referrerProfessionOther: string;
  referrerCellphone: string;
  referrerContactNumbers: string[];
  modeOfTransportation: string;
  modeOfTransportationOther: string;
  
  // Consent & Transfer
  consentSecured: boolean;
  reasonForReferral: string;
  otherReasonForReferral: string;
}

const initialFormData: ReferralFormData = {
  chiefComplaint: "",
  pertinentHistory: "",
  pertinentPhysicalExam: "",
  latestVitalSigns: { bp: "", hr: "", rr: "", temp: "", o2Sat: "", vitalSignsDate: "", timeTaken: "" },
  gcsScore: "",
  o2Support: "",
  admissionStatus: "",
  admissionStatusOther: "",
  rtpcrResult: "",
  workingImpression: "",
  managementDone: "",
  
  patientCategory: "",
  hrn: "",
  patientFirstName: "",
  patientMiddleName: "",
  patientLastName: "",
  patientSuffix: "",
  currentAddress: "",
  birthday: "",
  age: "",
  gender: "",
  
  specialtyNeeded: "",
  otherSpecialty: "",
  
  laboratoryFiles: [],
  
  isInsideDavaoCity: true,
  hospitalLocation: "",
  referringFacilityName: "",
  hospitalDohLevel: "",
  hospitalContactNumbers: [],
  hospitalRegion: "",
  hospitalStreet: "",
  hospitalBarangay: "",
  hospitalDistrict: "",
  hospitalCity: "",
  hospitalProvince: "",
  referrerName: "",
  referrerProfession: "",
  referrerProfessionOther: "",
  referrerCellphone: "",
  referrerContactNumbers: [],
  modeOfTransportation: "",
  modeOfTransportationOther: "",
  
  consentSecured: false,
  reasonForReferral: "",
  otherReasonForReferral: "",
};

const ExternalReferral = () => {
  const { id } = useParams(); // Get referral ID from URL if editing
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ReferralFormData>(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set());
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referrerProfile, setReferrerProfile] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalReferral, setOriginalReferral] = useState<any>(null);
  
  // PSGC API state
  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<CityMunicipality[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  
  // Contact number input states - removed all contact input states
  const [referrerContactInput, setReferrerContactInput] = useState("");
  
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load hospitals, specialties, and referrer profile on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load hospitals and specialties independently so one failure doesn't block the other
        const [hospitalsResult, specialtiesResult] = await Promise.allSettled([
          externalReferralsAPI.getHospitals(),
          externalReferralsAPI.getSpecialties()
        ]);

        if (hospitalsResult.status === 'fulfilled') {
          const hospitalsData = hospitalsResult.value;
          setHospitals(hospitalsData.results || hospitalsData);
        } else {
          console.error('Failed to load hospitals:', hospitalsResult.reason);
        }

        if (specialtiesResult.status === 'fulfilled') {
          const specialtiesData = specialtiesResult.value;
          setSpecialties(specialtiesData.results || specialtiesData);
        } else {
          console.error('Failed to load specialties:', specialtiesResult.reason);
          toast({
            title: "Warning",
            description: "Could not load specialties. Please refresh the page.",
            variant: "destructive",
          });
        }

        // Load referrer profile if user is authenticated and is a referrer
        if (user && user.role === 'referrer') {
          let profileData = null;
          
          try {
            profileData = await referrerAPI.getMyProfile();
            setReferrerProfile(profileData);
          } catch (error) {
            // Profile API returns 404 for hospital accounts - this is expected
            // We'll use the user data from AuthContext instead
            setReferrerProfile(null);
          }
          
          // Auto-fill hospital information from logged-in account
          setFormData(prev => {
            const newFormData: any = {
              ...prev,
            };
            
            // For hospital accounts, auto-fill ALL hospital information including address
            if (user.hospital_name) {
              newFormData.referringFacilityName = user.hospital_name;
              newFormData.hospitalLocation = user.hospital_location || (profileData?.hospital_location) || '';
              newFormData.isInsideDavaoCity = user.is_inside_davao !== undefined ? user.is_inside_davao : ((profileData?.is_inside_davao) !== undefined ? profileData.is_inside_davao : true);
              newFormData.hospitalContactNumbers = user.contact_numbers || (profileData?.contact_numbers) || [];
              newFormData.hospitalDohLevel = user.hospital_doh_level || (profileData?.hospital_doh_level) || '';
              
              // Detailed address fields - only set if the value exists and is not empty
              if (user.hospital_region) newFormData.hospitalRegion = user.hospital_region;
              if (user.hospital_province) newFormData.hospitalProvince = user.hospital_province;
              if (user.hospital_city) newFormData.hospitalCity = user.hospital_city;
              if (user.hospital_barangay) newFormData.hospitalBarangay = user.hospital_barangay;
              if (user.hospital_street) newFormData.hospitalStreet = user.hospital_street;
              if (user.hospital_district) newFormData.hospitalDistrict = user.hospital_district;
            }
            // For doctors with affiliate hospitals
            else if (profileData?.referrer_type === 'doctor' && profileData.affiliate_hospitals?.length > 0) {
              newFormData.referringFacilityName = profileData.affiliate_hospitals[0].id.toString();
              newFormData.isInsideDavaoCity = profileData.affiliate_hospitals[0].is_inside_davao_city;
              newFormData.hospitalLocation = profileData.affiliate_hospitals[0].location || '';
            }
            // For non-doctors, use hospital info from profile
            else if (profileData?.referrer_type !== 'doctor' && profileData?.hospital_name) {
              newFormData.referringFacilityName = profileData.hospital_name;
              newFormData.isInsideDavaoCity = profileData.is_inside_davao;
              newFormData.hospitalLocation = profileData.hospital_location || '';
            }
            
            return newFormData;
          });
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user, toast]);

  // Load referral data if editing
  useEffect(() => {
    const loadReferralData = async () => {
      if (id && user) {
        try {
          setLoading(true);
          const referralData = await referralsAPI.getById(id);
          
          // Check if referral can be edited (must be pending status)
          if (referralData.status !== 'pending') {
            toast({
              title: "Cannot Edit",
              description: "This referral is already under triage and cannot be edited. You can only view it.",
              variant: "destructive",
            });
            navigate('/referrer/referred');
            return;
          }
          
          // Check if user owns this referral
          if (referralData.created_by !== user.id) {
            toast({
              title: "Access Denied",
              description: "You can only edit your own referrals.",
              variant: "destructive",
            });
            navigate('/referrer/referred');
            return;
          }
          
          setIsEditMode(true);
          setOriginalReferral(referralData);
          
          // Populate form with existing data
          setFormData({
            chiefComplaint: referralData.chief_complaint || '',
            pertinentHistory: referralData.pertinent_history || '',
            pertinentPhysicalExam: referralData.pertinent_physical_exam || '',
            latestVitalSigns: {
              bp: referralData.bp || '',
              hr: referralData.hr?.toString() || '',
              rr: referralData.rr?.toString() || '',
              temp: referralData.temp?.toString() || '',
              o2Sat: referralData.o2_sat?.toString() || '',
              vitalSignsDate: referralData.vital_signs_date || '',
              timeTaken: referralData.vital_signs_time || ''
            },
            gcsScore: referralData.gcs_score || '',
            o2Support: referralData.o2_support || '',
            admissionStatus: ['emergency_room', 'ward', 'intensive_care_unit'].includes(referralData.admission_status) 
              ? referralData.admission_status 
              : (referralData.admission_status ? 'others' : ''),
            admissionStatusOther: ['emergency_room', 'ward', 'intensive_care_unit'].includes(referralData.admission_status) 
              ? '' 
              : (referralData.admission_status || ''),
            rtpcrResult: referralData.rtpcr_result || '',
            workingImpression: referralData.working_impression || '',
            managementDone: referralData.management_done || '',
            
            patientCategory: referralData.patient_category || '',
            hrn: referralData.hrn || '',
            patientFirstName: referralData.patient_first_name || '',
            patientMiddleName: referralData.patient_middle_name || '',
            patientLastName: referralData.patient_last_name || '',
            patientSuffix: referralData.patient_suffix || '',
            currentAddress: referralData.current_address || '',
            birthday: referralData.birthday || '',
            age: referralData.age?.toString() || '',
            gender: referralData.gender || '',
            
            specialtyNeeded: referralData.specialty_needed?.toString() || '',
            otherSpecialty: '',
            
            laboratoryFiles: [],
            
            isInsideDavaoCity: referralData.referring_hospital_is_inside_davao || true,
            hospitalLocation: referralData.hospital_location || '',
            referringFacilityName: referralData.referring_hospital_name || '',
            hospitalDohLevel: referralData.hospital_doh_level || '',
            hospitalContactNumbers: referralData.hospital_contact_numbers || [],
            hospitalRegion: referralData.hospital_region || '',
            hospitalStreet: referralData.hospital_street || '',
            hospitalBarangay: referralData.hospital_barangay || '',
            hospitalDistrict: referralData.hospital_district || '',
            hospitalCity: referralData.hospital_city || '',
            hospitalProvince: referralData.hospital_province || '',
            referrerName: referralData.referrer_name || '',
            referrerProfession: referralData.referrer_profession || '',
            referrerProfessionOther: referralData.referrer_profession_other || '',
            referrerCellphone: referralData.referrer_cellphone || '',
            referrerContactNumbers: referralData.referrer_contact_numbers || [],
            modeOfTransportation: (() => {
              const transportMode = referralData.mode_of_transportation || '';
              const validOptions = ['ambulance', 'private_vehicle', 'patient_transport_vehicle', 'air_ambulance'];
              return validOptions.includes(transportMode.toLowerCase().replace(/\s+/g, '_')) 
                ? transportMode.toLowerCase().replace(/\s+/g, '_')
                : transportMode ? 'others' : '';
            })(),
            modeOfTransportationOther: (() => {
              const transportMode = referralData.mode_of_transportation || '';
              const validOptions = ['ambulance', 'private_vehicle', 'patient_transport_vehicle', 'air_ambulance'];
              return validOptions.includes(transportMode.toLowerCase().replace(/\s+/g, '_')) ? '' : transportMode;
            })(),
            
            consentSecured: referralData.consent_secured || false,
            reasonForReferral: referralData.reason_for_referral || '',
            otherReasonForReferral: '',
          });
          
        } catch (error: any) {
          console.error('Error loading referral:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to load referral data.",
            variant: "destructive",
          });
          navigate('/referrer/referred');
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadReferralData();
  }, [id, user, navigate, toast]);

  // Load regions on component mount
  useEffect(() => {
    const loadRegions = async () => {
      setLoadingRegions(true);
      const data = await fetchRegions();
      setRegions(data);
      setLoadingRegions(false);
    };
    loadRegions();
  }, []);

  // Load provinces when region changes
  useEffect(() => {
    const loadProvinces = async () => {
      if (formData.hospitalRegion) {
        setLoadingProvinces(true);
        const data = await fetchProvinces(formData.hospitalRegion);
        setProvinces(data);
        setLoadingProvinces(false);
        setCities([]);
        // Only reset dependent fields if they're not already set (i.e., not auto-filled)
        // Don't reset if user has a hospital account with pre-filled data
        if (!user?.hospital_name || !formData.hospitalProvince) {
          setFormData(prev => ({ ...prev, hospitalProvince: '', hospitalCity: '' }));
        }
      } else {
        setProvinces([]);
        setCities([]);
      }
    };
    loadProvinces();
  }, [formData.hospitalRegion]);

  // Load cities when province changes
  useEffect(() => {
    const loadCities = async () => {
      if (formData.hospitalProvince) {
        setLoadingCities(true);
        const data = await fetchCitiesMunicipalities(formData.hospitalProvince);
        setCities(data);
        setLoadingCities(false);
        // Only reset city field if it's not already set (i.e., not auto-filled)
        // Don't reset if user has a hospital account with pre-filled data
        if (!user?.hospital_name || !formData.hospitalCity) {
          setFormData(prev => ({ ...prev, hospitalCity: '' }));
        }
      } else {
        setCities([]);
      }
    };
    loadCities();
  }, [formData.hospitalProvince]);

  const steps = [
    { id: 1, name: "Patient Information", icon: User },
    { id: 2, name: "Patient Status", icon: Activity },
    { id: 3, name: "Specialty Needed", icon: FileText },
    { id: 4, name: "Referring Hospital", icon: MapPin },
    { id: 5, name: "Transit & Consent", icon: Truck }
  ];

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Remove field from errors if it now has a value
    if (fieldErrors.has(field)) {
      // Check if the field now has a valid value
      let isValid = false;
      
      if (Array.isArray(value)) {
        isValid = value.length > 0;
      } else if (typeof value === 'string') {
        isValid = value.trim() !== '';
      } else if (typeof value === 'boolean') {
        isValid = true; // Booleans are always valid
      } else {
        isValid = value !== null && value !== undefined && value !== '';
      }
      
      if (isValid) {
        setFieldErrors(prev => {
          const newErrors = new Set(prev);
          newErrors.delete(field);
          return newErrors;
        });
      }
    }
  };

  const updateNestedFormData = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof ReferralFormData] as any,
        [field]: value
      }
    }));
    
    // Remove nested field from errors if it now has a value
    if (fieldErrors.has(field)) {
      let isValid = false;
      
      if (typeof value === 'string') {
        isValid = value.trim() !== '';
      } else {
        isValid = value !== null && value !== undefined && value !== '';
      }
      
      if (isValid) {
        setFieldErrors(prev => {
          const newErrors = new Set(prev);
          newErrors.delete(field);
          return newErrors;
        });
      }
    }
  };

  // Handler for vital signs input - only allows numbers and "/"
  const handleVitalSignsInput = (field: string, value: string) => {
    // Only allow numbers, forward slash, and decimal point
    const filteredValue = value.replace(/[^0-9/.]/g, '');
    updateNestedFormData('latestVitalSigns', field, filteredValue);
  };

  // Handler for contact number input - only allows numbers, spaces, hyphens, and plus sign
  const handleContactNumberInput = (value: string) => {
    // Only allow numbers, spaces, hyphens, parentheses, and plus sign for phone numbers
    const filteredValue = value.replace(/[^0-9\s\-+()]/g, '');
    setReferrerContactInput(filteredValue);
  };

  const calculateAge = (birthDate: string): string => {
    if (!birthDate) return '';
    
    const today = new Date();
    const birth = new Date(birthDate);
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    // If birthday hasn't occurred this year yet, subtract 1 from age
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age.toString();
  };

  const handleBirthdayChange = (birthDate: string) => {
    // Update birthday
    updateFormData('birthday', birthDate);
    
    // Automatically calculate and update age
    const calculatedAge = calculateAge(birthDate);
    updateFormData('age', calculatedAge);
    
    // Clear errors for both birthday and age if they have values
    if (birthDate && calculatedAge) {
      setFieldErrors(prev => {
        const newErrors = new Set(prev);
        newErrors.delete('birthday');
        newErrors.delete('age');
        return newErrors;
      });
    }
  };

  const validateCurrentStep = () => {
    const errors = new Set<string>();
    
    switch (currentStep) {
      case 1: // Patient Information
        if (!formData.patientCategory) errors.add('patientCategory');
        if (!formData.patientFirstName.trim()) errors.add('patientFirstName');
        if (!formData.patientMiddleName.trim()) errors.add('patientMiddleName');
        if (!formData.patientLastName.trim()) errors.add('patientLastName');
        if (!formData.currentAddress.trim()) errors.add('currentAddress');
        if (!formData.birthday) errors.add('birthday');
        if (!formData.age.trim()) errors.add('age');
        if (!formData.gender) errors.add('gender');
        break;
        
      case 2: // Patient Status
        if (!formData.chiefComplaint.trim()) errors.add('chiefComplaint');
        if (!formData.pertinentHistory.trim()) errors.add('pertinentHistory');
        if (!formData.pertinentPhysicalExam.trim()) errors.add('pertinentPhysicalExam');
        if (!formData.latestVitalSigns.bp.trim()) errors.add('bp');
        if (!formData.latestVitalSigns.hr.trim()) errors.add('hr');
        if (!formData.latestVitalSigns.rr.trim()) errors.add('rr');
        if (!formData.latestVitalSigns.temp.trim()) errors.add('temp');
        if (!formData.latestVitalSigns.o2Sat.trim()) errors.add('o2Sat');
        if (!formData.latestVitalSigns.timeTaken.trim()) errors.add('timeTaken');
        if (!formData.gcsScore.trim()) errors.add('gcsScore');
        if (!formData.o2Support.trim()) errors.add('o2Support');
        if (!formData.admissionStatus) errors.add('admissionStatus');
        if (formData.admissionStatus === 'others' && !formData.admissionStatusOther.trim()) errors.add('admissionStatusOther');
        if (!formData.rtpcrResult) errors.add('rtpcrResult');
        if (!formData.workingImpression.trim()) errors.add('workingImpression');
        if (!formData.managementDone.trim()) errors.add('managementDone');
        break;
        
      case 3: // Specialty
        if (!formData.specialtyNeeded) errors.add('specialtyNeeded');
        // Check if "Others" specialty is selected and validate otherSpecialty field
        const selectedSpecialty = specialties.find(s => s.id == formData.specialtyNeeded);
        if (selectedSpecialty?.name === "Others" && !formData.otherSpecialty.trim()) errors.add('otherSpecialty');
        if (!formData.reasonForReferral.trim()) errors.add('reasonForReferral');
        if (formData.reasonForReferral === "Others" && !formData.otherReasonForReferral.trim()) errors.add('otherReasonForReferral');
        break;
        
      case 4: // Referring Hospital
        const referringFacility = (user && user.hospital_name) ? user.hospital_name : formData.referringFacilityName;
        if (!referringFacility) errors.add('referringFacilityName');
        const hospitalDohLevel = (user && user.hospital_doh_level) ? user.hospital_doh_level : formData.hospitalDohLevel;
        if (!hospitalDohLevel) errors.add('hospitalDohLevel');
        if (!formData.referrerName.trim()) errors.add('referrerName');
        if (!formData.referrerProfession.trim()) errors.add('referrerProfession');
        if (formData.referrerProfession === "others" && !formData.referrerProfessionOther.trim()) errors.add('referrerProfessionOther');
        if (!formData.modeOfTransportation.trim()) errors.add('modeOfTransportation');
        if (formData.modeOfTransportation === "others" && !formData.modeOfTransportationOther.trim()) errors.add('modeOfTransportationOther');
        break;
    }
    
    return errors;
  };

  const nextStep = () => {
    // Validate current step before moving forward
    const errors = validateCurrentStep();
    setFieldErrors(errors);
    
    if (errors.size > 0) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields marked in red.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldErrorClass = (fieldName: string) => {
    return fieldErrors.has(fieldName) ? 'border-red-500 dark:border-red-400 border-2' : '';
  };

  const validateForm = () => {
    const errors = [];
    
    // Step 1 - Patient Status validation

    
    // Step 2 - Patient Information validation
    if (!formData.patientCategory) errors.push("Patient Category is required");
    if (!formData.patientFirstName.trim()) errors.push("Patient First Name is required");
    if (!formData.patientMiddleName.trim()) errors.push("Patient Middle Name is required");
    if (!formData.patientLastName.trim()) errors.push("Patient Last Name is required");
    if (!formData.currentAddress.trim()) errors.push("Current Address is required");
    if (!formData.birthday) errors.push("Birthday is required");
    if (!formData.age.trim()) errors.push("Age is required");
    if (!formData.gender) errors.push("Gender is required");
    

    if (!formData.chiefComplaint.trim()) errors.push("Chief Complaint is required");
    if (!formData.pertinentHistory.trim()) errors.push("Pertinent History is required");
    if (!formData.pertinentPhysicalExam.trim()) errors.push("Pertinent Physical Exam is required");
    if (!formData.latestVitalSigns.bp.trim()) errors.push("Blood Pressure is required");
    if (!formData.latestVitalSigns.hr.trim()) errors.push("Heart Rate is required");
    if (!formData.latestVitalSigns.rr.trim()) errors.push("Respiratory Rate is required");
    if (!formData.latestVitalSigns.temp.trim()) errors.push("Temperature is required");
    if (!formData.latestVitalSigns.o2Sat.trim()) errors.push("O2 Saturation is required");
    if (!formData.latestVitalSigns.timeTaken.trim()) errors.push("Time Taken for vital signs is required");
    if (!formData.gcsScore.trim()) errors.push("GCS Score is required");
    if (!formData.o2Support.trim()) errors.push("O2 Support is required");
    if (!formData.admissionStatus) errors.push("Admission Status is required");
    if (formData.admissionStatus === 'others' && !formData.admissionStatusOther.trim()) {
      errors.push("Please specify the admission status");
    }
    if (!formData.rtpcrResult) errors.push("RTPCR Result is required");

    // Step 3 - Specialty validation
    if (!formData.specialtyNeeded) errors.push("Specialty Needed is required");
    if (!formData.reasonForReferral.trim()) errors.push("Reason for Referral is required");
    if (formData.reasonForReferral === "Others" && !formData.otherReasonForReferral.trim()) {
      errors.push("Please specify the reason for referral");
    }
    
    // Laboratory files validation (optional but recommended)
    if (formData.laboratoryFiles.length === 0) {
      // This is just a warning, not an error
      console.warn("No laboratory files uploaded. Consider uploading relevant medical documents.");
    }
    
    // Step 4 - Referring Hospital validation
    // For hospital accounts, check user.hospital_name directly
    // For doctors/others, check formData.referringFacilityName
    const referringFacility = (user && user.hospital_name) ? user.hospital_name : formData.referringFacilityName;
    if (!referringFacility) errors.push("Referring Facility is required");
    // For hospital accounts, check user.hospital_doh_level; for others, check formData.hospitalDohLevel
    const hospitalDohLevel = (user && user.hospital_doh_level) ? user.hospital_doh_level : formData.hospitalDohLevel;
    if (!hospitalDohLevel) errors.push("Hospital DOH Level is required");
    if (!formData.referrerName.trim()) errors.push("Referrer Name is required");
    if (!formData.referrerProfession.trim()) errors.push("Referrer Profession is required");
    if (formData.referrerProfession === "others" && !formData.referrerProfessionOther.trim()) {
      errors.push("Please specify the referrer profession");
    }
    if (!formData.modeOfTransportation.trim()) errors.push("Mode of Transportation is required");
    if (formData.modeOfTransportation === "others" && !formData.modeOfTransportationOther.trim()) {
      errors.push("Please specify the mode of transportation");
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Debug: Log form data before validation
      console.log('Form Data before validation:', {
        referringFacilityName: formData.referringFacilityName,
        hospitalName: user?.hospital_name,
        isHospitalAccount: user && user.hospital_name,
      });
      
      // Validate form first
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        alert('Please fix the following errors:\n\n' + validationErrors.join('\n'));
        setIsSubmitting(false);
        return;
      }
      
      // Convert PSGC codes to names for submission
      // Check if values are already names (from user profile) or codes (from dropdowns)
      const isRegionCode = formData.hospitalRegion && /^\d+$/.test(formData.hospitalRegion);
      const isProvinceCode = formData.hospitalProvince && /^\d+$/.test(formData.hospitalProvince);
      const isCityCode = formData.hospitalCity && /^\d+$/.test(formData.hospitalCity);
      
      const selectedRegion = isRegionCode ? regions.find(r => r.code === formData.hospitalRegion) : null;
      const selectedProvince = isProvinceCode ? provinces.find(p => p.code === formData.hospitalProvince) : null;
      const selectedCity = isCityCode ? cities.find(c => c.code === formData.hospitalCity) : null;
      
      // Use name from dropdown if code was selected, otherwise use the value as-is (it's already a name)
      const hospitalRegionName = selectedRegion?.name || formData.hospitalRegion || null;
      const hospitalProvinceName = selectedProvince?.name || formData.hospitalProvince || null;
      const hospitalCityName = selectedCity?.name || formData.hospitalCity || null;
      
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
        vital_signs_date: formData.latestVitalSigns.vitalSignsDate || null,
        vital_signs_time: formData.latestVitalSigns.timeTaken || null,
        gcs_score: formData.gcsScore,
        o2_support: formData.o2Support,
        admission_status: formData.admissionStatus === 'others' ? formData.admissionStatusOther : formData.admissionStatus,
        rtpcr_result: formData.rtpcrResult,
        working_impression: formData.workingImpression,
        management_done: formData.managementDone,
        
        // Patient Information
        patient_category: formData.patientCategory,
        hrn: formData.hrn || null,
        patient_full_name: `${formData.patientLastName}, ${formData.patientFirstName} ${formData.patientMiddleName}${formData.patientSuffix ? ' ' + formData.patientSuffix : ''}`.trim(),
        current_address: formData.currentAddress,
        birthday: formData.birthday,
        age: parseInt(formData.age) || 0,
        gender: formData.gender,
        
        // Specialty Needed
        specialty_needed: parseInt(formData.specialtyNeeded) || 1,
        other_specialty: formData.otherSpecialty || null,
        reason_for_referral: formData.reasonForReferral === "Others" ? formData.otherReasonForReferral : formData.reasonForReferral,
        
        // Referring Hospital - handle both ID (number) and name (text)
        // Priority: user.hospital_name (for hospital accounts) > formData.referringFacilityName
        // If referringFacilityName is a number (ID), use it as referring_hospital
        // If it's text (hospital name), send as hospital_name and backend will create/find the hospital
        ...(() => {
          const hospitalValue = (user && user.hospital_name) ? user.hospital_name : formData.referringFacilityName;
          return isNaN(parseInt(hospitalValue)) 
            ? { hospital_name: hospitalValue } 
            : { referring_hospital: parseInt(hospitalValue) };
        })(),
        hospital_doh_level: (user && user.hospital_doh_level) ? user.hospital_doh_level : formData.hospitalDohLevel || null,
        hospital_location: formData.hospitalLocation || null,
        hospital_contact_numbers: user?.contact_numbers || [],
        // Only include address fields if they have values (not null or empty)
        ...(hospitalRegionName && { hospital_region: hospitalRegionName }),
        ...(hospitalProvinceName && { hospital_province: hospitalProvinceName }),
        ...(hospitalCityName && { hospital_city: hospitalCityName }),
        ...(formData.hospitalBarangay && { hospital_barangay: formData.hospitalBarangay }),
        ...(formData.hospitalStreet && { hospital_street: formData.hospitalStreet }),
        referrer_name: formData.referrerName,
        referrer_profession: formData.referrerProfession,
        referrer_profession_other: formData.referrerProfession === "others" ? formData.referrerProfessionOther : null,
        referrer_cellphone: formData.referrerCellphone || formData.referrerContactNumbers[0] || '',
        referrer_contact_numbers: formData.referrerContactNumbers,
        patient_watcher_name: null,
        patient_watcher_contact_numbers: [],
        contact_numbers: [],
        mode_of_transportation: formData.modeOfTransportation === "others" ? formData.modeOfTransportationOther : formData.modeOfTransportation,
        
        // Consent
        consent_secured: formData.consentSecured,
      };

      console.log('Submitting data:', apiData); // Debug log
      console.log('Laboratory files to upload:', formData.laboratoryFiles.length, 'files'); // Debug log
      
      // TODO: Implement file upload functionality
      // For now, we'll submit the referral without files
      // In a full implementation, files would be uploaded separately or as FormData
      
      let response;
      if (isEditMode && id) {
        // Update existing referral
        response = await referralsAPI.update(id, apiData);
      } else {
        // Create new referral
        response = await externalReferralsAPI.create(apiData);
      }
      
      let successMessage = isEditMode 
        ? `Referral updated successfully! Reference ID: ${response.referral_id || originalReferral?.referral_id}\n\nYour changes have been saved.`
        : `Referral submitted successfully! Reference ID: ${response.referral_id}\n\nYour referral has been sent to SPMC Emergency Dispatch and Communication Center for review.`;
      
      // Add tracking message for logged-in referrer users
      if (user && user.role === 'referrer') {
        successMessage += `\n\n✅ This referral is tracked in your referrer dashboard. You can monitor its progress by visiting your dashboard.`;
      }
      
      if (formData.laboratoryFiles.length > 0) {
        successMessage += `\n\nNote: ${formData.laboratoryFiles.length} laboratory file(s) were selected. Please ensure all medical documents are properly attached for review.`;
      }
      
      // Show success message
      if (user && user.role === 'referrer') {
        // For referrer users, show toast and redirect to dashboard
        toast({
          title: "Referral Submitted Successfully! 🎉",
          description: `Reference ID: ${response.referral_id}. Redirecting to your dashboard...`,
          className: "bg-green-50 border-green-200 text-green-800",
        });
        
        // Reset form
        setFormData(initialFormData);
        setCurrentStep(1);
        
        // Redirect to referrer dashboard
        setTimeout(() => {
          navigate('/referrer');
        }, 1500);
      } else {
        // For anonymous users, show alert and stay on page
        let successMessage = `Referral submitted successfully! Reference ID: ${response.referral_id}\n\nYour referral has been sent to SPMC Emergency Dispatch and Communication Center for review.`;
        
        if (formData.laboratoryFiles.length > 0) {
          successMessage += `\n\nNote: ${formData.laboratoryFiles.length} laboratory file(s) were selected. Please ensure all medical documents are properly attached for review.`;
        }
        
        alert(successMessage);
        
        // Reset form
        setFormData(initialFormData);
        setCurrentStep(1);
      }
      
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
      setIsSubmitting(false);
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
                  Patient's Name <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      First Name <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('patientFirstName')}`}
                      placeholder="First Name"
                      value={formData.patientFirstName}
                      onChange={(e) => updateFormData('patientFirstName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Middle Name <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('patientMiddleName')}`}
                      placeholder="Middle Name"
                      value={formData.patientMiddleName}
                      onChange={(e) => updateFormData('patientMiddleName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Last Name <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('patientLastName')}`}
                      placeholder="Last Name"
                      value={formData.patientLastName}
                      onChange={(e) => updateFormData('patientLastName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Suffix (Optional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                      placeholder="Jr., Sr., III"
                      value={formData.patientSuffix}
                      onChange={(e) => updateFormData('patientSuffix', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Patient Category <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select 
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('patientCategory')}`}
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
                  Birthday <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="date"
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('birthday')}`}
                  value={formData.birthday}
                  onChange={(e) => handleBirthdayChange(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Age <span className="text-red-500 dark:text-red-400">*</span> <span className="text-xs text-gray-500 dark:text-gray-400">(Auto-calculated from birthday)</span>
                </label>
                <input
                  type="number"
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('age')}`}
                  placeholder="Age in years"
                  value={formData.age}
                  onChange={(e) => updateFormData('age', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gender <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select 
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('gender')}`}
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
                  Patient Current Complete Address <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <textarea
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('currentAddress')}`}
                  rows={3}
                  placeholder="Complete address including barangay, city, province"
                  value={formData.currentAddress}
                  onChange={(e) => updateFormData('currentAddress', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chief Complaint <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <textarea
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('chiefComplaint')}`}
                  rows={3}
                  placeholder="Describe the main complaint..."
                  value={formData.chiefComplaint}
                  onChange={(e) => updateFormData('chiefComplaint', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pertinent History <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <textarea
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('pertinentHistory')}`}
                  rows={3}
                  placeholder="Medical history, previous conditions..."
                  value={formData.pertinentHistory}
                  onChange={(e) => updateFormData('pertinentHistory', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pertinent Physical Exam or Laboratories <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <textarea
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('pertinentPhysicalExam')}`}
                  rows={3}
                  placeholder="Physical examination findings, lab results..."
                  value={formData.pertinentPhysicalExam}
                  onChange={(e) => updateFormData('pertinentPhysicalExam', e.target.value)}
                />
              </div>
            </div>

            {/* Vital Signs */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Latest Vital Signs <span className="text-red-500 dark:text-red-400">*</span></h3>
              <div className="grid grid-cols-3 gap-4">
                {/* First Row */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Blood Pressure
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('bp')}`}
                    placeholder="120/80"
                    value={formData.latestVitalSigns.bp}
                    onChange={(e) => handleVitalSignsInput('bp', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Heart Rate
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('hr')}`}
                    placeholder="80"
                    value={formData.latestVitalSigns.hr}
                    onChange={(e) => handleVitalSignsInput('hr', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Respiratory Rate
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('rr')}`}
                    placeholder="20"
                    value={formData.latestVitalSigns.rr}
                    onChange={(e) => handleVitalSignsInput('rr', e.target.value)}
                  />
                </div>
                {/* Second Row */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Temperature
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('temp')}`}
                    placeholder="36.5"
                    value={formData.latestVitalSigns.temp}
                    onChange={(e) => handleVitalSignsInput('temp', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    O2 Saturation
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('o2Sat')}`}
                    placeholder="98"
                    value={formData.latestVitalSigns.o2Sat}
                    onChange={(e) => handleVitalSignsInput('o2Sat', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time Taken
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('vitalSignsDate')}`}
                      value={formData.latestVitalSigns.vitalSignsDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => updateNestedFormData('latestVitalSigns', 'vitalSignsDate', e.target.value)}
                    />
                    <input
                      type="time"
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('timeTaken')}`}
                      value={formData.latestVitalSigns.timeTaken}
                      onChange={(e) => updateNestedFormData('latestVitalSigns', 'timeTaken', e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Date and time when vital signs were taken</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  GCS Score or AVPU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('gcsScore')}`}
                  placeholder="15 (E4V5M6) or Alert"
                  value={formData.gcsScore}
                  onChange={(e) => updateFormData('gcsScore', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  O2 Support <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('o2Support')}`}
                  placeholder="Room air, Nasal cannula 2L/min"
                  value={formData.o2Support}
                  onChange={(e) => updateFormData('o2Support', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  RTPCR Result <span className="text-red-500">*</span>
                </label>
                <select 
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('rtpcrResult')}`}
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
                  Admission Status <span className="text-red-500">*</span>
                </label>
                <select 
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('admissionStatus')}`}
                  value={formData.admissionStatus}
                  onChange={(e) => {
                    updateFormData('admissionStatus', e.target.value);
                    if (e.target.value !== 'others') {
                      updateFormData('admissionStatusOther', '');
                    }
                  }}
                >
                  <option value="">Select status</option>
                  <option value="emergency_room">Emergency Room</option>
                  <option value="ward">Ward</option>
                  <option value="intensive_care_unit">Intensive Care Unit</option>
                  <option value="others">Others (Please Specify)</option>
                </select>
              </div>
            </div>

            {/* Conditional: Specify Admission Status if "others" selected */}
            {formData.admissionStatus === 'others' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Please Specify Admission Status <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('admissionStatusOther')}`}
                    placeholder="Enter admission status"
                    value={formData.admissionStatusOther}
                    onChange={(e) => updateFormData('admissionStatusOther', e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Initial Impression <span className="text-red-500">*</span>
                </label>
                <textarea
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('workingImpression')}`}
                  rows={3}
                  placeholder="Primary diagnosis or impression..."
                  value={formData.workingImpression}
                  onChange={(e) => updateFormData('workingImpression', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Management Done <span className="text-red-500">*</span>
                </label>
                <textarea
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('managementDone')}`}
                  rows={3}
                  placeholder="Treatments, medications given..."
                  value={formData.managementDone}
                  onChange={(e) => updateFormData('managementDone', e.target.value)}
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
                  Which Specialty/Service is Needed <span className="text-red-500">*</span>
                </label>
                <select 
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('specialtyNeeded')}`}
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
                    Please specify the required specialty or service needed <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('otherSpecialty')}`}
                    placeholder="Specify other specialty"
                    value={formData.otherSpecialty}
                    onChange={(e) => updateFormData('otherSpecialty', e.target.value)}
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Referral <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('reasonForReferral')}`}
                  value={formData.reasonForReferral}
                  onChange={(e) => {
                    updateFormData('reasonForReferral', e.target.value);
                    if (e.target.value !== "Others") {
                      updateFormData('otherReasonForReferral', '');
                    }
                  }}
                >
                  <option value="">Select reason for referral...</option>
                  <option value="Financial Constraints">Financial Constraints</option>
                  <option value="Higher Facility Care">Higher Facility Care</option>
                  <option value="Trauma Center">Trauma Center</option>
                  <option value="Burn Unit">Burn Unit</option>
                  <option value="Patients Choice">Patients Choice</option>
                  <option value="Repatriation">Repatriation</option>
                  <option value="Others">Others (Please Specify)</option>
                </select>
              </div>

              {formData.reasonForReferral === "Others" && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Please Specify Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('otherReasonForReferral')}`}
                    rows={3}
                    placeholder="Please specify the reason for referral..."
                    value={formData.otherReasonForReferral}
                    onChange={(e) => updateFormData('otherReasonForReferral', e.target.value)}
                  />
                </div>
              )}
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
              {/* Hospital Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Complete Name of Referring Facility <span className="text-red-500">*</span>
                  {user && user.hospital_name && (
                    <span className="text-xs text-green-600 dark:text-green-400 ml-2">
                      ✓ Auto-filled from your hospital account
                    </span>
                  )}
                </label>
                {user && user.hospital_name ? (
                  // Hospital account - show read-only hospital name
                  <input
                    type="text"
                    value={user.hospital_name}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                  />
                ) : user && user.role === 'referrer' && referrerProfile?.referrer_type === 'doctor' && referrerProfile?.affiliate_hospitals?.length > 0 ? (
                  // Doctor account - show dropdown of affiliate hospitals
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                    value={formData.referringFacilityName}
                    onChange={(e) => {
                      const hospitalId = e.target.value;
                      updateFormData('referringFacilityName', hospitalId);
                      
                      // Find selected hospital and auto-fill its details
                      const selectedHospital = referrerProfile.affiliate_hospitals.find((h: any) => h.id.toString() === hospitalId);
                      if (selectedHospital) {
                        // Auto-fill hospital details from database
                        updateFormData('isInsideDavaoCity', selectedHospital.is_inside_davao_city || true);
                        updateFormData('hospitalLocation', selectedHospital.location || '');
                        updateFormData('hospitalDohLevel', selectedHospital.doh_level || '');
                        
                        // Auto-fill address fields if available
                        if (selectedHospital.region) updateFormData('hospitalRegion', selectedHospital.region);
                        if (selectedHospital.province) updateFormData('hospitalProvince', selectedHospital.province);
                        if (selectedHospital.city) updateFormData('hospitalCity', selectedHospital.city);
                        if (selectedHospital.barangay) updateFormData('hospitalBarangay', selectedHospital.barangay);
                        if (selectedHospital.street) updateFormData('hospitalStreet', selectedHospital.street);
                        if (selectedHospital.district) updateFormData('hospitalDistrict', selectedHospital.district);
                        if (selectedHospital.contact_number) {
                          updateFormData('hospitalContactNumbers', [selectedHospital.contact_number]);
                        }
                      }
                    }}
                  >
                    <option value="">Select from your affiliate hospitals</option>
                    {referrerProfile.affiliate_hospitals.map((hospital: any) => (
                      <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
                    ))}
                  </select>
                ) : (
                  // Public/guest - show all hospitals dropdown
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                    value={formData.referringFacilityName}
                    onChange={(e) => {
                      const hospitalId = e.target.value;
                      updateFormData('referringFacilityName', hospitalId);
                      
                      // Find selected hospital and auto-fill its details
                      const selectedHospital = hospitals.find((h: any) => h.id.toString() === hospitalId);
                      if (selectedHospital) {
                        // Auto-fill hospital details from database
                        updateFormData('isInsideDavaoCity', selectedHospital.is_inside_davao_city || true);
                        updateFormData('hospitalLocation', selectedHospital.location || '');
                        updateFormData('hospitalDohLevel', selectedHospital.doh_level || '');
                        
                        // Auto-fill address fields if available
                        if (selectedHospital.region) updateFormData('hospitalRegion', selectedHospital.region);
                        if (selectedHospital.province) updateFormData('hospitalProvince', selectedHospital.province);
                        if (selectedHospital.city) updateFormData('hospitalCity', selectedHospital.city);
                        if (selectedHospital.barangay) updateFormData('hospitalBarangay', selectedHospital.barangay);
                        if (selectedHospital.street) updateFormData('hospitalStreet', selectedHospital.street);
                        if (selectedHospital.district) updateFormData('hospitalDistrict', selectedHospital.district);
                        if (selectedHospital.contact_number) {
                          updateFormData('hospitalContactNumbers', [selectedHospital.contact_number]);
                        }
                      }
                    }}
                  >
                    <option value="">Select hospital</option>
                    {hospitals.map((hospital) => (
                      <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* DOH Level - Auto-filled and read-only for hospital accounts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  DOH Level <span className="text-red-500">*</span>
                  {user && user.hospital_doh_level && (
                    <span className="text-xs text-green-600 dark:text-green-400 ml-2">
                      ✓ Auto-filled
                    </span>
                  )}
                </label>
                {user && user.hospital_doh_level ? (
                  <input
                    type="text"
                    value={user.hospital_doh_level.charAt(0).toUpperCase() + user.hospital_doh_level.slice(1)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                  />
                ) : formData.referringFacilityName ? (
                  // Show auto-filled DOH level as text when hospital is selected
                  <input
                    type="text"
                    value={formData.hospitalDohLevel ? formData.hospitalDohLevel.charAt(0).toUpperCase() + formData.hospitalDohLevel.slice(1) : ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                  />
                ) : (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                    value={formData.hospitalDohLevel}
                    onChange={(e) => updateFormData('hospitalDohLevel', e.target.value)}
                  >
                    <option value="">Select DOH Level</option>
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="tertiary">Tertiary</option>
                  </select>
                )}
              </div>
            </div>

            {/* Detailed Address Fields - Auto-filled for hospital accounts */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Hospital Address
                {user && user.hospital_name && formData.hospitalRegion && formData.hospitalProvince && formData.hospitalCity && (
                  <span className="text-xs text-green-600 dark:text-green-400 ml-2">
                    ✓ Auto-filled from your account
                  </span>
                )}
                {user && user.hospital_name && (!formData.hospitalRegion || !formData.hospitalProvince || !formData.hospitalCity) && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">
                    ⚠ Please complete your hospital address in your profile
                  </span>
                )}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Region <span className="text-red-500">*</span>
                  </label>
                  {formData.hospitalRegion && user?.hospital_name ? (
                    <input
                      type="text"
                      value={formData.hospitalRegion}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      value={formData.hospitalRegion}
                      onChange={(e) => {
                        const selectedCode = e.target.value;
                        updateFormData('hospitalRegion', selectedCode);
                      }}
                      disabled={loadingRegions}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">{loadingRegions ? 'Loading regions...' : 'Select Region'}</option>
                      {regions.map((r) => (
                        <option key={r.code} value={r.code}>{r.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Province */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Province <span className="text-red-500">*</span>
                  </label>
                  {formData.hospitalProvince && user?.hospital_name ? (
                    <input
                      key="province-readonly"
                      type="text"
                      value={formData.hospitalProvince}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      key="province-select"
                      value={formData.hospitalProvince}
                      onChange={(e) => {
                        const selectedCode = e.target.value;
                        updateFormData('hospitalProvince', selectedCode);
                      }}
                      disabled={!formData.hospitalRegion || loadingProvinces}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                    >
                      <option value="">
                        {!formData.hospitalRegion 
                          ? 'Select region first' 
                          : loadingProvinces 
                          ? 'Loading provinces...' 
                          : 'Select Province'}
                      </option>
                      {provinces.map((p) => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City / Municipality <span className="text-red-500">*</span>
                  </label>
                  {formData.hospitalCity && user?.hospital_name ? (
                    <input
                      key="city-readonly"
                      type="text"
                      value={formData.hospitalCity}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      key="city-select"
                      value={formData.hospitalCity}
                      onChange={(e) => {
                        const selectedCode = e.target.value;
                        updateFormData('hospitalCity', selectedCode);
                      }}
                      disabled={!formData.hospitalProvince || loadingCities}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                    >
                      <option value="">
                        {!formData.hospitalProvince 
                          ? 'Select province first' 
                          : loadingCities 
                          ? 'Loading cities...' 
                          : 'Select City / Municipality'}
                      </option>
                      {cities.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Barangay - Keep as text input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Barangay
                  </label>
                  <input
                    type="text"
                    value={formData.hospitalBarangay}
                    onChange={(e) => updateFormData('hospitalBarangay', e.target.value)}
                    readOnly={!!(user?.hospital_name && formData.hospitalBarangay)}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                      (user?.hospital_name && formData.hospitalBarangay)
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed' 
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                    placeholder="e.g., Bajada (Optional)"
                  />
                </div>

                {/* Complete Address (Street, District) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Complete Hospital Address (Street, Building, District) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.hospitalStreet}
                    onChange={(e) => {
                      // For auto-filled fields, don't allow editing
                      if (!(user?.hospital_name && formData.hospitalStreet)) {
                        updateFormData('hospitalStreet', e.target.value);
                      }
                    }}
                    readOnly={!!(user?.hospital_name && formData.hospitalStreet)}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                      (user?.hospital_name && formData.hospitalStreet)
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed' 
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                    rows={2}
                    placeholder="e.g., J.P. Laurel Avenue, Poblacion District"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Include street name, building number, district, and any landmarks
                  </p>
                </div>
              </div>
            </div>

            {/* Referrer Information */}
            <div className="space-y-6">
              {/* Row 1: Name of Referrer | Referrer Contact Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name of the Referrer <span className="text-red-500">*</span>
                    {user && user.role === 'referrer' && referrerProfile && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">
                        (Auto-filled from your profile - editable)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('referrerName')}`}
                    placeholder="Dr. Full Name"
                    value={formData.referrerName}
                    onChange={(e) => updateFormData('referrerName', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Referrer Contact Numbers
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="tel"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                      placeholder="e.g. 09171234567"
                      value={referrerContactInput}
                      onChange={(e) => handleContactNumberInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const num = referrerContactInput.trim();
                          if (num && !formData.referrerContactNumbers.includes(num)) {
                            updateFormData('referrerContactNumbers', [...formData.referrerContactNumbers, num]);
                          }
                          setReferrerContactInput('');
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const num = referrerContactInput.trim();
                        if (num && !formData.referrerContactNumbers.includes(num)) {
                          updateFormData('referrerContactNumbers', [...formData.referrerContactNumbers, num]);
                        }
                        setReferrerContactInput('');
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>
                  {formData.referrerContactNumbers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.referrerContactNumbers.map((num, idx) => (
                        <span key={idx} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-sm px-2 py-1 rounded-full">
                          <Phone className="w-3 h-3" />
                          {num}
                          <button
                            type="button"
                            onClick={() => updateFormData('referrerContactNumbers', formData.referrerContactNumbers.filter((_, i) => i !== idx))}
                            className="ml-1 text-blue-500 hover:text-red-500 font-bold leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Press Enter or click Add to include multiple numbers</p>
                </div>
              </div>

              {/* Row 2: Profession of Referrer - Mode of Transportation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profession of the Referrer <span className="text-red-500">*</span>
                    {user && user.role === 'referrer' && referrerProfile && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">
                        (Auto-filled from your profile - editable)
                      </span>
                    )}
                  </label>
                  <select
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('referrerProfession')}`}
                    value={formData.referrerProfession}
                    onChange={(e) => {
                      updateFormData('referrerProfession', e.target.value);
                      if (e.target.value !== 'others') {
                        updateFormData('referrerProfessionOther', '');
                      }
                    }}
                  >
                    <option value="">Select profession</option>
                    <option value="nurse">Nurse</option>
                    <option value="barangay_health_worker">Barangay Health Worker</option>
                    <option value="doctor">Doctor</option>
                    <option value="others">Others (Please Specify)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mode of Transportation <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('modeOfTransportation')}`}
                    value={formData.modeOfTransportation}
                    onChange={(e) => {
                      updateFormData('modeOfTransportation', e.target.value);
                      if (e.target.value !== 'others') {
                        updateFormData('modeOfTransportationOther', '');
                      }
                    }}
                  >
                    <option value="">Select mode of transportation</option>
                    <option value="ambulance">Ambulance</option>
                    <option value="private_vehicle">Private Vehicle</option>
                    <option value="patient_transport_vehicle">Patient Transport Vehicle</option>
                    <option value="air_ambulance">Air Ambulance</option>
                    <option value="others">Others (Please Specify)</option>
                  </select>
                </div>
              </div>

              {/* Conditional: Specify Profession and/or Mode of Transportation if "others" selected */}
              {(formData.referrerProfession === 'others' || formData.modeOfTransportation === 'others') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formData.referrerProfession === 'others' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Please Specify Profession <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('referrerProfessionOther')}`}
                        placeholder="e.g., Emergency Medicine Physician"
                        value={formData.referrerProfessionOther}
                        onChange={(e) => updateFormData('referrerProfessionOther', e.target.value)}
                      />
                    </div>
                  )}

                  {formData.modeOfTransportation === 'others' && (
                    <div className={formData.referrerProfession !== 'others' ? 'md:col-start-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Please Specify Mode of Transportation <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 ${getFieldErrorClass('modeOfTransportationOther')}`}
                        placeholder="e.g., Motorcycle, Tricycle"
                        value={formData.modeOfTransportationOther}
                        onChange={(e) => updateFormData('modeOfTransportationOther', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

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
                      onChange={(e) => updateFormData('consentSecured', e.target.value)}
                    />
                    <span className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
                      Was a consent form to transfer secured from the patient/relative prior to this referral?
                    </span>
                  </label>
                </div>
              </div>
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
      {/* About Us Button - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <AboutUsDialog isDarkMode={false} />
      </div>

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
            <div className="flex items-center gap-4 mb-4">
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? 'Edit Patient Referral' : 'Patient Referral Form'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {isEditMode 
                ? `Editing referral ${originalReferral?.referral_id} - You can only edit referrals that are still pending`
                : 'Submit a referral request to Southern Philippines Medical Center'
              }
            </p>
            
            {/* Edit mode warning */}
            {isEditMode && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium">⚠️ Editing Mode</p>
                    <p>You are editing an existing referral. Once this referral is under triage (status changes from "Pending"), you will no longer be able to edit it.</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Message for logged-in referrer users */}
            {user && user.role === 'referrer' && !isEditMode && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <p className="font-medium">Logged in as: {user.hospital_name || user.full_name || user.username}</p>
                    <p>After submission, you'll be redirected to your dashboard where you can track this referral's progress.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Auto-fill notification for referrers */}
            {user && user.role === 'referrer' && referrerProfile && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium">Auto-filled Information</p>
                    <p>Your referrer details have been automatically filled from your profile. 
                    {referrerProfile.referrer_type === 'doctor' && referrerProfile.affiliate_hospitals?.length > 0 
                      ? ' You can select from your affiliate hospitals.' 
                      : ' All fields are editable if you need to make changes.'
                    }
                    {referrerProfile.specialties_text && (
                      <span> Your medical specialties ({referrerProfile.specialties_text}) are shown in the profession field.</span>
                    )}
                    </p>
                  </div>
                </div>
              </div>
            )}
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
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        {isEditMode ? 'Update Referral' : 'Submit Referral'}
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