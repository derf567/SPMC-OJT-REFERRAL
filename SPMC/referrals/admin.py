from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django import forms
from django.utils.html import format_html
from .models import ReferringHospital, Specialty, Referral, TransitInfo, ReferralStatusHistory, ReferralDocument, UserProfile, UserProfileProxy

HOSPITAL_REFERRER_HIDE_FIELDS = (
    'department',
    'contact_number',
    'profession',
)
EDCC_EDMA_HIDE_FIELDS = (
    'edcc_edma_indicator',
    'spmc_id',
    'spmc_id_file',
)

DOCTOR_HIDE_FIELDS = (
    'contact_number',
    'is_view_only',
    'spmc_id',
    'hospital_name',
    'hospital_location',
    'is_inside_davao',
    'hospital_region',
    'hospital_province',
    'hospital_city',
    'hospital_barangay',
    'hospital_street',
    'hospital_district',
    'hospital_doh_level',
    'is_referrer_suspended',
    'referrer_suspended_until',
    'referrer_suspension_reason',
)

# Inline UserProfile in User admin
class CustomUserAdminForm(forms.ModelForm):
    profile_role = forms.ChoiceField(
        required=False,
        label='Role',
        choices=UserProfile.ROLE_CHOICES
    )
    edcc_edma_indicator_profile = forms.ChoiceField(
        required=False,
        label='EDCC/EDMA indicator',
        choices=[('', '---------'), ('EDCC', 'EDCC'), ('EDMA', 'EDMA')]
    )
    spmc_id_file_profile = forms.FileField(required=False, label='SPMC ID file')

    class Meta:
        model = User
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        instance = kwargs.get('instance')
        if instance is not None and hasattr(instance, 'profile'):
            self.fields['profile_role'].initial = instance.profile.role or ''
            self.fields['edcc_edma_indicator_profile'].initial = (
                instance.profile.edcc_edma_indicator or ''
            )

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    exclude = ['cellphone']
    readonly_fields = ['display_contact_numbers_inline']

    def get_fields(self, request, obj=None):
        """
        Hide department and contact_number only for hospital referrer accounts.
        Keep these fields for department roles (e.g., doctor/admin).
        """
        fields = list(super().get_fields(request, obj))
        is_hospital_referrer = (
            obj is not None
            and hasattr(obj, 'profile')
            and obj.profile.role == 'referrer'
            and bool(obj.profile.hospital_name)
        )
        is_doctor = (
            obj is not None
            and hasattr(obj, 'profile')
            and obj.profile.role == 'doctor'
        )
        is_edcc_edma = (
            obj is not None
            and hasattr(obj, 'profile')
            and obj.profile.role == 'edcc_edma'
        )
        if is_hospital_referrer:
            fields = [f for f in fields if f not in HOSPITAL_REFERRER_HIDE_FIELDS]
        if is_doctor:
            fields = [f for f in fields if f not in DOCTOR_HIDE_FIELDS]
        if is_edcc_edma:
            fields = [f for f in fields if f not in EDCC_EDMA_HIDE_FIELDS]
        return fields
    
    def display_contact_numbers_inline(self, obj):
        """Display contact numbers in inline form"""
        if obj and obj.contact_numbers:
            return ', '.join(obj.contact_numbers)
        return 'No contact numbers'
    display_contact_numbers_inline.short_description = 'Contact Numbers (from registration)'

# Extend UserAdmin to include profile
class CustomUserAdmin(UserAdmin):
    form = CustomUserAdminForm
    inlines = (UserProfileInline,)
    list_display = ['username', 'email', 'display_name', 'get_role', 'get_department', 'is_active', 'is_staff']
    list_filter = ['is_active', 'is_staff', 'profile__role', 'profile__department']
    readonly_fields = ['display_hospital_name', 'display_spmc_id', 'display_spmc_id_file']

    def display_name(self, obj):
        """Show hospital name for hospital referrers; otherwise full name."""
        if hasattr(obj, 'profile') and obj.profile.role == 'referrer' and obj.profile.hospital_name:
            return obj.profile.hospital_name
        return obj.get_full_name() or '-'
    display_name.short_description = 'Name'
    display_name.admin_order_field = 'first_name'

    def display_hospital_name(self, obj):
        """Read-only helper shown in Personal info for hospital referrer accounts."""
        if hasattr(obj, 'profile') and obj.profile.hospital_name:
            return obj.profile.hospital_name
        return '-'
    display_hospital_name.short_description = 'Hospital name'

    def display_spmc_id(self, obj):
        """Read-only helper shown in Personal info for doctor accounts."""
        if hasattr(obj, 'profile') and obj.profile.spmc_id:
            return obj.profile.spmc_id
        return '-'
    display_spmc_id.short_description = 'SPMC ID number'

    def display_spmc_id_file(self, obj):
        """Read-only helper to open uploaded SPMC ID file for doctor accounts."""
        if hasattr(obj, 'profile') and obj.profile.spmc_id_file:
            return format_html(
                '<a href="{}" target="_blank" rel="noopener noreferrer">View uploaded SPMC ID</a>',
                obj.profile.spmc_id_file.url
            )
        return '-'
    display_spmc_id_file.short_description = 'SPMC ID file'
    
    def get_role(self, obj):
        """Display user role from profile"""
        if hasattr(obj, 'profile'):
            return obj.profile.get_role_display()
        return '-'
    get_role.short_description = 'Role'
    get_role.admin_order_field = 'profile__role'
    
    def get_department(self, obj):
        """Display user department from profile"""
        if hasattr(obj, 'profile'):
            return obj.profile.department or '-'
        return '-'
    get_department.short_description = 'Department'
    get_department.admin_order_field = 'profile__department'

    def get_fieldsets(self, request, obj=None):
        """
        Hide first_name/last_name in admin form for hospital referrer accounts.
        Keeps default UserAdmin fields for all other account types.
        """
        fieldsets = super().get_fieldsets(request, obj)

        if not obj or not hasattr(obj, 'profile'):
            return fieldsets

        is_hospital_referrer = (
            obj.profile.role == 'referrer' and bool(obj.profile.hospital_name)
        )
        is_doctor = obj.profile.role == 'doctor'
        is_edcc_edma = obj.profile.role == 'edcc_edma'
        if not is_hospital_referrer and not is_doctor and not is_edcc_edma:
            return fieldsets

        updated_fieldsets = []
        for section_title, section_opts in fieldsets:
            opts = dict(section_opts)
            fields = opts.get('fields')
            if section_title == 'Personal info' and fields:
                filtered_fields = list(fields)
                if is_hospital_referrer:
                    filtered_fields = [
                        field for field in filtered_fields if field not in ('first_name', 'last_name')
                    ]
                    if 'display_hospital_name' not in filtered_fields:
                        filtered_fields.insert(0, 'display_hospital_name')
                if is_doctor:
                    if 'display_spmc_id' not in filtered_fields:
                        filtered_fields.append('display_spmc_id')
                    if 'spmc_id_file_profile' not in filtered_fields:
                        filtered_fields.append('spmc_id_file_profile')
                    if 'display_spmc_id_file' not in filtered_fields:
                        filtered_fields.append('display_spmc_id_file')
                if is_edcc_edma:
                    if 'profile_role' not in filtered_fields:
                        filtered_fields.append('profile_role')
                    if 'edcc_edma_indicator_profile' not in filtered_fields:
                        filtered_fields.append('edcc_edma_indicator_profile')
                    if 'display_spmc_id' not in filtered_fields:
                        filtered_fields.append('display_spmc_id')
                    if 'spmc_id_file_profile' not in filtered_fields:
                        filtered_fields.append('spmc_id_file_profile')
                    if 'display_spmc_id_file' not in filtered_fields:
                        filtered_fields.append('display_spmc_id_file')
                if obj.profile.role == 'admin':
                    if 'profile_role' not in filtered_fields:
                        filtered_fields.append('profile_role')
                opts['fields'] = tuple(filtered_fields)
            updated_fieldsets.append((section_title, opts))

        return tuple(updated_fieldsets)

    def get_inline_instances(self, request, obj=None):
        """
        Hide the whole UserProfile inline section for EDCC/EDMA and admin users.
        Their relevant fields are managed in Personal info.
        """
        inline_instances = super().get_inline_instances(request, obj)
        if obj and hasattr(obj, 'profile') and obj.profile.role in ['edcc_edma', 'admin']:
            return []
        return inline_instances

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        role_value = form.cleaned_data.get('profile_role')
        indicator_value = form.cleaned_data.get('edcc_edma_indicator_profile')
        uploaded_file = form.cleaned_data.get('spmc_id_file_profile')
        if hasattr(obj, 'profile'):
            update_fields = []
            if role_value and role_value != obj.profile.role:
                obj.profile.role = role_value
                update_fields.append('role')
            if obj.profile.role == 'edcc_edma' and indicator_value is not None:
                obj.profile.edcc_edma_indicator = indicator_value or None
                update_fields.append('edcc_edma_indicator')
            if obj.profile.role in ['doctor', 'edcc_edma'] and uploaded_file:
                obj.profile.spmc_id_file = uploaded_file
                update_fields.append('spmc_id_file')
            if update_fields:
                obj.profile.save(update_fields=update_fields)

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

@admin.register(UserProfileProxy)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'department', 'display_contact_numbers']
    list_filter = ['role', 'department']
    search_fields = ['user__username', 'user__first_name', 'user__last_name']
    exclude = ['cellphone']

    def get_fields(self, request, obj=None):
        fields = list(super().get_fields(request, obj))
        is_hospital_referrer = (
            obj is not None
            and obj.role == 'referrer'
            and bool(obj.hospital_name)
        )
        is_doctor = (
            obj is not None
            and obj.role == 'doctor'
        )
        is_edcc_edma = (
            obj is not None
            and obj.role == 'edcc_edma'
        )
        is_admin_role = (
            obj is not None
            and obj.role == 'admin'
        )
        if is_edcc_edma or is_admin_role:
            return ['user', 'role']
        if is_hospital_referrer:
            fields = [f for f in fields if f not in HOSPITAL_REFERRER_HIDE_FIELDS]
        if is_doctor:
            fields = [f for f in fields if f not in DOCTOR_HIDE_FIELDS]
        return fields

    def display_contact_numbers(self, obj):
        if obj.contact_numbers:
            return ', '.join(obj.contact_numbers)
        return '-'
    display_contact_numbers.short_description = 'Contact Numbers'

@admin.register(ReferringHospital)
class ReferringHospitalAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_inside_davao_city', 'location', 'contact_number']
    list_filter = ['is_inside_davao_city', 'location']
    search_fields = ['name', 'location']

@admin.register(Specialty)
class SpecialtyAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']

class TransitInfoInline(admin.StackedInline):
    model = TransitInfo
    extra = 0

class ReferralStatusHistoryInline(admin.TabularInline):
    model = ReferralStatusHistory
    extra = 0
    readonly_fields = ['changed_at']

class ReferralDocumentInline(admin.TabularInline):
    model = ReferralDocument
    extra = 0
    readonly_fields = ['uploaded_at']

@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = [
        'referral_id', 'patient_full_name', 'age', 'gender', 
        'specialty_needed', 'status', 'priority', 'is_urgent', 
        'referring_hospital', 'created_at'
    ]
    list_filter = [
        'status', 'priority', 'is_urgent', 'gender', 'patient_category',
        'admission_status', 'rtpcr_result', 'specialty_needed', 
        'referring_hospital', 'created_at'
    ]
    search_fields = [
        'referral_id', 'patient_full_name', 'hrn', 'chief_complaint',
        'referrer_name', 'referrer_cellphone'
    ]
    readonly_fields = ['referral_id', 'created_at', 'updated_at', 'display_referrer_contacts']
    
    def display_referrer_contacts(self, obj):
        """Display all referrer contact numbers"""
        if hasattr(obj, 'referrer_contact_numbers') and obj.referrer_contact_numbers:
            return ', '.join(obj.referrer_contact_numbers)
        elif obj.referrer_cellphone:
            return obj.referrer_cellphone
        return 'No contact numbers'
    display_referrer_contacts.short_description = 'Referrer Contact Numbers (All)'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('referral_id', 'status', 'priority', 'created_at', 'updated_at')
        }),
        ('Patient Status', {
            'fields': (
                'chief_complaint', 'pertinent_history', 'pertinent_physical_exam',
                ('bp', 'hr', 'rr', 'temp', 'o2_sat'),
                'gcs_score', 'o2_support', 'admission_status', 'rtpcr_result',
                'working_impression', 'management_done'
            )
        }),
        ('Patient Information', {
            'fields': (
                'patient_category', 'hrn', 'patient_full_name',
                'current_address', ('birthday', 'age', 'gender')
            )
        }),
        ('Specialty & Service', {
            'fields': (
                'specialty_needed', 'other_specialty', 'is_urgent', 'reason_for_referral'
            )
        }),
        ('Referring Hospital', {
            'fields': (
                'referring_hospital', 'referrer_name', 'referrer_profession', 'referrer_profession_other',
                'referrer_cellphone', 'display_referrer_contacts', 'mode_of_transportation'
            )
        }),
        ('Consent & Assignment', {
            'fields': ('consent_secured', 'created_by', 'assigned_to')
        }),
    )
    
    inlines = [TransitInfoInline, ReferralStatusHistoryInline, ReferralDocumentInline]
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new referral
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(TransitInfo)
class TransitInfoAdmin(admin.ModelAdmin):
    list_display = [
        'referral', 'watcher_name', 'relation_to_patient', 
        'escort_nurse', 'time_ambulance_left'
    ]
    search_fields = ['referral__referral_id', 'watcher_name', 'escort_nurse']

@admin.register(ReferralStatusHistory)
class ReferralStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['referral', 'old_status', 'new_status', 'changed_by', 'changed_at']
    list_filter = ['old_status', 'new_status', 'changed_at']
    search_fields = ['referral__referral_id', 'notes']
    readonly_fields = ['changed_at']

@admin.register(ReferralDocument)
class ReferralDocumentAdmin(admin.ModelAdmin):
    list_display = ['referral', 'document_type', 'description', 'uploaded_by', 'uploaded_at']
    list_filter = ['document_type', 'uploaded_at']
    search_fields = ['referral__referral_id', 'description']
    readonly_fields = ['uploaded_at']
