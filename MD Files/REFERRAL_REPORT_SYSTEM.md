# Referral Report System

## Overview
A comprehensive reporting system to combat fraud and spam referrals by allowing EDCC/EDMA personnel to report suspicious referrals. Reported accounts can be reviewed and restricted by administrators.

## Features Implemented

### 1. Backend (Django)

#### New Model: `ReferralReport`
Located in: `SPMC/referrals/models.py`

Fields:
- `referral` - Foreign key to the reported referral
- `reported_by` - User who submitted the report
- `reported_user` - User who created the referral (auto-populated)
- `reason` - Reason for reporting (spam, duplicate, fraudulent, inappropriate, test_data, other)
- `description` - Detailed explanation
- `status` - Report status (pending, under_review, resolved, dismissed)
- `reviewed_by` - Admin who reviewed the report
- `review_notes` - Admin's review notes
- `created_at`, `updated_at`, `resolved_at` - Timestamps

#### API Endpoints
Base URL: `http://localhost:8000/api/reports/`

**List/Create Reports:**
- `GET /api/reports/` - List all reports (filtered by role)
- `POST /api/reports/` - Create a new report

**Report Actions:**
- `POST /api/reports/{id}/review/` - Mark report as under review
- `POST /api/reports/{id}/resolve/` - Resolve report (optionally ban user)
- `POST /api/reports/{id}/dismiss/` - Dismiss report as invalid

**Permissions:**
- EDCC Personnel, EDMA, and Admins can view all reports
- Regular users can only see their own submitted reports
- Only admins and EDCC/EDMA can review, resolve, or dismiss reports

### 2. Frontend (React/TypeScript)

#### Report Dialog Component
File: `SPMC/front-end/src/components/ui/ReportReferralDialog.tsx`

Features:
- 6 predefined report reasons with descriptions
- Required description field (minimum 10 characters)
- Warning about false reports
- Dark mode support
- Form validation

#### Report Button in Active Referrals
File: `SPMC/front-end/src/components/dashboard/ReferralTable.tsx`

- Added Flag icon button in the actions column
- Visible to EDCC Personnel and EDMA (triage users)
- Opens report dialog when clicked
- Red color scheme to indicate reporting action

#### Admin Reports Management Page
File: `SPMC/front-end/src/pages/admin/ReferralReports.tsx`

Features:
- View all submitted reports
- Filter by status (pending, under_review, resolved, dismissed)
- Mark reports as under review
- Resolve reports with review notes
- Option to ban reported users when resolving
- Dismiss invalid reports
- View detailed report information
- Dark mode support

## Usage Guide

### For EDCC/EDMA Personnel

1. **Reporting a Referral:**
   - Navigate to Active Referrals page
   - Find the suspicious referral
   - Click the red Flag icon in the Actions column
   - Select a reason for reporting
   - Provide detailed description (minimum 10 characters)
   - Click "Submit Report"

2. **Report Reasons:**
   - **Spam/Fake Referral** - Appears to be spam or fake
   - **Duplicate Referral** - Duplicate of another referral
   - **Fraudulent Information** - Contains false information
   - **Inappropriate Content** - Offensive or inappropriate
   - **Test/Practice Data** - Test or practice data
   - **Other** - Other reasons not listed

### For Administrators

1. **Viewing Reports:**
   - Navigate to Admin Dashboard
   - Access "Referral Reports" section
   - View all submitted reports with status

2. **Managing Reports:**
   - **Mark Under Review:** Click clock icon to indicate you're reviewing
   - **Resolve Report:** 
     - Click green checkmark icon
     - Add review notes
     - Optionally check "Ban the reported user" to restrict account
     - Click "Resolve Report"
   - **Dismiss Report:**
     - Click red X icon
     - Enter reason for dismissal
     - Report is marked as dismissed

3. **Banning Users:**
   - When resolving a report, check "Ban the reported user"
   - This will set `is_active = False` on the user account
   - Banned users cannot log in or create new referrals

## Database Migration

Migration file created: `SPMC/referrals/migrations/0023_referralreport.py`

To apply:
```bash
cd SPMC
.\venv\Scripts\Activate.ps1
python manage.py migrate
```

## Security Features

1. **Duplicate Prevention:** Users cannot report the same referral twice (unique constraint)
2. **Permission Checks:** Only authorized users can view/manage reports
3. **Audit Trail:** All actions are logged with timestamps and user information
4. **False Report Warning:** Users are warned about consequences of false reports

## API Request Examples

### Create a Report
```javascript
POST /api/reports/
Headers: Authorization: Token {token}
Body: {
  "referral": 123,
  "reason": "spam",
  "description": "This appears to be a fake referral with invalid patient information"
}
```

### Resolve and Ban User
```javascript
POST /api/reports/456/resolve/
Headers: Authorization: Token {token}
Body: {
  "review_notes": "Confirmed as fraudulent. User has been banned.",
  "ban_user": true
}
```

## Future Enhancements

Potential improvements:
1. Email notifications to admins when reports are submitted
2. Report statistics dashboard
3. Automatic pattern detection for repeat offenders
4. Appeal system for banned users
5. Report history for each user
6. Bulk actions for managing multiple reports

## Testing Checklist

- [ ] EDCC user can report a referral
- [ ] EDMA user can report a referral
- [ ] Regular users cannot see report button
- [ ] Admin can view all reports
- [ ] Admin can mark report as under review
- [ ] Admin can resolve report without banning
- [ ] Admin can resolve report and ban user
- [ ] Admin can dismiss report
- [ ] Banned user cannot log in
- [ ] Users cannot report same referral twice
- [ ] Dark mode works correctly
- [ ] Form validation works
- [ ] API permissions are enforced

## Notes

- The report system is designed to be non-intrusive to the referral workflow
- Reports do not automatically affect the referral status
- Admins have full control over the review process
- The system maintains a complete audit trail for accountability
