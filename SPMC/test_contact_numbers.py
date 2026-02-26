"""
Test script to verify contact_numbers are being saved correctly
Run this with: python manage.py shell < test_contact_numbers.py
"""

from referrals.models import UserProfile
from django.contrib.auth.models import User

# Get the most recent referrer user
try:
    referrer_profile = UserProfile.objects.filter(role='referrer').order_by('-id').first()
    
    if referrer_profile:
        print(f"\n=== Testing Contact Numbers for User: {referrer_profile.user.username} ===")
        print(f"Hospital Name: {referrer_profile.hospital_name}")
        print(f"Cellphone (old field): {referrer_profile.cellphone}")
        print(f"Contact Numbers (new field): {referrer_profile.contact_numbers}")
        print(f"Type of contact_numbers: {type(referrer_profile.contact_numbers)}")
        
        if referrer_profile.contact_numbers:
            print(f"\nNumber of contact numbers: {len(referrer_profile.contact_numbers)}")
            for i, number in enumerate(referrer_profile.contact_numbers, 1):
                print(f"  {i}. {number}")
        else:
            print("\nNo contact numbers found in the contact_numbers field!")
    else:
        print("No referrer profiles found in the database")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
