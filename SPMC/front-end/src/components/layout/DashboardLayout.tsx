import { ReactNode, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { referralsAPI } from "@/lib/api";
import { AboutUsDialog } from "@/components/ui/AboutUsDialog";
import { NotificationContainer } from "@/components/ui/NotificationContainer";
import { TestNotificationButton } from "@/components/ui/TestNotificationButton";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { startNotificationPolling, stopNotificationPolling, NotificationData } from "@/lib/notificationService";
import {
  Home,
  Users,
  Building2,
  BarChart3,
  Calendar,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  User,
  Inbox,
  Info,
  LucideIcon,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize from localStorage or default to true
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeReferralsCount, setActiveReferralsCount] = useState(0);
  const [liveNotifications, setLiveNotifications] = useState<NotificationData[]>([]);
  const [dropdownNotifications, setDropdownNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const navigation: NavigationItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Active Referrals", href: "/referrals", icon: Users, badge: activeReferralsCount > 0 ? activeReferralsCount.toString() : undefined },
    { name: "Outpatient", href: "/outpatient", icon: Calendar },
    { name: "Archived Referrals", href: "/patients", icon: Users },
    { name: "Facilities", href: "/facilities", icon: Building2 },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ];

  // HIS Department navigation (limited access)
  const hisNavigation: NavigationItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Incoming Referrals", href: "/incoming", icon: Inbox },
    { name: "Outpatient", href: "/outpatient", icon: Calendar },
    { name: "Archived Referrals", href: "/patients", icon: Users },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ];

  // Department User navigation (department-specific access)
  const departmentNavigation: NavigationItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Incoming Patient", href: "/referrals", icon: Inbox, badge: activeReferralsCount > 0 ? activeReferralsCount.toString() : undefined },
    { name: "Archived Patient", href: "/patients", icon: Users },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ];

  // Determine which navigation to use
  const finalNavigation = user?.role === 'department_user' 
    ? departmentNavigation 
    : user?.permissions?.is_his_department 
      ? hisNavigation 
      : navigation;
  // Apply dark mode to document on mount and when isDarkMode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save to localStorage
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

  // Fetch active referrals count
  useEffect(() => {
    const fetchActiveReferralsCount = async () => {
      try {
        const response = await referralsAPI.getAll();
        const referrals = response.results || response;
        
        // Filter based on user role
        let activeReferrals = [];
        if (user?.permissions?.can_transfer_referrals && !user?.permissions?.can_triage_referrals) {
          // EDCC Personnel: Count only pending referrals
          activeReferrals = Array.isArray(referrals) 
            ? referrals.filter((ref: any) => ref.status === 'pending')
            : [];
        } else if (user?.permissions?.can_triage_referrals) {
          // Triage Users: Count waiting and triaged referrals (not yet completed)
          activeReferrals = Array.isArray(referrals) 
            ? referrals.filter((ref: any) => 
                ['waiting', 'urgent', 'emergent', 'schedule_opd', 'in_transit'].includes(ref.status)
              )
            : [];
        } else if (user?.permissions?.is_his_department) {
          // HIS Department: Count referrals that need arrival confirmation
          activeReferrals = Array.isArray(referrals) 
            ? referrals.filter((ref: any) => 
                ['urgent', 'emergent', 'schedule_opd', 'in_transit'].includes(ref.status)
              )
            : [];
        } else {
          // Other users: Count all non-completed/cancelled referrals
          activeReferrals = Array.isArray(referrals) 
            ? referrals.filter((ref: any) => !['completed', 'cancelled'].includes(ref.status))
            : [];
        }
        
        setActiveReferralsCount(activeReferrals.length);

        // Generate dynamic notifications from recent referrals
        const recentReferrals = Array.isArray(referrals) 
          ? referrals.slice(0, 5).map((ref: any) => {
              let notifType = 'info';
              let title = 'Referral Update';
              let message = '';

              if (ref.status === 'pending') {
                notifType = 'critical';
                title = 'New Referral Pending';
                message = `${ref.patient_name} from ${ref.referring_hospital || 'External Hospital'}`;
              } else if (ref.status === 'waiting') {
                notifType = 'info';
                title = 'Referral Waiting for Triage';
                message = `${ref.patient_name} - ${ref.referral_id}`;
              } else if (ref.status === 'emergent') {
                notifType = 'critical';
                title = 'Emergent Referral';
                message = `${ref.patient_name} requires immediate attention`;
              } else if (ref.status === 'urgent') {
                notifType = 'critical';
                title = 'Urgent Referral';
                message = `${ref.patient_name} - Priority case`;
              } else if (ref.status === 'completed') {
                notifType = 'success';
                title = 'Referral Completed';
                message = `${ref.patient_name} - Treatment completed`;
              } else if (ref.assigned_department) {
                notifType = 'info';
                title = 'Department Assignment';
                message = `${ref.patient_name} assigned to ${ref.assigned_department}`;
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
        
        // Count unread (for this demo, we'll count pending/waiting as unread)
        const unread = Array.isArray(referrals)
          ? referrals.filter((ref: any) => 
              ref.status === 'pending' || ref.status === 'waiting' || ref.status === 'emergent'
            ).length
          : 0;
        setUnreadCount(Math.min(unread, 99)); // Cap at 99 for display
      } catch (error) {
        console.error('Error fetching active referrals count:', error);
        setActiveReferralsCount(0);
        setUnreadCount(0);
      }
    };

    if (user) {
      fetchActiveReferralsCount();
      // Refresh count every 30 seconds
      const interval = setInterval(fetchActiveReferralsCount, 30000);
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

  // Start notification polling
  useEffect(() => {
    if (user && user.permissions) {
      const handleNotification = (notification: NotificationData) => {
        setLiveNotifications((prev) => {
          // Avoid duplicates
          if (prev.some(n => n.id === notification.id)) {
            return prev;
          }
          return [...prev, notification];
        });
      };

      startNotificationPolling(user.permissions, handleNotification);

      return () => {
        stopNotificationPolling();
      };
    }
  }, [user]);

  const removeNotification = (id: string) => {
    setLiveNotifications((prev) => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = async (referralId?: string) => {
    if (!referralId) return;
    
    try {
      // Fetch the referral details
      const referral = await referralsAPI.getById(referralId);
      setSelectedReferral(referral);
    } catch (error) {
      console.error('Error fetching referral:', error);
      // Fallback: navigate to active referrals page
      navigate('/referrals');
    }
  };

  const handleAccountApprovalClick = () => {
    navigate('/admin/account-approval');
  };

  const closeReferralModal = () => {
    setSelectedReferral(null);
  };

  const testNotification = () => {
    const testNotif: NotificationData = {
      id: `test_${Date.now()}`,
      type: user?.permissions?.can_transfer_referrals && !user?.permissions?.can_triage_referrals 
        ? 'new_referral' 
        : user?.permissions?.can_triage_referrals 
        ? 'referral_transferred' 
        : 'account_approval',
      message: 'This is a test notification to verify the system is working correctly.',
      referralId: 'TEST-001',
      timestamp: new Date().toISOString(),
    };
    setLiveNotifications((prev) => [...prev, testNotif]);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Navigate anyway in case of error
      navigate('/login');
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    }
    return user?.username?.substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <div className={cn("min-h-screen", isDarkMode ? "dark" : "")}>
      {/* Live Notifications */}
      <NotificationContainer 
        notifications={liveNotifications} 
        onRemove={removeNotification}
        onNotificationClick={(referralId, type) => {
          if (type === 'account_approval') {
            handleAccountApprovalClick();
          } else {
            handleNotificationClick(referralId);
          }
        }}
      />

      <div className={cn(
        "min-h-screen transition-colors duration-300",
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      )}>
        <div className="flex">
          {/* Sidebar - Full Height */}
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
              {finalNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                      isActive
                        ? "bg-blue-600 text-white"
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
                          ? "bg-blue-500 text-white" 
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
              {/* Search Bar - Aligned with sidebar logo */}
              <div className="flex items-center gap-6 flex-1">
                <div className="relative flex items-center flex-1 max-w-md ml-0">
                </div>
              </div>

              {/* Right side - Actions and User */}
              <div className="flex items-center gap-4">
                {/* Sound Toggle */}
                <SoundToggle />

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
                                  notification.type === 'critical' ? 'bg-red-500' :
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
                      <div className={cn(
                        "px-4 py-2 border-t transition-colors duration-300",
                        isDarkMode ? "border-gray-700" : "border-gray-200"
                      )}>
                        <Button variant="ghost" className="w-full text-blue-400 hover:text-blue-300 text-sm">
                          View All Notifications
                        </Button>
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
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{getUserInitials()}</span>
                    </div>
                    <div className="text-left">
                      <p className={cn(
                        "text-sm font-medium transition-colors duration-300",
                        isDarkMode ? "text-white" : "text-gray-900"
                      )}>{user?.full_name || user?.username}</p>
                      <p className={cn(
                        "text-xs transition-colors duration-300",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      )}>{user?.is_staff ? 'Staff' : 'User'}</p>
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

            {/* Test Notification Button - Remove after testing */}
            <TestNotificationButton onTest={testNotification} />
          </div>
        </div>

        {/* Referral Details Modal */}
        {selectedReferral && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Referral Details - {selectedReferral.referral_id}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedReferral.patient_full_name} • {selectedReferral.age} yrs • {selectedReferral.gender}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={closeReferralModal}>
                  <span className="text-2xl">&times;</span>
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Patient Status Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Patient Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Chief Complaint</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedReferral.chief_complaint}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Working Impression</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedReferral.working_impression}</p>
                    </div>
                  </div>

                  {/* Vital Signs */}
                  {(selectedReferral.bp || selectedReferral.hr || selectedReferral.rr || selectedReferral.temp || selectedReferral.o2_sat) && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Latest Vital Signs</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {selectedReferral.bp && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Blood Pressure</p>
                            <p className="font-medium text-gray-900 dark:text-white">{selectedReferral.bp}</p>
                          </div>
                        )}
                        {selectedReferral.hr && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Heart Rate</p>
                            <p className="font-medium text-gray-900 dark:text-white">{selectedReferral.hr} bpm</p>
                          </div>
                        )}
                        {selectedReferral.rr && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Respiratory Rate</p>
                            <p className="font-medium text-gray-900 dark:text-white">{selectedReferral.rr} /min</p>
                          </div>
                        )}
                        {selectedReferral.temp && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Temperature</p>
                            <p className="font-medium text-gray-900 dark:text-white">{selectedReferral.temp}°C</p>
                          </div>
                        )}
                        {selectedReferral.o2_sat && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">O2 Saturation</p>
                            <p className="font-medium text-gray-900 dark:text-white">{selectedReferral.o2_sat}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Patient Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Patient Category</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedReferral.patient_category}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Birthday</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{new Date(selectedReferral.birthday).toLocaleDateString()}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Address</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedReferral.current_address}</p>
                    </div>
                  </div>
                </div>

                {/* Referring Hospital */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Referring Hospital
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Facility Name</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedReferral.referring_hospital_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Referrer Name</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedReferral.referrer_name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={closeReferralModal}>
                  Close
                </Button>
                <Button onClick={() => {
                  closeReferralModal();
                  navigate('/referrals');
                }}>
                  View All Referrals
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
