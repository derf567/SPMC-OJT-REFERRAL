# Delay Transfer Notification - Click Behavior Guide

## Overview
When EDCC/Triage personnel click on a delay transfer notification, the system now intelligently routes them to the appropriate page based on the notification type.

## Click Behavior

### For Delay Transfer Notifications (Triage Staff)
When a triage/EDCC staff member clicks on a delay transfer notification:

1. **System checks** if the notification is a delay notification by fetching the referral
2. **If it's a delay** (has `delay_notified_at`):
   - User is **navigated to the Triage Referrals page** (`/triage`)
   - This allows them to see all referrals in triage, including the delayed one
   - They can then take action on the delayed referral

3. **If it's a regular transfer notification**:
   - A **modal dialog opens** showing the referral details
   - User can view all information about the referral
   - User can close the modal to continue working

### For Other Notification Types
- **New Referral**: Opens modal with referral details
- **Account Approval**: Navigates to admin account approval page
- **Regular Referral Transfer**: Opens modal with referral details

## User Experience Flow

### Scenario 1: Delay Notification Click
```
Triage Staff sees notification:
"Transfer delayed for John Doe: Waiting for family approval - REF-20260304-001"
                                    ↓
                        Clicks notification
                                    ↓
                    System fetches referral details
                                    ↓
                    Checks if delay_notified_at exists
                                    ↓
                    YES → Navigate to /triage page
                                    ↓
            Triage Referrals page loads with all referrals
                                    ↓
        Triage staff can see the delayed referral and take action
```

### Scenario 2: Regular Transfer Notification Click
```
Triage Staff sees notification:
"Referral Transferred: John Doe - REF-20260304-001"
                                    ↓
                        Clicks notification
                                    ↓
                    System fetches referral details
                                    ↓
                    Checks if delay_notified_at exists
                                    ↓
                    NO → Open modal with referral details
                                    ↓
        Modal shows full referral information
                                    ↓
        Triage staff can view and close modal
```

## Implementation Details

### Updated Handler Logic
```typescript
const handleNotificationClick = async (referralId?: string, notificationType?: string) => {
  if (!referralId) return;
  
  try {
    // For delay transfer notifications, navigate to triage referrals page
    if (notificationType === 'referral_transferred' && user?.permissions?.can_triage_referrals) {
      // Check if this is a delay notification by fetching the referral
      const referral = await referralsAPI.getById(referralId);
      if (referral.delay_notified_at) {
        // This is a delay notification - navigate to triage page
        navigate('/triage');
        return;
      }
    }
    
    // For other notifications, fetch and display in modal
    const referral = await referralsAPI.getById(referralId);
    setSelectedReferral(referral);
  } catch (error) {
    console.error('Error handling notification click:', error);
    // Fallback: navigate to active referrals page
    navigate('/referrals');
  }
};
```

## Benefits

✅ **Better Navigation**: Triage staff go directly to the triage page where they can manage delays
✅ **Context Awareness**: System understands the notification type and routes accordingly
✅ **Efficient Workflow**: No need to manually navigate to triage page
✅ **Flexible**: Still shows modal for regular transfer notifications
✅ **Error Handling**: Falls back to active referrals page if something goes wrong

## Testing the Click Behavior

### Test 1: Delay Notification Click
1. Log in as Referrer
2. Click "Delay Transfer" on a dispositioned referral
3. Log in as Triage staff (different tab)
4. Wait for notification to appear
5. **Click the notification**
6. **Expected**: Should navigate to `/triage` page showing all triage referrals

### Test 2: Regular Transfer Notification Click
1. Log in as EDCC staff
2. Transfer a referral to triage
3. Log in as Triage staff (different tab)
4. Wait for notification to appear
5. **Click the notification**
6. **Expected**: Should open a modal showing the referral details

### Test 3: Error Handling
1. Click a notification with an invalid referral ID
2. **Expected**: Should navigate to `/referrals` page as fallback

## Console Debugging

Open browser DevTools (F12) and check the console for:

```
// When notification is clicked
"Error handling notification click:" (if there's an error)

// When navigating to triage page
// (No specific log, but URL should change to /triage)

// When opening modal
// (No specific log, but modal should appear)
```

## Files Modified

1. **SPMC/front-end/src/components/layout/DashboardLayout.tsx**
   - Updated `handleNotificationClick` to accept `notificationType` parameter
   - Added logic to detect delay notifications and navigate to triage page
   - Updated NotificationContainer call to pass notification type

## Related Features

- **Delay Notification Detection**: See `DELAY_NOTIFICATION_FIX_COMPLETE.md`
- **Notification Service**: See `notificationService.ts`
- **Triage Referrals Page**: See `TriageReferrals.tsx`

## Future Enhancements

- Add animation when navigating to triage page
- Highlight the delayed referral in the triage list
- Add "View in Triage" button in the modal for regular transfers
- Add notification history/archive
- Add notification filtering options
