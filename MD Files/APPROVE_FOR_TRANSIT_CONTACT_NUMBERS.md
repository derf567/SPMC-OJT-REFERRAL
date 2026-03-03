# Approve for Transit Dialog - Contact Numbers Update

## Changes Made

Updated the "Approve Referral for Transit" dialog to display department contact numbers so triage/EDCC personnel can easily call the departments for verification.

### What's New

#### ApproveForTransitDialog Component
- **Added prop**: `departments: Department[]` - list of all departments
- **Added helper function**: `getDepartmentContact(code)` - retrieves contact number for a department
- **Updated UI**: "Departments That Accepted" section now shows:
  - Department name
  - Who accepted it and when
  - **Contact number in a highlighted box** (green background, bold text)

### UI Changes

#### Before
```
Departments That Accepted
├─ Department Name
└─ Accepted by: Doctor Name
```

#### After
```
Departments That Accepted - Call for Verification
├─ Department Name
├─ Accepted by: Doctor Name
└─ Contact Number: [PHONE NUMBER] (highlighted in green box)
```

### How It Works

1. When triage/EDCC clicks "Approve for Transit"
2. The dialog opens showing all departments that accepted
3. Each department card displays:
   - Department name
   - Who accepted it
   - **Contact number prominently displayed**
4. Triage/EDCC can easily see the number and call for verification
5. After verification, they add notes and click "Approve for Transit"

### Files Modified

- `SPMC/front-end/src/pages/TriageReferrals.tsx`
  - Updated dialog rendering to pass `departments` prop
  - Updated `ApproveForTransitDialog` component signature
  - Added `getDepartmentContact()` helper function
  - Updated "Departments That Accepted" section UI

### Benefits

✅ Easy access to department contact numbers
✅ No need to search for contact info separately
✅ Streamlined verification workflow
✅ Clear visual hierarchy with highlighted contact numbers
✅ Improves efficiency for triage/EDCC personnel
