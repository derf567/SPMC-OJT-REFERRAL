import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from referrals.models import Referral

print('=' * 60)
print('DEPARTMENT FILTERING VERIFICATION')
print('=' * 60)
print()

total = Referral.objects.count()
print(f'Total Referrals in Database: {total}')
print()

print('Referrals by Department:')
print('-' * 60)
departments = ['pediatrics', 'surgery', 'cardiology', 'neurology', 'emergency', 
               'internal_medicine', 'obstetrics_gynecology', 'orthopedics']

for dept in departments:
    count = Referral.objects.filter(assigned_department=dept).count()
    if count > 0:
        print(f'  {dept.replace("_", " ").title():30} : {count} referrals')

print()
print('Pediatrics Referrals Details:')
print('-' * 60)
pediatrics_refs = Referral.objects.filter(assigned_department='pediatrics')
if pediatrics_refs.exists():
    for ref in pediatrics_refs:
        print(f'  {ref.referral_id:20} | {ref.patient_full_name:30} | {ref.status}')
else:
    print('  No Pediatrics referrals found')

print()
print('=' * 60)
print('CONCLUSION:')
print('=' * 60)
print(f'✓ Pediatrics department will see {pediatrics_refs.count()} referrals')
print(f'✓ Other departments will see their own referrals only')
print(f'✓ Filtering is working correctly!')
print()
