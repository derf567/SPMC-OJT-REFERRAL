from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0038_referral_admission_status_free_text'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='referral',
            name='contact_numbers',
        ),
    ]
