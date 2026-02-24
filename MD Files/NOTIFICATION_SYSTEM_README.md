# Real-Time Notification System

## Overview
A real-time notification system with 3-second auto-fade notifications for the SPMC Referral System.

## Features Implemented

### 1. Notification Types
- **New Referral** (Blue) - Notifies EDCC users when a referrer submits a new referral
- **Referral Transferred** (Green) - Notifies Triage users when EDCC transfers a referral
- **Account Approval** (Purple) - Notifies Admin users when there's a new account approval request

### 2. Notification Behavior
- **Auto-display**: Notifications appear automatically in the top-right corner
- **3-second fade**: Each notification fades in, stays visible, then fades out over 3 seconds
- **Manual dismiss**: Users can click the X button to dismiss notifications early
- **No duplicates**: System prevents duplicate notifications from appearing

### 3. Polling System
- **EDCC Users**: Checks every 5 seconds for new referrals with status "pending"
- **Triage Users**: Checks every 5 seconds for newly transferred referrals with status "waiting"
- **Admin Users**: Checks every 10 seconds for new account approval requests

### 4. Visual Design
- Color-coded by notification type (blue, green, purple)
- Smooth fade-in and fade-out animations
- Displays referral ID when applicable
- Dark mode support
- Stacks multiple notifications vertically

## Files Created

1. **`src/lib/notificationService.ts`**
   - Polling logic for checking new referrals and approvals
   - Timestamp tracking to avoid duplicate notifications
   - Start/stop polling functions

2. **`src/components/ui/NotificationToast.tsx`**
   - Individual notification component
   - 3-second auto-fade animation
   - Manual dismiss functionality
   - Icon and color coding by type

3. **`src/components/ui/NotificationContainer.tsx`**
   - Container for managing multiple notifications
   - Fixed positioning in top-right corner
   - Vertical stacking of notifications

## Integration Points

### DashboardLayout (EDCC, Triage, Admin users)
- Starts notification polling on mount
- Displays live notifications
- Stops polling on unmount

### ReferrerDashboardLayout (Referrer users)
- Structure in place but no active polling (referrers don't need these notifications)

## How It Works

1. **When a referrer submits a new referral:**
   - Backend creates referral with status "pending"
   - EDCC users' polling detects the new referral
   - Blue notification appears: "New referral from [Hospital]: [Patient Name]"

2. **When EDCC transfers a referral:**
   - Backend updates referral status to "waiting" and sets transferred_at timestamp
   - Triage users' polling detects the transferred referral
   - Green notification appears: "New referral transferred by EDCC: [Patient Name] - [ID]"

3. **When someone requests account approval:**
   - Backend creates pending approval request
   - Admin users' polling detects the new request
   - Purple notification appears: "New account approval request from [Name]"

## Technical Details

- **Polling Intervals:**
  - Referral checks: Every 5 seconds
  - Account approval checks: Every 10 seconds
  
- **Animation Timing:**
  - Fade in: 10ms
  - Visible duration: 2.7 seconds
  - Fade out: 300ms
  - Total: 3 seconds

- **State Management:**
  - Uses React useState for notification array
  - Timestamp tracking prevents duplicates
  - Automatic cleanup on component unmount

## Future Enhancements (Optional)

- WebSocket integration for true real-time updates (no polling delay)
- Sound notifications
- Browser push notifications
- Notification history/log
- User preferences for notification types
- Click-to-navigate to the relevant referral
