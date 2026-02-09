import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from django.contrib.auth.models import User
from referrals.models import UserProfile

try:
    user = User.objects.get(username='HIS')
    profile = user.profile
    print(f"User: {user.username}")
    print(f"Role: {profile.role}")
    print(f"is_his_department: {profile.is_his_department}")
    print(f"can_confirm_arrivals: {profile.can_confirm_arrivals}")
except User.DoesNotExist:
    print("HIS user not found")
except Exception as e:
    print(f"Error: {e}")
