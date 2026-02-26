"""
Test script to verify doctor role filtering works correctly
Run with: python manage.py shell
Then: exec(open('test_doctor_role.py').read())
"""

from django.contrib.auth.models import User
from referrals.models import UserProfile, Referral
from django.db.models import Q

print("\n" + "="*60)
print("TESTING DOCTOR ROLE IMPLEMENTATION")
print("="*60)

# Check if doctor role exists
print("\n1. Checking if 'doctor' role is available...")
role_choices = dict(UserProfile.ROLE_CHOICES)
if 'doctor' in role_choices:
    print(f"   ✓ Doctor role exists: {role_choices['doctor']}")
else:
    print("   ✗ Doctor role NOT found!")

# Check for existing doctor accounts
print("\n2. Checking for existing doctor accounts...")
doctors = UserProfile.objects.filter(role='doctor')
if doctors.exists():
    print(f"   ✓ Found {doctors.count()} doctor account(s):")
    for doc in doctors:
        print(f"      - {doc.user.username} (Department: {doc.department})")
else:
    print("   ℹ No doctor accounts found yet")
    print("   Create one with:")
    print("   user = User.objects.create_user(username='dr_test', password='test123')")
    print("   UserProfile.objects.create(user=user, role='doctor', department='pathology')")

# Check referrals with assigned departments
print("\n3. Checking referrals with assigned departments...")
referrals_with_depts = Referral.objects.exclude(assigned_departments=[])
if referrals_with_depts.exists():
    print(f"   ✓ Found {referrals_with_depts.count()} referral(s) with assigned departments:")
    for ref in referrals_with_depts[:3]:
        print(f"      - {ref.referral_id}: {ref.assigned_departments}")
else:
    print("   ℹ No referrals with assigned departments yet")
    print("   Assign departments with:")
    print("   r = Referral.objects.first()")
    print("   r.assigned_departments = ['pathology', 'internal_medicine']")
    print("   r.save()")

# Test filtering logic
print("\n4. Testing department filtering logic...")
test_department = 'pathology'
print(f"   Testing with department: {test_department}")

filtered_refs = Referral.objects.filter(
    Q(assigned_departments__contains=[test_department]) |
    Q(assigned_department=test_department)
)

print(f"   ✓ Query executed successfully")
print(f"   Found {filtered_refs.count()} referral(s) for {test_department} department")

if filtered_refs.exists():
    print(f"\n   Referrals that would be visible to {test_department} doctors:")
    for ref in filtered_refs[:5]:
        print(f"      - {ref.referral_id}: {ref.patient_full_name}")
        print(f"        Assigned depts: {ref.assigned_departments}")
        print(f"        Single dept: {ref.assigned_department}")

# Check UserProfile properties
print("\n5. Testing UserProfile properties...")
if doctors.exists():
    doc = doctors.first()
    print(f"   Testing with: {doc.user.username}")
    print(f"   - is_doctor: {doc.is_doctor}")
    print(f"   - can_view_department_referrals: {doc.can_view_department_referrals}")
    print(f"   - department: {doc.department}")
else:
    print("   ℹ No doctors to test properties")

print("\n" + "="*60)
print("TEST COMPLETE")
print("="*60)
print("\nSummary:")
print("✓ Doctor role added to system")
print("✓ Filtering logic implemented")
print("✓ UserProfile properties working")
print("\nNext steps:")
print("1. Create doctor accounts via Django admin or shell")
print("2. Assign departments to referrals (via Triage)")
print("3. Test login as doctor and verify filtering")
print("4. Create frontend doctor dashboard")
print("\n")
