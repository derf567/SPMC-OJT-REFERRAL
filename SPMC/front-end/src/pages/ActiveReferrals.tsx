import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReferralTable } from "@/components/dashboard/ReferralTable";

const ActiveReferrals = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Referral Requests</h1>
          <p className="text-gray-500 dark:text-gray-400">View and manage incoming referral requests</p>
        </div>
        
        <ReferralTable />
      </div>
    </DashboardLayout>
  );
};

export default ActiveReferrals;