# Hospital Registration Redesign - Implementation Plan

## Overview
Redesigning the referral system so that:
1. Only hospitals register accounts (not individual doctors/nurses)
2. Individual referrers (doctors/nurses) enter their info in the referral form
3. Hospital information auto-fills from the logged-in hospital account

## Changes Required

### 1. Registration Page (Register.tsx)
**Simplify to Hospital-Only Registration:**
- Remove "Referrer Type" selection (doctor/hospital_employee/other)
- Focus on hospital information only:
  - Hospital Name *
  - Hospital DOH Level * (Primary/Secondary/Tertiary)
  - Hospital Location * (Region, Province, City, Barangay)
  - Complete Hospital Address *
  - Inside/Outside Davao City *
  - Hospital Contact Numbers * (multiple)
  - Hospital Email *
  - Legal Documents Upload * (Hospital registration, permits)
  
- Account credentials:
  - Username *
  - Password *
  - Confirm Password *

### 2. Referral Form (ExternalReferral.tsx)
**Add Referrer Personal Information Section:**

New section: "Referrer Information" (Step 4 or insert before "Referring Hospital")

Fields to add:
- Referrer Full Name * (First, Middle, Last)
- Referrer Profession/Position * (Doctor, Nurse, Medical Technologist, etc.)
- Referrer Contact Number *
- Referrer Email (optional)

**Auto-fill Hospital Information:**
When logged in as hospital account, auto-fill:
- Hospital Name (read-only, from account)
- Hospital Location (read-only, from account)
- Hospital Address (read-only, from account)
- Inside/Outside Davao City (read-only, from account)
- Hospital Contact Numbers (read-only, from account)
- Hospital DOH Level (read-only, from account)

### 3. Backend Changes

#### Models (referrals/models.py)
Update `ReferrerAccount` model:
```python
class HospitalAccount(models.Model):
    """Model for hospital accounts only"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='hospital_profile')
    hospital_name = models.CharField(max_length=200)
    hospital_doh_level = models.CharField(max_length=20)  # Primary, Secondary, Tertiary
    
    # Address fields
    region = models.CharField(max_length=100)
    province = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    barangay = models.CharField(max_length=100)
    complete_address = models.TextField()
    is_inside_davao_city = models.BooleanField(default=False)
    
    # Contact
    contact_numbers = models.JSONField(default=list)
    email = models.EmailField()
    
    # Approval
    approval_status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
```

Update `Referral` model to include referrer info:
```python
class Referral(models.Model):
    # ... existing fields ...
    
    # Referrer Information (person submitting)
    referrer_first_name = models.CharField(max_length=100)
    referrer_middle_name = models.CharField(max_length=100, blank=True)
    referrer_last_name = models.CharField(max_length=100)
    referrer_profession = models.CharField(max_length=100)  # Doctor, Nurse, etc.
    referrer_contact_number = models.CharField(max_length=20)
    referrer_email = models.EmailField(blank=True, null=True)
```

### 4. API Updates

#### Registration Endpoint
Simplify to accept only hospital information:
```python
@api_view(['POST'])
def hospital_register(request):
    data = request.data
    
    # Create user account
    user = User.objects.create_user(
        username=data['username'],
        email=data['email'],
        password=data['password'],
        is_active=False  # Pending approval
    )
    
    # Create hospital profile
    hospital = HospitalAccount.objects.create(
        user=user,
        hospital_name=data['hospitalName'],
        hospital_doh_level=data['dohLevel'],
        region=data['region'],
        province=data['province'],
        city=data['city'],
        barangay=data['barangay'],
        complete_address=data['completeAddress'],
        is_inside_davao_city=data['isInsideDavaoCity'],
        contact_numbers=data['contactNumbers'],
        email=data['email'],
        approval_status='pending'
    )
    
    return Response({'success': True, 'message': 'Hospital registration submitted for approval'})
```

#### Referral Creation Endpoint
Update to accept referrer personal information:
```python
@api_view(['POST'])
def create_referral(request):
    data = request.data
    
    # Get hospital info from logged-in user
    hospital = request.user.hospital_profile
    
    referral = Referral.objects.create(
        # Patient info
        patient_full_name=data['patientFullName'],
        # ... other patient fields ...
        
        # Referrer info (from form)
        referrer_first_name=data['referrerFirstName'],
        referrer_middle_name=data.get('referrerMiddleName', ''),
        referrer_last_name=data['referrerLastName'],
        referrer_profession=data['referrerProfession'],
        referrer_contact_number=data['referrerContactNumber'],
        referrer_email=data.get('referrerEmail'),
        
        # Hospital info (from logged-in account)
        referring_hospital_name=hospital.hospital_name,
        hospital_location=hospital.complete_address,
        hospital_doh_level=hospital.hospital_doh_level,
        hospital_contact_numbers=hospital.contact_numbers,
        is_inside_davao_city=hospital.is_inside_davao_city,
        
        # Link to hospital account
        submitted_by=request.user
    )
    
    return Response({'success': True, 'referral_id': referral.referral_id})
```

## Implementation Steps

1. ✅ Create this documentation
2. Update Register.tsx to hospital-only form
3. Update ExternalReferral.tsx to add referrer info section
4. Create database migration for new fields
5. Update backend API endpoints
6. Update serializers
7. Test registration flow
8. Test referral submission flow
9. Update admin approval interface

## Benefits

- Simpler registration process
- Better accountability (hospital account + individual referrer)
- Accurate tracking of who submitted each referral
- Hospital information consistency
- Easier for hospitals to manage multiple staff members
- No need for individual doctor/nurse accounts

## Migration Strategy

For existing data:
1. Convert existing ReferrerAccount records to HospitalAccount
2. Extract referrer info from existing referrals if available
3. Provide data migration script
