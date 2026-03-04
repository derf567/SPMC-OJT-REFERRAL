import { ReactNode, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { referralsAPI } from "@/lib/api";
import { AboutUsDialog } from "@/components/ui/AboutUsDialog";
import { NotificationContainer } from "@/components/ui/NotificationContainer";
import { startNotificationPolling, stopNotificationPolling, checkReferrerAccountStatus, NotificationData } from "@/lib/notificationService";
import {
  Home,
  FileText,
  BarChart3,
  Settings,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  User,
  Plus,
  Info,
} from "lucide-react";

interface ReferrerDashboardLayoutProps {
  children: ReactNode;
}

const notifications = [
  {
    id: 1,
    title: "Referral Accepted",
    message: "Your referral for Maria Santos has been accepted by SPMC",
    time: "2 mins ago",
    type: "success"
  },
  {
    id: 2,
    title: "Referral Update",
    message: "Patient Juan Dela Cruz has been scheduled for OPD",
    time: "1 hour ago",
    type: "info"
  },
  {
    id: 3,
    title: "Referral Completed",
    message: "Treatment completed for patient Anna Garcia",
    time: "3 hours ago",
    type: "success"
  }
];

export const ReferrerDashboardLayout = ({ children }: ReferrerDashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [myReferralsCount, setMyReferralsCount] = useState(0);
  const [liveNotifications, setLiveNotifications] = useState<NotificationData[]>([]);
  const [dropdownNotifications, setDropdownNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const navigation = [
    { name: "Dashboard", href: "/referrer", icon: Home },
    { name: "My Referrals", href: "/referrer/referred", icon: FileText, badge: myReferralsCount > 0 ? myReferralsCount.toString() : undefined },
    { name: "Reports", href: "/referrer/reports", icon: BarChart3 },
    { name: "New Referral", href: "/referral", icon: Plus, highlight: true },
  ];

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch my referrals count
  useEffect(() => {
    const fetchMyReferralsCount = async () => {
      try {
        const response = await referralsAPI.getMyReferrals();
        const referrals = response.results || response;
        
        // Count active referrals (not completed or cancelled)
        const activeReferrals = Array.isArray(referrals) 
          ? referrals.filter((ref: any) => !['completed', 'cancelled'].includes(ref.status))
          : [];
        
        setMyReferralsCount(activeReferrals.length);

        // Generate dynamic notifications from recent referrals
        const recentReferrals = Array.isArray(referrals) 
          ? referrals.slice(0, 5).map((ref: any) => {
              let notifType = 'info';
              let title = 'Referral Update';
              let message = '';

              if (ref.status === 'pending') {
                notifType = 'info';
                title = 'Referral Submitted';
                message = `Your referral for ${ref.patient_name} is pending review`;
              } else if (ref.status === 'waiting') {
                notifType = 'info';
                title = 'Referral Accepted';
                message = `${ref.patient_name} has been accepted by SPMC`;
              } else if (ref.triage_decision === 'emergent' && ref.status === 'in_transit') {
                notifType = 'critical';
                title = 'EMERGENT - Transfer Immediately';
                message = `${ref.patient_name} requires immediate emergency care`;
              } else if (ref.status === 'urgent') {
                notifType = 'warning';
                title = 'Urgent Triage Call';
                message = `${ref.patient_name} - Please respond to determine transport timing`;
              } else if (ref.status === 'completed') {
                notifType = 'success';
                title = 'Referral Completed';
                message = `Treatment completed for ${ref.patient_name}`;
              } else if (ref.status === 'schedule_opd') {
                notifType = 'info';
                title = 'OPD Scheduled';
                message = `${ref.patient_name} scheduled for outpatient`;
              }

              const timeAgo = getTimeAgo(ref.updated_at || ref.created_at);

              return {
                id: ref.id,
                title,
                message,
                time: timeAgo,
                type: notifType,
              };
            })
          : [];

        setDropdownNotifications(recentReferrals);
        
        // Count unread (active referrals)
        setUnreadCount(Math.min(activeReferrals.length, 99));
      } catch (error) {
        console.error('Error fetching my referrals count:', error);
        setMyReferralsCount(0);
        setUnreadCount(0);
      }
    };

    if (user) {
      fetchMyReferralsCount();
      const interval = setInterval(fetchMyReferralsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Helper function to calculate time ago
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Notification polling for referrers (they don't need real-time notifications in this context)
  // But we keep the structure for consistency
  const removeNotification = (id: string) => {
    setLiveNotifications((prev) => prev.filter(n => n.id !== id));
  };

  // Check referrer account status for account approval/rejection notifications
  useEffect(() => {
    if (user && user.role === 'referrer') {
      const handleNotification = (notification: NotificationData) => {
        setLiveNotifications((prev) => {
          // Avoid duplicates
          if (prev.some(n => n.id === notification.id)) {
            return prev;
          }
          return [...prev, notification];
        });
      };

      // Check immediately
      checkReferrerAccountStatus(true, handleNotification);

      // Check every 10 seconds
      const interval = setInterval(() => {
        checkReferrerAccountStatus(true, handleNotification);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
    }
  };

  const getUserInitials = () => {
    // For hospital accounts, use hospital name initials
    if (user?.hospital_name) {
      const words = user.hospital_name.split(' ');
      if (words.length >= 2) {
        return `${words[0].charAt(0)}${words[1].charAt(0)}`;
      }
      return user.hospital_name.substring(0, 2).toUpperCase();
    }
    // Fallback to user name
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    }
    return user?.username?.substring(0, 2).toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    // For hospital accounts, show hospital name
    if (user?.hospital_name) {
      return user.hospital_name;
    }
    // Fallback to user full name or username
    return user?.full_name || user?.first_name || user?.username;
  };

  return (
    <div className={cn("min-h-screen", isDarkMode ? "dark" : "")}>
      {/* Live Notifications */}
      <NotificationContainer 
        notifications={liveNotifications} 
        onRemove={removeNotification} 
      />

      <div className={cn(
        "min-h-screen transition-colors duration-300",
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      )}>
        <div className="flex">
          {/* Sidebar */}
          <div className={cn(
            "w-64 border-r min-h-screen fixed left-0 top-0 z-30",
            isDarkMode 
              ? "bg-gray-800 border-gray-700" 
              : "bg-white border-gray-200"
          )}>
            {/* Logo Section */}
            <div className={cn(
              "flex flex-col items-center justify-center p-6 border-b",
              isDarkMode ? "border-gray-700" : "border-gray-200"
            )}>
              <img 
                src="/SPMC-Logo.png" 
                alt="SPMC Logo" 
                className="w-20 h-20 mb-3 object-contain"
              />
              <h1 className={cn(
                "text-sm font-semibold text-center transition-colors duration-300",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>SPMC Referral System</h1>
            </div>

            <nav className="p-4 space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                      isActive
                        ? "bg-green-600 text-white"
                        : item.highlight
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : isDarkMode
                          ? "text-gray-300 hover:text-white hover:bg-gray-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={cn(
                        "px-2 py-0.5 text-xs rounded-full font-medium transition-all duration-300",
                        isActive 
                          ? "bg-green-500 text-white" 
                          : item.badge === "New" 
                            ? "bg-green-500 text-white"
                            : isDarkMode
                              ? "bg-gray-600 text-gray-300"
                              : "bg-gray-200 text-gray-600"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            
            <div className="absolute bottom-4 left-4 right-4">
              <AboutUsDialog isDarkMode={isDarkMode} trigger={
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    isDarkMode 
                      ? "text-gray-400 hover:text-white hover:bg-gray-700" 
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <Info className="w-5 h-5 mr-3" />
                  About us
                </Button>
              } />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 ml-64">
            {/* Top Header */}
            <header className={cn(
              "h-16 border-b flex items-center justify-between px-6 sticky top-0 z-20 transition-colors duration-300",
              isDarkMode 
                ? "bg-gray-800 border-gray-700" 
                : "bg-white border-gray-200"
            )}>
              <div className="flex items-center gap-6 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium",
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  )}>
                    Welcome back, {getDisplayName()}
                  </span>
                </div>
              </div>

              {/* Right side - Actions and User */}
              <div className="flex items-center gap-4">
                {/* Dark Mode Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleDarkMode}
                  className={cn(
                    "transition-colors duration-300",
                    isDarkMode 
                      ? "text-gray-400 hover:text-white hover:bg-gray-700" 
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={cn(
                      "relative transition-colors duration-300",
                      isDarkMode 
                        ? "text-gray-400 hover:text-white hover:bg-gray-700" 
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-medium">
                        {unreadCount}
                      </span>
                    )}
                  </Button>

                  {showNotifications && (
                    <div className={cn(
                      "absolute right-0 top-full mt-2 w-80 border rounded-lg shadow-lg py-2 z-50 transition-colors duration-300",
                      isDarkMode 
                        ? "bg-gray-800 border-gray-700" 
                        : "bg-white border-gray-200"
                    )}>
                      <div className={cn(
                        "px-4 py-2 border-b transition-colors duration-300",
                        isDarkMode ? "border-gray-700" : "border-gray-200"
                      )}>
                        <h3 className={cn(
                          "font-medium transition-colors duration-300",
                          isDarkMode ? "text-white" : "text-gray-900"
                        )}>Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {dropdownNotifications.length > 0 ? (
                          dropdownNotifications.map((notification) => (
                            <div key={notification.id} className={cn(
                              "px-4 py-3 border-b transition-colors duration-300",
                              isDarkMode 
                                ? "hover:bg-gray-700 border-gray-700/50" 
                                : "hover:bg-gray-50 border-gray-200/50"
                            )}>
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                  notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                                }`}></div>
                                <div className="flex-1">
                                  <p className={cn(
                                    "text-sm font-medium transition-colors duration-300",
                                    isDarkMode ? "text-white" : "text-gray-900"
                                  )}>{notification.title}</p>
                                  <p className={cn(
                                    "text-xs mt-1 transition-colors duration-300",
                                    isDarkMode ? "text-gray-400" : "text-gray-600"
                                  )}>{notification.message}</p>
                                  <p className={cn(
                                    "text-xs mt-1 transition-colors duration-300",
                                    isDarkMode ? "text-gray-500" : "text-gray-500"
                                  )}>{notification.time}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center">
                            <p className={cn(
                              "text-sm transition-colors duration-300",
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            )}>No notifications</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <Button
                    variant="ghost"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={cn(
                      "flex items-center gap-2 px-3 transition-colors duration-300",
                      isDarkMode 
                        ? "text-gray-300 hover:text-white hover:bg-gray-700" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{getUserInitials()}</span>
                    </div>
                    <div className="text-left">
                      <p className={cn(
                        "text-sm font-medium transition-colors duration-300",
                        isDarkMode ? "text-white" : "text-gray-900"
                      )}>{getDisplayName()}</p>
                      <p className={cn(
                        "text-xs transition-colors duration-300",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      )}>{user?.hospital_name ? 'Hospital' : 'Referrer'}</p>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Button>

                  {showUserMenu && (
                    <div className={cn(
                      "absolute right-0 top-full mt-2 w-48 border rounded-lg shadow-lg py-2 z-50 transition-colors duration-300",
                      isDarkMode 
                        ? "bg-gray-800 border-gray-700" 
                        : "bg-white border-gray-200"
                    )}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start px-4 py-2 transition-colors duration-300",
                          isDarkMode 
                            ? "text-gray-300 hover:text-white hover:bg-gray-700" 
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        )}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Button>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start px-4 py-2 transition-colors duration-300",
                          isDarkMode 
                            ? "text-gray-300 hover:text-white hover:bg-gray-700" 
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        )}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                      <hr className={cn(
                        "my-2 transition-colors duration-300",
                        isDarkMode ? "border-gray-700" : "border-gray-200"
                      )} />
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};