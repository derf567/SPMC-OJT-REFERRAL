# Triage Decision Workflow Update

## Summary
Updated the triage workflow to differentiate between emergent and urgent cases, with specific actions required from referrers based on the triage decision.

## Changes Made

### 1. Backend Changes (SPMC/referrals/views.py)

#### Modified `accept_with_triage_decision` endpoint:
- **Emergent Cases**: When EDMA/EDHO marks a referral as "emergent":
  - Status automatically changes to `in_transit`
  - `transit_decision` is automatically set to `'now'`
  - `transit_decision_at` is set to current timestamp
  - Referrer does NOT need to make a transit decision
  - Patient should be transferred immediately

- **Urgent Cases**: When EDMA/EDHO marks a referral as "urgent":
  - Status changes to `urgent`
  - Referrer MUST respond to triage call
  - Referrer can choose:
    - "Transport Now" (immediate transfer)
    - "Schedule Transport" (schedule for later)

- **Schedule OPD**: Remains unchanged
  - Patient goes to OPD themselves
  - No transport decision needed

### 2. Frontend Changes (SPMC/front-end/src/pages/ReferrerDashboard.tsx)

#### Added Emergent Notification Banner:
- Red banner appears when referrer has emergent cases
- Shows "🚨 EMERGENT - Transfer Patient Immediately"
- Clearly indicates patient requires immediate emergency care

#### Updated Referral Cards:
- Emergent cases show red "Transfer Immediately" badge
- Urgent cases show orange "Triage Call" button
- Status label shows "🚨 Emergent - In Transit" for emergent cases

#### Updated Status Labels:
- Emergent cases in transit show special label
- Differentiates between emergent and regular in-transit cases

## Workflow Summary

### For EDMA/EDHO Triage Staff:
1. Review referral in "Waiting" status
2. Make triage decision:
   - **Emergent**: Patient needs immediate care → Automatically marked for immediate transfer
   - **Urgent**: Patient needs urgent care → Referrer must decide on transport timing
   - **Schedule OPD**: Patient can come themselves → Schedule appointment

### For Referrers:

#### When Referral is Marked as EMERGENT:
1. Receive notification: "🚨 EMERGENT - Transfer Patient Immediately"
2. See red "Transfer Immediately" badge on referral
3. Status shows "🚨 Emergent - In Transit"
4. **Action Required**: Transfer patient immediately to SPMC
5. No transport scheduling options available

#### When Referral is Marked as URGENT:
1. Receive notification: "🚨 Urgent Triage Call Required"
2. See orange "Triage Call" button on referral
3. Click button to open transit decision modal
4. **Choose One**:
   - "Transport Now" → Immediate transfer
   - "Schedule Transport" → Schedule for later (e.g., 2 hours from now)
5. Status updates based on decision

#### When Referral is Marked as SCHEDULE OPD:
1. See scheduled appointment details
2. Patient will go to OPD themselves
3. No transport action required from referrer

## Technical Details

### Database Fields Used:
- `triage_decision`: 'emergent', 'urgent', or 'schedule_opd'
- `status`: Current referral status
- `transit_decision`: 'now' or 'scheduled' (auto-set for emergent)
- `transit_decision_at`: Timestamp of transit decision
- `is_emergent`: Boolean flag for emergent cases
- `is_urgent`: Boolean flag for urgent cases

### Status Flow:
```
Emergent:
pending → waiting → in_transit (automatic) → completed

Urgent:
pending → waiting → urgent → (referrer decides) → in_transit → completed

Schedule OPD:
pending → waiting → schedule_opd → completed
```

## Benefits

1. **Clear Differentiation**: Emergent vs urgent cases are handled differently
2. **Immediate Action**: Emergent cases bypass transport scheduling
3. **Flexibility**: Urgent cases allow referrers to plan transport
4. **Better Communication**: Clear visual indicators for each case type
5. **Reduced Confusion**: No unnecessary decision-making for emergent cases

## Testing Recommendations

1. Test emergent triage decision:
   - Verify status changes to in_transit automatically
   - Verify referrer sees "Transfer Immediately" message
   - Verify no transport decision modal appears

2. Test urgent triage decision:
   - Verify referrer sees triage call button
   - Verify transport decision modal appears
   - Test both "Transport Now" and "Schedule Transport" options

3. Test schedule OPD:
   - Verify appointment scheduling works
   - Verify no transport decision required

## Notes

- Emergent cases are the highest priority and require immediate action
- Urgent cases still require referrer input for transport timing
- Schedule OPD cases remain unchanged (patient goes themselves)
- All status changes are logged in referral history
