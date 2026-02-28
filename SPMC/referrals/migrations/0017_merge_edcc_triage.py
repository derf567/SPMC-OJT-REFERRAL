# Generated migration to update EDCC and Triage roles with same permissions

from django.db import migrations, models


def update_role_display(apps, schema_editor):
    """No data migration needed - just updating role choices"""
    pass


def reverse_update(apps, schema_editor):
    """Reverse migration"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0016_add_doctor_role'),
    ]

    operations = [
        # Update the role choices to include both EDCC and Triage
        migrations.AlterField(
            model_name='userprofile',
            name='role',
            field=models.CharField(
                choices=[
                    ('edcc_personnel', 'EDCC Personnel'),
                    ('call_triage', 'Triage Personnel'),
                    ('admin', 'Administrator'),
                    ('referrer', 'Referrer'),
                    ('doctor', 'Doctor'),
                    ('his_department', 'HIS Department'),
                    ('view_only', 'View Only'),
                ],
                default='call_triage',
                max_length=20
            ),
        ),
    ]
