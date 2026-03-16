from datetime import timedelta
from django.utils import timezone

from .models import Referral, ReferralFraudAuditLog


def _text_len(value):
    return len((value or "").strip())


def _is_invalid_vitals(referral):
    return (
        referral.hr < 20 or referral.hr > 220 or
        referral.rr < 6 or referral.rr > 60 or
        referral.temp < 34 or referral.temp > 42 or
        referral.o2_sat < 50 or referral.o2_sat > 100
    )


def evaluate_referral_fraud_risk(referral, request=None, acted_by=None):
    """Evaluate referral using deterministic rules and persist risk fields."""
    now = timezone.now()
    flags = []
    score = 0

    # Rule: duplicate patient + complaint/impression in the last 24h
    recent_dupes = Referral.objects.filter(
        patient_full_name__iexact=referral.patient_full_name.strip(),
        birthday=referral.birthday,
        chief_complaint__iexact=referral.chief_complaint.strip(),
        working_impression__iexact=referral.working_impression.strip(),
        created_at__gte=now - timedelta(hours=24),
    ).exclude(pk=referral.pk).count()
    if recent_dupes >= 1:
        score += 40
        flags.append({
            "code": "duplicate_content",
            "points": 40,
            "message": "Looks similar to recent referral content.",
        })

    # Rule: burst submissions by same creator in 10 minutes
    user_recent_count = Referral.objects.filter(
        created_by=referral.created_by,
        created_at__gte=now - timedelta(minutes=10),
    ).exclude(pk=referral.pk).count()
    if user_recent_count >= 3:
        score += 30
        flags.append({
            "code": "submission_burst",
            "points": 30,
            "message": "Unusual number of rapid submissions.",
        })

    # Rule: invalid/impossible vital signs
    if _is_invalid_vitals(referral):
        score += 35
        flags.append({
            "code": "invalid_vitals",
            "points": 35,
            "message": "One or more vital signs are outside expected clinical ranges.",
        })

    # Rule: urgent/emergent with low detail quality
    if referral.is_urgent or referral.is_emergent:
        if (
            _text_len(referral.chief_complaint) < 10 or
            _text_len(referral.pertinent_history) < 10 or
            _text_len(referral.working_impression) < 10
        ):
            score += 20
            flags.append({
                "code": "urgent_low_detail",
                "points": 20,
                "message": "Urgent/emergent case has unusually low detail in required fields.",
            })

    # Rule: repeated referrer contact patterns
    repeated_contact = Referral.objects.filter(
        referrer_cellphone=referral.referrer_cellphone,
        created_at__gte=now - timedelta(days=7),
    ).exclude(pk=referral.pk).count()
    if repeated_contact >= 8:
        score += 15
        flags.append({
            "code": "reused_contact_pattern",
            "points": 15,
            "message": "Referrer contact appears in a high number of recent referrals.",
        })

    # Rule: brand-new account with unusually fast activity
    if referral.created_by and referral.created_by.date_joined >= now - timedelta(days=3):
        recent_by_new_user = Referral.objects.filter(
            created_by=referral.created_by,
            created_at__gte=now - timedelta(days=1),
        ).exclude(pk=referral.pk).count()
        if recent_by_new_user >= 2:
            score += 20
            flags.append({
                "code": "new_account_burst",
                "points": 20,
                "message": "New account is submitting referrals unusually fast.",
            })

    score = min(score, 100)
    if score >= 70:
        level = "high"
    elif score >= 30:
        level = "medium"
    else:
        level = "low"

    previous_level = referral.fraud_risk_level
    previous_manual_review = referral.fraud_requires_manual_review

    referral.fraud_risk_score = score
    referral.fraud_risk_level = level
    referral.fraud_risk_flags = flags
    referral.fraud_requires_manual_review = level == "high"
    referral.fraud_last_evaluated_at = now
    referral.save(update_fields=[
        "fraud_risk_score",
        "fraud_risk_level",
        "fraud_risk_flags",
        "fraud_requires_manual_review",
        "fraud_last_evaluated_at",
    ])

    ReferralFraudAuditLog.objects.create(
        referral=referral,
        action="auto_evaluated",
        previous_risk_level=previous_level,
        new_risk_level=level,
        previous_requires_manual_review=previous_manual_review,
        new_requires_manual_review=referral.fraud_requires_manual_review,
        risk_score=score,
        flags_snapshot=flags,
        notes="Automatic fraud/spam evaluation completed.",
        acted_by=acted_by if acted_by and acted_by.is_authenticated else None,
    )

    return referral
