# Hospital Barangay Field - Root Cause & Fix

## Problem
Hospital barangay field was empty in Django admin even though "barangay spc" was entered during registration.

## Root Cause Found
The issue was in the hospital registration form (`Register.tsx`), not in the referral form.

### What Was Happening:

1. **When barangays load successfully** (from PSGC API):
   - Dropdown shows with barangay codes
   - `formData.barangay` contains the **code** (e.g., "123456")
   - Submit function finds the barangay object and sends `selectedBarangay.name`
   - ✅ Works correctly

2. **When barangays fail to load** (API error or no data):
   - Text input shows instead of dropdown
   - User enters barangay name manually (e.g., "barangay spc")
   - `formData.barangay` contains the **text value** (e.g., "barangay spc")
   - Submit function tries to find it in barangays array: `barangays.find(b => b.code === "barangay spc")`
   - Returns `undefined` because "barangay spc" is not a code
   - `selectedBarangay?.name` becomes `undefined`
   - Empty string is sent to backend
   - ❌ Barangay not saved

## The Fix

**File:** `SPMC/front-end/src/pages/Register.tsx` (Line 218)

**Before:**
```javascript
fd.append('barangay', selectedBarangay?.name || '');
```

**After:**
```javascript
// Handle barangay: if selectedBarangay exists (from dropdown), use its name; otherwise use the text value directly
// This handles both cases: when barangays load (dropdown with codes) and when they fail (text input with names)
fd.append('barangay', selectedBarangay?.name || formData.barangay || '');
```

### How It Works:
1. If `selectedBarangay` exists (dropdown case) → use `selectedBarangay.name`
2. If `selectedBarangay` is undefined (text input case) → use `formData.barangay` (the text value)
3. If both are empty → use empty string

## Why This Happens

The PSGC API (Philippine Standard Geographic Code) sometimes fails to load barangays for a city. When this happens:
- The form shows a text input instead of a dropdown
- Users can manually enter the barangay name
- But the submit function wasn't handling this case

## Testing the Fix

### Test Case 1: Barangays Load Successfully
1. Register hospital with City of Davao
2. Wait for barangays to load
3. Select a barangay from dropdown
4. Submit
5. ✅ Barangay should be saved

### Test Case 2: Barangays Fail to Load (Text Input)
1. Register hospital with City of Davao
2. If barangays don't load, text input appears
3. Type "barangay spc" manually
4. Submit
5. ✅ Barangay should now be saved (this was broken before)

### Verify in Django Admin
```
User Profile → Hospital Barangay field should show "barangay spc"
```

## Files Modified
- `SPMC/front-end/src/pages/Register.tsx` - Line 218

## Impact
- ✅ Barangay now saves correctly when entered as text
- ✅ Barangay still works when selected from dropdown
- ✅ No breaking changes to existing functionality
- ✅ Handles both API success and failure cases

## Related Issue
This was NOT a referral form issue. The referral form was correctly trying to display the barangay, but it was empty because it was never saved during registration.

## Next Steps
1. Clear browser cache
2. Re-register a hospital with a barangay value
3. Verify barangay appears in Django admin
4. Verify barangay pre-populates in referral form
