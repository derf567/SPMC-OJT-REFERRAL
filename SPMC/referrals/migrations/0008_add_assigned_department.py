# Generated migration for adding assigned_department field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0007_add_outpatient_scheduling_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='referral',
            name='assigned_department',
            field=models.CharField(
                blank=True,
                choices=[
                    ('emergency', 'Emergency Department'),
                    ('internal_medicine', 'Internal Medicine'),
                    ('surgery', 'Surgery Department'),
                    ('obstetrics_gynecology', 'Obstetrics and Gynecology'),
                    ('pediatrics', 'Pediatrics'),
                    ('orthopedics', 'Orthopedics'),
                    ('cardiology', 'Cardiology'),
                    ('neurology', 'Neurology'),
                    ('anesthesiology', 'Anesthesiology'),
                    ('radiology', 'Radiology'),
                    ('pathology', 'Pathology'),
                    ('other', 'Other Department')
                ],
                help_text='Department assigned by EDCC when transferring to triage',
                max_length=50,
                null=True
            ),
        ),
    ]