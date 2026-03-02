#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from django.contrib.auth.models import User
from referrals.models import Referral

print("=== Testing Fred's Referral Access ===\n")

# Get Fred
fred = User.objects.get(username='fred')
print(f"Fred's department: {fred.profile.department}")
print()

# Get all referrals
all_referrals = Referral.objects.all()
print(f"Total referrals in system: {all_referrals.count()}")
print()

# Simple filter by assigned_department
user_department = fred.profile.department
filtered_referrals = Referral.objects.filter(assigned_department=user_department)

print(f"Referrals Fred should see: {filtered_referrals.count()}")
print()

if filtered_referrals.exists():
    print("Referrals Fred can see:")
    for ref in filtered_referrals:
        print(f"  - ID: {ref.id}, Referral ID: {ref.referral_id}")
        print(f"    Patient: {ref.patient_full_name}")
        print(f"    Status: {ref.status}")
        print(f"    Department: {ref.assigned_department}")
        print()
else:
    print("No referrals found for Fred's department (surgery)")
    print()
    print("Available referrals:")
    for ref in all_referrals:
        print(f"  - ID: {ref.id}, Dept: '{ref.assigned_department}'")
