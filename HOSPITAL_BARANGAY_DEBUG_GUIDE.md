# Hospital Barangay Field - Debug Guide

## Issue
Hospital barangay field is empty in the referral form even though it was entered during hospital registration.

## Root Cause Analysis

The barangay should be populated from the user's profile during form initialization, but it's showing as empty. This could be due to:

1. **Barangay not saved during registration** - The registration didn't save the barangay value
2. **Barangay not returned in user profile** - The authentication endpoint isn't returning the barangay
3. **Barangay not loaded into form state** - The form initialization isn't setting the barangay value

## Step-by-Step Debugging

### Step 1: Check Browser Console
When you load the referral form, check the browser console (F12 → Console tab) for these debug messages:

```
🏥 Hospital Barangay Debug:
  user.hospital_barangay: [VALUE]
  newFormData.hospitalBarangay: [VALUE]
  user.hospital_name: [VALUE]
```

**What to look for:**
- If `user.hospital_barangay` is `null` or `undefined` → Problem is in authentication
- If `user.hospital_barangay` has a value but `newFormData.hospitalBarangay` is empty → Problem is in form initialization
- If both have values → Problem is in form rendering

### Step 2: Check Django Admin
1. Go to Django admin: `http://127.0.0.1:8000/admin/`
2. Navigate to Users → User Profiles
3. Find your hospital account user
4. Check the "Hospital Barangay" field

**What to look for:**
- If empty → Barangay wasn't saved during registration
- If has value → Barangay was saved, but not being returned by API

### Step 3: Check API Response
Make a GET request to the profile endpoint:

```bash
curl -H "Authorization: Token YOUR_TOKEN" \
  http://127.0.0.1:8000/api/auth/profile/
```

Look for `hospital_barangay` in the response:

```json
{
  "user": {
    "hospital_barangay": "Bajada",
    ...
  }
}
```

**What to look for:**
- If `hospital_barangay` is missing or null → API isn't returning it
- If it has a value → API is working, problem is in frontend

### Step 4: Check Registration Data
When you registered the hospital, check if the barangay was actually submitted:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Register a hospital with a barangay value
4. Find the registration request (POST to `/api/auth/register-comprehensive/`)
5. Check the request payload for `barangay` field

**What to look for:**
- If `barangay` is in the payload → Frontend is sending it
- If `barangay` is missing → Frontend registration form isn't including it

## Common Issues & Solutions

### Issue 1: Barangay is null in user object
**Cause:** The authentication endpoint isn't returning the barangay field

**Solution:**
1. Check `SPMC/referrals/authentication.py` line 66
2. Verify `hospital_barangay` is included in the response
3. Restart Django server

### Issue 2: Barangay is empty in database
**Cause:** The registration endpoint isn't saving the barangay

**Solution:**
1. Check `SPMC/referrals/authentication.py` line 232
2. Verify `hospital_barangay=data.get('barangay', '')` is correct
3. Check that the registration form is sending `barangay` field

### Issue 3: Barangay shows in database but not in form
**Cause:** The form initialization isn't loading the barangay

**Solution:**
1. Check browser console for debug messages
2. Verify `user.hospital_barangay` has a value
3. Check that `hospitalBarangay` is being set in `setFormData`

## Quick Test

### Test 1: Direct Database Check
```sql
SELECT id, username, hospital_barangay FROM referrals_userprofile 
WHERE hospital_name = 'San Pendro Hospital';
```

### Test 2: API Check
```bash
# Login first
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'

# Then check profile
curl -H "Authorization: Token YOUR_TOKEN" \
  http://127.0.0.1:8000/api/auth/profile/ | jq '.user.hospital_barangay'
```

### Test 3: Form State Check
In browser console, after the form loads:
```javascript
// Check if barangay is in form state
console.log(document.querySelector('input[placeholder*="Bajada"]')?.value);
```

## Files to Check

1. **Frontend:**
   - `SPMC/front-end/src/pages/ExternalReferral.tsx` - Form initialization (line 200-240)
   - `SPMC/front-end/src/contexts/AuthContext.tsx` - User type definition (line 30)

2. **Backend:**
   - `SPMC/referrals/authentication.py` - Login response (line 66) and registration (line 232)
   - `SPMC/referrals/models.py` - UserProfile model (line 33)

## Expected Flow

```
1. Hospital Registration
   ↓
   Form sends: barangay = "Bajada"
   ↓
2. Backend Registration
   ↓
   Saves: UserProfile.hospital_barangay = "Bajada"
   ↓
3. User Login
   ↓
   API returns: hospital_barangay: "Bajada"
   ↓
4. Form Initialization
   ↓
   Sets: formData.hospitalBarangay = "Bajada"
   ↓
5. Form Display
   ↓
   Shows: <input value="Bajada" readOnly />
```

## Next Steps

1. Check browser console for debug messages
2. Verify barangay exists in database
3. Verify API is returning barangay
4. If all above are OK, the issue is in form rendering

Once you identify which step is failing, we can fix it!
