# Doctor Role Implementation ✅

## Overview
Implemented a new "Doctor" role that allows doctors to view referrals assigned to their specific department(s).

## How It Works

### Role Hierarchy:
1. **Referrer** - Creates referrals
2. **EDCC Personnel** - Receives and transfers referrals to triage
3. **Triage (EDMAR/EDHO)** - Assigns multiple departments to referrals
4. **Doctor** (NEW) - Views referrals assigned to their department
5. **Admin** - Manages users and assigns doctors to departments

### Workflow Example:

1. **Referrer creates referral** → Status: Pending
2. **EDCC transfers to Triage** → Assigns single department (e.g., "Emergency")
3. **Triage reviews and assigns multiple departments**:
   - Example: Pathology, Internal Medicine, Radiology
4. **Doctors see referrals based on their department**:
   - Dr. Juan (Pathology) → Sees this referral
   - Dr. Maria (Internal Medicine) → Sees this referral
   - Dr. Pedro (Radiology) → Sees this referral
   - Dr. Ana (Surgery) → Does NOT see this referral

## Implementation Details

### 1. Backend Changes

#### A. UserProfile Model (`models.py`)
```python
ROLE_CHOICES = [
    ('edcc_personnel', 'EDCC Personnel'),
    ('call_triage', 'EDMAR/EDHO (Call Triage)'),
    ('admin', 'Administrator'),
    ('doctor', 'Doctor'),  # NEW
    ('referrer', 'Referrer'),
]

# New properties:
@property
def is_doctor(self):
    """Check if user is a doctor"""
    return self.role == 'doctor'

@property
def can_view_department_referrals(self):
    """Doctors can view referrals assigned to their department"""
    return self.role == 'doctor' and self.department
```

#### B. ReferralViewSet (`views.py`)
Added filtering logic in `get_queryset()`:
```python
# Filter for doctors - only show referrals assigned to their department
if hasattr(user, 'profile') and user.profile.is_doctor:
    user_department = user.profile.department
    if user_department:
        queryset = queryset.filter(
            Q(assigned_departments__contains=[user_department]) |
            Q(assigned_department=user_department)
        )
```

This filters referrals where:
- `assigned_departments` array contains the doctor's department, OR
- `assigned_department` matches the doctor's department

#### C. Authentication (`authentication.py`)
Added new permissions to login response:
```python
'permissions': {
    'can_view_referrals': profile.can_view_referrals,
    'can_triage_referrals': profile.can_triage_referrals,
    'can_transfer_referrals': profile.can_transfer_referrals,
    'is_admin_user': profile.is_admin_user,
    'is_view_only': profile.is_view_only,
    'is_doctor': profile.is_doctor,  # NEW
    'can_view_department_referrals': profile.can_view_department_referrals,  # NEW
}
```

### 2. Database Migration
Created migration `0016_add_doctor_role.py`:
- Adds 'doctor' to ROLE_CHOICES
- Updates existing role field

### 3. Department Assignment

#### For Admins:
- Admins assign doctors to departments via Django Admin or user management
- Each doctor has ONE department assigned in their profile

#### For Triage:
- Triage can assign MULTIPLE departments to a referral
- Uses `assigned_departments` JSON array field

## Creating Doctor Accounts

### Via Django Admin:
1. Go to Django Admin → Users
2. Create new user or edit existing
3. Go to User Profile
4. Set:
   - **Role:** Doctor
   - **Department:** (Select department, e.g., "Pathology")
5. Save

### Via Django Shell:
```python
from django.contrib.auth.models import User
from referrals.models import UserProfile

# Create doctor user
user = User.objects.create_user(
    username='dr_juan',
    password='password123',
    first_name='Juan',
    last_name='Dela Cruz',
    email='dr.juan@spmc.gov.ph'
)

# Create profile with doctor role
UserProfile.objects.create(
    user=user,
    role='doctor',
    department='pathology'  # or 'internal_medicine', 'radiology', etc.
)
```

## Department Names

Make sure department names match between:
1. **Doctor's profile department** (e.g., 'pathology')
2. **Referral assigned_departments** array (e.g., ['pathology', 'internal_medicine'])

### Standard Department Names:
- emergency
- internal_medicine
- surgery
- obstetrics_gynecology
- pediatrics
- orthopedics
- cardiology
- neurology
- anesthesiology
- radiology
- pathology
- other

## Testing

### 1. Create Doctor Account:
```python
python manage.py shell

from django.contrib.auth.models import User
from referrals.models import UserProfile

user = User.objects.create_user(
    username='dr_pathology',
    password='test123',
    first_name='Test',
    last_name='Doctor'
)

UserProfile.objects.create(
    user=user,
    role='doctor',
    department='pathology'
)
```

### 2. Assign Departments to Referral (as Triage):
```python
from referrals.models import Referral

r = Referral.objects.first()
r.assigned_departments = ['pathology', 'internal_medicine', 'radiology']
r.save()
```

### 3. Login as Doctor:
- Username: dr_pathology
- Password: test123
- Should only see referrals with 'pathology' in assigned_departments

### 4. Verify Filtering:
```python
# As doctor with department='pathology'
from referrals.models import Referral
from django.db.models import Q

user_department = 'pathology'
referrals = Referral.objects.filter(
    Q(assigned_departments__contains=[user_department]) |
    Q(assigned_department=user_department)
)

print(f"Referrals visible to Pathology doctor: {referrals.count()}")
```

## Frontend Integration (TODO)

### Next Steps:
1. Create Doctor Dashboard component
2. Add routing for doctor role
3. Update navigation based on is_doctor permission
4. Display department-specific referrals
5. Add department badge/indicator

### Suggested Routes:
- `/doctor/dashboard` - Doctor's main dashboard
- `/doctor/referrals` - List of department referrals
- `/doctor/referral/:id` - View referral details

### UI Considerations:
- Show doctor's assigned department in header
- Filter/badge showing "Your Department: Pathology"
- Read-only view (doctors don't modify referrals)
- Maybe add "Add Notes" or "Consultation" feature later

## Files Modified

1. ✅ `SPMC/referrals/models.py`
   - Added 'doctor' role
   - Added is_doctor and can_view_department_referrals properties

2. ✅ `SPMC/referrals/views.py`
   - Added department filtering in get_queryset()

3. ✅ `SPMC/referrals/authentication.py`
   - Added doctor permissions to login response

4. ✅ `SPMC/referrals/migrations/0016_add_doctor_role.py`
   - Migration for new role

## Important Notes

✅ **Department matching is case-sensitive** - Make sure department names match exactly
✅ **Doctors see referrals from BOTH fields:**
   - `assigned_department` (single, set by EDCC)
   - `assigned_departments` (array, set by Triage)
✅ **Doctors have read-only access** - They can view but not modify referrals
✅ **Admin assigns doctors to departments** - Not self-service
✅ **One doctor = One department** - If need multiple, create separate accounts or modify later

## Status
🎉 **BACKEND COMPLETE**
📅 **Date:** February 26, 2026
⏳ **Frontend:** Pending (need to create doctor dashboard UI)

---

## Quick Reference

**Create doctor:**
```bash
python manage.py shell
```
```python
from django.contrib.auth.models import User
from referrals.models import UserProfile

user = User.objects.create_user(username='dr_test', password='test123', first_name='Test', last_name='Doctor')
UserProfile.objects.create(user=user, role='doctor', department='pathology')
```

**Test filtering:**
```python
from referrals.models import Referral
from django.db.models import Q

dept = 'pathology'
refs = Referral.objects.filter(Q(assigned_departments__contains=[dept]) | Q(assigned_department=dept))
print(refs.count())
```
