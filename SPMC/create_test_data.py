"""
Create test data for Triage Department Assignment testing
Run this script with: python manage.py shell < create_test_data.py
"""

from django.contrib.auth.models import User
from referrals.models import (
    Referral, ReferringHospital, Specialty, 
    Department, DepartmentAcceptance, UserProfile
)
from django.utils import timezone
from datetime import datetime, timedelta

print("=" * 60)
print("Creating Test Data for Triage Department Assignment")
print("=" * 60)

# 1. Create or get departments
print("\n1. Creating/Getting Departments...")
departments_data = [
    {'code': 'cardiology', 'name': 'Cardiology', 'contact': '082-227-2737'},
    {'code': 'surgery', 'name': 'Surgery Department', 'contact': '082-227-2738'},
    {'code': 'internal_medicine', 'name': 'Internal Medicine', 'contact': '082-227-2732'},
    {'code': 'orthopedics', 'name': 'Orthopedics', 'contact': '082-227-2739'},
    {'code': 'neurology', 'name': 'Neurology', 'contact': '082-227-2740'},
    {'code': 'anesthesiology', 'name': 'Anesthesiology', 'contact': '082-227-2741'},
]

for dept_data in departments_data:
    dept, created = Department.objects.get_or_create(
        code=dept_data['code'],
        defaults={
            'name': dept_data['name'],
            'contact_number': dept_data['contact'],
            'is_active': True
        }
    )
    status = "Created" if created else "Already exists"
    print(f"  ✓ {dept.name} - {status}")

# 2. Create or get specialty
print("\n2. Creating/Getting Specialties...")
cardiology_specialty, _ = Specialty.objects.get_or_create(
    name='Cardiology',
    defaults={'description': 'Heart and cardiovascular system'}
)
surgery_specialty, _ = Specialty.objects.get_or_create(
    name='Surgery',
    defaults={'description': 'Surgical procedures'}
)
internal_med_specialty, _ = Specialty.objects.get_or_create(
    name='Internal Medicine',
    defaults={'description': 'Internal medicine and general care'}
)
print(f"  ✓ Specialties ready")

# 3. Create or get hospital
print("\n3. Creating/Getting Hospital...")
hospital, _ = ReferringHospital.objects.get_or_create(
    name='Davao Doctors Hospital',
    defaults={'is_inside_davao_city': True}
)
print(f"  ✓ {hospital.name}")

# 4. Create or get users
print("\n4. Creating/Getting Users...")

# EDCC User
edcc_user, created = User.objects.get_or_create(
    username='edcc_user',
    defaults={
        'first_name': 'EDCC',
        'last_name': 'Personnel',
        'email': 'edcc@spmc.gov.ph',
        'is_staff': True
    }
)
if created:
    edcc_user.set_password('edcc123')
    edcc_user.save()
    UserProfile.objects.get_or_create(
        user=edcc_user,
        defaults={
            'role': 'edcc',
            'contact_number': '082-227-2700'
        }
    )
print(f"  ✓ EDCC User: {edcc_user.username}")

# Department Doctor Users
dept_users = [
    ('cardio_doc', 'Cardiology', 'Doctor', 'cardio@spmc.gov.ph', 'cardiology'),
    ('surgery_doc', 'Surgery', 'Doctor', 'surgery@spmc.gov.ph', 'surgery'),
    ('internalmedicine_doc', 'Internal Medicine', 'Doctor', 'internalmedicine@spmc.gov.ph', 'internal_medicine'),
]

for username, first_name, last_name, email, dept_code in dept_users:
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            'first_name': first_name,
            'last_name': last_name,
            'email': email,
            'is_staff': True
        }
    )
    if created:
        user.set_password('doctor123')
        user.save()
        UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'role': 'department_doctor',
                'department_code': dept_code,
                'contact_number': '082-227-2700'
            }
        )
    print(f"  ✓ Doctor: {user.username} ({first_name})")

# 5. Create test referrals
print("\n5. Creating Test Referrals...")

test_referrals = [
    {
        'patient_name': 'Juan Dela Cruz',
        'age': 45,
        'gender': 'male',
        'chief_complaint': 'Chest pain radiating to left arm for 2 hours',
        'pertinent_history': 'Hypertensive, smoker for 20 years',
        'pertinent_physical_exam': 'Diaphoretic, anxious, BP 160/100',
        'working_impression': 'Acute Coronary Syndrome',
        'specialty': cardiology_specialty,
        'reason': 'Needs immediate cardiology evaluation and possible PCI',
        'bp': '160/100',
        'hr': 110,
        'rr': 24,
        'temp': 37.2,
        'o2_sat': 95,
    },
    {
        'patient_name': 'Maria Santos',
        'age': 62,
        'gender': 'female',
        'chief_complaint': 'Severe abdominal pain with fever for 12 hours',
        'pertinent_history': 'No previous surgeries, diabetic',
        'pertinent_physical_exam': 'Rigid abdomen, rebound tenderness, fever 38.5C',
        'working_impression': 'Acute Appendicitis with possible peritonitis',
        'specialty': surgery_specialty,
        'reason': 'Surgical emergency, needs immediate intervention',
        'bp': '130/85',
        'hr': 105,
        'rr': 22,
        'temp': 38.5,
        'o2_sat': 97,
    },
    {
        'patient_name': 'Pedro Reyes',
        'age': 28,
        'gender': 'male',
        'chief_complaint': 'Multiple trauma from vehicular accident',
        'pertinent_history': 'Previously healthy, no comorbidities',
        'pertinent_physical_exam': 'Multiple contusions, deformity right leg, GCS 14',
        'working_impression': 'Polytrauma - closed fracture right femur, head injury',
        'specialty': surgery_specialty,
        'reason': 'Multiple trauma requiring surgical and orthopedic evaluation',
        'bp': '110/70',
        'hr': 120,
        'rr': 26,
        'temp': 36.8,
        'o2_sat': 94,
    },
]

for i, ref_data in enumerate(test_referrals, 1):
    referral = Referral.objects.create(
        referring_hospital=hospital,
        specialty_needed=ref_data['specialty'],
        patient_full_name=ref_data['patient_name'],
        age=ref_data['age'],
        gender=ref_data['gender'],
        birthday=timezone.now().date() - timedelta(days=ref_data['age']*365),
        current_address='Test Address, Davao City',
        chief_complaint=ref_data['chief_complaint'],
        pertinent_history=ref_data['pertinent_history'],
        pertinent_physical_exam=ref_data['pertinent_physical_exam'],
        working_impression=ref_data['working_impression'],
        reason_for_referral=ref_data['reason'],
        management_done='Initial stabilization, IV fluids, monitoring',
        bp=ref_data['bp'],
        hr=ref_data['hr'],
        rr=ref_data['rr'],
        temp=ref_data['temp'],
        o2_sat=ref_data['o2_sat'],
        gcs_score='15',
        o2_support='Room air',
        admission_status='emergency_room',
        rtpcr_result='not_done',
        patient_category='new_patient',
        referrer_name='Dr. Test Referrer',
        referrer_profession='doctor',
        referrer_cellphone='09171234567',
        contact_numbers=['09171234567', '09181234567'],
        mode_of_transportation='Ambulance',
        consent_secured=True,
        created_by=edcc_user,
        status='pending',
        priority='urgent' if i == 1 else 'routine',
    )
    print(f"  ✓ Referral {i}: {ref_data['patient_name']} - {referral.referral_id}")

print("\n" + "=" * 60)
print("✅ Test Data Created Successfully!")
print("=" * 60)

print("\n📋 Summary:")
print(f"  • Departments: {Department.objects.filter(is_active=True).count()}")
print(f"  • Specialties: {Specialty.objects.count()}")
print(f"  • Test Referrals: {Referral.objects.filter(patient_full_name__in=['Juan Dela Cruz', 'Maria Santos', 'Pedro Reyes']).count()}")
print(f"  • Users: EDCC + 3 Department Doctors")

print("\n🔐 Login Credentials:")
print("  EDCC/EDMA:")
print("    Username: edcc_user")
print("    Password: edcc123")
print("\n  Department Doctors:")
print("    Cardiology: cardio_doc / doctor123")
print("    Surgery: surgery_doc / doctor123")
print("    Internal Medicine: internalmedicine_doc / doctor123")

print("\n📝 Next Steps:")
print("  1. Login as edcc_user")
print("  2. Go to Active Referrals")
print("  3. Transfer referrals to Triage")
print("  4. Go to Triage Referrals")
print("  5. Click 'Assign Departments'")
print("  6. Test the department assignment flow!")

print("\n" + "=" * 60)
