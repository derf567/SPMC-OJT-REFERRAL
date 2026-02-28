# Generated migration for Department model and triage workflow

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('referrals', '0018_add_transit_tracking'),
    ]

    operations = [
        # Create Department model
        migrations.CreateModel(
            name='Department',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(choices=[
                    ('emergency', 'Emergency Department'),
                    ('internal_medicine', 'Internal Medicine'),
                    ('surgery', 'Surgery Department'),
                    ('obstetrics_gynecology', 'Obstetrics and Gynecology'),
                    ('pediatrics', 'Pediatrics'),
                    ('orthopedics', 'Orthopedics'),
                    ('cardiology', 'Cardiology'),
                    ('neurology', 'Neurology'),
                    ('anesthesiology', 'Anesthesiology'),
                    ('radiology', 'Radiology'),
                    ('pathology', 'Pathology'),
                    ('other', 'Other Department'),
                ], max_length=50, unique=True)),
                ('name', models.CharField(max_length=200)),
                ('contact_number', models.CharField(max_length=20)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        
        # Add new fields to Referral model
        migrations.AddField(
            model_name='referral',
            name='in_triage',
            field=models.BooleanField(default=False, help_text='Flag indicating referral is in triage tab'),
        ),
        migrations.AddField(
            model_name='referral',
            name='triage_remarks',
            field=models.TextField(blank=True, null=True, help_text='Remarks when assigning departments'),
        ),
        
        # Update status choices
        migrations.AlterField(
            model_name='referral',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('in_triage', 'In Triage'),
                    ('waiting_acceptance', 'Waiting Department Acceptance'),
                    ('dispositioned', 'Dispositioned'),
                    ('in_transit', 'In Transit'),
                    ('waiting', 'Waiting'),
                    ('emergent', 'Emergent'),
                    ('urgent', 'Urgent'),
                    ('schedule_opd', 'Schedule for OPD'),
                    ('completed', 'Completed'),
                    ('cancelled', 'Cancelled'),
                ],
                default='pending',
                max_length=20
            ),
        ),
        
        # Create DepartmentAcceptance model
        migrations.CreateModel(
            name='DepartmentAcceptance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('department_code', models.CharField(max_length=50)),
                ('department_name', models.CharField(max_length=200)),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Pending'),
                        ('accepted', 'Accepted'),
                        ('rejected', 'Rejected'),
                    ],
                    default='pending',
                    max_length=20
                )),
                ('notes', models.TextField(blank=True, null=True)),
                ('accepted_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('accepted_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to=settings.AUTH_USER_MODEL
                )),
                ('referral', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='department_acceptances',
                    to='referrals.referral'
                )),
            ],
            options={
                'ordering': ['created_at'],
                'unique_together': {('referral', 'department_code')},
            },
        ),
    ]
