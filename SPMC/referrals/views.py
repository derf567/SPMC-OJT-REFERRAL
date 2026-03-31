from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Max
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from datetime import timedelta
from .models import (
    ReferringHospital, Specialty, Referral, TransitInfo, ReferralStatusHistory,
    Department, DepartmentAcceptance, ReferralFraudAuditLog
)
from .serializers import (
    ReferringHospitalSerializer, SpecialtySerializer, ReferralListSerializer,
    ReferralDetailSerializer, ReferralCreateSerializer, ReferralUpdateSerializer,
    StatusUpdateSerializer, TransitInfoSerializer, DepartmentSerializer, DepartmentAcceptanceSerializer,
    ReferralFraudAuditLogSerializer
)
from .models import ReferrerAccount
from .serializers import ReferrerAccountSerializer, ReferrerRegistrationSerializer

class ReferringHospitalViewSet(viewsets.ModelViewSet):
    queryset = ReferringHospital.objects.all()
    serializer_class = ReferringHospitalSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'location']
    filterset_fields = ['is_inside_davao_city', 'location']
    
    def get_permissions(self):
        """Allow anonymous access for list and retrieve (for external referral form)"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

class SpecialtyViewSet(viewsets.ModelViewSet):
    queryset = Specialty.objects.all()
    serializer_class = SpecialtySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
    
    def get_permissions(self):
        """Allow anonymous access for list and retrieve (for external referral form)"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.filter(is_active=True)
    serializer_class = DepartmentSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'code']
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Allow read access for authenticated users, write access for admins only"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated]  # Can add admin check here
        return [permission() for permission in permission_classes]

@method_decorator(csrf_exempt, name='dispatch')
class ReferralViewSet(viewsets.ModelViewSet):
    queryset = Referral.objects.select_related(
        'specialty_needed', 'referring_hospital', 'created_by', 'assigned_to',
        'transferred_by', 'triaged_by', 'triage_verified_by'
    ).prefetch_related('transit_info', 'status_history', 'documents', 'department_acceptances', 'fraud_audit_logs')
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = [
        'referral_id', 'patient_full_name', 'hrn', 'chief_complaint',
        'referrer_name', 'referrer_cellphone'
    ]
    filterset_fields = [
        'status', 'priority', 'is_urgent', 'gender', 'patient_category',
        'admission_status', 'rtpcr_result', 'specialty_needed', 'referring_hospital',
        'fraud_risk_level', 'fraud_requires_manual_review'
    ]
    ordering_fields = ['created_at', 'updated_at', 'patient_full_name', 'age']
    ordering = ['-created_at']
    
    def get_permissions(self):
        """Allow anonymous access for create (external referral submission)"""
        if self.action == 'create':
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ReferralListSerializer
        elif self.action == 'create':
            return ReferralCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ReferralUpdateSerializer
        else:
            return ReferralDetailSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        
        # Filter by assigned user
        assigned_to_me = self.request.query_params.get('assigned_to_me')
        if assigned_to_me == 'true':
            queryset = queryset.filter(assigned_to=self.request.user)
        
        # Filter for doctors - only show referrals assigned to their department
        if hasattr(user, 'profile') and user.profile.is_doctor:
            user_department = user.profile.department
            if user_department:
                # Filter referrals where assigned_departments contains the doctor's department
                from django.db.models import Q
                from django.db import connection
                
                if connection.vendor == 'sqlite':
                    # For SQLite, we need to manually filter the JSON array
                    # Get all referrals and filter in Python
                    all_referrals = list(queryset)
                    filtered_ids = []
                    
                    for referral in all_referrals:
                        # Check if department is in assigned_departments JSON array
                        if referral.assigned_departments and isinstance(referral.assigned_departments, list):
                            if user_department in referral.assigned_departments:
                                filtered_ids.append(referral.id)
                        # Also check old assigned_department field for backwards compatibility
                        elif referral.assigned_department == user_department:
                            filtered_ids.append(referral.id)
                    
                    queryset = queryset.filter(id__in=filtered_ids)
                else:
                    # For PostgreSQL and other databases that support JSON contains
                    queryset = queryset.filter(
                        Q(assigned_departments__contains=[user_department]) |
                        Q(assigned_department=user_department)
                    )
        
        return queryset

    def _can_manage_fraud_review(self, user):
        if not user.is_authenticated:
            return False
        if user.is_staff or user.is_superuser:
            return True
        if not hasattr(user, 'profile'):
            return False
        return user.profile.can_triage_referrals or user.profile.role == 'admin'
    
    def update(self, request, *args, **kwargs):
        """Override update to check if referral can be edited"""
        referral = self.get_object()
        
        # Check if user is EDCC/Triage personnel
        try:
            profile = request.user.profile
            is_edcc_or_triage = profile.can_triage_referrals
        except:
            is_edcc_or_triage = False
        
        # EDCC/Triage can edit any referral
        if not is_edcc_or_triage:
            # Referrers can only edit pending referrals they created
            if referral.status != 'pending':
                return Response({
                    'error': 'Cannot edit referral. Referral is already under triage or has been processed.',
                    'status': referral.status
                }, status=status.HTTP_403_FORBIDDEN)
            
            if referral.created_by != request.user:
                return Response({
                    'error': 'You can only edit your own referrals'
                }, status=status.HTTP_403_FORBIDDEN)
        
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """Override partial_update to check if referral can be edited"""
        referral = self.get_object()
        
        # Check if user is EDCC/Triage personnel
        try:
            profile = request.user.profile
            is_edcc_or_triage = profile.can_triage_referrals
        except:
            is_edcc_or_triage = False
        
        # EDCC/Triage can edit any referral
        if not is_edcc_or_triage:
            # Referrers can only edit pending referrals they created
            if referral.status != 'pending':
                return Response({
                    'error': 'Cannot edit referral. Referral is already under triage or has been processed.',
                    'status': referral.status
                }, status=status.HTTP_403_FORBIDDEN)
            
            if referral.created_by != request.user:
                return Response({
                    'error': 'You can only edit your own referrals'
                }, status=status.HTTP_403_FORBIDDEN)
        
        return super().partial_update(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update referral status and create history record"""
        referral = self.get_object()
        serializer = StatusUpdateSerializer(
            referral, 
            data=request.data, 
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Status updated successfully',
                'new_status': referral.status
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def mark_in_transit_completed(self, request, pk=None):
        """Mark in-transit referral as completed (patient arrived and treated)"""
        referral = self.get_object()
        
        # Check if user has permission (EDCC/Triage)
        if not hasattr(request.user, 'profile') or not request.user.profile.can_triage_referrals:
            return Response({
                'error': 'You do not have permission to mark referrals as completed'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if referral is in transit
        if referral.status != 'in_transit':
            return Response({
                'error': 'Can only mark in-transit referrals as completed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        completion_notes = request.data.get('notes', '')
        
        # Update referral status to completed
        old_status = referral.status
        referral.status = 'completed'
        referral.save()
        
        # Create status history record
        history_notes = 'Patient arrived and treatment completed.'
        if completion_notes:
            history_notes += f' Notes: {completion_notes}'
            
        ReferralStatusHistory.objects.create(
            referral=referral,
            old_status=old_status,
            new_status='completed',
            changed_by=request.user,
            notes=history_notes
        )
        
        return Response({
            'message': 'Referral marked as completed successfully',
            'new_status': referral.status
        })
    
    @action(detail=True, methods=['post'])
    def mark_in_transit_cancelled(self, request, pk=None):
        """Mark in-transit referral as cancelled (patient did not arrive or expired)"""
        referral = self.get_object()
        
        # Check if user has permission (EDCC/Triage)
        if not hasattr(request.user, 'profile') or not request.user.profile.can_triage_referrals:
            return Response({
                'error': 'You do not have permission to cancel referrals'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if referral is in transit
        if referral.status != 'in_transit':
            return Response({
                'error': 'Can only cancel in-transit referrals'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        cancellation_reason = request.data.get('reason', '')
        
        if not cancellation_reason:
            return Response({
                'error': 'Cancellation reason is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Map frontend string to choice key
        reason_map = {
            'Patient went HAMA (Home Against Medical Advice)': 'patient_hama',
            'Patient Expired': 'patient_expired',
            'Patient Opted to Stay at Facility': 'patient_opted_stay',
            'Referred to Nearest Tertiary Hospital': 'referred_tertiary',
            'Patient Scheduled for OPD': 'patient_scheduled_opd',
            'Referral Sent in Error': 'referral_sent_in_error',
            'Duplicate Referral': 'duplicate_referral',
            'Patient Condition Improved': 'patient_condition_improved',
            'No Available Specialist at SPMC': 'no_available_specialist',
        }

        reason_other = None
        if cancellation_reason.startswith('Others: '):
            reason_key = 'others'
            reason_other = cancellation_reason[len('Others: '):]
        else:
            reason_key = reason_map.get(cancellation_reason, 'others')
            if reason_key == 'others':
                reason_other = cancellation_reason

        # Update referral status to cancelled
        old_status = referral.status
        referral.status = 'cancelled'
        referral.cancellation_reason = reason_key
        referral.cancellation_reason_other = reason_other
        referral.save()
        
        # Create status history record
        display_reason = reason_other if reason_key == 'others' else cancellation_reason
        ReferralStatusHistory.objects.create(
            referral=referral,
            old_status=old_status,
            new_status='cancelled',
            changed_by=request.user,
            notes=f'Referral cancelled. Reason: {display_reason}'
        )
        
        return Response({
            'message': 'Referral marked as cancelled',
            'new_status': referral.status
        })
    
    @action(detail=True, methods=['post'])
    def cancel_referral(self, request, pk=None):
        """Cancel referral anytime - allowed for referrer (own referrals), EDCC, and Triage"""
        referral = self.get_object()
        
        # Check permissions
        try:
            profile = request.user.profile
            is_edcc_or_triage = profile.can_triage_referrals
        except:
            is_edcc_or_triage = False
        
        # Allow if: EDCC/Triage OR referrer who created the referral
        if not is_edcc_or_triage and referral.created_by != request.user:
            return Response({
                'error': 'You do not have permission to cancel this referral'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if referral is already cancelled or completed
        if referral.status in ['cancelled', 'completed']:
            return Response({
                'error': f'Cannot cancel referral with status: {referral.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        cancellation_reason = request.data.get('reason', 'No reason provided')
        
        # Map frontend string to choice key
        reason_map = {
            'Patient went HAMA (Home Against Medical Advice)': 'patient_hama',
            'Patient Expired': 'patient_expired',
            'Patient Opted to Stay at Facility': 'patient_opted_stay',
            'Referred to Nearest Tertiary Hospital': 'referred_tertiary',
            'Patient Scheduled for OPD': 'patient_scheduled_opd',
            'Referral Sent in Error': 'referral_sent_in_error',
            'Duplicate Referral': 'duplicate_referral',
            'Patient Condition Improved': 'patient_condition_improved',
            'No Available Specialist at SPMC': 'no_available_specialist',
        }

        reason_other = None
        if cancellation_reason.startswith('Others: '):
            reason_key = 'others'
            reason_other = cancellation_reason[len('Others: '):]
        else:
            reason_key = reason_map.get(cancellation_reason, 'others')
            if reason_key == 'others':
                reason_other = cancellation_reason

        # Update referral status to cancelled
        old_status = referral.status
        referral.status = 'cancelled'
        referral.cancellation_reason = reason_key
        referral.cancellation_reason_other = reason_other
        referral.save()
        
        # Create status history record
        display_reason = reason_other if reason_key == 'others' else cancellation_reason
        ReferralStatusHistory.objects.create(
            referral=referral,
            old_status=old_status,
            new_status='cancelled',
            changed_by=request.user,
            notes=f'Referral cancelled. Reason: {display_reason}'
        )
        
        return Response({
            'message': 'Referral cancelled successfully',
            'new_status': referral.status
        })
    
    @action(detail=True, methods=['post'])
    def mark_appointment_completed(self, request, pk=None):
        """Mark outpatient appointment as completed"""
        referral = self.get_object()
        
        # Check if user has permission (can be triage users or other authorized staff)
        if not hasattr(request.user, 'profile'):
            return Response({
                'error': 'You do not have permission to mark appointments as completed'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if this is actually a scheduled appointment
        if referral.triage_decision != 'schedule_opd' or not referral.scheduled_date:
            return Response({
                'error': 'This referral is not a scheduled outpatient appointment'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        completion_notes = request.data.get('completion_notes', '')
        
        # Update referral status to completed
        old_status = referral.status
        referral.status = 'completed'
        referral.save()
        
        # Create status history record
        history_notes = f'Outpatient appointment completed.'
        if completion_notes:
            history_notes += f' Notes: {completion_notes}'
            
        ReferralStatusHistory.objects.create(
            referral=referral,
            old_status=old_status,
            new_status='completed',
            changed_by=request.user,
            notes=history_notes
        )
        
        return Response({
            'message': 'Appointment marked as completed successfully',
            'new_status': referral.status
        })
    
    @action(detail=True, methods=['post'])
    def assign_to_me(self, request, pk=None):
        """Assign referral to current user"""
        referral = self.get_object()
        referral.assigned_to = request.user
        referral.save()
        
        return Response({
            'message': 'Referral assigned to you successfully',
            'assigned_to': request.user.get_full_name()
        })
    
    @action(detail=True, methods=['post'])
    def cancel_referral(self, request, pk=None):
        """Cancel referral - referrer can cancel pending referrals"""
        referral = self.get_object()
        
        # Check if referral can be cancelled (only pending referrals)
        if referral.status != 'pending':
            return Response({
                'error': 'Can only cancel pending referrals. This referral is already being processed.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user is the creator or has admin permissions
        if referral.created_by != request.user and not (hasattr(request.user, 'profile') and request.user.profile.is_admin_user):
            return Response({
                'error': 'You can only cancel your own referrals'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get cancellation reason
        reason = request.data.get('reason', 'No reason provided')
        
        # Update referral status
        old_status = referral.status
        referral.status = 'cancelled'
        referral.save()
        
        # Create status history
        ReferralStatusHistory.objects.create(
            referral=referral,
            old_status=old_status,
            new_status='cancelled',
            changed_by=request.user,
            notes=f'Cancelled by referrer: {reason}'
        )
        
        return Response({
            'message': 'Referral cancelled successfully',
            'referral_id': referral.referral_id,
            'reason': reason
        })
    
    @action(detail=True, methods=['post'])
    def transfer_to_triage(self, request, pk=None):
        """Transfer referral to triage tab (EDCC/Triage action)"""
        referral = self.get_object()
        
        # Check if user has permission to transfer referrals
        if not hasattr(request.user, 'profile') or not request.user.profile.can_transfer_referrals:
            return Response({
                'error': 'You do not have permission to transfer referrals'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if already in triage
        if referral.in_triage:
            return Response({
                'error': 'Referral is already in triage'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update referral to be in triage
        old_status = referral.status
        referral.in_triage = True
        referral.status = 'in_triage'
        referral.transferred_by = request.user
        referral.transferred_at = timezone.now()
        referral.save()
        
        # Create status history record
        ReferralStatusHistory.objects.create(
            referral=referral,
            old_status=old_status,
            new_status='in_triage',
            changed_by=request.user,
            notes='Transferred to Triage for department assignment'
        )
        
        return Response({
            'message': 'Referral successfully transferred to Triage',
            'new_status': referral.status,
            'in_triage': referral.in_triage
        })
    
    @action(detail=True, methods=['post'])
    def assign_departments(self, request, pk=None):
        """Assign departments to referral (EDCC/Triage action)"""
        referral = self.get_object()
        
        # Check if user has permission
        if not hasattr(request.user, 'profile') or not request.user.profile.can_triage_referrals:
            return Response({
                'error': 'You do not have permission to assign departments'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if referral is in triage
        if not referral.in_triage:
            return Response({
                'error': 'Referral must be in triage to assign departments'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get departments, triage decision, and remarks from request
        department_codes = request.data.get('departments', [])
        main_service_code = request.data.get('main_service_code')  # Optional
        remarks = request.data.get('remarks', '')
        triage_decision = request.data.get('triage_decision', '')
        scheduled_date = request.data.get('scheduled_date')
        scheduled_time = request.data.get('scheduled_time')
        
        if not department_codes or len(department_codes) == 0:
            return Response({
                'error': 'At least one department must be selected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate main_service_code if provided
        if main_service_code and main_service_code not in department_codes:
            return Response({
                'error': 'Main service must be one of the selected departments'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not triage_decision:
            return Response({
                'error': 'Triage decision is required (emergent, urgent, or schedule_opd)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate triage decision
        valid_decisions = ['emergent', 'urgent', 'schedule_opd']
        if triage_decision not in valid_decisions:
            return Response({
                'error': 'Invalid triage decision'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate scheduled date/time for OPD
        if triage_decision == 'schedule_opd':
            if not scheduled_date or not scheduled_time:
                return Response({
                    'error': 'Scheduled date and time are required for OPD appointments'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate departments exist
        departments = Department.objects.filter(code__in=department_codes, is_active=True)
        if departments.count() != len(department_codes):
            return Response({
                'error': 'One or more invalid departments selected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete existing department acceptances if any
        referral.department_acceptances.all().delete()
        
        # Create department acceptance records
        for dept in departments:
            DepartmentAcceptance.objects.create(
                referral=referral,
                department_code=dept.code,
                department_name=dept.name,
                status='pending',
                is_main_service=(dept.code == main_service_code)
            )
        
        # Update referral
        old_status = referral.status
        referral.status = 'waiting_acceptance'
        referral.triage_remarks = remarks
        referral.triage_decision = triage_decision
        referral.assigned_departments = list(department_codes)
        referral.main_service_code = main_service_code
        referral.triaged_by = request.user
        referral.triaged_at = timezone.now()
        
        # Set scheduled date/time for OPD
        if triage_decision == 'schedule_opd':
            referral.scheduled_date = scheduled_date
            referral.scheduled_time = scheduled_time
        
        referral.save()
        
        # Create status history
        dept_names = [dept.name for dept in departments]
        decision_display = triage_decision.replace('_', ' ').title()
        history_notes = f'Triage decision: {decision_display}. Assigned to departments: {", ".join(dept_names)}'
        if remarks:
            history_notes += f'. Remarks: {remarks}'
        if triage_decision == 'schedule_opd':
            history_notes += f'. Scheduled for {scheduled_date} at {scheduled_time}'
        
        ReferralStatusHistory.objects.create(
            referral=referral,
            old_status=old_status,
            new_status='waiting_acceptance',
            changed_by=request.user,
            notes=history_notes
        )
        
        return Response({
            'message': f'Successfully assigned to {len(department_codes)} department(s) with {decision_display} priority',
            'departments': [{'code': d.code, 'name': d.name, 'contact_number': d.contact_number} for d in departments],
            'new_status': referral.status
        })
    
    @action(detail=True, methods=['post'])
    def department_decision(self, request, pk=None):
        """Department accepts or rejects referral"""
        referral = self.get_object()
        
        department_code = request.data.get('department_code')
        decision = request.data.get('decision')  # 'accept' or 'reject'
        notes = request.data.get('notes', '')
        
        if not department_code or not decision:
            return Response({
                'error': 'Department code and decision are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if decision not in ['accept', 'reject']:
            return Response({
                'error': 'Decision must be "accept" or "reject"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the department acceptance record
        try:
            acceptance = DepartmentAcceptance.objects.get(
                referral=referral,
                department_code=department_code
            )
        except DepartmentAcceptance.DoesNotExist:
            return Response({
                'error': 'Department acceptance record not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update acceptance
        if decision == 'accept':
            acceptance.accept(request.user)
            message = f'{acceptance.department_name} accepted the referral'
        else:
            acceptance.reject(request.user, notes)
            message = f'{acceptance.department_name} rejected the referral'
        
        # Get updated acceptance summary
        summary = referral.get_department_acceptance_summary()
        
        return Response({
            'message': message,
            'acceptance_summary': summary,
            'referral_status': referral.status
        })
    
    @action(detail=True, methods=['post'])
    def approve_for_transit(self, request, pk=None):
        """Triage/EDCC approves referral for transit after verifying with departments"""
        referral = self.get_object()
        
        # Check if referral is awaiting triage verification
        if referral.status != 'awaiting_triage_verification':
            return Response({
                'error': 'Referral must be in awaiting_triage_verification status'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user is triage/EDCC personnel
        user_profile = request.user.profile if hasattr(request.user, 'profile') else None
        if not user_profile or not user_profile.can_triage_referrals:
            return Response({
                'error': 'Only triage/EDCC personnel can approve referrals for transit'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get verification notes
        verification_notes = request.data.get('verification_notes', '')
        
        # Update referral status to dispositioned
        referral.status = 'dispositioned'
        referral.triage_verified_by = request.user
        referral.triage_verified_at = timezone.now()
        referral.triage_verification_notes = verification_notes
        referral.save()
        
        # Create status history
        ReferralStatusHistory.objects.create(
            referral=referral,
            old_status='awaiting_triage_verification',
            new_status='dispositioned',
            changed_by=request.user,
            notes=f'Approved for transit by triage/EDCC. Verification notes: {verification_notes}' if verification_notes else 'Approved for transit by triage/EDCC'
        )
        
        return Response({
            'message': 'Referral approved for transit. Referrer will be notified to fill transit form.',
            'referral_status': referral.status,
            'triage_verified_at': referral.triage_verified_at,
            'triage_verified_by': referral.triage_verified_by.get_full_name()
        })
    
    @action(detail=True, methods=['post'])
    def fill_transit_info(self, request, pk=None):
        """Fill or update in-transit form for dispositioned or in_transit referral"""
        referral = self.get_object()
        
        # Check if referral is dispositioned or in_transit (allow editing)
        if referral.status not in ['dispositioned', 'in_transit']:
            return Response({
                'error': 'Can only fill or edit transit info for dispositioned or in-transit referrals'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user is the referrer or has permission to edit
        if referral.created_by != request.user:
            # Allow EDCC/Triage users to edit transit info
            if not (hasattr(request.user, 'profile') and request.user.profile.can_transfer_referrals):
                return Response({
                    'error': 'Only the referrer or authorized personnel can fill/edit transit information'
                }, status=status.HTTP_403_FORBIDDEN)
        
        # Get transit info data
        watcher_name = request.data.get('watcher_name')
        watcher_age = request.data.get('watcher_age')
        relation_to_patient = request.data.get('relation_to_patient')
        contact_number = request.data.get('contact_number')
        escort_nurse = request.data.get('escort_nurse', '')
        driver = request.data.get('driver', '')
        referring_md = request.data.get('referring_md', '')
        latest_vs = request.data.get('latest_vs', '')
        gcs = request.data.get('gcs', '')
        time_ambulance_left = request.data.get('time_ambulance_left')
        remarks = request.data.get('remarks', '')
        
        # Validate required fields
        if not all([watcher_name, watcher_age, relation_to_patient, contact_number]):
            return Response({
                'error': 'Watcher name, age, relation, and contact number are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create or update transit info
        transit_info, created = TransitInfo.objects.update_or_create(
            referral=referral,
            defaults={
                'watcher_name': watcher_name,
                'watcher_age': watcher_age,
                'relation_to_patient': relation_to_patient,
                'contact_number': contact_number,
                'escort_nurse': escort_nurse,
                'driver': driver,
                'referring_md': referring_md,
                'latest_vs': latest_vs,
                'gcs': gcs,
                'time_ambulance_left': time_ambulance_left if time_ambulance_left else None,
                'remarks': remarks,
            }
        )
        
        # Update referral status to in_transit only if it was dispositioned
        old_status = referral.status
        if referral.status == 'dispositioned':
            referral.status = 'in_transit'
            referral.save()
            
            # Create status history
            ReferralStatusHistory.objects.create(
                referral=referral,
                old_status=old_status,
                new_status='in_transit',
                changed_by=request.user,
                notes='Transit information filled by referrer'
            )
        
        action_message = 'created' if created else 'updated'
        return Response({
            'message': f'Transit information {action_message} successfully',
            'referral_status': referral.status
        })
    
    @action(detail=False, methods=['get'])
    def triage_referrals(self, request):
        """Get all referrals in triage tab"""
        # Check if user has permission
        if not hasattr(request.user, 'profile') or not request.user.profile.can_triage_referrals:
            return Response({
                'error': 'You do not have permission to view triage referrals'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get filter parameters
        status_filter = request.query_params.get('status')
        
        # Base queryset - all referrals in triage
        queryset = Referral.objects.filter(in_triage=True).select_related(
            'specialty_needed', 'referring_hospital', 'created_by', 'assigned_to',
            'transferred_by', 'triaged_by'
        ).prefetch_related('department_acceptances')
        
        # Apply status filter if provided
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Order by most recent first
        queryset = queryset.order_by('-created_at')
        
        # Serialize
        serializer = ReferralListSerializer(queryset, many=True)
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def change_department(self, request, pk=None):
        """Change department assignment (Triage user action)"""
        referral = self.get_object()
        
        # Check if user has permission to triage referrals
        if not hasattr(request.user, 'profile') or not request.user.profile.can_triage_referrals:
            return Response({
                'error': 'You do not have permission to change department assignments'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Only allow changing department for waiting referrals
        if referral.status != 'waiting':
            return Response({
                'error': 'Can only change department for referrals in waiting status'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get new department from request data
        new_department = request.data.get('department')
        if not new_department:
            return Response({
                'error': 'Department selection is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate department choice
        valid_departments = [choice[0] for choice in Referral.DEPARTMENT_CHOICES]
        if new_department not in valid_departments:
            return Response({
                'error': 'Invalid department selection'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Store old department for history
        old_department = referral.assigned_department
        old_department_display = dict(Referral.DEPARTMENT_CHOICES).get(old_department, old_department) if old_department else 'Unassigned'
        
        # Update department assignment
        referral.assigned_department = new_department
        referral.save()
        
        # Get new department display name
        new_department_display = dict(Referral.DEPARTMENT_CHOICES).get(new_department, new_department)
        
        # Create status history record
        ReferralStatusHistory.objects.create(
            referral=referral,
            old_status=referral.status,
            new_status=referral.status,  # Status stays the same, only department changes
            changed_by=request.user,
            notes=f'Department assignment changed from {old_department_display} to {new_department_display}'
        )
        
        return Response({
            'message': f'Department assignment successfully changed to {new_department_display}',
            'assigned_department': new_department,
            'department_display': new_department_display,
            'old_department': old_department,
            'old_department_display': old_department_display
        })
    
    @action(detail=True, methods=['post'])
    def accept_with_triage_decision(self, request, pk=None):
        """Accept referral with triage decision (Triage user action)"""
        try:
            referral = self.get_object()
            
            # Check if user has permission to triage referrals
            if not hasattr(request.user, 'profile') or not request.user.profile.can_triage_referrals:
                return Response({
                    'error': 'You do not have permission to make triage decisions'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Only allow triage decisions for waiting referrals
            if referral.status != 'waiting':
                return Response({
                    'error': 'Can only make triage decisions for referrals in waiting status'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get triage decision from request data
            triage_decision = request.data.get('triage_decision')
            triage_notes = request.data.get('triage_notes', '')
            scheduled_date = request.data.get('scheduled_date')
            scheduled_time = request.data.get('scheduled_time')
            assigned_departments = request.data.get('assigned_departments', [])
            
            if not triage_decision:
                return Response({
                    'error': 'Triage decision is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate assigned departments
            if not assigned_departments or len(assigned_departments) == 0:
                return Response({
                    'error': 'At least one department must be selected'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate triage decision
            valid_decisions = [choice[0] for choice in Referral.TRIAGE_DECISION_CHOICES]
            if triage_decision not in valid_decisions:
                return Response({
                    'error': 'Invalid triage decision'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate scheduled date/time for schedule_opd
            if triage_decision == 'schedule_opd':
                if not scheduled_date or not scheduled_time:
                    return Response({
                        'error': 'Scheduled date and time are required for OPD appointments'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Validate date is not in the past
                from datetime import datetime
                try:
                    # Create a naive datetime first
                    scheduled_datetime_naive = datetime.combine(
                        datetime.strptime(scheduled_date, '%Y-%m-%d').date(),
                        datetime.strptime(scheduled_time, '%H:%M').time()
                    )
                    # Make it timezone-aware using the current timezone
                    scheduled_datetime = timezone.make_aware(scheduled_datetime_naive)
                    
                    if scheduled_datetime < timezone.now():
                        return Response({
                            'error': 'Cannot schedule appointments in the past'
                        }, status=status.HTTP_400_BAD_REQUEST)
                except ValueError as e:
                    return Response({
                        'error': f'Invalid date or time format: {str(e)}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update referral with triage decision
            old_status = referral.status
            referral.triage_decision = triage_decision
            referral.triage_notes = triage_notes
            referral.triaged_by = request.user
            referral.triaged_at = timezone.now()
            referral.assigned_departments = assigned_departments
            
            # Set status based on triage decision
            if triage_decision == 'emergent':
                referral.status = 'emergent'
                referral.is_emergent = True
            elif triage_decision == 'urgent':
                referral.status = 'urgent'
                referral.is_urgent = True
            elif triage_decision == 'schedule_opd':
                referral.status = 'schedule_opd'
                referral.scheduled_date = scheduled_date
                referral.scheduled_time = scheduled_time
            
            referral.save()
            
            # Create status history record
            decision_display = dict(Referral.TRIAGE_DECISION_CHOICES).get(triage_decision, triage_decision)
            
            # Get department names for history
            dept_names = []
            for dept_code in assigned_departments:
                dept_display = dict(Referral.DEPARTMENT_CHOICES).get(dept_code, dept_code)
                dept_names.append(dept_display)
            
            history_notes = f'Triage decision: {decision_display}. Assigned to: {", ".join(dept_names)}'
            if triage_notes:
                history_notes += f'. Remarks: {triage_notes}'
            if triage_decision == 'schedule_opd':
                history_notes += f'. Scheduled for {scheduled_date} at {scheduled_time}'
                
            ReferralStatusHistory.objects.create(
                referral=referral,
                old_status=old_status,
                new_status=referral.status,
                changed_by=request.user,
                notes=history_notes
            )
            
            # Prepare response data
            response_data = {
                'message': f'Referral accepted with triage decision: {decision_display}',
                'triage_decision': triage_decision,
                'new_status': referral.status,
                'triaged_by': request.user.get_full_name(),
                'triaged_at': referral.triaged_at,
                'assigned_departments': assigned_departments
            }
            
            if triage_decision == 'schedule_opd':
                response_data['scheduled_date'] = referral.scheduled_date
                response_data['scheduled_time'] = referral.scheduled_time
            
            return Response(response_data)
        except Exception as e:
            import traceback
            print(f"Error in accept_with_triage_decision: {str(e)}")
            print(traceback.format_exc())
            return Response({
                'error': f'Internal server error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get dashboard statistics"""
        from django.utils import timezone
        from datetime import timedelta, date
        
        # Get today's date range
        today = timezone.now().date()
        today_start = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
        today_end = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.max.time()))
        
        # Get yesterday's date range
        yesterday = today - timedelta(days=1)
        yesterday_start = timezone.make_aware(timezone.datetime.combine(yesterday, timezone.datetime.min.time()))
        yesterday_end = timezone.make_aware(timezone.datetime.combine(yesterday, timezone.datetime.max.time()))
        
        # Today's stats
        total_referrals_today = Referral.objects.filter(
            created_at__gte=today_start,
            created_at__lte=today_end
        ).count()
        
        # Yesterday's stats
        total_referrals_yesterday = Referral.objects.filter(
            created_at__gte=yesterday_start,
            created_at__lte=yesterday_end
        ).count()
        
        # Pending and critical cases
        pending_referrals = Referral.objects.filter(status='pending').count()
        critical_referrals = Referral.objects.filter(priority='critical').count()
        
        # Completed today
        completed_today = Referral.objects.filter(
            status='completed',
            updated_at__gte=today_start,
            updated_at__lte=today_end
        ).count()
        
        # Completed yesterday
        completed_yesterday = Referral.objects.filter(
            status='completed',
            updated_at__gte=yesterday_start,
            updated_at__lte=yesterday_end
        ).count()
        
        # Total unique patients
        total_patients = Referral.objects.values('patient_full_name').distinct().count()
        
        # Other stats
        in_transit_referrals = Referral.objects.filter(status='in_transit').count()
        urgent_referrals = Referral.objects.filter(is_urgent=True).count()
        emergent_referrals = Referral.objects.filter(status='emergent').count()
        urgent_triage_referrals = Referral.objects.filter(status='urgent').count()
        scheduled_opd_referrals = Referral.objects.filter(status='schedule_opd').count()
        
        return Response({
            'total_referrals': Referral.objects.count(),
            'total_referrals_today': total_referrals_today,
            'total_referrals_yesterday': total_referrals_yesterday,
            'pending_referrals': pending_referrals,
            'critical_referrals': critical_referrals,
            'completed_today': completed_today,
            'completed_yesterday': completed_yesterday,
            'total_patients': total_patients,
            'in_transit_referrals': in_transit_referrals,
            'urgent_referrals': urgent_referrals,
            'emergent_referrals': emergent_referrals,
            'urgent_triage_referrals': urgent_triage_referrals,
            'scheduled_opd_referrals': scheduled_opd_referrals,
        })
    
    @action(detail=False, methods=['get'])
    def my_referrals(self, request):
        """Get referrals assigned to current user"""
        queryset = self.get_queryset().filter(assigned_to=request.user)
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = ReferralListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ReferralListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_submitted_referrals(self, request):
        """Get referrals submitted by current user (for referrers)"""
        queryset = self.get_queryset().filter(created_by=request.user)
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = ReferralListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ReferralListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def patients(self, request):
        """Get unique patients from referrals"""
        # Get unique patients with their latest referral info
        patients_data = []
        
        # Get unique patient names with their most recent referral
        unique_patients = Referral.objects.values('patient_full_name').annotate(
            latest_referral=Max('created_at'),
            total_referrals=Count('id')
        ).order_by('-latest_referral')
        
        for patient_info in unique_patients:
            # Get the latest referral for this patient
            latest_referral = Referral.objects.filter(
                patient_full_name=patient_info['patient_full_name']
            ).order_by('-created_at').first()
            
            if latest_referral:
                patients_data.append({
                    'patient_full_name': patient_info['patient_full_name'],
                    'age': latest_referral.age,
                    'gender': latest_referral.gender,
                    'hrn': latest_referral.hrn,
                    'patient_category': latest_referral.patient_category,
                    'current_address': latest_referral.current_address,
                    'birthday': latest_referral.birthday,
                    'total_referrals': patient_info['total_referrals'],
                    'latest_referral_date': latest_referral.created_at,
                    'latest_referral_id': latest_referral.referral_id,
                    'latest_status': latest_referral.status,
                    'latest_specialty': latest_referral.specialty_needed.name if latest_referral.specialty_needed else None,
                    'latest_hospital': latest_referral.referring_hospital.name if latest_referral.referring_hospital else None,
                })
        
        # Paginate the results
        page = self.paginate_queryset(patients_data)
        if page is not None:
            return self.get_paginated_response(page)
        
        return Response(patients_data)
    
    @action(detail=False, methods=['get'])
    def patient_history(self, request):
        """Get referral history for a specific patient"""
        patient_name = request.query_params.get('patient_name')
        if not patient_name:
            return Response({'error': 'patient_name parameter is required'}, status=400)
        
        referrals = Referral.objects.filter(
            patient_full_name=patient_name
        ).select_related('specialty_needed', 'referring_hospital').order_by('-created_at')
        
        serializer = ReferralListSerializer(referrals, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def reports_analytics(self, request):
        """Get comprehensive reports and analytics data"""
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models import Count, Q
        
        # Basic counts
        total_referrals = Referral.objects.count()
        successful_referrals = Referral.objects.filter(status='completed').count()
        pending_referrals = Referral.objects.filter(status='pending').count()
        cancelled_referrals = Referral.objects.filter(status='cancelled').count()
        
        # Calculate success rate
        success_rate = (successful_referrals / total_referrals * 100) if total_referrals > 0 else 0
        cancellation_rate = (cancelled_referrals / total_referrals * 100) if total_referrals > 0 else 0
        
        # Monthly trends (last 6 months)
        monthly_data = []
        for i in range(6):
            month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            month_referrals = Referral.objects.filter(
                created_at__date__gte=month_start.date(),
                created_at__date__lte=month_end.date()
            ).count()
            
            monthly_data.append({
                'month': month_start.strftime('%B %Y'),
                'count': month_referrals
            })
        
        monthly_data.reverse()  # Show oldest to newest
        
        # Top referring hospitals
        top_hospitals = ReferringHospital.objects.annotate(
            referral_count=Count('referral')
        ).filter(referral_count__gt=0).order_by('-referral_count')[:5]
        
        hospital_data = []
        for hospital in top_hospitals:
            percentage = (hospital.referral_count / total_referrals * 100) if total_referrals > 0 else 0
            hospital_data.append({
                'name': hospital.name,
                'count': hospital.referral_count,
                'percentage': round(percentage, 1)
            })
        
        # Status distribution
        status_distribution = Referral.objects.values('status').annotate(
            count=Count('status')
        ).order_by('-count')
        
        # Priority distribution
        priority_distribution = Referral.objects.values('priority').annotate(
            count=Count('priority')
        ).order_by('-count')
        
        # Specialty distribution
        specialty_distribution = Specialty.objects.annotate(
            referral_count=Count('referral')
        ).filter(referral_count__gt=0).order_by('-referral_count')[:10]
        
        specialty_data = []
        for specialty in specialty_distribution:
            specialty_data.append({
                'name': specialty.name,
                'count': specialty.referral_count
            })
        
        # Recent activity (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        recent_referrals = Referral.objects.filter(created_at__gte=week_ago).count()
        
        # Average processing time (for completed referrals)
        completed_referrals = Referral.objects.filter(status='completed')
        avg_processing_time = 0
        if completed_referrals.exists():
            total_time = sum([
                (ref.updated_at - ref.created_at).total_seconds() / 3600  # Convert to hours
                for ref in completed_referrals
            ])
            avg_processing_time = total_time / completed_referrals.count()
        
        return Response({
            'summary': {
                'total_referrals': total_referrals,
                'successful_referrals': successful_referrals,
                'pending_referrals': pending_referrals,
                'cancelled_referrals': cancelled_referrals,
                'success_rate': round(success_rate, 1),
                'cancellation_rate': round(cancellation_rate, 1),
                'recent_referrals': recent_referrals,
                'avg_processing_time_hours': round(avg_processing_time, 1)
            },
            'monthly_trends': monthly_data,
            'top_hospitals': hospital_data,
            'status_distribution': list(status_distribution),
            'priority_distribution': list(priority_distribution),
            'specialty_distribution': specialty_data
        })

    @action(detail=False, methods=['get'])
    def referrals_by_time_period(self, request):
        """Get referrals data by time period (week, month, year)"""
        from django.utils import timezone
        from datetime import timedelta, datetime
        from django.db.models import Count
        
        time_filter = request.query_params.get('filter', 'month')  # week, month, year
        year = request.query_params.get('year', timezone.now().year)
        
        try:
            year = int(year)
        except (ValueError, TypeError):
            year = timezone.now().year
        
        data = []
        
        if time_filter == 'week':
            month = request.query_params.get('month')
            
            if month:
                # Filter weeks within a specific month
                try:
                    month = int(month)
                    if 1 <= month <= 12:
                        # Get all weeks within the specified month and year
                        month_start = datetime(year, month, 1).date()
                        # Get last day of month
                        if month == 12:
                            month_end = datetime(year + 1, 1, 1).date() - timedelta(days=1)
                        else:
                            month_end = datetime(year, month + 1, 1).date() - timedelta(days=1)
                        
                        # Find all weeks that overlap with this month
                        current_date = month_start
                        week_number = 1
                        
                        while current_date <= month_end:
                            # Find the start of the week (Monday)
                            week_start = current_date - timedelta(days=current_date.weekday())
                            week_end = week_start + timedelta(days=6)
                            
                            # Only include weeks that have at least one day in the target month
                            if week_end >= month_start and week_start <= month_end:
                                # Clip the week to the month boundaries for counting
                                count_start = max(week_start, month_start)
                                count_end = min(week_end, month_end)
                                
                                count = Referral.objects.filter(
                                    created_at__date__gte=count_start,
                                    created_at__date__lte=count_end
                                ).count()
                                
                                data.append({
                                    'period': f'Week {week_number}',
                                    'full_period': f'{week_start.strftime("%m/%d")} - {week_end.strftime("%m/%d")}',
                                    'count': count,
                                    'start_date': week_start.isoformat(),
                                    'end_date': week_end.isoformat()
                                })
                                week_number += 1
                            
                            # Move to next week
                            current_date = week_end + timedelta(days=1)
                            
                            # Safety check to prevent infinite loop
                            if current_date > month_end + timedelta(days=7):
                                break
                    else:
                        # Invalid month, fall back to last 12 weeks
                        month = None
                except (ValueError, TypeError):
                    month = None
            
            if not month:
                # Original logic: Get last 12 weeks for the specified year
                start_of_year = datetime(year, 1, 1)
                end_of_year = datetime(year, 12, 31)
                
                # Get current date or end of specified year if in the past
                current_date = min(timezone.now().date(), end_of_year.date())
                
                for i in range(11, -1, -1):  # Last 12 weeks
                    week_start = current_date - timedelta(days=current_date.weekday() + (i * 7))
                    week_end = week_start + timedelta(days=6)
                    
                    # Ensure we don't go beyond the year boundaries
                    week_start = max(week_start, start_of_year.date())
                    week_end = min(week_end, end_of_year.date())
                    
                    count = Referral.objects.filter(
                        created_at__date__gte=week_start,
                        created_at__date__lte=week_end
                    ).count()
                    
                    data.append({
                        'period': f'Week {12 - i}',
                        'full_period': f'{week_start.strftime("%m/%d")} - {week_end.strftime("%m/%d")}',
                        'count': count,
                        'start_date': week_start.isoformat(),
                        'end_date': week_end.isoformat()
                    })
        
        elif time_filter == 'month':
            # Get 12 months for the specified year
            months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            
            for month in range(1, 13):
                try:
                    month_start = datetime(year, month, 1).date()
                    # Get last day of month
                    if month == 12:
                        month_end = datetime(year + 1, 1, 1).date() - timedelta(days=1)
                    else:
                        month_end = datetime(year, month + 1, 1).date() - timedelta(days=1)
                    
                    count = Referral.objects.filter(
                        created_at__date__gte=month_start,
                        created_at__date__lte=month_end
                    ).count()
                    
                    data.append({
                        'period': f'{months[month-1]} {year}',
                        'full_period': f'{months[month-1]} {year}',
                        'count': count,
                        'start_date': month_start.isoformat(),
                        'end_date': month_end.isoformat()
                    })
                except ValueError:
                    # Handle invalid dates
                    continue
        
        else:  # year
            # Get last 5 years
            current_year = timezone.now().year
            for i in range(4, -1, -1):
                target_year = current_year - i
                year_start = datetime(target_year, 1, 1).date()
                year_end = datetime(target_year, 12, 31).date()
                
                count = Referral.objects.filter(
                    created_at__date__gte=year_start,
                    created_at__date__lte=year_end
                ).count()
                
                data.append({
                    'period': str(target_year),
                    'full_period': str(target_year),
                    'count': count,
                    'start_date': year_start.isoformat(),
                    'end_date': year_end.isoformat()
                })
        
        return Response(data)

    @action(detail=False, methods=['get'])
    def department_analytics(self, request):
        """Get referrals by department (for pie chart)"""
        from django.db.models import Count
        
        # Get referrals by assigned department
        department_data = Referral.objects.filter(
            assigned_department__isnull=False
        ).values('assigned_department').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Convert to display format with colors
        colors = [
            '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
            '#ec4899', '#06b6d4', '#6b7280', '#84cc16', '#f97316'
        ]
        
        result = []
        total_count = sum(item['count'] for item in department_data)
        
        for i, item in enumerate(department_data):
            # Get department display name
            department_display = dict(Referral.DEPARTMENT_CHOICES).get(
                item['assigned_department'], 
                item['assigned_department']
            )
            
            result.append({
                'name': department_display,
                'count': item['count'],
                'color': colors[i % len(colors)],
                'percentage': round((item['count'] / total_count * 100), 1) if total_count > 0 else 0
            })
        
        # Add "Unassigned" category if there are referrals without department
        unassigned_count = Referral.objects.filter(assigned_department__isnull=True).count()
        if unassigned_count > 0:
            total_with_unassigned = total_count + unassigned_count
            result.append({
                'name': 'Unassigned',
                'count': unassigned_count,
                'color': '#9ca3af',
                'percentage': round((unassigned_count / total_with_unassigned * 100), 1)
            })
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def top_hospitals(self, request):
        """Get top referring hospitals with filtering"""
        from django.db.models import Count
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        time_filter = request.query_params.get('filter', 'month')
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', 0))
        week = int(request.query_params.get('week', 0))
        
        # Base queryset
        queryset = Referral.objects.all()
        
        # Apply time filters
        if time_filter == 'year':
            year_start = datetime(year, 1, 1).date()
            year_end = datetime(year, 12, 31).date()
            queryset = queryset.filter(created_at__date__gte=year_start, created_at__date__lte=year_end)
        elif time_filter == 'month':
            if month > 0:
                month_start = datetime(year, month, 1).date()
                if month == 12:
                    month_end = datetime(year + 1, 1, 1).date() - timedelta(days=1)
                else:
                    month_end = datetime(year, month + 1, 1).date() - timedelta(days=1)
                queryset = queryset.filter(created_at__date__gte=month_start, created_at__date__lte=month_end)
        elif time_filter == 'week':
            if month > 0:
                # Filter weeks within a specific month
                month_start = datetime(year, month, 1).date()
                # Get last day of month
                if month == 12:
                    month_end = datetime(year + 1, 1, 1).date() - timedelta(days=1)
                else:
                    month_end = datetime(year, month + 1, 1).date() - timedelta(days=1)
                
                queryset = queryset.filter(created_at__date__gte=month_start, created_at__date__lte=month_end)
            elif week > 0:
                # Original week logic
                year_start = datetime(year, 1, 1).date()
                week_start = year_start + timedelta(weeks=week-1)
                week_end = week_start + timedelta(days=6)
                queryset = queryset.filter(created_at__date__gte=week_start, created_at__date__lte=week_end)
        
        # Get hospital counts
        hospital_data = queryset.values('referring_hospital__name').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        total = queryset.count()
        result = []
        for item in hospital_data:
            if item['referring_hospital__name']:
                result.append({
                    'name': item['referring_hospital__name'],
                    'count': item['count'],
                    'percentage': round((item['count'] / total * 100), 1) if total > 0 else 0
                })
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def top_departments(self, request):
        """Get top departments with filtering"""
        from django.db.models import Count
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        time_filter = request.query_params.get('filter', 'month')
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', 0))
        week = int(request.query_params.get('week', 0))
        
        # Base queryset
        queryset = Referral.objects.filter(assigned_department__isnull=False)
        
        # Apply time filters
        if time_filter == 'year':
            year_start = datetime(year, 1, 1).date()
            year_end = datetime(year, 12, 31).date()
            queryset = queryset.filter(created_at__date__gte=year_start, created_at__date__lte=year_end)
        elif time_filter == 'month':
            if month > 0:
                month_start = datetime(year, month, 1).date()
                if month == 12:
                    month_end = datetime(year + 1, 1, 1).date() - timedelta(days=1)
                else:
                    month_end = datetime(year, month + 1, 1).date() - timedelta(days=1)
                queryset = queryset.filter(created_at__date__gte=month_start, created_at__date__lte=month_end)
        elif time_filter == 'week' and week > 0:
            year_start = datetime(year, 1, 1).date()
            week_start = year_start + timedelta(weeks=week-1)
            week_end = week_start + timedelta(days=6)
            queryset = queryset.filter(created_at__date__gte=week_start, created_at__date__lte=week_end)
        
        # Get department counts
        department_data = queryset.values('assigned_department').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Colors for pie chart
        colors = [
            '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
            '#ec4899', '#06b6d4', '#6b7280', '#84cc16', '#f97316'
        ]
        
        result = []
        for i, item in enumerate(department_data):
            dept_display = dict(Referral.DEPARTMENT_CHOICES).get(
                item['assigned_department'], 
                item['assigned_department']
            )
            result.append({
                'department': item['assigned_department'],
                'name': dept_display,
                'count': item['count'],
                'color': colors[i % len(colors)]
            })
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def top_specialties(self, request):
        """Get top specialties with filtering"""
        from django.db.models import Count
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        time_filter = request.query_params.get('filter', 'month')
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', 0))
        week = int(request.query_params.get('week', 0))
        
        # Base queryset
        queryset = Referral.objects.all()
        
        # Apply time filters
        if time_filter == 'year':
            year_start = datetime(year, 1, 1).date()
            year_end = datetime(year, 12, 31).date()
            queryset = queryset.filter(created_at__date__gte=year_start, created_at__date__lte=year_end)
        elif time_filter == 'month':
            if month > 0:
                month_start = datetime(year, month, 1).date()
                if month == 12:
                    month_end = datetime(year + 1, 1, 1).date() - timedelta(days=1)
                else:
                    month_end = datetime(year, month + 1, 1).date() - timedelta(days=1)
                queryset = queryset.filter(created_at__date__gte=month_start, created_at__date__lte=month_end)
        elif time_filter == 'week':
            if month > 0:
                # Filter weeks within a specific month
                month_start = datetime(year, month, 1).date()
                # Get last day of month
                if month == 12:
                    month_end = datetime(year + 1, 1, 1).date() - timedelta(days=1)
                else:
                    month_end = datetime(year, month + 1, 1).date() - timedelta(days=1)
                
                queryset = queryset.filter(created_at__date__gte=month_start, created_at__date__lte=month_end)
            elif week > 0:
                # Original week logic
                year_start = datetime(year, 1, 1).date()
                week_start = year_start + timedelta(weeks=week-1)
                week_end = week_start + timedelta(days=6)
                queryset = queryset.filter(created_at__date__gte=week_start, created_at__date__lte=week_end)
        
        # Get specialty counts
        specialty_data = queryset.values('specialty_needed__name').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        result = []
        for item in specialty_data:
            if item['specialty_needed__name']:
                result.append({
                    'name': item['specialty_needed__name'],
                    'count': item['count']
                })
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def coordinated_referrals(self, request):
        """Get coordinated referrals (completed/received) with filtering"""
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        time_filter = request.query_params.get('filter', 'month')
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', 0))
        week = int(request.query_params.get('week', 0))
        
        # Base queryset - coordinated means completed or received
        queryset = Referral.objects.filter(status__in=['completed', 'received', 'in_transit'])
        
        # Apply time filters
        if time_filter == 'year':
            year_start = datetime(year, 1, 1).date()
            year_end = datetime(year, 12, 31).date()
            queryset = queryset.filter(created_at__date__gte=year_start, created_at__date__lte=year_end)
        elif time_filter == 'month':
            if month > 0:
                month_start = datetime(year, month, 1).date()
                if month == 12:
                    month_end = datetime(year + 1, 1, 1).date() - timedelta(days=1)
                else:
                    month_end = datetime(year, month + 1, 1).date() - timedelta(days=1)
                queryset = queryset.filter(created_at__date__gte=month_start, created_at__date__lte=month_end)
        elif time_filter == 'week' and week > 0:
            year_start = datetime(year, 1, 1).date()
            week_start = year_start + timedelta(weeks=week-1)
            week_end = week_start + timedelta(days=6)
            queryset = queryset.filter(created_at__date__gte=week_start, created_at__date__lte=week_end)
        
        # Get referral data
        result = []
        for ref in queryset.order_by('-created_at')[:100]:
            result.append({
                'referral_id': ref.referral_id,
                'patient_name': ref.patient_full_name,
                'specialty': ref.specialty_needed.name if ref.specialty_needed else 'N/A',
                'department': dict(Referral.DEPARTMENT_CHOICES).get(ref.assigned_department, ref.assigned_department) if ref.assigned_department else 'N/A',
                'status': ref.status,
                'date_received': ref.created_at.strftime('%Y-%m-%d')
            })
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def uncoordinated_referrals(self, request):
        """Get uncoordinated referrals (cancelled) with filtering"""
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        time_filter = request.query_params.get('filter', 'month')
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', 0))
        week = int(request.query_params.get('week', 0))
        
        # Base queryset - uncoordinated means cancelled
        queryset = Referral.objects.filter(status='cancelled')
        
        # Apply time filters
        if time_filter == 'year':
            year_start = datetime(year, 1, 1).date()
            year_end = datetime(year, 12, 31).date()
            queryset = queryset.filter(created_at__date__gte=year_start, created_at__date__lte=year_end)
        elif time_filter == 'month':
            if month > 0:
                month_start = datetime(year, month, 1).date()
                if month == 12:
                    month_end = datetime(year + 1, 1, 1).date() - timedelta(days=1)
                else:
                    month_end = datetime(year, month + 1, 1).date() - timedelta(days=1)
                queryset = queryset.filter(created_at__date__gte=month_start, created_at__date__lte=month_end)
        elif time_filter == 'week' and week > 0:
            year_start = datetime(year, 1, 1).date()
            week_start = year_start + timedelta(weeks=week-1)
            week_end = week_start + timedelta(days=6)
            queryset = queryset.filter(created_at__date__gte=week_start, created_at__date__lte=week_end)
        
        # Get referral data
        def extract_cancellation_reason(referral):
            cancelled_history = referral.status_history.filter(new_status='cancelled').first()
            if not cancelled_history or not cancelled_history.notes:
                return 'No reason provided'

            notes = cancelled_history.notes.strip()
            if 'Reason:' in notes:
                return notes.split('Reason:', 1)[1].strip() or 'No reason provided'
            if 'Cancelled by referrer:' in notes:
                return notes.split('Cancelled by referrer:', 1)[1].strip() or 'No reason provided'
            return notes

        result = []
        for ref in queryset.order_by('-updated_at')[:100]:
            result.append({
                'referral_id': ref.referral_id,
                'patient_name': ref.patient_full_name,
                'reason': extract_cancellation_reason(ref),
                'specialty': ref.specialty_needed.name if ref.specialty_needed else 'N/A',
                'date_cancelled': ref.updated_at.strftime('%Y-%m-%d')
            })
        
        return Response(result)

    @action(detail=True, methods=['get'])
    def fraud_flags(self, request, pk=None):
        """Get fraud risk flags and audit entries for EDCC/EDMA review."""
        referral = self.get_object()

        if not self._can_manage_fraud_review(request.user):
            return Response({
                'error': 'You do not have permission to view fraud review details.'
            }, status=status.HTTP_403_FORBIDDEN)

        audit_qs = referral.fraud_audit_logs.select_related('acted_by').all()[:20]
        audit_data = ReferralFraudAuditLogSerializer(audit_qs, many=True).data

        return Response({
            'referral_id': referral.referral_id,
            'risk_score': referral.fraud_risk_score,
            'risk_level': referral.fraud_risk_level,
            'requires_manual_review': referral.fraud_requires_manual_review,
            'flags': referral.fraud_risk_flags or [],
            'last_evaluated_at': referral.fraud_last_evaluated_at,
            'audit_trail': audit_data,
        })

    @action(detail=True, methods=['post'])
    def review_fraud(self, request, pk=None):
        """Manual fraud review actions: mark_safe, keep_flagged, suspend_referrer."""
        referral = self.get_object()

        if not self._can_manage_fraud_review(request.user):
            return Response({
                'error': 'You do not have permission to perform fraud review actions.'
            }, status=status.HTTP_403_FORBIDDEN)

        review_action = (request.data.get('action') or '').strip().lower()
        notes = (request.data.get('notes') or '').strip()
        try:
            suspension_days = int(request.data.get('suspension_days') or 7)
        except (TypeError, ValueError):
            return Response({
                'error': 'suspension_days must be a valid integer.'
            }, status=status.HTTP_400_BAD_REQUEST)

        if review_action not in ['mark_safe', 'keep_flagged', 'suspend_referrer']:
            return Response({
                'error': "Invalid action. Use 'mark_safe', 'keep_flagged', or 'suspend_referrer'."
            }, status=status.HTTP_400_BAD_REQUEST)

        previous_risk_level = referral.fraud_risk_level
        previous_manual_review = referral.fraud_requires_manual_review
        action_note = notes

        if review_action == 'mark_safe':
            referral.fraud_requires_manual_review = False
            referral.fraud_risk_level = 'low'
            referral.fraud_risk_score = min(referral.fraud_risk_score, 15)
            action_note = notes or 'Marked safe by reviewer.'

        elif review_action == 'keep_flagged':
            referral.fraud_requires_manual_review = True
            if referral.fraud_risk_level == 'low':
                referral.fraud_risk_level = 'medium'
            action_note = notes or 'Fraud/spam flag retained after manual review.'

        elif review_action == 'suspend_referrer':
            creator_profile = getattr(referral.created_by, 'profile', None)
            if not creator_profile or creator_profile.role != 'referrer':
                return Response({
                    'error': 'Referral creator is not a referrer account and cannot be suspended.'
                }, status=status.HTTP_400_BAD_REQUEST)
            creator_profile.is_referrer_suspended = True
            creator_profile.referrer_suspended_until = timezone.now() + timedelta(days=max(1, suspension_days))
            creator_profile.referrer_suspension_reason = notes or 'Suspended due to fraud/spam review action.'
            creator_profile.save(update_fields=[
                'is_referrer_suspended',
                'referrer_suspended_until',
                'referrer_suspension_reason',
            ])
            referral.fraud_requires_manual_review = True
            referral.fraud_risk_level = 'high'
            referral.fraud_risk_score = max(referral.fraud_risk_score, 80)
            action_note = notes or f'Referrer suspended for {max(1, suspension_days)} day(s).'

        referral.fraud_last_evaluated_at = timezone.now()
        referral.save(update_fields=[
            'fraud_risk_score',
            'fraud_risk_level',
            'fraud_requires_manual_review',
            'fraud_last_evaluated_at',
        ])

        ReferralFraudAuditLog.objects.create(
            referral=referral,
            action=review_action,
            previous_risk_level=previous_risk_level,
            new_risk_level=referral.fraud_risk_level,
            previous_requires_manual_review=previous_manual_review,
            new_requires_manual_review=referral.fraud_requires_manual_review,
            risk_score=referral.fraud_risk_score,
            flags_snapshot=referral.fraud_risk_flags or [],
            notes=action_note,
            acted_by=request.user,
        )

        ReferralStatusHistory.objects.create(
            referral=referral,
            old_status=referral.status,
            new_status=referral.status,
            changed_by=request.user,
            notes=f"Fraud review action '{review_action}' performed. {action_note}",
        )

        return Response({
            'message': 'Fraud review action applied successfully.',
            'action': review_action,
            'risk_level': referral.fraud_risk_level,
            'risk_score': referral.fraud_risk_score,
            'requires_manual_review': referral.fraud_requires_manual_review,
        })

    @action(detail=True, methods=['post'])
    def delay_transfer(self, request, pk=None):
        """Notify EDCC/Triage that transfer is delayed"""
        referral = self.get_object()
        
        # Check if referral is dispositioned (ready for transit)
        if referral.status != 'dispositioned':
            return Response({
                'error': 'Can only delay transfer for dispositioned referrals'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user is the referrer
        if referral.created_by != request.user:
            return Response({
                'error': 'Only the referrer can delay transfer'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get delay reason from request
        delay_reason = request.data.get('delay_reason', 'Transfer delayed by referrer')
        
        # Update referral with delay notification info
        referral.delay_notified_at = timezone.now()
        referral.delay_reason = delay_reason
        referral.save()
        
        # Create status history to track the delay notification
        ReferralStatusHistory.objects.create(
            referral=referral,
            old_status='dispositioned',
            new_status='dispositioned',  # Status stays the same
            changed_by=request.user,
            notes=f'Transfer delayed: {delay_reason}'
        )
        
        return Response({
            'message': 'EDCC/Triage staff have been notified of the delayed transfer',
            'referral_status': referral.status,
            'delay_reason': delay_reason
        })

class TransitInfoViewSet(viewsets.ModelViewSet):
    queryset = TransitInfo.objects.select_related('referral')
    serializer_class = TransitInfoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['referral__referral_id', 'watcher_name', 'escort_nurse']
    filterset_fields = ['referral']


class ReferrerAccountViewSet(viewsets.ModelViewSet):
    """Manage referrer profiles and allow public registration"""
    queryset = ReferrerAccount.objects.select_related('user').prefetch_related('specialties', 'affiliate_hospitals', 'documents')
    serializer_class = ReferrerAccountSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['first_name', 'last_name', 'user__username']

    def _is_admin_user(self, user):
        if not user or not user.is_authenticated:
            return False
        if user.is_staff or user.is_superuser:
            return True
        profile = getattr(user, 'profile', None)
        return bool(profile and profile.role == 'admin')

    def get_permissions(self):
        # Allow anyone to create/register; other actions require authentication
        if self.action == 'create':
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [p() for p in permission_classes]

    def create(self, request, *args, **kwargs):
        # Use the registration serializer to handle user creation and file uploads
        serializer = ReferrerRegistrationSerializer(data=request.data)
        serializer.context['request'] = request
        if serializer.is_valid():
            referrer = serializer.save()
            out = ReferrerAccountSerializer(referrer, context={'request': request})
            return Response(out.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_profile(self, request):
        """Get current authenticated referrer's profile data for auto-filling forms"""
        try:
            referrer = ReferrerAccount.objects.select_related('user').prefetch_related(
                'specialties', 'affiliate_hospitals'
            ).get(user=request.user)
            
            # Get user profile for additional data
            user_profile = getattr(request.user, 'profile', None)
            
            # Format specialties as a readable string
            specialties_list = list(referrer.specialties.all())
            specialties_text = ', '.join([specialty.name for specialty in specialties_list]) if specialties_list else ''
            
            # Prepare response data for form auto-filling
            profile_data = {
                'referrer_name': f"{referrer.first_name} {referrer.last_name}".strip(),
                'referrer_profession': specialties_text or referrer.get_referrer_type_display(),  # Use specialties first, fallback to referrer type
                'referrer_cellphone': user_profile.cellphone if user_profile else '',
                'referrer_type': referrer.referrer_type,
                'affiliate_hospitals': [
                    {
                        'id': hospital.id,
                        'name': hospital.name,
                        'location': hospital.location,
                        'is_inside_davao_city': hospital.is_inside_davao_city
                    }
                    for hospital in referrer.affiliate_hospitals.all()
                ],
                'specialties': [
                    {
                        'id': specialty.id,
                        'name': specialty.name
                    }
                    for specialty in referrer.specialties.all()
                ],
                'specialties_text': specialties_text,  # Formatted string for display
                'hospital_name': user_profile.hospital_name if user_profile else '',
                'hospital_location': user_profile.hospital_location if user_profile else '',
                'is_inside_davao': user_profile.is_inside_davao if user_profile else True,
            }
            
            return Response(profile_data)
            
        except ReferrerAccount.DoesNotExist:
            return Response({
                'error': 'Referrer profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def pending_accounts(self, request):
        """Get all referrer accounts (for admin approval)"""
        if not self._is_admin_user(request.user):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Referrers are now active on registration; keep endpoint for compatibility and
        # return only legacy inactive accounts if any still exist.
        referrers = ReferrerAccount.objects.select_related('user').prefetch_related(
            'specialties', 'affiliate_hospitals'
        ).filter(user__is_active=False)
        
        data = []
        for referrer in referrers:
            user_profile = getattr(referrer.user, 'profile', None)
            data.append({
                'id': referrer.id,
                'username': referrer.user.username,
                'email': referrer.user.email,
                'first_name': referrer.first_name,
                'middle_name': referrer.middle_name,
                'last_name': referrer.last_name,
                'full_name': f"{referrer.first_name} {referrer.last_name}",
                'referrer_type': referrer.referrer_type,
                'referrer_type_display': referrer.get_referrer_type_display(),
                'age': referrer.age,
                'gender': referrer.gender,
                'address': referrer.address,
                'position': referrer.position,
                'hospital_name': user_profile.hospital_name if user_profile else '',
                'hospital_location': user_profile.hospital_location if user_profile else '',
                'cellphone': user_profile.cellphone if user_profile else '',
                'created_at': referrer.created_at.isoformat(),
                'is_active': referrer.user.is_active,
                'approval_status': 'approved' if referrer.user.is_active else 'pending',
                'specialties': [s.name for s in referrer.specialties.all()],
                'affiliate_hospitals': [h.name for h in referrer.affiliate_hospitals.all()],
            })
        
        return Response(data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        """Approve a referrer account"""
        if not self._is_admin_user(request.user):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        referrer = self.get_object()
        referrer.user.is_active = True
        referrer.user.save()
        
        return Response({'message': 'Account approved successfully'})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        """Reject a referrer account"""
        if not self._is_admin_user(request.user):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        referrer = self.get_object()
        referrer.user.is_active = False
        referrer.user.save()
        
        return Response({'message': 'Account rejected successfully'})


# Admin Dashboard Views
from rest_framework.decorators import api_view

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    """Get admin dashboard statistics"""
    # Check if user is admin
    if not request.user.is_staff:
        user_profile = getattr(request.user, 'profile', None)
        if not user_profile or user_profile.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    from django.contrib.auth.models import User
    from .models import UserProfile
    
    # Get statistics
    total_referrals = Referral.objects.count()
    pending_referrals = Referral.objects.filter(status='pending').count()
    active_referrals = Referral.objects.filter(status__in=['in_transit', 'waiting']).count()
    completed_referrals = Referral.objects.filter(status='completed').count()
    
    # Referrer statistics
    total_referrers = ReferrerAccount.objects.count()
    pending_referrers = ReferrerAccount.objects.filter(user__is_active=False).count()
    approved_referrers = ReferrerAccount.objects.filter(user__is_active=True).count()
    
    # Doctor approval statistics
    total_doctors = User.objects.filter(profile__role='doctor').count()
    pending_doctors = User.objects.filter(profile__role='doctor', is_active=False).count()

    # User statistics
    total_users = User.objects.count()
    total_hospitals = ReferringHospital.objects.count()
    total_specialties = Specialty.objects.count()
    seven_days_ago = timezone.now() - timedelta(days=7)
    recent_referrals = Referral.objects.filter(created_at__gte=seven_days_ago).count()
    recent_registrations = User.objects.filter(date_joined__gte=seven_days_ago).count()
    
    return Response({
        'total_referrals': total_referrals,
        'pending_referrals': pending_referrals,
        'active_referrals': active_referrals,
        'completed_referrals': completed_referrals,
        'total_referrers': total_referrers,
        'pending_referrers': pending_referrers,
        'approved_referrers': approved_referrers,
        'total_doctors': total_doctors,
        'pending_doctors': pending_doctors,
        'total_users': total_users,
        'total_hospitals': total_hospitals,
        'total_specialties': total_specialties,
        'recent_referrals': recent_referrals,
        'recent_registrations': recent_registrations,
    })


@api_view(['GET', 'PUT', 'POST'])
@permission_classes([IsAuthenticated])
def manage_departments(request):
    """Get all departments, update a department's contact number, or create a new department"""
    # Check if user is admin
    if not request.user.is_staff:
        user_profile = getattr(request.user, 'profile', None)
        if not user_profile or user_profile.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        # Get all departments
        departments = Department.objects.all().order_by('name')
        data = []
        for dept in departments:
            data.append({
                'id': dept.id,
                'code': dept.code,
                'name': dept.name,
                'contact_number': dept.contact_number or '',
                'is_active': dept.is_active,
            })
        return Response(data)
    
    elif request.method == 'PUT':
        # Update department contact number
        dept_id = request.data.get('id')
        contact_number = request.data.get('contact_number')
        
        if not dept_id:
            return Response({'error': 'Department ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            dept = Department.objects.get(id=dept_id)
            dept.contact_number = contact_number
            dept.save()
            
            return Response({
                'message': f'Contact number for {dept.name} updated successfully',
                'department': {
                    'id': dept.id,
                    'code': dept.code,
                    'name': dept.name,
                    'contact_number': dept.contact_number,
                    'is_active': dept.is_active,
                }
            })
        except Department.DoesNotExist:
            return Response({'error': 'Department not found'}, status=status.HTTP_404_NOT_FOUND)

    elif request.method == 'POST':
        # Create a new department
        code = request.data.get('code')
        name = request.data.get('name')
        contact_number = request.data.get('contact_number', '')

        if not code or not name:
            return Response({'error': 'Code and name are required'}, status=status.HTTP_400_BAD_REQUEST)

        if Department.objects.filter(code=code).exists():
            return Response({'error': 'A department with this code already exists'}, status=status.HTTP_400_BAD_REQUEST)

        dept = Department.objects.create(
            code=code,
            name=name,
            contact_number=contact_number,
            is_active=True,
        )
        return Response({
            'message': f'Department {dept.name} created successfully',
            'department': {
                'id': dept.id,
                'code': dept.code,
                'name': dept.name,
                'contact_number': dept.contact_number,
                'is_active': dept.is_active,
            }
        }, status=status.HTTP_201_CREATED)


    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def pending_doctors(self, request):
        """Get all pending doctor accounts (for admin approval)"""
        # Check if user is admin
        if not request.user.is_staff and (not hasattr(request.user, 'profile') or request.user.profile.role != 'admin'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get all users with doctor role
        from django.contrib.auth.models import User
        doctors = User.objects.filter(profile__role='doctor').select_related('profile')
        
        data = []
        for doctor in doctors:
            profile = doctor.profile
            data.append({
                'id': doctor.id,
                'username': doctor.username,
                'email': doctor.email,
                'first_name': doctor.first_name,
                'last_name': doctor.last_name,
                'full_name': doctor.get_full_name(),
                'role': 'doctor',
                'department': profile.department,
                'created_at': doctor.date_joined.isoformat(),
                'is_active': doctor.is_active,
                'approval_status': 'approved' if doctor.is_active else 'pending',
            })
        
        return Response(data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve_doctor(self, request, pk=None):
        """Approve a doctor account"""
        from django.contrib.auth.models import User
        
        # Check if user is admin
        if not request.user.is_staff and (not hasattr(request.user, 'profile') or request.user.profile.role != 'admin'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            doctor = User.objects.get(id=pk, profile__role='doctor')
            doctor.is_active = True
            doctor.save()
            return Response({'message': 'Doctor account approved successfully'})
        except User.DoesNotExist:
            return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject_doctor(self, request, pk=None):
        """Reject a doctor account"""
        from django.contrib.auth.models import User
        
        # Check if user is admin
        if not request.user.is_staff and (not hasattr(request.user, 'profile') or request.user.profile.role != 'admin'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            doctor = User.objects.get(id=pk, profile__role='doctor')
            doctor.delete()  # Or set is_active=False if you want to keep the record
            return Response({'message': 'Doctor account rejected successfully'})
        except User.DoesNotExist:
            return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)
