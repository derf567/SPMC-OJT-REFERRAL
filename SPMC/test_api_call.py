#!/usr/bin/env python
"""Test the actual API endpoint with a real request"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from referrals.models import Referral

# Create a test client
client = Client()

# Get a triage user
try:
    triage_user = User.objects.filter(profile__role='triage').first()
    if not triage_user:
        print("Creating a test triage user...")
        from referrals.models import UserProfile
        triage_user = User.objects.create_user(
            username='test_triage',
            password='testpass123',
            first_name='Test',
            last_name='Triage'
        )
        UserProfile.objects.create(
            user=triage_user,
            role='triage',
            department='emergency'
        )
    
    print(f"Using triage user: {triage_user.username}")
    print(f"User permissions: can_triage_referrals = {triage_user.profile.can_triage_referrals}")
    
    # Get referral 13
    referral = Referral.objects.get(pk=13)
    print(f"\nReferral: {referral.referral_id}")
    print(f"Status: {referral.status}")
    
    # Login
    client.force_login(triage_user)
    
    # Make the API call
    response = client.post(
        f'/api/referrals/{referral.pk}/accept_with_triage_decision/',
        data=json.dumps({
            'triage_decision': 'schedule_opd',
            'triage_notes': 'Test scheduling',
            'scheduled_date': '2026-02-15',
            'scheduled_time': '08:00'
        }),
        content_type='application/json'
    )
    
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Content: {response.content.decode()}")
    
    if response.status_code == 200:
        print("\n✓ SUCCESS! The endpoint is working.")
        # Refresh referral
        referral.refresh_from_db()
        print(f"New status: {referral.status}")
        print(f"Triage decision: {referral.triage_decision}")
        print(f"Scheduled date: {referral.scheduled_date}")
        print(f"Scheduled time: {referral.scheduled_time}")
    else:
        print("\n✗ FAILED!")
        
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
