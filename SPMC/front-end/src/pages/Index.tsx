import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ReferralTable } from "@/components/dashboard/ReferralTable";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  FileText,
  Users,
  Truck,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-current">Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Welcome back, Dr. Maria Santos. Here's today's overview.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Last updated: Just now</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Referrals Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">24</p>
                <p className="text-xs mt-1 text-green-600 dark:text-green-400">+12% from yesterday</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Cases</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">8</p>
                <p className="text-xs mt-1 text-yellow-600 dark:text-yellow-400">3 critical</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">16</p>
                <p className="text-xs mt-1 text-green-600 dark:text-green-400">+5 from yesterday</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Ambulances</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">6</p>
                <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">2 en route</p>
              </div>
              <div className="p-3 rounded-lg bg-cyan-500/10">
                <Truck className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Table */}
          <div className="lg:col-span-2">
            <ReferralTable />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <QuickActions />
            <ActivityFeed />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
