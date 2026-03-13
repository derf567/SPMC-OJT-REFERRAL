# Generated migration for adding referrer_contact_numbers field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0030_main_service_logic'),
    ]

    operations = [
        migrations.AddField(
            model_name='referral',
            name='referrer_contact_numbers',
            field=models.JSONField(blank=True, default=list, help_text='Referrer contact numbers (multiple)'),
        ),
    ]
