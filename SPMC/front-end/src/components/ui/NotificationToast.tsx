import { useEffect, useState } from 'react';
import { Bell, CheckCircle, UserCheck, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationToastProps {
  id: string;
  type: 'new_referral' | 'referral_transferred' | 'account_approval' | 'account_rejected' | 'account_approved' | 'referrer_account_update';
  message: string;
  referralId?: string;
  onClose: (id: string) => void;
  onClick?: (referralId?: string) => void;
}

export const NotificationToast = ({ id, type, message, referralId, onClose, onClick }: NotificationToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 10);

    // Start fade out after 7.7 seconds (to complete at 8 seconds)
    const fadeOutTimer = setTimeout(() => {
      setIsExiting(true);
    }, 7700);

    // Remove from visible notifications after 8 seconds (but keep in panel)
    const removeTimer = setTimeout(() => {
      onClose(id);
    }, 8000);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(removeTimer);
    };
  }, [id, onClose]);

  const handleClick = () => {
    if (onClick) {
      onClick(referralId);
    }
    setIsExiting(true);
    // Remove from DOM after fade-out so it doesn't block clicks underneath
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const handleCloseButton = () => {
    setIsExiting(true);
    // Remove from DOM after fade-out animation completes so it doesn't block clicks
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'new_referral':
        return <Bell className="w-5 h-5" />;
      case 'referral_transferred':
        return <CheckCircle className="w-5 h-5" />;
      case 'account_approval':
        return <UserCheck className="w-5 h-5" />;
      case 'account_approved':
        return <CheckCircle className="w-5 h-5" />;
      case 'account_rejected':
        return <AlertCircle className="w-5 h-5" />;
      case 'referrer_account_update':
        return <UserCheck className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'new_referral':
        return {
          bg: 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30',
          border: 'border-blue-300 dark:border-blue-700',
          icon: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-900 dark:text-blue-100',
          text: 'text-blue-700 dark:text-blue-200',
          accent: 'text-blue-600 dark:text-blue-400'
        };
      case 'referral_transferred':
        return {
          bg: 'bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30',
          border: 'border-green-300 dark:border-green-700',
          icon: 'text-green-600 dark:text-green-400',
          title: 'text-green-900 dark:text-green-100',
          text: 'text-green-700 dark:text-green-200',
          accent: 'text-green-600 dark:text-green-400'
        };
      case 'account_approval':
        return {
          bg: 'bg-gradient-to-r from-purple-50 to-pink-100 dark:from-purple-900/30 dark:to-pink-800/30',
          border: 'border-purple-300 dark:border-purple-700',
          icon: 'text-purple-600 dark:text-purple-400',
          title: 'text-purple-900 dark:text-purple-100',
          text: 'text-purple-700 dark:text-purple-200',
          accent: 'text-purple-600 dark:text-purple-400'
        };
      case 'account_approved':
        return {
          bg: 'bg-gradient-to-r from-green-50 to-teal-100 dark:from-green-900/30 dark:to-teal-800/30',
          border: 'border-green-300 dark:border-green-700',
          icon: 'text-green-600 dark:text-green-400',
          title: 'text-green-900 dark:text-green-100',
          text: 'text-green-700 dark:text-green-200',
          accent: 'text-green-600 dark:text-green-400'
        };
      case 'account_rejected':
        return {
          bg: 'bg-gradient-to-r from-orange-50 to-red-100 dark:from-orange-900/30 dark:to-red-800/30',
          border: 'border-orange-300 dark:border-orange-700',
          icon: 'text-orange-600 dark:text-orange-400',
          title: 'text-orange-900 dark:text-orange-100',
          text: 'text-orange-700 dark:text-orange-200',
          accent: 'text-orange-600 dark:text-orange-400'
        };
      case 'referrer_account_update':
        return {
          bg: 'bg-gradient-to-r from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-800/30',
          border: 'border-indigo-300 dark:border-indigo-700',
          icon: 'text-indigo-600 dark:text-indigo-400',
          title: 'text-indigo-900 dark:text-indigo-100',
          text: 'text-indigo-700 dark:text-indigo-200',
          accent: 'text-indigo-600 dark:text-indigo-400'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/30',
          border: 'border-gray-300 dark:border-gray-700',
          icon: 'text-gray-600 dark:text-gray-400',
          title: 'text-gray-900 dark:text-gray-100',
          text: 'text-gray-700 dark:text-gray-200',
          accent: 'text-gray-600 dark:text-gray-400'
        };
    }
  };

  const styles = getStyles();

  const getTitle = () => {
    switch (type) {
      case 'new_referral':
        return '🆕 New Referral';
      case 'referral_transferred':
        return '✓ Referral Update';
      case 'account_approval':
        return '👤 Account Approval';
      case 'account_approved':
        return '✓ Account Approved';
      case 'account_rejected':
        return '⚠️ Account Rejected';
      case 'referrer_account_update':
        return '👤 Account Update';
      default:
        return 'Notification';
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border-2 shadow-lg min-w-[340px] max-w-md transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-105 backdrop-blur-sm',
        styles.bg,
        styles.border,
        isVisible && !isExiting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
    >
      <div className={cn('flex-shrink-0 mt-0.5 p-2 rounded-lg bg-white/50 dark:bg-black/20', styles.icon)}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-bold', styles.title)}>
          {getTitle()}
        </p>
        <p className={cn('text-xs mt-1 leading-relaxed', styles.text)}>
          {message}
        </p>
        {referralId && (
          <p className={cn('text-xs mt-2 font-mono opacity-75', styles.text)}>
            ID: {referralId}
          </p>
        )}
        <p className={cn('text-xs mt-2 font-semibold flex items-center gap-1', styles.accent)}>
          <span>→ Click to view details</span>
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleCloseButton();
        }}
        className={cn('flex-shrink-0 p-1 rounded-lg hover:bg-white/30 dark:hover:bg-black/20 transition-colors', styles.text)}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
