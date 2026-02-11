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

// Track last checked timestamp for account approvals
let lastApprovalCheckTimestamp: string | null = null;
let isFirstCheck = true;

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

    const response = await fetch('/api/referrers/?approval_status=pending', {
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
    const pendingApprovals = data.results || data;

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
          
          const accountType = approval.referrer_type === 'doctor' ? 'Doctor' : 
                             approval.referrer_type === 'hospital_employee' ? 'Hospital Employee' : 
                             'Referrer';
          
          onNotification({
            id: `account_approval_${approval.id}_${approval.created_at}`,
            type: 'account_approval',
            message: `New ${accountType} registration: ${approval.first_name} ${approval.last_name}`,
            timestamp: approval.created_at,
          });
          
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
