# View Only Role Implementation

## Overview
Added a new "View Only (Department Doctor)" role for doctors who need read-only access to referrals in their assigned department.

## What is View Only Role?

**View Only** doctors can:
- ✅ View active referrals assigned to their department
- ✅ See patient information
- ✅ View reports and analytics for their department
- ❌ Cannot transfer referrals
- ❌ Cannot make triage decisions
- ❌ Cannot confirm arrivals
- ❌ Cannot modify any data

## Use Case

When EDCC Personnel transfers a referral to triage and assigns it to a department (e.g., Emergency Department), doctors with "View Only" role in that department can:
1. See the referral in their dashboard
2. Monitor patient status
3. View patient details
4. Access department reports

## All Available Roles

1. **EDCC Personnel** - Transfer/forward referrals to triage
2. **EDMAR/EDHO (Call Triage)** - Make triage decisions (Emergent/Urgent/Schedule OPD)
3. **HIS Department** - Confirm patient arrivals
4. **View Only (Department Doctor)** - Read-only access to department referrals

## Changes Made

### 1. Backend (Django)

**File**: `referrals/models.py`
- Added `'view_only'` to `ROLE_CHOICES`
- Added `is_view_only` property to UserProfile model

```python
ROLE_CHOICES = [
    ('edcc_personnel', 'EDCC Personnel'),
    ('call_triage', 'EDMAR/EDHO (Call Triage)'),
    ('his_department', 'HIS Department'),
    ('view_only', 'View Only (Department Doctor)'),  # NEW
    ('admin', 'Administrator'),
    ('referrer', 'Referrer'),
    ('department_user', 'Department User'),
]

@property
def is_view_only(self):
    """Check if user is view only (department doctor)"""
    return self.role == 'view_only'
```

**Migration**: Created `0017_add_view_only_role.py`

### 2. Frontend (React/TypeScript)

**File**: `pages/admin/HeadsUpDragDrop.tsx`
- Added "View Only (Department Doctor)" to ROLES array

```typescript
const ROLES = [
  { key: "edcc_personnel", name: "EDCC Personnel" },
  { key: "call_triage", name: "EDMAR/EDHO (Call Triage)" },
  { key: "his_department", name: "HIS Department" },
  { key: "view_only", name: "View Only (Department Doctor)" },  // NEW
];
```

## How to Use

### Assigning View Only Role

1. **Login as Admin**
2. **Go to**: `/admin/headsup/assign` (Drag-and-Drop Interface)
3. **Select Role**: Choose "View Only (Department Doctor)" from dropdown
4. **Drag Doctor**: Drag an unassigned doctor to a department
5. **Drop**: Doctor is now assigned with View Only role

### What View Only Users See

When a doctor with "View Only" role logs in:
- They see referrals assigned to their department
- They can view patient details
- They can access reports
- All action buttons are hidden (read-only)

## Dashboard for View Only Users

View Only users will see:
- **Patients Tab**: List of active referrals in their department
- **Reports Tab**: Analytics and statistics for their department

The dashboard filters referrals by:
- `assigned_department` = user's department
- Status: Active referrals (not completed/cancelled)

## Permissions

```python
# View Only permissions
can_view_referrals = True  # Can see referrals
can_create_referrals = False  # Cannot create
can_transfer_referrals = False  # Cannot transfer
can_triage_referrals = False  # Cannot triage
can_confirm_arrivals = False  # Cannot confirm
```

## Example Workflow

1. **External Referrer** creates referral
2. **EDCC Personnel** receives and transfers to triage → assigns to "Emergency Department"
3. **Call Triage** makes decision (Emergent/Urgent/Schedule OPD)
4. **View Only Doctor** (Emergency Dept) can now see this referral in their dashboard
5. **View Only Doctor** monitors patient status
6. **HIS Department** confirms arrival when patient arrives

## Testing

### Test the New Role

1. **Assign a doctor with View Only role**:
   ```
   - Go to /admin/headsup/assign
   - Select "View Only (Department Doctor)"
   - Drag Dr. Maria Santos to Emergency Department
   ```

2. **Login as that doctor**:
   ```
   Username: maria.santos
   Password: DummyDoctor123!
   ```

3. **Verify**:
   - Can see referrals for Emergency Department
   - Cannot see action buttons
   - Can view patient details
   - Can access reports

## Database Query

View Only users see referrals filtered by:
```python
Referral.objects.filter(
    assigned_department=user.profile.department,
    status__in=['waiting', 'in_transit', 'emergent', 'urgent', 'schedule_opd']
)
```

## Future Enhancements

Potential improvements:
- Email notifications when new referrals arrive in their department
- Export patient list to PDF/Excel
- Department-specific analytics dashboard
- Real-time updates when referral status changes

---

**Status**: ✅ Implemented
**Migration**: Applied (0017_add_view_only_role)
**Date**: February 2026
