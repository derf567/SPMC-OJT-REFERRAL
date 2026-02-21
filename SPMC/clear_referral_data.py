#!/usr/bin/env python
"""
Script to clear all referral data while keeping user accounts intact.
This is useful for testing or resetting the system to a clean state.

CAUTION: This will delete ALL referral-related data!

Usage:
    python clear_referral_data.py --check    # Preview what will be deleted
    python clear_referral_data.py --clear    # Actually delete the data
"""

import os
import sys
import django
import argparse

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from referrals.models import (
    Referral, 
    TransitInfo, 
    ReferralStatusHistory, 
    ReferralDocument,
    ReferrerDocument
)
from django.contrib.auth.models import User

def check_data():
    """Check what data exists in the database"""
    print("\n" + "="*80)
    print("DATABASE DATA CHECK")
    print("="*80 + "\n")
    
    # User accounts (will NOT be deleted)
    print("👥 USER ACCOUNTS (will be preserved):")
    print(f"   Total users: {User.objects.count()}")
    print(f"   - Superusers: {User.objects.filter(is_superuser=True).count()}")
    print(f"   - Staff users: {User.objects.filter(is_staff=True).count()}")
    print(f"   - Regular users: {User.objects.filter(is_superuser=False, is_staff=False).count()}")
    print()
    
    # Referral data (will be deleted)
    print("🗑️  REFERRAL DATA (will be deleted):")
    referral_count = Referral.objects.count()
    print(f"   Total referrals: {referral_count}")
    
    if referral_count > 0:
        print(f"   - Pending: {Referral.objects.filter(status='pending').count()}")
        print(f"   - Waiting: {Referral.objects.filter(status='waiting').count()}")
        print(f"   - Emergent: {Referral.objects.filter(status='emergent').count()}")
        print(f"   - Urgent: {Referral.objects.filter(status='urgent').count()}")
        print(f"   - Schedule OPD: {Referral.objects.filter(status='schedule_opd').count()}")
        print(f"   - In Transit: {Referral.objects.filter(status='in_transit').count()}")
        print(f"   - Completed: {Referral.objects.filter(status='completed').count()}")
        print(f"   - Cancelled: {Referral.objects.filter(status='cancelled').count()}")
    print()
    
    # Related data
    print("📋 RELATED DATA (will be deleted):")
    print(f"   Transit info records: {TransitInfo.objects.count()}")
    print(f"   Status history records: {ReferralStatusHistory.objects.count()}")
    print(f"   Referral documents: {ReferralDocument.objects.count()}")
    print(f"   Referrer documents: {ReferrerDocument.objects.count()}")
    print()
    
    print("="*80)
    print()
    
    return referral_count > 0

def clear_data():
    """Clear all referral data while keeping user accounts"""
    print("\n" + "="*80)
    print("CLEARING REFERRAL DATA")
    print("="*80 + "\n")
    
    # Delete in correct order (respecting foreign key constraints)
    
    # 1. Delete referral documents
    doc_count = ReferralDocument.objects.count()
    if doc_count > 0:
        ReferralDocument.objects.all().delete()
        print(f"✅ Deleted {doc_count} referral documents")
    
    # 2. Delete referrer documents
    ref_doc_count = ReferrerDocument.objects.count()
    if ref_doc_count > 0:
        ReferrerDocument.objects.all().delete()
        print(f"✅ Deleted {ref_doc_count} referrer documents")
    
    # 3. Delete status history
    history_count = ReferralStatusHistory.objects.count()
    if history_count > 0:
        ReferralStatusHistory.objects.all().delete()
        print(f"✅ Deleted {history_count} status history records")
    
    # 4. Delete transit info
    transit_count = TransitInfo.objects.count()
    if transit_count > 0:
        TransitInfo.objects.all().delete()
        print(f"✅ Deleted {transit_count} transit info records")
    
    # 5. Delete referrals (this is the main data)
    referral_count = Referral.objects.count()
    if referral_count > 0:
        Referral.objects.all().delete()
        print(f"✅ Deleted {referral_count} referrals")
    
    print()
    print("="*80)
    print("✅ ALL REFERRAL DATA CLEARED!")
    print("="*80)
    print()
    print("👥 User accounts have been preserved.")
    print(f"   Total users remaining: {User.objects.count()}")
    print()

def clear_specific_statuses(statuses):
    """Clear referrals with specific statuses only"""
    print("\n" + "="*80)
    print(f"CLEARING REFERRALS WITH STATUS: {', '.join(statuses)}")
    print("="*80 + "\n")
    
    referrals_to_delete = Referral.objects.filter(status__in=statuses)
    count = referrals_to_delete.count()
    
    if count == 0:
        print(f"⚠️  No referrals found with status: {', '.join(statuses)}")
        return
    
    print(f"Found {count} referrals to delete:")
    for status in statuses:
        status_count = Referral.objects.filter(status=status).count()
        if status_count > 0:
            print(f"   - {status}: {status_count}")
    print()
    
    # Delete related data first
    referral_ids = list(referrals_to_delete.values_list('id', flat=True))
    
    # Delete documents
    doc_count = ReferralDocument.objects.filter(referral_id__in=referral_ids).count()
    if doc_count > 0:
        ReferralDocument.objects.filter(referral_id__in=referral_ids).delete()
        print(f"✅ Deleted {doc_count} related documents")
    
    # Delete status history
    history_count = ReferralStatusHistory.objects.filter(referral_id__in=referral_ids).count()
    if history_count > 0:
        ReferralStatusHistory.objects.filter(referral_id__in=referral_ids).delete()
        print(f"✅ Deleted {history_count} related status history records")
    
    # Delete transit info
    transit_count = TransitInfo.objects.filter(referral_id__in=referral_ids).count()
    if transit_count > 0:
        TransitInfo.objects.filter(referral_id__in=referral_ids).delete()
        print(f"✅ Deleted {transit_count} related transit info records")
    
    # Delete the referrals
    referrals_to_delete.delete()
    print(f"✅ Deleted {count} referrals")
    print()

def main():
    parser = argparse.ArgumentParser(
        description='Clear referral data while keeping user accounts',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python clear_referral_data.py --check                    # Check what will be deleted
  python clear_referral_data.py --clear                    # Clear all referral data
  python clear_referral_data.py --status completed         # Clear only completed referrals
  python clear_referral_data.py --status completed,cancelled  # Clear multiple statuses
        """
    )
    parser.add_argument('--check', action='store_true', 
                       help='Check what data exists (no deletion)')
    parser.add_argument('--clear', action='store_true', 
                       help='Clear all referral data (keeps user accounts)')
    parser.add_argument('--status', type=str, 
                       help='Clear only referrals with specific status(es) (comma-separated)')
    
    args = parser.parse_args()
    
    if args.status:
        # Clear specific statuses
        statuses = [s.strip() for s in args.status.split(',')]
        valid_statuses = ['pending', 'waiting', 'in_transit', 'emergent', 'urgent', 
                         'schedule_opd', 'completed', 'cancelled']
        
        # Validate statuses
        invalid = [s for s in statuses if s not in valid_statuses]
        if invalid:
            print(f"❌ Invalid status(es): {', '.join(invalid)}")
            print(f"Valid statuses: {', '.join(valid_statuses)}")
            return
        
        # Check first
        has_data = check_data()
        if not has_data:
            print("⚠️  No referral data found in database.")
            return
        
        # Confirm
        print(f"⚠️  WARNING: This will delete all referrals with status: {', '.join(statuses)}")
        response = input("\nAre you sure you want to continue? (yes/no): ")
        if response.lower() not in ['yes', 'y']:
            print("\n❌ Operation cancelled")
            return
        
        clear_specific_statuses(statuses)
        
    elif args.clear:
        # Clear all referral data
        has_data = check_data()
        
        if not has_data:
            print("⚠️  No referral data found in database.")
            return
        
        print("⚠️  WARNING: This will delete ALL referral data!")
        print("⚠️  User accounts will be preserved.")
        print()
        response = input("Are you sure you want to continue? Type 'DELETE ALL' to confirm: ")
        
        if response != 'DELETE ALL':
            print("\n❌ Operation cancelled")
            return
        
        clear_data()
        
    else:
        # Just check
        has_data = check_data()
        
        if has_data:
            print("💡 To clear all referral data, run:")
            print("   python clear_referral_data.py --clear")
            print()
            print("💡 To clear specific statuses, run:")
            print("   python clear_referral_data.py --status completed,cancelled")
        else:
            print("✅ Database is already clean (no referral data)")

if __name__ == '__main__':
    main()
