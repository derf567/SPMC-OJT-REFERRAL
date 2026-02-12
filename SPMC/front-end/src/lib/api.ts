const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Set auth token in localStorage
const setAuthToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

// Remove auth token from localStorage
const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

// API request helper with authentication
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Token ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    if (response.status === 401 && token) {
      // Unauthorized with token - remove token and redirect to login
      removeAuthToken();
      window.location.href = '/login';
    }
    // Try to get error details from response
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      console.error('API Error Details:', errorData);
      errorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
    } catch (e) {
      // If response is not JSON, use status text
      errorMessage = `HTTP error! status: ${response.status} - ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
  
  return response.json();
};

// API request helper for anonymous requests (no auth required)
const apiRequestAnonymous = async (endpoint: string, options: RequestInit = {}) => {
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(`HTTP error! status: ${response.status}`);
    (error as any).response = {
      status: response.status,
      data: errorData
    };
    throw error;
  }
  
  return response.json();
};

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      setAuthToken(data.token);
      return data;
    } else {
      throw new Error(data.error || 'Login failed');
    }
  },

  register: async (userData: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      return data;
    } else {
      throw new Error(data.error || 'Registration failed');
    }
  },

  registerComprehensive: async (formData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register-comprehensive/`, {
      method: 'POST',
      body: formData, // Don't set Content-Type header for FormData
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      return data;
    } else {
      throw new Error(data.error || 'Registration failed');
    }
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout/', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeAuthToken();
    }
  },

  getProfile: async () => {
    return apiRequest('/auth/profile/');
  },

  isAuthenticated: () => {
    return !!getAuthToken();
  },
};

// Referrals API
export const referralsAPI = {
  // Get all referrals with optional filters
  getAll: async (params?: Record<string, any>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/referrals/${queryString}`);
  },

  // Get single referral by ID
  getById: async (id: string) => {
    return apiRequest(`/referrals/${id}/`);
  },

  // Create new referral
  create: async (referralData: any) => {
    return apiRequest('/referrals/', {
      method: 'POST',
      body: JSON.stringify(referralData),
    });
  },

  // Update referral
  update: async (id: string, referralData: any) => {
    return apiRequest(`/referrals/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(referralData),
    });
  },

  // Update referral status
  updateStatus: async (id: string, newStatus: string, notes?: string) => {
    return apiRequest(`/referrals/${id}/update_status/`, {
      method: 'POST',
      body: JSON.stringify({ new_status: newStatus, notes }),
    });
  },

  // Assign referral to current user
  assignToMe: async (id: string) => {
    return apiRequest(`/referrals/${id}/assign_to_me/`, {
      method: 'POST',
    });
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    return apiRequest('/referrals/dashboard_stats/');
  },

  // Get my assigned referrals
  getMyReferrals: async () => {
    return apiRequest('/referrals/my_referrals/');
  },

  // Get my submitted referrals (for referrers)
  getMySubmittedReferrals: async () => {
    return apiRequest('/referrals/my_submitted_referrals/');
  },

  // Get patients list
  getPatients: async (params?: Record<string, any>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/referrals/patients/${queryString}`);
  },

  // Get patient referral history
  getPatientHistory: async (patientName: string) => {
    return apiRequest(`/referrals/patient_history/?patient_name=${encodeURIComponent(patientName)}`);
  },

  // Get reports and analytics data
  getReportsAnalytics: async () => {
    return apiRequest('/referrals/reports_analytics/');
  },

  // Get referrals by time period (week, month, year)
  getReferralsByTimePeriod: async (filter: string, year?: number, month?: number, week?: number) => {
    const params = new URLSearchParams({ filter });
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    if (week) params.append('week', week.toString());
    return apiRequest(`/referrals/referrals_by_time_period/?${params.toString()}`);
  },

  // Get department analytics for pie chart
  getDepartmentAnalytics: async () => {
    return apiRequest('/referrals/department_analytics/');
  },

  // Get filtered top hospitals
  getTopHospitals: async (filter: string, year?: number, month?: number, week?: number) => {
    const params = new URLSearchParams({ filter });
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    if (week) params.append('week', week.toString());
    return apiRequest(`/referrals/top_hospitals/?${params.toString()}`);
  },

  // Get filtered top departments
  getTopDepartments: async (filter: string, year?: number, month?: number, week?: number) => {
    const params = new URLSearchParams({ filter });
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    if (week) params.append('week', week.toString());
    return apiRequest(`/referrals/top_departments/?${params.toString()}`);
  },

  // Get filtered top specialties
  getTopSpecialties: async (filter: string, year?: number, month?: number, week?: number) => {
    const params = new URLSearchParams({ filter });
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    if (week) params.append('week', week.toString());
    return apiRequest(`/referrals/top_specialties/?${params.toString()}`);
  },

  // Get coordinated referrals (received by department)
  getCoordinatedReferrals: async (filter: string, year?: number, month?: number, week?: number) => {
    const params = new URLSearchParams({ filter });
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    if (week) params.append('week', week.toString());
    return apiRequest(`/referrals/coordinated_referrals/?${params.toString()}`);
  },

  // Get uncoordinated referrals (cancelled)
  getUncoordinatedReferrals: async (filter: string, year?: number, month?: number, week?: number) => {
    const params = new URLSearchParams({ filter });
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    if (week) params.append('week', week.toString());
    return apiRequest(`/referrals/uncoordinated_referrals/?${params.toString()}`);
  },

  // Transfer referral to triage (EDCC Personnel action)
  transferToTriage: async (id: string, department: string) => {
    return apiRequest(`/referrals/${id}/transfer_to_triage/`, {
      method: 'POST',
      body: JSON.stringify({ department }),
    });
  },

  // Accept referral with triage decision (Triage user action)
  acceptWithTriageDecision: async (id: string, triageDecision: string, triageNotes?: string, scheduledDate?: string, scheduledTime?: string) => {
    const requestBody: any = {
      triage_decision: triageDecision,
      triage_notes: triageNotes || ''
    };

    // Add scheduled date and time if provided (for schedule_opd decisions)
    if (scheduledDate) {
      requestBody.scheduled_date = scheduledDate;
    }
    if (scheduledTime) {
      requestBody.scheduled_time = scheduledTime;
    }

    return apiRequest(`/referrals/${id}/accept_with_triage_decision/`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  },

  // Mark appointment as completed
  markAsCompleted: async (id: string, notes?: string) => {
    return apiRequest(`/referrals/${id}/mark_appointment_completed/`, {
      method: 'POST',
      body: JSON.stringify({
        completion_notes: notes || ''
      }),
    });
  },

  // Change department assignment (Triage user action)
  changeDepartment: async (id: string, newDepartment: string) => {
    return apiRequest(`/referrals/${id}/change_department/`, {
      method: 'POST',
      body: JSON.stringify({ department: newDepartment }),
    });
  },

  // Respond to triage call (Referrer action)
  respondToTriageCall: async (id: string, transitDecision: string, scheduledDate?: string, scheduledTime?: string) => {
    const requestBody: any = {
      transit_decision: transitDecision
    };

    if (scheduledDate) {
      requestBody.scheduled_date = scheduledDate;
    }
    if (scheduledTime) {
      requestBody.scheduled_time = scheduledTime;
    }

    return apiRequest(`/referrals/${id}/respond_to_triage_call/`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  },

  // Get pending accounts for approval
  getPendingAccounts: async () => {
    return apiRequest('/referrers/pending_accounts/');
  },

  // Approve account
  approveAccount: async (accountId: number) => {
    return apiRequest(`/referrers/${accountId}/approve_account/`, {
      method: 'POST',
    });
  },

  // Reject account
  rejectAccount: async (accountId: number) => {
    return apiRequest(`/referrers/${accountId}/reject_account/`, {
      method: 'POST',
    });
  },

  // Get incoming referrals (for HIS Department)
  getIncomingReferrals: async () => {
    return apiRequest('/referrals/incoming_referrals/');
  },

  // Confirm referral arrival (HIS Department action)
  confirmArrival: async (id: number) => {
    return apiRequest(`/referrals/${id}/confirm_arrival/`, {
      method: 'POST',
    });
  },
};

// Admin API
export const adminAPI = {
  // Get admin dashboard stats
  getDashboardStats: async () => {
    return apiRequest('/admin/dashboard_stats/');
  },

  // Get all pending referrer registrations
  getPendingReferrers: async () => {
    return apiRequest('/referrers/pending_accounts/');
  },

  // Get all doctors with departments and specialties
  getAllDoctors: async () => {
    return apiRequest('/admin/doctors/');
  },

  // Update doctor specialties
  updateDoctorSpecialties: async (userId: number, specialtyIds: number[]) => {
    return apiRequest(`/admin/doctors/${userId}/update_specialties/`, {
      method: 'POST',
      body: JSON.stringify({ specialty_ids: specialtyIds }),
    });
  },

  // Assign doctor to department
  assignDoctorToDepartment: async (userId: number, department: string, role: string) => {
    return apiRequest('/admin/doctors/assign/', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, department, role }),
    });
  },

  // Unassign doctor from department
  unassignDoctorFromDepartment: async (userId: number) => {
    return apiRequest('/admin/doctors/unassign/', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },

  // Approve referrer account
  approveReferrer: async (accountId: number) => {
    return apiRequest(`/referrers/${accountId}/approve_account/`, {
      method: 'POST',
    });
  },

  // Reject referrer account
  rejectReferrer: async (accountId: number) => {
    return apiRequest(`/referrers/${accountId}/reject_account/`, {
      method: 'POST',
    });
  },
};

// Hospitals API
export const hospitalsAPI = {
  // Get all hospitals
  getAll: async () => {
    return apiRequestAnonymous('/hospitals/');
  },

  // Get hospital by ID
  getById: async (id: string) => {
    return apiRequestAnonymous(`/hospitals/${id}/`);
  },

  // Create new hospital
  create: async (hospitalData: any) => {
    return apiRequest('/hospitals/', {
      method: 'POST',
      body: JSON.stringify(hospitalData),
    });
  },
};

// Referrer API
export const referrerAPI = {
  // Get current referrer's profile for auto-filling forms
  getMyProfile: async () => {
    return apiRequest('/referrers/my_profile/');
  },
};

// Specialties API
export const specialtiesAPI = {
  getAll: async () => {
    return apiRequestAnonymous('/specialties/');
  },

  create: async (specialtyData: any) => {
    return apiRequest('/specialties/', {
      method: 'POST',
      body: JSON.stringify(specialtyData),
    });
  },
};

// External Referrals API (no auth required)
// External Referrals API
export const externalReferralsAPI = {
  // Create new referral (authenticated if user is logged in, anonymous otherwise)
  create: async (referralData: any) => {
    // Check if user is authenticated
    const token = getAuthToken();
    if (token) {
      // Use authenticated request if user is logged in
      return apiRequest('/referrals/', {
        method: 'POST',
        body: JSON.stringify(referralData),
      });
    } else {
      // Use anonymous request for public submissions
      return apiRequestAnonymous('/referrals/', {
        method: 'POST',
        body: JSON.stringify(referralData),
      });
    }
  },

  // Get hospitals for dropdown (anonymous)
  getHospitals: async () => {
    return apiRequestAnonymous('/hospitals/');
  },

  // Get specialties for dropdown (anonymous)
  getSpecialties: async () => {
    return apiRequestAnonymous('/specialties/');
  },
};

// Export utility functions
export { getAuthToken, setAuthToken, removeAuthToken };