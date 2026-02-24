# Testing Guide: Updated Triage Workflow

## Overview
This guide helps you test the updated triage workflow where emergent cases automatically transfer patients immediately, while urgent cases require referrer input.

## Prerequisites
1. Backend server running (Django)
2. Frontend server running (React/Vite)
3. Test accounts:
   - EDCC Personnel account
   - EDMA/EDHO Triage account
   - Referrer account

## Test Scenarios

### Scenario 1: Emergent Case (Immediate Transfer)

#### Steps:
1. **As Referrer**: Submit a new referral
   - Go to referral form
   - Fill in patient details
   - Submit referral

2. **As EDCC Personnel**: Transfer to triage
   - View pending referrals
   - Select the referral
   - Click "Transfer to Triage"
   - Select a department
   - Confirm transfer

3. **As EDMA/EDHO Triage**: Mark as Emergent
   - View waiting referrals
   - Select the referral
   - Click "Accept with Triage Decision"
   - Select "Emergent"
   - Add triage notes (optional)
   - Submit decision

4. **Verify Backend**:
   - Status should be: `in_transit`
   - `triage_decision` should be: `emergent`
   - `transit_decision` should be: `now`
   - `is_emergent` should be: `True`
   - `transit_decision_at` should be set

5. **As Referrer**: Check dashboard
   - Should see red banner: "🚨 EMERGENT - Transfer Patient Immediately"
   - Referral card should show red "Transfer Immediately" badge
   - Status should show: "🚨 Emergent - In Transit"
   - NO triage call button should appear
   - NO transport scheduling options

6. **Expected Behavior**:
   - Referrer understands patient needs immediate transfer
   - No additional action required from referrer
   - Patient should be transferred immediately

### Scenario 2: Urgent Case (Referrer Decides Transport)

#### Steps:
1. **As Referrer**: Submit a new referral
   - Same as Scenario 1

2. **As EDCC Personnel**: Transfer to triage
   - Same as Scenario 1

3. **As EDMA/EDHO Triage**: Mark as Urgent
   - View waiting referrals
   - Select the referral
   - Click "Accept with Triage Decision"
   - Select "Urgent"
   - Add triage notes (optional)
   - Submit decision

4. **Verify Backend**:
   - Status should be: `urgent`
   - `triage_decision` should be: `urgent`
   - `transit_decision` should be: `null` (not set yet)
   - `is_urgent` should be: `True`

5. **As Referrer**: Check dashboard
   - Should see orange banner: "🚨 Urgent Triage Call Required"
   - Referral card should show orange "Triage Call" button (pulsing)
   - Status should show: "⚡ Urgent"

6. **As Referrer**: Respond to triage call
   - Click "Triage Call" button or "Respond Now" in banner
   - Modal should open showing:
     - Patient information
     - "⚡ Marked as URGENT by EDMAR Triage"
     - Two options:
       - "Transport Now (Immediate)" - red button
       - "Schedule Transport (2 hours from now)" - blue button

7. **Test Option A - Transport Now**:
   - Click "Transport Now"
   - Verify backend:
     - Status changes to: `in_transit`
     - `transit_decision` set to: `now`
     - `transit_decision_at` timestamp set
   - Verify frontend:
     - Status shows: "🚑 Transport Initiated"
     - Triage call button disappears
     - Orange banner disappears

8. **Test Option B - Schedule Transport**:
   - Click "Schedule Transport"
   - Verify backend:
     - Status remains: `urgent`
     - `transit_decision` set to: `scheduled`
     - `transit_scheduled_date` and `transit_scheduled_time` set
     - `transit_decision_at` timestamp set
   - Verify frontend:
     - Status shows: "📅 Transport Scheduled"
     - Triage call button disappears
     - Orange banner disappears

### Scenario 3: Schedule OPD (No Change)

#### Steps:
1. **As Referrer**: Submit a new referral
   - Same as Scenario 1

2. **As EDCC Personnel**: Transfer to triage
   - Same as Scenario 1

3. **As EDMA/EDHO Triage**: Schedule for OPD
   - View waiting referrals
   - Select the referral
   - Click "Accept with Triage Decision"
   - Select "Schedule for OPD"
   - Enter scheduled date
   - Enter scheduled time
   - Add triage notes (optional)
   - Submit decision

4. **Verify Backend**:
   - Status should be: `schedule_opd`
   - `triage_decision` should be: `schedule_opd`
   - `scheduled_date` and `scheduled_time` should be set

5. **As Referrer**: Check dashboard
   - Status should show: "📅 Scheduled OPD"
   - Should see scheduled date and time
   - No transport action required

6. **Expected Behavior**:
   - Patient will go to OPD themselves
   - No transport coordination needed

## Verification Checklist

### Backend Verification
- [ ] Emergent cases automatically set `transit_decision` to 'now'
- [ ] Emergent cases change status to 'in_transit'
- [ ] Urgent cases require referrer response
- [ ] Urgent cases allow 'now' or 'scheduled' transit decision
- [ ] Schedule OPD cases work as before
- [ ] Status history records all changes correctly
- [ ] API returns `triage_decision` field in responses

### Frontend Verification
- [ ] Emergent banner appears for emergent cases
- [ ] Urgent banner appears for urgent cases (without transit decision)
- [ ] Emergent cases show "Transfer Immediately" badge
- [ ] Urgent cases show "Triage Call" button
- [ ] Transit decision modal works correctly
- [ ] Status labels update correctly
- [ ] Notifications show correct messages
- [ ] Timeline shows correct workflow steps

### User Experience Verification
- [ ] Referrers understand emergent = immediate transfer
- [ ] Referrers can choose transport timing for urgent cases
- [ ] Visual indicators are clear and distinct
- [ ] No confusion between emergent and urgent
- [ ] Workflow is intuitive

## Common Issues and Solutions

### Issue: Emergent cases still showing triage call button
**Solution**: Check that backend is setting `transit_decision` to 'now' automatically

### Issue: Status not updating correctly
**Solution**: Verify serializers include `triage_decision` field

### Issue: Notifications not showing
**Solution**: Check notification service filters for emergent cases

### Issue: Timeline not showing correct steps
**Solution**: Verify timeline logic checks for `triage_decision` field

## Database Queries for Verification

```sql
-- Check emergent referrals
SELECT id, referral_id, status, triage_decision, transit_decision, is_emergent
FROM referrals_referral
WHERE triage_decision = 'emergent';

-- Check urgent referrals
SELECT id, referral_id, status, triage_decision, transit_decision, is_urgent
FROM referrals_referral
WHERE triage_decision = 'urgent';

-- Check status history
SELECT r.referral_id, h.old_status, h.new_status, h.notes, h.changed_at
FROM referrals_referralstatushistory h
JOIN referrals_referral r ON h.referral_id = r.id
WHERE r.triage_decision IN ('emergent', 'urgent')
ORDER BY h.changed_at DESC;
```

## Success Criteria

✅ Emergent cases automatically transfer without referrer input
✅ Urgent cases require referrer to choose transport timing
✅ Schedule OPD cases work as before
✅ All status changes are logged
✅ Notifications are clear and actionable
✅ UI clearly differentiates between emergent and urgent
✅ No confusion in the workflow
