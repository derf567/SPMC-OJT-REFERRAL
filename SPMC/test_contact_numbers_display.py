"""
Test script to verify contact_numbers are properly stored in Referral model
Run this with: python manage.py shell < test_contact_numbers_display.py
"""

from referrals.models import Referral, UserProfile
from django.contrib.auth.models import User

print("\n" + "="*60)
print("TESTING CONTACT NUMBERS IN REFERRAL MODEL")
print("="*60)

# Check if contact_numbers field exists in Referral model
print("\n1. Checking if contact_numbers field exists in Referral model...")
try:
    # Get the field
    field = Referral._meta.get_field('contact_numbers')
    print(f"   ✓ Field exists: {field.name}")
    print(f"   ✓ Field type: {field.get_internal_type()}")
    print(f"   ✓ Default value: {field.default}")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Check recent referrals
print("\n2. Checking recent referrals for contact_numbers...")
recent_referrals = Referral.objects.all().order_by('-created_at')[:5]

if recent_referrals:
    for referral in recent_referrals:
        print(f"\n   Referral ID: {referral.referral_id}")
        print(f"   Patient: {referral.patient_full_name}")
        print(f"   Created by: {referral.created_by.username}")
        print(f"   Contact Numbers: {referral.contact_numbers}")
        print(f"   Type: {type(referral.contact_numbers)}")
        
        if referral.contact_numbers:
            print(f"   Number of contacts: {len(referral.contact_numbers)}")
            for i, number in enumerate(referral.contact_numbers, 1):
                print(f"      {i}. {number}")
        else:
            print("   (No contact numbers stored)")
else:
    print("   No referrals found in database")

# Check UserProfile contact_numbers for comparison
print("\n3. Checking UserProfile contact_numbers (for referrers)...")
referrer_profiles = UserProfile.objects.filter(role='referrer')[:3]

if referrer_profiles:
    for profile in referrer_profiles:
        print(f"\n   User: {profile.user.username}")
        print(f"   Hospital: {profile.hospital_name}")
        print(f"   Contact Numbers (from profile): {profile.contact_numbers}")
else:
    print("   No referrer profiles found")

print("\n" + "="*60)
print("TEST COMPLETE")
print("="*60 + "\n")
