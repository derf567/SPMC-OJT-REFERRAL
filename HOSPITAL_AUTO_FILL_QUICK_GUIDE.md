# 🏥 Hospital Address Auto-Fill - Quick Guide

---

## ✅ Feature Implemented

When you select a hospital from the dropdown, all address fields are automatically filled from the database!

---

## 📋 What Auto-Fills?

When you select **"Davao Doctors Hospital"**, these fields auto-fill:

```
✓ DOH Level: Tertiary
✓ Region: Region XI (Davao Region)
✓ Province: Davao del Sur
✓ City: Davao City
✓ Barangay: Poblacion District
✓ Street Address: Quirino Avenue corner Ponciano Street
✓ Contact Number: (082) 222-8000
```

All fields become **read-only** (gray background) to prevent accidental changes.

---

## 🎯 How to Use

### Step 1: Select Hospital
```
Complete Name of Referring Facility *
[Select hospital ▼]
```

### Step 2: Choose from Dropdown
```
[Davao Doctors Hospital        ]
[Southern Philippines Medical Center]
[Davao Regional Medical Center ]
```

### Step 3: Address Auto-Fills!
```
DOH Level * ✓ Auto-filled
[Tertiary] (read-only)

Hospital Address ✓ Auto-filled
Region: [Region XI (Davao Region)] (read-only)
Province: [Davao del Sur] (read-only)
City: [Davao City] (read-only)
Barangay: [Poblacion District] (read-only)
Street: [Quirino Avenue corner Ponciano Street] (read-only)
```

---

## 🔧 For Administrators

### Add New Hospital with Address

**Option 1: Django Admin**
1. Go to `/admin/referrals/referringhospital/`
2. Click "Add Referring Hospital"
3. Fill in all fields:
   - Name
   - DOH Level
   - Region, Province, City, Barangay
   - Street Address
   - Contact Number
4. Save

**Option 2: Management Command**
```bash
python manage.py populate_hospital_addresses
```

---

## 📊 Current Hospitals in Database

1. **Davao Doctors Hospital**
   - Level: Tertiary
   - Location: Quirino Ave, Poblacion, Davao City
   - Phone: (082) 222-8000

2. **Southern Philippines Medical Center**
   - Level: Tertiary
   - Location: J.P. Laurel Ave, Bajada, Davao City
   - Phone: (082) 227-2731

3. **Davao Regional Medical Center**
   - Level: Tertiary
   - Location: Apokon Road, Tagum, Davao City
   - Phone: (082) 221-6101

---

## ✨ Benefits

- ⚡ **Faster** - No manual typing
- ✅ **Accurate** - Data from database
- 🔒 **Consistent** - Same info every time
- 🎯 **Easy** - Just select and go!

---

## 🐛 Troubleshooting

**Q: Address fields are empty after selecting hospital?**
- Check if hospital has address data in database
- Run: `python manage.py populate_hospital_addresses`

**Q: Can't edit address fields?**
- This is by design! Auto-filled fields are read-only
- To change, update hospital in Django admin

**Q: Hospital not in dropdown?**
- Add hospital via Django admin
- Or use management command

---

**Feature Status:** ✅ WORKING

Your hospital address auto-fill feature is now live!
