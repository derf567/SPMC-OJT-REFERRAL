# Referrer Profession Dropdown Update

## Summary
Changed the "Profession of the Referrer" field from a free-text input to a dropdown with predefined options.

## Changes Made

### 1. Database Model (Django)
- **File**: `SPMC/referrals/models.py`
- Updated `Referral.referrer_profession` to use choice field with options:
  - Nurse
  - Barangay Health Worker
  - Doctor
  - Others (with specify field)
- Added new field `referrer_profession_other` for custom profession when "Others" is selected

### 2. Frontend (React/TypeScript)
- **File**: `SPMC/front-end/src/pages/ExternalReferral.tsx`
- Changed text input to dropdown select
- Added conditional "Others" text field that appears when "Others" is selected
- Updated form validation to require specification when "Others" is chosen
- Updated form data interface to include `referrerProfessionOther` field

### 3. Database Migrations
- **Migration 0021**: Added `referrer_profession_other` field and converted `referrer_profession` to choice field
- **Migration 0022**: Data migration to convert existing profession values:
  - "physician", "doctor", "md" → "doctor"
  - "nurse", "rn" → "nurse"
  - "barangay health worker", "bhw" → "barangay_health_worker"
  - Any other values → "others" (with original value stored in `referrer_profession_other`)

### 4. API Serializer
- **File**: `SPMC/referrals/serializers.py`
- Added `referrer_profession_other` to serializer fields

### 5. Admin Interface
- **File**: `SPMC/referrals/admin.py`
- Added `referrer_profession_other` to admin form fields

## Dropdown Options
1. **Nurse** - For registered nurses and nursing professionals
2. **Barangay Health Worker** - For community health workers
3. **Doctor** - For physicians and medical doctors
4. **Others (Please Specify)** - For any other profession with a text field to specify

## How to Use

### For Users
1. Navigate to the External Referral form (Step 4: Referring Hospital)
2. Select the appropriate profession from the dropdown
3. If you select "Others", a text field will appear where you can specify the profession
4. The field is required and must be filled before submission

### For Developers
The form data now includes:
```typescript
{
  referrerProfession: 'nurse' | 'barangay_health_worker' | 'doctor' | 'others',
  referrerProfessionOther: string // Only used when referrerProfession is 'others'
}
```

API submission:
```json
{
  "referrer_profession": "others",
  "referrer_profession_other": "Emergency Medicine Physician"
}
```

## Testing
1. Restart Django server: `python manage.py runserver`
2. Navigate to External Referral form
3. Test each dropdown option
4. Test "Others" option with custom text
5. Verify form validation works
6. Submit a referral and verify data is saved correctly

## Database Migration Status
✅ Migration 0021: Schema changes applied
✅ Migration 0022: Data migration completed
✅ All existing referrals updated to use new format

## Notes
- Existing referrals have been automatically migrated to the new format
- The system intelligently mapped old profession values to new choices
- Any unrecognized professions were moved to "Others" category
- No data was lost during migration
