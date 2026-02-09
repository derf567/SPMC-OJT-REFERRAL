from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from referrals.models import UserProfile, ReferrerAccount


class Command(BaseCommand):
    help = 'Fix user roles for users who have ReferrerAccount but wrong UserProfile role'

    def handle(self, *args, **options):
        # Find users who have ReferrerAccount but UserProfile role is not 'referrer'
        referrer_users = User.objects.filter(referrer_profile__isnull=False)
        
        fixed_count = 0
        for user in referrer_users:
            try:
                profile = user.profile
                if profile.role != 'referrer':
                    self.stdout.write(
                        f"Fixing user '{user.username}' - changing role from '{profile.role}' to 'referrer'"
                    )
                    profile.role = 'referrer'
                    profile.save()
                    fixed_count += 1
                else:
                    self.stdout.write(f"User '{user.username}' already has correct role 'referrer'")
            except UserProfile.DoesNotExist:
                # Create UserProfile for users who have ReferrerAccount but no UserProfile
                self.stdout.write(f"Creating UserProfile for user '{user.username}'")
                UserProfile.objects.create(
                    user=user,
                    role='referrer',
                    profession='Referrer',
                    hospital_name='',
                    hospital_location='',
                    is_inside_davao=True
                )
                fixed_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully fixed {fixed_count} user roles')
        )