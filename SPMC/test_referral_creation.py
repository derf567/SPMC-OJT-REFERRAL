"""
Test script to debug referral creation issues
Run this with: python manage.py shell < test_referral_creation.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from referrals.models import Referral, ReferringHospital, Specialty
from django.contrib.auth.models import User
from datetime import date

print("Testing referral creation...")

try:
    # Get or create test data
    hospital, _ = ReferringHospital.objects.get_or_create(
        name="Test Hospital",
        defaults={'is_inside_davao_city': True}
    )
    
    specialty, _ = Specialty.objects.get_or_create(
        name="General Medicine"
    )
    
    user, _ = User.objects.get_or_create(
        username='test_user',
        defaults={'first_name': 'Test', 'last_name': 'User'}
    )
    
    # Create minimal referral data
    referral_data = {
        'chief_complaint': 'Test complaint',
        'pertinent_history': 'Test history',
        'pertinent_physical_exam': 'Test exam',
        'bp': '120/80',
        'hr': 80,
        'rr': 18,
        'temp': 37.0,
        'o2_sat': 98,
        'gcs_score': '15',
        'o2_support': 'Room air',
        'admission_status': 'emergency_room',
        'rtpcr_result': 'not_done',
        'working_impression': 'Test impression',
        'management_done': 'Test management',
        'patient_category': 'new_patient',
        'patient_full_name': 'Test Patient',
        'current_address': 'Test Address',
        'birthday': date(1990, 1, 1),
        'age': 34,
        'gender': 'male',
        'specialty_needed': specialty,
        'reason_for_referral': 'Test reason',
        'referring_hospital': hospital,
        'referrer_name': 'Test Referrer',
        'referrer_profession': 'doctor',
        'referrer_cellphone': '09123456789',
        'mode_of_transportation': 'ambulance',
        'consent_secured': True,
        'created_by': user,
    }
    
    print("Creating referral with data:", referral_data)
    referral = Referral.objects.create(**referral_data)
    print(f"✓ Referral created successfully: {referral.referral_id}")
    
    # Clean up
    referral.delete()
    print("✓ Test referral deleted")
    
except Exception as e:
    print(f"✗ Error creating referral: {str(e)}")
    import traceback
    traceback.print_exc()
