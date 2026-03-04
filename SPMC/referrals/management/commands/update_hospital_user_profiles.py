"""
Management command to update hospital user profiles with address information.
This syncs UserProfile data with ReferringHospital data.

Usage:
    python manage.py update_hospital_user_profiles
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from referrals.models import UserProfile, ReferringHospital


class Command(BaseCommand):
    help = 'Update hospital user profiles with address information from ReferringHospital'

    def handle(self, *args, **options):
        # Find all hospital account users
        hospital_profiles = UserProfile.objects.filter(
            role='referrer',
            hospital_name__isnull=False
        ).exclude(hospital_name='')
        
        updated_count = 0
        
        for profile in hospital_profiles:
            # Find matching hospital in ReferringHospital
            try:
                hospital = ReferringHospital.objects.get(name=profile.hospital_name)
                
                # Update profile with hospital address data
                profile.hospital_region = hospital.region or profile.hospital_region
                profile.hospital_province = hospital.province or profile.hospital_province
                profile.hospital_city = hospital.city or profile.hospital_city
                profile.hospital_barangay = hospital.barangay or profile.hospital_barangay
                profile.hospital_street = hospital.street or profile.hospital_street
                profile.hospital_district = hospital.district or profile.hospital_district
                profile.hospital_doh_level = hospital.doh_level or profile.hospital_doh_level
                profile.hospital_location = hospital.location or profile.hospital_location
                profile.is_inside_davao = hospital.is_inside_davao_city
                
                # Update contact numbers if available
                if hospital.contact_number and not profile.contact_numbers:
                    profile.contact_numbers = [hospital.contact_number]
                
                profile.save()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Updated profile for: {profile.user.username} ({profile.hospital_name})'
                    )
                )
                updated_count += 1
                
            except ReferringHospital.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(
                        f'Hospital not found: {profile.hospital_name} (User: {profile.user.username})'
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Error updating {profile.user.username}: {str(e)}'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully updated {updated_count} hospital user profile(s)'
            )
        )
