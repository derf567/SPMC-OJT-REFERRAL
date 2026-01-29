from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import ReferringHospital, Specialty, Referral, TransitInfo, ReferralStatusHistory, ReferralDocument, UserProfile

# Inline UserProfile in User admin
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'

# Extend UserAdmin to include profile
class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'department', 'contact_number']
    list_filter = ['role', 'department']
    search_fields = ['user__username', 'user__first_name', 'user__last_name']

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
    readonly_fields = ['referral_id', 'created_at', 'updated_at']
    
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
                'referring_hospital', 'referrer_name', 'referrer_profession',
                'referrer_cellphone', 'mode_of_transportation'
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