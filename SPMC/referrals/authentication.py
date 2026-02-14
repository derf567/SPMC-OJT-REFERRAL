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
        from .models import ReferrerAccount
        
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return Response({
                'error': 'Username and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        
        if user:
            # Get or create user profile
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            # Check if user is a referrer and if their account is approved
            if profile.role == 'referrer':
                try:
                    referrer_account = ReferrerAccount.objects.get(user=user)
                    if referrer_account.approval_status == 'pending':
                        return Response({
                            'error': 'Your account is pending approval. Please wait for an administrator to review your registration.'
                        }, status=status.HTTP_403_FORBIDDEN)
                    elif referrer_account.approval_status == 'rejected':
                        return Response({
                            'error': 'Your account registration has been rejected. Please contact the administrator for more information.'
                        }, status=status.HTTP_403_FORBIDDEN)
                except ReferrerAccount.DoesNotExist:
                    # If no ReferrerAccount exists, allow login (for legacy accounts)
                    pass
            
            login(request, user)
            token, created = Token.objects.get_or_create(user=user)
            
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
                        'is_his_department': profile.is_his_department,
                        'can_confirm_arrivals': profile.can_confirm_arrivals,
                        'is_admin_user': profile.is_admin_user,
                        'is_view_only': profile.is_view_only,
                        'department': profile.department,
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
@permission_classes([AllowAny])
def comprehensive_register_view(request):
    """Comprehensive registration endpoint for all referrer types with full form data"""
    try:
        from .models import ReferrerAccount, ReferrerDocument, Specialty, ReferringHospital
        
        # Handle both JSON and FormData
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.POST
            files = request.FILES
        else:
            data = json.loads(request.body)
            files = None
        
        # Basic required fields
        username = data.get('username')
        email = data.get('email', '')
        password = data.get('password')
        first_name = data.get('first_name')
        middle_name = data.get('middle_name', '')
        last_name = data.get('last_name')
        referrer_type = data.get('referrer_type', 'doctor')
        
        # Validation
        if not all([username, password, first_name, last_name]):
            return Response({
                'error': 'Username, password, first name, and last name are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if username already exists
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if email already exists (if provided)
        if email and User.objects.filter(email=email).exists():
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
            role='referrer',
            profession=referrer_type.replace('_', ' ').title(),
            cellphone=data.get('cellphone', ''),
            hospital_name=data.get('hospital_name', ''),
            hospital_location=data.get('address', ''),
            is_inside_davao=True,  # Default to True
        )
        
        # Create comprehensive referrer account
        referrer_account = ReferrerAccount.objects.create(
            user=user,
            first_name=first_name,
            middle_name=middle_name,
            last_name=last_name,
            referrer_type=referrer_type,
            age=int(data.get('age', 0)) if data.get('age') else None,
            gender=data.get('gender', ''),
            address=data.get('address', ''),
            position=data.get('position', ''),
        )
        
        # Handle specialties for doctors
        if referrer_type == 'doctor':
            specialties_data = data.getlist('specialties') if hasattr(data, 'getlist') else data.get('specialties', [])
            if isinstance(specialties_data, str):
                specialties_data = [specialties_data]
            
            for specialty_name in specialties_data:
                if specialty_name:
                    specialty, created = Specialty.objects.get_or_create(name=specialty_name)
                    referrer_account.specialties.add(specialty)
        
        # Handle affiliate hospitals for doctors
        if referrer_type == 'doctor':
            hospitals_data = data.getlist('affiliate_hospitals') if hasattr(data, 'getlist') else data.get('affiliate_hospitals', [])
            if isinstance(hospitals_data, str):
                hospitals_data = [hospitals_data]
            
            for hospital_name in hospitals_data:
                if hospital_name:
                    hospital, created = ReferringHospital.objects.get_or_create(
                        name=hospital_name,
                        defaults={'is_inside_davao_city': True}
                    )
                    referrer_account.affiliate_hospitals.add(hospital)
        
        # Handle file uploads
        if files:
            for file_key, file_obj in files.items():
                if file_key == 'documents':
                    # Determine document type based on referrer type
                    doc_type = 'official_id'
                    
                    ReferrerDocument.objects.create(
                        referrer=referrer_account,
                        document_type=doc_type,
                        file=file_obj,
                        description=f"Registration document for {referrer_type}",
                        uploaded_by=user
                    )
        
        return Response({
            'success': True,
            'message': 'Registration submitted successfully. Your account is pending approval by an administrator.',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.get_full_name(),
                'role': profile.role,
                'role_display': profile.get_role_display(),
                'referrer_type': referrer_account.referrer_type,
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
                    'is_his_department': profile.is_his_department,
                    'can_confirm_arrivals': profile.can_confirm_arrivals,
                    'is_admin_user': profile.is_admin_user,
                    'is_view_only': profile.is_view_only,
                    'department': profile.department,
                }
            }
        })
    else:
        return Response({
            'error': 'Not authenticated'
        }, status=status.HTTP_401_UNAUTHORIZED)