# Delay Transfer Notification - Quick Reference Card

## What It Does
When a referrer reports a transfer delay, triage/EDCC staff get a notification and can click it to navigate directly to the Triage Referrals page.

## Quick Start

### For Referrers
1. Go to referral with status "Accepted - Fill In-Transit Form"
2. Click "Actions" → "Delay Transfer"
3. Enter reason (e.g., "Waiting for family approval")
4. Click "Notify EDCC/Triage"
5. ✅ Done! Triage staff will be notified

### For Triage Staff
1. Wait for notification to appear (within 5 seconds)
2. See message: "Transfer delayed for [Patient]: [Reason] - [ID]"
3. Click notification
4. ✅ Navigates to Triage Referrals page
5. Find and manage the delayed referral

## Key Features

| Feature | Details |
|---------|---------|
| **Detection** | Real-time, every 5 seconds |
| **Notification** | Appears in top-right corner |
| **Sound** | Plays if enabled |
| **Auto-dismiss** | After 8 seconds (or manual close) |
| **Click Action** | Navigates to /triage page |
| **Storage** | Persisted in database |
| **Audit Trail** | Recorded in status history |

## Data Stored

```
Referral Model:
├─ delay_notified_at: Timestamp when delay was reported
├─ delay_reason: Reason provided by referrer
└─ Status History: Record of delay with reason
```

## Notification Message Format

```
"Transfer delayed for [Patient Full Name]: [Delay Reason] - [Referral ID]"

Example:
"Transfer delayed for John Doe: Waiting for family approval - REF-20260304-001"
```

## Testing

### Quick Test (2 minutes)
1. Open 2 browser tabs
2. Tab 1: Log in as Referrer
3. Tab 2: Log in as Triage
4. Tab 1: Click "Delay Transfer"
5. Tab 2: Wait for notification
6. Tab 2: Click notification
7. ✅ Should navigate to /triage

### Verify
- [ ] Notification appears within 5 seconds
- [ ] Message shows correct patient name and reason
- [ ] Clicking navigates to /triage page
- [ ] Referral visible in triage list

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No notification | Check triage user has `can_triage_referrals` permission |
| Notification doesn't click | Check browser console for errors |
| Wrong page after click | Verify referral has `delay_notified_at` field |
| Multiple notifications | Expected if delay_transfer called multiple times |

## Console Debugging

Open DevTools (F12) → Console:
```
// Look for these logs:
🔔 Notification polling started...
🔍 Checking dispositioned referral...
🟠 Delayed transfer detected...
```

## API Endpoints

### Report Delay
```
POST /api/referrals/{id}/delay_transfer/
Body: {
  "delay_reason": "Waiting for family approval"
}
```

### Get Referrals (includes delay fields)
```
GET /api/referrals/
Response includes:
{
  "delay_notified_at": "2026-03-04T10:30:00Z",
  "delay_reason": "Waiting for family approval"
}
```

## Permissions Required

- **Referrer**: Can report delays on own referrals
- **Triage Staff**: `can_triage_referrals = true` to see notifications
- **EDCC Staff**: `can_triage_referrals = true` to see notifications

## Files Modified

| File | Change |
|------|--------|
| `models.py` | Added delay_notified_at, delay_reason fields |
| `views.py` | Updated delay_transfer endpoint |
| `serializers.py` | Added fields to ReferralListSerializer |
| `notificationService.ts` | Added delay detection logic |
| `DashboardLayout.tsx` | Added smart navigation on click |

## Performance

- **Polling**: Every 5 seconds
- **API Calls**: One per polling interval
- **Database**: Minimal queries (optimized)
- **Memory**: Efficient (includes timestamp in ID)

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Delay reported successfully |
| 400 | Invalid referral status |
| 403 | Permission denied |
| 404 | Referral not found |

## Related Pages

- Referrer Dashboard: `/referrer-dashboard`
- Triage Referrals: `/triage`
- Active Referrals: `/referrals`
- Admin Dashboard: `/admin`

## Keyboard Shortcuts

- `Esc` - Close notification
- `Click` - View details / Navigate

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported

## Common Scenarios

### Scenario 1: Delay Reported While Triage Online
1. Referrer reports delay
2. Triage sees notification within 5 seconds
3. Triage clicks notification
4. Navigates to triage page

### Scenario 2: Delay Reported Before Triage Logs In
1. Referrer reports delay
2. Triage logs in later
3. Notification appears immediately
4. Triage clicks notification
5. Navigates to triage page

### Scenario 3: Multiple Delays on Same Referral
1. Referrer reports delay #1
2. Triage sees notification #1
3. Referrer reports delay #2
4. Triage sees notification #2
5. Each notification is separate and clickable

## FAQ

**Q: How long does notification stay visible?**
A: 8 seconds (auto-dismisses) or until manually closed

**Q: Can I dismiss the notification?**
A: Yes, click the X button in the notification

**Q: What happens if I click the notification?**
A: Navigates to /triage page (for delay notifications)

**Q: Is the delay information saved?**
A: Yes, stored in database and status history

**Q: Can I see delay history?**
A: Yes, check the referral's status history

**Q: What if the referral is no longer dispositioned?**
A: Notification still appears but referral may have moved

**Q: Can I undo a delay report?**
A: No, but you can report another delay with updated reason

## Support

For issues or questions:
1. Check browser console for errors
2. Review troubleshooting section above
3. Check related documentation files
4. Contact system administrator

## Version Info

- **Feature**: Delay Transfer Notification System
- **Status**: ✅ Production Ready
- **Last Updated**: March 4, 2026
- **Migration**: 0025_add_delay_notification_fields
