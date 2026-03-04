from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
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
                        'is_view_only': profile.is_view_only,
                        'is_doctor': profile.is_doctor,
                        'can_view_department_referrals': profile.can_view_department_referrals,
                    },
                    # Hospital information for referrers
                    'hospital_name': profile.hospital_name if profile.role == 'referrer' else None,
                    'hospital_location': profile.hospital_location if profile.role == 'referrer' else None,
                    'hospital_doh_level': profile.hospital_doh_level if profile.role == 'referrer' else None,
                    'hospital_region': profile.hospital_region if profile.role == 'referrer' else None,
                    'hospital_province': profile.hospital_province if profile.role == 'referrer' else None,
                    'hospital_city': profile.hospital_city if profile.role == 'referrer' else None,
                    'hospital_barangay': profile.hospital_barangay if profile.role == 'referrer' else None,
                    'hospital_street': profile.hospital_street if profile.role == 'referrer' else None,
                    'hospital_district': profile.hospital_district if profile.role == 'referrer' else None,
                    'contact_numbers': profile.contact_numbers if profile.role == 'referrer' else [],
                    'is_inside_davao': profile.is_inside_davao if profile.role == 'referrer' else None,
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
            is_inside_davao=data.get('is_inside_davao_city', 'true').lower() == 'true',
            # New address fields from PSGC API
            hospital_region=data.get('region', ''),
            hospital_province=data.get('province', ''),
            hospital_city=data.get('city', ''),
            hospital_barangay=data.get('barangay', ''),
            hospital_street=data.get('complete_address', ''),
            hospital_doh_level=data.get('hospital_doh_level', ''),
            contact_numbers=json.loads(data.get('contact_numbers', '[]')) if isinstance(data.get('contact_numbers'), str) else data.get('contact_numbers', []),
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
                    doc_type = 'legal_document' if referrer_type == 'hospital_account' else 'official_id'
                    
                    ReferrerDocument.objects.create(
                        referrer=referrer_account,
                        document_type=doc_type,
                        file=file_obj,
                        description=f"Registration document for {referrer_type}",
                        uploaded_by=user
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
                    'is_admin_user': profile.is_admin_user,
                    'is_doctor': profile.is_doctor,
                    'can_view_department_referrals': profile.can_view_department_referrals,
                },
                # Hospital information for referrers
                'hospital_name': profile.hospital_name,
                'hospital_location': profile.hospital_location,
                'hospital_doh_level': profile.hospital_doh_level,
                'is_inside_davao': profile.is_inside_davao,
                'contact_numbers': profile.contact_numbers,
                # Detailed hospital address
                'hospital_region': profile.hospital_region,
                'hospital_province': profile.hospital_province,
                'hospital_city': profile.hospital_city,
                'hospital_barangay': profile.hospital_barangay,
                'hospital_street': profile.hospital_street,
                'hospital_district': profile.hospital_district,
            }
        })
    else:
        return Response({
            'error': 'Not authenticated'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_doctor_view(request):
    """Registration endpoint for doctors - requires admin approval"""
    try:
        from .models import Specialty
        
        # Handle FormData
        data = request.POST
        files = request.FILES
        
        # Basic required fields
        username = data.get('username')
        email = data.get('email', '')
        password = data.get('password')
        first_name = data.get('first_name')
        middle_name = data.get('middle_name', '')
        last_name = data.get('last_name')
        department = data.get('department')
        spmc_id = data.get('spmc_id')
        
        # Validation
        if not all([username, password, first_name, last_name, department, spmc_id]):
            return Response({
                'error': 'Username, password, full name, department, and SPMC ID are required',
                'success': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if username already exists
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'Username already exists',
                'success': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if email already exists (if provided)
        if email and User.objects.filter(email=email).exists():
            return Response({
                'error': 'Email already exists',
                'success': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user (inactive until approved)
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_active=False  # Inactive until admin approves
        )
        
        # Parse specialties
        specialties_json = data.get('specialties', '[]')
        try:
            specialties_list = json.loads(specialties_json) if isinstance(specialties_json, str) else specialties_json
        except:
            specialties_list = []
        
        # Create user profile for doctor
        profile = UserProfile.objects.create(
            user=user,
            role='doctor',
            department=department,
            profession='Doctor',
        )
        
        # Handle SPMC ID file upload
        if 'spmc_id_file' in files:
            # You can save this to a DoctorDocument model or similar
            # For now, we'll just note that it was uploaded
            spmc_id_file = files['spmc_id_file']
            # TODO: Save file to appropriate location
            # For now, just log it
            print(f"SPMC ID file uploaded: {spmc_id_file.name}")
        
        return Response({
            'success': True,
            'message': 'Doctor registration submitted successfully. Your account is pending admin approval.',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.get_full_name(),
                'department': department,
                'specialties': specialties_list,
                'status': 'pending_approval'
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"Doctor registration error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': f'Registration failed: {str(e)}',
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_doctors_view(request):
    """Get all pending doctor accounts for admin approval"""
    try:
        # Check if user is admin - either is_staff or has admin role
        is_admin = request.user.is_staff
        if not is_admin:
            try:
                profile = request.user.profile
                is_admin = profile.role == 'admin'
            except UserProfile.DoesNotExist:
                pass
        
        if not is_admin:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get all users with doctor role
        doctors = User.objects.filter(profile__role='doctor').select_related('profile').order_by('-date_joined')
        
        data = []
        for doctor in doctors:
            profile = doctor.profile
            
            # Get department display name
            department_display = ''
            if profile.department:
                try:
                    department_display = dict(profile._meta.get_field('department').choices).get(profile.department, profile.department)
                except:
                    department_display = profile.department
            
            data.append({
                'id': doctor.id,
                'username': doctor.username,
                'email': doctor.email,
                'first_name': doctor.first_name,
                'last_name': doctor.last_name,
                'full_name': doctor.get_full_name(),
                'role': 'doctor',
                'department': profile.department or '',
                'department_display': department_display,
                'created_at': doctor.date_joined.isoformat(),
                'is_active': doctor.is_active,
                'approval_status': 'approved' if doctor.is_active else 'pending',
            })
        
        return Response(data)
    except Exception as e:
        print(f"Error in pending_doctors_view: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': f'Failed to fetch doctors: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_doctors_view(request):
    """Get all doctors with their departments and specialties"""
    try:
        # Check if user is admin
        is_admin = request.user.is_staff
        if not is_admin:
            try:
                profile = request.user.profile
                is_admin = profile.role == 'admin'
            except UserProfile.DoesNotExist:
                pass
        
        if not is_admin:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get all active doctors
        doctors = User.objects.filter(
            profile__role='doctor',
            is_active=True
        ).select_related('profile').order_by('first_name', 'last_name')
        
        data = []
        for doctor in doctors:
            profile = doctor.profile
            
            # Get department display name
            department_display = ''
            if profile.department:
                try:
                    department_display = dict(profile._meta.get_field('department').choices).get(profile.department, profile.department)
                except:
                    department_display = profile.department
            
            data.append({
                'id': doctor.id,
                'name': doctor.get_full_name(),
                'username': doctor.username,
                'email': doctor.email,
                'role': 'doctor',
                'role_display': 'Doctor',
                'department': profile.department or '',
                'department_display': department_display,
                'specialties': [],  # TODO: Add specialties if you have a relationship
                'contact_number': profile.cellphone or '',
            })
        
        return Response(data)
    except Exception as e:
        print(f"Error in all_doctors_view: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': f'Failed to fetch doctors: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_doctor_view(request, doctor_id):
    """Approve a doctor account"""
    try:
        # Check if user is admin - either is_staff or has admin role
        is_admin = request.user.is_staff
        if not is_admin:
            try:
                profile = request.user.profile
                is_admin = profile.role == 'admin'
            except UserProfile.DoesNotExist:
                pass
        
        if not is_admin:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        doctor = User.objects.get(id=doctor_id, profile__role='doctor')
        doctor.is_active = True
        doctor.save()
        return Response({
            'success': True,
            'message': f'Doctor account for {doctor.get_full_name()} approved successfully'
        })
    except User.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error approving doctor: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': f'Failed to approve doctor: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_doctor_view(request, doctor_id):
    """Reject/delete a doctor account"""
    try:
        # Check if user is admin - either is_staff or has admin role
        is_admin = request.user.is_staff
        if not is_admin:
            try:
                profile = request.user.profile
                is_admin = profile.role == 'admin'
            except UserProfile.DoesNotExist:
                pass
        
        if not is_admin:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        doctor = User.objects.get(id=doctor_id, profile__role='doctor')
        doctor_name = doctor.get_full_name()
        doctor.delete()
        return Response({
            'success': True,
            'message': f'Doctor account for {doctor_name} rejected and removed'
        })
    except User.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error rejecting doctor: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': f'Failed to reject doctor: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
