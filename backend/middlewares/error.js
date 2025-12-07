import ErrorResponse from '../utils/errorResponse.js';

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.log(err);

  // 🔥 CRITICAL: Don't try to send response if headers already sent (streaming endpoints)
  if (res.headersSent) {
    console.error('❌ Cannot send error response - headers already sent for streaming endpoint');
    return;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  // 🔥 SAFE RESPONSE SEND
  try {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  } catch (responseError) {
    console.error('❌ Error sending error response:', responseError.message);
  }
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export { errorHandler, notFound };