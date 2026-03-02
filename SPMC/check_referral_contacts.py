from referrals.models import Referral, UserProfile
from django.contrib.auth.models import User

print("\n" + "="*60)
print("CHECKING REFERRAL CONTACT NUMBERS")
print("="*60)

# Get the latest referral
referral = Referral.objects.order_by('-created_at').first()

if referral:
    print(f"\nReferral ID: {referral.referral_id}")
    print(f"Patient: {referral.patient_full_name}")
    print(f"Created by: {referral.created_by.username}")
    print(f"Created at: {referral.created_at}")
    print(f"\nContact Numbers in Referral: {referral.contact_numbers}")
    print(f"Type: {type(referral.contact_numbers)}")
    print(f"Length: {len(referral.contact_numbers)}")
    
    # Check if creator has profile with contact numbers
    if hasattr(referral.created_by, 'profile'):
        profile = referral.created_by.profile
        print(f"\nCreator Profile Contact Numbers: {profile.contact_numbers}")
        print(f"Profile Hospital: {profile.hospital_name}")
        
        # If referral has no contact numbers but profile does, update it
        if not referral.contact_numbers and profile.contact_numbers:
            print("\n⚠️ ISSUE FOUND: Referral has no contact numbers but profile does!")
            print("This means the referral was created before the field was added.")
            print("\nDo you want to update this referral with the profile contact numbers?")
            print("Run: python manage.py shell")
            print("Then: from referrals.models import Referral")
            print(f"      r = Referral.objects.get(id={referral.id})")
            print(f"      r.contact_numbers = {profile.contact_numbers}")
            print("      r.save()")
    else:
        print("\n⚠️ Creator has no profile")
else:
    print("\nNo referrals found")

print("\n" + "="*60)
