import { ErrorTypes } from '../utils/error.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    type: err.type
  });

  // Handle Stripe errors
  if (err.type === 'StripeError') {
    return res.status(400).json({
      message: err.message || 'Payment processing error',
      type: err.type
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: Object.values(err.errors).map(e => e.message).join(', '),
      type: 'ValidationError'
    });
  }

  // Handle custom error types
  if (err.type && ErrorTypes[err.type]) {
    return res.status(ErrorTypes[err.type].status).json({
      message: err.message || ErrorTypes[err.type].message,
      type: err.type
    });
  }

  // Handle unknown errors
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    type: 'ServerError'
  });
}; 