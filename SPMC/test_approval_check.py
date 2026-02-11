import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from django.contrib.auth.models import User
from referrals.models import ReferrerAccount

print("=== REFERRER ACCOUNT APPROVAL STATUS ===\n")

# Check all referrer accounts
referrer_accounts = ReferrerAccount.objects.all()

if referrer_accounts.exists():
    for account in referrer_accounts:
        print(f"Username: {account.user.username}")
        print(f"Name: {account.first_name} {account.last_name}")
        print(f"Type: {account.get_referrer_type_display()}")
        print(f"Approval Status: {account.get_approval_status_display()}")
        print(f"Can Login: {'Yes' if account.approval_status == 'approved' else 'No (Blocked)'}")
        print("-" * 50)
else:
    print("No referrer accounts found.")

print("\n=== SUMMARY ===")
print(f"Total Referrer Accounts: {referrer_accounts.count()}")
print(f"Pending: {referrer_accounts.filter(approval_status='pending').count()}")
print(f"Approved: {referrer_accounts.filter(approval_status='approved').count()}")
print(f"Rejected: {referrer_accounts.filter(approval_status='rejected').count()}")
