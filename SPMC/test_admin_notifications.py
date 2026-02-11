#!/usr/bin/env python
"""
Test script to verify admin notification system for new registrations
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from django.contrib.auth.models import User
from referrals.models import ReferrerAccount

def test_admin_notifications():
    print("\n" + "="*60)
    print("ADMIN NOTIFICATION SYSTEM TEST")
    print("="*60 + "\n")
    
    # Check for admin users
    print("1. Checking for admin users...")
    admins = User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
    print(f"   Found {admins.count()} admin user(s):")
    for admin in admins:
        print(f"   - {admin.username} (staff: {admin.is_staff}, superuser: {admin.is_superuser})")
    
    # Check for pending referrer accounts
    print("\n2. Checking for pending referrer accounts...")
    pending_accounts = ReferrerAccount.objects.filter(approval_status='pending')
    print(f"   Found {pending_accounts.count()} pending account(s):")
    for account in pending_accounts:
        print(f"   - {account.first_name} {account.last_name} ({account.user.username})")
        print(f"     Type: {account.get_referrer_type_display()}")
        print(f"     Created: {account.created_at}")
        print(f"     Status: {account.approval_status}")
    
    # Check for all referrer accounts by status
    print("\n3. Referrer accounts by status:")
    for status_code, status_name in ReferrerAccount.APPROVAL_STATUS_CHOICES:
        count = ReferrerAccount.objects.filter(approval_status=status_code).count()
        print(f"   - {status_name}: {count}")
    
    # Test API endpoint simulation
    print("\n4. Simulating API endpoint query...")
    print("   Query: /api/referrers/?approval_status=pending")
    pending_for_api = ReferrerAccount.objects.filter(approval_status='pending').order_by('-created_at')
    print(f"   Would return {pending_for_api.count()} record(s)")
    
    if pending_for_api.exists():
        print("\n   Sample data that would be returned:")
        for account in pending_for_api[:3]:  # Show first 3
            print(f"   - ID: {account.id}")
            print(f"     Name: {account.first_name} {account.last_name}")
            print(f"     Username: {account.user.username}")
            print(f"     Created: {account.created_at.isoformat()}")
            print(f"     Type: {account.referrer_type}")
            print()
    
    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60 + "\n")
    
    # Recommendations
    print("RECOMMENDATIONS:")
    if admins.count() == 0:
        print("⚠️  No admin users found! Create an admin user first.")
    if pending_accounts.count() == 0:
        print("ℹ️  No pending accounts. Register a new referrer to test notifications.")
    else:
        print("✅ System is ready for testing!")
        print("   1. Log in as an admin user")
        print("   2. Open browser console (F12)")
        print("   3. Look for notification logs starting with 🔔 or 🟣")
        print("   4. Notifications should appear after 5 seconds")

if __name__ == '__main__':
    test_admin_notifications()
