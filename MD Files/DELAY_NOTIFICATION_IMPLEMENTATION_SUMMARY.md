# Delay Transfer Notification - Implementation Summary

## Overview
Fixed the issue where triage/EDCC staff were not receiving notifications when a referrer reported a transfer delay.

## Changes Made

### 1. Database Model (SPMC/referrals/models.py)
Added two new fields to the `Referral` model:
```python
# Delay notification tracking
delay_notified_at = models.DateTimeField(null=True, blank=True, help_text="When triage/EDCC was notified of transfer delay")
delay_reason = models.TextField(blank=True, null=True, help_text="Reason for transfer delay")
```

### 2. Backend Endpoint (SPMC/referrals/views.py)
Updated the `delay_transfer` action to populate the new fields:
```python
@action(detail=True, methods=['post'])
def delay_transfer(self, request, pk=None):
    """Notify EDCC/Triage that transfer is delayed"""
    referral = self.get_object()
    
    # ... validation code ...
    
    delay_reason = request.data.get('delay_reason', 'Transfer delayed by referrer')
    
    # Update referral with delay notification info
    referral.delay_notified_at = timezone.now()
    referral.delay_reason = delay_reason
    referral.save()
    
    # Create status history to track the delay notification
    ReferralStatusHistory.objects.create(...)
    
    return Response({...})
```

### 3. API Serializer (SPMC/referrals/serializers.py)
Added the new fields to `ReferralListSerializer`:
```python
class ReferralListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Referral
        fields = [
            # ... existing fields ...
            # Delay notification tracking
            'delay_notified_at', 'delay_reason'
        ]
```

### 4. Frontend Notification Service (SPMC/front-end/src/lib/notificationService.ts)
Enhanced the notification detection logic:
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
    console.log('🟠 Delayed transfer detected:', referral.referral_id);
    onNotification({
      id: delayId,
      type: 'referral_transferred',
      message: `Transfer delayed for ${referral.patient_full_name}: ${referral.delay_reason} - ${referral.referral_id}`,
      referralId: referral.referral_id,
      timestamp: referral.delay_notified_at,
    });
  }
}
```

### 5. Database Migration
Created migration `0025_add_delay_notification_fields.py` to add the new fields to the database.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. REFERRER ACTION                                              │
│    - Clicks "Delay Transfer"                                    │
│    - Enters delay reason                                        │
│    - Clicks "Notify EDCC/Triage"                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. BACKEND PROCESSING                                           │
│    - delay_transfer endpoint called                             │
│    - Sets delay_notified_at = now()                            │
│    - Sets delay_reason = provided reason                        │
│    - Creates status history record                              │
│    - Returns success response                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. API RESPONSE                                                 │
│    - GET /api/referrals/ includes:                             │
│      - delay_notified_at: "2026-03-04T10:30:00Z"              │
│      - delay_reason: "Waiting for family approval"             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. NOTIFICATION SERVICE (Every 5 seconds)                       │
│    - Fetches all referrals                                      │
│    - Checks for dispositioned referrals with delay_notified_at │
│    - Compares delay_notified_at with lastCheckedTimestamp      │
│    - If new delay detected, creates notification               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. TRIAGE STAFF SEES NOTIFICATION                              │
│    - Message: "Transfer delayed for [Patient]: [Reason] - [ID]"│
│    - Can click to view referral details                         │
│    - Notification persists until dismissed                      │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

✅ **Real-time Notifications**: Triage staff see delays within 5 seconds
✅ **Persistent Storage**: Delay information stored in database for audit trail
✅ **Duplicate Prevention**: Unique notification IDs prevent duplicate notifications
✅ **Backward Compatible**: Works with existing referral workflow
✅ **Debug Logging**: Console logs help diagnose issues
✅ **Status History**: Delay reason recorded in referral status history

## Testing Checklist

- [x] Model fields created and migrated
- [x] Backend endpoint updated
- [x] API serializer includes new fields
- [x] Notification service detects delays
- [x] Debug logging added
- [x] Unique notification IDs prevent duplicates
- [x] Works for delays reported before/after login
- [x] Referral status remains "dispositioned"
- [x] Status history records delay with reason

## Verification Steps

1. **Check Database**:
   ```bash
   python manage.py migrate
   ```

2. **Test API Response**:
   - Make GET request to `/api/referrals/`
   - Verify response includes `delay_notified_at` and `delay_reason`

3. **Test Notification**:
   - Open two browser tabs (Referrer and Triage)
   - Referrer: Click "Delay Transfer"
   - Triage: Wait 5 seconds for notification

4. **Check Console Logs**:
   - Open DevTools (F12)
   - Look for "🟠 Delayed transfer detected" message

## Files Modified

1. `SPMC/referrals/models.py` - Added model fields
2. `SPMC/referrals/views.py` - Updated delay_transfer endpoint
3. `SPMC/referrals/serializers.py` - Added fields to serializer
4. `SPMC/front-end/src/lib/notificationService.ts` - Enhanced notification logic
5. `SPMC/referrals/migrations/0025_add_delay_notification_fields.py` - Database migration

## Troubleshooting

### Notification Not Appearing
1. Check browser console for error messages
2. Verify triage user has `can_triage_referrals` permission
3. Verify referral status is exactly "dispositioned"
4. Check API response includes `delay_notified_at` and `delay_reason`
5. Verify notification service is polling (look for "🔔 Notification polling started")

### Multiple Notifications for Same Delay
- This is expected if delay_transfer is called multiple times
- Each call creates a new notification
- Notification IDs include timestamp to prevent duplicates

### Notification Appears Then Disappears
- Check if notification container is visible
- Verify notification is not being auto-dismissed
- Check browser console for errors

## Performance Considerations

- Notification polling interval: 5 seconds (configurable)
- API calls: One per polling interval for all referrals
- Database queries: Minimal (uses select_related and prefetch_related)
- Memory: Notification IDs include timestamp to prevent memory leaks

## Future Enhancements

- Add notification preferences (email, SMS, push)
- Add notification history/archive
- Add notification filtering by department
- Add real-time WebSocket notifications (instead of polling)
- Add notification sound/vibration alerts
