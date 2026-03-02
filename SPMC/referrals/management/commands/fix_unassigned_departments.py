from django.core.management.base import BaseCommand
from referrals.models import Referral

class Command(BaseCommand):
    help = 'Fix referrals in waiting status without assigned department'

    def handle(self, *args, **options):
        # Find all waiting referrals without assigned department
        unassigned_referrals = Referral.objects.filter(
            status='waiting',
            assigned_department__isnull=True
        )
        
        count = unassigned_referrals.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('No unassigned referrals found!'))
            return
        
        self.stdout.write(f'Found {count} waiting referrals without assigned department:')
        
        for referral in unassigned_referrals:
            self.stdout.write(f'  - {referral.referral_id}: {referral.patient_full_name}')
            self.stdout.write(f'    Specialty: {referral.specialty_needed.name}')
            
            # Try to assign based on specialty
            specialty_name = referral.specialty_needed.name.lower()
            
            # Map specialties to departments
            department_mapping = {
                'surgery': 'surgery',
                'internal medicine': 'internal_medicine',
                'pediatrics': 'pediatrics',
                'obstetrics': 'obstetrics_gynecology',
                'gynecology': 'obstetrics_gynecology',
                'orthopedics': 'orthopedics',
                'cardiology': 'cardiology',
                'neurology': 'neurology',
                'anesthesiology': 'anesthesiology',
                'radiology': 'radiology',
                'pathology': 'pathology',
            }
            
            # Find matching department
            assigned_dept = None
            for keyword, dept in department_mapping.items():
                if keyword in specialty_name:
                    assigned_dept = dept
                    break
            
            # Default to emergency if no match
            if not assigned_dept:
                assigned_dept = 'emergency'
            
            # Update the referral
            referral.assigned_department = assigned_dept
            referral.save()
            
            dept_display = dict(Referral.DEPARTMENT_CHOICES).get(assigned_dept, assigned_dept)
            self.stdout.write(self.style.SUCCESS(f'    ✓ Assigned to: {dept_display}'))
        
        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully updated {count} referrals!'))
