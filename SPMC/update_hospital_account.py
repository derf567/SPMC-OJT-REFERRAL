#!/usr/bin/env python
"""
Script to update existing hospital account with new fields
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from django.contrib.auth.models import User
from referrals.models import UserProfile

def update_hospital_account():
    """Update the Davao Doctors Hospital account with new fields"""
    try:
        # Find the hospital account
        user = User.objects.filter(username='davao_doctors').first()
        if not user:
            print("❌ Hospital account 'davao_doctors' not found")
            print("   Please run create_hospital_account.py first")
            return
        
        print(f"Found user: {user.username}")
        
        # Get or create profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        # Update profile with hospital information
        profile.role = 'referrer'
        profile.hospital_name = 'Davao Doctors Hospital'
        profile.hospital_location = 'J.P. Laurel Avenue, Bajada, Davao City'
        profile.is_inside_davao = True
        profile.contact_number = '082-222-8000'
        
        # Set new fields
        profile.contact_numbers = ['082-222-8000', '082-222-8001', '0917-123-4567']
        profile.hospital_doh_level = 'tertiary'
        
        profile.save()
        
        print("\n" + "="*60)
        print("🎉 Hospital Account Updated Successfully!")
        print("="*60)
        print(f"Username: {user.username}")
        print(f"Hospital: {profile.hospital_name}")
        print(f"Location: {profile.hospital_location}")
        print(f"DOH Level: {profile.hospital_doh_level}")
        print(f"Contact Numbers: {profile.contact_numbers}")
        print(f"Inside Davao: {profile.is_inside_davao}")
        print("="*60)
        print("\n✅ The hospital information will now auto-fill in the referral form!")
        
    except Exception as e:
        print(f"❌ Error updating hospital account: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    print("Updating hospital account...")
    print("-" * 60)
    update_hospital_account()
    print("\n✅ Done!")
