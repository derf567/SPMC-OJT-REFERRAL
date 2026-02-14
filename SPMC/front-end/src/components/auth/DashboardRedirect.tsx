import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const DashboardRedirect = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect based on user role
      if (user.role === 'referrer') {
        navigate('/referrer', { replace: true });
      } else if (user.role === 'admin' || user.permissions?.is_admin_user) {
        // Admin users go to admin dashboard
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'view_only') {
        // View Only users (department doctors) go to department-filtered dashboard
        navigate('/dashboard', { replace: true });
      } else if (user.role === 'department_user') {
        // Department users go to main dashboard (with department filtering)
        navigate('/dashboard', { replace: true });
      } else {
        // For EDCC personnel, triage users, HIS department - go to main dashboard
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default DashboardRedirect;