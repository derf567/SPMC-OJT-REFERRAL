"""
Management command to expire referrals not processed within 24 hours.
This aligns with the documented process flow requirement.

Usage:
    python manage.py expire_old_referrals

Setup as cron job (run every hour):
    0 * * * * cd /path/to/SPMC && python manage.py expire_old_referrals
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from referrals.models import Referral, ReferralStatusHistory


class Command(BaseCommand):
    help = 'Expire referrals not processed within 24 hours (auto-cancellation)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be expired without actually expiring',
        )
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Number of hours before expiration (default: 24)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        hours = options['hours']
        
        cutoff_time = timezone.now() - timedelta(hours=hours)
        
        # Find pending referrals older than cutoff time
        expired_referrals = Referral.objects.filter(
            status='pending',
            created_at__lt=cutoff_time
        )
        
        count = expired_referrals.count()
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would expire {count} referral(s) older than {hours} hours'
                )
            )
            for referral in expired_referrals:
                self.stdout.write(
                    f'  - {referral.referral_id}: {referral.patient_full_name} '
                    f'(created {referral.created_at})'
                )
            return
        
        # Expire the referrals
        for referral in expired_referrals:
            old_status = referral.status
            referral.status = 'cancelled'
            referral.save()
            
            # Create status history
            ReferralStatusHistory.objects.create(
                referral=referral,
                old_status=old_status,
                new_status='cancelled',
                changed_by=None,  # System action
                notes=f'Auto-expired: Not processed within {hours} hours'
            )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Expired: {referral.referral_id} - {referral.patient_full_name}'
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully expired {count} referral(s)'
            )
        )
