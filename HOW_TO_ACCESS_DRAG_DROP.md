# How to Access the Drag-and-Drop Doctor Assignment Interface

## Quick Access Methods

### Method 1: From Admin Dashboard (Recommended)
1. Login as admin
2. Go to **Admin Dashboard** (`/admin/dashboard`)
3. Look for the purple card that says **"Assign Doctors to Departments"**
4. Click on it to go directly to the drag-and-drop interface

### Method 2: From Department Doctors Page
1. Login as admin
2. Navigate to **Department Doctors** (from sidebar or `/admin/headsup`)
3. You'll see:
   - A yellow alert box if there are unassigned doctors
   - A button in the top-right: **"Assign Doctors to Departments"**
4. Click either the button or the alert to access the interface

### Method 3: Direct URL
Simply navigate to: `http://localhost:3000/admin/headsup/assign`

## What You'll See

### Left Panel: Unassigned Doctors
- List of all doctors without department assignments
- Search functionality
- Drag handle icon (≡) on each doctor card
- Doctor specialties displayed

### Right Panel: Departments
- All 12 departments displayed as cards
- Each shows currently assigned doctors
- Drop zones for dragging doctors
- Remove button for each assigned doctor

### Top Controls
- **Role Selection Dropdown**: Choose the role before dragging
  - EDCC Personnel
  - EDMAR/EDHO (Call Triage)
  - HIS Department
- **Refresh Button**: Reload the data

## How to Use

1. **Select a Role** from the dropdown at the top
2. **Click and hold** on a doctor in the left panel
3. **Drag** the doctor to the desired department on the right
4. **Release** to assign
5. Success message will appear
6. Doctor moves from left panel to the department

## Visual Indicators

- **Grip Icon (≡)**: Appears on hover, indicates draggable
- **Purple Highlight**: Department highlights when you drag over it
- **Scale Animation**: Department card grows slightly on hover
- **Toast Notification**: Success/error messages appear

## Troubleshooting

### "I don't see any unassigned doctors"
- Run the dummy data script: `python create_dummy_doctors.py`
- Or all doctors are already assigned

### "The drag doesn't work"
- Make sure you're clicking and holding on the doctor card
- Try a different browser (Chrome, Firefox, Edge recommended)
- Check browser console for errors

### "I can't find the button"
- Make sure you're logged in as admin
- Check that you're on `/admin/headsup` or `/admin/dashboard`
- Look for the purple button in the top-right corner

### "Permission denied"
- Ensure your account has admin role
- Check UserProfile.role = 'admin' or is_superuser = True

## Screenshots Reference

### Admin Dashboard - Quick Action Card
Look for the purple gradient card with:
- Title: "Assign Doctors to Departments"
- Icon: UserPlus (person with plus sign)
- Button: "Go to Assignment Interface →"

### Department Doctors Page - Alert
If there are unassigned doctors, you'll see:
- Yellow alert box at the top
- Message: "X Unassigned Doctors"
- Button: "Go to Assignment Interface →"

### Department Doctors Page - Header Button
In the top-right corner:
- Purple button
- Text: "Assign Doctors to Departments"
- Icons: UserPlus and ArrowRight

## Need Help?

If you're still having trouble:
1. Check the browser console (F12) for errors
2. Verify backend is running (`python manage.py runserver`)
3. Verify frontend is running (`npm run dev`)
4. Check that dummy doctors were created successfully
5. Ensure you're logged in as an admin user

---

**Quick Start**: Admin Dashboard → Purple Card → Drag & Drop! 🎯
