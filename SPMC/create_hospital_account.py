#!/usr/bin/env python
"""
Script to delete old referrer account and create a sample hospital account
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from django.contrib.auth.models import User
from referrals.models import ReferrerAccount, UserProfile

def delete_old_account():
    """Delete the Fred/Fred123 account"""
    try:
        # Find and delete Fred account
        user = User.objects.filter(username='Fred').first()
        if user:
            print(f"Deleting user: {user.username}")
            user.delete()
            print("✅ Fred account deleted successfully")
        else:
            print("ℹ️  Fred account not found")
    except Exception as e:
        print(f"❌ Error deleting Fred account: {e}")

def create_hospital_account():
    """Create a sample hospital account"""
    try:
        # Check if hospital account already exists
        if User.objects.filter(username='davao_doctors').exists():
            print("ℹ️  Hospital account already exists")
            return
        
        # Create user account
        user = User.objects.create_user(
            username='davao_doctors',
            email='admin@davaodoctors.com',
            password='hospital123',
            first_name='Davao',
            last_name='Doctors Hospital',
            is_active=True  # Pre-approved for testing
        )
        print(f"✅ Created user: {user.username}")
        
        # Create user profile
        profile = UserProfile.objects.create(
            user=user,
            role='referrer',
            hospital_name='Davao Doctors Hospital',
            hospital_location='J.P. Laurel Avenue, Bajada, Davao City',
            contact_number='082-222-8000',
            is_inside_davao=True,
            contact_numbers=['082-222-8000', '082-222-8001', '0917-123-4567'],
            hospital_doh_level='tertiary'
        )
        print(f"✅ Created profile for: {profile.hospital_name}")
        
        # Create referrer account
        referrer = ReferrerAccount.objects.create(
            user=user,
            first_name='Davao Doctors',
            last_name='Hospital',
            referrer_type='hospital_employee',
            approval_status='approved',
            hospital_name='Davao Doctors Hospital',
            hospital_doh_level='tertiary',
            hospital_location='J.P. Laurel Avenue, Bajada, Davao City',
            contact_numbers=['082-222-8000', '082-222-8001', '0917-123-4567']
        )
        print(f"✅ Created referrer account: {referrer.hospital_name}")
        
        print("\n" + "="*60)
        print("🎉 Hospital Account Created Successfully!")
        print("="*60)
        print(f"Username: davao_doctors")
        print(f"Password: hospital123")
        print(f"Hospital: Davao Doctors Hospital")
        print(f"Location: J.P. Laurel Avenue, Bajada, Davao City")
        print(f"Status: Approved (Ready to use)")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error creating hospital account: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    print("Starting account management...")
    print("-" * 60)
    
    # Delete old account
    delete_old_account()
    print()
    
    # Create new hospital account
    create_hospital_account()
    
    print("\n✅ Done!")
