from rest_framework import serializers
from .models import ReferringHospital, Specialty, Referral, TransitInfo, ReferralStatusHistory, ReferralDocument

class ReferringHospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferringHospital
        fields = '__all__'

class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
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

class ReferralListSerializer(serializers.ModelSerializer):
    """Serializer for listing referrals (minimal data)"""
    specialty_needed_name = serializers.CharField(source='specialty_needed.name', read_only=True)
    referring_hospital_name = serializers.CharField(source='referring_hospital.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    
    class Meta:
        model = Referral
        fields = [
            'id', 'referral_id', 'patient_full_name', 'age', 'gender',
            'chief_complaint', 'working_impression', 'specialty_needed_name',
            'referring_hospital_name', 'referrer_name', 'status', 'priority',
            'is_urgent', 'created_at', 'created_by_name', 'assigned_to_name'
        ]

class ReferralDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed referral view"""
    specialty_needed_name = serializers.CharField(source='specialty_needed.name', read_only=True)
    referring_hospital_name = serializers.CharField(source='referring_hospital.name', read_only=True)
    referring_hospital_location = serializers.CharField(source='referring_hospital.location', read_only=True)
    referring_hospital_is_inside_davao = serializers.BooleanField(source='referring_hospital.is_inside_davao_city', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    
    transit_info = TransitInfoSerializer(read_only=True)
    status_history = ReferralStatusHistorySerializer(many=True, read_only=True)
    documents = ReferralDocumentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Referral
        fields = '__all__'

class ReferralCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new referrals"""
    transit_info = TransitInfoSerializer(required=False, allow_null=True)
    
    class Meta:
        model = Referral
        exclude = ['referral_id', 'created_by', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        transit_info_data = validated_data.pop('transit_info', None)
        
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