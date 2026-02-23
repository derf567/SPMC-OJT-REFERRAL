import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from referrals.models import Referral

# Get the most recent referral
referral = Referral.objects.order_by('-created_at').first()

if referral:
    print(f"Checking referral: {referral.referral_id}")
    print(f"Patient: {referral.patient_full_name}")
    print(f"\nNew Fields:")
    print(f"  - Hospital DOH Level: {referral.hospital_doh_level}")
    print(f"  - Hospital Location: {referral.hospital_location}")
    print(f"  - Hospital Contact Numbers: {referral.hospital_contact_numbers}")
    print(f"  - Vital Signs Time: {referral.vital_signs_time}")
    print(f"\nOther Hospital Info:")
    print(f"  - Hospital Name: {referral.referring_hospital.name if referral.referring_hospital else 'N/A'}")
    print(f"  - Referrer Name: {referral.referrer_name}")
else:
    print("No referrals found")
