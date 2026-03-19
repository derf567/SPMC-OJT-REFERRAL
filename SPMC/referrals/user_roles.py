from django.contrib.auth.models import User
from django.db import models

class UserProfile(models.Model):
    """Extended user profile with roles"""
    ROLE_CHOICES = [
        ('edcc_edma', 'EDCC/EDMA'),
        ('admin', 'Administrator'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='edcc_edma')
    department = models.CharField(max_length=100, blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_role_display()}"
    
    @property
    def can_create_referrals(self):
        """Only external users (not SPMC staff) can create referrals"""
        return False  # SPMC staff cannot create referrals
    
    @property
    def can_view_referrals(self):
        """All SPMC staff can view referrals"""
        return True
    
    @property
    def can_triage_referrals(self):
        """EDCC/EDMA can decide on referral priority/status"""
        return self.role == 'edcc_edma'
    
    @property
    def can_transfer_referrals(self):
        """EDCC/EDMA can transfer/forward referrals"""
        return self.role == 'edcc_edma'
    
    @property
    def is_admin_user(self):
        """Check if user is admin"""
        return self.role == 'admin' or self.user.is_superuser
