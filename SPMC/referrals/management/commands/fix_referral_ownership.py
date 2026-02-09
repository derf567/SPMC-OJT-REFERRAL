from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from referrals.models import Referral, UserProfile


class Command(BaseCommand):
    help = 'Fix referral ownership by matching referrer names with registered referrer users'

    def handle(self, *args, **options):
        # Get the external_system user
        try:
            external_system_user = User.objects.get(username='external_system')
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING('No external_system user found'))
            return

        # Get all referrals created by external_system
        external_referrals = Referral.objects.filter(created_by=external_system_user)
        
        if not external_referrals.exists():
            self.stdout.write(self.style.SUCCESS('No referrals need fixing'))
            return

        self.stdout.write(f'Found {external_referrals.count()} referrals created by external_system')

        # Get all referrer users
        referrer_users = User.objects.filter(profile__role='referrer')
        
        fixed_count = 0
        for referral in external_referrals:
            # Try to match by referrer name
            referrer_name = referral.referrer_name
            if not referrer_name:
                continue
                
            # Split the name and try to match with user's first and last name
            name_parts = referrer_name.strip().split()
            if len(name_parts) >= 2:
                first_name = name_parts[0]
                last_name = ' '.join(name_parts[1:])
                
                # Try to find a matching user
                matching_user = referrer_users.filter(
                    first_name__icontains=first_name,
                    last_name__icontains=last_name
                ).first()
                
                if matching_user:
                    self.stdout.write(
                        f"Reassigning referral {referral.referral_id} from '{referrer_name}' to user '{matching_user.username}'"
                    )
                    referral.created_by = matching_user
                    referral.save()
                    fixed_count += 1
                else:
                    self.stdout.write(
                        f"No matching user found for referrer '{referrer_name}' (referral {referral.referral_id})"
                    )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully reassigned {fixed_count} referrals')
        )