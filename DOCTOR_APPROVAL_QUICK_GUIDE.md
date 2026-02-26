# Doctor Approval System - Quick Guide

## Overview
The doctor approval system is now fully implemented. Doctors can register and admins can approve/reject their accounts through the Admin Dashboard.

## How It Works

### For Doctors (Registration)
1. Go to Login page
2. Click "Register as Doctor" link
3. Fill out the registration form:
   - Username
   - Email
   - Password
   - Full Name (First, Middle, Last)
   - Department (select from dropdown)
   - Specialties (multiple selection)
   - SPMC ID Number
   - SPMC ID File Upload
4. Submit registration
5. See toast notification: "Doctor registration submitted successfully. Your account is pending admin approval."
6. Account is created but inactive (cannot login yet)

### For Admins (Approval)
1. Login to Admin account
2. Go to Admin Dashboard
3. Click "Review Account Approvals" card
4. See list of pending accounts (both referrers and doctors)
5. Doctors are shown with:
   - Blue avatar background (vs purple for referrers)
   - "Doctor" badge
   - Department information
   - Email and submission date
6. Click "View" to see full details
7. Click "Approve" to activate the account
8. Click "Reject" to delete the account

### After Approval
- Doctor account becomes active (is_active = True)
- Doctor can now login
- Doctor sees only referrals assigned to their department
- Doctor has view-only access (like HIS system)

## Technical Details

### Frontend Files Modified
- `SPMC/front-end/src/pages/admin/AccountApproval.tsx` - Complete rewrite to support both referrers and doctors
- `SPMC/front-end/src/lib/api.ts` - Added getPendingDoctors, approveDoctor, rejectDoctor methods

### Backend Files
- `SPMC/referrals/authentication.py` - Added register_doctor_view, pending_doctors_view, approve_doctor_view, reject_doctor_view
- `SPMC/referrals/urls.py` - Added routes for doctor registration and approval
- `SPMC/referrals/models.py` - Added 'doctor' role to UserProfile

### API Endpoints
- `POST /api/auth/register-doctor/` - Doctor registration (public)
- `GET /api/admin/pending-doctors/` - Get all doctors (requires admin auth)
- `POST /api/admin/approve-doctor/<id>/` - Approve doctor (requires admin auth)
- `POST /api/admin/reject-doctor/<id>/` - Reject doctor (requires admin auth)

## Features

### AccountApproval Page Features
1. **Unified View**: Shows both referrers and doctors in one list
2. **Visual Distinction**: 
   - Doctors have blue avatars
   - Referrers have purple avatars
   - "Doctor" badge for doctors
3. **Filtering**:
   - Status filter: All, Pending, Approved, Rejected
   - Type filter: All Types, Doctors, Hospital Employees, Other
   - Search: By name, email, username
4. **Actions**:
   - View details in modal
   - Approve account (activates user)
   - Reject account (deletes user)
5. **Real-time Updates**: List refreshes after approve/reject actions

### Doctor Registration Features
1. **Form Validation**: All required fields validated
2. **File Upload**: SPMC ID file upload support
3. **Multiple Specialties**: Can select multiple specialties
4. **Department Selection**: Dropdown with all departments
5. **Toast Notification**: 8-second notification about approval process
6. **Duplicate Prevention**: Checks for existing username/email

## Testing

### Test the Doctor Registration Flow
1. Create a doctor account:
   - Username: testdoctor
   - Email: testdoctor@example.com
   - Password: test123
   - Department: Pediatrics
   - Specialties: Pediatrics, Neonatology

2. Try to login (should fail - account not active)

3. Login as admin and approve the account

4. Login as doctor (should succeed)

5. Verify doctor only sees referrals for Pediatrics department

## Current Status
✅ Doctor registration form complete
✅ Backend API endpoints working
✅ Admin approval page updated
✅ Both referrers and doctors shown in approval list
✅ Approve/reject functionality working
✅ Visual distinction between account types
✅ Filtering and search working
✅ Real-time updates after actions

## Notes
- Doctors select their own department and specialties during registration
- Admin only approves or rejects - no department assignment needed
- Doctor POV is view-only, showing only referrals assigned to their department
- Approved doctors can login immediately
- Rejected doctors are deleted from the system
