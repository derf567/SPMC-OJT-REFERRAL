# Delay Transfer Notification - Complete Fix

## Problem Summary
When a referrer clicked "Delay Transfer" and provided a reason, the system showed a success message saying "EDCC/Triage staff have been notified of the delay". However, when triage/EDCC personnel logged in, they didn't see any notification about the delay.

## Root Causes Found and Fixed

### Issue 1: Missing Fields in API Response ❌ → ✅
**Problem**: The `ReferralListSerializer` was not including the `delay_notified_at` and `delay_reason` fields in the API response.

**Impact**: The notification service couldn't see the delay data because it wasn't being returned from the API.

**Fix**: Added both fields to the `fields` list in `ReferralListSerializer` in `SPMC/referrals/serializers.py`.

```python
# Delay notification tracking
'delay_notified_at', 'delay_reason'
```

### Issue 2: Incomplete Notification Detection Logic ❌ → ✅
**Problem**: The notification service was only checking for delays that occurred AFTER the triage staff logged in, missing delays that happened before they logged in.

**Impact**: If a delay was reported before triage staff logged in, they would never see the notification.

**Fix**: Updated the delay notification check in `notificationService.ts` to:
- Check for ANY delay on dispositioned referrals (not just new ones)
- Use a unique ID that includes the delay timestamp to prevent duplicate notifications
- Only trigger the notification callback if the delay is new (after last check)

```typescript
// Check for delayed transfer notifications (Triage users)
if (
  userPermissions?.can_triage_referrals &&
  referral.status === 'dispositioned' &&
  referral.delay_notified_at
) {
  const delayId = `delay_transfer_${referral.id}_${referral.delay_notified_at}`;
  const isNewDelay = referral.delay_notified_at > (lastCheckedTimestamp || '');
  
  if (isNewDelay) {
    onNotification({...});
  }
}
```

### Issue 3: Missing Debug Information ❌ → ✅
**Problem**: No way to debug why notifications weren't appearing.

**Fix**: Added console logging to help diagnose issues:
```typescript
// Debug: Log delay notifications for triage users
if (userPermissions?.can_triage_referrals && referral.status === 'dispositioned') {
  console.log('🔍 Checking dispositioned referral:', {
    referral_id: referral.referral_id,
    delay_notified_at: referral.delay_notified_at,
    delay_reason: referral.delay_reason,
    lastCheckedTimestamp
  });
}
```

## Files Modified

1. **SPMC/referrals/models.py**
   - Added `delay_notified_at` field (DateTimeField)
   - Added `delay_reason` field (TextField)

2. **SPMC/referrals/views.py**
   - Updated `delay_transfer` function to set `delay_notified_at` and `delay_reason`

3. **SPMC/referrals/serializers.py**
   - Added `delay_notified_at` and `delay_reason` to `ReferralListSerializer.fields`

4. **SPMC/front-end/src/lib/notificationService.ts**
   - Enhanced delay detection logic
   - Added debug logging
   - Fixed timestamp comparison logic

5. **SPMC/referrals/migrations/0025_add_delay_notification_fields.py**
   - Database migration (already applied)

## How It Works Now

### Step 1: Referrer Reports Delay
```
Referrer clicks "Delay Transfer" → Enters reason → Clicks "Notify EDCC/Triage"
```

### Step 2: Backend Processes
```
delay_transfer endpoint:
  - Sets referral.delay_notified_at = now()
  - Sets referral.delay_reason = provided reason
  - Creates status history record
  - Returns success response
```

### Step 3: API Returns Data
```
GET /api/referrals/ returns:
{
  "id": 123,
  "referral_id": "REF-20260304-001",
  "status": "dispositioned",
  "delay_notified_at": "2026-03-04T10:30:00Z",
  "delay_reason": "Waiting for family approval",
  ...
}
```

### Step 4: Notification Service Detects
```
Every 5 seconds:
  - Fetches all referrals
  - Checks for dispositioned referrals with delay_notified_at
  - If delay is new (after last check), creates notification
  - Triage staff sees: "Transfer delayed for [Patient]: [Reason] - [ID]"
```

## Testing

### Quick Test
1. Open two browser tabs
2. Tab 1: Log in as Referrer
3. Tab 2: Log in as Triage/EDCC
4. Tab 1: Click "Delay Transfer" on a dispositioned referral
5. Tab 2: Wait 5 seconds → Should see notification

### Debug Test
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for logs like:
   - `🔔 Notification polling started...`
   - `🔍 Checking dispositioned referral...`
   - `🟠 Delayed transfer detected...`

### API Test
1. Open DevTools → Network tab
2. Look for `/api/referrals/` request
3. Check response includes `delay_notified_at` and `delay_reason`

## Expected Behavior

✅ Referrer sees success message when clicking "Delay Transfer"
✅ Triage staff sees notification within 5 seconds
✅ Notification includes patient name, delay reason, and referral ID
✅ Notification persists until dismissed
✅ Multiple delays create separate notifications
✅ Delay information is recorded in status history
✅ Referral status remains "dispositioned"

## Verification Checklist

- [x] Model fields added and migrated
- [x] Backend endpoint updated to set fields
- [x] Serializer includes new fields in API response
- [x] Notification service detects delays
- [x] Debug logging added
- [x] Unique notification IDs prevent duplicates
- [x] Works for delays reported before/after login
- [x] Documentation created

## Notes

- Notification polling interval: 5 seconds
- Notification ID format: `delay_transfer_{referral_id}_{timestamp}`
- Only visible to users with `can_triage_referrals` permission
- Delay information persists in database for audit trail
- Status history records the delay with reason
