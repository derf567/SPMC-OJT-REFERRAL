"""
Script to fix existing hospital registration data
This will update the most recent referrer account with proper address fields and contact numbers

Run this with: python manage.py shell < fix_existing_registration.py
"""

from referrals.models import UserProfile
from django.contrib.auth.models import User

# Get the most recent referrer user (assuming this is the one you just registered)
try:
    referrer_profile = UserProfile.objects.filter(role='referrer').order_by('-id').first()
    
    if referrer_profile:
        print(f"\n=== Found User: {referrer_profile.user.username} ===")
        print(f"Hospital Name: {referrer_profile.hospital_name}")
        print(f"\nCurrent Data:")
        print(f"  Cellphone: {referrer_profile.cellphone}")
        print(f"  Contact Numbers: {referrer_profile.contact_numbers}")
        print(f"  Hospital Region: {referrer_profile.hospital_region}")
        print(f"  Hospital Province: {referrer_profile.hospital_province}")
        print(f"  Hospital City: {referrer_profile.hospital_city}")
        print(f"  Hospital Barangay: {referrer_profile.hospital_barangay}")
        print(f"  Hospital Street: {referrer_profile.hospital_street}")
        
        # Ask for confirmation
        print("\n" + "="*60)
        print("Do you want to update this user's data?")
        print("This will set:")
        print("  - Contact Numbers: ['09917222460', '0823456789']")
        print("  - Region: Region XI (Davao Region)")
        print("  - Province: Davao del Sur")
        print("  - City: City of Davao")
        print("  - Barangay: (leave empty if not provided)")
        print("="*60)
        
        response = input("\nType 'yes' to proceed: ")
        
        if response.lower() == 'yes':
            # Update the profile
            referrer_profile.contact_numbers = ['09917222460', '0823456789']
            referrer_profile.hospital_region = 'Region XI (Davao Region)'
            referrer_profile.hospital_province = 'Davao del Sur'
            referrer_profile.hospital_city = 'City of Davao'
            # Keep existing barangay and street
            referrer_profile.save()
            
            print("\n✓ Profile updated successfully!")
            print("\nUpdated Data:")
            print(f"  Contact Numbers: {referrer_profile.contact_numbers}")
            print(f"  Hospital Region: {referrer_profile.hospital_region}")
            print(f"  Hospital Province: {referrer_profile.hospital_province}")
            print(f"  Hospital City: {referrer_profile.hospital_city}")
            print(f"  Hospital Barangay: {referrer_profile.hospital_barangay}")
            print(f"  Hospital Street: {referrer_profile.hospital_street}")
            
            print("\nYou can now check the Django admin to see the updated data!")
        else:
            print("\nUpdate cancelled.")
    else:
        print("No referrer profiles found in the database")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
