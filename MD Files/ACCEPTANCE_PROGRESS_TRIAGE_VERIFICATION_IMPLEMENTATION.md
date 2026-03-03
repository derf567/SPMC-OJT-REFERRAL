# Acceptance Progress - Triage Verification Workflow Implementation

## Summary
Successfully implemented the revised acceptance progress workflow for triage/EDCC accounts. The system now requires triage/EDCC verification before referrers are notified to fill the transit form.

## Changes Made

### 1. Backend Changes

#### Models (SPMC/referrals/models.py)
- **Added new status**: `'awaiting_triage_verification'` to STATUS_CHOICES
- **Added new fields to Referral model**:
  - `triage_verified_by`: ForeignKey to User (triage/EDCC personnel who verified)
  - `triage_verified_at`: DateTimeField (when verification occurred)
  - `triage_verification_notes`: TextField (verification notes)

#### Views (SPMC/referrals/views.py)
- **Updated `check_department_acceptance()` method**:
  - When majority of departments accept, status now changes to `'awaiting_triage_verification'` instead of `'dispositioned'`
  
- **Added new endpoint**: `approve_for_transit` (POST)
  - Only accessible to triage/EDCC personnel (role check)
  - Changes status from `'awaiting_triage_verification'` to `'dispositioned'`
  - Records who approved and when
  - Accepts optional verification notes
  - Creates status history entry
  - Returns confirmation with triage verification details

#### Serializers (SPMC/referrals/serializers.py)
- **Updated ReferralSerializer**:
  - Added `triage_verified_by_name` (read-only, derived from user)
  - Added `triage_verified_at` field
  - Added `triage_verification_notes` field

#### Migrations (SPMC/referrals/migrations/0024_add_triage_verification_workflow.py)
- Created migration for new fields and status choice

### 2. Frontend Changes

#### API (SPMC/front-end/src/lib/api.ts)
- **Added new method**: `approveForTransit(id, verificationNotes)`
  - Calls the new backend endpoint
  - Accepts optional verification notes

#### TriageReferrals Page (SPMC/front-end/src/pages/TriageReferrals.tsx)
- **Updated status badge display**:
  - Added `'awaiting_triage_verification'` with orange styling
  
- **Added new state**:
  - `showApproveForTransitDialog` state
  
- **Added new handler**:
  - `handleApproveForTransit()` function
  
- **Updated status filter dropdown**:
  - Added `'awaiting_triage_verification'` option
  
- **Updated action buttons**:
  - When status is `'awaiting_triage_verification'`:
    - Shows "View Status" button (to see department acceptances)
    - Shows "Approve for Transit" button (to approve and move to dispositioned)
  
- **Added new dialog component**: `ApproveForTransitDialog`
  - Displays referral details
  - Shows department acceptance summary (total, accepted, rejected, pending)
  - Lists all departments that accepted
  - Allows triage/EDCC to add verification notes
  - Confirm button to approve for transit
  - On success, refreshes referral list and closes dialog

## Workflow Flow

### Before (Old Workflow)
```
Departments Accept (Majority)
    ↓
Status → 'dispositioned'
    ↓
Referrer automatically notified to fill transit form
    ↓
Referrer fills transit form
    ↓
Status → 'in_transit'
```

### After (New Workflow)
```
Departments Accept (Majority)
    ↓
Status → 'awaiting_triage_verification'
    ↓
Triage/EDCC receives notification
    ↓
Triage/EDCC calls accepting department to verify
    ↓
Triage/EDCC clicks "Approve for Transit" button
    ↓
Status → 'dispositioned'
    ↓
Referrer notified to fill transit form
    ↓
Referrer fills transit form
    ↓
Status → 'in_transit'
```

## UI Changes

### TriageReferrals Page
1. **Status Filter**: Added "Awaiting Verification" option
2. **Status Badge**: Orange badge for "Awaiting Verification" status
3. **Action Buttons**: 
   - "View Status" - to see department acceptances
   - "Approve for Transit" - to approve and move to dispositioned

### New Dialog: Approve for Transit
- Shows referral and patient information
- Displays department acceptance summary with counts
- Lists all departments that accepted
- Optional verification notes field
- Approve button to confirm

## Key Features

1. **Role-Based Access**: Only triage/EDCC personnel can approve referrals for transit
2. **Verification Tracking**: Records who verified and when
3. **Notes Capability**: Allows triage/EDCC to add verification notes
4. **Status History**: Creates status history entry for audit trail
5. **Real-Time Updates**: Dialog auto-refreshes to show latest acceptance status

## Testing Checklist

- [ ] Create a referral and assign to multiple departments
- [ ] Have departments accept the referral
- [ ] Verify referral status changes to "awaiting_triage_verification"
- [ ] Verify triage/EDCC can see "Approve for Transit" button
- [ ] Click "Approve for Transit" and add verification notes
- [ ] Verify status changes to "dispositioned"
- [ ] Verify referrer is notified to fill transit form
- [ ] Verify status history shows the verification action
- [ ] Test that non-triage/EDCC users cannot approve

## Files Modified

1. `SPMC/referrals/models.py` - Added new status and fields
2. `SPMC/referrals/views.py` - Added new endpoint and updated logic
3. `SPMC/referrals/serializers.py` - Added new fields to serializer
4. `SPMC/referrals/migrations/0024_add_triage_verification_workflow.py` - New migration
5. `SPMC/front-end/src/lib/api.ts` - Added new API method
6. `SPMC/front-end/src/pages/TriageReferrals.tsx` - Updated UI and added dialog

## Next Steps

1. Run migrations: `python manage.py migrate`
2. Test the complete workflow
3. Update notification system to notify referrer when triage approves (if not already implemented)
4. Consider adding email/SMS notifications for triage/EDCC when referral is ready for verification
