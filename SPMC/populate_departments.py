"""
Script to populate initial departments with contact numbers
Run this after migration: python populate_departments.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from referrals.models import Department

# Department data with placeholder contact numbers
# Admin should update these with actual contact numbers
departments_data = [
    {'code': 'emergency', 'name': 'Emergency Department', 'contact_number': '0000-000-0000'},
    {'code': 'internal_medicine', 'name': 'Internal Medicine', 'contact_number': '0000-000-0000'},
    {'code': 'surgery', 'name': 'Surgery Department', 'contact_number': '0000-000-0000'},
    {'code': 'obstetrics_gynecology', 'name': 'Obstetrics and Gynecology', 'contact_number': '0000-000-0000'},
    {'code': 'pediatrics', 'name': 'Pediatrics', 'contact_number': '0000-000-0000'},
    {'code': 'orthopedics', 'name': 'Orthopedics', 'contact_number': '0000-000-0000'},
    {'code': 'cardiology', 'name': 'Cardiology', 'contact_number': '0000-000-0000'},
    {'code': 'neurology', 'name': 'Neurology', 'contact_number': '0000-000-0000'},
    {'code': 'anesthesiology', 'name': 'Anesthesiology', 'contact_number': '0000-000-0000'},
    {'code': 'radiology', 'name': 'Radiology', 'contact_number': '0000-000-0000'},
    {'code': 'pathology', 'name': 'Pathology', 'contact_number': '0000-000-0000'},
    {'code': 'other', 'name': 'Other Department', 'contact_number': '0000-000-0000'},
]

def populate_departments():
    """Create or update departments"""
    created_count = 0
    updated_count = 0
    
    for dept_data in departments_data:
        dept, created = Department.objects.get_or_create(
            code=dept_data['code'],
            defaults={
                'name': dept_data['name'],
                'contact_number': dept_data['contact_number'],
                'is_active': True
            }
        )
        
        if created:
            created_count += 1
            print(f"✓ Created: {dept.name}")
        else:
            # Update name if changed
            if dept.name != dept_data['name']:
                dept.name = dept_data['name']
                dept.save()
                updated_count += 1
                print(f"✓ Updated: {dept.name}")
            else:
                print(f"  Exists: {dept.name} (Contact: {dept.contact_number})")
    
    print(f"\n{'='*50}")
    print(f"Summary:")
    print(f"  Created: {created_count}")
    print(f"  Updated: {updated_count}")
    print(f"  Total: {Department.objects.count()}")
    print(f"{'='*50}")
    print(f"\nNOTE: Default contact numbers are set to '0000-000-0000'")
    print(f"Admin should update these with actual department contact numbers.")

if __name__ == '__main__':
    print("Populating departments...\n")
    populate_departments()
