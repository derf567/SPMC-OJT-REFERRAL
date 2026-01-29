from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from referrals.models import ReferringHospital, Specialty, Referral, TransitInfo, UserProfile
from datetime import date, time

class Command(BaseCommand):
    help = 'Create sample data for the referral system'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')

        # Create sample hospitals
        hospitals_data = [
            {
                'name': 'Davao Regional Hospital',
                'is_inside_davao_city': True,
                'location': 'Poblacion District',
                'contact_number': '(082) 227-2731'
            },
            {
                'name': 'San Pedro Hospital',
                'is_inside_davao_city': True,
                'location': 'Buhangin District',
                'contact_number': '(082) 296-2000'
            },
            {
                'name': 'Metro Davao Medical Center',
                'is_inside_davao_city': True,
                'location': 'Talomo District',
                'contact_number': '(082) 221-4000'
            },
            {
                'name': 'Tagum Doctors Hospital',
                'is_inside_davao_city': False,
                'location': 'Tagum City',
                'contact_number': '(084) 216-3333'
            }
        ]

        for hospital_data in hospitals_data:
            hospital, created = ReferringHospital.objects.get_or_create(
                name=hospital_data['name'],
                defaults=hospital_data
            )
            if created:
                self.stdout.write(f'Created hospital: {hospital.name}')

        # Create sample specialties
        specialties_data = [
            'Cardiology',
            'Emergency Medicine',
            'Internal Medicine',
            'Surgery',
            'Obstetrics and Gynecology',
            'Pediatrics',
            'Orthopedics',
            'Neurology',
            'Psychiatry',
            'Radiology',
            'Anesthesiology',
            'Pathology'
        ]

        for specialty_name in specialties_data:
            specialty, created = Specialty.objects.get_or_create(
                name=specialty_name
            )
            if created:
                self.stdout.write(f'Created specialty: {specialty.name}')

        # Create SPMC staff users with roles
        users_data = [
            {
                'username': 'edcc_user',
                'password': 'edcc123',
                'first_name': 'EDCC',
                'last_name': 'Personnel',
                'email': 'edcc@spmc.gov.ph',
                'role': 'edcc_personnel',
                'department': 'Emergency Dispatch and Communication Center'
            },
            {
                'username': 'triage_user',
                'password': 'triage123',
                'first_name': 'EDMAR',
                'last_name': 'Call Triage',
                'email': 'triage@spmc.gov.ph',
                'role': 'call_triage',
                'department': 'Emergency Department'
            },
            {
                'username': 'admin',
                'password': 'admin123',
                'first_name': 'System',
                'last_name': 'Administrator',
                'email': 'admin@spmc.gov.ph',
                'role': 'admin',
                'department': 'IT Department',
                'is_staff': True,
                'is_superuser': True
            }
        ]

        for user_data in users_data:
            username = user_data['username']
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username,
                    email=user_data['email'],
                    password=user_data['password'],
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name']
                )
                
                if user_data.get('is_staff'):
                    user.is_staff = True
                if user_data.get('is_superuser'):
                    user.is_superuser = True
                user.save()
                
                # Create user profile
                profile = UserProfile.objects.create(
                    user=user,
                    role=user_data['role'],
                    department=user_data['department']
                )
                
                self.stdout.write(f'Created user: {username} ({profile.get_role_display()})')
            else:
                user = User.objects.get(username=username)
                profile, created = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'role': user_data['role'],
                        'department': user_data['department']
                    }
                )
                if created:
                    self.stdout.write(f'Created profile for existing user: {username}')

        self.stdout.write(
            self.style.SUCCESS('Successfully created sample data!')
        )
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write('LOGIN CREDENTIALS:')
        self.stdout.write('='*50)
        self.stdout.write('EDCC Personnel (View Only):')
        self.stdout.write('  Username: edcc_user')
        self.stdout.write('  Password: edcc123')
        self.stdout.write('')
        self.stdout.write('Call Triage (Can decide priority):')
        self.stdout.write('  Username: triage_user')
        self.stdout.write('  Password: triage123')
        self.stdout.write('')
        self.stdout.write('Administrator:')
        self.stdout.write('  Username: admin')
        self.stdout.write('  Password: admin123')
        self.stdout.write('='*50)