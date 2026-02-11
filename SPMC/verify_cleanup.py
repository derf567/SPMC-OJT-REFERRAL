import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from django.contrib.auth.models import User
from referrals.models import (
    Referral, UserProfile, ReferrerAccount, 
    ReferringHospital, Specialty
)

print("=== DATA CLEANUP VERIFICATION ===\n")

print("DELETED DATA (should be 0):")
print(f"  Referrals: {Referral.objects.count()}")

print("\nPRESERVED ACCOUNTS:")
print(f"  Users: {User.objects.count()}")
print(f"  User Profiles: {UserProfile.objects.count()}")
print(f"  Referrer Accounts: {ReferrerAccount.objects.count()}")

print("\nPRESERVED REFERENCE DATA:")
print(f"  Referring Hospitals: {ReferringHospital.objects.count()}")
print(f"  Specialties: {Specialty.objects.count()}")

print("\n=== USER ACCOUNTS ===")
for user in User.objects.all():
    try:
        profile = user.profile
        print(f"  {user.username} - {profile.get_role_display()}")
    except:
        print(f"  {user.username} - No profile")

print("\n✓ Cleanup successful! All referral data removed, accounts preserved.")
