#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from django.contrib.auth.models import User
from referrals.models import Referral
from django.db.models import Q

print("=== Testing Fred's Referral Access ===\n")

# Get Fred
fred = User.objects.get(username='fred')
print(f"Fred's department: {fred.profile.department}")
print(f"Fred is_doctor: {fred.profile.is_doctor}")
print()

# Get all referrals
all_referrals = Referral.objects.all()
print(f"Total referrals in system: {all_referrals.count()}")
print()

# Apply the same filter as the backend
user_department = fred.profile.department
filtered_referrals = Referral.objects.filter(
    Q(assigned_departments__contains=[user_department]) |
    Q(assigned_department=user_department)
)

print(f"Referrals Fred should see (filtered): {filtered_referrals.count()}")
print()

if filtered_referrals.exists():
    print("Referrals Fred can see:")
    for ref in filtered_referrals:
        print(f"  - ID: {ref.id}")
        print(f"    Patient: {ref.patient_full_name}")
        print(f"    Status: {ref.status}")
        print(f"    assigned_department: {ref.assigned_department}")
        print(f"    assigned_departments: {ref.assigned_departments}")
        print()
else:
    print("No referrals found for Fred's department")
    print()
    print("Let's check what departments are assigned:")
    for ref in all_referrals[:5]:
        print(f"  - ID: {ref.id}")
        print(f"    assigned_department: {ref.assigned_department}")
        print(f"    assigned_departments: {ref.assigned_departments}")
        print()
