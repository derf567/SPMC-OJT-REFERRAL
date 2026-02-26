# EDCC Department Assignment Fix

## Problem
When EDCC personnel transferred referrals to triage, some older referrals were showing as "❓ Unassigned" in the triage view. This happened because those referrals were transferred before the department assignment feature was fully implemented.

## Root Cause
- Referrals with `status='waiting'` had `assigned_department=None`
- The frontend correctly displays "❓ Unassigned" when `assigned_department` is null
- The backend transfer logic was correct, but some old data existed without department assignments

## Solution Implemented

### 1. Created Management Command
Created `SPMC/referrals/management/commands/fix_unassigned_departments.py` to:
- Find all waiting referrals without assigned department
- Automatically assign departments based on specialty mapping
- Default to Emergency Department if no specialty match found

### 2. Specialty to Department Mapping
```python
specialty_mapping = {
    'surgery': 'surgery',
    'internal medicine': 'internal_medicine',
    'pediatrics': 'pediatrics',
    'obstetrics': 'obstetrics_gynecology',
    'gynecology': 'obstetrics_gynecology',
    'orthopedics': 'orthopedics',
    'cardiology': 'cardiology',
    'neurology': 'neurology',
    'anesthesiology': 'anesthesiology',
    'radiology': 'radiology',
    'pathology': 'pathology',
}
```

### 3. Results
- Fixed 6 waiting referrals
- All referrals now have proper department assignments
- No more "Unassigned" referrals in triage view

## How to Run the Fix (if needed in the future)

```bash
cd SPMC
python manage.py fix_unassigned_departments
```

## Prevention
The current system already prevents this issue:
1. EDCC transfer modal requires department selection
2. Transfer button is disabled until department is selected
3. Backend validates department is provided before transfer
4. Database field allows null for backward compatibility

## Verification

Check for unassigned referrals:
```bash
python manage.py shell -c "from referrals.models import Referral; print(f'Unassigned waiting referrals: {Referral.objects.filter(status=\"waiting\", assigned_department__isnull=True).count()}')"
```

Expected output: `Unassigned waiting referrals: 0`

## Technical Details

### Backend (views.py)
The `transfer_to_triage` endpoint correctly:
- Validates department is provided
- Sets `referral.assigned_department = department`
- Sets `referral.status = 'waiting'`
- Records transfer metadata (transferred_by, transferred_at)

### Frontend (ReferralTable.tsx)
- Department selection modal enforces selection
- Transfer button disabled without department
- Displays department badge or "❓ Unassigned" appropriately

### Database
- Field: `assigned_department` (CharField, nullable)
- Status: `waiting` indicates transferred to triage
- All current waiting referrals now have departments assigned

## Date Fixed
February 26, 2026
