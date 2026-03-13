# Call & Endorse - Triage Assignment Fix

## Problem
EDCC/Triage personnel were getting a 400 error when trying to assign departments using the "Call & Endorse" button:
- Error: "Referral must be in triage to assign departments"
- Additional error: `toast is not defined` (ReferenceError)

## Root Cause
1. The backend requires referrals to be transferred to triage (`in_triage = True`) before departments can be assigned
2. The "Call & Endorse" button was directly opening the assign departments dialog without first transferring the referral to triage
3. The `AssignDepartmentsDialogForReferralTable` component was using `toast.error()` and `toast.success()` without importing the `useToast` hook

## Solution

### 1. Auto-Transfer to Triage
Modified the "Call & Endorse" button click handler to automatically transfer the referral to triage before opening the assign departments dialog:

```typescript
onClick={async () => {
  // First, transfer to triage if not already in triage
  try {
    await referralsAPI.transferToTriageTab(referral.id || referral.referral_id);
    // Then open the assign departments dialog
    setSelectedReferralForAssign(referral);
    setShowAssignDepartmentsDialog(true);
  } catch (error: any) {
    console.error('Error transferring to triage:', error);
    toast({
      title: "Transfer Error",
      description: error.message || 'Failed to transfer referral to triage',
      variant: "destructive",
    });
  }
}}
```

### 2. Fixed Toast Errors
Added `useToast` hook to the `AssignDepartmentsDialogForReferralTable` component and replaced all `toast.error()` and `toast.success()` calls with the proper `toast()` function format:

```typescript
const { toast } = useToast();

// Changed from:
toast.error('Error message');
toast.success('Success message');

// To:
toast({
  title: "Error Title",
  description: 'Error message',
  variant: "destructive",
});

toast({
  title: "Success",
  description: 'Success message',
  className: "bg-green-50 border-green-200 text-green-800",
});
```

## Workflow
The updated workflow now works as follows:

1. EDCC personnel clicks "Call & Endorse" button on a referral
2. System automatically transfers the referral to triage (sets `in_triage = True`, status = 'in_triage')
3. Assign departments dialog opens
4. EDCC personnel selects departments, main service, and triage decision
5. Departments are successfully assigned

## Files Modified
- `SPMC/front-end/src/components/dashboard/ReferralTable.tsx`

## Testing
Test the fix by:
1. Login as EDCC/Triage personnel
2. Navigate to Active Referrals tab
3. Click "Call & Endorse" button on any referral
4. Verify the assign departments dialog opens without errors
5. Select departments and submit
6. Verify success message appears and referral is updated
