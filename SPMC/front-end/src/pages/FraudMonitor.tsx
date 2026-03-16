import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { referralsAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";

interface ReferralRow {
  id: number | string;
  referral_id: string;
  patient_full_name: string;
  referring_hospital_name?: string;
  chief_complaint?: string;
  fraud_risk_score?: number;
  fraud_risk_level?: "low" | "medium" | "high";
  fraud_risk_flags?: Array<{ code?: string; message?: string; points?: number }>;
  created_at?: string;
  updated_at?: string;
}

const normalizeRows = (response: any): ReferralRow[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const bucketClass = {
  low: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-900/10",
  medium: "border-amber-200 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-900/10",
  high: "border-red-200 bg-red-50/60 dark:border-red-700 dark:bg-red-900/10",
};

const FraudMonitor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<ReferralRow[]>([]);

  const fetchRows = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await referralsAPI.getAll({ ordering: "-updated_at" });
      const allRows = normalizeRows(response);
      const flagged = allRows.filter((r) => {
        const hasFlags = Array.isArray(r.fraud_risk_flags) && r.fraud_risk_flags.length > 0;
        return hasFlags || (r.fraud_risk_score || 0) > 0;
      });
      setRows(flagged);
    } catch (error) {
      console.error("Error loading fraud monitor referrals:", error);
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRows();
    const interval = setInterval(() => fetchRows(true), 20000);
    return () => clearInterval(interval);
  }, []);

  const buckets = useMemo(() => {
    const low = rows.filter((r) => (r.fraud_risk_level || "low") === "low");
    const medium = rows.filter((r) => r.fraud_risk_level === "medium");
    const high = rows.filter((r) => r.fraud_risk_level === "high");
    return { low, medium, high };
  }, [rows]);

  const renderContainer = (title: string, level: "low" | "medium" | "high", items: ReferralRow[]) => (
    <div className={`rounded-xl border p-4 ${bucketClass[level]}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-gray-800/70 text-gray-700 dark:text-gray-200">
          {items.length}
        </span>
      </div>

      <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4 text-sm text-gray-600 dark:text-gray-400">
            No referrals in this container.
          </div>
        )}

        {items.map((ref) => (
          <div key={ref.id} className="rounded-lg border border-white/70 dark:border-gray-700 bg-white/80 dark:bg-gray-800/70 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{ref.referral_id}</p>
                <p className="text-sm text-gray-700 dark:text-gray-200">{ref.patient_full_name}</p>
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Score: {ref.fraud_risk_score || 0}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {ref.referring_hospital_name || "Unknown facility"}
            </p>
            {ref.fraud_risk_flags && ref.fraud_risk_flags.length > 0 && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Flags: {ref.fraud_risk_flags.map((f) => f.code || "rule").join(", ")}
              </p>
            )}
            <div className="mt-3">
              <Button size="sm" onClick={() => navigate(`/referral/view/${ref.id}`)}>
                Open Referral
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fraud / Spam Monitor</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Organized by low, medium, and high possibility referrals.
            </p>
          </div>
          <Button onClick={() => fetchRows()} disabled={refreshing || loading} className="gap-2">
            {refreshing || loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-10 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-500" />
            <p className="text-gray-600 dark:text-gray-300">Loading flagged referrals...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {renderContainer("Low Possibility", "low", buckets.low)}
            {renderContainer("Medium Possibility", "medium", buckets.medium)}
            {renderContainer("High Possibility", "high", buckets.high)}
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="rounded-xl border border-yellow-200 dark:border-yellow-700 bg-yellow-50/80 dark:bg-yellow-900/20 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 text-yellow-700 dark:text-yellow-300" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              No flagged fraud/spam referrals found yet.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FraudMonitor;
