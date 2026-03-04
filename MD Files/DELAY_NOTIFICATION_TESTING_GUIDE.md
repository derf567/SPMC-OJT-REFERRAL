# Delay Transfer Notification - Testing Guide

## Issue Fixed
The delay transfer notification was not appearing for triage/EDCC staff when a referrer clicked "Delay Transfer".

## Root Causes Identified and Fixed

### 1. Missing Fields in Serializer
**Problem**: The `ReferralListSerializer` was not including `delay_notified_at` and `delay_reason` fields, so the API wasn't returning them.

**Fix**: Added both fields to the `fields` list in `ReferralListSerializer`.

### 2. Incomplete Notification Logic
**Problem**: The notification service was only checking for delays that occurred AFTER the triage staff logged in, missing delays that happened before they logged in.

**Fix**: Updated the delay notification check to detect delays regardless of when they occurred, using a unique ID that includes the delay timestamp to prevent duplicates.

### 3. Added Debug Logging
**Added**: Console logging to help debug the notification detection process.

## Testing Steps

### Setup
1. Have two browser windows/tabs open
2. In Tab 1: Log in as a **Referrer** account
3. In Tab 2: Log in as a **Triage/EDCC** account

### Test Scenario 1: Delay After Triage Logs In
1. In Tab 1 (Referrer): Navigate to a referral with status "Accepted - Fill In-Transit Form"
2. In Tab 2 (Triage): Keep the page open and watch for notifications
3. In Tab 1: Click "Actions" → "Delay Transfer"
4. In Tab 1: Enter a delay reason (e.g., "Waiting for family approval")
5. In Tab 1: Click "Notify EDCC/Triage"
6. **Expected**: Within 5 seconds, Tab 2 should show a notification with the delay message

### Test Scenario 2: Delay Before Triage Logs In
1. In Tab 1 (Referrer): Click "Delay Transfer" on a dispositioned referral
2. In Tab 1: Enter a delay reason and submit
3. In Tab 2 (Triage): Refresh the page or navigate away and back
4. **Expected**: The notification should appear immediately (or within 5 seconds)

## Debugging

### Check Browser Console
Open the browser developer console (F12) and look for:

1. **Notification Service Started**:
   ```
   🔔 Notification polling started for user with permissions: {...}
   ```

2. **Checking Dispositioned Referrals**:
   ```
   🔍 Checking dispositioned referral: {
     referral_id: "REF-20260304-001",
     delay_notified_at: "2026-03-04T10:30:00Z",
     delay_reason: "Waiting for family approval",
     lastCheckedTimestamp: "2026-03-04T10:25:00Z"
   }
   ```

3. **Delay Detected**:
   ```
   🟠 Delayed transfer detected: REF-20260304-001
   ```

### Check API Response
1. Open browser DevTools → Network tab
2. Look for `/api/referrals/` requests
3. Check the response to verify `delay_notified_at` and `delay_reason` are present:
   ```json
   {
     "id": 123,
     "referral_id": "REF-20260304-001",
     "status": "dispositioned",
     "delay_notified_at": "2026-03-04T10:30:00Z",
     "delay_reason": "Waiting for family approval",
     ...
   }
   ```

### Common Issues

**Issue**: Notification doesn't appear
- **Check**: Is the triage user's `can_triage_referrals` permission set to `true`?
- **Check**: Is the referral status exactly `dispositioned`?
- **Check**: Are `delay_notified_at` and `delay_reason` present in the API response?
- **Check**: Is the notification service polling (check console for "🔔 Notification polling started")?

**Issue**: Notification appears but disappears quickly
- **Expected**: Notifications stay visible until manually dismissed
- **Check**: Is there a notification container visible on the page?

**Issue**: Multiple notifications for the same delay
- **Expected**: Each delay action creates one notification
- **Check**: The notification ID includes the delay timestamp to prevent duplicates

## Files Modified
1. `SPMC/referrals/models.py` - Added `delay_notified_at` and `delay_reason` fields
2. `SPMC/referrals/views.py` - Updated `delay_transfer` to set these fields
3. `SPMC/referrals/serializers.py` - Added fields to `ReferralListSerializer`
4. `SPMC/front-end/src/lib/notificationService.ts` - Enhanced delay detection logic with debug logging
5. `SPMC/referrals/migrations/0025_add_delay_notification_fields.py` - Database migration

## Expected Behavior After Fix

1. **Referrer clicks "Delay Transfer"**:
   - Sees success message: "EDCC/Triage staff have been notified of the delay"
   - Referral status remains "dispositioned"

2. **Triage staff sees notification**:
   - Notification appears within 5 seconds
   - Message format: "Transfer delayed for [Patient Name]: [Delay Reason] - [Referral ID]"
   - Can click notification to view referral details
   - Notification persists until dismissed

3. **Audit trail**:
   - Status history records the delay with the reason
   - `delay_notified_at` timestamp is recorded
   - `delay_reason` is stored for reference

## Notes
- The notification polling interval is 5 seconds, so there may be a slight delay before the notification appears
- Multiple delays on the same referral will create separate notifications
- The delay notification is independent of the referral status (status stays "dispositioned")
- Triage staff with `can_triage_referrals` permission will see all delay notifications
