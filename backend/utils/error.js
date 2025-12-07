/**
 * Custom error creation utility for consistent error handling across the application.
 * @module utils/error
 */

import expressAsyncHandler from 'express-async-handler';

/**
 * Creates a standardized error object with status code and message.
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @returns {Error} Custom error object with status and message
 */
export const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * Predefined error types for common scenarios
 * @type {Object.<string, {status: number, message: string}>}
 */
export const ErrorTypes = {
  UNAUTHORIZED: {
    status: 401,
    message: 'Authentication required'
  },
  FORBIDDEN: {
    status: 403,
    message: 'Access denied'
  },
  NOT_FOUND: {
    status: 404,
    message: 'Resource not found'
  },
  VALIDATION_ERROR: {
    status: 400,
    message: 'Validation failed'
  },
  SERVER_ERROR: {
    status: 500,
    message: 'Internal server error'
  },
  PAYMENT_FAILED: {
    status: 402,
    message: 'Payment failed'
  }
};

/**
 * Creates an error response object
 * @param {Error} error - Error object
 * @returns {Object} Formatted error response
 */
export const formatErrorResponse = (error) => ({
  success: false,
  status: error.status || 500,
  message: error.message || 'An unexpected error occurred',
  timestamp: new Date().toISOString()
});

/**
 * Async error handler wrapper for route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
export const asyncHandler = expressAsyncHandler; 