import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from django.contrib.auth.models import User
from django.db import connection

# Find the user
try:
    user = User.objects.get(username='Vardox')
    print(f"Found user: {user.username} - {user.get_full_name()}")
    
    # Check if user has a referrer profile
    if hasattr(user, 'referrer_profile'):
        print("User has a referrer profile. Deleting referrer profile first...")
        # Manually clear many-to-many relationships to avoid missing table error
        try:
            user.referrer_profile.specialties.clear()
            user.referrer_profile.affiliate_hospitals.clear()
        except Exception as e:
            print(f"Note: Could not clear relationships (table may not exist): {e}")
        user.referrer_profile.delete()
        print("Referrer profile deleted.")
    
    # Delete the user
    user.delete()
    print(f"User '{user.username}' (Fred Marinay) has been deleted successfully!")
    
except User.DoesNotExist:
    print("User 'Vardox' not found.")
except Exception as e:
    print(f"Error deleting user: {e}")
