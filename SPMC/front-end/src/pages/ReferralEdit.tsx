import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { referralsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  User, 
  Activity, 
  Save,
  Building2,
  AlertTriangle
} from "lucide-react";

export const ReferralEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [referral, setReferral] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const loadReferral = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await referralsAPI.getById(id);
        
        // Check permissions based on user role or permissions
        // Unified EDCC/EDMA access comes from permissions.
        const isEDCCorTriage = !!user?.permissions?.can_triage_referrals;
        
        // Debug logging
        console.log('User:', user);
        console.log('User role:', user?.role);
        console.log('Can triage:', user?.permissions?.can_triage_referrals);
        console.log('Is EDCC or Triage:', isEDCCorTriage);
        console.log('Referral created_by:', data.created_by);
        console.log('User ID:', user?.id);
        
        // Referrers can only edit pending referrals they created
        if (!isEDCCorTriage) {
          if (data.status !== 'pending') {
            toast({
              title: "Cannot Edit",
              description: "This referral is already under triage and cannot be edited.",
              variant: "destructive",
            });
            navigate(`/referral/view/${id}`);
            return;
          }
          
          if (data.created_by !== user?.id) {
            toast({
              title: "Access Denied",
              description: "You can only edit your own referrals.",
              variant: "destructive",
            });
            navigate('/referrer/referred');
            return;
          }
        }
        
        setReferral(data);
        
        // Debug: log the data to see what fields are available
        console.log('Loaded referral data:', data);
        
        // Parse patient_full_name if individual fields are not available
        let firstName = data.patient_first_name || '';
        let middleName = data.patient_middle_name || '';
        let lastName = data.patient_last_name || '';
        let suffix = data.patient_suffix || '';
        
        // If individual fields are empty but patient_full_name exists, try to parse it
        if (!firstName && !lastName && data.patient_full_name) {
          // Format is usually: "Last Name, First Name Middle Name Suffix"
          const parts = data.patient_full_name.split(',');
          if (parts.length >= 2) {
            lastName = parts[0].trim();
            const restParts = parts[1].trim().split(' ');
            firstName = restParts[0] || '';
            if (restParts.length > 1) {
              // Check if last part is a suffix (Jr., Sr., III, etc.)
              const lastPart = restParts[restParts.length - 1];
              if (['Jr.', 'Sr.', 'II', 'III', 'IV', 'V'].includes(lastPart)) {
                suffix = lastPart;
                middleName = restParts.slice(1, -1).join(' ');
              } else {
                middleName = restParts.slice(1).join(' ');
              }
            }
          }
        }
        
        setFormData({
          // Patient Info
          patient_first_name: firstName,
          patient_middle_name: middleName,
          patient_last_name: lastName,
          patient_suffix: suffix,
          patient_category: data.patient_category || '',
          birthday: data.birthday || '',
          age: data.age || '',
          gender: data.gender || '',
          current_address: data.current_address || '',
          hrn: data.hrn || '',
          admission_status: data.admission_status || '',
          
          // Patient Status
          chief_complaint: data.chief_complaint || '',
          working_impression: data.working_impression || '',
          pertinent_history: data.pertinent_history || '',
          pertinent_physical_exam: data.pertinent_physical_exam || '',
          management_done: data.management_done || '',
          
          // Vital Signs
          bp: data.bp || '',
          hr: data.hr || '',
          rr: data.rr || '',
          temp: data.temp || '',
          o2_sat: data.o2_sat || '',
          vital_signs_date: data.vital_signs_date || '',
          vital_signs_time: data.vital_signs_time || '',
          gcs_score: data.gcs_score || '',
          o2_support: data.o2_support || '',
          rtpcr_result: data.rtpcr_result || '',
          
          // Specialty
          specialty_needed: data.specialty_needed || '',
          reason_for_referral: data.reason_for_referral || '',
          
          // Referring Hospital Info
          referring_hospital: data.referring_hospital || '',
          referring_hospital_name: data.referring_hospital_name || '',
          referrer_name: data.referrer_name || '',
          referrer_profession: data.referrer_profession || '',
          referrer_cellphone: data.referrer_cellphone || '',
          mode_of_transportation: data.mode_of_transportation || '',
          consent_secured: data.consent_secured || false,
        });
      } catch (error: any) {
        console.error('Error loading referral:', error);
        toast({
          title: "Error",
          description: "Failed to load referral data.",
          variant: "destructive",
        });
        navigate('/referrer/referred');
      } finally {
        setLoading(false);
      }
    };

    loadReferral();
  }, [id, user, navigate, toast]);

  const handleChange = (field: string, value: any) => {
    // Validate vital signs fields - only allow numbers, decimal points, and "/" for BP
    const vitalSignsFields = ['bp', 'hr', 'rr', 'temp', 'o2_sat'];
    if (vitalSignsFields.includes(field) && typeof value === 'string') {
      // Only allow numbers, decimal point, and forward slash
      value = value.replace(/[^0-9/.]/g, '');
    }
    
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Prepare data for API
      let updateData: any = {
        patient_full_name: `${formData.patient_last_name}, ${formData.patient_first_name} ${formData.patient_middle_name}${formData.patient_suffix ? ' ' + formData.patient_suffix : ''}`.trim(),
        age: parseInt(formData.age) || 0,
        // Patient info
        patient_first_name: formData.patient_first_name,
        patient_middle_name: formData.patient_middle_name,
        patient_last_name: formData.patient_last_name,
        patient_suffix: formData.patient_suffix,
        patient_category: formData.patient_category,
        birthday: formData.birthday,
        gender: formData.gender,
        current_address: formData.current_address,
        // Patient status
        chief_complaint: formData.chief_complaint,
        working_impression: formData.working_impression,
        pertinent_history: formData.pertinent_history,
        pertinent_physical_exam: formData.pertinent_physical_exam,
        // Vital signs
        bp: formData.bp,
        hr: parseInt(formData.hr) || 0,
        rr: parseInt(formData.rr) || 0,
        temp: parseFloat(formData.temp) || 0,
        o2_sat: parseInt(formData.o2_sat) || 0,
        vital_signs_date: formData.vital_signs_date || null,
        vital_signs_time: formData.vital_signs_time || null,
        gcs_score: formData.gcs_score,
        o2_support: formData.o2_support,
        rtpcr_result: formData.rtpcr_result,
      };
      
      await referralsAPI.update(id!, updateData);
      
      toast({
        title: "Success! ✅",
        description: "Referral updated successfully.",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      // Navigate based on user role
      // Unified EDCC/EDMA access comes from permissions.
      if (user?.permissions?.can_triage_referrals) {
        // For EDCC/Triage, go back to Triage page
        navigate('/triage');
      } else {
        // Navigate back to My Referrals page for referrers
        navigate('/referrer/referred');
      }
    } catch (error: any) {
      console.error('Error saving referral:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update referral.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading referral...</p>
        </div>
      </div>
    );
  }

  if (!referral) return null;

  // Check if user is EDCC or Triage
  // Unified EDCC/EDMA access comes from permissions.
  const isEDCCorTriage = !!user?.permissions?.can_triage_referrals;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Patient Referral</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Editing referral {referral.referral_id}
              {!isEDCCorTriage && ' - You can only edit referrals that are still pending'}
            </p>
            
            {/* Warning - Different for referrers vs EDCC/Triage */}
            {!isEDCCorTriage ? (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium">⚠️ Editing Mode</p>
                    <p>Once this referral is under triage (status changes from "Pending"), you will no longer be able to edit it. Vital signs cannot be edited by referrers.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium">ℹ️ EDCC/Triage Edit Mode</p>
                    <p>As EDCC/Triage staff, you can edit all referral details including vital signs.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Patient Information */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Patient Information</h3>
            </div>
            
            <div className="space-y-4">
              {/* Patient Name */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.patient_first_name || ''}
                    onChange={(e) => handleChange('patient_first_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={formData.patient_middle_name || ''}
                    onChange={(e) => handleChange('patient_middle_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.patient_last_name || ''}
                    onChange={(e) => handleChange('patient_last_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Suffix
                  </label>
                  <input
                    type="text"
                    value={formData.patient_suffix || ''}
                    onChange={(e) => handleChange('patient_suffix', e.target.value)}
                    placeholder="Jr., Sr., III"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Patient Category & Birthday */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Patient Category *
                  </label>
                  <select
                    value={formData.patient_category || ''}
                    onChange={(e) => handleChange('patient_category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select category</option>
                    <option value="new_patient">New Patient of SPMC</option>
                    <option value="known_patient">Known Patient</option>
                    <option value="opd_patient">OPD Patient</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Birthday *
                  </label>
                  <input
                    type="date"
                    value={formData.birthday || ''}
                    onChange={(e) => handleChange('birthday', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => handleChange('age', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gender *
                  </label>
                  <select
                    value={formData.gender?.charAt(0).toUpperCase() + formData.gender?.slice(1).toLowerCase() || ''}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Current Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Patient Current Complete Address *
                </label>
                <textarea
                  value={formData.current_address || ''}
                  onChange={(e) => handleChange('current_address', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Patient Status */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Patient Status</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Chief Complaint *
                  </label>
                  <textarea
                    value={formData.chief_complaint || ''}
                    onChange={(e) => handleChange('chief_complaint', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Working Impression *
                  </label>
                  <textarea
                    value={formData.working_impression || ''}
                    onChange={(e) => handleChange('working_impression', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pertinent History
                </label>
                <textarea
                  value={formData.pertinent_history || ''}
                  onChange={(e) => handleChange('pertinent_history', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Physical Examination
                </label>
                <textarea
                  value={formData.pertinent_physical_exam || ''}
                  onChange={(e) => handleChange('pertinent_physical_exam', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Vital Signs - Editable for EDCC/Triage, Read-only for Referrers */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Latest Vital Signs</h4>
            {!isEDCCorTriage && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                ℹ️ Vital signs cannot be edited by referrers. Only EDCC/Triage can update these values.
              </p>
            )}
            
            <div className="grid grid-cols-3 gap-4">
              {/* First Row */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  BP
                </label>
                <input
                  type="text"
                  value={formData.bp || ''}
                  onChange={(e) => handleChange('bp', e.target.value)}
                  readOnly={!isEDCCorTriage}
                  disabled={!isEDCCorTriage}
                  placeholder="120/80"
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md ${
                    isEDCCorTriage 
                      ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  HR (bpm)
                </label>
                <input
                  type="text"
                  value={formData.hr || ''}
                  onChange={(e) => handleChange('hr', e.target.value)}
                  readOnly={!isEDCCorTriage}
                  disabled={!isEDCCorTriage}
                  placeholder="80"
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md ${
                    isEDCCorTriage 
                      ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RR (/min)
                </label>
                <input
                  type="text"
                  value={formData.rr || ''}
                  onChange={(e) => handleChange('rr', e.target.value)}
                  readOnly={!isEDCCorTriage}
                  disabled={!isEDCCorTriage}
                  placeholder="20"
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md ${
                    isEDCCorTriage 
                      ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>
              {/* Second Row */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Temp (°C)
                </label>
                <input
                  type="text"
                  value={formData.temp || ''}
                  onChange={(e) => handleChange('temp', e.target.value)}
                  readOnly={!isEDCCorTriage}
                  disabled={!isEDCCorTriage}
                  placeholder="36.5"
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md ${
                    isEDCCorTriage 
                      ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  O2 Sat (%)
                </label>
                <input
                  type="text"
                  value={formData.o2_sat || ''}
                  onChange={(e) => handleChange('o2_sat', e.target.value)}
                  readOnly={!isEDCCorTriage}
                  disabled={!isEDCCorTriage}
                  placeholder="98"
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md ${
                    isEDCCorTriage 
                      ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time Taken
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={formData.vital_signs_date || new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleChange('vital_signs_date', e.target.value)}
                    readOnly={!isEDCCorTriage}
                    disabled={!isEDCCorTriage}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md ${
                      isEDCCorTriage 
                        ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  />
                  <input
                    type="time"
                    value={formData.vital_signs_time || ''}
                    onChange={(e) => handleChange('vital_signs_time', e.target.value)}
                    readOnly={!isEDCCorTriage}
                    disabled={!isEDCCorTriage}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md ${
                      isEDCCorTriage 
                        ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Date and time when vital signs were taken</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  GCS Score
                </label>
                <input
                  type="text"
                  value={formData.gcs_score || ''}
                  onChange={(e) => handleChange('gcs_score', e.target.value)}
                  readOnly={!isEDCCorTriage}
                  disabled={!isEDCCorTriage}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md ${
                    isEDCCorTriage 
                      ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  O2 Support
                </label>
                <input
                  type="text"
                  value={formData.o2_support || ''}
                  onChange={(e) => handleChange('o2_support', e.target.value)}
                  readOnly={!isEDCCorTriage}
                  disabled={!isEDCCorTriage}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md ${
                    isEDCCorTriage 
                      ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RTPCR Result
                </label>
                {isEDCCorTriage ? (
                  <select
                    value={formData.rtpcr_result || ''}
                    onChange={(e) => handleChange('rtpcr_result', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select result</option>
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                    <option value="not_done">Not Done</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.rtpcr_result || ''}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
