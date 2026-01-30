from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from referrals.models import ReferringHospital, Specialty, Referral, TransitInfo, UserProfile
from datetime import date, time, datetime, timedelta
import random

class Command(BaseCommand):
    help = 'Create sample data for the referral system'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')

        # Clear existing referrals to start fresh
        self.stdout.write('Clearing existing referrals...')
        Referral.objects.all().delete()
        self.stdout.write('Existing referrals cleared.')

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
            },
            {
                'name': 'Digos City Hospital',
                'is_inside_davao_city': False,
                'location': 'Digos City',
                'contact_number': '(082) 553-2345'
            },
            {
                'name': 'Panabo General Hospital',
                'is_inside_davao_city': False,
                'location': 'Panabo City',
                'contact_number': '(084) 628-1234'
            },
            {
                'name': 'Mati District Hospital',
                'is_inside_davao_city': False,
                'location': 'Mati City',
                'contact_number': '(087) 388-5678'
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
            'Pathology',
            'Nephrology',
            'Pulmonology',
            'Gastroenterology'
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

        # Create 50 dummy referrals with PENDING status for EDCC queue
        self.stdout.write('\nCreating 50 dummy referrals for EDCC queue...')
        
        # Sample patient data
        first_names = [
            'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Carmen', 'Luis', 'Rosa', 'Carlos', 'Elena',
            'Miguel', 'Sofia', 'Antonio', 'Isabel', 'Francisco', 'Patricia', 'Manuel', 'Lucia',
            'Rafael', 'Cristina', 'David', 'Alejandra', 'Jorge', 'Beatriz', 'Fernando', 'Gabriela',
            'Ricardo', 'Valeria', 'Alberto', 'Natalia', 'Roberto', 'Andrea', 'Eduardo', 'Monica',
            'Sergio', 'Daniela', 'Raul', 'Claudia', 'Javier', 'Silvia', 'Oscar', 'Mariana',
            'Guillermo', 'Paola', 'Arturo', 'Veronica', 'Enrique', 'Adriana', 'Rodrigo', 'Lorena'
        ]
        
        last_names = [
            'Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez',
            'Cruz', 'Flores', 'Gomez', 'Morales', 'Jimenez', 'Hernandez', 'Vargas', 'Castro',
            'Ramos', 'Ortega', 'Rubio', 'Soto', 'Contreras', 'Silva', 'Sepulveda', 'Mendoza',
            'Guerrero', 'Medina', 'Rojas', 'Castillo', 'Herrera', 'Aguirre', 'Torres', 'Diaz',
            'Moreno', 'Gutierrez', 'Chavez', 'Reyes', 'Ruiz', 'Alvarez', 'Fernandez', 'Valdez',
            'Rios', 'Espinoza', 'Molina', 'Romero', 'Aguilar', 'Delgado', 'Vega', 'Campos',
            'Navarro', 'Cuevas'
        ]
        
        chief_complaints = [
            'Chest pain with shortness of breath',
            'Severe abdominal pain',
            'High fever with chills',
            'Difficulty breathing',
            'Severe headache with nausea',
            'Chest trauma from motor vehicle accident',
            'Acute stroke symptoms',
            'Diabetic ketoacidosis',
            'Severe hypertension',
            'Acute myocardial infarction',
            'Pneumonia with respiratory distress',
            'Gastrointestinal bleeding',
            'Acute appendicitis',
            'Seizure disorder',
            'Acute renal failure',
            'Sepsis with multi-organ failure',
            'Acute pancreatitis',
            'Severe dehydration',
            'Cardiac arrhythmia',
            'Acute cholecystitis'
        ]
        
        working_impressions = [
            'Acute coronary syndrome',
            'Acute abdomen, rule out appendicitis',
            'Sepsis, source unknown',
            'Acute respiratory failure',
            'Increased intracranial pressure',
            'Polytrauma with chest injury',
            'Cerebrovascular accident',
            'DKA with severe dehydration',
            'Hypertensive emergency',
            'STEMI anterior wall',
            'Community acquired pneumonia',
            'Upper GI bleeding',
            'Acute appendicitis',
            'Status epilepticus',
            'Acute kidney injury',
            'Septic shock',
            'Acute pancreatitis',
            'Severe dehydration with electrolyte imbalance',
            'Atrial fibrillation with RVR',
            'Acute cholangitis'
        ]
        
        addresses = [
            'Poblacion District, Davao City',
            'Buhangin District, Davao City',
            'Talomo District, Davao City',
            'Tugbok District, Davao City',
            'Calinan District, Davao City',
            'Marilog District, Davao City',
            'Paquibato District, Davao City',
            'Toril District, Davao City',
            'Baguio District, Davao City',
            'Tagum City, Davao del Norte',
            'Panabo City, Davao del Norte',
            'Digos City, Davao del Sur',
            'Mati City, Davao Oriental',
            'Malita, Davao Occidental'
        ]
        
        # Get all hospitals and specialties
        hospitals = list(ReferringHospital.objects.all())
        specialties = list(Specialty.objects.all())
        
        # Get admin user as creator (external referrals don't have a specific creator)
        admin_user = User.objects.get(username='admin')
        
        for i in range(50):
            # Generate random patient data
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            patient_name = f"{first_name} {last_name}"
            
            # Random age between 18-80
            age = random.randint(18, 80)
            
            # Random birthday based on age
            birth_year = datetime.now().year - age
            birthday = date(birth_year, random.randint(1, 12), random.randint(1, 28))
            
            # Random vital signs
            bp_systolic = random.randint(90, 180)
            bp_diastolic = random.randint(60, 110)
            bp = f"{bp_systolic}/{bp_diastolic}"
            
            hr = random.randint(60, 120)
            rr = random.randint(16, 30)
            temp = round(random.uniform(36.0, 39.5), 1)
            o2_sat = random.randint(85, 100)
            
            # Random complaint and impression
            complaint_idx = random.randint(0, len(chief_complaints) - 1)
            chief_complaint = chief_complaints[complaint_idx]
            working_impression = working_impressions[complaint_idx]
            
            # Create referral with PENDING status
            referral = Referral.objects.create(
                # Patient Status Information
                chief_complaint=chief_complaint,
                pertinent_history=f"Patient has history of {random.choice(['hypertension', 'diabetes', 'heart disease', 'asthma', 'no significant medical history'])}",
                pertinent_physical_exam=f"Patient appears {random.choice(['stable', 'distressed', 'critically ill'])} with {random.choice(['normal', 'abnormal'])} physical findings",
                
                # Vital Signs - ENSURE ALL ARE POPULATED
                bp=bp,
                hr=hr,
                rr=rr,
                temp=temp,
                o2_sat=o2_sat,
                gcs_score=f"{random.randint(13, 15)}/15",
                o2_support=random.choice(['Room air', 'Nasal cannula 2L/min', 'Face mask 5L/min', 'Non-rebreather mask']),
                admission_status=random.choice(['emergency_room', 'ward', 'intensive_care_unit']),
                rtpcr_result=random.choice(['negative', 'not_done', 'positive']),
                working_impression=working_impression,
                management_done=f"IV access established, {random.choice(['pain medication', 'antibiotics', 'oxygen therapy', 'IV fluids'])} given",
                
                # Patient General Information - ENSURE ALL ARE POPULATED
                patient_category=random.choice(['new_patient', 'known_patient']),
                hrn=f"HRN{random.randint(100000, 999999)}" if random.choice([True, False]) else None,
                patient_full_name=patient_name,
                current_address=random.choice(addresses),
                birthday=birthday,
                age=age,
                gender=random.choice(['male', 'female']),
                
                # Specialty Needed
                specialty_needed=random.choice(specialties),
                is_urgent=random.choice([True, False]),
                reason_for_referral=f"Patient requires {random.choice(['specialized care', 'advanced imaging', 'surgical intervention', 'intensive monitoring'])} not available at our facility",
                
                # Referring Hospital Information - ENSURE ALL ARE POPULATED
                referring_hospital=random.choice(hospitals),
                referrer_name=f"{random.choice(first_names)} {random.choice(last_names)}",
                referrer_profession=random.choice(['Emergency Physician', 'Internal Medicine', 'Family Medicine', 'General Practitioner']),
                referrer_cellphone=f"09{random.randint(100000000, 999999999)}",
                mode_of_transportation=random.choice(['Private vehicle', 'Ambulance', 'Public transport']),
                
                # Consent
                consent_secured=True,
                
                # System fields - IMPORTANT: Set status to PENDING for EDCC queue
                status='pending',  # This ensures it appears in EDCC queue only
                priority=random.choice(['routine', 'urgent', 'critical']),
                created_by=admin_user,
            )
            
            self.stdout.write(f'Created referral {i+1}/50: {referral.referral_id} - {patient_name}')

        self.stdout.write(
            self.style.SUCCESS('Successfully created sample data!')
        )
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write('LOGIN CREDENTIALS:')
        self.stdout.write('='*50)
        self.stdout.write('EDCC Personnel (Can transfer referrals):')
        self.stdout.write('  Username: edcc_user')
        self.stdout.write('  Password: edcc123')
        self.stdout.write('  Queue: 50 PENDING referrals')
        self.stdout.write('')
        self.stdout.write('Call Triage (Can accept referrals):')
        self.stdout.write('  Username: triage_user')
        self.stdout.write('  Password: triage123')
        self.stdout.write('  Queue: 0 referrals (until EDCC transfers them)')
        self.stdout.write('')
        self.stdout.write('Administrator:')
        self.stdout.write('  Username: admin')
        self.stdout.write('  Password: admin123')
        self.stdout.write('='*50)
        self.stdout.write('')
        self.stdout.write('WORKFLOW:')
        self.stdout.write('1. Login as edcc_user to see 50 pending referrals')
        self.stdout.write('2. Transfer referrals to triage (they disappear from EDCC queue)')
        self.stdout.write('3. Login as triage_user to see transferred referrals')
        self.stdout.write('4. Accept/reject referrals as triage user')
        self.stdout.write('='*50)