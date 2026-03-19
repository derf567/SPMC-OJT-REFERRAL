from django.db import migrations, models


def forwards_unify_edcc_edma(apps, schema_editor):
    UserProfile = apps.get_model('referrals', 'UserProfile')

    # Migrate legacy split roles into unified role + indicator.
    UserProfile.objects.filter(role='edcc_personnel').update(
        role='edcc_edma',
        edcc_edma_indicator='EDCC'
    )
    UserProfile.objects.filter(role='call_triage').update(
        role='edcc_edma',
        edcc_edma_indicator='EDMA'
    )

    # If any unified rows already exist without indicator, default to EDCC.
    UserProfile.objects.filter(role='edcc_edma', edcc_edma_indicator__isnull=True).update(
        edcc_edma_indicator='EDCC'
    )
    UserProfile.objects.filter(role='edcc_edma', edcc_edma_indicator='').update(
        edcc_edma_indicator='EDCC'
    )


def backwards_unify_edcc_edma(apps, schema_editor):
    UserProfile = apps.get_model('referrals', 'UserProfile')

    # Best-effort rollback using indicator.
    UserProfile.objects.filter(
        role='edcc_edma',
        edcc_edma_indicator='EDMA'
    ).update(role='call_triage')
    UserProfile.objects.filter(
        role='edcc_edma'
    ).exclude(edcc_edma_indicator='EDMA').update(role='edcc_personnel')


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0036_userprofile_spmc_id_file'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='edcc_edma_indicator',
            field=models.CharField(
                blank=True,
                choices=[('EDCC', 'EDCC'), ('EDMA', 'EDMA')],
                max_length=10,
                null=True
            ),
        ),
        migrations.RunPython(forwards_unify_edcc_edma, backwards_unify_edcc_edma),
        migrations.AlterField(
            model_name='userprofile',
            name='role',
            field=models.CharField(
                choices=[
                    ('edcc_edma', 'EDCC/EDMA'),
                    ('admin', 'Administrator'),
                    ('doctor', 'Doctor'),
                    ('referrer', 'Referrer'),
                ],
                default='edcc_edma',
                max_length=20
            ),
        ),
    ]

