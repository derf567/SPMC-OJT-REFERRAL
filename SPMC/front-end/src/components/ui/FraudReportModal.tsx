import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { referralsAPI } from "@/lib/api";

interface FraudReportModalProps {
  referral: {
    id: number | string;
    referral_id: string;
    patient_full_name: string;
    referring_hospital_name?: string;
    created_by_user?: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

const FRAUD_TYPES = [
  { value: 'fake_patient', label: 'Fake Patient Information', description: 'Patient information appears to be fabricated or false' },
  { value: 'duplicate', label: 'Duplicate Referral', description: 'This referral is a duplicate of an existing one' },
  { value: 'false_emergency', label: 'False Emergency Claim', description: 'Emergency status is exaggerated or false' },
  { value: 'wrong_hospital', label: 'Wrong Hospital Information', description: 'Hospital information is incorrect or misleading' },
  { value: 'incomplete_info', label: 'Deliberately Incomplete Information', description: 'Critical information intentionally omitted' },
  { value: 'system_abuse', label: 'System Abuse', description: 'Misuse of the referral system' },
  { value: 'spam', label: 'Spam/Test Referral', description: 'Spam or test referral submitted inappropriately' },
  { value: 'other', label: 'Other Suspicious Activity', description: 'Other fraudulent or suspicious activity' },
];

export const FraudReportModal = ({ referral, onClose, onSuccess }: FraudReportModalProps) => {
  const [selectedType, setSelectedType] = useState("");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a fraud type.",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide a reason for reporting this referral.",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      await referralsAPI.reportFraud(referral.id, {
        fraud_type: selectedType,
        reason: reason.trim(),
        evidence: evidence.trim(),
      });

      toast({
        title: "Report Submitted Successfully",
        description: "The fraud report has been submitted to administrators for review.",
        className: "bg-green-50 border-green-200 text-green-800",
      });

      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error submitting fraud report:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.response?.data?.error || error.message || "Failed to submit fraud report. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Report Suspicious Activity
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Referral: {referral.referral_id}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Referral Information */}
          <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Referral Information
            </h3>
            <div className="space-y-1 text-sm">
              <p className="text-gray-900 dark:text-white">
                <span className="font-medium">Patient:</span> {referral.patient_full_name}
              </p>
              {referral.referring_hospital_name && (
                <p className="text-gray-900 dark:text-white">
                  <span className="font-medium">Hospital:</span> {referral.referring_hospital_name}
                </p>
              )}
              {referral.created_by_user && (
                <p className="text-gray-900 dark:text-white">
                  <span className="font-medium">Created by:</span> {referral.created_by_user}
                </p>
              )}
            </div>
          </div>

          {/* Warning Notice */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">Important Notice</p>
                <p>
                  False reports may result in disciplinary action. Only report referrals if you have genuine concerns about fraudulent activity. All reports are reviewed by administrators.
                </p>
              </div>
            </div>
          </div>

          {/* Fraud Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Type of Suspicious Activity <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FRAUD_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value)}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    selectedType === type.value
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    {type.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {type.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for Report <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why you believe this referral is fraudulent or suspicious..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              rows={4}
              required
              disabled={submitting}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Provide specific details about what makes this referral suspicious
            </p>
          </div>

          {/* Evidence (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Evidence or Additional Details (Optional)
            </label>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Provide any evidence, cross-references, or additional details that support your report..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              rows={3}
              disabled={submitting}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Include any supporting information such as duplicate referral IDs, inconsistencies found, etc.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
