import { referralsAPI } from './api';

export interface NotificationData {
  id: string;
  type: 'new_referral' | 'referral_transferred' | 'account_approval' | 'account_rejected' | 'account_approved' | 'referrer_account_update';
  message: string;
  referralId?: string;
  accountId?: string;
  timestamp: string;
  isAccountNotification?: boolean;
}

let lastCheckedTimestamp: string | null = null;
let notificationCheckInterval: NodeJS.Timeout | null = null;
let shownNotificationIds: Set<string> = new Set();

// Persist notifications to localStorage
const NOTIFICATIONS_STORAGE_KEY = 'spmc_notifications';

export const getStoredNotifications = (userPermissions?: any): NotificationData[] => {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const allNotifications = stored ? JSON.parse(stored) : [];
    
    // Filter notifications based on user permissions
    if (userPermissions) {
      return allNotifications.filter((notif: NotificationData) => {
        // Admin-only notifications
        if (notif.type === 'account_approval') {
          return userPermissions.is_admin_user === true;
        }
        // Referrer-only notifications
        if (notif.type === 'account_approved' || notif.type === 'account_rejected') {
          return userPermissions.is_referrer === true;
        }
        // All other notifications are visible to their respective users
        return true;
      });
    }
    
    return allNotifications;
  } catch (error) {
    console.error('Error reading stored notifications:', error);
    return [];
  }
};

export const saveNotificationToStorage = (notification: NotificationData) => {
  try {
    const stored = getStoredNotifications();
    // Check if notification already exists
    if (!stored.some(n => n.id === notification.id)) {
      stored.unshift(notification); // Add to beginning
      // Keep only last 100 notifications
      const limited = stored.slice(0, 100);
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(limited));
    }
  } catch (error) {
    console.error('Error saving notification to storage:', error);
  }
};

export const clearAllStoredNotifications = () => {
  try {
    localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing stored notifications:', error);
  }
};

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

  // Poll every 30 seconds (reduced from 5 seconds to prevent flickering)
  notificationCheckInterval = setInterval(async () => {
    try {
      await checkForNewNotifications(userPermissions, onNotification);
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  }, 30000); // Changed from 5000 to 30000 (30 seconds)

  // Also check immediately
  checkForNewNotifications(userPermissions, onNotification);
};

export const stopNotificationPolling = () => {
  if (notificationCheckInterval) {
    clearInterval(notificationCheckInterval);
    notificationCheckInterval = null;
  }
  shownNotificationIds.clear();
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
      // Debug: Log delay notifications for triage users
      if (userPermissions?.can_triage_referrals && referral.status === 'dispositioned') {
        console.log('🔍 Checking dispositioned referral:', {
          referral_id: referral.referral_id,
          delay_notified_at: referral.delay_notified_at,
          delay_reason: referral.delay_reason,
          lastCheckedTimestamp
        });
      }
      // Check for new referrals (EDCC users)
      if (
        userPermissions?.can_transfer_referrals &&
        !userPermissions?.can_triage_referrals &&
        referral.status === 'pending' &&
        referral.created_at > (lastCheckedTimestamp || '')
      ) {
        const notifId = `new_referral_${referral.id}`;
        if (!shownNotificationIds.has(notifId)) {
          console.log('🔵 New referral detected:', referral.referral_id);
          shownNotificationIds.add(notifId);
          const notification: NotificationData = {
            id: notifId,
            type: 'new_referral',
            message: `New referral from ${referral.referring_hospital || 'External Hospital'}: ${referral.patient_name}`,
            referralId: referral.referral_id,
            timestamp: referral.created_at,
          };
          saveNotificationToStorage(notification);
          onNotification(notification);
          newNotificationCount++;
        }
      }

      // Check for transferred referrals (Triage users)
      if (
        userPermissions?.can_triage_referrals &&
        referral.status === 'waiting' &&
        referral.transferred_at &&
        referral.transferred_at > (lastCheckedTimestamp || '')
      ) {
        const notifId = `referral_transferred_${referral.id}`;
        if (!shownNotificationIds.has(notifId)) {
          console.log('🟢 Transferred referral detected:', referral.referral_id);
          shownNotificationIds.add(notifId);
          const notification: NotificationData = {
            id: notifId,
            type: 'referral_transferred',
            message: `New referral transferred by EDCC: ${referral.patient_name} - ${referral.referral_id}`,
            referralId: referral.referral_id,
            timestamp: referral.transferred_at,
          };
          saveNotificationToStorage(notification);
          onNotification(notification);
          newNotificationCount++;
        }
      }

      // Check for delayed transfer notifications (Triage users)
      if (
        userPermissions?.can_triage_referrals &&
        referral.status === 'dispositioned' &&
        referral.delay_notified_at
      ) {
        const delayId = `delay_transfer_${referral.id}_${referral.delay_notified_at}`;
        const isNewDelay = referral.delay_notified_at > (lastCheckedTimestamp || '');
        
        if (isNewDelay && !shownNotificationIds.has(delayId)) {
          console.log('🟠 Delayed transfer detected:', referral.referral_id);
          shownNotificationIds.add(delayId);
          const notification: NotificationData = {
            id: delayId,
            type: 'referral_transferred',
            message: `Transfer delayed for ${referral.patient_full_name}: ${referral.delay_reason} - ${referral.referral_id}`,
            referralId: referral.referral_id,
            timestamp: referral.delay_notified_at,
          };
          saveNotificationToStorage(notification);
          onNotification(notification);
          newNotificationCount++;
        }
      }

      // Check for department-assigned referrals (View Only doctors)
      if (
        userPermissions?.is_view_only &&
        userPermissions?.department &&
        referral.assigned_department === userPermissions.department &&
        (referral.status === 'waiting' || referral.status === 'urgent' || (referral.status === 'in_transit' && referral.triage_decision === 'emergent')) &&
        referral.transferred_at &&
        referral.transferred_at > (lastCheckedTimestamp || '')
      ) {
        const notifId = `department_referral_${referral.id}`;
        if (!shownNotificationIds.has(notifId)) {
          console.log('🟣 New patient assigned to department:', referral.referral_id);
          const departmentName = userPermissions.department.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
          shownNotificationIds.add(notifId);
          const notification: NotificationData = {
            id: notifId,
            type: 'referral_transferred',
            message: `New patient in ${departmentName}: ${referral.patient_full_name} - ${referral.referral_id}`,
            referralId: referral.referral_id,
            timestamp: referral.transferred_at,
          };
          saveNotificationToStorage(notification);
          onNotification(notification);
          newNotificationCount++;
        }
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

// Track last checked timestamp for account approvals
let lastApprovalCheckTimestamp: string | null = null;
let isFirstCheck = true;
let lastReferrerAccountCheckTimestamp: string | null = null;
let isFirstReferrerCheck = true;
let referrerAccountCache: Map<number, any> = new Map();
let referrerAccountNotFound = false; // Track if user has no ReferrerAccount

// For admin account approval notifications
export const checkAccountApprovals = async (
  isAdmin: boolean,
  onNotification: (notification: NotificationData) => void
) => {
  if (!isAdmin) return;

  try {
    console.log('🔍 Checking for new account approvals...');
    
    // Set initial timestamp if not set
    if (!lastApprovalCheckTimestamp) {
      lastApprovalCheckTimestamp = new Date().toISOString();
      console.log('📅 Initial timestamp set:', lastApprovalCheckTimestamp);
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('❌ No auth token found');
      return;
    }

    const response = await fetch('/api/admin/pending-doctors/', {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch pending approvals:', response.status);
      return;
    }

    const data = await response.json();
    const approvals = data.results || data;
    const pendingApprovals = Array.isArray(approvals)
      ? approvals.filter((account: any) => account.approval_status === 'pending')
      : [];

    console.log(`📋 Found ${pendingApprovals.length} pending approval(s)`);

        if (Array.isArray(pendingApprovals) && pendingApprovals.length > 0) {
      const currentTimestamp = new Date().toISOString();
      let newApprovalCount = 0;
      
      pendingApprovals.forEach((approval: any) => {
        // On first check, show ALL pending approvals
        // On subsequent checks, only show new ones since last check
        const shouldNotify = isFirstCheck || approval.created_at > lastApprovalCheckTimestamp!;
        
        if (shouldNotify) {
          console.log('🟣 New account registration detected:', approval.user?.username || approval.first_name);
          
          const notification: NotificationData = {
            id: `account_approval_${approval.id}_${approval.created_at}`,
            type: 'account_approval',
            message: `New doctor registration: ${approval.full_name || `${approval.first_name} ${approval.last_name}`}`,
            timestamp: approval.created_at,
            isAccountNotification: true,
          };
          saveNotificationToStorage(notification);
          onNotification(notification);
          
          newApprovalCount++;
        }
      });

      if (newApprovalCount > 0) {
        console.log(`✅ ${newApprovalCount} new registration notification(s) triggered`);
      }

      // Mark first check as complete
      if (isFirstCheck) {
        isFirstCheck = false;
        console.log('✅ First check complete - will now only show NEW registrations');
      }

      lastApprovalCheckTimestamp = currentTimestamp;
    }
  } catch (error) {
    console.error('❌ Error checking account approvals:', error);
  }
};

// For referrer account status notifications (approval/rejection for referrers)
export const checkReferrerAccountStatus = async (
  isReferrer: boolean,
  onNotification: (notification: NotificationData) => void
) => {
  if (!isReferrer) return;

  // If we already know the user doesn't have a ReferrerAccount, skip the check
  if (referrerAccountNotFound) {
    return;
  }

  try {
    // Set initial timestamp if not set
    if (!lastReferrerAccountCheckTimestamp) {
      lastReferrerAccountCheckTimestamp = new Date().toISOString();
      console.log('📅 Initial referrer check timestamp set:', lastReferrerAccountCheckTimestamp);
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('❌ No auth token found');
      return;
    }

    // Get current user's referrer profile
    const response = await fetch('/api/referrers/my_profile/', {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // 404 means user doesn't have a ReferrerAccount yet - this is normal for new users
      if (response.status === 404) {
        // Cache this result so we don't keep making the same request
        referrerAccountNotFound = true;
        console.log('ℹ️ Referrer profile not found (user may not have created one yet) - will not check again');
        return;
      }
      console.error('❌ Failed to fetch referrer profile:', response.status);
      return;
    }

    const referrerData = await response.json();
    const referrerId = referrerData.id;
    const isActive = referrerData.user?.is_active || false;
    const currentTimestamp = new Date().toISOString();

    // Check if this is the first check
    if (isFirstReferrerCheck) {
      // Cache the current status
      referrerAccountCache.set(referrerId, { isActive, checkedAt: currentTimestamp });
      isFirstReferrerCheck = false;
      console.log('✅ First referrer check complete - will now monitor for status changes');
      lastReferrerAccountCheckTimestamp = currentTimestamp;
      return;
    }

    // Check if status has changed
    const cachedData = referrerAccountCache.get(referrerId);
    if (cachedData && cachedData.isActive !== isActive) {
      console.log('🔄 Referrer account status changed:', { from: cachedData.isActive, to: isActive });

      if (isActive) {
        // Account was approved
        console.log('🟢 Referrer account approved');
        const notifId = `account_approved_${referrerId}_${currentTimestamp}`;
        if (!shownNotificationIds.has(notifId)) {
          shownNotificationIds.add(notifId);
          const notification: NotificationData = {
            id: notifId,
            type: 'account_approved',
            message: 'Your account has been approved! You can now submit referrals.',
            accountId: referrerId.toString(),
            timestamp: currentTimestamp,
            isAccountNotification: true,
          };
          saveNotificationToStorage(notification);
          onNotification(notification);
        }
      } else {
        // Account was rejected
        console.log('🔴 Referrer account rejected');
        const notifId = `account_rejected_${referrerId}_${currentTimestamp}`;
        if (!shownNotificationIds.has(notifId)) {
          shownNotificationIds.add(notifId);
          const notification: NotificationData = {
            id: notifId,
            type: 'account_rejected',
            message: 'Your account registration was rejected. Please contact admin for details.',
            accountId: referrerId.toString(),
            timestamp: currentTimestamp,
            isAccountNotification: true,
          };
          saveNotificationToStorage(notification);
          onNotification(notification);
        }
      }

      // Update cache
      referrerAccountCache.set(referrerId, { isActive, checkedAt: currentTimestamp });
    }

    lastReferrerAccountCheckTimestamp = currentTimestamp;
  } catch (error) {
    console.error('❌ Error checking referrer account status:', error);
  }
};
