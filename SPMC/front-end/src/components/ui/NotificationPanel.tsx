import { useState, useEffect } from 'react';
import { Bell, X, Archive, ChevronDown } from 'lucide-react';
import { NotificationData, getStoredNotifications, clearAllStoredNotifications } from '@/lib/notificationService';
import { cn } from '@/lib/utils';

interface NotificationWithStatus extends NotificationData {
  isRead: boolean;
  readAt?: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationData[];
  onNotificationClick?: (referralId?: string, type?: string) => void;
  userPermissions?: any;
}

export const NotificationPanel = ({
  isOpen,
  onClose,
  notifications,
  onNotificationClick,
  userPermissions
}: NotificationPanelProps) => {
  const [displayedNotifications, setDisplayedNotifications] = useState<NotificationWithStatus[]>([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 10;

  useEffect(() => {
    // Load from both incoming notifications and stored notifications
    // Pass userPermissions to filter stored notifications by role
    const storedNotifications = getStoredNotifications(userPermissions);
    const allNotifications = [...notifications, ...storedNotifications];
    
    // Remove duplicates by ID
    const uniqueNotifications = Array.from(
      new Map(allNotifications.map(n => [n.id, n])).values()
    );

    // Convert notifications to include read status
    const notificationsWithStatus = uniqueNotifications.map(notif => ({
      ...notif,
      isRead: localStorage.getItem(`notification_read_${notif.id}`) === 'true',
      readAt: localStorage.getItem(`notification_read_at_${notif.id}`) || undefined
    }));
    setDisplayedNotifications(notificationsWithStatus);
  }, [notifications, userPermissions]);

  const getDateFilter = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      today: today.toISOString(),
      yesterday: yesterday.toISOString(),
      thisMonth: thisMonthStart.toISOString()
    };
  };

  const filterNotificationsByDate = () => {
    if (selectedDateFilter === 'all') return displayedNotifications;

    const filters = getDateFilter();

    return displayedNotifications.filter(notif => {
      const notifDate = new Date(notif.timestamp);
      
      switch (selectedDateFilter) {
        case 'today':
          return notifDate >= new Date(filters.today);
        case 'yesterday':
          return notifDate >= new Date(filters.yesterday) && notifDate < new Date(filters.today);
        case 'thisMonth':
          return notifDate >= new Date(filters.thisMonth);
        default:
          return true;
      }
    });
  };

  const filteredNotifications = filterNotificationsByDate();
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const displayNotifications = filteredNotifications.slice(startIndex, endIndex);
  const hasMoreNotifications = filteredNotifications.length > endIndex;

  const handleNotificationClick = (notification: NotificationWithStatus) => {
    // Mark as read
    localStorage.setItem(`notification_read_${notification.id}`, 'true');
    localStorage.setItem(`notification_read_at_${notification.id}`, new Date().toISOString());
    
    // Update local state - mark as read but DON'T remove
    setDisplayedNotifications(prev => 
      prev.map(n => 
        n.id === notification.id 
          ? { ...n, isRead: true, readAt: new Date().toISOString() }
          : n
      )
    );

    // Navigate if it's a referral notification
    if (notification.referralId && onNotificationClick) {
      onNotificationClick(notification.referralId, notification.type);
    }
  };

  const handleClearAll = () => {
    setDisplayedNotifications([]);
    clearAllStoredNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_referral':
        return '🆕';
      case 'referral_transferred':
        return '✓';
      case 'account_approval':
        return '👤';
      case 'account_approved':
        return '✓';
      case 'account_rejected':
        return '⚠️';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_referral':
        return 'hover:bg-blue-50 dark:hover:bg-blue-900/20 border-l-4 border-blue-500';
      case 'referral_transferred':
        return 'hover:bg-green-50 dark:hover:bg-green-900/20 border-l-4 border-green-500';
      case 'account_approval':
        return 'hover:bg-purple-50 dark:hover:bg-purple-900/20 border-l-4 border-purple-500';
      case 'account_approved':
        return 'hover:bg-green-50 dark:hover:bg-green-900/20 border-l-4 border-green-500';
      case 'account_rejected':
        return 'hover:bg-orange-50 dark:hover:bg-orange-900/20 border-l-4 border-orange-500';
      default:
        return 'hover:bg-gray-50 dark:hover:bg-gray-900/20 border-l-4 border-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={onClose}
        />
      )}

      {/* Notification Panel */}
      <div
        className={cn(
          'fixed top-16 right-6 w-96 max-h-[700px] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 flex flex-col',
          isOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h2>
            {displayedNotifications.filter(n => !n.isRead).length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">
                {displayedNotifications.filter(n => !n.isRead).length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Date Filter */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              <span>Filter by date:</span>
              <span className="text-blue-600 dark:text-blue-400">
                {selectedDateFilter === 'all' ? 'All' : selectedDateFilter.charAt(0).toUpperCase() + selectedDateFilter.slice(1)}
              </span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", showDateFilter && "rotate-180")} />
            </button>
            
            {showDateFilter && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                {['all', 'today', 'yesterday', 'thisMonth'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => {
                      setSelectedDateFilter(filter);
                      setShowDateFilter(false);
                    }}
                    className={cn(
                      "block w-full text-left px-4 py-2 text-sm transition-colors",
                      selectedDateFilter === filter
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    )}
                  >
                    {filter === 'all' ? 'All Notifications' : 
                     filter === 'today' ? 'Today' :
                     filter === 'yesterday' ? 'Yesterday' :
                     'This Month'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {displayNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Archive className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {displayNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'p-4 cursor-pointer transition-all duration-300',
                    getNotificationColor(notification.type),
                    !notification.isRead && 'bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-200 dark:ring-blue-800 animate-pulse'
                  )}
                >
                  <div className="flex gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                          {notification.message}
                        </p>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5"></div>
                        )}
                      </div>
                      {notification.referralId && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                          ID: {notification.referralId}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {formatDate(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2">
          {displayedNotifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Clear all
            </button>
          )}
          {hasMoreNotifications && (
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="w-full px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              Load more notifications
            </button>
          )}
        </div>
      </div>
    </>
  );
};
