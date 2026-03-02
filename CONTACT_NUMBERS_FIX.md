# Contact Numbers and Address Fields Registration Fix

## Problem
When registering a hospital account:
1. Multiple contact numbers (e.g., 09917222460 and 0823456789) - only one number was being saved
2. Address fields (Region, Province, City, Barangay) - were empty in the backend even though they were filled in the registration form

## Root Causes

### Contact Numbers Issue
The registration form was falling back to the simple `register_view` endpoint instead of using the comprehensive registration endpoint. This happened because:

1. The comprehensive registration endpoint (`comprehensive_register_view`) requires `first_name` and `last_name` fields
2. The hospital registration form wasn't sending these required fields
3. When validation failed, the code silently fell back to the simple registration
4. The simple registration only saves the first contact number to the `cellphone` field (CharField)
5. The multiple contact numbers were never saved to the `contact_numbers` field (JSONField)

### Address Fields Issue
The address fields (region, province, city, barangay) were being sent as CODES (e.g., "110000000") instead of NAMES (e.g., "Region XI (Davao Region)"). The backend expects the human-readable names, not the PSGC codes.

## Solution

### Frontend Changes (Register.tsx)
- Added `first_name` and `last_name` fields derived from hospital name
- Added `referrer_type` field set to 'hospital_account'
- Added `address` field mapping for hospital_location
- Fixed address fields to send NAMES instead of CODES by using `selectedRegion?.name` etc.
- Changed fallback from codes to empty strings if names not found
- Added debug logging to track what data is being sent
- Removed the silent fallback to simple registration

### Backend Changes (authentication.py)
- Fixed `is_inside_davao_city` field handling to properly parse string boolean values
- Backend already correctly handles all address fields

### Admin Changes (admin.py)
- Updated `UserProfileAdmin` to display `contact_numbers` instead of `contact_number`
- Added `display_contact_numbers()` method to show all contact numbers as comma-separated list
- Updated `UserProfileInline` to show contact numbers in the user admin interface

## How It Works Now

1. User fills out hospital registration form with:
   - Multiple contact numbers
   - Region, Province, City, Barangay selections

2. Frontend sends FormData to `/api/auth/register-comprehensive/` with:
   - `first_name`: First word of hospital name
   - `last_name`: Remaining words of hospital name
   - `referrer_type`: 'hospital_account'
   - `contact_numbers`: JSON array of all contact numbers
   - `region`: "Region XI (Davao Region)" (NAME, not code)
   - `province`: "Davao del Sur" (NAME, not code)
   - `city`: "City of Davao" (NAME, not code)
   - `barangay`: Barangay name (NAME, not code)
   - All other hospital information

3. Backend `comprehensive_register_view` creates:
   - User account
   - UserProfile with:
     - `contact_numbers` JSONField containing all numbers
     - `hospital_region`, `hospital_province`, `hospital_city`, `hospital_barangay` with proper names
   - ReferrerAccount with full details

4. Django admin now displays:
   - All contact numbers properly
   - All address fields with proper values

## Testing

To verify the fix works:

1. Register a new hospital account with:
   - 2+ contact numbers
   - Region: Region XI (Davao Region)
   - Province: Davao del Sur
   - City: City of Davao
   - Barangay: (any barangay)

2. Check Django admin at `/admin/auth/user/`
3. Click on the newly created user
4. Verify that:
   - "Contact Numbers (from registration)" shows all numbers
   - "Hospital region" shows "Region XI (Davao Region)"
   - "Hospital province" shows "Davao del Sur"
   - "Hospital city" shows "City of Davao"
   - "Hospital barangay" shows the selected barangay

You can also run the test script:
```bash
cd SPMC
python manage.py shell < test_contact_numbers.py
```

## Files Modified

1. `SPMC/front-end/src/pages/Register.tsx` - Fixed form data submission for contact numbers and address fields
2. `SPMC/referrals/authentication.py` - Fixed is_inside_davao_city handling
3. `SPMC/referrals/admin.py` - Updated admin display for contact numbers
4. `SPMC/test_contact_numbers.py` - Created test script to verify data

## Database Fields

### Contact Numbers
- `UserProfile.cellphone` (CharField) - Old single contact number field (kept for backward compatibility)
- `UserProfile.contact_numbers` (JSONField) - New field that stores array of all contact numbers
- Both fields are populated, but `contact_numbers` is the authoritative source for multiple numbers

### Address Fields
- `UserProfile.hospital_region` (CharField) - Stores region name (e.g., "Region XI (Davao Region)")
- `UserProfile.hospital_province` (CharField) - Stores province name (e.g., "Davao del Sur")
- `UserProfile.hospital_city` (CharField) - Stores city name (e.g., "City of Davao")
- `UserProfile.hospital_barangay` (CharField) - Stores barangay name
- `UserProfile.hospital_street` (TextField) - Stores complete address (street, building, district)
