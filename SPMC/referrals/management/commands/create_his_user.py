from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from referrals.models import UserProfile


class Command(BaseCommand):
    help = 'Create HIS Department user'

    def handle(self, *args, **options):
        # Check if user already exists
        if User.objects.filter(username='HIS').exists():
            self.stdout.write(self.style.WARNING('HIS user already exists'))
            return

        # Create user
        user = User.objects.create_user(
            username='HIS',
            email='HIS@gmail.com',
            password='HIS123',
            first_name='HIS',
            last_name='Department',
            is_staff=True,
            is_active=True
        )

        # Create user profile with HIS role
        UserProfile.objects.create(
            user=user,
            role='his_department',
            department='HIS Department',
            contact_number='N/A'
        )

        self.stdout.write(self.style.SUCCESS('Successfully created HIS user'))
        self.stdout.write(self.style.SUCCESS('Username: HIS'))
        self.stdout.write(self.style.SUCCESS('Email: HIS@gmail.com'))
        self.stdout.write(self.style.SUCCESS('Password: HIS123'))
