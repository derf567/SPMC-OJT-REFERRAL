"""
Create dummy referrals from Davao Doctors Hospital
Run this script to populate the database with sample referral data
"""
import os
import django
from datetime import datetime, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from django.contrib.auth.models import User
from referrals.models import (
    Referral, ReferringHospital, Specialty, UserProfile, 
    ReferralStatusHistory, TransitInfo
)
from django.utils import timezone

# Sample patient data
PATIENT_NAMES = [
    "Juan Dela Cruz", "Maria Santos", "Pedro Reyes", "Ana Garcia",
    "Jose Mendoza", "Carmen Lopez", "Miguel Torres", "Sofia Ramos",
    "Carlos Fernandez", "Isabel Morales", "Roberto Cruz", "Elena Diaz",
    "Francisco Gonzales", "Teresa Valdez", "Antonio Ramirez", "Lucia Flores"
]

ADDRESSES = [
    "123 Bonifacio St., Poblacion District, Davao City",
    "456 Rizal Ave., Buhangin, Davao City",
    "789 Quezon Blvd., Agdao, Davao City",
    "321 Mabini St., Toril, Davao City",
    "654 Roxas Ave., Matina, Davao City",
    "987 Osmeña St., Talomo, Davao City",
    "147 Luna St., Panacan, Davao City",
    "258 Del Pilar Ave., Sasa, Davao City"
]

CHIEF_COMPLAINTS = [
    "Severe chest pain radiating to left arm, shortness of breath",
    "High fever for 3 days, persistent cough with difficulty breathing",
    "Severe abdominal pain, vomiting, unable to eat",
    "Head trauma from vehicular accident, loss of consciousness",
    "Difficulty breathing, wheezing, history of asthma",
    "Severe headache, blurred vision, elevated blood pressure",
    "Diabetic ketoacidosis, altered mental status",
    "Acute stroke symptoms, right-sided weakness, slurred speech",
    "Severe bleeding, suspected internal injuries from fall",
    "Acute myocardial infarction, crushing chest pain"
]

WORKING_IMPRESSIONS = [
    "Acute Coronary Syndrome, possible STEMI",
    "Severe Pneumonia, possible COVID-19",
    "Acute Appendicitis, peritonitis",
    "Traumatic Brain Injury, subdural hematoma",
    "Acute Asthma Exacerbation, respiratory distress",
    "Hypertensive Emergency, possible stroke",
    "Diabetic Ketoacidosis, severe hyperglycemia",
    "Acute Ischemic Stroke, left MCA territory",
    "Blunt Abdominal Trauma, possible splenic rupture",
    "Acute Myocardial Infarction, cardiogenic shock"
]

MANAGEMENT_DONE = [
    "IV line secured, O2 via nasal cannula at 3L/min, Aspirin 300mg given, ECG done",
    "IV antibiotics started, O2 via face mask at 10L/min, chest X-ray done",
    "NPO, IV fluids started, pain management with Tramadol, abdominal ultrasound ordered",
    "Cervical collar applied, IV line secured, CT scan of head done",
    "Nebulization with Salbutamol, IV Hydrocortisone given, O2 via face mask",
    "IV Labetalol given, blood pressure monitoring, CT scan of brain ordered",
    "IV insulin infusion started, fluid resuscitation, blood sugar monitoring",
    "Aspirin and Clopidogrel given, IV tPA prepared, CT scan done",
    "IV fluids, blood transfusion prepared, FAST ultrasound done",
    "Aspirin, Clopidogrel, Heparin given, cardiac enzymes sent, ICU prepared"
]

def create_davao_doctors_hospital():
    """Create or get Davao Doctors Hospital"""
    hospital, created = ReferringHospital.objects.get_or_create(
        name="Davao Doctors Hospital",
        defaults={
            'is_inside_davao_city': True,
            'location': 'Davao City',
            'address': '118 E. Quirino Ave., Davao City',
            'contact_number': '082-222-8000'
        }
    )
    if created:
        print(f"✓ Created hospital: {hospital.name}")
    else:
        print(f"✓ Found existing hospital: {hospital.name}")
    return hospital

def create_hospital_user():
    """Create or get user account for Davao Doctors Hospital"""
    username = "davao_doctors"
    
    try:
        user = User.objects.get(username=username)
        print(f"✓ Found existing user: {username}")
    except User.DoesNotExist:
        user = User.objects.create_user(
            username=username,
            email="referrals@davaodoctors.com",
            password="davao123",
            first_name="Davao Doctors",
            last_name="Hospital"
        )
        print(f"✓ Created user: {username}")
        
        # Create user profile
        profile = UserProfile.objects.create(
            user=user,
            role='referrer',
            profession='Hospital',
            cellphone='082-222-8000',
            hospital_name='Davao Doctors Hospital',
            hospital_location='118 E. Quirino Ave., Davao City',
            is_inside_davao=True,
            hospital_region='Region XI (Davao Region)',
            hospital_province='Davao del Sur',
            hospital_city='City of Davao',
            hospital_barangay='Poblacion District',
            hospital_street='118 E. Quirino Ave.',
            hospital_doh_level='tertiary',
            contact_numbers=['082-222-8000', '082-222-8001']
        )
        print(f"✓ Created user profile for {username}")
    
    return user

def get_random_specialty():
    """Get a random specialty"""
    specialties = list(Specialty.objects.all())
    if not specialties:
        # Create some default specialties
        specialty_names = [
            'Cardiology', 'Internal Medicine', 'Surgery', 'Neurology',
            'Orthopedics', 'Pediatrics', 'Emergency Medicine'
        ]
        for name in specialty_names:
            Specialty.objects.get_or_create(name=name)
        specialties = list(Specialty.objects.all())
    
    return random.choice(specialties)

def create_dummy_referrals(hospital, user, count=10):
    """Create dummy referrals"""
    print(f"\n=== Creating {count} dummy referrals ===")
    
    statuses = ['pending', 'in_transit', 'waiting', 'emergent', 'urgent', 'completed']
    
    for i in range(count):
        # Random date within last 30 days
        days_ago = random.randint(0, 30)
        created_date = timezone.now() - timedelta(days=days_ago)
        
        # Random patient data
        patient_name = random.choice(PATIENT_NAMES)
        age = random.randint(18, 85)
        gender = random.choice(['male', 'female'])
        
        # Create referral
        referral = Referral.objects.create(
            # Patient Status Information
            chief_complaint=random.choice(CHIEF_COMPLAINTS),
            pertinent_history=f"Patient is a {age}-year-old {gender} with history of hypertension and diabetes. Symptoms started {random.randint(1, 48)} hours ago.",
            pertinent_physical_exam=f"Patient appears in distress, conscious and coherent. Vital signs unstable.",
            
            # Vital Signs
            bp=f"{random.randint(90, 180)}/{random.randint(60, 120)}",
            hr=random.randint(60, 140),
            rr=random.randint(16, 35),
            temp=round(random.uniform(36.5, 39.5), 1),
            o2_sat=random.randint(85, 98),
            
            gcs_score=f"{random.randint(10, 15)}/15",
            o2_support=random.choice([
                "Room air", "Nasal cannula 3L/min", "Face mask 10L/min",
                "Non-rebreather mask 15L/min", "Mechanical ventilation"
            ]),
            admission_status=random.choice(['emergency_room', 'ward', 'intensive_care_unit']),
            rtpcr_result=random.choice(['negative', 'not_done']),
            working_impression=random.choice(WORKING_IMPRESSIONS),
            management_done=random.choice(MANAGEMENT_DONE),
            
            # Patient General Information
            patient_category=random.choice(['new_patient', 'known_patient']),
            hrn=f"DDH-{random.randint(100000, 999999)}" if random.choice([True, False]) else "",
            patient_full_name=patient_name,
            current_address=random.choice(ADDRESSES),
            birthday=datetime.now().date() - timedelta(days=age*365),
            age=age,
            gender=gender,
            
            # Specialty Needed
            specialty_needed=get_random_specialty(),
            is_urgent=random.choice([True, False]),
            is_emergent=random.choice([True, False]),
            reason_for_referral=f"Patient requires higher level of care and specialist consultation. {hospital.name} does not have the necessary facilities/specialists for this case.",
            
            # Referring Hospital Information
            referring_hospital=hospital,
            referrer_name=f"Dr. {random.choice(['Juan', 'Maria', 'Pedro', 'Ana'])} {random.choice(['Santos', 'Reyes', 'Cruz', 'Garcia'])}",
            referrer_profession=random.choice(['Emergency Medicine Physician', 'Internal Medicine Physician', 'General Practitioner']),
            referrer_cellphone=f"0917-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
            mode_of_transportation=random.choice(['Hospital Ambulance', 'Private Vehicle', 'Emergency Ambulance']),
            
            # Consent
            consent_secured=True,
            
            # System fields
            created_by=user,
            status=random.choice(statuses),
            priority=random.choice(['routine', 'urgent', 'critical']),
            created_at=created_date,
            updated_at=created_date
        )
        
        # Create status history
        ReferralStatusHistory.objects.create(
            referral=referral,
            old_status='',
            new_status=referral.status,
            changed_by=user,
            changed_at=created_date,
            notes=f"Referral created from {hospital.name}"
        )
        
        print(f"  {i+1}. Created referral {referral.referral_id} - {patient_name} ({referral.status})")
    
    print(f"\n✓ Successfully created {count} dummy referrals!")

def main():
    print("=" * 60)
    print("Creating Dummy Referrals from Davao Doctors Hospital")
    print("=" * 60)
    
    # Create hospital
    hospital = create_davao_doctors_hospital()
    
    # Create user account
    user = create_hospital_user()
    
    # Create dummy referrals
    num_referrals = 15  # Change this number to create more/fewer referrals
    create_dummy_referrals(hospital, user, num_referrals)
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Hospital: {hospital.name}")
    print(f"Username: davao_doctors")
    print(f"Password: davao123")
    print(f"Total Referrals Created: {num_referrals}")
    print(f"Total Referrals in System: {Referral.objects.count()}")
    print("=" * 60)
    print("\nYou can now login with the credentials above to view the referrals!")

if __name__ == '__main__':
    main()
