from django.contrib.auth.models import User
from referrals.models import UserProfile

# Check admin user
admin = User.objects.filter(is_staff=True).first()
if admin:
    print(f"Admin user: {admin.username}")
    print(f"is_staff: {admin.is_staff}")
    
    # Check if profile exists
    try:
        profile = admin.profile
        print(f"Has profile: Yes")
        print(f"Profile role: {profile.role}")
    except UserProfile.DoesNotExist:
        print(f"Has profile: No")
        print("Creating admin profile...")
        profile = UserProfile.objects.create(user=admin, role='admin')
        print(f"Profile created with role: {profile.role}")
else:
    print("No admin user found")

# Check doctor
doctor = User.objects.filter(profile__role='doctor').first()
if doctor:
    print(f"\nDoctor user: {doctor.username}")
    print(f"is_active: {doctor.is_active}")
    print(f"Profile role: {doctor.profile.role}")
    print(f"Department: {doctor.profile.department}")
