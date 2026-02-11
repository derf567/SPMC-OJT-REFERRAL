#!/usr/bin/env python
"""
Test the API endpoint for pending referrer accounts
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from django.contrib.auth.models import User
from referrals.models import ReferrerAccount
from rest_framework.authtoken.models import Token

def test_api_endpoint():
    print("\n" + "="*60)
    print("TESTING API ENDPOINT")
    print("="*60 + "\n")
    
    # Get admin user
    admin = User.objects.filter(is_staff=True).first()
    if not admin:
        print("❌ No admin user found!")
        return
    
    print(f"✅ Admin user: {admin.username}")
    
    # Get or create token
    token, created = Token.objects.get_or_create(user=admin)
    print(f"✅ Token: {token.key}")
    
    # Get pending accounts
    pending = ReferrerAccount.objects.filter(approval_status='pending')
    print(f"\n📋 Pending accounts: {pending.count()}")
    
    for account in pending:
        print(f"\n  Account ID: {account.id}")
        print(f"  Name: {account.first_name} {account.last_name}")
        print(f"  Username: {account.user.username}")
        print(f"  Email: {account.user.email}")
        print(f"  Type: {account.get_referrer_type_display()}")
        print(f"  Created: {account.created_at.isoformat()}")
        print(f"  Status: {account.approval_status}")
    
    print("\n" + "="*60)
    print("TEST CURL COMMAND")
    print("="*60)
    print(f"\ncurl -H 'Authorization: Token {token.key}' \\")
    print(f"     http://localhost:8000/api/referrers/?approval_status=pending")
    print()

if __name__ == '__main__':
    test_api_endpoint()
