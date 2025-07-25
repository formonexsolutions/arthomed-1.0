const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { extractTokenFromHeader, verifyToken } = require('../utils/jwtUtils');

/**
 * Middleware to authenticate JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Find user and check if still exists and is active
    const user = await User.findById(decoded.id).select('-__v');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.',
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Mobile number not verified.',
      });
    }

    // Add user to request object
    req.user = {
      id: user._id,
      mobileNumber: user.mobileNumber,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.message === 'Token has expired') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
        code: 'TOKEN_EXPIRED',
      });
    }
    
    if (error.message === 'Invalid token') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
        code: 'INVALID_TOKEN',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Middleware to authorize user roles
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Function} - Express middleware function
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        userRole: req.user.role,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user can access specific resource
 * Used for patients to access only their own data
 */
const authorizeOwnerOrAdmin = (resourceUserIdField = 'patient') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
      }

      // Admin and staff can access all resources
      if (['admin', 'doctor', 'receptionist'].includes(req.user.role)) {
        return next();
      }

      // For patients, check if they're accessing their own resource
      if (req.user.role === 'patient') {
        const resourceUserId = req.params.id || req.params.userId || req.body[resourceUserIdField];
        
        if (resourceUserId && resourceUserId.toString() !== req.user.id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You can only access your own data.',
          });
        }
        
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed.',
      });
    }
  };
};

/**
 * Optional authentication middleware
 * Adds user info to request if token is valid, but doesn't require authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-__v');
      
      if (user && user.isActive && user.isVerified) {
        req.user = {
          id: user._id,
          mobileNumber: user.mobileNumber,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive,
        };
      }
    }
    
    next();
  } catch (error) {
    // Ignore authentication errors in optional auth
    next();
  }
};

/**
 * Middleware to check if user has admin role
 */
const requireAdmin = authorize('admin');

/**
 * Middleware to check if user has doctor role
 */
const requireDoctor = authorize('doctor');

/**
 * Middleware to check if user has patient role
 */
const requirePatient = authorize('patient');

/**
 * Middleware to check if user has receptionist role
 */
const requireReceptionist = authorize('receptionist');

/**
 * Middleware to check if user has doctor or receptionist role
 */
const requireStaff = authorize('doctor', 'receptionist');

/**
 * Middleware to check if user has admin or doctor role
 */
const requireAdminOrDoctor = authorize('admin', 'doctor');

/**
 * Middleware to check if user has admin or receptionist role
 */
const requireAdminOrReceptionist = authorize('admin', 'receptionist');

/**
 * Middleware to validate API key (for external integrations)
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key required.',
    });
  }
  
  // In production, you would validate against a database of API keys
  const validApiKeys = (process.env.API_KEYS || '').split(',').filter(Boolean);
  
  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key.',
    });
  }
  
  next();
};

module.exports = {
  authenticate,
  authorize,
  authorizeOwnerOrAdmin,
  optionalAuth,
  requireAdmin,
  requireDoctor,
  requirePatient,
  requireReceptionist,
  requireStaff,
  requireAdminOrDoctor,
  requireAdminOrReceptionist,
  validateApiKey,
};
