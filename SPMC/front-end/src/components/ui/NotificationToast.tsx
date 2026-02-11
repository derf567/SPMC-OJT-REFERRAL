import { useEffect, useState } from 'react';
import { Bell, CheckCircle, UserCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationToastProps {
  id: string;
  type: 'new_referral' | 'referral_transferred' | 'account_approval';
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

    // Remove after 8 seconds
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
    onClose(id);
  };

  const getIcon = () => {
    switch (type) {
      case 'new_referral':
        return <Bell className="w-5 h-5 text-blue-500" />;
      case 'referral_transferred':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'account_approval':
        return <UserCheck className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'new_referral':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'referral_transferred':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'account_approval':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg min-w-[320px] max-w-md transition-all duration-300 cursor-pointer hover:shadow-xl hover:scale-105',
        getBackgroundColor(),
        isVisible && !isExiting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {type === 'new_referral' && 'New Referral Received'}
          {type === 'referral_transferred' && 'Referral Transferred'}
          {type === 'account_approval' && 'New Account Approval'}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
          {message}
        </p>
        {referralId && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
            ID: {referralId}
          </p>
        )}
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
          Click to view details →
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose(id);
        }}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
