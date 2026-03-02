# Doctor Accept/Reject Feature - Implementation Complete

## Status: ✅ COMPLETE

## Overview
Doctors can now accept or reject referrals assigned to their department through the Doctor Dashboard.

## Implementation Details

### Frontend (DoctorDashboard.tsx)

#### 1. Accept/Reject Buttons
- Buttons appear only when `canMakeDecision()` returns true
- Conditions checked:
  - Referral status must be `waiting_acceptance`
  - Doctor's department must have a pending acceptance record
  - Department acceptance status must be `pending`

#### 2. Decision Dialog
The dialog includes:
- **Patient Information**: Name, age, gender, chief complaint
- **Decision Type**: Accept or Reject (shown in title and button)
- **Notes Field**: 
  - Optional for Accept
  - Required for Reject (validation enforced)
- **Action Buttons**:
  - Cancel: Closes dialog without action
  - Submit: Sends decision to backend
- **Loading State**: Shows spinner during submission

#### 3. Visual Indicators
- **Acceptance Status Badges**:
  - ✓ Accepted (green)
  - ✗ Rejected (red)
  - ⏱ Pending (yellow)
- **Triage Decision Badges**:
  - 🚨 Emergent (red)
  - ⚡ Urgent (orange)
- **Triage Remarks**: Displayed in blue box

#### 4. Functions Implemented

```typescript
// Check if doctor can make decision on referral
canMakeDecision(referral: any): boolean

// Get department acceptance status for doctor's department
getDepartmentAcceptanceStatus(referral: any): DepartmentAcceptance | null

// Open decision dialog
handleDecision(referral: any, decisionType: 'accept' | 'reject'): void

// Submit decision to backend
submitDecision(): Promise<void>
```

### Backend (views.py)

#### department_decision Endpoint
- **URL**: `POST /api/referrals/{id}/department_decision/`
- **Parameters**:
  - `department_code`: Department making the decision
  - `decision`: 'accept' or 'reject'
  - `notes`: Optional notes (required for reject)

#### Logic Flow:
1. Validates department_code and decision
2. Finds DepartmentAcceptance record
3. Calls `acceptance.accept(user)` or `acceptance.reject(user, notes)`
4. Checks majority rule automatically
5. Updates referral status if majority reached
6. Returns acceptance summary and referral status

### API Integration (api.ts)

```typescript
departmentDecision: async (
  id: string, 
  departmentCode: string, 
  decision: 'accept' | 'reject', 
  notes?: string
) => {
  return apiRequest(`/referrals/${id}/department_decision/`, {
    method: 'POST',
    body: JSON.stringify({ 
      department_code: departmentCode, 
      decision, 
      notes: notes || '' 
    }),
  });
}
```

## User Flow

### For Doctors:

1. **View Referrals**
   - Doctor logs in and sees referrals assigned to their department
   - Referrals show status badges and triage information

2. **Make Decision**
   - If referral is pending acceptance, Accept/Reject buttons appear
   - Click Accept or Reject button
   - Dialog opens with referral details

3. **Provide Notes**
   - For Accept: Notes are optional
   - For Reject: Notes are required (reason for rejection)

4. **Submit Decision**
   - Click Submit button
   - System validates and sends to backend
   - Success toast appears
   - Referral list refreshes automatically
   - Status badge updates to show decision

5. **Majority Rule**
   - Backend automatically checks if majority reached
   - If 2/3 or 3/5 departments accept, referral proceeds to "Dispositioned"
   - If majority reject, referral status updates accordingly

## Testing Checklist

- [x] Accept button appears for pending referrals
- [x] Reject button appears for pending referrals
- [x] Dialog opens with correct referral information
- [x] Accept without notes works
- [x] Reject requires notes (validation)
- [x] Submit button disabled during submission
- [x] Success toast appears after submission
- [x] Referral list refreshes after decision
- [x] Status badge updates correctly
- [x] Majority rule triggers status change
- [x] Only doctors from assigned departments can decide
- [x] Cannot decide on already accepted/rejected referrals

## Files Modified

### Frontend:
- `SPMC/front-end/src/pages/DoctorDashboard.tsx` - Complete implementation with dialog

### Backend:
- `SPMC/referrals/views.py` - department_decision endpoint (already existed)
- `SPMC/referrals/models.py` - DepartmentAcceptance model with accept/reject methods

### API:
- `SPMC/front-end/src/lib/api.ts` - departmentDecision function

## Notes

- The implementation follows the same pattern as the Triage page dialogs
- Proper error handling and validation in place
- User feedback through toast notifications
- Automatic refresh ensures data consistency
- Permission checks prevent unauthorized actions
- Majority rule logic handled automatically by backend

## Next Steps

The feature is complete and ready for testing. No additional work needed.
