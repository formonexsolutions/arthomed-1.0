const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @param {string} mobileNumber - User mobile number
 * @returns {string} - JWT token
 */
const generateToken = (userId, role, mobileNumber) => {
  const payload = {
    id: userId,
    role,
    mobileNumber,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Generate refresh token for user
 * @param {string} userId - User ID
 * @returns {string} - Refresh token
 */
const generateRefreshToken = (userId) => {
  const payload = {
    id: userId,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '30d', // Refresh tokens last longer
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} - Extracted token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

/**
 * Check if token is expired
 * @param {Object} decodedToken - Decoded JWT token
 * @returns {boolean} - Is token expired
 */
const isTokenExpired = (decodedToken) => {
  if (!decodedToken.exp) return false;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decodedToken.exp < currentTime;
};

/**
 * Get token expiration time
 * @param {Object} decodedToken - Decoded JWT token
 * @returns {Date|null} - Expiration date or null
 */
const getTokenExpiration = (decodedToken) => {
  if (!decodedToken.exp) return null;
  
  return new Date(decodedToken.exp * 1000);
};

/**
 * Generate token pair (access + refresh)
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @param {string} mobileNumber - User mobile number
 * @returns {Object} - Token pair
 */
const generateTokenPair = (userId, role, mobileNumber) => {
  const accessToken = generateToken(userId, role, mobileNumber);
  const refreshToken = generateRefreshToken(userId);
  
  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: process.env.JWT_EXPIRE || '7d',
  };
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @param {Object} userData - User data for new token
 * @returns {Object} - New token pair
 */
const refreshAccessToken = (refreshToken, userData) => {
  try {
    const decoded = verifyToken(refreshToken);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }
    
    return generateTokenPair(userData.id, userData.role, userData.mobileNumber);
  } catch (error) {
    throw new Error('Refresh token verification failed: ' + error.message);
  }
};

/**
 * Create JWT payload for user
 * @param {Object} user - User object
 * @returns {Object} - JWT payload
 */
const createJWTPayload = (user) => {
  return {
    id: user._id,
    role: user.role,
    mobileNumber: user.mobileNumber,
    name: user.name,
    isVerified: user.isVerified,
  };
};

/**
 * Validate JWT secret
 * @returns {boolean} - Is JWT secret configured
 */
const validateJWTConfig = () => {
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is not configured in environment variables');
    return false;
  }
  
  if (process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET should be at least 32 characters long for security');
  }
  
  return true;
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  extractTokenFromHeader,
  isTokenExpired,
  getTokenExpiration,
  generateTokenPair,
  refreshAccessToken,
  createJWTPayload,
  validateJWTConfig,
};
