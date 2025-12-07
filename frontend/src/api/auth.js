// Fixed auth.js service with better error handling and response structure
import client from './client.js';

export const storeAuthToken = (token) => {
  localStorage.setItem('thinqscribe_auth_token', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('thinqscribe_auth_token');
};

export const clearAuthToken = () => {
  localStorage.removeItem('thinqscribe_auth_token');
};

export const login = async (credentials) => {
  try {
    
    // Ensure credentials is a proper object
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('Invalid credentials format');
    }
    
    
    const response = await client.post('/auth/login', credentials);
    
    // The client interceptor returns response.data, so we work with that
    if (response && response.token) {
      localStorage.setItem('thinqscribe_auth_token', response.token);
      return response; // Return the full response data
    } else {
      throw new Error('Invalid login response - no token received');
    }
  } catch (error) {
    throw error;
  }
};

export const register = async (userData) => {
  try {
    
    // Ensure userData is a proper object
    if (!userData || typeof userData !== 'object') {
      throw new Error('Invalid user data format');
    }
    
    
    const response = await client.post('/auth/register', userData);
    
    // Store token if available in the response
    if (response && response.token) {
      storeAuthToken(response.token);
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Try both endpoints for compatibility
    let response;
    try {
      response = await client.get('/auth/me');
    } catch (error) {
      response = await client.get('/user/profile');
    }
    
    // The client interceptor already extracts the data, so response IS the user data
    const userData = response;
    
    if (!userData || !userData._id) {
      throw new Error('Invalid user data received');
    }
    
    return userData;
  } catch (error) {
    clearAuthToken();
    throw error;
  }
};

export const logout = async () => {
  try {
    await client.post('/auth/logout');
    clearAuthToken();
  } catch (error) {
    clearAuthToken(); // Clear token even if backend logout fails
    throw error;
  }
};

export const requestPasswordReset = async (email) => {
  try {
    
    if (!email || typeof email !== 'string') {
      throw new Error('Valid email address is required');
    }
    
    // Use a longer timeout for password reset since email sending can be slow
    const response = await client.post('/auth/forgot-password', { email }, {
      timeout: 45000 // 45 seconds for email operations
    });
    
    // If we get here without an error, the request was successful
    // The client interceptor already handles the response structure
    console.log('Password reset response:', response);
    
    // Check if response indicates success
    if (response === 'Email sent' || 
        (typeof response === 'object' && (response.success || response.data))) {
      return response;
    }
    
    // If we get any response without error, consider it successful
    return response;
    
  } catch (error) {
    console.error('Password reset error:', error);
    
    // Handle timeout specifically
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Request timed out. The email may still be sent. Please check your inbox and try again if needed.');
    }
    
    // Handle different error scenarios
    if (error.response?.status === 404) {
      throw new Error('No account found with this email address');
    } else if (error.response?.status === 500) {
      throw new Error('Email service is temporarily unavailable. Please try again later.');
    } else if (error.response?.status === 503) {
      throw new Error('Email service is currently down. Please contact support.');
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.message && !error.message.includes('Invalid response')) {
      throw error;
    } else {
      throw new Error('Failed to send password reset email. Please try again.');
    }
  }
};

export const resetPassword = async (resetToken, newPassword) => {
  try {
    const response = await client.put(`/auth/reset-password/${resetToken}`, { 
      password: newPassword 
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const verifyEmail = async (token) => {
  try {
    const response = await client.get(`/auth/verify/${token}`);
    return response;
  } catch (error) {
    throw error;
  }
};