# Redirect Button for All Rejected Departments

## Feature Overview
When a referral is in "waiting_acceptance" status and all assigned departments reject it, a "Redirect" button now appears to allow triage personnel to reassign the referral to different departments.

## Implementation Details

### When Redirect Button Appears
The "Redirect" button appears in two places when all departments have rejected a referral:

1. **Main Triage Table** - In the Actions column for referrals with status "waiting_acceptance"
2. **Details Dialog** - When viewing department acceptance status

### Condition for Display
```typescript
referral.acceptance_summary.rejected >= referral.acceptance_summary.majority_needed
```

This means the button appears when the number of rejections meets or exceeds the majority threshold needed for rejection.

### What Happens When Clicked

#### From Main Table
- Clicking "Redirect" opens the "Assign Departments" dialog
- Allows triage personnel to select different departments
- Can choose a new triage decision (Emergent/Urgent/Schedule OPD)
- Can add remarks for the reassignment

#### From Details Dialog
- Clicking "Redirect to Assign Departments" closes the details dialog
- Automatically opens the "Assign Departments" dialog
- Same workflow as above

### User Flow

1. **Initial Assignment** - Triage personnel assign departments to a referral
2. **Waiting for Acceptance** - Referral status changes to "waiting_acceptance"
3. **All Departments Reject** - If all departments reject the referral
4. **Redirect Option** - "Redirect" button becomes available
5. **Reassign** - Triage personnel can reassign to different departments
6. **New Cycle** - Referral goes back to "waiting_acceptance" with new departments

## UI Changes

### Main Table
- Added conditional rendering of "Redirect" button
- Button appears next to "View Status" button when all departments rejected
- Orange color (#f97316) to indicate action needed

### Details Dialog
- Added "Redirect to Assign Departments" button
- Appears in the footer when all departments have rejected
- Positioned before the "Close" button

## Code Changes

### TriageReferrals.tsx
1. Updated main table to show "Redirect" button when all departments rejected
2. Updated DetailsDialog component signature to accept `onRedirect` callback
3. Updated DetailsDialog rendering to pass the redirect handler
4. Added logic to open assign departments dialog when redirect is clicked

## Testing

To verify the feature:

1. Create a referral and assign it to 2 departments
2. Have both departments reject the referral
3. Verify "Redirect" button appears in the table
4. Click "View Status" to open details dialog
5. Verify "Redirect to Assign Departments" button appears
6. Click redirect button
7. Verify assign departments dialog opens
8. Select new departments and reassign
9. Verify referral goes back to "waiting_acceptance" status

## Benefits

- **Better UX** - Clear path to handle rejected referrals
- **Efficient Workflow** - No need to manually navigate back to assign departments
- **Visual Feedback** - Orange button indicates action needed
- **Flexible** - Can reassign to completely different departments or retry with same ones
