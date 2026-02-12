#!/usr/bin/env python
"""
Script to create 10 dummy unassigned doctors for testing the drag-and-drop assignment feature.
"""
import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from django.contrib.auth.models import User
from referrals.models import UserProfile, ReferrerAccount, Specialty
from django.db import transaction

DUMMY_DOCTORS = [
    {"first_name": "Maria", "last_name": "Santos", "email": "maria.santos@example.com", "gender": "female"},
    {"first_name": "Juan", "last_name": "Dela Cruz", "email": "juan.delacruz@example.com", "gender": "male"},
    {"first_name": "Ana", "last_name": "Reyes", "email": "ana.reyes@example.com", "gender": "female"},
    {"first_name": "Pedro", "last_name": "Garcia", "email": "pedro.garcia@example.com", "gender": "male"},
    {"first_name": "Rosa", "last_name": "Mendoza", "email": "rosa.mendoza@example.com", "gender": "female"},
    {"first_name": "Carlos", "last_name": "Ramos", "email": "carlos.ramos@example.com", "gender": "male"},
    {"first_name": "Elena", "last_name": "Torres", "email": "elena.torres@example.com", "gender": "female"},
    {"first_name": "Miguel", "last_name": "Flores", "email": "miguel.flores@example.com", "gender": "male"},
    {"first_name": "Sofia", "last_name": "Cruz", "email": "sofia.cruz@example.com", "gender": "female"},
    {"first_name": "Diego", "last_name": "Morales", "email": "diego.morales@example.com", "gender": "male"},
]

@transaction.atomic
def create_dummy_doctors():
    """Create 10 dummy unassigned doctors"""
    print("Creating 10 dummy unassigned doctors...")
    
    created_count = 0
    skipped_count = 0
    
    for doctor_data in DUMMY_DOCTORS:
        email = doctor_data["email"]
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            print(f"⚠️  Skipping {doctor_data['first_name']} {doctor_data['last_name']} - email already exists")
            skipped_count += 1
            continue
        
        # Create User
        user = User.objects.create_user(
            username=email.split('@')[0],
            email=email,
            first_name=doctor_data["first_name"],
            last_name=doctor_data["last_name"],
            password="DummyDoctor123!"  # Default password for testing
        )
        
        # Create ReferrerAccount (approved doctor)
        referrer_account = ReferrerAccount.objects.create(
            user=user,
            first_name=doctor_data["first_name"],
            last_name=doctor_data["last_name"],
            referrer_type='doctor',
            approval_status='approved',
            gender=doctor_data["gender"],
            age=30 + created_count,  # Varying ages
        )
        
        # Create UserProfile WITHOUT department (unassigned)
        UserProfile.objects.create(
            user=user,
            role='referrer',  # Initially as referrer
            department=None,  # No department assigned
            contact_number=f"+639{100000000 + created_count}"
        )
        
        print(f"✅ Created: Dr. {doctor_data['first_name']} {doctor_data['last_name']} ({email})")
        created_count += 1
    
    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  ✅ Created: {created_count} doctors")
    print(f"  ⚠️  Skipped: {skipped_count} doctors (already exist)")
    print(f"{'='*60}")
    print(f"\nAll dummy doctors have been created with:")
    print(f"  - Default password: DummyDoctor123!")
    print(f"  - Status: Approved")
    print(f"  - Department: Unassigned (None)")
    print(f"\nYou can now use the drag-and-drop interface to assign them to departments.")

if __name__ == '__main__':
    try:
        create_dummy_doctors()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
