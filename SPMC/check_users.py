import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from django.contrib.auth.models import User
from referrals.user_roles import UserProfile

print('All users and their roles:')
for user in User.objects.all():
    try:
        profile = user.profile
        print(f'  - {user.username} ({user.get_full_name()}): {profile.get_role_display()}')
        print(f'    Can transfer: {profile.can_transfer_referrals}, Can triage: {profile.can_triage_referrals}')
    except UserProfile.DoesNotExist:
        print(f'  - {user.username} ({user.get_full_name()}): No profile')
