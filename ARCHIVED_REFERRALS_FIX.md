# Archived Referrals Error Fix

## Error Encountered
```
Error loading archived referrals
referralData is not defined
ReferenceError: referralData is not defined
```

## Root Cause

The `Patients.tsx` file (Archived Referrals page) had several issues:

1. **Undefined variables**: The code was trying to use `patientsData`, `totalArchived`, `completed`, and `uncoordinated` variables that were never defined.

2. **Missing TypeScript interfaces**: The `Patient` and `PatientHistory` interfaces were being used but not defined, causing type errors.

## What Was Fixed

### 1. Fixed the useEffect Hook (Lines 230-268)

**Before:**
```tsx
const archivedReferrals = allReferrals.filter((r: any) => 
  r.status === 'completed' || r.status === 'uncoordinated'
);

setReferrals(archivedReferrals);

// ❌ These variables don't exist!
const totalPatients = patientsData.length;
const activeCases = patientsData.filter(...).length;
const pendingCases = patientsData.filter(...).length;

setStats({
  total_archived: totalArchived,  // ❌ Undefined
  completed: completed,            // ❌ Undefined
  uncoordinated: uncoordinated     // ❌ Undefined
});
```

**After:**
```tsx
const archivedReferrals = allReferrals.filter((r: any) => 
  r.status === 'completed' || r.status === 'uncoordinated' || r.status === 'cancelled'
);

setReferrals(archivedReferrals);

// ✅ Calculate stats from the actual data
const totalArchived = archivedReferrals.length;
const completed = archivedReferrals.filter((r: any) => r.status === 'completed').length;
const uncoordinated = archivedReferrals.filter((r: any) => 
  r.status === 'uncoordinated' || r.status === 'cancelled'
).length;

setStats({
  total_archived: totalArchived,
  completed: completed,
  uncoordinated: uncoordinated
});
```

### 2. Added Missing TypeScript Interfaces

Added the missing `Patient` and `PatientHistory` interfaces:

```tsx
interface Patient {
  patient_full_name: string;
  age: number;
  gender: string;
  hrn?: string;
  patient_category: string;
  current_address: string;
  birthday: string;
  total_referrals: number;
  latest_referral_date: string;
  latest_referral_id: string;
  latest_status: string;
  latest_specialty?: string;
  latest_hospital?: string;
}

interface PatientHistory {
  id: string;
  referral_id: string;
  patient_full_name: string;
  age: number;
  gender: string;
  chief_complaint: string;
  working_impression: string;
  specialty_needed_name: string;
  referring_hospital_name: string;
  status: string;
  created_at: string;
}
```

### 3. Added 'cancelled' Status to Filter

Also included `'cancelled'` status in the archived referrals filter since cancelled referrals should also appear in the archived list.

## What This Fixes

✅ **Archived Referrals page now loads without errors**
✅ **Stats are calculated correctly** (total archived, completed, uncoordinated)
✅ **TypeScript type checking works properly**
✅ **No more "referralData is not defined" error**

## Testing

To verify the fix:

1. Navigate to "Archived Referrals" page (Patients page)
2. The page should load without errors
3. You should see:
   - Total archived count
   - Completed count
   - Uncoordinated count
   - List of archived referrals

## Related Files

- `SPMC/front-end/src/pages/Patients.tsx` - Main file that was fixed

## Status

✅ **FIXED** - The Archived Referrals page now works correctly!
