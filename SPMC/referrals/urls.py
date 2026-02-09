from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .views import ReferringHospitalViewSet, SpecialtyViewSet, ReferralViewSet, TransitInfoViewSet, ReferrerAccountViewSet
from .authentication import login_view, logout_view, user_profile, register_view, comprehensive_register_view

@api_view(['GET'])
def api_root(request):
    return Response({
        'message': 'SPMC OJT Referral API',
        'endpoints': {
            'admin': '/admin/',
            'api': '/api/',
            'auth': {
                'login': '/api/auth/login/',
                'register': '/api/auth/register/',
                'register_comprehensive': '/api/auth/register-comprehensive/',
                'logout': '/api/auth/logout/',
                'profile': '/api/auth/profile/',
            }
        }
    })

router = DefaultRouter()
router.register(r'hospitals', ReferringHospitalViewSet)
router.register(r'specialties', SpecialtyViewSet)
router.register(r'referrals', ReferralViewSet)
router.register(r'transit-info', TransitInfoViewSet)
router.register(r'referrers', ReferrerAccountViewSet)

urlpatterns = [
    path('', api_root, name='api_root'),
    path('api/', include(router.urls)),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/register/', register_view, name='register'),
    path('api/auth/register-comprehensive/', comprehensive_register_view, name='comprehensive_register'),
    path('api/auth/logout/', logout_view, name='logout'),
    path('api/auth/profile/', user_profile, name='profile'),
]