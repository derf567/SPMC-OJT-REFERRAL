from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0035_userprofile_spmc_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='spmc_id_file',
            field=models.FileField(blank=True, null=True, upload_to='doctor_spmc_ids/'),
        ),
    ]

