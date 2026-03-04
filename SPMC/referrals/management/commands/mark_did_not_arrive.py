"""
Management command to mark in-transit referrals as "Did Not Arrive" after 24 hours.
This aligns with the documented process flow requirement.

Usage:
    python manage.py mark_did_not_arrive

Setup as cron job (run every hour):
    0 * * * * cd /path/to/SPMC && python manage.py mark_did_not_arrive
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from referrals.models import Referral, ReferralStatusHistory


class Command(BaseCommand):
    help = 'Mark in-transit referrals as cancelled if patient did not arrive within 24 hours'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be marked without actually marking',
        )
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Number of hours before marking as did not arrive (default: 24)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        hours = options['hours']
        
        cutoff_time = timezone.now() - timedelta(hours=hours)
        
        # Find in-transit referrals older than cutoff time
        # Use the transit info creation time or referral update time
        did_not_arrive = Referral.objects.filter(
            status='in_transit',
            updated_at__lt=cutoff_time
        )
        
        count = did_not_arrive.count()
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would mark {count} referral(s) as "Did Not Arrive"'
                )
            )
            for referral in did_not_arrive:
                self.stdout.write(
                    f'  - {referral.referral_id}: {referral.patient_full_name} '
                    f'(in transit since {referral.updated_at})'
                )
            return
        
        # Mark as did not arrive (cancelled with specific note)
        for referral in did_not_arrive:
            old_status = referral.status
            referral.status = 'cancelled'
            referral.save()
            
            # Create status history
            ReferralStatusHistory.objects.create(
                referral=referral,
                old_status=old_status,
                new_status='cancelled',
                changed_by=None,  # System action
                notes=f'Patient did not arrive within {hours} hours of transit'
            )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Marked as Did Not Arrive: {referral.referral_id} - {referral.patient_full_name}'
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully marked {count} referral(s) as "Did Not Arrive"'
            )
        )
