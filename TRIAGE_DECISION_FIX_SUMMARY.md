# Triage Decision 400 Error - Fix Summary

## Problem
The frontend was sending `'critical'` as the triage decision value, but the backend expects `'emergent'`.

## Root Cause
After merging with Jayci's branch, the changes were reverted back to using `'critical'` instead of `'emergent'`.

## Files Fixed (Again After Merge)

### 1. Frontend Files Updated
- ✅ `SPMC/front-end/src/components/dashboard/ReferralTable.tsx`
  - Line 1572: Changed dropdown option value from `'critical'` to `'emergent'`
  - Line 867-869: Updated success message logic
  - Line 937: Updated timeline step logic
  - Line 1672-1677: Updated display logic in modal

- ✅ `SPMC/front-end/src/pages/ReferrerDashboard.tsx`
  - Line 247: Updated timeline step logic from `'critical'` to `'emergent'`

- ✅ `SPMC/front-end/src/pages/Patients.tsx`
  - Line 315: Updated timeline step logic from `'critical'` to `'emergent'`

### 2. API Error Handling Improved
- ✅ `SPMC/front-end/src/lib/api.ts`
  - Enhanced `apiRequest` function to capture and log detailed error messages from backend
  - Now shows actual error details in console instead of just "HTTP error! status: 400"

## Backend Expected Values
According to `SPMC/referrals/models.py`, the valid triage decisions are:
```python
TRIAGE_DECISION_CHOICES = [
    ('emergent', 'Emergent'),
    ('urgent', 'Urgent'),
    ('schedule_opd', 'Schedule for OPD'),
]
```

## Next Steps to Debug

1. **Check Browser Console**: With the improved error handling, the console should now show the actual error message from Django. Look for:
   ```
   API Error Details: { error: "..." }
   ```

2. **Check Django Server Logs**: Look at the terminal where Django is running for detailed error messages.

3. **Verify Referral Status**: The backend only accepts triage decisions for referrals with `status='waiting'`. Check if:
   - The referral you're trying to accept has `status='waiting'`
   - The referral hasn't already been triaged

4. **Verify User Permissions**: Check if the logged-in user has `can_triage_referrals` permission.

## Common Issues to Check

### Issue 1: Referral Not in 'waiting' Status
**Error**: "Can only make triage decisions for referrals in waiting status"
**Solution**: The referral must be transferred to triage first (status='waiting')

### Issue 2: Missing User Profile
**Error**: "You do not have permission to make triage decisions"
**Solution**: User must have a profile with `can_triage_referrals=True`

### Issue 3: Invalid Triage Decision
**Error**: "Invalid triage decision"
**Solution**: Must be one of: 'emergent', 'urgent', 'schedule_opd'

### Issue 4: Missing Schedule Info
**Error**: "Scheduled date and time are required for OPD appointments"
**Solution**: When selecting 'schedule_opd', both date and time must be provided

## Testing Checklist

- [ ] Clear browser cache and reload
- [ ] Verify dropdown shows "Emergent" option
- [ ] Select "Emergent" and check browser console for the value being sent
- [ ] Check Django terminal for the actual error message
- [ ] Verify the referral status is 'waiting' before accepting
- [ ] Verify user has triage permissions

## How to Prevent This in Future Merges

1. **Add a comment** in the code near the dropdown:
   ```tsx
   // IMPORTANT: Backend expects 'emergent', NOT 'critical'
   <option value="emergent">🚨 Emergent...</option>
   ```

2. **Create a constant** for triage decisions:
   ```tsx
   const TRIAGE_DECISIONS = {
     EMERGENT: 'emergent',
     URGENT: 'urgent',
     SCHEDULE_OPD: 'schedule_opd'
   } as const;
   ```

3. **Add validation** in the API function to catch this early.
