import { ReactNode, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { referralsAPI } from "@/lib/api";
import { AboutUsDialog } from "@/components/ui/AboutUsDialog";
import { NotificationContainer } from "@/components/ui/NotificationContainer";
import { NotificationPanel } from "@/components/ui/NotificationPanel";
import { TestNotificationButton } from "@/components/ui/TestNotificationButton";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { startNotificationPolling, stopNotificationPolling, checkReferrerAccountStatus, getStoredNotifications, NotificationData } from "@/lib/notificationService";
import {
  Home,
  Users,
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
  ClipboardList,
  ShieldAlert,
  Truck,
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

const getRtpcrColor = (result: string) => {
  switch (result) {
    case "positive":
      return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
    case "negative":
      return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
    case "not_done":
      return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
    default:
      return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
  }
};

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
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [activeReferralsCount, setActiveReferralsCount] = useState(0);
  const [liveNotifications, setLiveNotifications] = useState<NotificationData[]>([]);
  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);
  // Track if any modal/dialog is open to prevent auto-refresh from causing flickering
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);
   
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const navigation: NavigationItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Referral Requests", href: "/referrals", icon: Users, badge: activeReferralsCount > 0 ? activeReferralsCount.toString() : undefined },
    { name: "Endorsement & Transit", href: "/endorsement-transit", icon: ClipboardList },
    { name: "Patient Arrival", href: "/triage", icon: Truck },
    { name: "Fraud Monitor", href: "/fraud-monitor", icon: ShieldAlert },
    { name: "Outpatient", href: "/outpatient", icon: Calendar },
      { name: "Archived Referrals", href: "/patients", icon: Users },
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
    { name: "Archived Patient", href: "/department/archive", icon: Users },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ];

  // View Only navigation (read-only department access)
  const viewOnlyNavigation: NavigationItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Patients", href: "/referrals", icon: Users, badge: activeReferralsCount > 0 ? activeReferralsCount.toString() : undefined },
    { name: "Archived Patients", href: "/department/archive", icon: Calendar },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ];

  // Doctor navigation (view-only, department-filtered)
  const doctorNavigation: NavigationItem[] = [
    { name: "Dashboard", href: "/doctor/dashboard", icon: Home },
    { name: "Archived Patients", href: "/department/archive", icon: Users },
    { name: "Reports", href: "/doctor/reports", icon: BarChart3 },
  ];

  // Determine which navigation to use
  const finalNavigation = user?.role === 'doctor'
    ? doctorNavigation
    : user?.role === 'view_only'
    ? viewOnlyNavigation
    : user?.role === 'department_user' 
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
        setShowNotificationPanel(false);
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
          // Referral Requests page is pending-only for all users.
          activeReferrals = Array.isArray(referrals) 
            ? referrals.filter((ref: any) => ref.status === 'pending')
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
      } catch (error) {
        console.error('Error fetching active referrals count:', error);
        setActiveReferralsCount(0);
      }
    };

    if (user) {
      fetchActiveReferralsCount();
      // Refresh count every 30 seconds, but skip if any modal is open to prevent flickering
      const interval = setInterval(() => {
        if (!isAnyModalOpen) {
          fetchActiveReferralsCount();
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, isAnyModalOpen]);

  // Load stored notifications on mount
  useEffect(() => {
    if (user?.permissions) {
      const storedNotifications = getStoredNotifications(user.permissions);
      if (storedNotifications.length > 0) {
        setLiveNotifications(storedNotifications);
      }
    }
  }, [user?.permissions]);

  // Start notification polling
  useEffect(() => {
    if (user && user.permissions) {
      const handleNotification = (notification: NotificationData) => {
        setLiveNotifications((prev) => {
          // Avoid duplicates
          if (prev.some(n => n.id === notification.id)) {
            return prev; // Return same reference to prevent re-render
          }
          return [...prev, notification];
        });
      };

      startNotificationPolling(user.permissions, handleNotification);

      return () => {
        stopNotificationPolling();
      };
    }
  }, [user?.id, user?.permissions]); // Only re-run if user ID or permissions change

  // Check referrer account status for referrers
  useEffect(() => {
    if (user && user.role === 'referrer') {
      const handleNotification = (notification: NotificationData) => {
        setLiveNotifications((prev) => {
          // Avoid duplicates
          if (prev.some(n => n.id === notification.id)) {
            return prev; // Return same reference to prevent re-render
          }
          return [...prev, notification];
        });
      };

      // Check immediately
      checkReferrerAccountStatus(true, handleNotification);

      // Check every 30 seconds, but skip if any modal is open to reduce flickering
      const interval = setInterval(() => {
        if (!isAnyModalOpen) {
          checkReferrerAccountStatus(true, handleNotification);
        }
      }, 30000); // Changed from 10000 to 30000

      return () => clearInterval(interval);
    }
  }, [user?.id, user?.role]); // Only re-run if user ID or role changes

  const removeNotification = (id: string) => {
    setLiveNotifications((prev) => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = async (referralId?: string, _notificationType?: string) => {
    if (!referralId) return;
    
    try {
      // Don't navigate - just close the notification panel
      // The user can manually click "View Status" button on the Triage page if needed
      setShowNotificationPanel(false);
      setIsAnyModalOpen(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleAccountApprovalClick = () => {
    navigate('/admin/approvals');
  };

  const closeReferralModal = () => {
    setSelectedReferral(null);
  };

  const testNotification = () => {
    const testNotif: NotificationData = {
      id: `test_${Date.now()}`,
      type: 'new_referral', // Always use new_referral to test the loud alarm
      message: 'This is a test notification to verify the loud alarm is working correctly.',
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

  const userNameFallback = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'User';
  const subtitleFallbackForRole = ['doctor', 'department_user', 'view_only'].includes(user?.role || '')
    ? userNameFallback
    : 'User';

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
            handleNotificationClick(referralId, type);
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
              <div className="flex items-center gap-3">
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

                {/* Notifications Bell Icon */}
                <div className="relative" ref={notificationRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newState = !showNotificationPanel;
                      setShowNotificationPanel(newState);
                      setIsAnyModalOpen(newState);
                    }}
                    className={cn(
                      "relative transition-colors duration-300",
                      isDarkMode 
                        ? "text-gray-400 hover:text-white hover:bg-gray-700" 
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <Bell className="w-5 h-5" />
                    {liveNotifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-medium">
                        {Math.min(liveNotifications.length, 99)}
                      </span>
                    )}
                  </Button>

                  {/* Notification Panel */}
                  <NotificationPanel
                    isOpen={showNotificationPanel}
                    onClose={() => {
                      setShowNotificationPanel(false);
                      setIsAnyModalOpen(false);
                    }}
                    notifications={liveNotifications}
                    onNotificationClick={handleNotificationClick}
                    userPermissions={user?.permissions}
                  />
                </div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <Button
                    variant="ghost"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={cn(
                      "flex items-center gap-3 px-3 h-10 transition-colors duration-300",
                      isDarkMode 
                        ? "text-gray-300 hover:text-white hover:bg-gray-700" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">{getUserInitials()}</span>
                    </div>
                    <div className="text-left flex flex-col justify-center">
                      <p className={cn(
                        "text-sm font-medium leading-tight transition-colors duration-300",
                        isDarkMode ? "text-white" : "text-gray-900"
                      )}>{user?.role_display || (user?.is_staff ? 'EDCC Personnel' : 'User')}</p>
                      <p className={cn(
                        "text-xs leading-tight transition-colors duration-300",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      )}>{user?.edcc_edma_indicator || user?.permissions?.edcc_edma_indicator || subtitleFallbackForRole}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
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
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Initial Impression</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedReferral.working_impression}</p>
                    </div>
                  </div>

                  {/* Vital Signs */}
                  {(selectedReferral.bp ||
                    selectedReferral.hr ||
                    selectedReferral.rr ||
                    selectedReferral.temp ||
                    selectedReferral.o2_sat ||
                    selectedReferral.gcs_score ||
                    selectedReferral.o2_support ||
                    selectedReferral.rtpcr_result ||
                    selectedReferral.vital_signs_time ||
                    selectedReferral.vital_signs_date) && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Latest Vital Signs</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* First Row */}
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
                        {/* Second Row */}
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
                        {(selectedReferral.vital_signs_time || selectedReferral.vital_signs_date) && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Time Taken</p>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {selectedReferral.vital_signs_date && (
                                <p className="text-xs">{new Date(selectedReferral.vital_signs_date).toLocaleDateString()}</p>
                              )}
                              {selectedReferral.vital_signs_time && (
                                <p className="text-sm">{selectedReferral.vital_signs_time}</p>
                              )}
                            </div>
                          </div>
                        )}
                        {selectedReferral.gcs_score && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">GCS Score</p>
                            <p className="font-medium text-gray-900 dark:text-white">{selectedReferral.gcs_score}</p>
                          </div>
                        )}
                        {selectedReferral.o2_support && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">O2 Support</p>
                            <p className="font-medium text-gray-900 dark:text-white">{selectedReferral.o2_support}</p>
                          </div>
                        )}
                        {selectedReferral.rtpcr_result && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">RTPCR Result</p>
                            <div className="mt-1 flex justify-center">
                              <Badge className={getRtpcrColor(selectedReferral.rtpcr_result)}>
                                {selectedReferral.rtpcr_result.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </Badge>
                            </div>
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

                {/* Transit Information (Watcher Details) */}
                {selectedReferral.transit_info && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                      Watcher & Transit Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Watcher Name</label>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedReferral.transit_info.watcher_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Age</label>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedReferral.transit_info.watcher_age} years</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Relation to Patient</label>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedReferral.transit_info.relation_to_patient}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Watcher Contact Number</label>
                        <p className="text-sm text-gray-900 dark:text-white mt-1 font-semibold text-lg">{selectedReferral.transit_info.contact_number}</p>
                      </div>
                      {selectedReferral.transit_info.escort_nurse && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Escort Nurse</label>
                          <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedReferral.transit_info.escort_nurse}</p>
                        </div>
                      )}
                      {selectedReferral.transit_info.driver && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Driver</label>
                          <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedReferral.transit_info.driver}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
