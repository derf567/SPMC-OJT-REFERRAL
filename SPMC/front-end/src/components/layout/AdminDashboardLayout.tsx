import { ReactNode, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AboutUsDialog } from "@/components/ui/AboutUsDialog";
import { NotificationContainer } from "@/components/ui/NotificationContainer";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { checkAccountApprovals, NotificationData } from "@/lib/notificationService";
import {
  Home,
  UserCheck,
  Users,
  BarChart3,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  Info,
  Bell,
} from "lucide-react";

interface AdminDashboardLayoutProps {
  children: ReactNode;
}

export const AdminDashboardLayout = ({ children }: AdminDashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [pendingApprovals] = useState(0);
  const [liveNotifications, setLiveNotifications] = useState<NotificationData[]>([]);
  const [pendingAccounts, setPendingAccounts] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: Home },
    { name: "Account Approval", href: "/admin/approvals", icon: UserCheck, badge: pendingApprovals > 0 ? pendingApprovals.toString() : undefined },
    { name: "Department Settings", href: "/admin/departments", icon: Users },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  ];

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setShowNotificationMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Start notification polling for admin
  useEffect(() => {
    if (user) {
      console.log('🔔 Admin notification polling started for user:', user.username);
      
      const handleNotification = (notification: NotificationData) => {
        setLiveNotifications((prev) => {
          // Avoid duplicates
          if (prev.some(n => n.id === notification.id)) {
            return prev;
          }
          return [...prev, notification];
        });
      };

      let approvalInterval: NodeJS.Timeout | null = null;
      let retryTimeout: NodeJS.Timeout | null = null;

      // Wait a bit to ensure token is available
      const startPolling = () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.warn('⚠️ Token not yet available, retrying in 1 second...');
          retryTimeout = setTimeout(startPolling, 1000);
          return;
        }

        console.log('✅ Token found, starting notification polling');
        
        // Fetch initial count
        fetchPendingAccounts();
        
        // Check immediately on mount
        checkAccountApprovals(true, handleNotification);
        
        // Then check every 10 seconds
        approvalInterval = setInterval(() => {
          checkAccountApprovals(true, handleNotification);
          fetchPendingAccounts();
        }, 10000);
      };

      startPolling();

      return () => {
        if (approvalInterval) {
          clearInterval(approvalInterval);
        }
        if (retryTimeout) {
          clearTimeout(retryTimeout);
        }
      };
    }
  }, [user]);

  const removeNotification = (id: string) => {
    setLiveNotifications((prev) => prev.filter(n => n.id !== id));
  };

  const handleAccountApprovalClick = () => {
    navigate('/admin/approvals');
  };

  const fetchPendingAccounts = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/referrers/?approval_status=pending', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const pending = data.results || data;
        setPendingAccounts(Array.isArray(pending) ? pending : []);
        setPendingCount(Array.isArray(pending) ? pending.length : 0);
      }
    } catch (error) {
      console.error('Error fetching pending accounts:', error);
    }
  };

  const toggleNotificationMenu = () => {
    setShowNotificationMenu(!showNotificationMenu);
    if (!showNotificationMenu) {
      fetchPendingAccounts();
    }
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
      navigate('/login');
    }
  };

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    }
    return user?.username?.substring(0, 2).toUpperCase() || 'A';
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
          }
        }}
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
              )}>SPMC Admin Portal</h1>
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
                        ? "bg-purple-600 text-white"
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
                          ? "bg-purple-500 text-white" 
                          : "bg-red-500 text-white animate-pulse"
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

          {/* Main Content */}
          <div className="flex-1 ml-64">
            {/* Top Header */}
            <header className={cn(
              "h-16 border-b flex items-center justify-between px-6 sticky top-0 z-20 transition-colors duration-300",
              isDarkMode 
                ? "bg-gray-800 border-gray-700" 
                : "bg-white border-gray-200"
            )}>
              <div className="flex items-center gap-6 flex-1">
                <h2 className="text-lg font-semibold">Administrator</h2>
              </div>

              <div className="flex items-center gap-4">
                {/* Sound Toggle */}
                <SoundToggle />

                {/* Notification Bell */}
                <div className="relative" ref={notificationMenuRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleNotificationMenu}
                    className="rounded-full relative"
                  >
                    <Bell className="w-5 h-5" />
                    {pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                        {pendingCount}
                      </span>
                    )}
                  </Button>

                  {showNotificationMenu && (
                    <div className={cn(
                      "absolute right-0 mt-2 w-80 rounded-lg shadow-lg border overflow-hidden z-50",
                      isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    )}>
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-semibold">Pending Approvals</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {pendingCount} account{pendingCount !== 1 ? 's' : ''} waiting for review
                        </p>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        {pendingAccounts.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            No pending approvals
                          </div>
                        ) : (
                          pendingAccounts.map((account) => {
                            const fullName = `${account.first_name} ${account.last_name}`;
                            const accountType = account.referrer_type === 'doctor' ? 'Doctor' : 
                                               account.referrer_type === 'hospital_employee' ? 'Hospital Employee' : 
                                               'Referrer';
                            
                            return (
                              <button
                                key={account.id}
                                onClick={() => {
                                  setShowNotificationMenu(false);
                                  navigate('/admin/approvals');
                                }}
                                className={cn(
                                  "w-full p-3 text-left border-b transition-colors",
                                  isDarkMode 
                                    ? "border-gray-700 hover:bg-gray-700" 
                                    : "border-gray-200 hover:bg-gray-50"
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                    {account.first_name[0]}{account.last_name[0]}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {fullName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {accountType}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                      {account.user.email}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                      
                      {pendingAccounts.length > 0 && (
                        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => {
                              setShowNotificationMenu(false);
                              navigate('/admin/approvals');
                            }}
                            className="w-full text-center text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                          >
                            View All Approvals →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Dark Mode Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDarkMode}
                  className="rounded-full"
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>

                <div className="relative" ref={userMenuRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2"
                  >
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {getUserInitials()}
                    </div>
                    <span className="text-sm font-medium">{user?.username}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>

                  {showUserMenu && (
                    <div className={cn(
                      "absolute right-0 mt-2 w-48 rounded-lg shadow-lg border overflow-hidden",
                      isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    )}>
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium">{user?.username}</p>
                        <p className="text-xs text-gray-500">Administrator</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};
