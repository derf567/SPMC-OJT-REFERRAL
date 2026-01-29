import { Clock, User, Truck, CheckCircle, AlertTriangle } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "referral",
    message: "New referral submitted",
    details: "Patient Juan Dela Cruz from Davao Regional Hospital",
    time: "5 mins ago",
    icon: User,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    id: 2,
    type: "ambulance",
    message: "Ambulance dispatched",
    details: "Unit A-03 heading to Metro Davao Medical",
    time: "12 mins ago",
    icon: Truck,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10",
  },
  {
    id: 3,
    type: "referral",
    message: "Referral accepted",
    details: "Patient transfer to SPMC - Cardiology",
    time: "30 mins ago",
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10",
  },
  {
    id: 4,
    type: "alert",
    message: "Critical case alert",
    details: "High-priority patient requires immediate attention",
    time: "1 hour ago",
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10",
  },
];

export const ActivityFeed = () => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-300">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Activity</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Real-time system updates</p>
        </div>
        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
          See All
        </button>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                <activity.icon className={`w-4 h-4 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {activity.details}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                  <p className="text-xs text-gray-400 dark:text-gray-500">{activity.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};