from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from referrals.models import UserProfile, Referral

class Command(BaseCommand):
    help = 'Create department-specific user accounts'

    def handle(self, *args, **options):
        # Department configurations
        departments = [
            {
                'username': 'emergency_dept',
                'password': 'emergency123',
                'first_name': 'Emergency',
                'last_name': 'Department',
                'email': 'emergency@spmc.gov.ph',
                'department': 'emergency'
            },
            {
                'username': 'internal_medicine_dept',
                'password': 'internal123',
                'first_name': 'Internal Medicine',
                'last_name': 'Department',
                'email': 'internal_medicine@spmc.gov.ph',
                'department': 'internal_medicine'
            },
            {
                'username': 'surgery_dept',
                'password': 'surgery123',
                'first_name': 'Surgery',
                'last_name': 'Department',
                'email': 'surgery@spmc.gov.ph',
                'department': 'surgery'
            },
            {
                'username': 'obstetrics_gynecology_dept',
                'password': 'obgyne123',
                'first_name': 'Obstetrics and Gynecology',
                'last_name': 'Department',
                'email': 'obgyne@spmc.gov.ph',
                'department': 'obstetrics_gynecology'
            },
            {
                'username': 'pediatrics_dept',
                'password': 'pediatrics123',
                'first_name': 'Pediatrics',
                'last_name': 'Department',
                'email': 'pediatrics@spmc.gov.ph',
                'department': 'pediatrics'
            },
            {
                'username': 'orthopedics_dept',
                'password': 'orthopedics123',
                'first_name': 'Orthopedics',
                'last_name': 'Department',
                'email': 'orthopedics@spmc.gov.ph',
                'department': 'orthopedics'
            },
            {
                'username': 'cardiology_dept',
                'password': 'cardiology123',
                'first_name': 'Cardiology',
                'last_name': 'Department',
                'email': 'cardiology@spmc.gov.ph',
                'department': 'cardiology'
            },
            {
                'username': 'neurology_dept',
                'password': 'neurology123',
                'first_name': 'Neurology',
                'last_name': 'Department',
                'email': 'neurology@spmc.gov.ph',
                'department': 'neurology'
            },
            {
                'username': 'anesthesiology_dept',
                'password': 'anesthesiology123',
                'first_name': 'Anesthesiology',
                'last_name': 'Department',
                'email': 'anesthesiology@spmc.gov.ph',
                'department': 'anesthesiology'
            },
            {
                'username': 'radiology_dept',
                'password': 'radiology123',
                'first_name': 'Radiology',
                'last_name': 'Department',
                'email': 'radiology@spmc.gov.ph',
                'department': 'radiology'
            },
            {
                'username': 'pathology_dept',
                'password': 'pathology123',
                'first_name': 'Pathology',
                'last_name': 'Department',
                'email': 'pathology@spmc.gov.ph',
                'department': 'pathology'
            },
        ]

        self.stdout.write(self.style.SUCCESS('Creating department accounts...'))

        for dept_config in departments:
            username = dept_config['username']
            
            # Check if user already exists
            if User.objects.filter(username=username).exists():
                self.stdout.write(self.style.WARNING(f'User {username} already exists. Skipping...'))
                continue
            
            # Create user
            user = User.objects.create_user(
                username=username,
                password=dept_config['password'],
                first_name=dept_config['first_name'],
                last_name=dept_config['last_name'],
                email=dept_config['email'],
                is_active=True
            )
            
            # Create user profile
            UserProfile.objects.create(
                user=user,
                role='department_user',
                department=dept_config['department']
            )
            
            self.stdout.write(self.style.SUCCESS(
                f'✓ Created {dept_config["first_name"]} account'
                f'\n  Username: {username}'
                f'\n  Password: {dept_config["password"]}'
                f'\n  Department: {dept_config["department"]}'
            ))

        self.stdout.write(self.style.SUCCESS('\n=== Department Accounts Created Successfully ==='))
        self.stdout.write(self.style.SUCCESS('\nDepartment Login Credentials:'))
        self.stdout.write(self.style.SUCCESS('-' * 60))
        for dept in departments:
            self.stdout.write(f'{dept["first_name"]:30} | {dept["username"]:25} | {dept["password"]}')
