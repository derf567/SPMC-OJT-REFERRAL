#!/usr/bin/env python
"""Debug script to check the actual error"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from referrals.models import Referral
from django.contrib.auth.models import User
from django.utils import timezone

# Get referral 13
referral = Referral.objects.get(pk=13)
print(f"Referral: {referral.referral_id}")
print(f"Status: {referral.status}")

# Get a user
user = User.objects.first()
print(f"User: {user.username}")

# Try to simulate what the view does
triage_decision = 'schedule_opd'
scheduled_date = '2026-02-15'
scheduled_time = '08:00'

print(f"\nTrying to set:")
print(f"  triage_decision: {triage_decision}")
print(f"  scheduled_date: {scheduled_date}")
print(f"  scheduled_time: {scheduled_time}")

# Parse time
from datetime import datetime
time_formats = ['%H:%M', '%I:%M %p', '%I:%M%p']
time_obj = None
for time_format in time_formats:
    try:
        time_obj = datetime.strptime(scheduled_time, time_format).time()
        print(f"  Parsed time: {time_obj} (format: {time_format})")
        break
    except ValueError:
        continue

# Try to set the fields
try:
    referral.triage_decision = triage_decision
    referral.triage_notes = 'Test'
    referral.triaged_by = user
    referral.triaged_at = timezone.now()
    referral.status = 'schedule_opd'
    referral.scheduled_date = scheduled_date
    referral.scheduled_time = time_obj
    
    print("\nAll fields set successfully!")
    print(f"  referral.scheduled_time type: {type(referral.scheduled_time)}")
    print(f"  referral.scheduled_time value: {referral.scheduled_time}")
    
    # Try to save
    referral.save()
    print("\n✓ Saved successfully!")
    
except Exception as e:
    print(f"\n✗ Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
