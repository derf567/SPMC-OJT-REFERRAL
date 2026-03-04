import { useState } from "react";
import { ChevronDown, Truck, Clock } from "lucide-react";
import { referralsAPI } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TransferActionDropdownProps {
  referralId: string;
  patientName: string;
  onFillForm: () => void;
  onDelaySuccess: () => void;
  hasDelayNotification?: boolean; // New prop to check if delay already submitted
}

export function TransferActionDropdown({
  referralId,
  patientName,
  onFillForm,
  onDelaySuccess,
  hasDelayNotification = false, // Default to false
}: TransferActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelayTransfer = async () => {
    if (!delayReason.trim()) {
      toast.error("Please provide a reason for the delay");
      return;
    }

    try {
      setIsSubmitting(true);
      await referralsAPI.delayTransfer(referralId, delayReason);
      toast.success("EDCC/Triage staff have been notified of the delay");
      setDelayModalOpen(false);
      setDelayReason("");
      setIsOpen(false);
      onDelaySuccess();
    } catch (error: any) {
      console.error("Error delaying transfer:", error);
      toast.error(error.message || "Failed to notify delay");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          Actions
          <ChevronDown className="w-4 h-4" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <button
              onClick={() => {
                onFillForm();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-900 dark:text-white transition-colors border-b border-gray-200 dark:border-gray-700"
            >
              <Truck className="w-4 h-4 text-green-600" />
              <div>
                <div className="font-medium">May Transfer</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Fill in transit form
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                if (!hasDelayNotification) {
                  setDelayModalOpen(true);
                  setIsOpen(false);
                }
              }}
              disabled={hasDelayNotification}
              className={`w-full text-left px-4 py-3 flex items-center gap-2 transition-colors ${
                hasDelayNotification
                  ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
              }`}
              title={hasDelayNotification ? 'Delay notification already submitted' : 'Notify EDCC/Triage of delay'}
            >
              <Clock className={`w-4 h-4 ${hasDelayNotification ? 'text-gray-400' : 'text-orange-600'}`} />
              <div>
                <div className={`font-medium ${hasDelayNotification ? 'text-gray-500 dark:text-gray-600' : ''}`}>
                  {hasDelayNotification ? 'Delay Already Notified' : 'Delay Transfer'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {hasDelayNotification ? 'Cannot submit again' : 'Notify EDCC/Triage'}
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Delay Reason Modal */}
      <Dialog open={delayModalOpen} onOpenChange={setDelayModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Delay Transfer Notification
            </DialogTitle>
            <DialogDescription>
              Notify EDCC/Triage staff that the transfer for{" "}
              <span className="font-semibold">{patientName}</span> is delayed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for Delay <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                placeholder="e.g., Waiting for family approval, patient not ready, transportation issue..."
                rows={4}
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDelayModalOpen(false);
                  setDelayReason("");
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDelayTransfer}
                disabled={isSubmitting || !delayReason.trim()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isSubmitting ? "Notifying..." : "Notify Delay"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
