# Patient/Watcher Contact Numbers Display Fix

## Problem
Ang Patient/Watcher Contact Numbers nga gi-fill up sa referrer registration form dili visible sa:
- EDCC account view icon
- Triage account view icon  
- Referrer account view icon

Ang field naa sa `UserProfile.contact_numbers` pero wala sa `Referral` model ug wala sa ReferralView display.

## Solution Implemented

### 1. ✅ Added contact_numbers field to Referral model
- Added `contact_numbers = models.JSONField(default=list, blank=True)` sa Referral model
- Created migration file `0015_add_contact_numbers_to_referral.py`
- Ran migration successfully

### 2. ✅ Updated serializers
- Added `contact_numbers` sa ReferralListSerializer fields
- Updated ReferralCreateSerializer to handle `hospital_contact_numbers` from frontend
- Maps `hospital_contact_numbers` to `contact_numbers` field

### 3. ✅ Updated ReferralView.tsx
- Added display section for Patient/Watcher Contact Numbers
- Shows all contact numbers in a list format
- Only displays if contact_numbers array has values

### 4. ✅ Migration Applied
- Migration successfully applied to database
- Field is now available in the Referral table

## Testing
To test the fix:
1. Login as referrer account
2. Create a new referral
3. View the referral using the view icon
4. Contact numbers should now be visible in the Patient Information section

## Files Modified
1. ✅ `SPMC/referrals/models.py` - Added contact_numbers field
2. ✅ `SPMC/referrals/serializers.py` - Updated serializers to include and map contact_numbers
3. ✅ `SPMC/front-end/src/pages/ReferralView.tsx` - Added display for contact numbers
4. ✅ `SPMC/referrals/migrations/0015_add_contact_numbers_to_referral.py` - Created migration

## Notes
- Ang contact_numbers gi-store as JSON array para multiple numbers
- Ang frontend nag-send og `hospital_contact_numbers` pero gi-map nato to `contact_numbers` sa backend
- Ang display naa sa Patient Information section, visible sa tanan nga roles (EDCC, Triage, Referrer)
