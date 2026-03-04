# Hospital Barangay Field - Testing Guide

## Quick Test Steps

### 1. Submit a Referral with Barangay
1. Go to the referral form (External Referral page)
2. Fill in the hospital information
3. In the "Barangay" field, enter a barangay name (e.g., "Bajada", "Poblacion")
4. Submit the referral

### 2. Verify in Django Admin
1. Go to Django admin: `http://127.0.0.1:8000/admin/`
2. Navigate to Referrals
3. Find the referral you just submitted
4. Check the "Hospital Barangay" field - it should contain the value you entered

### 3. Check Console Logs
When you submit the referral, you should see debug output in the Django console:

```
Creating referral with data:
  hospital_region: Davao Region
  hospital_province: Davao del Sur
  hospital_city: Davao City
  hospital_barangay: Bajada
  hospital_street: J.P. Laurel Avenue
  hospital_district: Bajada
  hospital_doh_level: Secondary
Created/found hospital: SPMC (ID: 1)
Referral created with ID: 123
  Saved hospital_barangay: Bajada
  Saved hospital_street: J.P. Laurel Avenue
```

### 4. Verify via API
Make a GET request to retrieve the referral:
```
GET /api/referrals/{referral_id}/
```

Response should include:
```json
{
  "id": 123,
  "referral_id": "REF-2024-001",
  "hospital_barangay": "Bajada",
  "hospital_street": "J.P. Laurel Avenue",
  ...
}
```

## What Was Fixed

- ✅ Explicit field definitions added to serializers
- ✅ Hospital address fields now properly validated
- ✅ Barangay field (optional) now stores correctly
- ✅ Debug logging added for verification
- ✅ Both Create and Update serializers updated

## Expected Behavior

| Scenario | Expected Result |
|----------|-----------------|
| Submit with barangay | ✅ Barangay stored in database |
| Submit without barangay | ✅ Field remains empty/null (optional) |
| Update referral with barangay | ✅ Barangay updated in database |
| Auto-filled from hospital | ✅ Barangay pre-populated and read-only |

## Troubleshooting

If barangay is still not saving:

1. **Check browser console** for any validation errors
2. **Check Django console** for debug output
3. **Verify the field is being sent** in the API request (use Network tab in DevTools)
4. **Check database directly**:
   ```sql
   SELECT id, referral_id, hospital_barangay FROM referrals_referral WHERE id = {referral_id};
   ```

## Related Fields

The fix also ensures these hospital address fields work correctly:
- `hospital_region`
- `hospital_province`
- `hospital_city`
- `hospital_barangay` ← Main fix
- `hospital_street`
- `hospital_district`
- `hospital_doh_level`
