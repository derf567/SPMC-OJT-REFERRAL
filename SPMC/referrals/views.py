from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Max
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from .models import ReferringHospital, Specialty, Referral, TransitInfo, ReferralStatusHistory
from .serializers import (
    ReferringHospitalSerializer, SpecialtySerializer, ReferralListSerializer,
    ReferralDetailSerializer, ReferralCreateSerializer, ReferralUpdateSerializer,
    StatusUpdateSerializer, TransitInfoSerializer
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

@method_decorator(csrf_exempt, name='dispatch')
class ReferralViewSet(viewsets.ModelViewSet):
    queryset = Referral.objects.select_related(
        'specialty_needed', 'referring_hospital', 'created_by', 'assigned_to'
    ).prefetch_related('transit_info', 'status_history', 'documents')
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = [
        'referral_id', 'patient_full_name', 'hrn', 'chief_complaint',
        'referrer_name', 'referrer_cellphone'
    ]
    filterset_fields = [
        'status', 'priority', 'is_urgent', 'gender', 'patient_category',
        'admission_status', 'rtpcr_result', 'specialty_needed', 'referring_hospital'
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
        
        return queryset
    
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
    def transfer_to_triage(self, request, pk=None):
        """Transfer referral to triage (EDCC Personnel action)"""
        referral = self.get_object()
        
        # Check if user has permission to transfer referrals
        if not hasattr(request.user, 'profile') or not request.user.profile.can_transfer_referrals:
            return Response({
                'error': 'You do not have permission to transfer referrals'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get department from request data
        department = request.data.get('department')
        if not department:
            return Response({
                'error': 'Department selection is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate department choice
        valid_departments = [choice[0] for choice in Referral.DEPARTMENT_CHOICES]
        if department not in valid_departments:
            return Response({
                'error': 'Invalid department selection'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update status to waiting (transferred to triage) and assign department
        old_status = referral.status
        referral.status = 'waiting'
        referral.assigned_department = department
        referral.transferred_by = request.user
        referral.transferred_at = timezone.now()
        referral.save()
        
        # Get department display name
        department_display = dict(Referral.DEPARTMENT_CHOICES).get(department, department)
        
        # Create status history record
        ReferralStatusHistory.objects.create(
            referral=referral,
            old_status=old_status,
            new_status='waiting',
            changed_by=request.user,
            notes=f'Transferred to EDMAR/EDHO Triage for review - Assigned to {department_display}'
        )
        
        return Response({
            'message': f'Referral successfully transferred to EDMAR/EDHO Triage - {department_display}',
            'new_status': referral.status,
            'assigned_department': department,
            'department_display': department_display
        })
    
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
        
        if not triage_decision:
            return Response({
                'error': 'Triage decision is required'
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
                scheduled_datetime = datetime.combine(
                    datetime.strptime(scheduled_date, '%Y-%m-%d').date(),
                    datetime.strptime(scheduled_time, '%H:%M').time()
                )
                if scheduled_datetime < timezone.now():
                    return Response({
                        'error': 'Cannot schedule appointments in the past'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({
                    'error': 'Invalid date or time format'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update referral with triage decision
        old_status = referral.status
        referral.triage_decision = triage_decision
        referral.triage_notes = triage_notes
        referral.triaged_by = request.user
        referral.triaged_at = timezone.now()
        
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
        history_notes = f'Triage decision: {decision_display}'
        if triage_notes:
            history_notes += f'. Notes: {triage_notes}'
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
            'triaged_at': referral.triaged_at
        }
        
        if triage_decision == 'schedule_opd':
            response_data['scheduled_date'] = referral.scheduled_date
            response_data['scheduled_time'] = referral.scheduled_time
        
        return Response(response_data)
    
    @action(detail=True, methods=['post'])
    def respond_to_triage_call(self, request, pk=None):
        """Referrer responds to triage call with transit decision"""
        referral = self.get_object()
        
        # Check if user is the referrer who created this referral
        if referral.created_by != request.user:
            return Response({
                'error': 'You can only respond to triage calls for your own referrals'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Only allow response for urgent referrals that haven't been responded to yet
        if referral.status != 'urgent' or referral.triage_decision != 'urgent':
            return Response({
                'error': 'This referral is not awaiting a triage call response'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if referral.transit_decision:
            return Response({
                'error': 'Transit decision has already been made for this referral'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get transit decision from request data
        transit_decision = request.data.get('transit_decision')
        scheduled_date = request.data.get('scheduled_date')
        scheduled_time = request.data.get('scheduled_time')
        
        if not transit_decision or transit_decision not in ['now', 'scheduled']:
            return Response({
                'error': 'Valid transit decision is required (now or scheduled)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate scheduled date/time for scheduled transport
        if transit_decision == 'scheduled':
            if not scheduled_date or not scheduled_time:
                return Response({
                    'error': 'Scheduled date and time are required for scheduled transport'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate date is not in the past
            from datetime import datetime
            try:
                scheduled_datetime = datetime.combine(
                    datetime.strptime(scheduled_date, '%Y-%m-%d').date(),
                    datetime.strptime(scheduled_time, '%H:%M').time()
                )
                if scheduled_datetime < timezone.now():
                    return Response({
                        'error': 'Cannot schedule transport in the past'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({
                    'error': 'Invalid date or time format'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update referral with transit decision
        old_status = referral.status
        referral.transit_decision = transit_decision
        referral.transit_decision_at = timezone.now()
        
        if transit_decision == 'now':
            referral.status = 'in_transit'
        elif transit_decision == 'scheduled':
            referral.transit_scheduled_date = scheduled_date
            referral.transit_scheduled_time = scheduled_time
            # Keep status as urgent until scheduled time
        
        referral.save()
        
        # Create status history record
        if transit_decision == 'now':
            history_notes = 'Referrer decided to transport patient immediately'
            new_status = 'in_transit'
        else:
            history_notes = f'Referrer scheduled transport for {scheduled_date} at {scheduled_time}'
            new_status = referral.status
        
        ReferralStatusHistory.objects.create(
            referral=referral,
            old_status=old_status,
            new_status=new_status,
            changed_by=request.user,
            notes=history_notes
        )
        
        # Prepare response data
        response_data = {
            'message': f'Transit decision recorded: {transit_decision}',
            'transit_decision': transit_decision,
            'new_status': referral.status,
            'decided_at': referral.transit_decision_at
        }
        
        if transit_decision == 'scheduled':
            response_data['transit_scheduled_date'] = referral.transit_scheduled_date
            response_data['transit_scheduled_time'] = referral.transit_scheduled_time
        
        return Response(response_data)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get dashboard statistics"""
        total_referrals = Referral.objects.count()
        pending_referrals = Referral.objects.filter(status='pending').count()
        in_transit_referrals = Referral.objects.filter(status='in_transit').count()
        critical_referrals = Referral.objects.filter(priority='critical').count()
        urgent_referrals = Referral.objects.filter(is_urgent=True).count()
        
        # Triage decisions
        emergent_referrals = Referral.objects.filter(status='emergent').count()
        urgent_triage_referrals = Referral.objects.filter(status='urgent').count()
        scheduled_opd_referrals = Referral.objects.filter(status='schedule_opd').count()
        
        # Recent referrals (last 24 hours)
        from django.utils import timezone
        from datetime import timedelta
        yesterday = timezone.now() - timedelta(days=1)
        recent_referrals = Referral.objects.filter(created_at__gte=yesterday).count()
        
        return Response({
            'total_referrals': total_referrals,
            'pending_referrals': pending_referrals,
            'in_transit_referrals': in_transit_referrals,
            'critical_referrals': critical_referrals,
            'urgent_referrals': urgent_referrals,
            'emergent_referrals': emergent_referrals,
            'urgent_triage_referrals': urgent_triage_referrals,
            'scheduled_opd_referrals': scheduled_opd_referrals,
            'recent_referrals': recent_referrals,
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
            # Get last 12 weeks for the specified year
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
        """Get top referring hospitals with time filter"""
        from django.utils import timezone
        from datetime import timedelta, datetime
        from django.db.models import Count
        
        time_filter = request.query_params.get('filter', 'month')
        year = request.query_params.get('year', timezone.now().year)
        
        try:
            year = int(year)
        except (ValueError, TypeError):
            year = timezone.now().year
        
        # Calculate date range based on filter
        if time_filter == 'week':
            start_date = timezone.now() - timedelta(weeks=12)
            end_date = timezone.now()
        elif time_filter == 'month':
            start_date = datetime(year, 1, 1)
            end_date = datetime(year, 12, 31, 23, 59, 59)
        else:  # year
            start_date = datetime(year - 4, 1, 1)
            end_date = datetime(year, 12, 31, 23, 59, 59)
        
        # Get referrals in date range
        referrals_in_range = Referral.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        total_referrals = referrals_in_range.count()
        
        # Get top hospitals
        top_hospitals = ReferringHospital.objects.filter(
            referral__in=referrals_in_range
        ).annotate(
            referral_count=Count('referral')
        ).filter(referral_count__gt=0).order_by('-referral_count')[:10]
        
        hospital_data = []
        for hospital in top_hospitals:
            percentage = (hospital.referral_count / total_referrals * 100) if total_referrals > 0 else 0
            hospital_data.append({
                'name': hospital.name,
                'count': hospital.referral_count,
                'percentage': round(percentage, 1)
            })
        
        return Response(hospital_data)

    @action(detail=False, methods=['get'])
    def top_departments(self, request):
        """Get top referring departments with time filter"""
        from django.utils import timezone
        from datetime import timedelta, datetime
        from django.db.models import Count
        
        time_filter = request.query_params.get('filter', 'month')
        year = request.query_params.get('year', timezone.now().year)
        
        try:
            year = int(year)
        except (ValueError, TypeError):
            year = timezone.now().year
        
        # Calculate date range based on filter
        if time_filter == 'week':
            start_date = timezone.now() - timedelta(weeks=12)
            end_date = timezone.now()
        elif time_filter == 'month':
            start_date = datetime(year, 1, 1)
            end_date = datetime(year, 12, 31, 23, 59, 59)
        else:  # year
            start_date = datetime(year - 4, 1, 1)
            end_date = datetime(year, 12, 31, 23, 59, 59)
        
        # Get referrals in date range with assigned departments
        referrals_in_range = Referral.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        ).exclude(assigned_department__isnull=True).exclude(assigned_department='')
        
        total_referrals = referrals_in_range.count()
        
        # Get department distribution
        department_data = referrals_in_range.values('assigned_department').annotate(
            count=Count('assigned_department')
        ).order_by('-count')[:10]
        
        # Assign colors to departments
        colors = [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
            '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
        ]
        
        # Get department display names
        department_choices_dict = dict(Referral.DEPARTMENT_CHOICES)
        
        result = []
        for idx, dept in enumerate(department_data):
            dept_key = dept['assigned_department']
            dept_name = department_choices_dict.get(dept_key, dept_key.replace('_', ' ').title())
            result.append({
                'name': dept_name,
                'count': dept['count'],
                'color': colors[idx % len(colors)]
            })
        
        return Response(result)

    @action(detail=False, methods=['get'])
    def top_specialties(self, request):
        """Get top specialties with time filter"""
        from django.utils import timezone
        from datetime import timedelta, datetime
        from django.db.models import Count
        
        time_filter = request.query_params.get('filter', 'month')
        year = request.query_params.get('year', timezone.now().year)
        
        try:
            year = int(year)
        except (ValueError, TypeError):
            year = timezone.now().year
        
        # Calculate date range based on filter
        if time_filter == 'week':
            start_date = timezone.now() - timedelta(weeks=12)
            end_date = timezone.now()
        elif time_filter == 'month':
            start_date = datetime(year, 1, 1)
            end_date = datetime(year, 12, 31, 23, 59, 59)
        else:  # year
            start_date = datetime(year - 4, 1, 1)
            end_date = datetime(year, 12, 31, 23, 59, 59)
        
        # Get referrals in date range
        referrals_in_range = Referral.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        # Get specialty distribution
        specialty_distribution = Specialty.objects.filter(
            referral__in=referrals_in_range
        ).annotate(
            referral_count=Count('referral')
        ).filter(referral_count__gt=0).order_by('-referral_count')[:10]
        
        specialty_data = []
        for specialty in specialty_distribution:
            specialty_data.append({
                'name': specialty.name,
                'count': specialty.referral_count
            })
        
        return Response(specialty_data)

    @action(detail=False, methods=['get'])
    def coordinated_referrals(self, request):
        """Get coordinated referrals (received by department)"""
        from django.utils import timezone
        from datetime import timedelta, datetime
        
        time_filter = request.query_params.get('filter', 'month')
        year = request.query_params.get('year', timezone.now().year)
        
        try:
            year = int(year)
        except (ValueError, TypeError):
            year = timezone.now().year
        
        # Calculate date range based on filter
        if time_filter == 'week':
            start_date = timezone.now() - timedelta(weeks=12)
            end_date = timezone.now()
        elif time_filter == 'month':
            start_date = datetime(year, 1, 1)
            end_date = datetime(year, 12, 31, 23, 59, 59)
        else:  # year
            start_date = datetime(year - 4, 1, 1)
            end_date = datetime(year, 12, 31, 23, 59, 59)
        
        # Get coordinated referrals (status: completed, in_transit, waiting, emergent, urgent, schedule_opd)
        # These are referrals that have been received and are being processed by the department
        coordinated = Referral.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date,
            status__in=['completed', 'in_transit', 'waiting', 'emergent', 'urgent', 'schedule_opd']
        ).select_related('specialty_needed', 'referring_hospital').order_by('-updated_at')[:100]
        
        result = []
        for referral in coordinated:
            # Determine the department from specialty or assigned department
            department = referral.specialty_needed.name if referral.specialty_needed else 'N/A'
            
            result.append({
                'referral_id': referral.referral_id,
                'patient_name': referral.patient_full_name,
                'department': department,
                'status': referral.get_status_display(),
                'referring_hospital': referral.referring_hospital.name,
                'date_received': referral.updated_at.strftime('%Y-%m-%d %H:%M'),
                'created_at': referral.created_at.strftime('%Y-%m-%d %H:%M')
            })
        
        return Response(result)

    @action(detail=False, methods=['get'])
    def uncoordinated_referrals(self, request):
        """Get uncoordinated referrals (cancelled)"""
        from django.utils import timezone
        from datetime import timedelta, datetime
        
        time_filter = request.query_params.get('filter', 'month')
        year = request.query_params.get('year', timezone.now().year)
        
        try:
            year = int(year)
        except (ValueError, TypeError):
            year = timezone.now().year
        
        # Calculate date range based on filter
        if time_filter == 'week':
            start_date = timezone.now() - timedelta(weeks=12)
            end_date = timezone.now()
        elif time_filter == 'month':
            start_date = datetime(year, 1, 1)
            end_date = datetime(year, 12, 31, 23, 59, 59)
        else:  # year
            start_date = datetime(year - 4, 1, 1)
            end_date = datetime(year, 12, 31, 23, 59, 59)
        
        # Get uncoordinated referrals (status: cancelled)
        uncoordinated = Referral.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date,
            status='cancelled'
        ).select_related('specialty_needed', 'referring_hospital').prefetch_related('status_history').order_by('-updated_at')[:100]
        
        result = []
        for referral in uncoordinated:
            # Try to get cancellation reason from status history
            cancellation_reason = 'No reason provided'
            last_history = referral.status_history.filter(new_status='cancelled').order_by('-changed_at').first()
            if last_history and last_history.notes:
                cancellation_reason = last_history.notes
            
            result.append({
                'referral_id': referral.referral_id,
                'patient_name': referral.patient_full_name,
                'reason': cancellation_reason,
                'referring_hospital': referral.referring_hospital.name,
                'specialty': referral.specialty_needed.name if referral.specialty_needed else 'N/A',
                'date_cancelled': referral.updated_at.strftime('%Y-%m-%d %H:%M'),
                'created_at': referral.created_at.strftime('%Y-%m-%d %H:%M')
            })
        
        return Response(result)

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
            cancellation_reason = 'No reason provided'
            last_history = referral.status_history.filter(new_status='cancelled').order_by('-changed_at').first()
            if last_history and last_history.notes:
                cancellation_reason = last_history.notes
            
            result.append({
                'referral_id': referral.referral_id,
                'patient_name': referral.patient_full_name,
                'reason': cancellation_reason,
                'referring_hospital': referral.referring_hospital.name,
                'specialty': referral.specialty_needed.name if referral.specialty_needed else 'N/A',
                'date_cancelled': referral.updated_at.strftime('%Y-%m-%d %H:%M'),
                'created_at': referral.created_at.strftime('%Y-%m-%d %H:%M')
            })
        
        return Response(result)
