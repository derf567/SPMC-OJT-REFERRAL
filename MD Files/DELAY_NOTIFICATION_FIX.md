# Delay Transfer Notification Fix

## Problem
When a referrer clicks the "Delay Transfer" action and provides a reason, the system shows a success message saying "EDCC/Triage staff have been notified of the delay". However, when triage/EDCC personnel log in, they don't see any notification about the delay.

## Root Cause
The `delay_transfer` function in the backend was only creating a status history record but wasn't storing any data that the notification polling system could detect. The notification service checks for specific conditions on referrals, but there was no condition to check for delay notifications.

## Solution Implemented

### 1. Added New Fields to Referral Model
Added two new fields to track delay notifications:
- `delay_notified_at` (DateTimeField): Timestamp when the delay notification was created
- `delay_reason` (TextField): The reason provided by the referrer for the delay

### 2. Updated delay_transfer Function
Modified the `delay_transfer` endpoint in `views.py` to:
- Set `delay_notified_at` to the current timestamp
- Store the `delay_reason` provided by the referrer
- Continue creating the status history record for audit trail

### 3. Enhanced Notification Service
Updated the notification polling logic in `notificationService.ts` to:
- Check for referrals with status `dispositioned` that have a `delay_notified_at` timestamp newer than the last check
- Create a notification for triage staff when a delay is detected
- Include the delay reason in the notification message

### 4. Created Database Migration
Created migration `0025_add_delay_notification_fields.py` to add the new fields to the database.

## How It Works Now

1. **Referrer Action**: Referrer clicks "Delay Transfer" and provides a reason
2. **Backend Processing**: 
   - `delay_transfer` endpoint sets `delay_notified_at` and `delay_reason` on the referral
   - Status history is created for audit trail
3. **Notification Polling**: 
   - Triage staff's notification service polls every 5 seconds
   - Detects referrals with `delay_notified_at` > last check timestamp
   - Creates a notification showing the patient name, referral ID, and delay reason
4. **Triage Staff Sees**: 
   - A notification appears in their notification container
   - Message format: "Transfer delayed for [Patient Name]: [Delay Reason] - [Referral ID]"
   - They can click the notification to view the referral details

## Files Modified
- `SPMC/referrals/models.py` - Added delay notification fields
- `SPMC/referrals/views.py` - Updated delay_transfer function
- `SPMC/front-end/src/lib/notificationService.ts` - Added delay notification detection
- `SPMC/referrals/migrations/0025_add_delay_notification_fields.py` - New migration

## Testing
To test the fix:
1. Log in as a referrer with a dispositioned referral
2. Click "Delay Transfer" and provide a reason
3. Log in as triage/EDCC personnel in a different browser/tab
4. Wait up to 5 seconds for the notification to appear
5. The notification should show the delay message with the reason provided

## Notes
- The notification will appear for all triage staff with `can_triage_referrals` permission
- The delay notification is separate from the referral status (status remains "dispositioned")
- Multiple delays on the same referral will create multiple notifications (one per delay action)
- The delay information is preserved in the status history for audit purposes
