# Generated migration for workflow alignment
from django.db import migrations


def migrate_status_to_triage_decision(apps, schema_editor):
    """
    Move emergent/urgent/schedule_opd from status to triage_decision field.
    This aligns the code with the documented process flow where these are
    triage decisions, not status values.
    """
    Referral = apps.get_model('referrals', 'Referral')
    
    # Migrate emergent status to triage decision
    emergent_referrals = Referral.objects.filter(status='emergent')
    for referral in emergent_referrals:
        referral.status = 'in_triage'
        referral.triage_decision = 'emergent'
        referral.save()
    
    # Migrate urgent status to triage decision
    urgent_referrals = Referral.objects.filter(status='urgent')
    for referral in urgent_referrals:
        referral.status = 'in_triage'
        referral.triage_decision = 'urgent'
        referral.save()
    
    # Migrate schedule_opd status to triage decision
    opd_referrals = Referral.objects.filter(status='schedule_opd')
    for referral in opd_referrals:
        referral.status = 'dispositioned'
        referral.triage_decision = 'schedule_opd'
        referral.save()
    
    # Migrate 'waiting' status to 'waiting_acceptance'
    waiting_referrals = Referral.objects.filter(status='waiting')
    for referral in waiting_referrals:
        referral.status = 'waiting_acceptance'
        referral.save()


def reverse_migration(apps, schema_editor):
    """Reverse the migration if needed"""
    Referral = apps.get_model('referrals', 'Referral')
    
    # Reverse emergent
    Referral.objects.filter(
        status='in_triage',
        triage_decision='emergent'
    ).update(status='emergent')
    
    # Reverse urgent
    Referral.objects.filter(
        status='in_triage',
        triage_decision='urgent'
    ).update(status='urgent')
    
    # Reverse schedule_opd
    Referral.objects.filter(
        status='dispositioned',
        triage_decision='schedule_opd'
    ).update(status='schedule_opd')


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0025_add_delay_notification_fields'),
    ]

    operations = [
        migrations.RunPython(
            migrate_status_to_triage_decision,
            reverse_migration
        ),
    ]
