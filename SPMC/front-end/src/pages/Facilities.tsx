import { DashboardLayout } from "@/components/layout/DashboardLayout";

const Facilities = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Healthcare Facilities</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage partner hospitals and healthcare facilities</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: "SPMC Main Hospital", type: "Primary", status: "Active", beds: 250 },
            { name: "City General Hospital", type: "Secondary", status: "Active", beds: 150 },
            { name: "Regional Medical Center", type: "Tertiary", status: "Active", beds: 300 },
            { name: "Community Health Center", type: "Primary", status: "Active", beds: 50 },
            { name: "Emergency Care Unit", type: "Emergency", status: "Active", beds: 25 },
            { name: "Specialty Clinic", type: "Specialty", status: "Maintenance", beds: 30 }
          ].map((facility, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">{facility.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  facility.status === 'Active' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                }`}>
                  {facility.status}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Type:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{facility.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Beds:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{facility.beds}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Available:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {Math.floor(facility.beds * 0.3)}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Facilities;