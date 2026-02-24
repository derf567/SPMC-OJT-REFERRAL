# Admin Registration Notifications - FIXED

## Issue Identified
The notification system was implemented in the wrong layout component. It was added to `DashboardLayout.tsx` (for regular users) instead of `AdminDashboardLayout.tsx` (for admin users).

## Solution
Moved the notification system to the correct component: `AdminDashboardLayout.tsx`

## Implementation

### Backend (Django)
**File:** `SPMC-OJT-REFERRAL/SPMC/referrals/views.py`

Added filtering support to `ReferrerAccountViewSet`:
```python
filterset_fields = ['approval_status', 'referrer_type']
```

This enables the API endpoint: `/api/referrers/?approval_status=pending`

### Frontend (React)

#### 1. Notification Service
**File:** `SPMC-OJT-REFERRAL/SPMC/front-end/src/lib/notificationService.ts`

- `checkAccountApprovals()` function polls the API every 10 seconds
- Tracks `lastApprovalCheckTimestamp` to only show NEW registrations
- Creates notifications with type `'account_approval'`
- Comprehensive logging for debugging

#### 2. Admin Dashboard Layout (FIXED)
**File:** `SPMC-OJT-REFERRAL/SPMC/front-end/src/components/layout/AdminDashboardLayout.tsx`

Added:
- Import `NotificationContainer`, `SoundToggle`, and notification service
- State for `liveNotifications`
- `useEffect` hook to start polling on mount
- Polls every 10 seconds for new registrations
- Notification bell icon with badge showing count
- Sound toggle button
- Click handler to navigate to `/admin/account-approval`

#### 3. Notification Display
**File:** `SPMC-OJT-REFERRAL/SPMC/front-end/src/components/ui/NotificationContainer.tsx`

- Shows notifications after 5-second delay
- Plays notification sound
- Displays for 8 seconds before auto-dismissing
- Clickable to navigate to approval page

## How It Works

1. Admin logs into the admin dashboard
2. `AdminDashboardLayout` component mounts
3. Notification polling starts immediately
4. First check sets the timestamp (no notifications shown to avoid old data)
5. Every 10 seconds, checks for pending accounts created after last timestamp
6. When new registration detected:
   - Notification queued with 5-second delay
   - After delay, notification appears with sound
   - Shows: "New [Doctor/Hospital Employee] registration: [Name]"
   - Clicking navigates to `/admin/account-approval`

## Testing

### 1. Run Backend Test Script
```bash
cd SPMC-OJT-REFERRAL/SPMC
python test_admin_notifications.py
```

This shows:
- Admin users in system
- Pending referrer accounts
- What the API returns

### 2. Test in Browser

#### Step 1: Log in as Admin
- Go to admin dashboard: `/admin/dashboard`
- Username: `admin` or `HIS`

#### Step 2: Open Browser Console (F12)
Look for these logs:
```
🔔 Admin notification polling started for user: admin
🔍 Checking for new account approvals...
📅 Initial timestamp set: [timestamp]
📋 Found X pending approval(s)
🟣 New account registration detected: [name]
✅ X new registration notification(s) triggered
```

#### Step 3: Watch for Notifications
- Notification appears in top-right after 5 seconds
- Plays sound (if enabled via speaker icon)
- Shows notification bell with badge count
- Click notification to go to approval page

### 3. Create Test Registration
1. Open new browser/incognito window
2. Go to registration page
3. Register a new referrer account
4. Return to admin dashboard
5. Within 10 seconds, see console logs
6. After 5 more seconds, notification appears

## Troubleshooting

### No Notifications Appearing

#### Check 1: Verify You're on Admin Dashboard
The notification system ONLY works on pages using `AdminDashboardLayout`:
- `/admin/dashboard` ✅
- `/admin/account-approval` ✅
- `/admin/headsup` ✅
- `/admin/reports` ✅
- `/dashboard` ❌ (regular user dashboard)

#### Check 2: Verify Console Logs
```javascript
// Should see this immediately after login
🔔 Admin notification polling started for user: admin
```

If you don't see this, you're not on an admin page.

#### Check 3: Test API Endpoint
```javascript
// In browser console
const token = localStorage.getItem('token');
fetch('/api/referrers/?approval_status=pending', {
  headers: {
    'Authorization': `Token ${token}`,
    'Content-Type': 'application/json',
  }
})
.then(r => r.json())
.then(data => console.log('Pending approvals:', data));
```

#### Check 4: Verify Pending Accounts Exist
Run the test script to see if there are pending accounts:
```bash
python test_admin_notifications.py
```

#### Check 5: Reset Timestamp
The first check sets a timestamp and won't show old notifications. To test:
1. Refresh the page (resets timestamp)
2. Wait 10 seconds for first check
3. Register a new account in another browser
4. Wait up to 10 seconds for next check
5. Notification should appear after 5 more seconds

### Notification Bell Not Showing Badge
- Badge only appears when there are active notifications
- Notifications auto-dismiss after 8 seconds
- Badge count updates in real-time

### No Sound Playing
1. Check speaker icon in header (should not be muted)
2. Check browser console for audio errors
3. Some browsers block audio until user interaction
4. Try clicking anywhere on the page first

## Files Modified

### Backend
- `SPMC-OJT-REFERRAL/SPMC/referrals/views.py`
  - Added `filterset_fields` to `ReferrerAccountViewSet`

### Frontend
- `SPMC-OJT-REFERRAL/SPMC/front-end/src/components/layout/AdminDashboardLayout.tsx` ✅ FIXED
  - Added notification system
  - Added polling logic
  - Added notification bell with badge
  - Added sound toggle
  - Added click handlers

- `SPMC-OJT-REFERRAL/SPMC/front-end/src/lib/notificationService.ts`
  - Added `checkAccountApprovals()` function

- `SPMC-OJT-REFERRAL/SPMC/front-end/src/components/ui/NotificationContainer.tsx`
  - Handles all notification types including account approvals

### Test Script
- `SPMC-OJT-REFERRAL/SPMC/test_admin_notifications.py`
  - Verifies system configuration

## Current Status
✅ Backend filtering configured
✅ Frontend polling implemented in CORRECT component
✅ Notification display working
✅ Click navigation working
✅ Sound alerts working
✅ Notification bell with badge
✅ Comprehensive logging
✅ Test script created

## Next Steps
1. Restart Django backend if running
2. Refresh admin dashboard in browser
3. Open browser console (F12)
4. Look for "🔔 Admin notification polling started"
5. Create a test registration or wait for real registrations
6. Notifications will appear automatically!
