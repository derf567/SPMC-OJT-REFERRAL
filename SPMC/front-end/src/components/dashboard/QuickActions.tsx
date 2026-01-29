import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, FileText, Truck, Users, Activity, Stethoscope } from "lucide-react";

const quickActions = [
  {
    title: "New Referral",
    description: "Create patient referral",
    icon: Plus,
    href: "/referral/new",
    color: "bg-blue-500",
  },
  {
    title: "Emergency Ambulance",
    description: "Request emergency transport",
    icon: Truck,
    href: "/ambulance",
    color: "bg-green-500",
  },
  {
    title: "Check Bed Status",
    description: "View availability",
    icon: Activity,
    href: "/facilities",
    color: "bg-green-500",
  },
  {
    title: "Contact Facility",
    description: "Call partner hospital",
    icon: Stethoscope,
    href: "/facilities",
    color: "bg-orange-500",
  },
];

export const QuickActions = () => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-300">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Common tasks at your fingertips</p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.href} className="block">
              <div className={`${action.color} rounded-lg p-4 hover:opacity-90 transition-opacity cursor-pointer`}>
                <action.icon className="w-6 h-6 text-white mb-2" />
                <h4 className="font-medium text-white text-sm">{action.title}</h4>
                <p className="text-xs text-white/80">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};