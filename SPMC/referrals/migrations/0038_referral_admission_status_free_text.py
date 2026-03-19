from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0037_unify_edcc_edma_role'),
    ]

    operations = [
        migrations.AlterField(
            model_name='referral',
            name='admission_status',
            field=models.CharField(max_length=200),
        ),
    ]
