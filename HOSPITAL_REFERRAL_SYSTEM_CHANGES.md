# Hospital Referral System - Registration & Referral Form Changes

## What You Requested

You want to change the system so that:

1. **Registration**: Only hospitals register (not individual doctors/nurses)
2. **Referral Form**: Individual referrers (doctors/nurses) enter their personal information when submitting a referral
3. **Auto-fill**: Hospital information (name, address, location, contact) automatically fills from the logged-in hospital account

## Current vs New Flow

### Current Flow:
```
Individual Doctor/Nurse → Registers Account → Submits Referrals
(Personal info in account)    (Hospital info in account)
```

### New Flow:
```
Hospital → Registers Account → Staff Login → Submit Referral
(Hospital info in account)                    (Staff enters their personal info)
```

## Key Changes Needed

### 1. Registration Form (`/register`)

**Remove:**
- Referrer type selection (Doctor/Hospital Employee/Other)
- Personal information fields (First name, Last name, Age, Gender, Position)
- Affiliate hospitals selection
- Profession field

**Keep/Add:**
- Username, Email, Password (account credentials)
- Hospital Name *
- Hospital DOH Level * (Primary/Secondary/Tertiary)
- Region, Province, City, Barangay *
- Complete Hospital Address *
- Inside/Outside Davao City *
- Hospital Contact Numbers * (can add multiple)
- Hospital Legal Documents Upload *

### 2. Referral Form (`/external-referral`)

**Add New Section: "Referrer Information"**

This section captures who is submitting the referral:

- Referrer First Name *
- Referrer Middle Name
- Referrer Last Name *
- Referrer Profession/Position * (Doctor, Nurse, Medical Technologist, etc.)
- Referrer Contact Number *
- Referrer Email (optional)

**Auto-fill Hospital Section:**

When a hospital account is logged in, these fields become read-only and auto-filled:

- Hospital Name (from account)
- Hospital Location/Address (from account)
- Hospital District/Street (from account)
- Inside/Outside Davao City (from account)
- Hospital Contact Numbers (from account)
- Hospital DOH Level (from account)

## Example Scenario

### Registration:
**St. Luke's Hospital** registers:
- Username: `stlukes_hospital`
- Email: `admin@stlukes.com`
- Hospital Name: St. Luke's Medical Center
- Address: 123 Medical Drive, Poblacion District, Davao City
- Inside Davao City: Yes
- Contact: 082-123-4567, 082-123-4568
- DOH Level: Tertiary

### Referral Submission:
**Dr. Juan Dela Cruz** (works at St. Luke's) logs in using hospital account and submits referral:

**Referrer Information (Dr. Juan enters):**
- Name: Juan Santos Dela Cruz
- Profession: Emergency Medicine Doctor
- Contact: 0917-123-4567
- Email: juan.delacruz@stlukes.com

**Hospital Information (Auto-filled, read-only):**
- Hospital: St. Luke's Medical Center
- Address: 123 Medical Drive, Poblacion District, Davao City
- Inside Davao City: Yes
- Contact: 082-123-4567, 082-123-4568

**Patient Information (Dr. Juan enters):**
- Patient name, age, condition, etc.

## Benefits

1. **Simpler Registration**: Hospitals register once, not every staff member
2. **Better Tracking**: Know exactly who submitted each referral
3. **Flexibility**: Multiple staff can use one hospital account
4. **Accuracy**: Hospital info is consistent across all referrals
5. **Accountability**: Each referral has both hospital and individual referrer information

## Files to Modify

### Frontend:
1. `SPMC/front-end/src/pages/Register.tsx` - Simplify to hospital-only
2. `SPMC/front-end/src/pages/ExternalReferral.tsx` - Add referrer info section, auto-fill hospital

### Backend:
1. `SPMC/referrals/models.py` - Add referrer fields to Referral model
2. `SPMC/referrals/views.py` - Update registration and referral creation logic
3. `SPMC/referrals/serializers.py` - Update serializers
4. Create database migration

## Next Steps

Would you like me to:
1. ✅ Implement the simplified hospital registration form?
2. ✅ Add referrer information section to the referral form?
3. ✅ Implement auto-fill for hospital information?
4. ✅ Update the backend models and API?

Let me know and I'll proceed with the implementation!
