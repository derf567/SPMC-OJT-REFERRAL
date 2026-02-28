"""
Script to view current department contact numbers
Run this to check: python view_department_contacts.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from referrals.models import Department

def view_department_contacts():
    """Display all department contact numbers"""
    departments = Department.objects.all().order_by('name')
    
    print(f"\n{'='*70}")
    print(f"SPMC DEPARTMENT CONTACT NUMBERS")
    print(f"{'='*70}")
    print(f"{'Department Name':<40} {'Code':<25} {'Contact Number':<20}")
    print(f"{'-'*70}")
    
    for dept in departments:
        status = "✓" if dept.is_active else "✗"
        contact = dept.contact_number or "(not set)"
        print(f"{status} {dept.name:<38} {dept.code:<23} {contact:<20}")
    
    print(f"{'='*70}")
    print(f"Total Departments: {departments.count()}")
    print(f"Active: {departments.filter(is_active=True).count()}")
    print(f"Inactive: {departments.filter(is_active=False).count()}")
    
    # Check for placeholder numbers
    placeholder_count = departments.filter(contact_number__contains='0000-000-0000').count()
    if placeholder_count > 0:
        print(f"\n⚠️  WARNING: {placeholder_count} department(s) still have placeholder contact numbers!")
        print(f"   Run 'python update_department_contacts.py' to update them.")

if __name__ == '__main__':
    view_department_contacts()
