"""
Management command to populate hospital addresses.
This helps populate existing hospitals with address information.

Usage:
    python manage.py populate_hospital_addresses
"""

from django.core.management.base import BaseCommand
from referrals.models import ReferringHospital


class Command(BaseCommand):
    help = 'Populate hospital addresses with sample data'

    def handle(self, *args, **options):
        # Example: Update Davao Doctors Hospital
        hospital, created = ReferringHospital.objects.get_or_create(
            name='Davao Doctors Hospital',
            defaults={
                'is_inside_davao_city': True,
                'doh_level': 'tertiary',
                'region': 'Region XI (Davao Region)',
                'province': 'Davao del Sur',
                'city': 'Davao City',
                'barangay': 'Poblacion District',
                'street': 'Quirino Avenue corner Ponciano Street',
                'district': 'Poblacion District',
                'contact_number': '(082) 222-8000',
                'location': 'Davao City',
            }
        )
        
        if not created:
            # Update existing hospital
            hospital.is_inside_davao_city = True
            hospital.doh_level = 'tertiary'
            hospital.region = 'Region XI (Davao Region)'
            hospital.province = 'Davao del Sur'
            hospital.city = 'Davao City'
            hospital.barangay = 'Poblacion District'
            hospital.street = 'Quirino Avenue corner Ponciano Street'
            hospital.district = 'Poblacion District'
            hospital.contact_number = '(082) 222-8000'
            hospital.location = 'Davao City'
            hospital.save()
            self.stdout.write(
                self.style.SUCCESS(f'Updated: {hospital.name}')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Created: {hospital.name}')
            )
        
        # Add more hospitals as needed
        hospitals_data = [
            {
                'name': 'Southern Philippines Medical Center',
                'is_inside_davao_city': True,
                'doh_level': 'tertiary',
                'region': 'Region XI (Davao Region)',
                'province': 'Davao del Sur',
                'city': 'Davao City',
                'barangay': 'Bajada',
                'street': 'J.P. Laurel Avenue',
                'district': 'Bajada',
                'contact_number': '(082) 227-2731',
                'location': 'Davao City',
            },
            {
                'name': 'Davao Regional Medical Center',
                'is_inside_davao_city': True,
                'doh_level': 'tertiary',
                'region': 'Region XI (Davao Region)',
                'province': 'Davao del Sur',
                'city': 'Davao City',
                'barangay': 'Tagum',
                'street': 'Apokon Road',
                'district': 'Tagum',
                'contact_number': '(082) 221-6101',
                'location': 'Davao City',
            },
        ]
        
        for hospital_data in hospitals_data:
            hospital, created = ReferringHospital.objects.get_or_create(
                name=hospital_data['name'],
                defaults=hospital_data
            )
            
            if not created:
                # Update existing
                for key, value in hospital_data.items():
                    setattr(hospital, key, value)
                hospital.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Updated: {hospital.name}')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'Created: {hospital.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS('Hospital addresses populated successfully!')
        )
