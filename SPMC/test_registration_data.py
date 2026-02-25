"""
Test script to verify registration data is saved correctly
Run this after registering a test account
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from django.contrib.auth.models import User
from referrals.models import UserProfile

# Get the most recent user
try:
    latest_user = User.objects.latest('date_joined')
    print(f"\n=== Latest Registered User ===")
    print(f"Username: {latest_user.username}")
    print(f"Email: {latest_user.email}")
    print(f"Full Name: {latest_user.get_full_name()}")
    print(f"Date Joined: {latest_user.date_joined}")
    
    if hasattr(latest_user, 'profile'):
        profile = latest_user.profile
        print(f"\n=== User Profile ===")
        print(f"Role: {profile.role}")
        print(f"Hospital Name: {profile.hospital_name}")
        print(f"Hospital DOH Level: {profile.hospital_doh_level}")
        print(f"\n=== Address Information ===")
        print(f"Region: {profile.hospital_region}")
        print(f"Province: {profile.hospital_province}")
        print(f"City: {profile.hospital_city}")
        print(f"Barangay: {profile.hospital_barangay}")
        print(f"Street/Complete Address: {profile.hospital_street}")
        print(f"District: {profile.hospital_district}")
        print(f"\n=== Contact Information ===")
        print(f"Contact Numbers: {profile.contact_numbers}")
        print(f"Cellphone: {profile.cellphone}")
        print(f"\n=== Location ===")
        print(f"Inside Davao: {profile.is_inside_davao}")
        print(f"Hospital Location (old field): {profile.hospital_location}")
    else:
        print("\nNo profile found for this user")
        
except User.DoesNotExist:
    print("No users found in database")
except Exception as e:
    print(f"Error: {e}")
