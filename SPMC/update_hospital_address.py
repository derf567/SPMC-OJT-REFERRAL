#!/usr/bin/env python
"""
Script to update hospital account with detailed address fields
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

def update_hospital_address():
    """Update the Davao Doctors Hospital account with detailed address fields"""
    try:
        # Find the hospital account
        user = User.objects.filter(username='davao_doctors').first()
        if not user:
            print("❌ Hospital account 'davao_doctors' not found")
            return
        
        print(f"Found user: {user.username}")
        
        # Get profile
        profile = UserProfile.objects.get(user=user)
        
        # Update profile with detailed address information
        profile.hospital_region = 'Region XI (Davao Region)'
        profile.hospital_street = 'J.P. Laurel Avenue'
        profile.hospital_barangay = 'Bajada'
        profile.hospital_district = 'Poblacion District'
        profile.hospital_city = 'Davao City'
        profile.hospital_province = 'Davao del Sur'
        
        profile.save()
        
        print("\n" + "="*60)
        print("🎉 Hospital Address Updated Successfully!")
        print("="*60)
        print(f"Hospital: {profile.hospital_name}")
        print(f"Region: {profile.hospital_region}")
        print(f"Province: {profile.hospital_province}")
        print(f"City: {profile.hospital_city}")
        print(f"Barangay: {profile.hospital_barangay}")
        print(f"Street: {profile.hospital_street}")
        print(f"District: {profile.hospital_district}")
        print("="*60)
        print("\n✅ The detailed address fields will now auto-fill in the referral form!")
        
    except Exception as e:
        print(f"❌ Error updating hospital address: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    print("Updating hospital address...")
    print("-" * 60)
    update_hospital_address()
    print("\n✅ Done!")
