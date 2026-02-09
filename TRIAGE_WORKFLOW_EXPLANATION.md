# Triage Workflow - Why You Can't Accept Some Referrals

## The Problem You Encountered

You're seeing referrals in the Active Referrals table, but when you try to accept them, you get the error:
> "Can only make triage decisions for referrals in waiting status"

## Why This Happens

### Referral Status Flow:
1. **pending** → Referral created, waiting for EDCC to transfer
2. **waiting** → EDCC transferred to triage, **READY TO BE ACCEPTED** ✅
3. **emergent/urgent/schedule_opd** → Already triaged/accepted ❌
4. **in_transit** → Patient is being transported
5. **completed** → Process finished

### The Issue:
Triage users were seeing ALL active referrals (waiting, emergent, urgent, schedule_opd, in_transit), but the "Accept Referral" button was shown for all of them. However, the backend only allows accepting referrals with `status='waiting'`.

## What Was Fixed

### 1. Button Visibility (MAIN FIX)
**Before:**
```tsx
{user?.permissions?.can_triage_referrals && (
  <Button>Accept Referral</Button>
)}
```

**After:**
```tsx
{user?.permissions?.can_triage_referrals && referral.status === 'waiting' && (
  <Button>Accept Referral</Button>
)}
```

Now the "Accept Referral" button only shows for referrals with `status='waiting'`.

### 2. Change Department Button
Also fixed to only show for `status='waiting'` referrals.

## How to Use the System Correctly

### As a Triage User (EDMAR/EDHO):

#### Step 1: View Active Referrals
You'll see referrals in different statuses:
- 🟡 **Waiting** - Needs your action (Accept button visible)
- 🔴 **Emergent** - Already triaged as emergent (no Accept button)
- 🟠 **Urgent** - Already triaged as urgent (no Accept button)
- 🟢 **Schedule OPD** - Already triaged for OPD (no Accept button)
- 🔵 **In Transit** - Patient is being transported (no Accept button)

#### Step 2: Accept Only "Waiting" Referrals
1. Click on a referral with **"Waiting"** status
2. You'll see the "Accept Referral" button (green)
3. Click it and select triage decision:
   - 🚨 **Emergent** - Immediate attention required
   - ⚡ **Urgent** - Needs prompt care
   - 📅 **Schedule for OPD** - Outpatient follow-up

#### Step 3: Already Triaged Referrals
For referrals already in emergent/urgent/schedule_opd status:
- These have already been accepted/triaged
- You can view their details but cannot re-accept them
- They remain in your view for monitoring until completed

## Visual Indicators

### Status Badge Colors:
- **Yellow/Orange** (Waiting) → Needs action
- **Red** (Emergent) → Already triaged, high priority
- **Orange** (Urgent) → Already triaged, medium priority
- **Green** (Schedule OPD) → Already triaged, scheduled
- **Blue** (In Transit) → Patient traveling
- **Gray** (Completed) → Finished

### Department Badge:
Shows which department the referral is assigned to (Emergency, Internal Medicine, etc.)

## Common Scenarios

### Scenario 1: "I see a referral but can't accept it"
**Reason:** The referral status is not 'waiting' - it's already been triaged.
**Solution:** Check the status badge. Only 'waiting' referrals can be accepted.

### Scenario 2: "The Accept button disappeared"
**Reason:** The referral was already accepted (by you or another triage user).
**Solution:** This is correct behavior. The referral is now in emergent/urgent/schedule_opd status.

### Scenario 3: "I want to change a triage decision"
**Current Limitation:** Once a referral is accepted and triaged, the decision cannot be changed through the UI.
**Workaround:** Contact system administrator or use Django admin panel.

## Testing Checklist

To test the fix:
1. ✅ Refresh the browser
2. ✅ Look for referrals with "Waiting" status
3. ✅ Click on a "Waiting" referral - you should see "Accept Referral" button
4. ✅ Click on an "Emergent/Urgent/Schedule OPD" referral - NO "Accept Referral" button
5. ✅ Accept a "Waiting" referral - it should work now
6. ✅ After accepting, the referral should change status and Accept button should disappear

## Summary

**The fix ensures:**
- ✅ "Accept Referral" button only shows for `status='waiting'` referrals
- ✅ "Change Department" button only shows for `status='waiting'` referrals
- ✅ Already triaged referrals remain visible for monitoring but cannot be re-accepted
- ✅ Clear visual feedback about which referrals need action

**You can now only accept referrals that are actually waiting for triage!**
