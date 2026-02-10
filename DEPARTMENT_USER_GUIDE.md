# Department User Guide

## Paano Gamitin ang Department Accounts

### 1. Pag-login

Kada department naa'y kaugalingon nga account:

**Surgery Department Example:**
- Username: `surgery_dept`
- Password: `surgery123`

### 2. Unsa ang Makita sa Dashboard

Pagka-login nimo, makita nimo lang ang:
- **Dashboard**: Statistics para sa imong department lang
  - Total referrals para sa Surgery
  - Pending surgery cases
  - Critical surgery cases
  - Completed surgery referrals

### 3. Tabs nga Available

#### A. Dashboard Tab
- Overview sa tanan nga surgery referrals
- Statistics ug numbers
- Quick view sa status

#### B. Incoming Patients Tab
Mao ni ang mga pasyente nga:
- **Emergent**: Emergency cases para sa surgery
- **Urgent**: Urgent surgery cases
- **In Transit**: Mga pasyente nga padulong na
- **Schedule OPD**: Mga naka-schedule na nga appointments

**Importante**: Kini lang ang mga ACTIVE referrals nga kinahanglan pa ug attention.

#### C. Patients Tab (Archived)
Mao ni ang mga pasyente nga:
- **Completed**: Nahuman na ang treatment
- **Cancelled**: Gi-cancel ang referral

**Importante**: Kini ang ARCHIVED referrals - tapos na ang process.

#### D. Reports Tab
- Generate reports specific sa imong department
- Monthly trends
- Top referring hospitals
- Success rates

### 4. Unsa ang DILI Makita

Kung Surgery department ka, DILI nimo makita ang:
- Cardiology referrals
- Pediatrics referrals
- Neurology referrals
- Uban pang departments

**Makita nimo lang ang mga referrals nga gi-assign sa Surgery department.**

### 5. Workflow Example

**Scenario**: Naa'y bag-ong surgery referral

1. **EDCC Personnel** receives the referral
2. **EDCC Personnel** transfers to triage ug gi-assign sa **Surgery Department**
3. **Triage Team** reviews ug decides:
   - Emergent (emergency surgery)
   - Urgent (urgent surgery)
   - Schedule OPD (scheduled surgery)
4. **Surgery Department** makita na nila sa **Incoming Patients** tab
5. After treatment, **HIS Department** confirms arrival
6. Referral moves to **Patients Tab (Archived)** sa Surgery

### 6. Pag-filter sa Data

Tanan nga data automatically filtered na:
- Dashboard stats - Surgery lang
- Incoming patients - Surgery lang
- Archived patients - Surgery lang
- Reports - Surgery lang

### 7. Complete List of Department Accounts

| Department | Username | Password |
|-----------|----------|----------|
| Emergency | `emergency_dept` | `emergency123` |
| Internal Medicine | `internal_medicine_dept` | `internal123` |
| Surgery | `surgery_dept` | `surgery123` |
| OB-Gyne | `obstetrics_gynecology_dept` | `obgyne123` |
| Pediatrics | `pediatrics_dept` | `pediatrics123` |
| Orthopedics | `orthopedics_dept` | `orthopedics123` |
| Cardiology | `cardiology_dept` | `cardiology123` |
| Neurology | `neurology_dept` | `neurology123` |
| Anesthesiology | `anesthesiology_dept` | `anesthesiology123` |
| Radiology | `radiology_dept` | `radiology123` |
| Pathology | `pathology_dept` | `pathology123` |

### 8. Security

- Kada department makita lang ang ilang kaugalingon nga referrals
- Dili sila maka-access sa lain nga department
- Dili sila maka-change sa department assignment
- Tanan nga data secured ug filtered sa database level

### 9. Pag-change sa Password

Kung gusto nimo i-change ang password:
```bash
python manage.py changepassword surgery_dept
```

### 10. Support

Kung naa'y problema o questions:
1. Contact ang IT Department
2. Contact ang System Administrator
3. Check ang documentation

---

## English Version

### How to Use Department Accounts

#### 1. Login
Each department has its own account. For example, Surgery Department:
- Username: `surgery_dept`
- Password: `surgery123`

#### 2. What You'll See on Dashboard
After login, you'll only see:
- Statistics for your department only
- Referrals assigned to your department
- Patients referred to your department

#### 3. Available Tabs

**A. Dashboard Tab**
- Overview of all your department's referrals
- Statistics and numbers
- Quick status view

**B. Incoming Patients Tab**
Shows patients currently being referred:
- Emergent cases
- Urgent cases
- In Transit patients
- Scheduled OPD appointments

**Important**: These are ACTIVE referrals that need attention.

**C. Patients Tab (Archived)**
Shows completed/cancelled referrals:
- Completed treatments
- Cancelled referrals

**Important**: These are ARCHIVED referrals - process is done.

**D. Reports Tab**
- Generate department-specific reports
- Monthly trends
- Top referring hospitals
- Success rates

#### 4. What You WON'T See
If you're Surgery department, you WON'T see:
- Cardiology referrals
- Pediatrics referrals
- Other departments' referrals

**You only see referrals assigned to your department.**

#### 5. Workflow Example

1. EDCC Personnel receives referral
2. EDCC Personnel assigns to Surgery Department
3. Triage Team reviews and decides priority
4. Surgery Department sees it in Incoming Patients
5. After treatment, HIS confirms arrival
6. Referral moves to Archived Patients

#### 6. Data Filtering
All data is automatically filtered:
- Dashboard stats - Your department only
- Incoming patients - Your department only
- Archived patients - Your department only
- Reports - Your department only

#### 7. Security
- Each department can only see their own referrals
- Cannot access other departments' data
- Cannot change department assignments
- All data is secured at database level
