from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Max
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import ReferringHospital, Specialty, Referral, TransitInfo, ReferralStatusHistory
from .serializers import (
    ReferringHospitalSerializer, SpecialtySerializer, ReferralListSerializer,
    ReferralDetailSerializer, ReferralCreateSerializer, ReferralUpdateSerializer,
    StatusUpdateSerializer, TransitInfoSerializer
)

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
    def accept_with_triage_decision(self, request, pk=None):
        """Accept referral with triage decision (Triage user action)"""
        referral = self.get_object()
        
        # Check if user has permission to triage referrals
        if not hasattr(request.user, 'profile') or not request.user.profile.can_triage_referrals:
            return Response({
                'error': 'You do not have permission to make triage decisions'
            }, status=status.HTTP_403_FORBIDDEN)
        
        triage_decision = request.data.get('triage_decision')
        triage_notes = request.data.get('triage_notes', '')
        
        if not triage_decision or triage_decision not in ['emergent', 'urgent', 'schedule_opd']:
            return Response({
                'error': 'Valid triage decision is required (emergent, urgent, or schedule_opd)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update referral - set status to the triage decision
        old_status = referral.status
        referral.status = triage_decision  # Set status to emergent/urgent/schedule_opd
        referral.triage_decision = triage_decision
        referral.triage_notes = triage_notes
        referral.assigned_to = request.user
        referral.save()
        
        # Create status history record
        ReferralStatusHistory.objects.create(
            referral=referral,
            old_status=old_status,
            new_status=triage_decision,  # Use triage decision as new status
            changed_by=request.user,
            notes=f'Triage decision: {triage_decision.replace("_", " ").title()}. Notes: {triage_notes}'
        )
        
        return Response({
            'message': f'Referral processed with triage decision: {triage_decision.replace("_", " ").title()}',
            'new_status': referral.status,
            'triage_decision': referral.triage_decision
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
        
        # Update status to waiting (transferred to triage)
        old_status = referral.status
        referral.status = 'waiting'
        referral.save()
        
        # Create status history record
        ReferralStatusHistory.objects.create(
            referral=referral,
            old_status=old_status,
            new_status='waiting',
            changed_by=request.user,
            notes='Transferred to EDMAR/EDHO Triage for review'
        )
        
        return Response({
            'message': 'Referral successfully transferred to EDMAR/EDHO Triage',
            'new_status': referral.status
        })
    
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

class TransitInfoViewSet(viewsets.ModelViewSet):
    queryset = TransitInfo.objects.select_related('referral')
    serializer_class = TransitInfoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['referral__referral_id', 'watcher_name', 'escort_nurse']
    filterset_fields = ['referral']