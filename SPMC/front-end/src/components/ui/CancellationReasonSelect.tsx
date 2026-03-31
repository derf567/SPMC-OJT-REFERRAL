export const CANCELLATION_REASONS = [
  { value: "Patient went HAMA (Home Against Medical Advice)", label: "Patient went HAMA (Home Against Medical Advice)" },
  { value: "Patient Expired", label: "Patient Expired" },
  { value: "Patient Opted to Stay at Facility", label: "Patient Opted to Stay at Facility" },
  { value: "Referred to Nearest Tertiary Hospital", label: "Referred to Nearest Tertiary Hospital" },
  { value: "Patient Scheduled for OPD", label: "Patient Scheduled for OPD" },
  { value: "OPD Appointment No-Show", label: "OPD Appointment No-Show" },
  { value: "OPD Appointment Rescheduled", label: "OPD Appointment Rescheduled" },
  { value: "OPD Slot Unavailable", label: "OPD Slot Unavailable" },
  { value: "Referral Sent in Error", label: "Referral Sent in Error" },
  { value: "Duplicate Referral", label: "Duplicate Referral" },
  { value: "Patient Condition Improved", label: "Patient Condition Improved" },
  { value: "No Available Specialist at SPMC", label: "No Available Specialist at SPMC" },
  { value: "Others", label: "Others (Please Specify)" },
];

interface CancellationReasonSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CancellationReasonSelect({ value, onChange, className }: CancellationReasonSelectProps) {
  const isOthers = value.startsWith("Others: ") || value === "Others";
  const selectedDropdown = isOthers ? "Others" : value;
  const othersText = value.startsWith("Others: ") ? value.replace("Others: ", "") : "";

  const baseSelect =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100";

  return (
    <div className="space-y-2">
      <select
        value={selectedDropdown}
        onChange={(e) => {
          if (e.target.value === "Others") {
            onChange("Others: ");
          } else {
            onChange(e.target.value);
          }
        }}
        className={className ?? baseSelect}
      >
        <option value="">-- Select a reason --</option>
        {CANCELLATION_REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      {isOthers && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Please specify <span className="text-red-500">*</span>
          </label>
          <textarea
            value={othersText}
            onChange={(e) => onChange("Others: " + e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            placeholder="Please specify your reason..."
          />
        </div>
      )}
    </div>
  );
}
