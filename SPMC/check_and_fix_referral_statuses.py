#!/usr/bin/env python
"""
Script to check and optionally fix referral statuses in the database.
This helps identify referrals that might be in an incorrect state.

Usage:
    python check_and_fix_referral_statuses.py --check    # Just check, don't fix
    python check_and_fix_referral_statuses.py --fix      # Check and fix issues
"""

import os
import sys
import django
import argparse
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from referrals.models import Referral

def check_referral_statuses():
    """Check all referrals and report their statuses"""
    print("\n" + "="*80)
    print("REFERRAL STATUS CHECK")
    print("="*80 + "\n")
    
    all_referrals = Referral.objects.all().order_by('-created_at')
    
    print(f"Total referrals in database: {all_referrals.count()}\n")
    
    # Count by status
    status_counts = {}
    for status_choice in Referral.STATUS_CHOICES:
        status_code = status_choice[0]
        count = Referral.objects.filter(status=status_code).count()
        status_counts[status_code] = count
        print(f"  {status_choice[1]:20s}: {count:3d}")
    
    print("\n" + "-"*80)
    print("DETAILED REFERRAL LIST")
    print("-"*80 + "\n")
    
    issues = []
    
    for ref in all_referrals[:20]:  # Show first 20
        print(f"ID: {ref.id:3d} | Ref ID: {ref.referral_id:15s} | Status: {ref.status:15s}")
        print(f"      Patient: {ref.patient_full_name}")
        print(f"      Created: {ref.created_at.strftime('%Y-%m-%d %H:%M')}")
        
        if ref.transferred_at:
            print(f"      Transferred: {ref.transferred_at.strftime('%Y-%m-%d %H:%M')} by {ref.transferred_by.get_full_name() if ref.transferred_by else 'Unknown'}")
        
        if ref.triaged_at:
            print(f"      Triaged: {ref.triaged_at.strftime('%Y-%m-%d %H:%M')} by {ref.triaged_by.get_full_name() if ref.triaged_by else 'Unknown'}")
            print(f"      Triage Decision: {ref.triage_decision}")
        
        if ref.assigned_department:
            print(f"      Department: {ref.assigned_department}")
        
        # Check for inconsistencies
        if ref.status == 'waiting' and ref.triage_decision:
            issues.append({
                'id': ref.id,
                'issue': 'Status is waiting but has triage_decision',
                'current_status': ref.status,
                'triage_decision': ref.triage_decision,
                'suggested_fix': f"Change status to {ref.triage_decision}"
            })
            print(f"      ⚠️  ISSUE: Status is 'waiting' but triage_decision is '{ref.triage_decision}'")
        
        if ref.status in ['emergent', 'urgent', 'schedule_opd'] and not ref.triage_decision:
            issues.append({
                'id': ref.id,
                'issue': f'Status is {ref.status} but no triage_decision',
                'current_status': ref.status,
                'triage_decision': None,
                'suggested_fix': f"Set triage_decision to {ref.status}"
            })
            print(f"      ⚠️  ISSUE: Status is '{ref.status}' but no triage_decision set")
        
        if ref.status in ['emergent', 'urgent', 'schedule_opd'] and not ref.triaged_at:
            issues.append({
                'id': ref.id,
                'issue': f'Status is {ref.status} but no triaged_at timestamp',
                'current_status': ref.status,
                'triage_decision': ref.triage_decision,
                'suggested_fix': "Set triaged_at to current time"
            })
            print(f"      ⚠️  ISSUE: Status is '{ref.status}' but no triaged_at timestamp")
        
        print()
    
    if all_referrals.count() > 20:
        print(f"... and {all_referrals.count() - 20} more referrals\n")
    
    return issues

def fix_referral_statuses(issues):
    """Fix identified issues"""
    if not issues:
        print("\n✅ No issues found! All referrals are in correct state.\n")
        return
    
    print("\n" + "="*80)
    print("FIXING ISSUES")
    print("="*80 + "\n")
    
    for issue in issues:
        ref = Referral.objects.get(id=issue['id'])
        print(f"Fixing Referral ID {ref.id} ({ref.referral_id}):")
        print(f"  Issue: {issue['issue']}")
        print(f"  Suggested fix: {issue['suggested_fix']}")
        
        # Fix: Status is waiting but has triage_decision
        if 'Status is waiting but has triage_decision' in issue['issue']:
            old_status = ref.status
            ref.status = ref.triage_decision
            ref.save()
            print(f"  ✅ Changed status from '{old_status}' to '{ref.status}'")
        
        # Fix: Status is triaged but no triage_decision
        elif 'but no triage_decision' in issue['issue']:
            ref.triage_decision = ref.status
            ref.save()
            print(f"  ✅ Set triage_decision to '{ref.triage_decision}'")
        
        # Fix: Status is triaged but no triaged_at
        elif 'but no triaged_at timestamp' in issue['issue']:
            ref.triaged_at = ref.updated_at or ref.created_at
            ref.save()
            print(f"  ✅ Set triaged_at to {ref.triaged_at}")
        
        print()

def reset_to_waiting(referral_ids):
    """Reset specific referrals back to waiting status"""
    print("\n" + "="*80)
    print("RESETTING REFERRALS TO WAITING STATUS")
    print("="*80 + "\n")
    
    for ref_id in referral_ids:
        try:
            ref = Referral.objects.get(id=ref_id)
            old_status = ref.status
            old_decision = ref.triage_decision
            
            ref.status = 'waiting'
            ref.triage_decision = None
            ref.triage_notes = None
            ref.triaged_by = None
            ref.triaged_at = None
            ref.save()
            
            print(f"✅ Referral ID {ref.id} ({ref.referral_id})")
            print(f"   Status: {old_status} → waiting")
            print(f"   Triage decision: {old_decision} → None")
            print()
        except Referral.DoesNotExist:
            print(f"❌ Referral ID {ref_id} not found")
            print()

def main():
    parser = argparse.ArgumentParser(description='Check and fix referral statuses')
    parser.add_argument('--check', action='store_true', help='Check referral statuses (no changes)')
    parser.add_argument('--fix', action='store_true', help='Check and fix issues automatically')
    parser.add_argument('--reset', type=str, help='Reset specific referral IDs to waiting (comma-separated)')
    
    args = parser.parse_args()
    
    if args.reset:
        # Reset specific referrals to waiting
        ref_ids = [int(x.strip()) for x in args.reset.split(',')]
        reset_to_waiting(ref_ids)
    elif args.fix:
        # Check and fix
        issues = check_referral_statuses()
        if issues:
            print(f"\n⚠️  Found {len(issues)} issues")
            response = input("\nDo you want to fix these issues? (yes/no): ")
            if response.lower() in ['yes', 'y']:
                fix_referral_statuses(issues)
                print("\n✅ All issues fixed!")
            else:
                print("\n❌ No changes made")
        else:
            print("\n✅ No issues found!")
    else:
        # Just check
        issues = check_referral_statuses()
        if issues:
            print(f"\n⚠️  Found {len(issues)} issues")
            print("\nRun with --fix to automatically fix these issues")
            print("Or run with --reset ID1,ID2,ID3 to reset specific referrals to waiting status")
        else:
            print("\n✅ No issues found!")

if __name__ == '__main__':
    main()
