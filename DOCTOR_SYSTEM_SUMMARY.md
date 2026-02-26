# Doctor System - Current Status & Next Steps

## ✅ What's Working Now:

### Backend (Complete):
1. **Doctor Role** - Added to UserProfile model
2. **Doctor Registration** - `/register/doctor` endpoint working
3. **Department Filtering** - Doctors only see referrals assigned to their department
4. **API Endpoints** - All ready:
   - `GET /api/admin/pending-doctors/` - List pending doctors
   - `POST /api/admin/approve-doctor/<id>/` - Approve
   - `POST /api/admin/reject-doctor/<id>/` - Reject

### Current Approval Method:
**Via Django Admin** (Working):
1. Go to `http://localhost:8000/admin/`
2. Click "Users"
3. Find doctor (Role: Doctor, Active: ✗)
4. Click username
5. Check "Active" checkbox
6. Save

**Via Shell** (Quick):
```bash
python manage.py shell -c "from django.contrib.auth.models import User; User.objects.filter(username='DOCTOR_USERNAME').update(is_active=True)"
```

## ⏳ What's Needed (TODO):

### 1. Admin Dashboard - Doctor Approval UI
**Current:** AccountApproval page only shows referrers (hospital accounts)
**Needed:** Update to show doctors too

**Quick Fix Options:**
- **Option A:** Add separate "Pending Doctors" tab
- **Option B:** Merge doctors into existing AccountApproval list
- **Option C:** Create separate "Doctor Management" page

### 2. Doctor Dashboard (View-Only)
**What doctors need to see:**
- Incoming referrals assigned to their department
- View-only access (no edit, no approve/reject)
- Similar to HIS (Hospital Information System) view

**Features:**
- List of referrals where `assigned_departments` contains doctor's department
- View referral details
- Maybe add notes/consultation (future)
- No status changes
- No triage decisions

## Current Doctor: Fred

**Status:**
- Username: `fred`
- Department: `pediatrics`
- Active: `True` (approved via shell)
- Can login: ✅ Yes
- Has dashboard: ❌ No (will see default/error)

**What happens when fred logs in:**
- Backend filtering works ✅ (only sees pediatrics referrals)
- Frontend routing ❌ (no doctor dashboard yet)
- Will probably see error or wrong dashboard

## Implementation Priority:

### High Priority (Do First):
1. **Create Doctor Dashboard** - View-only referrals list
   - Copy from EDCC/Triage dashboard
   - Remove action buttons
   - Show only assigned department referrals
   - Add "View Details" button

2. **Add Doctor Route** - `/doctor/dashboard`
   - Check if user.role === 'doctor'
   - Redirect to doctor dashboard
   - Protected route

### Medium Priority (Do Later):
3. **Update AccountApproval Page** - Show pending doctors
   - Fetch from `/api/admin/pending-doctors/`
   - Add "Doctor" filter option
   - Show approve/reject buttons
   - Merge with referrers list

### Low Priority (Nice to Have):
4. **Email Notifications** - Notify doctor on approval
5. **Doctor Profile Page** - View/edit profile
6. **Consultation Notes** - Doctors can add notes to referrals

## Quick Test Plan:

### Test Doctor Login:
1. Login as fred (password: whatever you set)
2. Should login successfully
3. Currently will see error/wrong dashboard (no doctor dashboard yet)

### Test Department Filtering (Backend):
```bash
# Create test referral with pediatrics department
python manage.py shell
```
```python
from referrals.models import Referral
r = Referral.objects.first()
r.assigned_departments = ['pediatrics', 'internal_medicine']
r.save()

# Login as fred (pediatrics doctor)
# Should see this referral in API response
```

### Test Admin Approval (Django Admin):
1. Register new doctor
2. Go to Django Admin → Users
3. Find new doctor (Active: ✗)
4. Click username → Check Active → Save
5. Doctor can now login

## Files Ready:

### Backend:
- ✅ `models.py` - Doctor role added
- ✅ `views.py` - Department filtering implemented
- ✅ `authentication.py` - Doctor registration + approval endpoints
- ✅ `urls.py` - Routes configured

### Frontend:
- ✅ `DoctorRegister.tsx` - Registration form
- ✅ `api.ts` - API methods ready
- ❌ `DoctorDashboard.tsx` - NOT CREATED YET
- ❌ `App.tsx` - No doctor route yet
- ⚠️ `AccountApproval.tsx` - Partially updated (needs completion)

## Recommended Next Steps:

1. **Create DoctorDashboard.tsx** (30 min)
   - Copy from IncomingReferrals.tsx
   - Remove action buttons
   - Make view-only
   - Show department badge

2. **Add Doctor Route** (5 min)
   - Add to App.tsx
   - Protected route for doctor role

3. **Update DashboardRedirect** (5 min)
   - Check if role === 'doctor'
   - Redirect to `/doctor/dashboard`

4. **Test** (10 min)
   - Login as fred
   - Should see doctor dashboard
   - Should only see pediatrics referrals

**Total Time: ~50 minutes**

---

## For Now:

**Doctors can:**
- ✅ Register via `/register/doctor`
- ✅ Wait for admin approval (Django Admin)
- ✅ Login after approval
- ❌ See proper dashboard (needs frontend work)

**Admins can:**
- ✅ Approve via Django Admin
- ✅ Approve via shell command
- ⏳ Approve via Admin Dashboard (needs UI update)

**Backend is 100% ready. Frontend needs doctor dashboard + routing.**
