# Fix 500 Error After Rebase - Complete Guide

## Problem
After rebasing from `fred` or `main` branch, the backend returns 500 Internal Server Error for all API calls.

## Root Cause
The database schema doesn't match the new code because:
1. New migrations were added but not applied
2. Database has old structure but code expects new fields
3. Missing database tables/columns from new features

## Solution Steps

### Step 1: Check Backend Terminal for Actual Error
The 500 error is generic. Check the Django terminal for the real error:
```
Look for errors like:
- "no such column: referrals_referral.in_triage"
- "no such table: referrals_department"
- "OperationalError: no such column"
```

### Step 2: Apply All Migrations
```bash
cd SPMC
python manage.py migrate
```

This will apply all pending migrations including:
- `0019_add_department_and_triage_workflow.py` (Department model, DepartmentAcceptance, triage fields)
- `0020_remove_transitinfo_filled_at_and_more.py`
- Any other new migrations

### Step 3: Verify Migrations Applied
```bash
python manage.py showmigrations referrals
```

You should see `[X]` next to all migrations:
```
referrals
 [X] 0001_initial
 [X] 0002_userprofile
 ...
 [X] 0019_add_department_and_triage_workflow
 [X] 0020_remove_transitinfo_filled_at_and_more
```

### Step 4: Populate Departments (If New)
If you just applied migration 0019, you need to populate departments:
```bash
python populate_departments.py
```

This creates the 12 departments needed for the triage workflow.

### Step 5: Restart Django Server
```bash
# Stop the server (Ctrl+C)
# Then restart:
python manage.py runserver
```

### Step 6: Clear Frontend Cache
```bash
cd front-end
rm -rf node_modules/.vite
npm run dev
```

### Step 7: Hard Refresh Browser
Press `Ctrl+Shift+R` to clear browser cache

---

## Common Specific Errors and Fixes

### Error: "no such column: referrals_referral.in_triage"
**Cause:** Migration 0019 not applied
**Fix:**
```bash
python manage.py migrate referrals 0019
python manage.py migrate
```

### Error: "no such table: referrals_department"
**Cause:** Department model not created
**Fix:**
```bash
python manage.py migrate referrals 0019
python populate_departments.py
```

### Error: "no such column: referrals_referral.triage_remarks"
**Cause:** Triage workflow fields not added
**Fix:**
```bash
python manage.py migrate
```

### Error: "FOREIGN KEY constraint failed"
**Cause:** Trying to reference non-existent department
**Fix:**
```bash
python populate_departments.py
```

---

## For Your Workmate - Complete Reset Process

If migrations are really messed up, do a complete reset:

### Option 1: Reset Database (Recommended for Development)
```bash
cd SPMC

# 1. Delete the database
del db.sqlite3  # Windows
# or
rm db.sqlite3   # Mac/Linux

# 2. Delete all migration files except __init__.py
# Keep: referrals/migrations/__init__.py
# Delete: All 0001_*.py, 0002_*.py, etc.

# 3. Recreate migrations
python manage.py makemigrations

# 4. Apply migrations
python manage.py migrate

# 5. Create superuser
python manage.py createsuperuser

# 6. Populate departments
python populate_departments.py

# 7. Restart server
python manage.py runserver
```

### Option 2: Keep Data, Fix Migrations
```bash
cd SPMC

# 1. Check current migration state
python manage.py showmigrations

# 2. Fake migrations if needed (if you have data to keep)
python manage.py migrate referrals 0018 --fake
python manage.py migrate referrals 0019
python manage.py migrate referrals 0020

# 3. Populate departments if needed
python populate_departments.py

# 4. Restart server
python manage.py runserver
```

---

## Prevention - Best Practices

### For Person Pushing Code (You):
1. **Always commit migrations:**
   ```bash
   git add SPMC/referrals/migrations/
   git commit -m "Add triage workflow migrations"
   ```

2. **Document new migrations in PR/commit:**
   ```
   Added migrations:
   - 0019_add_department_and_triage_workflow.py
   
   After pulling, run:
   - python manage.py migrate
   - python populate_departments.py
   ```

3. **Include setup scripts:**
   - Commit `populate_departments.py`
   - Commit any data migration scripts

### For Person Pulling Code (Your Workmate):
1. **After rebase/pull, ALWAYS:**
   ```bash
   # Check for new migrations
   python manage.py showmigrations
   
   # Apply migrations
   python manage.py migrate
   
   # Check for setup scripts
   ls *.py | grep -E "(populate|setup|init)"
   
   # Run any new setup scripts
   python populate_departments.py
   ```

2. **Check for migration conflicts:**
   ```bash
   python manage.py makemigrations --check
   ```

3. **Restart server after pulling:**
   ```bash
   # Always restart Django after pulling new code
   python manage.py runserver
   ```

---

## Quick Checklist After Rebase

- [ ] Pull/rebase completed
- [ ] Check for new migration files in `referrals/migrations/`
- [ ] Run `python manage.py migrate`
- [ ] Check for new `.py` scripts in SPMC folder
- [ ] Run any `populate_*.py` or `setup_*.py` scripts
- [ ] Restart Django server
- [ ] Clear frontend cache (`rm -rf node_modules/.vite`)
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Test API endpoints

---

## Debugging Commands

### Check Database Schema
```bash
python manage.py dbshell
.schema referrals_referral
.schema referrals_department
.exit
```

### Check Migration Status
```bash
python manage.py showmigrations referrals
```

### Check for Migration Conflicts
```bash
python manage.py makemigrations --check
```

### Test API Endpoint Directly
```bash
# Test departments endpoint
curl http://127.0.0.1:8000/api/departments/

# Test referrals endpoint
curl http://127.0.0.1:8000/api/referrals/
```

### Check Django Logs
Look at the terminal running `python manage.py runserver` for detailed error messages.

---

## Communication Template

When you push code with migrations, send this to your team:

```
🔄 New Migrations Added

Branch: fred
Migrations:
- 0019_add_department_and_triage_workflow.py
- 0020_remove_transitinfo_filled_at_and_more.py

After pulling, run:
1. python manage.py migrate
2. python populate_departments.py
3. Restart Django server

New features:
- Triage workflow with department assignment
- Department acceptance tracking
- Triage decision (Emergent/Urgent/OPD)
```

---

## Emergency Fix (If Nothing Works)

If your workmate is completely stuck:

```bash
# 1. Backup current database (if has important data)
cp db.sqlite3 db.sqlite3.backup

# 2. Get a fresh database from you
# You send them your db.sqlite3 file

# 3. Or reset everything
del db.sqlite3
python manage.py migrate
python manage.py createsuperuser
python populate_departments.py

# 4. Restart
python manage.py runserver
```

---

## Summary

The 500 error after rebase is almost always because:
1. ❌ Migrations not applied
2. ❌ Database schema outdated
3. ❌ Missing setup data (departments)

The fix is simple:
1. ✅ `python manage.py migrate`
2. ✅ `python populate_departments.py`
3. ✅ Restart server
4. ✅ Clear caches

**Always run migrations after pulling new code!**
