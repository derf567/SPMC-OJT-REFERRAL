# Generated migration for delay notification fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0024_add_triage_verification_workflow'),
    ]

    operations = [
        migrations.AddField(
            model_name='referral',
            name='delay_notified_at',
            field=models.DateTimeField(blank=True, help_text='When triage/EDCC was notified of transfer delay', null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='delay_reason',
            field=models.TextField(blank=True, help_text='Reason for transfer delay', null=True),
        ),
    ]
