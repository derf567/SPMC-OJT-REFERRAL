# Department Navigation Update

## Changes Made

Updated the navigation bar for department users to show only relevant tabs.

### Department User Navigation (Pediatrics, Surgery, Cardiology, etc.)

**New Navigation:**
1. ✅ **Dashboard** - Overview of department statistics
2. ✅ **Incoming Patient** - Active patients being referred (was "Active Referrals")
3. ✅ **Archived Patient** - Completed/cancelled patients (was "Archived Referrals")
4. ✅ **Reports** - Department-specific reports

**Removed:**
- ❌ **Facilities** - Not needed for department users
- ❌ **Outpatient** - Not needed for department users

### Navigation by User Role

#### 1. Department Users (Pediatrics, Surgery, etc.)
```
- Dashboard
- Incoming Patient (with badge showing count)
- Archived Patient
- Reports
```

#### 2. HIS Department
```
- Dashboard
- Incoming Referrals
- Outpatient
- Archived Referrals
- Reports
```

#### 3. EDCC Personnel / Triage / Admin
```
- Dashboard
- Active Referrals (with badge showing count)
- Outpatient
- Archived Referrals
- Facilities
- Reports
```

## What Each Tab Shows (Department Users)

### 1. Dashboard
- Total referrals for the department
- Pending cases
- Critical cases
- Completed today
- Department-specific statistics

### 2. Incoming Patient
Shows active patients with status:
- `pending` - New referrals
- `waiting` - Waiting for triage
- `emergent` - Emergency cases
- `urgent` - Urgent cases
- `in_transit` - Patients on the way
- `schedule_opd` - Scheduled appointments

**Badge**: Shows count of incoming patients

### 3. Archived Patient
Shows completed patients with status:
- `completed` - Treatment finished
- `cancelled` - Referral cancelled

### 4. Reports
- Monthly trends for department
- Top referring hospitals
- Department-specific analytics
- Success rates

## Example: Pediatrics Department

When logged in as `pediatrics_dept`:

**Navigation Bar:**
```
┌─────────────────────────────────────────┐
│ SPMC Referral System                    │
├─────────────────────────────────────────┤
│ 🏠 Dashboard                            │
│ 📥 Incoming Patient              [4]    │
│ 👥 Archived Patient                     │
│ 📊 Reports                              │
└─────────────────────────────────────────┘
```

**What You See:**
- Dashboard: Pediatrics statistics only
- Incoming Patient: 4 active Pediatrics patients
- Archived Patient: Completed Pediatrics patients
- Reports: Pediatrics analytics

**What You DON'T See:**
- Facilities tab
- Outpatient tab
- Other departments' data

## Example: Surgery Department

When logged in as `surgery_dept`:

**Navigation Bar:**
```
┌─────────────────────────────────────────┐
│ SPMC Referral System                    │
├─────────────────────────────────────────┤
│ 🏠 Dashboard                            │
│ 📥 Incoming Patient              [1]    │
│ 👥 Archived Patient                     │
│ 📊 Reports                              │
└─────────────────────────────────────────┘
```

**What You See:**
- Dashboard: Surgery statistics only
- Incoming Patient: 1 active Surgery patient
- Archived Patient: Completed Surgery patients
- Reports: Surgery analytics

## Terminology Changes

| Old Name | New Name (Department Users) |
|----------|----------------------------|
| Active Referrals | Incoming Patient |
| Archived Referrals | Archived Patient |

**Reason**: More user-friendly and patient-centric terminology for department users.

## Technical Implementation

### File Modified
- `SPMC-OJT-REFERRAL/SPMC/front-end/src/components/layout/DashboardLayout.tsx`

### Code Changes
```typescript
// Added new navigation for department users
const departmentNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Incoming Patient", href: "/referrals", icon: Inbox, badge: activeReferralsCount > 0 ? activeReferralsCount.toString() : undefined },
  { name: "Archived Patient", href: "/patients", icon: Users },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

// Updated navigation logic
const finalNavigation = user?.role === 'department_user' 
  ? departmentNavigation 
  : user?.permissions?.is_his_department 
    ? hisNavigation 
    : navigation;
```

## Testing

### Test 1: Pediatrics Department
1. Login as `pediatrics_dept`
2. Verify navigation shows:
   - Dashboard
   - Incoming Patient (with badge)
   - Archived Patient
   - Reports
3. Verify Facilities and Outpatient are NOT shown

### Test 2: Surgery Department
1. Login as `surgery_dept`
2. Verify same navigation as Pediatrics
3. Verify different data (Surgery-specific)

### Test 3: EDCC Personnel
1. Login as EDCC user
2. Verify navigation shows:
   - Dashboard
   - Active Referrals
   - Outpatient
   - Archived Referrals
   - Facilities
   - Reports

## Benefits

1. **Simplified Navigation**: Department users see only what they need
2. **Better UX**: Clearer terminology (Incoming Patient vs Active Referrals)
3. **Role-Based**: Different navigation for different user roles
4. **Focused Workflow**: Removes unnecessary tabs for department users

## Refresh Required

After this update, users need to:
1. **Refresh the browser** (Press F5 or Ctrl+R)
2. Or **Logout and login again**

The new navigation will appear immediately.

## Summary

✅ Department users now have a simplified navigation:
- Dashboard
- Incoming Patient
- Archived Patient
- Reports

✅ Removed unnecessary tabs:
- Facilities
- Outpatient

✅ Better terminology:
- "Incoming Patient" instead of "Active Referrals"
- "Archived Patient" instead of "Archived Referrals"

✅ All department users (Pediatrics, Surgery, Cardiology, etc.) have the same navigation structure but see different data based on their department.
