# Generated migration for triage verification workflow

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('referrals', '0023_transitinfo_remarks'),
    ]

    operations = [
        migrations.AddField(
            model_name='referral',
            name='triage_verified_by',
            field=models.ForeignKey(blank=True, help_text='Triage/EDCC personnel who verified the referral', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='verified_referrals', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='referral',
            name='triage_verified_at',
            field=models.DateTimeField(blank=True, help_text='When triage/EDCC verified the referral for transit', null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='triage_verification_notes',
            field=models.TextField(blank=True, help_text='Notes from triage/EDCC verification', null=True),
        ),
        migrations.AlterField(
            model_name='referral',
            name='status',
            field=models.CharField(choices=[('pending', 'Pending'), ('in_triage', 'In Triage'), ('waiting_acceptance', 'Waiting Department Acceptance'), ('awaiting_triage_verification', 'Awaiting Triage Verification'), ('dispositioned', 'Dispositioned'), ('in_transit', 'In Transit'), ('waiting', 'Waiting'), ('emergent', 'Emergent'), ('urgent', 'Urgent'), ('schedule_opd', 'Schedule for OPD'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='pending', max_length=30),
        ),
        migrations.AlterField(
            model_name='referralstatushistory',
            name='old_status',
            field=models.CharField(max_length=30),
        ),
        migrations.AlterField(
            model_name='referralstatushistory',
            name='new_status',
            field=models.CharField(max_length=30),
        ),
    ]
