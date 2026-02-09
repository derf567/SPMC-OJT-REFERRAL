import { useState, useEffect } from 'react';
import { NotificationToast } from './NotificationToast';
import { NotificationData } from '@/lib/notificationService';

interface NotificationContainerProps {
  notifications: NotificationData[];
  onRemove: (id: string) => void;
}

export const NotificationContainer = ({ notifications, onRemove }: NotificationContainerProps) => {
  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <div className="flex flex-col gap-3 pointer-events-auto">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            id={notification.id}
            type={notification.type}
            message={notification.message}
            referralId={notification.referralId}
            onClose={onRemove}
          />
        ))}
      </div>
    </div>
  );
};
