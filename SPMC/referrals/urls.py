from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReferringHospitalViewSet, SpecialtyViewSet, ReferralViewSet, TransitInfoViewSet
from .authentication import login_view, logout_view, user_profile

router = DefaultRouter()
router.register(r'hospitals', ReferringHospitalViewSet)
router.register(r'specialties', SpecialtyViewSet)
router.register(r'referrals', ReferralViewSet)
router.register(r'transit-info', TransitInfoViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/logout/', logout_view, name='logout'),
    path('api/auth/profile/', user_profile, name='profile'),
]