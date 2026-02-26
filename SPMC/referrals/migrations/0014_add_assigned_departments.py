# Generated migration for adding assigned_departments field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0013_userprofile_contact_numbers_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='referral',
            name='assigned_departments',
            field=models.JSONField(default=list, blank=True, null=True, help_text='Multiple departments assigned by triage team'),
        ),
    ]
