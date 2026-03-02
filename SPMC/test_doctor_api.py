#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from django.contrib.auth.models import User
from referrals.models import UserProfile

print("=== Testing Doctor API ===\n")

# Check admin user
print("1. Checking admin user...")
admin = User.objects.filter(is_staff=True).first()
if admin:
    print(f"   Admin: {admin.username}, is_staff={admin.is_staff}")
    try:
        profile = admin.profile
        print(f"   Has profile: Yes, role={profile.role}")
    except UserProfile.DoesNotExist:
        print(f"   Has profile: No - Creating one...")
        profile = UserProfile.objects.create(user=admin, role='admin')
        print(f"   Profile created with role: {profile.role}")
else:
    print("   No admin user found!")

# Check doctors
print("\n2. Checking doctors...")
doctors = User.objects.filter(profile__role='doctor')
print(f"   Total doctors: {doctors.count()}")
for doctor in doctors:
    print(f"   - {doctor.username}: active={doctor.is_active}, dept={doctor.profile.department}")

# Test the API view directly
print("\n3. Testing pending_doctors_view...")
from django.test import RequestFactory
from rest_framework.authtoken.models import Token
from referrals.authentication import pending_doctors_view

factory = RequestFactory()
request = factory.get('/api/admin/pending-doctors/')
request.user = admin

# Get or create token
token, created = Token.objects.get_or_create(user=admin)
print(f"   Admin token: {token.key}")

try:
    response = pending_doctors_view(request)
    print(f"   Response status: {response.status_code}")
    print(f"   Response data: {response.data}")
except Exception as e:
    print(f"   Error: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n=== Test Complete ===")
