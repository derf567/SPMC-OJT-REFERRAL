from django.contrib.auth.models import User
from referrals.models import UserProfile

print("\n" + "="*60)
print("CHECKING ALL USERS AND DOCTORS")
print("="*60)

print("\n=== ALL USERS ===")
all_users = User.objects.all()
print(f"Total users: {all_users.count()}")

print("\n=== USERS WITH PROFILES ===")
users_with_profiles = User.objects.filter(profile__isnull=False)
print(f"Users with profiles: {users_with_profiles.count()}")
for u in users_with_profiles:
    print(f"  {u.username} - Role: {u.profile.role}, Active: {u.is_active}")

print("\n=== DOCTOR USERS ===")
doctors = User.objects.filter(profile__role='doctor')
print(f"Total doctors: {doctors.count()}")
for d in doctors:
    print(f"  {d.username} - {d.get_full_name()}")
    print(f"    Department: {d.profile.department}")
    print(f"    Active: {d.is_active}")
    print(f"    Date joined: {d.date_joined}")

print("\n=== RECENT REGISTRATIONS (Last 5) ===")
recent = User.objects.all().order_by('-date_joined')[:5]
for u in recent:
    has_profile = hasattr(u, 'profile')
    role = u.profile.role if has_profile else 'No profile'
    print(f"  {u.username} - {role}, Active: {u.is_active}, Joined: {u.date_joined}")

print("\n" + "="*60)
