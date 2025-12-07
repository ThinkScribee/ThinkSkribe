// Enhanced client.js with comprehensive debugging
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../utils/errorMessages.js';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000' 
  : 'https://thinkscribe-xk1e.onrender.com';


// Enhanced token handling with debugging
const getAuthToken = () => {
  const token = localStorage.getItem('thinqscribe_auth_token');
  // Check if token is expired (basic check)
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      // Token expiration check
    } catch (e) {
      // Could not decode token payload
    }
  }
  return token;
};

const clearAuthToken = () => {
  localStorage.removeItem('thinqscribe_auth_token');
};

const client = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000, // 30 seconds timeout for better UX
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Enhanced request interceptor
client.interceptors.request.use(
  (config) => {
    
    const token = getAuthToken();

    // Add currency and location information if available
    const locationCache = localStorage.getItem('edu_sage_location_cache');
    if (locationCache) {
      try {
        const location = JSON.parse(locationCache);
        config.headers['X-User-Currency'] = location.currency || 'usd';
        config.headers['X-User-Country'] = location.countryCode || 'us';
        config.headers['X-User-Timezone'] = location.timezone || 'UTC';
      } catch (e) {
      }
    }
    
    // Skip adding auth header for login/register endpoints
    const authEndpoints = ['/auth/login', '/auth/register', '/auth/verify'];
    const isAuthEndpoint = authEndpoints.some(endpoint => config.url.includes(endpoint));
    
    if (token && !isAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (isAuthEndpoint) {
      // Skip auth header for auth endpoints
    } else {
      // No token available
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
client.interceptors.response.use(
  (response) => {
    
    // If the response has a data property with success and data nested inside
    if (response.data && response.data.success === true && response.data.data !== undefined) {
      
      // Preserve pagination data if it exists
      if (response.data.pagination) {
        return {
          data: response.data.data,
          pagination: response.data.pagination
        };
      }
      
      return response.data.data;
    }
    
    // Special case for arrays wrapped in data property
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // If the response just has a data property (standard axios response)
    if (response.data) {
      return response.data;
    }
    
    // Otherwise return the whole response
    return response;
  },
  (error) => {
    
    // Enhanced error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      
      // Handle 401 Unauthorized errors (token expired)
      if (error.response.status === 401) {
        localStorage.removeItem('thinqscribe_auth_token');
        // Redirect to login page if not already there
        if (!window.location.pathname.includes('/signin')) {
          window.location.href = '/signin';
        }
      }
      
      // Enhance error message with user-friendly text
      if (error.response.data) {
        error.response.data.userFriendlyMessage = getApiErrorMessage(error);
      }
    } else if (error.request) {
      // The request was made but no response was received
      error.userFriendlyMessage = 'Network error. Please check your internet connection and try again.';
    } else {
      // Something happened in setting up the request that triggered an Error
      error.userFriendlyMessage = getApiErrorMessage(error);
    }
    
    return Promise.reject(error);
  }
);

// Helper functions
function isAuthPage() {
  const authPages = ['/signin', '/signup', '/forgot-password', '/reset-password'];
  const currentPath = window.location.pathname;
  const isAuth = authPages.some(path => currentPath.includes(path));
  return isAuth;
}

function handleCommonErrors(status, data) {
  const messages = {
    404: 'Resource not found',
    422: 'Validation error occurred',
    500: 'Server error. Please try again later',
  };
  const message = data.message || messages[status] || 'An error occurred';
  toast.error(message);
}

export default client;