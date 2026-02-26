# Generated migration for adding contact_numbers field to Referral model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0014_add_assigned_departments'),
    ]

    operations = [
        migrations.AddField(
            model_name='referral',
            name='contact_numbers',
            field=models.JSONField(blank=True, default=list, help_text='Patient/Watcher contact numbers'),
        ),
    ]
