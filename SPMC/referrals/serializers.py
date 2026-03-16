from rest_framework import serializers
from django.utils import timezone
from .models import (
    ReferringHospital, Specialty, Referral, TransitInfo, ReferralStatusHistory, 
    ReferralDocument, ReferrerAccount, ReferrerDocument, Department, DepartmentAcceptance,
    ReferralFraudAuditLog,
    UserProfile
)
from .fraud_detection import evaluate_referral_fraud_risk

class ReferringHospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferringHospital
        fields = '__all__'  # Include all fields including new address fields

class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class DepartmentAcceptanceSerializer(serializers.ModelSerializer):
    accepted_by_name = serializers.SerializerMethodField()
    
    def get_accepted_by_name(self, obj):
        if obj.accepted_by:
            return obj.accepted_by.get_full_name()
        return None
    
    class Meta:
        model = DepartmentAcceptance
        fields = '__all__'

class TransitInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransitInfo
        fields = '__all__'

class ReferralStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()
    
    def get_changed_by_name(self, obj):
        return obj.changed_by.get_full_name() if obj.changed_by else None
    
    class Meta:
        model = ReferralStatusHistory
        fields = '__all__'


class ReferralFraudAuditLogSerializer(serializers.ModelSerializer):
    acted_by_name = serializers.SerializerMethodField()

    def get_acted_by_name(self, obj):
        return obj.acted_by.get_full_name() if obj.acted_by else None

    class Meta:
        model = ReferralFraudAuditLog
        fields = '__all__'


class ReferralDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    
    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() if obj.uploaded_by else None
    
    class Meta:
        model = ReferralDocument
        fields = '__all__'


class ReferrerDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    
    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() if obj.uploaded_by else None

    class Meta:
        model = ReferrerDocument
        fields = '__all__'


class ReferrerAccountSerializer(serializers.ModelSerializer):
    documents = ReferrerDocumentSerializer(many=True, read_only=True)
    specialties = serializers.PrimaryKeyRelatedField(queryset=Specialty.objects.all(), many=True, required=False)
    affiliate_hospitals = serializers.PrimaryKeyRelatedField(queryset=ReferringHospital.objects.all(), many=True, required=False)

    class Meta:
        model = ReferrerAccount
        fields = ['id', 'user', 'first_name', 'middle_name', 'last_name', 'referrer_type',
                  'specialties', 'affiliate_hospitals', 'position', 'age', 'address', 'gender', 'created_at', 'documents']


class ReferrerRegistrationSerializer(serializers.Serializer):
    """Handles registration of a user + referrer profile and optional document uploads"""
    username = serializers.CharField()
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField()
    middle_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField()
    referrer_type = serializers.ChoiceField(choices=ReferrerAccount.REFERRER_TYPE_CHOICES)
    specialties = serializers.ListField(child=serializers.IntegerField(), required=False)
    affiliate_hospitals = serializers.ListField(child=serializers.IntegerField(), required=False)
    hospital_name = serializers.CharField(required=False, allow_blank=True)
    position = serializers.CharField(required=False, allow_blank=True)
    age = serializers.IntegerField(required=False)
    # address pieces from cascading dropdowns
    region = serializers.CharField(required=False, allow_blank=True)
    province = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    barangay = serializers.CharField(required=False, allow_blank=True)
    exact_address = serializers.CharField(required=False, allow_blank=True)
    gender = serializers.ChoiceField(choices=ReferrerAccount.GENDER_CHOICES, required=False)
    documents = serializers.ListField(child=serializers.FileField(), required=False)

    def create(self, validated_data):
        from django.contrib.auth.models import User

        docs = validated_data.pop('documents', [])
        specialties = validated_data.pop('specialties', [])
        referrer_type = validated_data.get('referrer_type')
        if referrer_type == 'hospital_account':
            hospital_name = validated_data.pop('hospital_name', '')
            if hospital_name:
                hospital, created = ReferringHospital.objects.get_or_create(name=hospital_name)
                affiliate_hospitals = [hospital.id]
            else:
                affiliate_hospitals = []
        else:
            affiliate_hospitals = validated_data.pop('affiliate_hospitals', [])
        age = validated_data.pop('age', None)
        region = validated_data.pop('region', '')
        province = validated_data.pop('province', '')
        city = validated_data.pop('city', '')
        barangay = validated_data.pop('barangay', '')
        exact_address = validated_data.pop('exact_address', '')
        # build a single address string
        address = ', '.join([part for part in [exact_address, barangay, city, province, region] if part])
        gender = validated_data.pop('gender', None)

        username = validated_data.pop('username')
        password = validated_data.pop('password')
        email = validated_data.pop('email', '')

        user = User.objects.create_user(username=username, password=password, email=email,
                                        first_name=validated_data.get('first_name', ''),
                                        last_name=validated_data.get('last_name', ''))

        # Create UserProfile with referrer role
        UserProfile.objects.create(
            user=user,
            role='referrer',
            profession=validated_data.get('referrer_type', '').replace('_', ' ').title(),
            hospital_name=validated_data.get('hospital_name', ''),
            hospital_location=address,
            is_inside_davao=True  # Default to True, can be updated later
        )

        referrer = ReferrerAccount.objects.create(
            user=user,
            first_name=validated_data.get('first_name', ''),
            middle_name=validated_data.get('middle_name', ''),
            last_name=validated_data.get('last_name', ''),
            referrer_type=referrer_type,
            position=validated_data.get('position', ''),
            age=age,
            address=address,
            gender=gender
        )

        if specialties:
            referrer.specialties.set(Specialty.objects.filter(id__in=specialties))
        if affiliate_hospitals:
            referrer.affiliate_hospitals.set(ReferringHospital.objects.filter(id__in=affiliate_hospitals))

        # create documents
        for f in docs:
            doc_type = 'official_id' if referrer_type in ['doctor', 'hospital_employee'] else 'legal_document' if referrer_type == 'hospital_account' else 'other'
            ReferrerDocument.objects.create(
                referrer=referrer,
                document_type=doc_type,
                file=f,
                uploaded_by=user
            )

        return referrer

    def to_representation(self, instance):
        return ReferrerAccountSerializer(instance).data

class ReferralListSerializer(serializers.ModelSerializer):
    """Serializer for listing referrals (includes all data needed for enhanced table view)"""
    specialty_needed_name = serializers.SerializerMethodField()
    referring_hospital_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    transferred_by_user = serializers.SerializerMethodField()
    triaged_by_user = serializers.SerializerMethodField()
    triage_verified_by_name = serializers.SerializerMethodField()
    department_acceptances = DepartmentAcceptanceSerializer(many=True, read_only=True)
    acceptance_summary = serializers.SerializerMethodField()
    transit_info = TransitInfoSerializer(read_only=True)
    
    def get_specialty_needed_name(self, obj):
        return obj.specialty_needed.name if obj.specialty_needed else None
    
    def get_referring_hospital_name(self, obj):
        return obj.referring_hospital.name if obj.referring_hospital else None
    
    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None
    
    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None
    
    def get_transferred_by_user(self, obj):
        return obj.transferred_by.get_full_name() if obj.transferred_by else None
    
    def get_triaged_by_user(self, obj):
        return obj.triaged_by.get_full_name() if obj.triaged_by else None
    
    def get_triage_verified_by_name(self, obj):
        return obj.triage_verified_by.get_full_name() if obj.triage_verified_by else None
    
    def get_acceptance_summary(self, obj):
        """Get department acceptance summary"""
        return obj.get_department_acceptance_summary()
    
    class Meta:
        model = Referral
        fields = [
            # Basic referral info
            'id', 'referral_id', 'status', 'priority', 'is_urgent', 'is_emergent', 'created_at', 'updated_at',
            
            # Patient information
            'patient_full_name', 'age', 'gender', 'hrn', 'current_address', 'birthday', 'patient_category',
            
            # Medical information
            'chief_complaint', 'working_impression', 'pertinent_history', 'pertinent_physical_exam',
            'reason_for_referral', 'management_done',
            
            # Vital signs
            'bp', 'hr', 'rr', 'temp', 'o2_sat', 'vital_signs_date', 'vital_signs_time', 'gcs_score', 'o2_support',
            
            # Medical status
            'admission_status', 'rtpcr_result',
            
            # Specialty and referrer info
            'specialty_needed_name', 'referring_hospital_name', 'referrer_name', 
            'referrer_profession', 'referrer_profession_other', 'referrer_cellphone', 'referrer_contact_numbers', 'contact_numbers', 'mode_of_transportation',
            
            # System fields
            'created_by_name', 'assigned_to_name', 'consent_secured',
            
            # User action tracking
            'transferred_by_user', 'transferred_at', 'triaged_by_user', 'triaged_at',
            
            # Triage decision (if available)
            'triage_decision', 'triage_notes', 'scheduled_date', 'scheduled_time',
            
            # Department assignment
            'assigned_department', 'assigned_departments', 'main_service_code',
            
            # Triage workflow
            'in_triage', 'triage_remarks', 'department_acceptances', 'acceptance_summary',
            
            # Triage verification
            'triage_verified_by_name', 'triage_verified_at', 'triage_verification_notes',
            
            # Delay notification tracking
            'delay_notified_at', 'delay_reason',

            # Fraud/spam risk classification
            'fraud_risk_score', 'fraud_risk_level', 'fraud_risk_flags',
            'fraud_requires_manual_review', 'fraud_last_evaluated_at',

            # Transit info (includes remarks)
            'transit_info',
        ]

class ReferralDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed referral view"""
    specialty_needed_name = serializers.SerializerMethodField()
    referring_hospital_name = serializers.SerializerMethodField()
    referring_hospital_location = serializers.SerializerMethodField()
    referring_hospital_is_inside_davao = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    transferred_by_user = serializers.SerializerMethodField()
    triaged_by_user = serializers.SerializerMethodField()
    
    transit_info = TransitInfoSerializer(read_only=True)
    status_history = ReferralStatusHistorySerializer(many=True, read_only=True)
    fraud_audit_logs = ReferralFraudAuditLogSerializer(many=True, read_only=True)
    documents = ReferralDocumentSerializer(many=True, read_only=True)
    department_acceptances = DepartmentAcceptanceSerializer(many=True, read_only=True)
    acceptance_summary = serializers.SerializerMethodField()
    
    def get_specialty_needed_name(self, obj):
        return obj.specialty_needed.name if obj.specialty_needed else None
    
    def get_referring_hospital_name(self, obj):
        return obj.referring_hospital.name if obj.referring_hospital else None
    
    def get_referring_hospital_location(self, obj):
        return obj.referring_hospital.location if obj.referring_hospital else None
    
    def get_referring_hospital_is_inside_davao(self, obj):
        return obj.referring_hospital.is_inside_davao_city if obj.referring_hospital else None
    
    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None
    
    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None
    
    def get_transferred_by_user(self, obj):
        return obj.transferred_by.get_full_name() if obj.transferred_by else None
    
    def get_triaged_by_user(self, obj):
        return obj.triaged_by.get_full_name() if obj.triaged_by else None
    
    def get_acceptance_summary(self, obj):
        """Get department acceptance summary"""
        return obj.get_department_acceptance_summary()
    
    class Meta:
        model = Referral
        fields = '__all__'

class ReferralCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new referrals"""
    transit_info = TransitInfoSerializer(required=False, allow_null=True)
    hospital_name = serializers.CharField(required=False, write_only=True)
    hospital_contact_numbers = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True,
        help_text="Contact numbers from hospital/referrer profile"
    )
    # Explicitly define hospital address fields to ensure they're accepted
    hospital_region = serializers.CharField(required=False, allow_blank=True)
    hospital_province = serializers.CharField(required=False, allow_blank=True)
    hospital_city = serializers.CharField(required=False, allow_blank=True)
    hospital_barangay = serializers.CharField(required=False, allow_blank=True)
    hospital_street = serializers.CharField(required=False, allow_blank=True)
    hospital_district = serializers.CharField(required=False, allow_blank=True)
    hospital_doh_level = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Referral
        exclude = [
            'referral_id', 'created_by', 'created_at', 'updated_at',
            'fraud_risk_score', 'fraud_risk_level', 'fraud_risk_flags',
            'fraud_requires_manual_review', 'fraud_last_evaluated_at',
        ]
        extra_kwargs = {
            'referring_hospital': {'required': False}  # Make it optional since we can use hospital_name instead
        }
    
    def create(self, validated_data):
        transit_info_data = validated_data.pop('transit_info', None)
        hospital_name = validated_data.pop('hospital_name', None)
        hospital_contact_numbers = validated_data.pop('hospital_contact_numbers', None)
        
        # Map hospital_contact_numbers to contact_numbers
        if hospital_contact_numbers:
            validated_data['contact_numbers'] = hospital_contact_numbers
        
        # Ensure referrer_contact_numbers is set (if provided in the request)
        # The field should already be in validated_data if sent from frontend
        
        # If hospital_name is provided instead of referring_hospital ID, create/get the hospital
        if hospital_name and 'referring_hospital' not in validated_data:
            hospital, created = ReferringHospital.objects.get_or_create(
                name=hospital_name,
                defaults={'is_inside_davao_city': True}
            )
            validated_data['referring_hospital'] = hospital
            print(f"Created/found hospital: {hospital.name} (ID: {hospital.id})")
        
        # Debug logging - show all hospital address fields
        print("Creating referral with data:")
        print(f"  hospital_region: {validated_data.get('hospital_region')}")
        print(f"  hospital_province: {validated_data.get('hospital_province')}")
        print(f"  hospital_city: {validated_data.get('hospital_city')}")
        print(f"  hospital_barangay: {validated_data.get('hospital_barangay')}")
        print(f"  hospital_street: {validated_data.get('hospital_street')}")
        print(f"  hospital_district: {validated_data.get('hospital_district')}")
        print(f"  hospital_doh_level: {validated_data.get('hospital_doh_level')}")
        print(f"  referrer_contact_numbers: {validated_data.get('referrer_contact_numbers')}")
        print(f"  contact_numbers (patient/watcher): {validated_data.get('contact_numbers')}")
        print("Transit info data:", transit_info_data)
        
        # Set the created_by from the request user if authenticated, otherwise use a default
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if hasattr(request.user, 'profile') and request.user.profile.role == 'referrer':
                profile = request.user.profile
                if profile.is_referrer_suspended:
                    if not profile.referrer_suspended_until or profile.referrer_suspended_until > timezone.now():
                        raise serializers.ValidationError({
                            'detail': 'Your referrer account is suspended from creating referrals.',
                            'reason': profile.referrer_suspension_reason or 'No reason provided.',
                        })
            validated_data['created_by'] = request.user
        else:
            # For anonymous submissions, create or get a system user
            from django.contrib.auth.models import User
            system_user, created = User.objects.get_or_create(
                username='external_system',
                defaults={
                    'first_name': 'External',
                    'last_name': 'System',
                    'email': 'external@spmc.gov.ph'
                }
            )
            validated_data['created_by'] = system_user
        
        referral = Referral.objects.create(**validated_data)
        
        # Verify the data was saved
        print(f"Referral created with ID: {referral.id}")
        print(f"  Saved hospital_barangay: {referral.hospital_barangay}")
        print(f"  Saved hospital_street: {referral.hospital_street}")
        print(f"  Saved referrer_contact_numbers: {referral.referrer_contact_numbers}")
        print(f"  Saved contact_numbers: {referral.contact_numbers}")
        
        # Create transit info if provided
        if transit_info_data:
            TransitInfo.objects.create(referral=referral, **transit_info_data)

        evaluate_referral_fraud_risk(
            referral,
            request=request,
            acted_by=request.user if request and request.user.is_authenticated else None,
        )
        
        return referral

class ReferralUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating referrals"""
    transit_info = TransitInfoSerializer(required=False, allow_null=True)
    # Explicitly define hospital address fields to ensure they're accepted
    hospital_region = serializers.CharField(required=False, allow_blank=True)
    hospital_province = serializers.CharField(required=False, allow_blank=True)
    hospital_city = serializers.CharField(required=False, allow_blank=True)
    hospital_barangay = serializers.CharField(required=False, allow_blank=True)
    hospital_street = serializers.CharField(required=False, allow_blank=True)
    hospital_district = serializers.CharField(required=False, allow_blank=True)
    hospital_doh_level = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Referral
        exclude = ['referral_id', 'created_by', 'created_at', 'fraud_last_evaluated_at']
    
    def update(self, instance, validated_data):
        transit_info_data = validated_data.pop('transit_info', None)
        
        # Update referral fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Handle transit info
        if transit_info_data:
            if hasattr(instance, 'transit_info'):
                # Update existing transit info
                transit_info = instance.transit_info
                for attr, value in transit_info_data.items():
                    setattr(transit_info, attr, value)
                transit_info.save()
            else:
                # Create new transit info
                TransitInfo.objects.create(referral=instance, **transit_info_data)

        request = self.context.get('request')
        evaluate_referral_fraud_risk(
            instance,
            request=request,
            acted_by=request.user if request and request.user.is_authenticated else None,
        )
        
        return instance

class StatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating referral status"""
    new_status = serializers.ChoiceField(choices=Referral.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def update(self, instance, validated_data):
        old_status = instance.status
        new_status = validated_data['new_status']
        notes = validated_data.get('notes', '')
        
        # Update the referral status
        instance.status = new_status
        instance.save()
        
        # Create status history record
        ReferralStatusHistory.objects.create(
            referral=instance,
            old_status=old_status,
            new_status=new_status,
            changed_by=self.context['request'].user,
            notes=notes
        )
        
        return instance
