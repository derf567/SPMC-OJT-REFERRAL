# Hospital Registration & Referral Form Update - Implementation Guide

## Summary of Changes

### Current System:
- Individual doctors/nurses register accounts
- Hospital info is part of their profile
- Referral form uses registered user's info

### New System:
- Only hospitals register accounts
- Individual referrers (doctors/nurses) enter their info in each referral
- Hospital info auto-fills from logged-in hospital account

## Quick Implementation Steps

### Step 1: Simplify Registration Form

**File: `SPMC/front-end/src/pages/Register.tsx`**

Change the form to collect only:
1. **Account Credentials**
   - Username
   - Email
   - Password

2. **Hospital Information**
   - Hospital Name
   - Hospital DOH Level (Primary/Secondary/Tertiary)
   - Region, Province, City, Barangay
   - Complete Address
   - Inside/Outside Davao City
   - Contact Numbers (multiple)

3. **Documents**
   - Hospital legal documents upload

Remove:
- Referrer type selection
- Personal information (first name, last name, age, gender, position)
- Affiliate hospitals selection

### Step 2: Update Referral Form

**File: `SPMC/front-end/src/pages/ExternalReferral.tsx`**

Add new section in Step 4 (before or after "Referring Hospital"):

**"Referrer Information" Section:**
```tsx
<div className="space-y-4">
  <h3>Referrer Information (Person Submitting This Referral)</h3>
  
  <div className="grid grid-cols-3 gap-4">
    <input placeholder="First Name *" />
    <input placeholder="Middle Name" />
    <input placeholder="Last Name *" />
  </div>
  
  <input placeholder="Profession/Position * (e.g., Doctor, Nurse, Medical Technologist)" />
  
  <input placeholder="Contact Number *" />
  
  <input placeholder="Email (optional)" />
</div>
```

**Auto-fill Hospital Information:**
When user is logged in, auto-fill and make read-only:
- Hospital Name
- Hospital Location/Address
- Inside/Outside Davao City
- Hospital Contact Numbers
- Hospital DOH Level

### Step 3: Backend Updates

**File: `SPMC/referrals/models.py`**

Add to `Referral` model:
```python
# Referrer Information (person who submitted)
referrer_first_name = models.CharField(max_length=100)
referrer_middle_name = models.CharField(max_length=100, blank=True)
referrer_last_name = models.CharField(max_length=100)
referrer_profession = models.CharField(max_length=100)  # Doctor, Nurse, etc.
referrer_contact_number = models.CharField(max_length=20)
referrer_email = models.EmailField(blank=True, null=True)
```

Update `ReferrerAccount` model to focus on hospital:
```python
# Rename to HospitalAccount or keep as ReferrerAccount but simplify
# Remove: age, gender, position, affiliate_hospitals
# Keep: hospital_name, hospital_doh_level, hospital_location, contact_numbers, address
```

**File: `SPMC/referrals/views.py`**

Update referral creation to:
1. Accept referrer personal info from form
2. Auto-fill hospital info from logged-in user's profile

**File: `SPMC/referrals/serializers.py`**

Update serializers to include new referrer fields.

### Step 4: Database Migration

```bash
cd SPMC
python manage.py makemigrations
python manage.py migrate
```

## Benefits

✅ Simpler registration (hospital-focused)
✅ Better tracking (know who submitted each referral)
✅ One hospital account, multiple staff can use it
✅ Accurate referrer information per referral
✅ Hospital info consistency across all referrals

## Testing Checklist

- [ ] Hospital can register with new simplified form
- [ ] Hospital account gets approved by admin
- [ ] Hospital can login
- [ ] Referral form shows referrer information fields
- [ ] Hospital information auto-fills when logged in
- [ ] Referral submission includes referrer details
- [ ] Referral displays both hospital and referrer info correctly

## Migration for Existing Data

For existing referrer accounts:
1. Convert to hospital accounts
2. Keep hospital information
3. For existing referrals, populate referrer fields from account data if available

