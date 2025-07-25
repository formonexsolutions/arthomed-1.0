const express = require('express');
const {
  sendOTPController,
  verifyOTPController,
  loginController,
  registerController,
  getMeController,
  logoutController,
  refreshTokenController,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const {
  validateSendOTP,
  validateVerifyOTP,
  validateMobileNumber,
  validateUserRegistration,
  handleValidationErrors,
} = require('../middleware/validation');

const router = express.Router();

/**
 * @desc    Send OTP to mobile number
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
router.post(
  '/send-otp',
  validateSendOTP(),
  handleValidationErrors,
  sendOTPController
);

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
router.post(
  '/verify-otp',
  validateVerifyOTP(),
  handleValidationErrors,
  verifyOTPController
);

/**
 * @desc    Login with mobile number (send OTP)
 * @route   POST /api/auth/login
 * @access  Public
 */
router.post(
  '/login',
  validateMobileNumber(),
  handleValidationErrors,
  loginController
);

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
router.post(
  '/register',
  validateUserRegistration(),
  handleValidationErrors,
  registerController
);

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
router.get('/me', authenticate, getMeController);

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
router.post('/logout', authenticate, logoutController);

/**
 * @desc    Login or Register with OTP
 * @route   POST /api/auth/login-or-register
 * @access  Public
 */
router.post(
  '/login-or-register',
  validateVerifyOTP(),
  handleValidationErrors,
  async (req, res, next) => {
    const { mobileNumber } = req.body;
    const formattedMobile = require('../utils/otpService').formatMobileNumber(mobileNumber);
    
    // Check if user exists
    const User = require('../models/User');
    const existingUser = await User.findOne({ mobileNumber: formattedMobile });
    
    if (existingUser) {
      // Existing user - perform login
      return loginController(req, res, next);
    } else {
      // New user - perform registration
      return registerController(req, res, next);
    }
  }
);

/**
 * @desc    Refresh token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
router.post('/refresh', refreshTokenController);

module.exports = router;