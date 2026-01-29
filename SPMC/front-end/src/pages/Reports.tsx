import { DashboardLayout } from "@/components/layout/DashboardLayout";

const Reports = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400">View system reports and analytics</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400 mb-2">Total Referrals</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">1,234</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">+12% from last month</p>
          </div>
          <div className="bg-green-50 dark:bg-gray-800 border border-green-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">Successful</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">1,156</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">93.7% success rate</p>
          </div>
          <div className="bg-yellow-50 dark:bg-gray-800 border border-yellow-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">45</p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">Avg. 2.3 days</p>
          </div>
          <div className="bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Cancelled</h3>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">33</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">2.7% cancellation</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Trends</h3>
            <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 transition-colors duration-300">
              <p className="text-gray-500 dark:text-gray-400">Chart placeholder - Monthly referral trends</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Referring Hospitals</h3>
            <div className="space-y-3">
              {[
                { name: "SPMC Main", count: 456, percentage: 37 },
                { name: "City General", count: 234, percentage: 19 },
                { name: "Regional Medical", count: 189, percentage: 15 },
                { name: "Community Health", count: 123, percentage: 10 },
                { name: "Others", count: 232, percentage: 19 }
              ].map((hospital, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{hospital.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{hospital.count} referrals</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">{hospital.percentage}%</p>
                    <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full" 
                        style={{ width: `${hospital.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;