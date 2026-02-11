from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth.models import User
from referrals.models import (
    Referral, TransitInfo, ReferrerDocument, ReferralDocument,
    ReferralStatusHistory, UserProfile, ReferrerAccount,
    ReferringHospital, Specialty
)


class Command(BaseCommand):
    help = 'Clean all patient and referral data while preserving user accounts'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting data cleanup...'))
        self.stdout.write(self.style.WARNING('This will delete all patients and referrals but keep all accounts.'))
        
        try:
            with transaction.atomic():
                # Count records before deletion
                referral_count = Referral.objects.count()
                transit_count = TransitInfo.objects.count()
                referral_document_count = ReferralDocument.objects.count()
                status_history_count = ReferralStatusHistory.objects.count()
                
                # Count accounts (these will be preserved)
                user_count = User.objects.count()
                profile_count = UserProfile.objects.count()
                referrer_account_count = ReferrerAccount.objects.count()
                referrer_document_count = ReferrerDocument.objects.count()
                hospital_count = ReferringHospital.objects.count()
                specialty_count = Specialty.objects.count()
                
                self.stdout.write(f'\nRecords to be deleted:')
                self.stdout.write(f'  - Referrals: {referral_count}')
                self.stdout.write(f'  - Transit Info: {transit_count}')
                self.stdout.write(f'  - Referral Documents: {referral_document_count}')
                self.stdout.write(f'  - Status History: {status_history_count}')
                
                self.stdout.write(f'\nAccounts and reference data to be preserved:')
                self.stdout.write(f'  - Users: {user_count}')
                self.stdout.write(f'  - User Profiles: {profile_count}')
                self.stdout.write(f'  - Referrer Accounts: {referrer_account_count}')
                self.stdout.write(f'  - Referrer Documents: {referrer_document_count}')
                self.stdout.write(f'  - Referring Hospitals: {hospital_count}')
                self.stdout.write(f'  - Specialties: {specialty_count}')
                
                # Delete data (order matters due to foreign keys)
                ReferralStatusHistory.objects.all().delete()
                self.stdout.write(self.style.SUCCESS(f'✓ Deleted {status_history_count} status history records'))
                
                ReferralDocument.objects.all().delete()
                self.stdout.write(self.style.SUCCESS(f'✓ Deleted {referral_document_count} referral documents'))
                
                TransitInfo.objects.all().delete()
                self.stdout.write(self.style.SUCCESS(f'✓ Deleted {transit_count} transit info records'))
                
                Referral.objects.all().delete()
                self.stdout.write(self.style.SUCCESS(f'✓ Deleted {referral_count} referrals'))
                
                # Verify accounts are still intact
                remaining_users = User.objects.count()
                remaining_profiles = UserProfile.objects.count()
                remaining_referrer_accounts = ReferrerAccount.objects.count()
                remaining_referrer_documents = ReferrerDocument.objects.count()
                remaining_hospitals = ReferringHospital.objects.count()
                remaining_specialties = Specialty.objects.count()
                
                self.stdout.write(f'\nAccounts and reference data preserved:')
                self.stdout.write(self.style.SUCCESS(f'  ✓ Users: {remaining_users}'))
                self.stdout.write(self.style.SUCCESS(f'  ✓ User Profiles: {remaining_profiles}'))
                self.stdout.write(self.style.SUCCESS(f'  ✓ Referrer Accounts: {remaining_referrer_accounts}'))
                self.stdout.write(self.style.SUCCESS(f'  ✓ Referrer Documents: {remaining_referrer_documents}'))
                self.stdout.write(self.style.SUCCESS(f'  ✓ Referring Hospitals: {remaining_hospitals}'))
                self.stdout.write(self.style.SUCCESS(f'  ✓ Specialties: {remaining_specialties}'))
                
                self.stdout.write(self.style.SUCCESS('\n✓ Data cleanup completed successfully!'))
                self.stdout.write(self.style.SUCCESS('All referral data has been removed.'))
                self.stdout.write(self.style.SUCCESS('All user accounts and reference data have been preserved.'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n✗ Error during cleanup: {str(e)}'))
            raise
