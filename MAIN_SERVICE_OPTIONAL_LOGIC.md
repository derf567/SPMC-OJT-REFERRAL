# Main Service Optional Logic - Updated Implementation

## Corrected Business Logic

Based on your clarification, the logic is now:

### Department Selection
- **Selected departments WITH main service designation** = 1 Main Service + N Co-Manage
- **Selected departments WITHOUT main service designation** = All are Co-Manage (majority rule applies)

### Examples

**Example 1: 4 departments selected, 1 as main service**
- Anesthesiology (Main Service) - Final decision authority
- Cardiology (Co-Manage) - Supporting
- Emergency Department (Co-Manage) - Supporting
- Internal Medicine (Co-Manage) - Supporting

**Example 2: 4 departments selected, NO main service**
- Anesthesiology (Co-Manage) - Majority rule applies
- Cardiology (Co-Manage) - Majority rule applies
- Emergency Department (Co-Manage) - Majority rule applies
- Internal Medicine (Co-Manage) - Majority rule applies

## Changes Made

### Frontend (TriageReferrals.tsx)

1. **Main Service Selection is Now Optional**
   - Removed required validation for main service
   - Users can now submit without selecting a main service
   - All selected departments become co-manage if no main service selected

2. **Updated UI Labels**
   - Changed from "Select Main Service *" to "Select Main Service (optional)"
   - Added helper text: "(if not selected, all are co-manage)"
   - Shows confirmation when main service is selected
   - Shows message when no main service selected

3. **Department Status Display**
   - Separated main service and co-manage departments in the details view
   - Main service departments shown in purple section
   - Co-manage departments shown in blue section
   - Clear badges indicating role of each department

### Backend (views.py)

1. **Main Service Code is Optional**
   - Removed validation requiring main service selection
   - Accepts `main_service_code: null` or `main_service_code: undefined`
   - Validates only if provided (must be in selected departments)

### Business Logic (models.py)

**Already Correct** - The `check_department_acceptance()` method already handles both cases:

1. **If main service exists**: Uses main service decision logic
   - Main service accepts → Referral accepted
   - Main service rejects → Referral rejected
   - Main service pending → Wait for main service

2. **If NO main service (all co-manage)**: Uses majority rule
   - Majority accepts → Referral accepted
   - Majority rejects → Referral rejected
   - Pending → Wait for more responses

## User Interface Flow

### Assign Departments Dialog

1. **Step 1**: Select departments (checkboxes)
   - Can select multiple departments
   - Shows count: "4 department(s) selected"

2. **Step 2**: Select Main Service (optional radio buttons)
   - Only shows if departments selected
   - Can leave empty (all become co-manage)
   - Shows helper text about co-manage if not selected

3. **Step 3**: Select Triage Decision
   - Emergent / Urgent / Schedule OPD

4. **Step 4**: Add remarks and schedule if needed

### Department Status View

**Main Service Section** (if any main service exists)
- Purple background
- "Main Service" badge
- Shows final decision authority

**Co-Manage Section** (if any co-manage exists)
- White background
- "Co-Manage" badge
- Shows supporting role

## Files Modified

1. **SPMC/front-end/src/pages/TriageReferrals.tsx**
   - Made main service selection optional
   - Updated UI labels and helper text
   - Separated main service and co-manage display

2. **SPMC/referrals/views.py**
   - Removed required validation for main service
   - Made main_service_code optional parameter

3. **SPMC/referrals/models.py**
   - No changes needed (already handles both cases)

## Testing Scenarios

- [ ] Select 4 departments, designate 1 as main service
  - Expected: 1 main service + 3 co-manage
  
- [ ] Select 4 departments, don't designate any as main service
  - Expected: All 4 are co-manage, majority rule applies
  
- [ ] Main service accepts
  - Expected: Referral moves to awaiting_triage_verification
  
- [ ] Main service rejects
  - Expected: Referral stays pending
  
- [ ] All co-manage, majority accepts
  - Expected: Referral moves to awaiting_triage_verification
  
- [ ] All co-manage, majority rejects
  - Expected: Referral stays pending

## Summary

The system now correctly implements:
- **Optional main service selection** - Users can choose to have a main service or not
- **Flexible department roles** - Departments can be main service or co-manage
- **Dual decision logic** - Main service logic when main service exists, majority rule when all are co-manage
- **Clear UI indication** - Users see which departments are main service vs co-manage
