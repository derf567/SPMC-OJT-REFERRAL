from referrals.models import Referral, TransitInfo

print("\n" + "="*60)
print("CHECKING TRANSIT INFO (WATCHER CONTACT NUMBER)")
print("="*60)

# Get the latest referral
referral = Referral.objects.order_by('-created_at').first()

if referral:
    print(f"\nReferral ID: {referral.referral_id}")
    print(f"Patient: {referral.patient_full_name}")
    
    # Check if transit info exists
    try:
        transit = referral.transit_info
        print(f"\n✓ Transit Info EXISTS")
        print(f"  Watcher Name: {transit.watcher_name}")
        print(f"  Watcher Age: {transit.watcher_age}")
        print(f"  Relation: {transit.relation_to_patient}")
        print(f"  Contact Number: {transit.contact_number}")
        print(f"  Escort Nurse: {transit.escort_nurse}")
        print(f"  Driver: {transit.driver}")
    except TransitInfo.DoesNotExist:
        print(f"\n✗ NO Transit Info for this referral")
        print("  This referral was created without transit information")
else:
    print("\nNo referrals found")

print("\n" + "="*60)
