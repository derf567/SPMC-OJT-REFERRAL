# Generated migration for transit tracking fields

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('referrals', '0017_merge_edcc_triage'),
    ]

    operations = [
        migrations.AddField(
            model_name='transitinfo',
            name='filled_by',
            field=models.ForeignKey(
                blank=True,
                help_text='User who filled the transit information',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='filled_transit_info',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AddField(
            model_name='transitinfo',
            name='filled_at',
            field=models.DateTimeField(
                blank=True,
                help_text='When transit information was filled',
                null=True
            ),
        ),
    ]
