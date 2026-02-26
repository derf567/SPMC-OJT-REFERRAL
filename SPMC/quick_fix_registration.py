"""
Quick fix for the most recent hospital registration
Run with: python manage.py shell
Then paste this code
"""

from referrals.models import UserProfile

# Get the most recent referrer (your Davao Doctors Hospital account)
profile = UserProfile.objects.filter(role='referrer', hospital_name='Davao Doctors Hospital').first()

if profile:
    print(f"Found: {profile.user.username} - {profile.hospital_name}")
    
    # Update contact numbers
    profile.contact_numbers = ['09917222460', '0823456789']
    
    # Update address fields
    profile.hospital_region = 'Region XI (Davao Region)'
    profile.hospital_province = 'Davao del Sur'
    profile.hospital_city = 'City of Davao'
    # hospital_barangay and hospital_street should already be set
    
    profile.save()
    
    print("\n✓ Updated successfully!")
    print(f"Contact Numbers: {profile.contact_numbers}")
    print(f"Region: {profile.hospital_region}")
    print(f"Province: {profile.hospital_province}")
    print(f"City: {profile.hospital_city}")
    print(f"Barangay: {profile.hospital_barangay}")
    print(f"Street: {profile.hospital_street}")
else:
    print("Profile not found. Try this instead:")
    print("\nprofile = UserProfile.objects.filter(role='referrer').order_by('-id').first()")
    print("profile.contact_numbers = ['09917222460', '0823456789']")
    print("profile.hospital_region = 'Region XI (Davao Region)'")
    print("profile.hospital_province = 'Davao del Sur'")
    print("profile.hospital_city = 'City of Davao'")
    print("profile.save()")
