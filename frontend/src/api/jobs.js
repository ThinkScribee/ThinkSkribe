import client from './client.js';

// ==========================================
// JOB API SERVICE
// ==========================================

/**
 * Get all available jobs (for writers to browse)
 */
export const getJobs = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await client.get(`/jobs?${queryParams.toString()}`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get single job details
 */
export const getJob = async (jobId) => {
  try {
    const response = await client.get(`/jobs/${jobId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Create new job (students only)
 */
export const createJob = async (jobData) => {
  try {
    const response = await client.post('/jobs', jobData);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Update job (job owner only)
 */
export const updateJob = async (jobId, jobData) => {
  try {
    const response = await client.put(`/jobs/${jobId}`, jobData);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete job (job owner only)
 */
export const deleteJob = async (jobId) => {
  try {
    const response = await client.delete(`/jobs/${jobId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get user's posted jobs
 */
export const getMyJobs = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await client.get(`/jobs/my-jobs?${queryParams.toString()}`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Apply for job (writers only)
 */
export const applyForJob = async (jobId, applicationData) => {
  try {
    const response = await client.post(`/jobs/${jobId}/apply`, applicationData);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Accept application (job owner only)
 */
export const acceptApplication = async (jobId, applicationId) => {
  try {
    const response = await client.put(`/jobs/${jobId}/accept-application/${applicationId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Upload job attachment
 */
export const uploadJobAttachment = async (jobId, file) => {
  try {
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await client.post(`/jobs/${jobId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get job pricing information
 */
export const getJobPricing = async () => {
  try {
    const response = await client.get('/jobs/pricing');
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Search jobs
 */
export const searchJobs = async (searchQuery, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('q', searchQuery);
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(`filters[${key}]`, filters[key]);
      }
    });
    
    const response = await client.get(`/jobs/search?${queryParams.toString()}`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get job statistics (admin only)
 */
export const getJobStats = async () => {
  try {
    const response = await client.get('/jobs/stats/overview');
    return response;
  } catch (error) {
    throw error;
  }
};

// ==========================================
// JOB UTILITY FUNCTIONS
// ==========================================

/**
 * Validate job budget against pricing rules
 */
export const validateJobBudget = (jobType, amount, currency = 'NGN') => {
  const pricing = {
    'full-project': { minAmount: 80000, currency: 'NGN' },
    'it_Report': { minAmount: 20000, currency: 'NGN' },
    'term-paper': { minAmount: 25000, currency: 'NGN' },
    'chapter': { minAmount: 30000, currency: 'NGN' },
    'assignment': { minAmount: 10000, currency: 'NGN' }
  };

  const jobPricing = pricing[jobType];
  if (!jobPricing) {
    return { valid: false, message: 'Invalid job type' };
  }

  // Convert to NGN for validation (simplified conversion)
  let amountInNGN = amount;
  if (currency !== 'NGN') {
    if (currency === 'USD') {
      amountInNGN = amount * 1500; // 1 USD = 1500 NGN
    }
    // Add other currency conversions as needed
  }

  if (amountInNGN < jobPricing.minAmount) {
    return {
      valid: false,
      message: `Minimum amount for ${jobType.replace('-', ' ')} is ${jobPricing.minAmount} NGN`,
      minAmount: jobPricing.minAmount
    };
  }

  return { valid: true };
};

/**
 * Format job budget for display
 */
export const formatJobBudget = (amount, currency = 'NGN') => {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(amount);
};

/**
 * Calculate time remaining until deadline
 */
export const getTimeRemaining = (deadline) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
};

/**
 * Get urgency level based on deadline
 */
export const getUrgencyLevel = (deadline) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();
  const hours = diff / (1000 * 60 * 60);
  
  if (hours <= 24) return 'urgent';
  if (hours <= 72) return 'high';
  if (hours <= 168) return 'medium';
  return 'low';
};

/**
 * Get urgency color for UI
 */
export const getUrgencyColor = (urgencyLevel) => {
  const colors = {
    urgent: '#ff4d4f',
    high: '#fa8c16',
    medium: '#faad14',
    low: '#52c41a'
  };
  
  return colors[urgencyLevel] || '#d9d9d9';
};

/**
 * Get job type display name
 */
export const getJobTypeDisplayName = (jobType) => {
  const displayNames = {
    'full-project': 'Full Project',
    'it_Report': 'IT/SIWES Report',
    'term-paper': 'Term Paper',
    'chapter': 'Chapter',
    'assignment': 'Assignment'
  };
  
  return displayNames[jobType] || jobType;
};

/**
 * Get academic level display name
 */
export const getAcademicLevelDisplayName = (level) => {
  const displayNames = {
    'undergraduate': 'Undergraduate',
    'masters': 'Masters',
    'phd': 'PhD',
    'professional': 'Professional'
  };
  
  return displayNames[level] || level;
};

/**
 * Get job status display name
 */
export const getJobStatusDisplayName = (status) => {
  const displayNames = {
    'open': 'Open',
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  
  return displayNames[status] || status;
};

/**
 * Get job status color
 */
export const getJobStatusColor = (status) => {
  const colors = {
    'open': '#52c41a',
    'in-progress': '#1890ff',
    'completed': '#722ed1',
    'cancelled': '#ff4d4f'
  };
  
  return colors[status] || '#d9d9d9';
};

/**
 * Check if user can edit job
 */
export const canEditJob = (job, user) => {
  if (!job || !user) return false;
  
  // Only job owner can edit
  if (job.postedBy._id !== user._id) return false;
  
  // Cannot edit if job is in progress or completed
  if (['in-progress', 'completed'].includes(job.status)) return false;
  
  return true;
};

/**
 * Check if user can delete job
 */
export const canDeleteJob = (job, user) => {
  if (!job || !user) return false;
  
  // Only job owner can delete
  if (job.postedBy._id !== user._id) return false;
  
  // Cannot delete if job is in progress or completed
  if (['in-progress', 'completed'].includes(job.status)) return false;
  
  return true;
};

/**
 * Check if user can apply for job
 */
export const canApplyForJob = (job, user) => {
  if (!job || !user) return false;
  
  // Only writers can apply
  if (user.role !== 'writer') return false;
  
  // Cannot apply for own job
  if (job.postedBy._id === user._id) return false;
  
  // Job must be open
  if (job.status !== 'open') return false;
  
  // Check if already applied
  const hasApplied = job.applications.some(app => app.writer._id === user._id);
  if (hasApplied) return false;
  
  return true;
};

/**
 * Get user's application for a job
 */
export const getUserApplication = (job, userId) => {
  if (!job || !userId) return null;
  
  return job.applications.find(app => app.writer._id === userId);
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file type icon
 */
export const getFileTypeIcon = (fileType) => {
  if (fileType.includes('pdf')) return 'file-pdf';
  if (fileType.includes('word') || fileType.includes('document')) return 'file-word';
  if (fileType.includes('image')) return 'file-image';
  if (fileType.includes('video')) return 'file-video';
  if (fileType.includes('audio')) return 'file-audio';
  return 'file';
};

// Export all functions
export const jobApi = {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
  applyForJob,
  acceptApplication,
  uploadJobAttachment,
  getJobPricing,
  searchJobs,
  getJobStats,
  validateJobBudget,
  formatJobBudget,
  getTimeRemaining,
  getUrgencyLevel,
  getUrgencyColor,
  getJobTypeDisplayName,
  getAcademicLevelDisplayName,
  getJobStatusDisplayName,
  getJobStatusColor,
  canEditJob,
  canDeleteJob,
  canApplyForJob,
  getUserApplication,
  formatFileSize,
  getFileTypeIcon
};

export default jobApi;
