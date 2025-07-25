/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = 'Duplicate field value entered';
    
    // Extract field name from error
    const field = Object.keys(err.keyValue)[0];
    if (field === 'mobileNumber') {
      message = 'Mobile number already registered';
    } else if (field === 'email') {
      message = 'Email already registered';
    }
    
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Rate limiting error
  if (err.message && err.message.includes('Too many requests')) {
    error = { message: err.message, statusCode: 429 };
  }

  // Request timeout
  if (err.code === 'ETIMEDOUT') {
    const message = 'Request timeout';
    error = { message, statusCode: 408 };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, statusCode: 413 };
  }

  // Database connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    const message = 'Database connection error';
    error = { message, statusCode: 503 };
  }

  // Custom application errors
  if (err.isOperational) {
    error = { message: err.message, statusCode: err.statusCode || 400 };
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err,
      stack: err.stack,
    }),
  });
};

/**
 * Handle 404 errors for undefined routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

/**
 * Create custom error class
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error wrapper to catch async errors
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Validation error helper
 */
const validationError = (message, field = null) => {
  const error = new AppError(message, 400);
  if (field) error.field = field;
  return error;
};

/**
 * Authentication error helper
 */
const authError = (message = 'Authentication failed') => {
  return new AppError(message, 401);
};

/**
 * Authorization error helper
 */
const forbiddenError = (message = 'Access forbidden') => {
  return new AppError(message, 403);
};

/**
 * Not found error helper
 */
const notFoundError = (message = 'Resource not found') => {
  return new AppError(message, 404);
};

/**
 * Conflict error helper
 */
const conflictError = (message = 'Resource conflict') => {
  return new AppError(message, 409);
};

/**
 * Server error helper
 */
const serverError = (message = 'Internal server error') => {
  return new AppError(message, 500);
};

module.exports = {
  errorHandler,
  notFound,
  AppError,
  asyncHandler,
  validationError,
  authError,
  forbiddenError,
  notFoundError,
  conflictError,
  serverError,
};
