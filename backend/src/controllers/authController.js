const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendOTP, formatMobileNumber, isValidMobileNumber } = require('../utils/otpService');
const { generateTokenPair, createJWTPayload } = require('../utils/jwtUtils');
const { asyncHandler, AppError, validationError, authError } = require('../middleware/errorHandler');

/**
 * @desc    Send OTP to mobile number
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const sendOTPController = asyncHandler(async (req, res, next) => {
  const { mobileNumber, purpose = 'login' } = req.body;

  // Format and validate mobile number
  const formattedMobile = formatMobileNumber(mobileNumber);
  
  if (!isValidMobileNumber(formattedMobile)) {
    return next(validationError('Please enter a valid 10-digit mobile number'));
  }

  // Check rate limiting
  const rateLimit = await OTP.checkRateLimit(formattedMobile, 1, 3); // Max 3 OTPs per minute
  
  if (!rateLimit.allowed) {
    return next(new AppError(
      `Too many OTP requests. You can request ${rateLimit.maxAllowed} OTPs per ${rateLimit.timeWindow} minute(s). Please try again later.`,
      429
    ));
  }

  // For registration, check if user doesn't exist
  if (purpose === 'registration') {
    const existingUser = await User.findOne({ mobileNumber: formattedMobile });
    if (existingUser) {
      return next(new AppError('Mobile number already registered. Use login instead.', 409));
    }
  }

  // For login, check if user exists
  if (purpose === 'login') {
    const existingUser = await User.findOne({ mobileNumber: formattedMobile });
    if (!existingUser) {
      return next(new AppError('Mobile number not registered. Please register first.', 404));
    }
    
    if (!existingUser.isActive) {
      return next(new AppError('Account is deactivated. Contact support.', 403));
    }
  }

  // Generate OTP
  const otpCode = OTP.generateOTP();
  
  // Save OTP to database
  const otpRecord = new OTP({
    mobileNumber: formattedMobile,
    otp: otpCode,
    purpose,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
  });
  
  await otpRecord.save();

  try {
    // Send OTP via SMS/Email
    const user = await User.findOne({ mobileNumber: formattedMobile });
    const sendResult = await sendOTP({
      mobileNumber: formattedMobile,
      email: user?.email,
      otp: otpCode,
      purpose,
    });

    res.status(200).json({
      success: true,
      message: `OTP sent successfully via ${sendResult.primaryMethod}`,
      data: {
        mobileNumber: formattedMobile,
        purpose,
        expiresIn: `${process.env.OTP_EXPIRE_MINUTES || 5} minutes`,
        sentVia: sendResult.primaryMethod,
        otpId: otpRecord._id, // For development/testing - remove in production
        ...(process.env.NODE_ENV === 'development' && { otp: otpCode }), // Only for development
      },
    });
  } catch (error) {
    // Delete OTP record if sending failed
    await OTP.findByIdAndDelete(otpRecord._id);
    
    console.error('OTP sending failed:', error);
    return next(new AppError('Failed to send OTP. Please try again.', 500));
  }
});

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOTPController = asyncHandler(async (req, res, next) => {
  const { mobileNumber, otp, purpose = 'login' } = req.body;

  // Format mobile number
  const formattedMobile = formatMobileNumber(mobileNumber);

  // Find the latest valid OTP for this mobile number
  const otpRecord = await OTP.findValidOTP(formattedMobile, purpose);
  
  if (!otpRecord) {
    return next(new AppError('No valid OTP found. Please request a new OTP.', 400));
  }

  // Verify OTP
  const verification = otpRecord.isValidOTP(otp);
  
  if (!verification.valid) {
    // Increment attempts
    await otpRecord.incrementAttempts();
    return next(new AppError(verification.reason, 400));
  }

  // Mark OTP as used
  await otpRecord.markAsUsed();

  // Handle different purposes
  let user;
  let isNewUser = false;

  if (purpose === 'registration') {
    // For registration, create a new user or update existing unverified user
    user = await User.findOne({ mobileNumber: formattedMobile });
    
    if (!user) {
      return next(new AppError('Registration data not found. Please start registration process again.', 400));
    }
    
    // Mark user as verified
    user.isVerified = true;
    await user.save();
    isNewUser = true;
  } else if (purpose === 'login') {
    // For login, find existing user
    user = await User.findOne({ mobileNumber: formattedMobile });
    
    if (!user) {
      return next(new AppError('User not found. Please register first.', 404));
    }
    
    if (!user.isActive) {
      return next(new AppError('Account is deactivated. Contact support.', 403));
    }
    
    // Update last login
    await user.updateLoginAttempts(true);
  }

  // Generate JWT tokens
  const tokenPair = generateTokenPair(user._id, user.role, user.mobileNumber);

  // Prepare user data for response
  const userData = {
    id: user._id,
    name: user.name,
    mobileNumber: user.mobileNumber,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    lastLogin: user.lastLogin,
    profile: user.profile,
    ...(user.role === 'doctor' && { doctorInfo: user.doctorInfo }),
    ...(user.role === 'patient' && { patientInfo: user.patientInfo }),
  };

  res.status(200).json({
    success: true,
    message: isNewUser ? 'Registration completed successfully' : 'Login successful',
    data: {
      user: userData,
      tokens: tokenPair,
      isNewUser,
    },
  });
});

/**
 * @desc    Login with mobile number (send OTP)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginController = asyncHandler(async (req, res, next) => {
  const { mobileNumber } = req.body;

  // Format mobile number
  const formattedMobile = formatMobileNumber(mobileNumber);

  // Check if user exists
  const user = await User.findOne({ mobileNumber: formattedMobile });
  
  if (!user) {
    return next(new AppError('Mobile number not registered. Please register first.', 404));
  }

  if (!user.isActive) {
    return next(new AppError('Account is deactivated. Contact support.', 403));
  }

  // Check if account is temporarily locked
  if (user.loginAttempts.lockedUntil && user.loginAttempts.lockedUntil > Date.now()) {
    const unlockTime = new Date(user.loginAttempts.lockedUntil);
    return next(new AppError(
      `Account temporarily locked due to too many failed attempts. Try again after ${unlockTime.toLocaleTimeString()}.`,
      423
    ));
  }

  // Set purpose and call sendOTP
  req.body.purpose = 'login';
  return sendOTPController(req, res, next);
});

/**
 * @desc    Register new user (create user and send OTP)
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerController = asyncHandler(async (req, res, next) => {
  const { mobileNumber, name, email, role = 'patient' } = req.body;

  // Format mobile number
  const formattedMobile = formatMobileNumber(mobileNumber);

  // Check if user already exists
  const existingUser = await User.findOne({ 
    $or: [
      { mobileNumber: formattedMobile },
      ...(email ? [{ email }] : []),
    ]
  });

  if (existingUser) {
    if (existingUser.mobileNumber === formattedMobile) {
      return next(new AppError('Mobile number already registered. Use login instead.', 409));
    }
    if (existingUser.email === email) {
      return next(new AppError('Email already registered.', 409));
    }
  }

  // Create new user (unverified)
  const userData = {
    mobileNumber: formattedMobile,
    name: name.trim(),
    role,
    isVerified: false,
  };

  if (email) {
    userData.email = email.toLowerCase();
  }

  const user = new User(userData);
  await user.save();

  // Send OTP for verification
  req.body.mobileNumber = formattedMobile;
  req.body.purpose = 'registration';
  return sendOTPController(req, res, next);
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMeController = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v');
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        profile: user.profile,
        ...(user.role === 'doctor' && { doctorInfo: user.doctorInfo }),
        ...(user.role === 'patient' && { patientInfo: user.patientInfo }),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutController = asyncHandler(async (req, res, next) => {
  // In a production app, you would typically:
  // 1. Add the token to a blacklist
  // 2. Remove refresh token from database
  // 3. Update user's device info
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshTokenController = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400));
  }

  try {
    const { refreshAccessToken } = require('../utils/jwtUtils');
    
    // This would typically validate the refresh token from database
    // For now, we'll verify it and generate new tokens
    const decoded = require('jsonwebtoken').verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return next(new AppError('Invalid refresh token', 401));
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive || !user.isVerified) {
      return next(new AppError('User not found or inactive', 401));
    }

    const tokenPair = generateTokenPair(user._id, user.role, user.mobileNumber);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: { tokens: tokenPair },
    });
  } catch (error) {
    return next(new AppError('Invalid refresh token', 401));
  }
});

module.exports = {
  sendOTPController,
  verifyOTPController,
  loginController,
  registerController,
  getMeController,
  logoutController,
  refreshTokenController,
};
