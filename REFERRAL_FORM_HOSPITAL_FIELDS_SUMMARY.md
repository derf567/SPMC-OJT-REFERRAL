# Referral Form Hospital Fields Update Summary

## Overview
Added comprehensive hospital information fields to the referral submission forms (ExternalReferral.tsx) including hospital name, DOH level, location, and multiple contact numbers.

## Features Added to Referral Forms

### 1. Hospital Name
- Already exists in the form (referring facility dropdown)
- Maintained existing functionality

### 2. DOH Level
- New dropdown field with three options:
  - Primary
  - Secondary  
  - Tertiary
- Required field with validation

### 3. Hospital Location (Mindanao)
- Comprehensive dropdown covering all Mindanao regions:
  - **Region IX (Zamboanga Peninsula)**: Zamboanga City, Zamboanga del Norte, Zamboanga del Sur, Zamboanga Sibugay
  - **Region X (Northern Mindanao)**: Cagayan de Oro City, Bukidnon, Camiguin, Lanao del Norte, Misamis Occidental, Misamis Oriental
  - **Region XI (Davao Region)**: Davao City, Davao de Oro, Davao del Norte, Davao del Sur, Davao Occidental, Davao Oriental
  - **Region XII (SOCCSKSARGEN)**: General Santos City, Cotabato City, North Cotabato, Sarangani, South Cotabato, Sultan Kudarat
  - **Region XIII (Caraga)**: Butuan City, Agusan del Norte, Agusan del Sur, Surigao del Norte, Surigao del Sur, Dinagat Islands
  - **BARMM (Bangsamoro)**: Basilan, Lanao del Sur, Maguindanao, Sulu, Tawi-Tawi
- Required field with validation

### 4. Hospital Contact Numbers
- Dynamic input field to add multiple contact numbers
- Add button to append numbers to the list
- Press Enter key to quickly add numbers
- Display added numbers as removable badges
- Validation requires at least one contact number
- Supports hotlines, phone numbers, etc.

## Backend Changes

### Models (models.py)

#### Referral Model
- Added `hospital_doh_level` field (CharField)
- Added `hospital_location` field (CharField)
- Added `hospital_contact_numbers` JSONField for list of contact numbers

#### ReferrerAccount Model (Maintained)
- Kept `hospital_name` field
- Kept `hospital_doh_level` field
- Kept `hospital_location` field
- Kept `contact_numbers` JSONField

#### ReferringHospital Model (Maintained)
- Kept `doh_level` field with choices
- Kept `location` field
- Kept `contact_numbers` JSONField

### Database Migrations
- Created migration: `0020_remove_referreraccount_contact_numbers_and_more.py` (added Referral fields)
- Created migration: `0021_referreraccount_contact_numbers_and_more.py` (restored ReferrerAccount and ReferringHospital fields)
- Successfully applied both migrations

## Frontend Changes (ExternalReferral.tsx)

### Form Interface
- Added `hospitalDohLevel` field to ReferralFormData interface
- Updated `hospitalLocation` field (already existed, now with Mindanao dropdown)
- Added `hospitalContactNumbers` array field to ReferralFormData interface

### Form State
- Added `currentContactNumber` state for input management

### UI Components (Step 4 - Referring Hospital)
- Hospital Name dropdown (existing, maintained)
- New DOH Level dropdown (Primary/Secondary/Tertiary)
- Updated Hospital Location dropdown with all Mindanao regions grouped by region
- New Hospital Contact Numbers input with Add button
- Contact numbers display as removable badges
- Validation messages for required fields

### Validation
- Hospital name required (existing)
- DOH level required (new)
- Hospital location required (existing, now enforced)
- At least one hospital contact number required (new)
- Referrer information required (existing)

### Form Submission
- Hospital fields included in referral data:
  - referring_hospital (existing)
  - hospital_doh_level (new)
  - hospital_location (new)
  - hospital_contact_numbers (new)

## User Experience

### Adding Contact Numbers
1. User enters contact number in input field
2. User can either:
   - Click "Add" button
   - Press Enter key
3. Number appears as a badge below the input
4. User can remove numbers by clicking the × button on each badge
5. Validation ensures at least one number is added before submission

### Location Selection
- Organized by region with optgroups for easy navigation
- Covers all major cities and provinces in Mindanao
- Focuses on Southern Philippines healthcare facilities

## Files Modified

### Frontend
1. `SPMC-OJT-REFERRAL/SPMC/front-end/src/pages/ExternalReferral.tsx`
   - Updated ReferralFormData interface
   - Added currentContactNumber state
   - Added DOH Level dropdown
   - Added Hospital Location dropdown with Mindanao regions
   - Added Hospital Contact Numbers input with dynamic list
   - Updated validation logic

### Backend
2. `SPMC-OJT-REFERRAL/SPMC/referrals/models.py`
   - Added hospital fields to Referral model
   - Maintained hospital fields in ReferrerAccount model
   - Maintained hospital fields in ReferringHospital model

3. Database Migrations:
   - `SPMC-OJT-REFERRAL/SPMC/referrals/migrations/0020_remove_referreraccount_contact_numbers_and_more.py`
   - `SPMC-OJT-REFERRAL/SPMC/referrals/migrations/0021_referreraccount_contact_numbers_and_more.py`

## Status
✅ Backend Referral model updated with hospital fields
✅ Database migrations created and applied
✅ Frontend ExternalReferral form updated
✅ Validation implemented for all new fields
✅ Contact numbers dynamic input working
✅ All Mindanao regions covered in location dropdown
✅ No diagnostics errors

## Notes
- The hospital information is now captured at TWO levels:
  1. **Registration** (ReferrerAccount): User's default hospital information
  2. **Referral Submission** (Referral): Specific hospital information for each referral
- This allows flexibility for users who may refer from different hospitals
- The Outpatient.tsx form may need similar updates if detailed hospital information is required for outpatient referrals

## Next Steps (Optional)
- Update Outpatient.tsx with similar hospital fields if needed
- Update backend serializers to handle the new Referral fields in API responses
- Update referral detail views to display the new hospital information
