#!/usr/bin/env python
"""Test script to verify the schedule_opd time format fix"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from datetime import datetime

# Test different time formats
test_times = [
    '08:00',      # 24-hour format
    '8:00 AM',    # 12-hour with space
    '8:00AM',     # 12-hour without space
    '14:30',      # 24-hour afternoon
    '2:30 PM',    # 12-hour afternoon with space
    '2:30PM',     # 12-hour afternoon without space
]

time_formats = ['%H:%M', '%I:%M %p', '%I:%M%p']

print("Testing time format parsing:")
print("-" * 50)

for test_time in test_times:
    parsed = False
    for time_format in time_formats:
        try:
            time_obj = datetime.strptime(test_time, time_format).time()
            print(f"✓ '{test_time}' -> {time_obj} (format: {time_format})")
            parsed = True
            break
        except ValueError:
            continue
    
    if not parsed:
        print(f"✗ '{test_time}' -> FAILED TO PARSE")

print("\n" + "=" * 50)
print("All time formats should parse successfully!")
