import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

from referrals.models import Referral
from referrals.serializers import ReferralListSerializer

# Get the most recent referral
referral = Referral.objects.order_by('-created_at').first()

if referral:
    serializer = ReferralListSerializer(referral)
    data = serializer.data
    
    print(f"API Response for {referral.referral_id}:")
    print(f"\nNew Fields in API Response:")
    print(f"  - hospital_doh_level: {data.get('hospital_doh_level')}")
    print(f"  - hospital_location: {data.get('hospital_location')}")
    print(f"  - hospital_contact_numbers: {data.get('hospital_contact_numbers')}")
    print(f"  - vital_signs_time: {data.get('vital_signs_time')}")
    
    print(f"\nFull API Response (formatted):")
    print(json.dumps(data, indent=2, default=str))
else:
    print("No referrals found")
