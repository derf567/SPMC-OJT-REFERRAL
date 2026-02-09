import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from referrals.models import Referral

print(f'Total referrals: {Referral.objects.count()}')
print(f'Pending referrals: {Referral.objects.filter(status="pending").count()}')
print(f'Waiting referrals: {Referral.objects.filter(status="waiting").count()}')
print(f'In transit referrals: {Referral.objects.filter(status="in_transit").count()}')
print('\nAll referral statuses:')
for r in Referral.objects.all()[:20]:
    print(f'  - {r.referral_id}: {r.status} (Created: {r.created_at})')
