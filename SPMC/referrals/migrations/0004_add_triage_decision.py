# Generated migration for triage decision fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0003_alter_transitinfo_driver_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='referral',
            name='triage_decision',
            field=models.CharField(blank=True, choices=[('emergent', 'Emergent'), ('urgent', 'Urgent'), ('schedule_opd', 'Schedule for OPD')], max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='triage_notes',
            field=models.TextField(blank=True, help_text='Additional notes from triage team', null=True),
        ),
    ]