from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import UserProfile
import json

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Login endpoint"""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return Response({
                'error': 'Username and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        
        if user:
            login(request, user)
            token, created = Token.objects.get_or_create(user=user)
            
            # Get or create user profile
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            return Response({
                'success': True,
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'full_name': user.get_full_name(),
                    'is_staff': user.is_staff,
                    'role': profile.role,
                    'role_display': profile.get_role_display(),
                    'department': profile.department,
                    'permissions': {
                        'can_view_referrals': profile.can_view_referrals,
                        'can_triage_referrals': profile.can_triage_referrals,
                        'can_transfer_referrals': profile.can_transfer_referrals,
                        'is_admin_user': profile.is_admin_user,
                    }
                }
            })
        else:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except json.JSONDecodeError:
        return Response({
            'error': 'Invalid JSON'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Registration endpoint for referrers"""
    try:
        data = json.loads(request.body)
        
        # Required fields
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('firstName')
        last_name = data.get('lastName')
        profession = data.get('profession')
        cellphone = data.get('cellphone')
        hospital_name = data.get('hospitalName')
        hospital_location = data.get('hospitalLocation')
        is_inside_davao = data.get('isInsideDavao', True)
        
        # Validation
        if not all([username, email, password, first_name, last_name, profession, cellphone, hospital_name, hospital_location]):
            return Response({
                'error': 'All fields are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if username already exists
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'Email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Create user profile for referrer
        profile = UserProfile.objects.create(
            user=user,
            role='referrer',  # Set role as referrer
            profession=profession,
            cellphone=cellphone,
            hospital_name=hospital_name,
            hospital_location=hospital_location,
            is_inside_davao=is_inside_davao,
        )
        
        return Response({
            'success': True,
            'message': 'Account created successfully. You can now login.',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.get_full_name(),
                'role': profile.role,
                'role_display': profile.get_role_display(),
            }
        })
        
    except json.JSONDecodeError:
        return Response({
            'error': 'Invalid JSON'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def logout_view(request):
    """Logout endpoint"""
    try:
        # Delete the user's token
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        
        logout(request)
        return Response({
            'success': True,
            'message': 'Successfully logged out'
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def user_profile(request):
    """Get current user profile"""
    if request.user.is_authenticated:
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        return Response({
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'full_name': request.user.get_full_name(),
                'is_staff': request.user.is_staff,
                'role': profile.role,
                'role_display': profile.get_role_display(),
                'department': profile.department,
                'permissions': {
                    'can_view_referrals': profile.can_view_referrals,
                    'can_triage_referrals': profile.can_triage_referrals,
                    'can_transfer_referrals': profile.can_transfer_referrals,
                    'is_admin_user': profile.is_admin_user,
                }
            }
        })
    else:
        return Response({
            'error': 'Not authenticated'
        }, status=status.HTTP_401_UNAUTHORIZED)