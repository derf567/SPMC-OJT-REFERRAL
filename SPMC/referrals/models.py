from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class UserProfile(models.Model):
    """Extended user profile with roles"""
    ROLE_CHOICES = [
        ('edcc_personnel', 'EDCC Personnel'),
        ('call_triage', 'EDMAR/EDHO (Call Triage)'),
        ('admin', 'Administrator'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='edcc_personnel')
    department = models.CharField(max_length=100, blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_role_display()}"
    
    @property
    def can_create_referrals(self):
        """Only external users (not SPMC staff) can create referrals"""
        return False  # SPMC staff cannot create referrals
    
    @property
    def can_view_referrals(self):
        """All SPMC staff can view referrals"""
        return True
    
    @property
    def can_triage_referrals(self):
        """Only Call Triage can decide on referral priority/status"""
        return self.role == 'call_triage'
    
    @property
    def can_transfer_referrals(self):
        """EDCC Personnel can only transfer/forward referrals"""
        return self.role == 'edcc_personnel'
    
    @property
    def is_admin_user(self):
        """Check if user is admin"""
        return self.role == 'admin' or self.user.is_superuser

class ReferringHospital(models.Model):
    """Model for referring hospitals/facilities"""
    name = models.CharField(max_length=200)
    is_inside_davao_city = models.BooleanField(default=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    
    def __str__(self):
        return self.name

class Specialty(models.Model):
    """Model for medical specialties"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name_plural = "Specialties"
    
    def __str__(self):
        return self.name

class Referral(models.Model):
    """Main referral model containing all referral information"""
    
    # Status choices
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_transit', 'In Transit'),
        ('waiting', 'Waiting'),
        ('accepted', 'Accepted'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('routine', 'Routine'),
        ('urgent', 'Urgent'),
        ('critical', 'Critical'),
    ]
    
    ADMISSION_STATUS_CHOICES = [
        ('emergency_room', 'Emergency Room'),
        ('ward', 'Ward'),
        ('intensive_care_unit', 'Intensive Care Unit'),
    ]
    
    RTPCR_CHOICES = [
        ('positive', 'Positive'),
        ('negative', 'Negative'),
        ('not_done', 'Not Done'),
    ]
    
    PATIENT_CATEGORY_CHOICES = [
        ('new_patient', 'New Patient of SPMC'),
        ('known_patient', 'Old or Known Patient of SPMC'),
    ]
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
    ]
    
    # Basic referral info
    referral_id = models.CharField(max_length=20, unique=True, editable=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='routine')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Patient Status Information
    chief_complaint = models.TextField()
    pertinent_history = models.TextField()
    pertinent_physical_exam = models.TextField()
    
    # Vital Signs
    bp = models.CharField(max_length=20, verbose_name="Blood Pressure")
    hr = models.IntegerField(verbose_name="Heart Rate")
    rr = models.IntegerField(verbose_name="Respiratory Rate")
    temp = models.DecimalField(max_digits=4, decimal_places=1, verbose_name="Temperature")
    o2_sat = models.IntegerField(verbose_name="O2 Saturation")
    
    gcs_score = models.CharField(max_length=50, verbose_name="GCS Score or AVPU")
    o2_support = models.CharField(max_length=100, verbose_name="O2 Support")
    admission_status = models.CharField(max_length=30, choices=ADMISSION_STATUS_CHOICES)
    rtpcr_result = models.CharField(max_length=20, choices=RTPCR_CHOICES)
    working_impression = models.TextField()
    management_done = models.TextField()
    
    # Patient General Information
    patient_category = models.CharField(max_length=20, choices=PATIENT_CATEGORY_CHOICES)
    hrn = models.CharField(max_length=50, blank=True, null=True, verbose_name="Hospital Record Number")
    patient_full_name = models.CharField(max_length=200)
    current_address = models.TextField()
    birthday = models.DateField()
    age = models.IntegerField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    
    # Specialty Needed
    specialty_needed = models.ForeignKey(Specialty, on_delete=models.CASCADE)
    other_specialty = models.CharField(max_length=100, blank=True, null=True)
    is_urgent = models.BooleanField(default=False)
    reason_for_referral = models.TextField()
    
    # Referring Hospital Information
    referring_hospital = models.ForeignKey(ReferringHospital, on_delete=models.CASCADE)
    referrer_name = models.CharField(max_length=200)
    referrer_profession = models.CharField(max_length=100)
    referrer_cellphone = models.CharField(max_length=20)
    mode_of_transportation = models.CharField(max_length=100)
    
    # Consent
    consent_secured = models.BooleanField(default=False)
    
    # System fields
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_referrals')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_referrals')
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.referral_id:
            # Generate referral ID
            today = timezone.now()
            count = Referral.objects.filter(created_at__date=today.date()).count() + 1
            self.referral_id = f"REF-{today.strftime('%Y%m%d')}-{count:03d}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.referral_id} - {self.patient_full_name}"

class TransitInfo(models.Model):
    """Transit template information for patient transfers"""
    referral = models.OneToOneField(Referral, on_delete=models.CASCADE, related_name='transit_info')
    
    # Watcher Information
    watcher_name = models.CharField(max_length=200)
    watcher_age = models.IntegerField()
    relation_to_patient = models.CharField(max_length=100)
    contact_number = models.CharField(max_length=20)
    
    # Transit Team
    escort_nurse = models.CharField(max_length=200, blank=True, null=True)
    driver = models.CharField(max_length=200, blank=True, null=True)
    referring_md = models.CharField(max_length=200, blank=True, null=True)
    referring_facility = models.CharField(max_length=200, blank=True, null=True)
    
    # Transit Details
    latest_vs = models.TextField(verbose_name="Latest Vital Signs", blank=True, null=True)
    gcs = models.CharField(max_length=50, verbose_name="GCS", blank=True, null=True)
    time_ambulance_left = models.TimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Transit Info for {self.referral.referral_id}"

class ReferralStatusHistory(models.Model):
    """Track status changes for referrals"""
    referral = models.ForeignKey(Referral, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(User, on_delete=models.CASCADE)
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-changed_at']
        verbose_name_plural = "Referral Status Histories"
    
    def __str__(self):
        return f"{self.referral.referral_id}: {self.old_status} → {self.new_status}"

class ReferralDocument(models.Model):
    """Store uploaded documents for referrals"""
    referral = models.ForeignKey(Referral, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=50)  # 'laboratory', 'image', 'other'
    file = models.FileField(upload_to='referral_documents/')
    description = models.CharField(max_length=200, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"{self.referral.referral_id} - {self.document_type}"