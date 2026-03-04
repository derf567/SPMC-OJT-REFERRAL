# Delay Transfer Disable Feature - Testing Guide

## Feature Overview
The delay transfer feature now prevents referrers from submitting multiple delay notifications for the same referral. After the first delay notification is submitted, the "Delay Transfer" button becomes disabled with the text "Delay Already Notified".

## Implementation Details

### Backend Changes
- **Model**: `Referral.delay_notified_at` field tracks when delay was first notified
- **Endpoint**: `POST /api/referrals/{id}/delay_transfer/` sets `delay_notified_at` timestamp
- **Serializer**: `delay_notified_at` and `delay_reason` fields are included in API responses

### Frontend Changes
- **Component**: `TransferActionDropdown.tsx` receives `hasDelayNotification` prop
- **Logic**: Button is disabled when `hasDelayNotification` is true
- **UI**: Shows "Delay Already Notified" text with grayed-out styling
- **Integration**: `ReferrerDashboard.tsx` passes `!!referral.delay_notified_at` to the component

## Testing Steps

### Prerequisites
1. Django server running
2. Frontend dev server running
3. Database with test data

### Test Case 1: First Delay Notification (Should Succeed)
1. Login as a referrer (e.g., Davao Doctors Hospital)
2. Navigate to Referrer Dashboard
3. Find a referral with status "dispositioned" (Accepted - Fill In-Transit Form)
4. Click the "Actions" dropdown button
5. Click "Delay Transfer"
6. Enter a reason for delay (e.g., "Waiting for family approval")
7. Click "Notify Delay" button
8. Verify success toast: "EDCC/Triage staff have been notified of the delay"
9. Verify the page refreshes and shows updated data

### Test Case 2: Second Delay Notification (Should Be Disabled)
1. After completing Test Case 1, stay on the same page
2. Look at the same referral in the Recent Referrals section
3. Click the "Actions" dropdown button again
4. Verify the "Delay Transfer" button is now:
   - Grayed out (opacity-50)
   - Shows text "Delay Already Notified"
   - Shows subtitle "Cannot submit again"
   - Has a tooltip: "Delay notification already submitted"
   - Is not clickable (disabled state)
5. Verify the "May Transfer" button is still clickable

### Test Case 3: Multiple Referrals (Independent Delays)
1. Have multiple dispositioned referrals
2. Submit delay for first referral (Test Case 1)
3. Verify first referral's delay button is disabled
4. For second referral, verify its delay button is still enabled
5. Submit delay for second referral
6. Verify second referral's delay button is now disabled
7. Verify first referral's delay button remains disabled

### Test Case 4: Page Refresh Persistence
1. After submitting a delay notification (Test Case 1)
2. Refresh the browser page (F5 or Ctrl+R)
3. Verify the delay button remains disabled
4. Verify the "Delay Already Notified" state persists
5. This confirms the state is coming from the backend, not just frontend state

## Expected Behavior

### When Delay Transfer is Available
- Button text: "Delay Transfer"
- Subtitle: "Notify EDCC/Triage"
- Icon color: Orange (Clock icon)
- State: Clickable, normal opacity
- Hover effect: Light gray background

### When Delay Transfer is Disabled
- Button text: "Delay Already Notified"
- Subtitle: "Cannot submit again"
- Icon color: Gray (Clock icon)
- State: Not clickable, reduced opacity (50%)
- Background: Slightly darker (gray-50 / gray-900)
- Hover effect: None (disabled)

## Troubleshooting

### Issue: Button still shows "Delay Transfer" after submission
**Solution**: 
- Check browser console for errors
- Verify API response includes `delay_notified_at` field
- Check that `onDelaySuccess` callback is being called
- Verify dashboard data is being refreshed

### Issue: Button doesn't disable even after submission
**Solution**:
- Check if `delay_notified_at` is being set in the database
- Run: `python manage.py shell` and check: `Referral.objects.get(id=<referral_id>).delay_notified_at`
- Verify the API response includes the field
- Check browser DevTools Network tab to see API response

### Issue: Button is always disabled
**Solution**:
- Check if `delay_notified_at` is being set incorrectly
- Verify the referral status is "dispositioned"
- Check if there's a database issue with the field

## Database Verification

To verify the feature is working at the database level:

```python
# In Django shell
from referrals.models import Referral

# Check a specific referral
ref = Referral.objects.get(referral_id='REF-20260304-001')
print(f"Delay notified at: {ref.delay_notified_at}")
print(f"Delay reason: {ref.delay_reason}")

# Check all referrals with delay notifications
delayed = Referral.objects.filter(delay_notified_at__isnull=False)
for ref in delayed:
    print(f"{ref.referral_id}: {ref.delay_notified_at}")
```

## API Testing

To test the API directly:

```bash
# Submit delay notification
curl -X POST http://localhost:8000/api/referrals/<referral_id>/delay_transfer/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"delay_reason": "Waiting for family approval"}'

# Expected response:
# {
#   "message": "EDCC/Triage staff have been notified of the delayed transfer",
#   "referral_status": "dispositioned",
#   "delay_reason": "Waiting for family approval"
# }

# Get referral details (should include delay_notified_at)
curl http://localhost:8000/api/referrals/<referral_id>/ \
  -H "Authorization: Bearer <token>"
```

## Notes
- The feature only works for referrals with status "dispositioned"
- Only the referrer who created the referral can submit delay notifications
- The delay notification does not change the referral status
- EDCC/Triage staff are notified but the referral remains in "dispositioned" status
- The feature prevents accidental duplicate notifications
