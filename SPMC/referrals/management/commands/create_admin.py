from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from referrals.models import UserProfile

class Command(BaseCommand):
    help = 'Create or update admin user'

    def handle(self, *args, **kwargs):
        # Check if admin user exists
        username = 'admin'
        
        try:
            user = User.objects.get(username=username)
            self.stdout.write(self.style.SUCCESS(f'Admin user "{username}" already exists'))
        except User.DoesNotExist:
            # Create admin user
            user = User.objects.create_superuser(
                username=username,
                email='admin@spmc.gov.ph',
                password='admin123',
                first_name='System',
                last_name='Administrator'
            )
            self.stdout.write(self.style.SUCCESS(f'Created admin user "{username}" with password "admin123"'))
        
        # Get or create profile
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'role': 'admin',
                'department': 'Administration',
                'contact_number': '000-000-0000'
            }
        )
        
        if not created:
            # Update existing profile to admin
            profile.role = 'admin'
            profile.department = 'Administration'
            profile.save()
            self.stdout.write(self.style.SUCCESS(f'Updated profile for "{username}" to admin role'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Created admin profile for "{username}"'))
        
        # Make sure user is superuser and staff
        if not user.is_superuser:
            user.is_superuser = True
            user.is_staff = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Set "{username}" as superuser and staff'))
        
        self.stdout.write(self.style.SUCCESS('\n=== Admin User Details ==='))
        self.stdout.write(self.style.SUCCESS(f'Username: {user.username}'))
        self.stdout.write(self.style.SUCCESS(f'Password: admin123'))
        self.stdout.write(self.style.SUCCESS(f'Email: {user.email}'))
        self.stdout.write(self.style.SUCCESS(f'Role: {profile.role}'))
        self.stdout.write(self.style.SUCCESS(f'Is Admin: {profile.is_admin_user}'))
        self.stdout.write(self.style.SUCCESS('========================\n'))
