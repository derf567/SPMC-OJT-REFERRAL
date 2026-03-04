"""
Property-based tests for referral model validation and integrity.

Feature: workflow-alignment-audit
"""
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import from_model
from datetime import date, timedelta
from referrals.models import (
    Referral, ReferringHospital, Specialty, UserProfile
)


# Custom strategies for generating valid test data
@st.composite
def valid_referral_data(draw):
    """Generate valid referral data for testing."""
    return {
        'chief_complaint': draw(st.text(min_size=10, max_size=500)),
        'pertinent_history': draw(st.text(min_size=10, max_size=500)),
        'pertinent_physical_exam': draw(st.text(min_size=10, max_size=500)),
        'bp': draw(st.text(min_size=5, max_size=20)),
        'hr': draw(st.integers(min_value=40, max_value=200)),
        'rr': draw(st.integers(min_value=10, max_value=60)),
        'temp': draw(st.decimals(min_value=35.0, max_value=42.0, places=1)),
        'o2_sat': draw(st.integers(min_value=50, max_value=100)),
        'gcs_score': draw(st.text(min_size=1, max_size=50)),
        'o2_support': draw(st.text(min_size=1, max_size=100)),
        'admission_status': draw(st.sampled_from(['emergency_room', 'ward', 'intensive_care_unit'])),
        'rtpcr_result': draw(st.sampled_from(['positive', 'negative', 'not_done'])),
        'working_impression': draw(st.text(min_size=10, max_size=500)),
        'management_done': draw(st.text(min_size=10, max_size=500)),
        'patient_category': draw(st.sampled_from(['new_patient', 'known_patient'])),
        'patient_full_name': draw(st.text(min_size=5, max_size=200)),
        'current_address': draw(st.text(min_size=10, max_size=500)),
        'birthday': draw(st.dates(min_value=date(1920, 1, 1), max_value=date.today() - timedelta(days=1))),
        'age': draw(st.integers(min_value=0, max_value=120)),
        'gender': draw(st.sampled_from(['male', 'female'])),
        'reason_for_referral': draw(st.text(min_size=10, max_size=500)),
        'referrer_name': draw(st.text(min_size=5, max_size=200)),
        'referrer_profession': draw(st.sampled_from(['nurse', 'barangay_health_worker', 'doctor', 'others'])),
        'referrer_cellphone': draw(st.text(min_size=10, max_size=20)),
        'mode_of_transportation': draw(st.text(min_size=5, max_size=100)),
        'consent_secured': draw(st.booleans()),
    }


class ReferralModelPropertyTests(TestCase):
    """Property-based tests for Referral model."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )
        
        # Create user profile
        self.profile = UserProfile.objects.create(
            user=self.user,
            role='referrer'
        )
        
        # Create referring hospital
        self.hospital = ReferringHospital.objects.create(
            name='Test Hospital',
            is_inside_davao_city=True
        )
        
        # Create specialty
        self.specialty = Specialty.objects.create(
            name='Internal Medicine'
        )
    
    @given(data=valid_referral_data())
    @settings(max_examples=100, deadline=None)
    def test_property_4_referral_creation_captures_all_required_fields(self, data):
        """
        Property 4: Referral Creation Captures All Required Fields
        
        For any valid referral submission, the created Referral object should contain
        all mandatory patient demographics, clinical information, and urgency indicators.
        
        **Validates: Requirements 2.1**
        """
        # Create referral with all required fields
        referral = Referral.objects.create(
            created_by=self.user,
            referring_hospital=self.hospital,
            specialty_needed=self.specialty,
            **data
        )
        
        # Verify all patient demographics are captured
        self.assertIsNotNone(referral.patient_full_name)
        self.assertIsNotNone(referral.current_address)
        self.assertIsNotNone(referral.birthday)
        self.assertIsNotNone(referral.age)
        self.assertIsNotNone(referral.gender)
        
        # Verify all clinical information is captured
        self.assertIsNotNone(referral.chief_complaint)
        self.assertIsNotNone(referral.pertinent_history)
        self.assertIsNotNone(referral.pertinent_physical_exam)
        
        # Verify all vital signs are captured
        self.assertIsNotNone(referral.bp)
        self.assertIsNotNone(referral.hr)
        self.assertIsNotNone(referral.rr)
        self.assertIsNotNone(referral.temp)
        self.assertIsNotNone(referral.o2_sat)
        
        # Verify working impression and management are captured
        self.assertIsNotNone(referral.working_impression)
        self.assertIsNotNone(referral.management_done)
        
        # Verify urgency indicators are captured
        self.assertIsNotNone(referral.admission_status)
        self.assertIsNotNone(referral.reason_for_referral)
        
        # Verify referral was created successfully
        self.assertIsNotNone(referral.referral_id)
        self.assertEqual(referral.status, 'pending')
        
        # Verify data matches what was provided
        self.assertEqual(referral.patient_full_name, data['patient_full_name'])
        self.assertEqual(referral.chief_complaint, data['chief_complaint'])
        self.assertEqual(referral.hr, data['hr'])
        self.assertEqual(referral.gender, data['gender'])


class ReferralStatusPropertyTests(TestCase):
    """Property-based tests for referral status integrity."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )
        
        # Create user profile
        self.profile = UserProfile.objects.create(
            user=self.user,
            role='referrer'
        )
        
        # Create referring hospital
        self.hospital = ReferringHospital.objects.create(
            name='Test Hospital',
            is_inside_davao_city=True
        )
        
        # Create specialty
        self.specialty = Specialty.objects.create(
            name='Internal Medicine'
        )
        
        # Create a base referral for testing
        self.referral = Referral.objects.create(
            created_by=self.user,
            referring_hospital=self.hospital,
            specialty_needed=self.specialty,
            chief_complaint='Test complaint',
            pertinent_history='Test history',
            pertinent_physical_exam='Test exam',
            bp='120/80',
            hr=80,
            rr=18,
            temp=37.0,
            o2_sat=98,
            gcs_score='15',
            o2_support='Room air',
            admission_status='emergency_room',
            rtpcr_result='not_done',
            working_impression='Test impression',
            management_done='Test management',
            patient_category='new_patient',
            patient_full_name='Test Patient',
            current_address='Test Address',
            birthday=date(1990, 1, 1),
            age=34,
            gender='male',
            reason_for_referral='Test reason',
            referrer_name='Test Referrer',
            referrer_profession='doctor',
            referrer_cellphone='1234567890',
            mode_of_transportation='Ambulance',
            consent_secured=True,
            status='pending'
        )
    
    @given(
        field_name=st.sampled_from([
            'chief_complaint', 'pertinent_history', 'working_impression',
            'patient_full_name', 'current_address', 'reason_for_referral'
        ]),
        new_value=st.text(min_size=10, max_size=500)
    )
    @settings(max_examples=50, deadline=None)
    def test_property_5_draft_editing_preserves_status(self, field_name, new_value):
        """
        Property 5: Draft Editing Preserves Status
        
        For any referral in "pending" status, editing the referral should not
        change the status field.
        
        **Validates: Requirements 2.2**
        """
        # Record original status
        original_status = self.referral.status
        self.assertEqual(original_status, 'pending')
        
        # Edit a field on the referral
        setattr(self.referral, field_name, new_value)
        self.referral.save()
        
        # Reload from database
        self.referral.refresh_from_db()
        
        # Verify status has not changed
        self.assertEqual(self.referral.status, original_status)
        self.assertEqual(self.referral.status, 'pending')
        
        # Verify the field was actually updated
        self.assertEqual(getattr(self.referral, field_name), new_value)
