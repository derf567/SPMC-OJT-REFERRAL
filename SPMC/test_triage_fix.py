#!/usr/bin/env python
"""Test script to verify the triage endpoint fix"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth.models import User
from referrals.models import Referral
from referrals.views import ReferralViewSet
from rest_framework.test import force_authenticate

# Get referral 13
try:
    referral = Referral.objects.get(pk=13)
    print(f"Testing with Referral: {referral.referral_id}")
    print(f"Current Status: {referral.status}")
    
    # Get a triage user
    triage_user = User.objects.filter(profile__role='triage').first()
    if not triage_user:
        print("No triage user found, using first user")
        triage_user = User.objects.first()
    
    print(f"Using user: {triage_user.username}")
    
    # Create a request
    factory = RequestFactory()
    request = factory.post(
        f'/api/referrals/{referral.pk}/accept_with_triage_decision/',
        data=json.dumps({
            'triage_decision': 'schedule_opd',
            'triage_notes': 'Test notes',
            'scheduled_date': '2026-02-15',
            'scheduled_time': '10:00'
        }),
        content_type='application/json'
    )
    force_authenticate(request, user=triage_user)
    
    # Call the view
    view = ReferralViewSet.as_view({'post': 'accept_with_triage_decision'})
    response = view(request, pk=referral.pk)
    
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Data: {json.dumps(response.data, indent=2)}")
    
    if response.status_code == 200:
        print("\n✓ SUCCESS! The endpoint is working correctly.")
    else:
        print("\n✗ FAILED! There's still an issue.")
        
except Referral.DoesNotExist:
    print("Referral with ID 13 does not exist")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
