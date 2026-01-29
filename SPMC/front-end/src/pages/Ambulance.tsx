import { DashboardLayout } from "@/components/layout/DashboardLayout";

const Ambulance = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ambulance Services</h1>
          <p className="text-gray-500 dark:text-gray-400">Track and manage ambulance dispatches</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-green-50 dark:bg-gray-800 border border-green-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">Available</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">5</p>
          </div>
          <div className="bg-yellow-50 dark:bg-gray-800 border border-yellow-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-2">En Route</h3>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">3</p>
          </div>
          <div className="bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Busy</h3>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">2</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-400 mb-2">Maintenance</h3>
            <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">1</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Active Dispatches</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((dispatch) => (
              <div key={dispatch} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Ambulance Unit {dispatch}</h4>
                    <p className="text-gray-500 dark:text-gray-400">Driver: Driver {dispatch}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Destination: Hospital {dispatch}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-medium">
                      En Route
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ETA: {10 + dispatch} mins</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Ambulance;