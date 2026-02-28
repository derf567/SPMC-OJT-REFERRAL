"""
Script to update department contact numbers with actual SPMC numbers
Run this to update: python update_department_contacts.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from referrals.models import Department

# SPMC Department Contact Numbers
# Note: These are placeholder numbers - replace with actual SPMC department numbers
department_contacts = {
    'emergency': '082-227-2731',  # SPMC Emergency Hotline
    'internal_medicine': '082-227-2732',  # Placeholder - update with actual
    'surgery': '082-227-2733',  # Placeholder - update with actual
    'obstetrics_gynecology': '082-227-2734',  # Placeholder - update with actual
    'pediatrics': '082-227-2735',  # Placeholder - update with actual
    'orthopedics': '082-227-2736',  # Placeholder - update with actual
    'cardiology': '082-227-2737',  # Placeholder - update with actual
    'neurology': '082-227-2738',  # Placeholder - update with actual
    'anesthesiology': '082-227-2739',  # Placeholder - update with actual
    'radiology': '082-227-2740',  # Placeholder - update with actual
    'pathology': '082-227-2741',  # Placeholder - update with actual
    'other': '082-227-2731',  # Use main emergency hotline
}

def update_department_contacts():
    """Update department contact numbers"""
    updated_count = 0
    not_found = []
    
    print("Updating department contact numbers...\n")
    print(f"{'='*70}")
    
    for code, contact_number in department_contacts.items():
        try:
            dept = Department.objects.get(code=code)
            old_contact = dept.contact_number
            dept.contact_number = contact_number
            dept.save()
            
            updated_count += 1
            print(f"✓ {dept.name:40} {old_contact:20} → {contact_number}")
            
        except Department.DoesNotExist:
            not_found.append(code)
            print(f"✗ Department not found: {code}")
    
    print(f"{'='*70}")
    print(f"\nSummary:")
    print(f"  Updated: {updated_count} departments")
    
    if not_found:
        print(f"  Not Found: {len(not_found)} departments")
        print(f"  Missing: {', '.join(not_found)}")
    
    print(f"\n{'='*70}")
    print(f"IMPORTANT NOTES:")
    print(f"{'='*70}")
    print(f"1. The contact numbers above are PLACEHOLDERS")
    print(f"2. Please update this script with ACTUAL SPMC department numbers")
    print(f"3. Contact SPMC administration to get the correct numbers")
    print(f"4. Run this script again after updating the numbers")
    print(f"\nTo manually update a department contact:")
    print(f"  dept = Department.objects.get(code='emergency')")
    print(f"  dept.contact_number = '082-XXX-XXXX'")
    print(f"  dept.save()")

if __name__ == '__main__':
    update_department_contacts()
