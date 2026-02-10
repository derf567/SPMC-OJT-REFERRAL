# Quick Reference - Department User System

## 🚀 Quick Start

### Pediatrics Department
```
Username: pediatrics_dept
Password: pediatrics123
```
**After login**: Press F5 to refresh, you'll see 4 referrals

### Surgery Department
```
Username: surgery_dept
Password: surgery123
```
**After login**: Press F5 to refresh, you'll see 1 referral

## 📋 Navigation (Department Users)

```
┌─────────────────────────────────┐
│ 🏠 Dashboard                    │
│ 📥 Incoming Patient      [X]    │
│ 👥 Archived Patient             │
│ 📊 Reports                      │
└─────────────────────────────────┘
```

## 🔑 All Department Logins

| Department | Username | Password |
|-----------|----------|----------|
| Pediatrics | `pediatrics_dept` | `pediatrics123` |
| Surgery | `surgery_dept` | `surgery123` |
| Cardiology | `cardiology_dept` | `cardiology123` |
| Neurology | `neurology_dept` | `neurology123` |
| Emergency | `emergency_dept` | `emergency123` |
| Internal Medicine | `internal_medicine_dept` | `internal123` |
| OB-Gyne | `obstetrics_gynecology_dept` | `obgyne123` |
| Orthopedics | `orthopedics_dept` | `orthopedics123` |
| Anesthesiology | `anesthesiology_dept` | `anesthesiology123` |
| Radiology | `radiology_dept` | `radiology123` |
| Pathology | `pathology_dept` | `pathology123` |

## 📊 What Each Tab Shows

### Dashboard
- Total referrals (department only)
- Pending cases (department only)
- Critical cases (department only)
- Completed today (department only)

### Incoming Patient
Active patients with status:
- Pending, Waiting, Emergent, Urgent, In Transit, Schedule OPD

### Archived Patient
Completed patients with status:
- Completed, Cancelled

### Reports
- Monthly trends
- Top hospitals
- Analytics

## ✅ Key Features

- ✅ Each department sees ONLY their data
- ✅ 4 simple tabs (Dashboard, Incoming, Archived, Reports)
- ✅ No Facilities or Outpatient tabs
- ✅ Better names (Incoming/Archived Patient)
- ✅ Secure database filtering

## 🔧 Quick Commands

### Verify Filtering
```bash
cd SPMC-OJT-REFERRAL/SPMC
python verify_filtering.py
```

### Assign Test Data
```bash
cd SPMC-OJT-REFERRAL/SPMC
python assign_test_referrals.py
```

### Change Password
```bash
python manage.py changepassword pediatrics_dept
```

## 🐛 Troubleshooting

**No referrals showing?**
1. Press F5 to refresh
2. Check if referrals are assigned to your department
3. Run `python verify_filtering.py`

**Navigation not updated?**
1. Hard refresh (Ctrl+Shift+R)
2. Clear cache
3. Logout and login again

## 📞 Support

Check these files for help:
- `BISAYA_DEPARTMENT_GUIDE.md` - Bisaya guide
- `DEPARTMENT_USER_GUIDE.md` - English guide
- `FINAL_IMPLEMENTATION_SUMMARY.md` - Complete details

---

**System Status**: ✅ FULLY WORKING
**Last Updated**: February 10, 2026
