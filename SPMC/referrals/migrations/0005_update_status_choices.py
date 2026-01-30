# Generated migration for updated status choices

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0004_add_triage_decision'),
    ]

    operations = [
        migrations.AlterField(
            model_name='referral',
            name='status',
            field=models.CharField(choices=[('pending', 'Pending'), ('in_transit', 'In Transit'), ('waiting', 'Waiting'), ('emergent', 'Emergent'), ('urgent', 'Urgent'), ('schedule_opd', 'Schedule for OPD'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='pending', max_length=20),
        ),
    ]