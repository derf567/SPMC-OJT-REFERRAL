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
    throw new Error(`HTTP error! status: ${response.status}`);
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
  getReferralsByTimePeriod: async (filter: string, year?: number) => {
    const params = new URLSearchParams({ filter });
    if (year) {
      params.append('year', year.toString());
    }
    return apiRequest(`/referrals/referrals_by_time_period/?${params.toString()}`);
  },

  // Get department analytics for pie chart
  getDepartmentAnalytics: async () => {
    return apiRequest('/referrals/department_analytics/');
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
};

// Hospitals API
export const hospitalsAPI = {
  getAll: async () => {
    return apiRequestAnonymous('/hospitals/');
  },

  create: async (hospitalData: any) => {
    return apiRequest('/hospitals/', {
      method: 'POST',
      body: JSON.stringify(hospitalData),
    });
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