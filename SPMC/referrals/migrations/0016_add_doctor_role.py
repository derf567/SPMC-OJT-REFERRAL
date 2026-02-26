# Generated migration for adding doctor role to UserProfile

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0015_add_contact_numbers_to_referral'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='role',
            field=models.CharField(
                choices=[
                    ('edcc_personnel', 'EDCC Personnel'),
                    ('call_triage', 'EDMAR/EDHO (Call Triage)'),
                    ('admin', 'Administrator'),
                    ('doctor', 'Doctor'),
                    ('referrer', 'Referrer')
                ],
                default='edcc_personnel',
                max_length=20
            ),
        ),
    ]
