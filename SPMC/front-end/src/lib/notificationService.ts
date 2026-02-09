import { referralsAPI } from './api';

export interface NotificationData {
  id: string;
  type: 'new_referral' | 'referral_transferred' | 'account_approval';
  message: string;
  referralId?: string;
  timestamp: string;
}

let lastCheckedTimestamp: string | null = null;
let notificationCheckInterval: NodeJS.Timeout | null = null;

export const startNotificationPolling = (
  userPermissions: any,
  onNotification: (notification: NotificationData) => void
) => {
  // Clear any existing interval
  if (notificationCheckInterval) {
    clearInterval(notificationCheckInterval);
  }

  // Set initial timestamp
  if (!lastCheckedTimestamp) {
    lastCheckedTimestamp = new Date().toISOString();
  }

  console.log('🔔 Notification polling started for user with permissions:', userPermissions);

  // Poll every 5 seconds
  notificationCheckInterval = setInterval(async () => {
    try {
      await checkForNewNotifications(userPermissions, onNotification);
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  }, 5000);

  // Also check immediately
  checkForNewNotifications(userPermissions, onNotification);
};

export const stopNotificationPolling = () => {
  if (notificationCheckInterval) {
    clearInterval(notificationCheckInterval);
    notificationCheckInterval = null;
  }
};

const checkForNewNotifications = async (
  userPermissions: any,
  onNotification: (notification: NotificationData) => void
) => {
  try {
    const response = await referralsAPI.getAll();
    const referrals = response.results || response;

    if (!Array.isArray(referrals)) return;

    const currentTimestamp = new Date().toISOString();
    let newNotificationCount = 0;

    referrals.forEach((referral: any) => {
      // Check for new referrals (EDCC users)
      if (
        userPermissions?.can_transfer_referrals &&
        !userPermissions?.can_triage_referrals &&
        referral.status === 'pending' &&
        referral.created_at > (lastCheckedTimestamp || '')
      ) {
        console.log('🔵 New referral detected:', referral.referral_id);
        onNotification({
          id: `new_referral_${referral.id}`,
          type: 'new_referral',
          message: `New referral from ${referral.referring_hospital || 'External Hospital'}: ${referral.patient_name}`,
          referralId: referral.referral_id,
          timestamp: referral.created_at,
        });
        newNotificationCount++;
      }

      // Check for transferred referrals (Triage users)
      if (
        userPermissions?.can_triage_referrals &&
        referral.status === 'waiting' &&
        referral.transferred_at &&
        referral.transferred_at > (lastCheckedTimestamp || '')
      ) {
        console.log('🟢 Transferred referral detected:', referral.referral_id);
        onNotification({
          id: `referral_transferred_${referral.id}`,
          type: 'referral_transferred',
          message: `New referral transferred by EDCC: ${referral.patient_name} - ${referral.referral_id}`,
          referralId: referral.referral_id,
          timestamp: referral.transferred_at,
        });
        newNotificationCount++;
      }
    });

    if (newNotificationCount > 0) {
      console.log(`✅ ${newNotificationCount} new notification(s) triggered`);
    }

    lastCheckedTimestamp = currentTimestamp;
  } catch (error) {
    console.error('Error in checkForNewNotifications:', error);
  }
};

// For admin account approval notifications
export const checkAccountApprovals = async (
  isAdmin: boolean,
  onNotification: (notification: NotificationData) => void
) => {
  if (!isAdmin) return;

  try {
    // This would need an API endpoint to check for pending approvals
    // For now, we'll create a placeholder
    const response = await fetch('/api/referrers/pending-approvals/', {
      headers: {
        'Authorization': `Token ${localStorage.getItem('token')}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const pendingApprovals = data.results || data;

      if (Array.isArray(pendingApprovals) && pendingApprovals.length > 0) {
        pendingApprovals.forEach((approval: any) => {
          if (approval.created_at > (lastCheckedTimestamp || '')) {
            onNotification({
              id: `account_approval_${approval.id}`,
              type: 'account_approval',
              message: `New account approval request from ${approval.first_name} ${approval.last_name}`,
              timestamp: approval.created_at,
            });
          }
        });
      }
    }
  } catch (error) {
    console.error('Error checking account approvals:', error);
  }
};
