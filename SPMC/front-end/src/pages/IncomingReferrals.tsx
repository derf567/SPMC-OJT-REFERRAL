import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import { referralsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Clock, 
  User,
  Building2,
  Calendar,
  FileText,
  AlertCircle
} from "lucide-react";

interface IncomingReferral {
  id: number;
  referral_id: string;
  patient_full_name: string;
  age: number;
  gender: string;
  referring_hospital: {
    id: number;
    name: string;
  };
  specialty_needed: {
    id: number;
    name: string;
  };
  status: string;
  triage_decision: string;
  created_at: string;
  scheduled_date?: string;
  scheduled_time?: string;
}

const IncomingReferrals = () => {
  const [referrals, setReferrals] = useState<IncomingReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchIncomingReferrals = async () => {
    try {
      setLoading(true);
      const data = await referralsAPI.getIncomingReferrals();
      console.log('Incoming referrals data:', data);
      // Handle both array and object with results property
      const referralsList = Array.isArray(data) ? data : (data.results || []);
      setReferrals(referralsList);
    } catch (error) {
      console.error('Error fetching incoming referrals:', error);
      toast({
        title: "Error",
        description: "Failed to load incoming referrals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomingReferrals();
  }, []);

  const handleConfirmArrival = async (referralId: number) => {
    try {
      setConfirmingId(referralId);
      await referralsAPI.confirmArrival(referralId);
      toast({
        title: "Arrival Confirmed",
        description: "The patient has arrived successfully. Referral marked as completed.",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      fetchIncomingReferrals();
    } catch (error: any) {
      console.error('Error confirming arrival:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to confirm arrival. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConfirmingId(null);
    }
  };

  const getStatusBadge = (status: string, triageDecision?: string) => {
    // Show emergent badge if triage decision is emergent
    if (triageDecision === 'emergent' && status === 'in_transit') {
      return (
        <Badge className="bg-red-500 text-white flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Emergent - In Transit
        </Badge>
      );
    }
    
    switch (status) {
      case 'in_transit':
        return (
          <Badge className="bg-blue-500 text-white flex items-center gap-1">
            <Clock className="w-3 h-3" />
            In Transit
          </Badge>
        );
      case 'urgent':
        return (
          <Badge className="bg-orange-500 text-white flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Urgent
          </Badge>
        );
      case 'emergent':
        return (
          <Badge className="bg-red-500 text-white flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Emergent
          </Badge>
        );
      case 'schedule_opd':
        return (
          <Badge className="bg-green-500 text-white flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Scheduled OPD
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500 text-white flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {status.replace('_', ' ').toUpperCase()}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Incoming Referrals</h1>
            <p className="text-gray-500 dark:text-gray-400">Loading incoming referrals...</p>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Incoming Referrals</h1>
            <p className="text-gray-500 dark:text-gray-400">Confirm patient arrivals for urgent, emergent, scheduled OPD, and in-transit referrals</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Incoming</p>
              <p className="text-2xl font-bold text-blue-600">{referrals.length}</p>
            </div>
          </div>
        </div>

        {/* Referrals List */}
        <div className="grid grid-cols-1 gap-4">
          {referrals.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
              <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No incoming referrals at the moment</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Referrals will appear here when they need arrival confirmation</p>
            </div>
          ) : (
            referrals.map((referral) => (
              <div
                key={referral.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {referral.patient_full_name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {referral.referral_id}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(referral.status, referral.triage_decision)}
                    </div>

                    {/* Patient Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Age</p>
                        <p className="font-medium text-gray-900 dark:text-white">{referral.age || 'N/A'} {referral.age ? 'years' : ''}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Gender</p>
                        <p className="font-medium text-gray-900 dark:text-white capitalize">{referral.gender || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Specialty Needed
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {referral.specialty_needed?.name || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Hospital Info */}
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">
                        From: {referral.referring_hospital?.name || 'N/A'}
                      </span>
                    </div>

                    {/* Schedule Info (if applicable) */}
                    {referral.scheduled_date && (
                      <div className="flex items-center gap-2 text-sm bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-purple-700 dark:text-purple-300">
                          Scheduled: {new Date(referral.scheduled_date).toLocaleDateString()} 
                          {referral.scheduled_time && ` at ${referral.scheduled_time}`}
                        </span>
                      </div>
                    )}

                    {/* Triage Decision */}
                    {referral.triage_decision && (
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Triage Decision: <span className="font-medium">{referral.triage_decision.replace('_', ' ').toUpperCase()}</span>
                        </span>
                      </div>
                    )}

                    {/* Created Date */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      Referred: {new Date(referral.created_at).toLocaleString()}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="ml-4">
                    <Button
                      onClick={() => handleConfirmArrival(referral.id)}
                      disabled={confirmingId === referral.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {confirmingId === referral.id ? 'Processing...' : 'Arrived'}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default IncomingReferrals;
