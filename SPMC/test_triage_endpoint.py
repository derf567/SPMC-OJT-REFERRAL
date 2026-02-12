#!/usr/bin/env python
"""Test script to debug the accept_with_triage_decision endpoint"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from django.contrib.auth.models import User
from referrals.models import Referral
from django.utils import timezone

# Get referral 13
try:
    referral = Referral.objects.get(pk=13)
    print(f"Referral ID: {referral.referral_id}")
    print(f"Current Status: {referral.status}")
    print(f"Patient: {referral.patient_full_name}")
    
    # Check if fields exist
    print(f"\nField checks:")
    print(f"Has triaged_by field: {hasattr(referral, 'triaged_by')}")
    print(f"Has triaged_at field: {hasattr(referral, 'triaged_at')}")
    print(f"triaged_by value: {referral.triaged_by}")
    print(f"triaged_at value: {referral.triaged_at}")
    
    # Try to get a user
    user = User.objects.first()
    if user:
        print(f"\nUser info:")
        print(f"Username: {user.username}")
        print(f"Full name: {user.get_full_name()}")
        print(f"First name: {user.first_name}")
        print(f"Last name: {user.last_name}")
        
        # Try to simulate the operation
        print(f"\nSimulating triage operation...")
        referral.triaged_by = user
        referral.triaged_at = timezone.now()
        print(f"triaged_by set to: {referral.triaged_by}")
        print(f"triaged_at set to: {referral.triaged_at}")
        print(f"get_full_name(): {user.get_full_name()}")
        
except Referral.DoesNotExist:
    print("Referral with ID 13 does not exist")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
