import { useState, useEffect } from "react";
import { Clock, User, Truck, CheckCircle, AlertTriangle } from "lucide-react";
import { referralsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface Activity {
  id: string;
  type: string;
  message: string;
  details: string;
  time: string;
  icon: any;
  color: string;
  bgColor: string;
}

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        setLoading(true);
        const response = await referralsAPI.getAll();
        const referrals = response.results || response;
        
        // Get the most recent 4 referrals and convert them to activities
        const recentReferrals = referrals
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 4);
        
        const activityList: Activity[] = recentReferrals.map((referral: any) => {
          const createdTime = new Date(referral.created_at);
          const now = new Date();
          const diffInMinutes = Math.floor((now.getTime() - createdTime.getTime()) / (1000 * 60));
          
          let timeAgo = '';
          if (diffInMinutes < 1) {
            timeAgo = 'Just now';
          } else if (diffInMinutes < 60) {
            timeAgo = `${diffInMinutes} mins ago`;
          } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
          } else {
            const days = Math.floor(diffInMinutes / 1440);
            timeAgo = `${days} day${days > 1 ? 's' : ''} ago`;
          }

          // Determine activity type and styling based on referral status
          let activityType, message, icon, color, bgColor;
          
          switch (referral.status) {
            case 'pending':
              activityType = 'referral';
              message = 'New referral submitted';
              icon = User;
              color = 'text-blue-600 dark:text-blue-400';
              bgColor = 'bg-blue-500/10';
              break;
            case 'in_transit':
              activityType = 'ambulance';
              message = 'Patient in transit';
              icon = Truck;
              color = 'text-green-600 dark:text-green-400';
              bgColor = 'bg-green-500/10';
              break;
            case 'accepted':
            case 'completed':
              activityType = 'referral';
              message = 'Referral accepted';
              icon = CheckCircle;
              color = 'text-green-600 dark:text-green-400';
              bgColor = 'bg-green-500/10';
              break;
            default:
              if (referral.priority === 'critical') {
                activityType = 'alert';
                message = 'Critical case alert';
                icon = AlertTriangle;
                color = 'text-red-600 dark:text-red-400';
                bgColor = 'bg-red-500/10';
              } else {
                activityType = 'referral';
                message = 'Referral updated';
                icon = User;
                color = 'text-blue-600 dark:text-blue-400';
                bgColor = 'bg-blue-500/10';
              }
          }

          return {
            id: referral.id || referral.referral_id,
            type: activityType,
            message,
            details: `Patient ${referral.patient_full_name} from ${referral.referring_hospital_name}`,
            time: timeAgo,
            icon,
            color,
            bgColor,
          };
        });
        
        setActivities(activityList);
      } catch (error) {
        console.error('Error fetching activities:', error);
        // Fallback to empty array on error
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRecentActivities();
      // Refresh every 2 minutes
      const interval = setInterval(fetchRecentActivities, 120000);
      return () => clearInterval(interval);
    }
  }, [user]);

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
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600 dark:text-gray-400">Loading activities...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No recent activities</p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};