import client from './client';

// Get student dashboard data
export const fetchStudentDashboardData = async (params = {}) => {
  try {
    const response = await client.get('/user/dashboard/student', { params });
    
    // Return the response directly - client interceptor already extracts data
    // Ensure we have the new monthly spending fields
    if (response && response.stats) {
      return {
        ...response,
        stats: {
          ...response.stats,
          monthlySpending: response.stats.monthlySpending || 0,
          projectsThisMonth: response.stats.projectsThisMonth || 0
        }
      };
    }
    
    return response;
  } catch (error) {
    // Return default data structure instead of throwing
    return {
      totalAmountSpent: 0,
      totalAssignments: 0,
      workInProgress: 0,
      completedAssignments: 0,
      refundsRequested: 0,
      refundsProcessed: 0,
      recentAssignments: [],
      supportTickets: [],
      agreements: [],
      payments: [],
      stats: {
        totalSpent: 0,
        pendingPayments: 0,
        activeProjects: 0,
        completedProjects: 0,
        monthlySpending: 0,
        projectsThisMonth: 0
      }
    };
  }
};

// Get recommended writers
export const getRecommendedWriters = async () => {
  try {
    
    const response = await client.get('/public/recommended-writers');
    
    // If response has data property, use it, otherwise use response directly
    return response; 
  } catch (error) {
    return [];
  }
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  try {
    const response = await client.put('/user/profile', profileData);
    return response;
  } catch (error) {
    throw error;
  }
};

// Upload profile picture
export const uploadProfilePicture = async (formData) => {
  try {
    const response = await client.post('/user/files/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Get user files
export const getUserFiles = async () => {
  try {
    const response = await client.get('/user/files');
    return Array.isArray(response) ? response : [];
  } catch (error) {
    return [];
  }
};

// Update payment terms
export const updatePaymentTerms = async (paymentTerms) => {
  try {
    const response = await client.put('/user/payment-terms', paymentTerms);
    return response;
  } catch (error) {
    throw error;
  }
};