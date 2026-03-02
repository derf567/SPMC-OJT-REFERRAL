from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError

class UserProfile(models.Model):
    """Extended user profile with roles"""
    ROLE_CHOICES = [
        ('edcc_personnel', 'EDCC Personnel'),
        ('call_triage', 'EDMAR/EDHO (Call Triage)'),
        ('admin', 'Administrator'),
        ('doctor', 'Doctor'),
        ('referrer', 'Referrer'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='edcc_personnel')
    department = models.CharField(max_length=100, blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    
    # Additional fields for referrers
    profession = models.CharField(max_length=100, blank=True, null=True)
    cellphone = models.CharField(max_length=20, blank=True, null=True)
    hospital_name = models.CharField(max_length=200, blank=True, null=True)
    hospital_location = models.CharField(max_length=200, blank=True, null=True)
    is_inside_davao = models.BooleanField(default=True)
    is_view_only = models.BooleanField(default=False)
    
    # New address fields from PSGC API
    hospital_region = models.CharField(max_length=200, blank=True, null=True)
    hospital_province = models.CharField(max_length=200, blank=True, null=True)
    hospital_city = models.CharField(max_length=200, blank=True, null=True)
    hospital_barangay = models.CharField(max_length=200, blank=True, null=True)
    hospital_street = models.TextField(blank=True, null=True)
    hospital_district = models.CharField(max_length=100, blank=True, null=True)
    hospital_doh_level = models.CharField(max_length=50, blank=True, null=True)
    contact_numbers = models.JSONField(default=list, blank=True)
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_role_display()}"
    
    @property
    def can_create_referrals(self):
        """Only external users (referrers) can create referrals"""
        return self.role == 'referrer'
    
    @property
    def can_view_referrals(self):
        """All users can view referrals (with different scopes)"""
        return True
    
    @property
    def can_triage_referrals(self):
        """Both EDCC and Triage can decide on referral priority/status"""
        return self.role in ['call_triage', 'edcc_personnel']
    
    @property
    def can_transfer_referrals(self):
        """Both EDCC and Triage can transfer/forward referrals"""
        return self.role in ['call_triage', 'edcc_personnel']
    
    @property
    def is_admin_user(self):
        """Check if user is admin"""
        return self.role == 'admin' or self.user.is_superuser
    
    @property
    def is_doctor(self):
        """Check if user is a doctor"""
        return self.role == 'doctor'
    
    @property
    def can_view_department_referrals(self):
        """Doctors can view referrals assigned to their department"""
        return self.role == 'doctor' and self.department

class Department(models.Model):
    """Hospital departments with contact information"""
    DEPARTMENT_CHOICES = [
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
    ]
    
    code = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES, unique=True)
    name = models.CharField(max_length=200)
    contact_number = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name

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
    
    TRIAGE_DECISION_CHOICES = [
        ('emergent', 'Emergent'),
        ('urgent', 'Urgent'),
        ('schedule_opd', 'Schedule for OPD'),
    ]
    
    DEPARTMENT_CHOICES = [
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
    is_emergent = models.BooleanField(default=False)
    reason_for_referral = models.TextField()
    
    REFERRER_PROFESSION_CHOICES = [
        ('nurse', 'Nurse'),
        ('barangay_health_worker', 'Barangay Health Worker'),
        ('doctor', 'Doctor'),
        ('others', 'Others'),
    ]
    
    # Referring Hospital Information
    referring_hospital = models.ForeignKey(ReferringHospital, on_delete=models.CASCADE)
    referrer_name = models.CharField(max_length=200)
    referrer_profession = models.CharField(max_length=100, choices=REFERRER_PROFESSION_CHOICES)
    referrer_profession_other = models.CharField(max_length=100, blank=True, null=True, help_text="Specify if profession is 'Others'")
    referrer_cellphone = models.CharField(max_length=20)
    contact_numbers = models.JSONField(default=list, blank=True, help_text="Patient/Watcher contact numbers")
    mode_of_transportation = models.CharField(max_length=100)
    
    # Consent
    consent_secured = models.BooleanField(default=False)
    
    # System fields
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_referrals')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_referrals')
    
    # User action tracking fields
    transferred_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='transferred_referrals')
    transferred_at = models.DateTimeField(null=True, blank=True, help_text="When referral was transferred to triage")
    triaged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='triaged_referrals')
    triaged_at = models.DateTimeField(null=True, blank=True, help_text="When triage decision was made")
    
    # Triage decision (set when triage accepts the referral)
    triage_decision = models.CharField(max_length=20, choices=TRIAGE_DECISION_CHOICES, blank=True, null=True)
    triage_notes = models.TextField(blank=True, null=True, help_text="Additional notes from triage team")
    
    # Triage workflow fields
    in_triage = models.BooleanField(default=False, help_text="Flag indicating referral is in triage tab")
    triage_remarks = models.TextField(blank=True, null=True, help_text="Remarks when assigning departments")
    
    # Department assignment (set by EDCC when transferring to triage)
    assigned_department = models.CharField(
        max_length=50, 
        choices=DEPARTMENT_CHOICES, 
        blank=True, 
        null=True,
        help_text="Department assigned by EDCC when transferring to triage"
    )
    
    # Multiple departments (set by Triage when accepting referral)
    assigned_departments = models.JSONField(
        default=list,
        blank=True,
        null=True,
        help_text="Multiple departments assigned by triage team"
    )
    
    # Outpatient scheduling (for schedule_opd triage decisions)
    scheduled_date = models.DateField(blank=True, null=True, help_text="Scheduled appointment date for OPD")
    scheduled_time = models.TimeField(blank=True, null=True, help_text="Scheduled appointment time for OPD")
    
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
    
    def check_department_acceptance(self):
        """Check if majority of departments have accepted and update status"""
        acceptances = self.department_acceptances.all()
        total = acceptances.count()
        
        if total == 0:
            return
        
        accepted = acceptances.filter(status='accepted').count()
        rejected = acceptances.filter(status='rejected').count()
        
        # Majority rule: more than half must accept
        majority = (total // 2) + 1
        
        if accepted >= majority:
            # Majority accepted - move to dispositioned
            self.status = 'dispositioned'
            self.save()
        elif rejected >= majority:
            # Majority rejected - move back to pending or handle accordingly
            self.status = 'pending'
            self.in_triage = False
            self.save()
    
    def get_department_acceptance_summary(self):
        """Get summary of department acceptances"""
        acceptances = self.department_acceptances.all()
        total = acceptances.count()
        accepted = acceptances.filter(status='accepted').count()
        rejected = acceptances.filter(status='rejected').count()
        pending = acceptances.filter(status='pending').count()
        
        return {
            'total': total,
            'accepted': accepted,
            'rejected': rejected,
            'pending': pending,
            'majority_needed': (total // 2) + 1,
        }

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


class DepartmentAcceptance(models.Model):
    """Track department acceptance for referrals"""
    ACCEPTANCE_STATUS = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    referral = models.ForeignKey(Referral, on_delete=models.CASCADE, related_name='department_acceptances')
    department_code = models.CharField(max_length=50)
    department_name = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=ACCEPTANCE_STATUS, default='pending')
    accepted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['referral', 'department_code']
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.referral.referral_id} - {self.department_name} ({self.status})"
    
    def accept(self, user):
        """Accept the referral for this department"""
        self.status = 'accepted'
        self.accepted_by = user
        self.accepted_at = timezone.now()
        self.save()
        
        # Check if majority of departments have accepted
        self.referral.check_department_acceptance()
    
    def reject(self, user, notes=None):
        """Reject the referral for this department"""
        self.status = 'rejected'
        self.accepted_by = user
        self.accepted_at = timezone.now()
        if notes:
            self.notes = notes
        self.save()


class ReferrerAccount(models.Model):
    """Model for external referrers (doctors, hospital accounts, authorized employees)"""
    REFERRER_TYPE_CHOICES = [
        ('doctor', 'Doctor / Medical Professional'),
        ('hospital_employee', 'Authorized Hospital Employee'),
        ('hospital_account', 'Hospital Account'),
        ('other', 'Other'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='referrer_profile')
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100)
    referrer_type = models.CharField(max_length=30, choices=REFERRER_TYPE_CHOICES)

    # Common fields
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]

    age = models.IntegerField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)

    # Doctor-specific
    specialties = models.ManyToManyField(Specialty, blank=True, related_name='referrers')
    affiliate_hospitals = models.ManyToManyField(ReferringHospital, blank=True, related_name='affiliated_referrers')

    # Hospital employee-specific
    position = models.CharField(max_length=150, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.get_referrer_type_display()})"


class ReferrerDocument(models.Model):
    """Documents uploaded by referrers for identity / legal proof"""
    DOCUMENT_TYPE_CHOICES = [
        ('official_id', 'Official Registered ID'),
        ('legal_document', 'Legal Document (Hospital)'),
        ('other', 'Other'),
    ]

    referrer = models.ForeignKey(ReferrerAccount, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES)
    file = models.FileField(upload_to='referrer_documents/')
    description = models.CharField(max_length=200, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.referrer} - {self.document_type}"