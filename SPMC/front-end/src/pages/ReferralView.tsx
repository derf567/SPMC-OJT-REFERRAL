import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { referralsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { TransitFormDialog } from "@/components/ui/TransitFormDialog";
import { 
  ArrowLeft, 
  User, 
  Activity, 
  MapPin,
  Edit,
  Building2,
  Truck
} from "lucide-react";

export const ReferralView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [referral, setReferral] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTransitDialog, setShowTransitDialog] = useState(false);

  const loadReferral = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await referralsAPI.getById(id);
      setReferral(data);
    } catch (error: any) {
      console.error('Error loading referral:', error);
      toast({
        title: "Error",
        description: "Failed to load referral details.",
        variant: "destructive",
      });
      navigate('/referrer/referred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferral();
  }, [id, navigate, toast]);

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

  if (!referral) {
    return null;
  }

  const canEdit = referral.status === 'pending' && referral.created_by === user?.id;
  const canFillTransit = referral.status === 'dispositioned' && referral.created_by === user?.id;

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
                <p className="text-sm text-gray-500 dark:text-gray-400">Referral Details</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          {/* Header with actions */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              
              <div className="flex gap-2">
                {canEdit && (
                  <Link to={`/referral/edit/${id}`}>
                    <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                      <Edit className="w-4 h-4" />
                      Edit Referral
                    </Button>
                  </Link>
                )}
                
                {canFillTransit && (
                  <Button 
                    onClick={() => setShowTransitDialog(true)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 animate-pulse shadow-lg shadow-green-500/50"
                  >
                    <Truck className="w-4 h-4" />
                    Fill In-Transit Form
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {referral.patient_full_name}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Referral ID: {referral.referral_id}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  referral.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  referral.status === 'waiting' ? 'bg-blue-100 text-blue-800' :
                  referral.status === 'emergent' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {referral.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Patient Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Patient Category</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {referral.patient_category?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Birthday</p>
                <p className="font-medium text-gray-900 dark:text-white">{referral.birthday}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Admission Status</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {referral.admission_status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </p>
              </div>
              
              {referral.contact_numbers && referral.contact_numbers.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Patient/Watcher Contact Numbers</p>
                  <div className="space-y-1">
                    {referral.contact_numbers.map((number: string, index: number) => (
                      <p key={index} className="font-medium text-gray-900 dark:text-white">
                        {number}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Address</p>
                <p className="font-medium text-gray-900 dark:text-white">{referral.current_address}</p>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Chief Complaint</p>
                  <p className="font-medium text-gray-900 dark:text-white">{referral.chief_complaint}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Working Impression</p>
                  <p className="font-medium text-gray-900 dark:text-white">{referral.working_impression}</p>
                </div>
              </div>
              
              {referral.pertinent_history && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pertinent History</p>
                  <p className="font-medium text-gray-900 dark:text-white">{referral.pertinent_history}</p>
                </div>
              )}
              
              {referral.pertinent_physical_exam && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Physical Examination</p>
                  <p className="font-medium text-gray-900 dark:text-white">{referral.pertinent_physical_exam}</p>
                </div>
              )}
            </div>
          </div>

          {/* Latest Vital Signs */}
          {(referral.bp || referral.hr || referral.temp || referral.o2_sat) && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Latest Vital Signs</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                {referral.bp && (
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Blood Pressure</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{referral.bp}</p>
                  </div>
                )}
                
                {referral.hr && (
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Heart Rate</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{referral.hr} bpm</p>
                  </div>
                )}
                
                {referral.rr && (
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Respiratory Rate</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{referral.rr} /min</p>
                  </div>
                )}
                
                {referral.temp && (
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Temperature</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{referral.temp}°C</p>
                  </div>
                )}
                
                {referral.o2_sat && (
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">O2 Saturation</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{referral.o2_sat}%</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {referral.gcs_score && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">GCS Score</p>
                    <p className="font-bold text-gray-900 dark:text-white">{referral.gcs_score}</p>
                  </div>
                )}
                
                {referral.o2_support && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">O2 Support</p>
                    <p className="font-medium text-gray-900 dark:text-white">{referral.o2_support}</p>
                  </div>
                )}
                
                {referral.rtpcr_result && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">RTPCR Result</p>
                    <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                      referral.rtpcr_result === 'positive' ? 'bg-red-100 text-red-800' :
                      referral.rtpcr_result === 'negative' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {referral.rtpcr_result.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Referring Hospital */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Referring Hospital</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Facility Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{referral.referring_hospital_name}</p>
              </div>
              
              {referral.hospital_doh_level && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">DOH Level</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{referral.hospital_doh_level}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Referrer Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{referral.referrer_name}</p>
              </div>
              
              {referral.referrer_profession && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Profession</p>
                  <p className="font-medium text-gray-900 dark:text-white">{referral.referrer_profession}</p>
                </div>
              )}
            </div>
          </div>

          {/* Transit Information (Watcher Details) */}
          {referral.transit_info && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Watcher & Transit Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Watcher Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">{referral.transit_info.watcher_name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Age</p>
                  <p className="font-medium text-gray-900 dark:text-white">{referral.transit_info.watcher_age} years</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Relation to Patient</p>
                  <p className="font-medium text-gray-900 dark:text-white">{referral.transit_info.relation_to_patient}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Watcher Contact Number</p>
                  <p className="font-medium text-gray-900 dark:text-white text-lg">{referral.transit_info.contact_number}</p>
                </div>
                
                {referral.transit_info.escort_nurse && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Escort Nurse</p>
                    <p className="font-medium text-gray-900 dark:text-white">{referral.transit_info.escort_nurse}</p>
                  </div>
                )}
                
                {referral.transit_info.driver && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Driver</p>
                    <p className="font-medium text-gray-900 dark:text-white">{referral.transit_info.driver}</p>
                  </div>
                )}
                
                {referral.transit_info.time_ambulance_left && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Time Ambulance Left</p>
                    <p className="font-medium text-gray-900 dark:text-white">{referral.transit_info.time_ambulance_left}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transit Form Dialog */}
      <TransitFormDialog
        open={showTransitDialog}
        onOpenChange={setShowTransitDialog}
        referralId={id!}
        patientName={referral.patient_full_name}
        onSuccess={() => {
          setShowTransitDialog(false);
          loadReferral(); // Reload referral data
        }}
      />
    </div>
  );
};
