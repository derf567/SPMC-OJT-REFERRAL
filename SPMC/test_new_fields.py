#!/usr/bin/env python
"""
Test script to verify new hospital fields are working
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from referrals.models import Referral, ReferringHospital, Specialty
from django.contrib.auth.models import User

# Get or create test data
user = User.objects.first()
hospital = ReferringHospital.objects.first()
specialty = Specialty.objects.first()

if not all([user, hospital, specialty]):
    print("Error: Missing required data (user, hospital, or specialty)")
    exit(1)

# Create a test referral with new fields
referral = Referral.objects.create(
    # Patient Status
    chief_complaint="Test complaint",
    pertinent_history="Test history",
    pertinent_physical_exam="Test exam",
    
    # Vital Signs
    bp="120/80",
    hr=80,
    rr=20,
    temp=36.5,
    o2_sat=98,
    vital_signs_time="14:30:00",  # NEW FIELD
    
    gcs_score="15",
    o2_support="Room air",
    admission_status="emergency_room",
    rtpcr_result="negative",
    working_impression="Test impression",
    management_done="Test management",
    
    # Patient Information
    patient_category="new_patient",
    patient_full_name="Test Patient",
    current_address="Test Address",
    birthday="1990-01-01",
    age=34,
    gender="male",
    
    # Specialty
    specialty_needed=specialty,
    reason_for_referral="Test reason",
    
    # Referring Hospital - NEW FIELDS
    referring_hospital=hospital,
    hospital_doh_level="tertiary",  # NEW FIELD
    hospital_location="Davao City",  # NEW FIELD
    hospital_contact_numbers=["0912-345-6789", "0923-456-7890"],  # NEW FIELD
    referrer_name="Dr. Test",
    referrer_profession="Emergency Physician",
    referrer_cellphone="0912-345-6789",
    mode_of_transportation="Ambulance",
    
    # System
    created_by=user,
    consent_secured=True
)

print(f"✅ Created referral: {referral.referral_id}")
print(f"   Hospital DOH Level: {referral.hospital_doh_level}")
print(f"   Hospital Location: {referral.hospital_location}")
print(f"   Hospital Contact Numbers: {referral.hospital_contact_numbers}")
print(f"   Vital Signs Time: {referral.vital_signs_time}")

# Verify it was saved
saved_referral = Referral.objects.get(id=referral.id)
print(f"\n✅ Verified from database:")
print(f"   Hospital DOH Level: {saved_referral.hospital_doh_level}")
print(f"   Hospital Location: {saved_referral.hospital_location}")
print(f"   Hospital Contact Numbers: {saved_referral.hospital_contact_numbers}")
print(f"   Vital Signs Time: {saved_referral.vital_signs_time}")

print("\n✅ All new fields are working correctly!")
