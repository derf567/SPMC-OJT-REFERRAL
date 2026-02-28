import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { referralsAPI } from "@/lib/api";
import { toast } from "sonner";
import { Truck, Loader2 } from "lucide-react";

interface TransitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralId: string;
  patientName: string;
  onSuccess: () => void;
}

export function TransitFormDialog({ 
  open, 
  onOpenChange, 
  referralId, 
  patientName,
  onSuccess 
}: TransitFormDialogProps) {
  // Patient & Watcher Information
  const [watcherName, setWatcherName] = useState('');
  const [watcherAge, setWatcherAge] = useState('');
  const [relationToPatient, setRelationToPatient] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  
  // Transit Team
  const [escortNurse, setEscortNurse] = useState('');
  const [driver, setDriver] = useState('');
  const [referringMD, setReferringMD] = useState('');
  const [timeAmbulanceLeft, setTimeAmbulanceLeft] = useState('');
  
  // Medical Information
  const [latestVS, setLatestVS] = useState('');
  const [gcs, setGCS] = useState('');
  
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!watcherName || !watcherAge || !relationToPatient || !contactNumber) {
      toast.error('Please fill in all required watcher information fields');
      return;
    }

    try {
      setSubmitting(true);
      
      await referralsAPI.fillTransitInfo(referralId, {
        watcher_name: watcherName,
        watcher_age: parseInt(watcherAge),
        relation_to_patient: relationToPatient,
        contact_number: contactNumber,
        escort_nurse: escortNurse,
        driver: driver,
        referring_md: referringMD,
        latest_vs: latestVS,
        gcs: gcs,
        time_ambulance_left: timeAmbulanceLeft || undefined,
      });

      toast.success('Transit information saved successfully!');
      onSuccess();
      
      // Reset form
      setWatcherName('');
      setWatcherAge('');
      setRelationToPatient('');
      setContactNumber('');
      setEscortNurse('');
      setDriver('');
      setReferringMD('');
      setTimeAmbulanceLeft('');
      setLatestVS('');
      setGCS('');
    } catch (error: any) {
      console.error('Error submitting transit info:', error);
      toast.error(error.message || 'Failed to save transit information');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Truck className="w-6 h-6 text-blue-600" />
            Fill In-Transit Form
          </DialogTitle>
          <DialogDescription>
            Please provide transit information for patient: <span className="font-semibold">{patientName}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient & Watcher Information */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-4">
              Patient & Watcher Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Watcher's Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Full name of watcher"
                  value={watcherName}
                  onChange={(e) => setWatcherName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Watcher's Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Age in years"
                  value={watcherAge}
                  onChange={(e) => setWatcherAge(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Relation to Patient <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Wife, Son, Mother"
                  value={relationToPatient}
                  onChange={(e) => setRelationToPatient(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="09XXXXXXXXX"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Transit Team */}
          <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-4">
              Transit Team
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Escort Nurse
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nurse name"
                  value={escortNurse}
                  onChange={(e) => setEscortNurse(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Driver
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Driver name"
                  value={driver}
                  onChange={(e) => setDriver(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Referring MD/Contact
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Dr. Name / Contact"
                  value={referringMD}
                  onChange={(e) => setReferringMD(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Ambulance Left
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={timeAmbulanceLeft}
                  onChange={(e) => setTimeAmbulanceLeft(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-4">
              Medical Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Latest Vital Signs
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  placeholder="BP: 120/80, HR: 80, RR: 20, Temp: 36.5°C, O2Sat: 98%"
                  rows={4}
                  value={latestVS}
                  onChange={(e) => setLatestVS(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  GCS Score
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="15 (E4V5M6) or Alert"
                  value={gcs}
                  onChange={(e) => setGCS(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4 mr-2" />
                  Submit Transit Form
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
