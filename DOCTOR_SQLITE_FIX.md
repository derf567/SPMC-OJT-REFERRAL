# Doctor Department Filtering - SQLite Fix

## Issue
Doctors were not seeing referrals assigned to their department because the backend filtering used `assigned_departments__contains` which is not supported by SQLite.

## Error
```
django.db.utils.NotSupportedError: contains lookup is not supported on this database backend.
```

## Root Cause
SQLite doesn't support the `__contains` lookup for JSONField, which was being used to check if a department exists in the `assigned_departments` array.

## Solution
Updated the filtering logic in `SPMC/referrals/views.py` to detect the database backend:

- **For SQLite**: Use only the `assigned_department` field (single value)
- **For PostgreSQL**: Use both `assigned_departments__contains` (array) and `assigned_department` (single value)

## Code Change

### Before:
```python
queryset = queryset.filter(
    Q(assigned_departments__contains=[user_department]) |
    Q(assigned_department=user_department)
)
```

### After:
```python
from django.db import connection

if connection.vendor == 'sqlite':
    # For SQLite, filter using assigned_department field only
    queryset = queryset.filter(assigned_department=user_department)
else:
    # For PostgreSQL and other databases that support JSON contains
    queryset = queryset.filter(
        Q(assigned_departments__contains=[user_department]) |
        Q(assigned_department=user_department)
    )
```

## Testing Results

### Fred's Account:
- Username: fred
- Department: surgery
- Role: doctor

### Referral Visibility:
- Total referrals in system: 1
- Referrals Fred can see: 1
- Referral ID: REF-20260226-001
- Patient: marinay, wilfredo genabe
- Status: waiting
- Department: surgery

✅ Fred can now see the referral assigned to Surgery department

## How It Works Now

1. **EDCC assigns referral to Surgery department**
   - Sets `assigned_department = 'surgery'`

2. **Triage can change department if needed**
   - Updates `assigned_department` field

3. **Doctor (Fred) logs in**
   - Backend filters: `assigned_department = 'surgery'`
   - Fred sees all referrals assigned to Surgery

4. **Doctor views referral**
   - Can see full patient information
   - View-only access (cannot edit)

## Files Modified
- `SPMC/referrals/views.py` - Updated doctor filtering logic to support SQLite

## Current Status
✅ Doctor filtering working on SQLite
✅ Fred can see Surgery department referrals
✅ Backend automatically filters by department
✅ View-only access enforced

## Notes
- This fix ensures compatibility with SQLite (development) and PostgreSQL (production)
- The `assigned_department` field is the primary field used for department assignment
- The `assigned_departments` array is for future multi-department support (PostgreSQL only)
