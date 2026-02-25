from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from referrals.models import UserProfile, ReferrerAccount
import json


class Command(BaseCommand):
    help = 'Delete and recreate davao_doctors account with all fields properly filled'

    def handle(self, *args, **options):
        self.stdout.write("=" * 70)
        self.stdout.write("DELETING AND RECREATING DAVAO DOCTORS HOSPITAL ACCOUNT")
        self.stdout.write("=" * 70)

        # Step 1: Delete existing account
        self.stdout.write("\n1. Deleting existing account...")
        try:
            user = User.objects.get(username='davao_doctors')
            user_id = user.id
            
            # Delete related records
            UserProfile.objects.filter(user=user).delete()
            ReferrerAccount.objects.filter(user=user).delete()
            
            # Delete the user
            user.delete()
            
            self.stdout.write(self.style.SUCCESS(f"   ✓ Deleted account: davao_doctors (ID: {user_id})"))
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING("   ℹ Account 'davao_doctors' not found (will create new)"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ✗ Error deleting account: {e}"))

        # Step 2: Create new account
        self.stdout.write("\n2. Creating new account...")
        try:
            # Create user
            user = User.objects.create_user(
                username='davao_doctors',
                email='admin@davaodoctors.com',
                password='hospital123',
                first_name='Davao',
                last_name='Doctors Hospital'
            )
            self.stdout.write(self.style.SUCCESS(f"   ✓ Created user: {user.username} (ID: {user.id})"))
            
            # Create user profile with ALL fields
            profile = UserProfile.objects.create(
                user=user,
                role='referrer',
                # Hospital information
                hospital_name='Davao Doctors Hospital',
                hospital_location='J.P. Laurel Avenue, Bajada, Davao City',
                is_inside_davao=True,
                hospital_doh_level='tertiary',
                # Contact information
                contact_numbers=json.dumps(['082-222-8000', '082-222-8001', '0917-123-4567']),
                cellphone='082-222-8000',
                # Detailed address fields
                hospital_region='Region XI (Davao Region)',
                hospital_province='Davao del Sur',
                hospital_city='Davao City',
                hospital_barangay='Bajada',
                hospital_street='J.P. Laurel Avenue',
                hospital_district='Poblacion District',
                # Other fields
                profession='Hospital Administrator'
            )
            self.stdout.write(self.style.SUCCESS("   ✓ Created profile with all address fields"))
            
            # Create referrer account (approved)
            referrer_account = ReferrerAccount.objects.create(
                user=user,
                referrer_type='hospital',
                approval_status='approved',
                hospital_name='Davao Doctors Hospital',
                hospital_location='J.P. Laurel Avenue, Bajada, Davao City'
            )
            self.stdout.write(self.style.SUCCESS("   ✓ Created referrer account (status: approved)"))
            
            # Step 3: Verify all fields
            self.stdout.write("\n3. Verifying created account...")
            user = User.objects.get(username='davao_doctors')
            profile = UserProfile.objects.get(user=user)
            
            self.stdout.write("\n   Account Details:")
            self.stdout.write(f"   ├─ Username: {user.username}")
            self.stdout.write(f"   ├─ Email: {user.email}")
            self.stdout.write(f"   ├─ Name: {user.first_name} {user.last_name}")
            self.stdout.write(f"   ├─ Hospital Name: {profile.hospital_name}")
            self.stdout.write(f"   ├─ DOH Level: {profile.hospital_doh_level}")
            self.stdout.write(f"   ├─ Region: {profile.hospital_region}")
            self.stdout.write(f"   ├─ Province: {profile.hospital_province}")
            self.stdout.write(f"   ├─ City: {profile.hospital_city}")
            self.stdout.write(f"   ├─ Barangay: {profile.hospital_barangay}")
            self.stdout.write(f"   ├─ Street: {profile.hospital_street}")
            self.stdout.write(f"   ├─ District: {profile.hospital_district}")
            self.stdout.write(f"   ├─ Contact Numbers: {profile.contact_numbers}")
            self.stdout.write(f"   └─ Inside Davao: {profile.is_inside_davao}")
            
            # Check for empty fields
            empty_fields = []
            if not profile.hospital_name: empty_fields.append('hospital_name')
            if not profile.hospital_region: empty_fields.append('hospital_region')
            if not profile.hospital_province: empty_fields.append('hospital_province')
            if not profile.hospital_city: empty_fields.append('hospital_city')
            if not profile.hospital_barangay: empty_fields.append('hospital_barangay')
            if not profile.hospital_street: empty_fields.append('hospital_street')
            if not profile.hospital_district: empty_fields.append('hospital_district')
            if not profile.contact_numbers: empty_fields.append('contact_numbers')
            if not profile.hospital_doh_level: empty_fields.append('hospital_doh_level')
            
            if empty_fields:
                self.stdout.write(self.style.WARNING(f"\n   ⚠ WARNING: Empty fields: {', '.join(empty_fields)}"))
            else:
                self.stdout.write(self.style.SUCCESS("\n   ✓ All required fields are filled!"))
            
            self.stdout.write("\n" + "=" * 70)
            self.stdout.write(self.style.SUCCESS("SUCCESS! Account created and verified."))
            self.stdout.write("=" * 70)
            self.stdout.write("\nLogin credentials:")
            self.stdout.write("  Username: davao_doctors")
            self.stdout.write("  Password: hospital123")
            self.stdout.write("\nThe account is approved and ready to use.")
            self.stdout.write("All address fields are properly filled for autofill.")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n   ✗ Error creating account: {e}"))
            import traceback
            traceback.print_exc()
