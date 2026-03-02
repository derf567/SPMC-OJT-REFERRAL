from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ReferringHospitalViewSet, SpecialtyViewSet, ReferralViewSet, TransitInfoViewSet, 
    ReferrerAccountViewSet, DepartmentViewSet, admin_dashboard_stats, manage_departments,
    report_fraud
)
from .authentication import (
    login_view, logout_view, user_profile, register_view, 
    comprehensive_register_view, register_doctor_view,
    pending_doctors_view, all_doctors_view, approve_doctor_view, reject_doctor_view
)

router = DefaultRouter()
router.register(r'hospitals', ReferringHospitalViewSet)
router.register(r'specialties', SpecialtyViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'referrals', ReferralViewSet)
router.register(r'transit-info', TransitInfoViewSet)
router.register(r'referrers', ReferrerAccountViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/register/', register_view, name='register'),
    path('api/auth/register-comprehensive/', comprehensive_register_view, name='comprehensive_register'),
    path('api/auth/register-doctor/', register_doctor_view, name='register_doctor'),
    path('api/auth/logout/', logout_view, name='logout'),
    path('api/auth/profile/', user_profile, name='profile'),
    path('api/admin/dashboard_stats/', admin_dashboard_stats, name='admin_dashboard_stats'),
    path('api/admin/departments/', manage_departments, name='manage_departments'),
    path('api/admin/pending-doctors/', pending_doctors_view, name='pending_doctors'),
    path('api/admin/doctors/', all_doctors_view, name='all_doctors'),
    path('api/admin/approve-doctor/<int:doctor_id>/', approve_doctor_view, name='approve_doctor'),
    path('api/admin/reject-doctor/<int:doctor_id>/', reject_doctor_view, name='reject_doctor'),
    path('api/referrals/<int:pk>/report_fraud/', report_fraud, name='report_fraud'),
]