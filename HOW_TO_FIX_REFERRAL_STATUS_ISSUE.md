# How to Fix "Can only make triage decisions for referrals in waiting status" Error

## The Problem

You're seeing referrals in the Active Referrals table and the Accept button is visible, but when you click it, you get:
> "Can only make triage decisions for referrals in waiting status"

## Root Cause

The referrals in your database are **NOT actually in 'waiting' status**. They might be:
- Already triaged (status = 'emergent', 'urgent', or 'schedule_opd')
- In an inconsistent state (status says 'waiting' but triage_decision is already set)

## Solution Steps

### Step 1: Check Your Referral Statuses

Run this command in the SPMC directory:

```bash
cd SPMC
python check_and_fix_referral_statuses.py --check
```

This will show you:
- All referrals and their current statuses
- Any inconsistencies in the data
- Which referrals can actually be accepted

### Step 2: Understand the Output

Look for referrals with:
- ✅ **Status: waiting** → These CAN be accepted
- ❌ **Status: emergent/urgent/schedule_opd** → These have ALREADY been triaged
- ⚠️ **Issues** → Data inconsistencies that need fixing

### Step 3: Fix the Issues (Choose One Option)

#### Option A: Auto-Fix Inconsistencies
If the script found issues (like status='waiting' but triage_decision is set):

```bash
python check_and_fix_referral_statuses.py --fix
```

This will automatically fix data inconsistencies.

#### Option B: Reset Specific Referrals to Waiting
If you want to reset specific referrals back to 'waiting' status (so you can re-triage them):

```bash
# Reset referral IDs 1, 2, and 3 back to waiting
python check_and_fix_referral_statuses.py --reset 1,2,3
```

This will:
- Change status to 'waiting'
- Clear triage_decision
- Clear triaged_by and triaged_at
- Allow you to accept them again

### Step 4: Refresh Your Browser

After fixing the database:
1. Refresh your browser (Ctrl+F5 or Cmd+Shift+R)
2. The referrals should now show correct statuses
3. Only 'waiting' referrals will have the Accept button

## Quick Test

To test if a referral can be accepted:

1. **Check the Status Badge** in the table:
   - 🟡 Yellow/Orange "Waiting" → Can accept ✅
   - 🔴 Red "Emergent" → Already triaged ❌
   - 🟠 Orange "Urgent" → Already triaged ❌
   - 🟢 Green "Schedule OPD" → Already triaged ❌

2. **Check for the Accept Button**:
   - If you see the green checkmark button (✓) → Can accept
   - If you don't see it → Already triaged

## Common Scenarios

### Scenario 1: "All my referrals show as Emergent/Urgent"
**Cause:** They've already been triaged.
**Solution:** Either:
- Create new referrals from EDCC
- Reset existing referrals using `--reset` option

### Scenario 2: "I see the Accept button but get the error"
**Cause:** Frontend and backend are out of sync (you might have old cached data).
**Solution:**
1. Hard refresh browser (Ctrl+F5)
2. Check database with the script
3. Make sure you pulled the latest code changes

### Scenario 3: "I want to re-triage a referral"
**Solution:**
```bash
# Find the referral ID from the table
# Then reset it
python check_and_fix_referral_statuses.py --reset 1
```

## Testing the Full Workflow

To test the complete triage workflow:

### 1. Create a New Referral (as EDCC)
- Log in as EDCC user
- Create a new referral
- Status will be 'pending'

### 2. Transfer to Triage (as EDCC)
- Click "Transfer to EDMAR/EDHO Triage"
- Select a department
- Status changes to 'waiting'

### 3. Accept Referral (as Triage User)
- Log in as triage user
- You should see the referral with 'waiting' status
- Click the Accept button (green checkmark)
- Select triage decision (Emergent/Urgent/Schedule OPD)
- Status changes to the selected decision

### 4. Verify
- The Accept button should disappear
- Status badge should show the new status
- Referral should remain in the list for monitoring

## Database Status Reference

```
pending          → Created, waiting for EDCC transfer
waiting          → Transferred to triage, READY TO ACCEPT ✅
emergent         → Triaged as emergent (already accepted)
urgent           → Triaged as urgent (already accepted)
schedule_opd     → Triaged for OPD (already accepted)
in_transit       → Patient being transported
completed        → Process finished
cancelled        → Referral cancelled
```

## Need More Help?

If you're still having issues:

1. Run the check script and share the output
2. Check the Django server logs for errors
3. Verify your user has `can_triage_referrals` permission
4. Make sure you're logged in as a triage user (not EDCC or HIS)

## Summary

**The key point:** You can only accept referrals with `status='waiting'`. If a referral is already 'emergent', 'urgent', or 'schedule_opd', it has already been triaged and cannot be accepted again.

Use the `check_and_fix_referral_statuses.py` script to:
- ✅ Check what status your referrals are actually in
- ✅ Fix any data inconsistencies
- ✅ Reset referrals back to 'waiting' if needed for testing
