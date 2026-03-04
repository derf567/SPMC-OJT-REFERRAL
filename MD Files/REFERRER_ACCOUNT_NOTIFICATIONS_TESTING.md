# Referrer Account Notifications - Testing Guide

## Quick Test Scenarios

### Scenario 1: Admin Receives New Registration Notification

**Steps**:
1. Log in as Admin
2. Have a referrer create a new account (or use existing pending account)
3. Admin should see purple notification: "New Doctor registration: [Name]"
4. Notification appears in both pop-up and notification panel

**Expected Result**:
- ✓ Purple notification with 👤 icon
- ✓ Message shows referrer type and name
- ✓ Notification appears in panel with timestamp
- ✓ Pop-up auto-dismisses after 8 seconds

---

### Scenario 2: Referrer Receives Approval Notification

**Steps**:
1. Create a new referrer account (or use pending one)
2. Log in as Admin
3. Go to Account Approval page
4. Approve the referrer account
5. Log in as the referrer (in another browser/incognito)
6. Wait up to 10 seconds

**Expected Result**:
- ✓ Green notification with ✓ icon
- ✓ Message: "Your account has been approved! You can now submit referrals."
- ✓ Notification appears in pop-up and panel
- ✓ Referrer can now submit referrals

---

### Scenario 3: Referrer Receives Rejection Notification

**Steps**:
1. Create a new referrer account
2. Log in as Admin
3. Go to Account Approval page
4. Reject the referrer account
5. Log in as the referrer (in another browser/incognito)
6. Wait up to 10 seconds

**Expected Result**:
- ✓ Orange notification with ⚠️ icon
- ✓ Message: "Your account registration was rejected. Please contact admin for details."
- ✓ Notification appears in pop-up and panel
- ✓ Referrer cannot submit referrals

---

### Scenario 4: Notification Panel Display

**Steps**:
1. Log in as any user with notifications
2. Click bell icon in header
3. Verify notification panel opens
4. Check notification list

**Expected Result**:
- ✓ Panel opens with smooth animation
- ✓ Shows all notifications with icons and timestamps
- ✓ Color-coded by notification type
- ✓ "Clear all" button visible
- ✓ "See previous notifications" link visible
- ✓ Scrollable if many notifications

---

### Scenario 5: Notification Click Behavior

**Steps**:
1. Log in as referrer with account notification
2. Click on notification in panel
3. Verify action taken

**Expected Result**:
- ✓ Notification is removed from panel
- ✓ For account notifications: No navigation (informational only)
- ✓ For referral notifications: Navigate to relevant page

---

### Scenario 6: Duplicate Prevention

**Steps**:
1. Log in as referrer
2. Admin approves account
3. Wait for notification to appear
4. Refresh page
5. Wait another 10 seconds

**Expected Result**:
- ✓ Notification appears only once
- ✓ No duplicate pop-ups after refresh
- ✓ Notification remains in panel

---

### Scenario 7: Dark Mode Support

**Steps**:
1. Log in as any user
2. Toggle dark mode
3. Trigger a notification
4. Check notification styling

**Expected Result**:
- ✓ Notification colors adjust for dark mode
- ✓ Text remains readable
- ✓ Gradients display correctly
- ✓ Icons are visible

---

### Scenario 8: Notification Auto-Dismiss

**Steps**:
1. Log in as user
2. Trigger a notification (or wait for one)
3. Watch pop-up notification
4. Don't click anything

**Expected Result**:
- ✓ Notification fades in smoothly (300ms)
- ✓ Notification stays visible for ~7.7 seconds
- ✓ Notification fades out smoothly (300ms)
- ✓ Total display time: ~8 seconds

---

## Testing Checklist

### Notification Service
- [ ] `checkReferrerAccountStatus()` function exists
- [ ] Runs every 10 seconds for referrers
- [ ] Detects status changes correctly
- [ ] Prevents duplicate notifications
- [ ] Clears cache on logout

### UI Components
- [ ] NotificationToast displays all types
- [ ] NotificationPanel shows all notifications
- [ ] Colors are correct for each type
- [ ] Icons display correctly
- [ ] Animations are smooth

### Integration
- [ ] DashboardLayout imports new function
- [ ] Effect hook runs for referrers
- [ ] Notifications appear in real-time
- [ ] Notifications integrate with existing system

### User Experience
- [ ] Pop-ups appear once per notification
- [ ] Panel shows all notifications
- [ ] Clicking notification works correctly
- [ ] Clear all button works
- [ ] See previous link works
- [ ] Dark mode works correctly

---

## Browser Console Debugging

### Enable Debug Logging
Open browser console and look for:
```
🔍 Checking referrer account status...
📅 Initial referrer check timestamp set: [timestamp]
✅ First referrer check complete - will now monitor for status changes
🔄 Referrer account status changed: { from: false, to: true }
🟢 Referrer account approved
```

### Check Notification IDs
```javascript
// In browser console
localStorage.getItem('authToken')  // Verify token exists
```

### Test Notification Manually
```javascript
// In browser console (after importing notificationService)
const testNotif = {
  id: 'test_' + Date.now(),
  type: 'account_approved',
  message: 'Test notification',
  timestamp: new Date().toISOString(),
  isAccountNotification: true
};
// Trigger notification handler
```

---

## Common Issues & Solutions

### Issue: Notifications not appearing
**Solution**:
1. Check browser console for errors
2. Verify user is logged in as referrer
3. Check Network tab for API calls
4. Verify `/api/referrers/my_profile/` returns data

### Issue: Duplicate notifications
**Solution**:
1. Clear browser cache
2. Log out and log back in
3. Check notification ID uniqueness
4. Verify `shownNotificationIds` Set is working

### Issue: Styling looks wrong
**Solution**:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check dark mode toggle
4. Verify Tailwind CSS is loaded

### Issue: Notifications disappear too quickly
**Solution**:
1. Check timeout value (should be 8000ms)
2. Verify fade-out animation timing
3. Check for JavaScript errors

---

## Performance Testing

### Polling Frequency
- Referrer account check: 10 seconds
- Referral notifications: 5 seconds
- Total API calls: ~12 per minute per user

### Memory Usage
- `shownNotificationIds` Set: ~1KB per 100 notifications
- `referrerAccountCache` Map: ~1KB per referrer
- `liveNotifications` array: ~1KB per 10 notifications

### Network Impact
- Per check: 1 API call (~2KB response)
- Per minute: ~6 API calls (~12KB)
- Per hour: ~360 API calls (~720KB)

---

## Acceptance Criteria

- [x] Referrers receive notifications when account is approved
- [x] Referrers receive notifications when account is rejected
- [x] Admins receive notifications for new registrations
- [x] Notifications appear in real-time (within 10 seconds)
- [x] Notifications appear only once (no duplicates)
- [x] Notifications display in pop-up and panel
- [x] Notifications have appropriate styling and colors
- [x] Notifications auto-dismiss after 8 seconds
- [x] Notification panel shows all notifications
- [x] Dark mode is supported
- [x] No console errors or warnings
