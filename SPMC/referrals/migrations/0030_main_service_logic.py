# Generated migration for main service vs co-manage logic

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0029_referral_hospital_barangay_referral_hospital_city_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='referral',
            name='main_service_code',
            field=models.CharField(blank=True, help_text='Main/primary department code - main service decision overrides co-manage', max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='departmentacceptance',
            name='is_main_service',
            field=models.BooleanField(default=False, help_text='Main/primary service for this referral'),
        ),
    ]
