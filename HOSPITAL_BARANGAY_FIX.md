# Hospital Barangay Field - Storage Fix

## Problem
When registering a hospital referral with an optional barangay field, the barangay input was not being stored in the Django database even though the field was being submitted.

## Root Cause
The `ReferralCreateSerializer` was using `exclude = ['referral_id', 'created_by', 'created_at', 'updated_at']` which should include all hospital address fields, but the hospital address fields were not explicitly defined in the serializer, which could cause validation issues.

## Solution
Added explicit field definitions for all hospital address fields in the `ReferralCreateSerializer`:

```python
# Explicitly define hospital address fields to ensure they're accepted
hospital_region = serializers.CharField(required=False, allow_blank=True)
hospital_province = serializers.CharField(required=False, allow_blank=True)
hospital_city = serializers.CharField(required=False, allow_blank=True)
hospital_barangay = serializers.CharField(required=False, allow_blank=True)
hospital_street = serializers.CharField(required=False, allow_blank=True)
hospital_district = serializers.CharField(required=False, allow_blank=True)
hospital_doh_level = serializers.CharField(required=False, allow_blank=True)
```

## Changes Made

### File: `SPMC/referrals/serializers.py`

1. **Added explicit field definitions** to `ReferralCreateSerializer` for all hospital address fields
2. **Enhanced debug logging** in the `create()` method to show:
   - All hospital address fields being submitted
   - Confirmation that data was saved to the database
   - Hospital barangay value before and after save

## How It Works

1. Frontend sends `hospital_barangay` in the referral submission
2. Serializer now explicitly accepts this field (marked as optional with `allow_blank=True`)
3. The field is included in the `validated_data` passed to `Referral.objects.create()`
4. Django ORM saves the value to the `hospital_barangay` column in the database
5. Debug logs confirm the value was saved

## Testing

To verify the fix is working:

1. Submit a referral with a barangay value
2. Check the Django admin or database to confirm `hospital_barangay` is populated
3. Check the console logs for debug output showing the saved value

## Database Field
The field already exists in the model:
```python
hospital_barangay = models.CharField(max_length=200, blank=True, null=True)
```

## Frontend
The frontend form already has the barangay input field at line 1480-1494 in `ExternalReferral.tsx`:
- Field is optional (placeholder shows "Optional")
- Updates form state via `updateFormData('hospitalBarangay', e.target.value)`
- Sends to backend as `hospital_barangay` in the API payload
