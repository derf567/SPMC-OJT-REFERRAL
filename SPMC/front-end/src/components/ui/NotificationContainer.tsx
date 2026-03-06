import { useState, useEffect } from 'react';
import { NotificationToast } from './NotificationToast';
import { NotificationData } from '@/lib/notificationService';
import { notificationSound } from '@/lib/notificationSound';

interface NotificationContainerProps {
  notifications: NotificationData[];
  onRemove: (id: string) => void;
  onNotificationClick?: (referralId?: string, type?: string) => void;
}

interface DelayedNotification extends NotificationData {
  showAt: number;
}

export const NotificationContainer = ({ notifications, onRemove, onNotificationClick }: NotificationContainerProps) => {
  const [delayedNotifications, setDelayedNotifications] = useState<DelayedNotification[]>([]);
  const [visibleNotifications, setVisibleNotifications] = useState<NotificationData[]>([]);
  const [playedSounds, setPlayedSounds] = useState<Set<string>>(new Set());

  // Add 5-second delay to new notifications
  useEffect(() => {
    notifications.forEach((notification) => {
      // Check if this notification is already in our delayed list
      const exists = delayedNotifications.some(n => n.id === notification.id);
      if (!exists) {
        const delayedNotif: DelayedNotification = {
          ...notification,
          showAt: Date.now() + 5000 // 5 second delay
        };
        setDelayedNotifications(prev => [...prev, delayedNotif]);
      }
    });
  }, [notifications, delayedNotifications]);

  // Check which notifications should be visible now and play sound
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const shouldShow = delayedNotifications.filter(n => n.showAt <= now);
      
      if (shouldShow.length > 0) {
        // Play sound for new notifications that haven't had sound played yet
        shouldShow.forEach(notification => {
          if (!playedSounds.has(notification.id)) {
            // Only play loud alarm for new referral submissions
            if (notification.type === 'new_referral') {
              notificationSound.playNotification();
            }
            // Mark this notification as having played sound
            setPlayedSounds(prev => new Set(prev).add(notification.id));
          }
        });

        setVisibleNotifications(shouldShow);
        // Remove from delayed list ONLY after showing
        setDelayedNotifications(prev => 
          prev.filter(n => n.showAt > now)
        );
      }
    }, 100);

    return () => clearInterval(interval);
  }, [delayedNotifications, playedSounds]);

  // Clean up when notifications are removed
  useEffect(() => {
    const currentIds = notifications.map(n => n.id);
    setVisibleNotifications(prev => prev.filter(n => currentIds.includes(n.id)));
    setDelayedNotifications(prev => prev.filter(n => currentIds.includes(n.id)));
    
    // Clean up played sounds set for removed notifications
    setPlayedSounds(prev => {
      const newSet = new Set(prev);
      Array.from(newSet).forEach(id => {
        if (!currentIds.includes(id)) {
          newSet.delete(id);
        }
      });
      return newSet;
    });
  }, [notifications]);

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <div className="flex flex-col gap-3 pointer-events-auto">
        {visibleNotifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            id={notification.id}
            type={notification.type}
            message={notification.message}
            referralId={notification.referralId}
            onClose={onRemove}
            onClick={(referralId) => onNotificationClick?.(referralId, notification.type)}
          />
        ))}
      </div>
    </div>
  );
};
