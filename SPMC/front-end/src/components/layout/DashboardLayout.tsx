import { ReactNode, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  FileText,
  Users,
  Truck,
  Building2,
  BarChart3,
  Settings,
  Search,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Active Referrals", href: "/referrals", icon: Users, badge: "12" },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Ambulance", href: "/ambulance", icon: Truck },
  { name: "Facilities", href: "/facilities", icon: Building2 },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

const notifications = [
  {
    id: 1,
    title: "New Critical Referral",
    message: "Patient Juan Dela Cruz requires immediate attention",
    time: "2 mins ago",
    type: "critical"
  },
  {
    id: 2,
    title: "Ambulance Dispatched",
    message: "Unit A-03 en route to Metro Davao Medical",
    time: "5 mins ago",
    type: "info"
  },
  {
    id: 3,
    title: "Bed Available",
    message: "ICU bed now available at SPMC Emergency",
    time: "10 mins ago",
    type: "success"
  }
];

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
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

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
              "flex items-center gap-3 p-4 border-b h-16",
              isDarkMode ? "border-gray-700" : "border-gray-200"
            )}>
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div>
                <h1 className={cn(
                  "font-semibold transition-colors duration-300",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>SPMC</h1>
                <p className={cn(
                  "text-xs transition-colors duration-300",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )}>Referral System</p>
              </div>
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
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isDarkMode 
                    ? "text-gray-400 hover:text-white hover:bg-gray-700" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <Settings className="w-5 h-5 mr-3" />
                Settings
              </Button>
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
                  <Search className={cn(
                    "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )} />
                  <input
                    type="text"
                    placeholder="Search patients, referrals..."
                    className={cn(
                      "w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300",
                      isDarkMode 
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    )}
                  />
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
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-medium">
                      3
                    </span>
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
                        {notifications.map((notification) => (
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
                        ))}
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