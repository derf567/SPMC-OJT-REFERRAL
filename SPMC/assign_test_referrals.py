import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from referrals.models import Referral

# Check total referrals
total = Referral.objects.count()
print(f'Total referrals in database: {total}')

# Check pediatrics referrals
pediatrics_count = Referral.objects.filter(assigned_department='pediatrics').count()
print(f'Pediatrics referrals: {pediatrics_count}')

# Assign some referrals to pediatrics for testing
if total > 0:
    # Get first 3 referrals and assign to pediatrics
    referrals = Referral.objects.all()[:3]
    for ref in referrals:
        ref.assigned_department = 'pediatrics'
        ref.save()
        print(f'Assigned {ref.referral_id} to Pediatrics')
    
    print(f'\nNow Pediatrics has {Referral.objects.filter(assigned_department="pediatrics").count()} referrals')
else:
    print('No referrals in database. Please create some referrals first.')
