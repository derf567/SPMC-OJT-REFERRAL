from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0034_make_referrer_cellphone_optional'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='spmc_id',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]

