# Generated migration for referrer profession dropdown

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0020_remove_transitinfo_filled_at_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='referral',
            name='referrer_profession_other',
            field=models.CharField(blank=True, help_text="Specify if profession is 'Others'", max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name='referral',
            name='referrer_profession',
            field=models.CharField(choices=[('nurse', 'Nurse'), ('barangay_health_worker', 'Barangay Health Worker'), ('doctor', 'Doctor'), ('others', 'Others')], max_length=100),
        ),
    ]
