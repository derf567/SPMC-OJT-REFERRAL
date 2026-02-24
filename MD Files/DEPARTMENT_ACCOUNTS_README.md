# Department User Accounts

## Overview
Department-specific accounts have been created for each medical department. Each department can only view and manage referrals assigned to their specific department.

## Features
- **Department-Specific Dashboard**: Each department sees only their assigned referrals
- **Incoming Patients**: View patients currently being referred to the department (emergent, urgent, in_transit, schedule_opd)
- **Archived Patients**: View completed and cancelled referrals for the department
- **Reports**: Generate reports specific to the department's referrals

## Login Credentials

| Department | Username | Password |
|-----------|----------|----------|
| Emergency Department | `emergency_dept` | `emergency123` |
| Internal Medicine | `internal_medicine_dept` | `internal123` |
| Surgery Department | `surgery_dept` | `surgery123` |
| Obstetrics and Gynecology | `obstetrics_gynecology_dept` | `obgyne123` |
| Pediatrics | `pediatrics_dept` | `pediatrics123` |
| Orthopedics | `orthopedics_dept` | `orthopedics123` |
| Cardiology | `cardiology_dept` | `cardiology123` |
| Neurology | `neurology_dept` | `neurology123` |
| Anesthesiology | `anesthesiology_dept` | `anesthesiology123` |
| Radiology | `radiology_dept` | `radiology123` |
| Pathology | `pathology_dept` | `pathology123` |

## How It Works

### 1. Department Assignment
When EDCC Personnel transfers a referral to triage, they must select which department the referral should be assigned to. This is stored in the `assigned_department` field.

### 2. Department Filtering
When a department user logs in:
- The system automatically filters all referrals to show only those assigned to their department
- Dashboard statistics show only department-specific data
- Patient lists show only patients referred to their department
- Reports are generated based on department-specific data

### 3. Workflow Example (Surgery Department)

1. **Login**: Surgery department logs in with `surgery_dept` / `surgery123`

2. **Dashboard**: Shows statistics for surgery referrals only:
   - Total referrals assigned to Surgery
   - Pending surgery referrals
   - In-transit surgery patients
   - Urgent/emergent surgery cases

3. **Incoming Patients Tab**: Shows patients currently being referred to Surgery:
   - Status: emergent, urgent, in_transit, schedule_opd
   - These are active referrals that need attention

4. **Patients Tab (Archived)**: Shows completed/cancelled surgery referrals:
   - Patients who have been treated
   - Cancelled referrals
   - Historical data for the department

5. **Reports Tab**: Generate reports specific to Surgery department:
   - Monthly trends for surgery referrals
   - Top referring hospitals for surgery cases
   - Success rates for surgery referrals

## Technical Implementation

### Backend Changes
1. **New Role**: Added `department_user` role to UserProfile model
2. **Department Field**: Each UserProfile has a `department` field matching the department codes
3. **Query Filtering**: All referral queries are automatically filtered by `assigned_department` for department users
4. **API Endpoints**: All endpoints respect department filtering:
   - `/api/referrals/` - Lists only department referrals
   - `/api/referrals/dashboard_stats/` - Department-specific stats
   - `/api/referrals/patients/` - Department-specific patients
   - `/api/referrals/reports_analytics/` - Department-specific reports

### Department Codes
The following department codes are used in the system:
- `emergency` - Emergency Department
- `internal_medicine` - Internal Medicine
- `surgery` - Surgery Department
- `obstetrics_gynecology` - Obstetrics and Gynecology
- `pediatrics` - Pediatrics
- `orthopedics` - Orthopedics
- `cardiology` - Cardiology
- `neurology` - Neurology
- `anesthesiology` - Anesthesiology
- `radiology` - Radiology
- `pathology` - Pathology
- `other` - Other Department

## Security Notes
- Department users can only view referrals assigned to their department
- They cannot modify department assignments
- They cannot view referrals from other departments
- All data is filtered at the database level for security

## Creating Additional Department Accounts
To create more department accounts, run:
```bash
python manage.py create_department_accounts
```

The command will skip existing accounts and only create new ones.

## Changing Passwords
Department account passwords can be changed using Django admin or by running:
```bash
python manage.py changepassword <username>
```

For example:
```bash
python manage.py changepassword surgery_dept
```
