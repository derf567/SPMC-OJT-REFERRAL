#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from django.contrib.auth.models import User

print("=== Doctor Account Status ===\n")

doctors = User.objects.filter(profile__role='doctor')
print(f"Total doctors: {doctors.count()}\n")

for doctor in doctors:
    status = "APPROVED (Active)" if doctor.is_active else "PENDING (Inactive)"
    print(f"Username: {doctor.username}")
    print(f"Full Name: {doctor.get_full_name()}")
    print(f"Email: {doctor.email}")
    print(f"Department: {doctor.profile.department}")
    print(f"Status: {status}")
    print(f"Can login: {'Yes' if doctor.is_active else 'No'}")
    print()

print("=== Summary ===")
print(f"Pending doctors: {doctors.filter(is_active=False).count()}")
print(f"Approved doctors: {doctors.filter(is_active=True).count()}")
