# Data migration to convert existing referrer profession values

from django.db import migrations


def migrate_profession_data(apps, schema_editor):
    """Convert existing profession text values to new choice values"""
    Referral = apps.get_model('referrals', 'Referral')
    
    # Mapping of old values to new choice values
    profession_mapping = {
        'physician': 'doctor',
        'doctor': 'doctor',
        'md': 'doctor',
        'nurse': 'nurse',
        'rn': 'nurse',
        'barangay health worker': 'barangay_health_worker',
        'bhw': 'barangay_health_worker',
    }
    
    for referral in Referral.objects.all():
        old_profession = referral.referrer_profession.lower().strip() if referral.referrer_profession else ''
        
        # Try to match with known professions
        matched = False
        for key, value in profession_mapping.items():
            if key in old_profession:
                referral.referrer_profession = value
                matched = True
                break
        
        # If no match, set to 'others' and store original value
        if not matched and old_profession:
            referral.referrer_profession_other = referral.referrer_profession
            referral.referrer_profession = 'others'
        elif not old_profession:
            # If empty, set default to 'doctor'
            referral.referrer_profession = 'doctor'
        
        referral.save()


def reverse_migration(apps, schema_editor):
    """Reverse the migration - restore original values where possible"""
    Referral = apps.get_model('referrals', 'Referral')
    
    for referral in Referral.objects.all():
        if referral.referrer_profession == 'others' and referral.referrer_profession_other:
            referral.referrer_profession = referral.referrer_profession_other
            referral.referrer_profession_other = None
            referral.save()


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0021_add_referrer_profession_choices'),
    ]

    operations = [
        migrations.RunPython(migrate_profession_data, reverse_migration),
    ]
