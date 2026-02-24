# Doctor Assignment System - Drag and Drop Interface

## Overview
This guide explains how to use the new drag-and-drop interface for assigning doctors to departments in the SPMC Referral System.

## Features
- **Drag and Drop**: Intuitive interface to assign doctors to departments
- **Unassigned Doctors Pool**: View all doctors who haven't been assigned to a department
- **Department Organization**: See all departments with their assigned doctors
- **Role Assignment**: Assign specific roles when moving doctors to departments
- **Quick Unassign**: Remove doctors from departments with one click

## Setup Instructions

### 1. Create Dummy Doctors (For Testing)

Run the script to create 10 dummy unassigned doctors:

```bash
cd SPMC-OJT-REFERRAL/SPMC
python create_dummy_doctors.py
```

This will create 10 doctors with:
- Default password: `DummyDoctor123!`
- Status: Approved
- Department: Unassigned (None)
- Various specialties

### 2. Access the Interface

1. Log in as an admin user
2. Navigate to: **Admin Dashboard** → **Department Doctors** → **Assign Doctors** button
3. Or directly visit: `http://localhost:3000/admin/headsup/assign`

## How to Use

### Assigning Doctors to Departments

1. **Select a Role** (top of the page):
   - EDCC Personnel
   - EDMAR/EDHO (Call Triage)
   - HIS Department

2. **Drag a Doctor**:
   - Find the doctor in the "Unassigned Doctors" list on the left
   - Click and hold on the doctor card
   - Drag it to the desired department on the right
   - Release to assign

3. **Visual Feedback**:
   - The department will highlight in purple when you drag over it
   - A success message will appear when the assignment is complete

### Unassigning Doctors

1. Find the doctor in their assigned department
2. Click the "Remove" button on their card
3. The doctor will be moved back to the "Unassigned Doctors" list

### Search Functionality

- Use the search box in the "Unassigned Doctors" section
- Search by doctor name or email
- Results update in real-time

## Available Departments

1. Emergency Department
2. Internal Medicine
3. Surgery Department
4. Obstetrics and Gynecology
5. Pediatrics
6. Orthopedics
7. Cardiology
8. Neurology
9. Anesthesiology
10. Radiology
11. Pathology
12. Other Department

## Available Roles

1. **EDCC Personnel**: Can transfer/forward referrals
2. **EDMAR/EDHO (Call Triage)**: Can make triage decisions on referrals
3. **HIS Department**: Can confirm referral arrivals

## API Endpoints

### Get All Doctors
```
GET /api/admin/doctors/
```
Returns all doctors with their departments and specialties.

### Assign Doctor to Department
```
POST /api/admin/doctors/assign/
Body: {
  "user_id": 123,
  "department": "emergency",
  "role": "edcc_personnel"
}
```

### Unassign Doctor from Department
```
POST /api/admin/doctors/unassign/
Body: {
  "user_id": 123
}
```

### Update Doctor Specialties
```
POST /api/admin/doctors/{user_id}/update_specialties/
Body: {
  "specialty_ids": [1, 2, 3]
}
```

## Technical Details

### Backend Changes
- Added new API endpoints in `referrals/views.py`
- Updated URL routing in `referrals/urls.py`
- Modified `UserProfile` model to support department assignments

### Frontend Changes
- Created new component: `HeadsUpDragDrop.tsx`
- Updated API client with new endpoints
- Added route in `App.tsx`
- Uses native HTML5 drag-and-drop API (no external libraries needed)

## Troubleshooting

### Doctors Not Showing Up
- Ensure doctors have `approval_status='approved'` in ReferrerAccount
- Check that `referrer_type='doctor'`
- Verify the user has a UserProfile

### Drag and Drop Not Working
- Make sure you're using a modern browser (Chrome, Firefox, Edge, Safari)
- Check browser console for JavaScript errors
- Try refreshing the page

### Permission Denied
- Ensure you're logged in as an admin user
- Check that your UserProfile has `role='admin'` or `is_superuser=True`

## Future Enhancements

Potential improvements for this feature:
- Bulk assignment of multiple doctors
- Department capacity limits
- Assignment history tracking
- Email notifications when doctors are assigned
- Filter doctors by specialty
- Export department rosters to PDF/Excel

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify backend logs for API errors
3. Ensure database migrations are up to date
4. Contact the development team

---

**Last Updated**: February 2026
**Version**: 1.0.0
