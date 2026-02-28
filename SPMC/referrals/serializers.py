from rest_framework import serializers
from .models import (
    ReferringHospital, Specialty, Referral, TransitInfo, ReferralStatusHistory, 
    ReferralDocument, ReferrerAccount, ReferrerDocument, Department, DepartmentAcceptance,
    UserProfile
)

class ReferringHospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferringHospital
        fields = '__all__'

class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class DepartmentAcceptanceSerializer(serializers.ModelSerializer):
    accepted_by_name = serializers.CharField(source='accepted_by.get_full_name', read_only=True)
    
    class Meta:
        model = DepartmentAcceptance
        fields = '__all__'

class TransitInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransitInfo
        fields = '__all__'

class ReferralStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    
    class Meta:
        model = ReferralStatusHistory
        fields = '__all__'

class ReferralDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    
    class Meta:
        model = ReferralDocument
        fields = '__all__'


class ReferrerDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)

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
    specialty_needed_name = serializers.CharField(source='specialty_needed.name', read_only=True)
    referring_hospital_name = serializers.CharField(source='referring_hospital.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    transferred_by_user = serializers.CharField(source='transferred_by.get_full_name', read_only=True)
    triaged_by_user = serializers.CharField(source='triaged_by.get_full_name', read_only=True)
    department_acceptances = DepartmentAcceptanceSerializer(many=True, read_only=True)
    acceptance_summary = serializers.SerializerMethodField()
    
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
            'bp', 'hr', 'rr', 'temp', 'o2_sat', 'gcs_score', 'o2_support',
            
            # Medical status
            'admission_status', 'rtpcr_result',
            
            # Specialty and referrer info
            'specialty_needed_name', 'referring_hospital_name', 'referrer_name', 
            'referrer_profession', 'referrer_cellphone', 'contact_numbers', 'mode_of_transportation',
            
            # System fields
            'created_by_name', 'assigned_to_name', 'consent_secured',
            
            # User action tracking
            'transferred_by_user', 'transferred_at', 'triaged_by_user', 'triaged_at',
            
            # Triage decision (if available)
            'triage_decision', 'triage_notes', 'scheduled_date', 'scheduled_time',
            
            # Department assignment
            'assigned_department', 'assigned_departments',
            
            # Triage workflow
            'in_triage', 'triage_remarks', 'department_acceptances', 'acceptance_summary'
        ]

class ReferralDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed referral view"""
    specialty_needed_name = serializers.CharField(source='specialty_needed.name', read_only=True)
    referring_hospital_name = serializers.CharField(source='referring_hospital.name', read_only=True)
    referring_hospital_location = serializers.CharField(source='referring_hospital.location', read_only=True)
    referring_hospital_is_inside_davao = serializers.BooleanField(source='referring_hospital.is_inside_davao_city', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    transferred_by_user = serializers.CharField(source='transferred_by.get_full_name', read_only=True)
    triaged_by_user = serializers.CharField(source='triaged_by.get_full_name', read_only=True)
    
    transit_info = TransitInfoSerializer(read_only=True)
    status_history = ReferralStatusHistorySerializer(many=True, read_only=True)
    documents = ReferralDocumentSerializer(many=True, read_only=True)
    department_acceptances = DepartmentAcceptanceSerializer(many=True, read_only=True)
    acceptance_summary = serializers.SerializerMethodField()
    
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
    
    class Meta:
        model = Referral
        exclude = ['referral_id', 'created_by', 'created_at', 'updated_at']
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
        
        # If hospital_name is provided instead of referring_hospital ID, create/get the hospital
        if hospital_name and 'referring_hospital' not in validated_data:
            hospital, created = ReferringHospital.objects.get_or_create(
                name=hospital_name,
                defaults={'is_inside_davao_city': True}
            )
            validated_data['referring_hospital'] = hospital
            print(f"Created/found hospital: {hospital.name} (ID: {hospital.id})")
        
        # Debug logging
        print("Creating referral with data:", validated_data)
        print("Transit info data:", transit_info_data)
        
        # Set the created_by from the request user if authenticated, otherwise use a default
        request = self.context.get('request')
        if request and request.user.is_authenticated:
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
        
        # Create transit info if provided
        if transit_info_data:
            TransitInfo.objects.create(referral=referral, **transit_info_data)
        
        return referral

class ReferralUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating referrals"""
    transit_info = TransitInfoSerializer(required=False, allow_null=True)
    
    class Meta:
        model = Referral
        exclude = ['referral_id', 'created_by', 'created_at']
    
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