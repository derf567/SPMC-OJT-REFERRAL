#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from referrals.models import Referral
from django.utils import timezone
from datetime import timedelta

# Get today's date range
today = timezone.now().date()
today_start = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
today_end = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.max.time()))

# Get yesterday's date range
yesterday = today - timedelta(days=1)
yesterday_start = timezone.make_aware(timezone.datetime.combine(yesterday, timezone.datetime.min.time()))
yesterday_end = timezone.make_aware(timezone.datetime.combine(yesterday, timezone.datetime.max.time()))

print("Dashboard Stats Test:")
print("=" * 50)
print(f"Total referrals today: {Referral.objects.filter(created_at__gte=today_start, created_at__lte=today_end).count()}")
print(f"Total referrals yesterday: {Referral.objects.filter(created_at__gte=yesterday_start, created_at__lte=yesterday_end).count()}")
print(f"Pending cases: {Referral.objects.filter(status='pending').count()}")
print(f"Critical cases: {Referral.objects.filter(priority='critical').count()}")
print(f"Completed today: {Referral.objects.filter(status='completed', updated_at__gte=today_start, updated_at__lte=today_end).count()}")
print(f"Completed yesterday: {Referral.objects.filter(status='completed', updated_at__gte=yesterday_start, updated_at__lte=yesterday_end).count()}")
print(f"Total unique patients: {Referral.objects.values('patient_full_name').distinct().count()}")
print(f"Total referrals (all time): {Referral.objects.count()}")
