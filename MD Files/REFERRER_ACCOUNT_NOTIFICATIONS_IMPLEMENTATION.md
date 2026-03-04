# Referrer Account Notifications Implementation

## Overview
Implemented a comprehensive notification system for referrer account status changes. Referrers now receive real-time notifications when their accounts are approved or rejected by administrators.

## Features Implemented

### 1. Notification Types
Three new notification types for referrer accounts:
- **account_approval**: Admin notification for new referrer registrations (for admins)
- **account_approved**: Referrer notification when their account is approved
- **account_rejected**: Referrer notification when their account is rejected

### 2. Real-Time Status Monitoring
- Referrers are monitored every 10 seconds for account status changes
- Uses caching mechanism to detect when `is_active` status changes
- First check establishes baseline, subsequent checks detect changes
- Prevents duplicate notifications using `shownNotificationIds` Set

### 3. Visual Styling
Each notification type has distinct styling:

| Type | Color | Icon | Title |
|------|-------|------|-------|
| account_approval | Purple/Pink | 👤 | Account Approval |
| account_approved | Green/Teal | ✓ | Account Approved |
| account_rejected | Orange/Red | ⚠️ | Account Rejected |

### 4. Notification Display
- **Pop-up Toast**: Appears once per notification, auto-dismisses after 8 seconds
- **Notification Panel**: Shows all notifications in Facebook-style dropdown
- **Panel Features**:
  - Scrollable list of all notifications
  - Color-coded by type
  - Timestamp for each notification
  - "Clear all" button
  - "See previous notifications" link

## Technical Implementation

### Backend (Django)
**File**: `SPMC/referrals/views.py`
- Existing endpoints: `/api/referrers/approve/` and `/api/referrers/reject/`
- Uses `user.is_active` field to track approval status
- Admin can approve/reject referrer accounts

### Frontend (React/TypeScript)

#### 1. Notification Service
**File**: `SPMC/front-end/src/lib/notificationService.ts`

New function: `checkReferrerAccountStatus()`
```typescript
export const checkReferrerAccountStatus = async (
  isReferrer: boolean,
  onNotification: (notification: NotificationData) => void
)
```

Features:
- Fetches current user's referrer profile from `/api/referrers/my_profile/`
- Compares current `is_active` status with cached status
- Triggers notifications on status change
- Prevents duplicate notifications
- Runs every 10 seconds for referrers

#### 2. Notification Data Interface
**File**: `SPMC/front-end/src/lib/notificationService.ts`

Updated `NotificationData` interface:
```typescript
export interface NotificationData {
  id: string;
  type: 'new_referral' | 'referral_transferred' | 'account_approval' | 
        'account_rejected' | 'account_approved' | 'referrer_account_update';
  message: string;
  referralId?: string;
  accountId?: string;
  timestamp: string;
  isAccountNotification?: boolean;
}
```

#### 3. UI Components

**NotificationToast.tsx**
- Added support for `account_approved` and `account_rejected` types
- Color-coded styling for each type
- Emoji-based titles for visual recognition
- Smooth animations (fade-in 300ms, scale on hover, fade-out 300ms)

**NotificationPanel.tsx**
- Updated icon mapping for new notification types
- Added color coding for account notifications
- Displays all notifications in scrollable list
- Shows timestamp for each notification

**DashboardLayout.tsx**
- Added import for `checkReferrerAccountStatus`
- New effect hook to monitor referrer account status
- Runs every 10 seconds for referrer users
- Integrates with existing notification system

## User Experience Flow

### For Referrers
1. **Registration**: Referrer submits account registration
2. **Pending**: Account is in pending status (not active)
3. **Admin Action**: Admin approves or rejects account
4. **Notification**: Referrer receives real-time notification
   - **If Approved**: Green notification "Your account has been approved! You can now submit referrals."
   - **If Rejected**: Orange notification "Your account registration was rejected. Please contact admin for details."
5. **Action**: Referrer can click notification to view details or dismiss

### For Admins
1. **Registration Alert**: Purple notification "New Doctor registration: [Name]"
2. **Action**: Admin approves/rejects from admin panel
3. **Referrer Notified**: Referrer receives status change notification

## Notification Behavior

### Pop-up Notifications
- Appear once per notification (no duplicates)
- Auto-dismiss after 8 seconds
- Clickable to view details
- Close button to dismiss manually
- Smooth fade-in/out animations

### Notification Panel
- Shows all notifications (not just recent)
- Persists until manually cleared
- Color-coded by type
- Includes "Clear all" button
- Includes "See previous notifications" link

### Duplicate Prevention
- Uses `shownNotificationIds` Set to track displayed notifications
- Prevents same notification from showing multiple times
- Cleared on logout via `stopNotificationPolling()`

## Files Modified

1. **SPMC/front-end/src/lib/notificationService.ts**
   - Added `checkReferrerAccountStatus()` function
   - Updated `NotificationData` interface
   - Added caching mechanism for referrer account status

2. **SPMC/front-end/src/components/ui/NotificationToast.tsx**
   - Added support for `account_approved` and `account_rejected` types
   - Updated styling for new notification types
   - Updated icon and title mappings

3. **SPMC/front-end/src/components/ui/NotificationPanel.tsx**
   - Updated icon mapping for new notification types
   - Added color coding for account notifications

4. **SPMC/front-end/src/components/layout/DashboardLayout.tsx**
   - Added import for `checkReferrerAccountStatus`
   - Added effect hook to monitor referrer account status
   - Integrated with existing notification system

## Testing

### Manual Testing Steps

1. **As Admin**:
   - Go to Account Approval page
   - Create a new referrer account (or use pending one)
   - Receive purple notification "New [Type] registration: [Name]"
   - Approve the account

2. **As Referrer**:
   - Log in to referrer account
   - Wait for admin to approve/reject
   - Receive green notification (approved) or orange notification (rejected)
   - Click notification to view details
   - Check notification panel for history

3. **Notification Panel**:
   - Click bell icon in header
   - See all notifications in scrollable list
   - Click notification to navigate
   - Click "Clear all" to dismiss all
   - Click "See previous notifications" to view history

## Configuration

### Polling Intervals
- Referrer account status: **10 seconds** (configurable in DashboardLayout.tsx)
- Referral notifications: **5 seconds** (existing)

### Notification Timeout
- Pop-up notifications: **8 seconds** (auto-dismiss)
- Fade-out animation: **300ms**

## Future Enhancements

1. **Notification History**: Persist notifications to database
2. **Email Notifications**: Send email when account is approved/rejected
3. **SMS Notifications**: Send SMS for critical account events
4. **Notification Preferences**: Allow users to customize notification settings
5. **Batch Notifications**: Group multiple notifications of same type
6. **Notification Sounds**: Add sound alerts for account notifications

## Troubleshooting

### Notifications Not Appearing
1. Check browser console for errors
2. Verify user is logged in as referrer
3. Check network tab for API calls to `/api/referrers/my_profile/`
4. Verify `is_active` field is being updated in database

### Duplicate Notifications
1. Check `shownNotificationIds` Set in notificationService
2. Verify notification ID is unique
3. Check for multiple polling intervals running

### Styling Issues
1. Verify Tailwind CSS is properly configured
2. Check dark mode toggle is working
3. Verify gradient colors are supported in browser

## API Endpoints Used

- `GET /api/referrers/my_profile/` - Get current referrer's profile
- `POST /api/referrers/{id}/approve/` - Approve referrer account (admin only)
- `POST /api/referrers/{id}/reject/` - Reject referrer account (admin only)

## Notes

- Notifications are real-time and update every 10 seconds for referrers
- Account status is determined by `user.is_active` field
- Notifications are cleared on logout
- Duplicate prevention ensures clean notification experience
- All notification types follow consistent styling and animation patterns
