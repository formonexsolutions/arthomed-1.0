const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'],
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
    length: 6,
  },
  purpose: {
    type: String,
    enum: ['registration', 'login', 'password_reset'],
    default: 'login',
  },
  attempts: {
    type: Number,
    default: 0,
  },
  maxAttempts: {
    type: Number,
    default: 3,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + (parseInt(process.env.OTP_EXPIRE_MINUTES) || 5) * 60 * 1000);
    },
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  verifiedAt: Date,
  ipAddress: String,
  userAgent: String,
}, {
  timestamps: true,
});

// Indexes for better performance
otpSchema.index({ mobileNumber: 1, createdAt: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic cleanup

// Pre-save middleware to ensure OTP is always 6 digits
otpSchema.pre('save', function(next) {
  if (this.isModified('otp')) {
    // Ensure OTP is exactly 6 digits
    this.otp = this.otp.toString().padStart(6, '0');
  }
  next();
});

// Instance method to check if OTP is valid
otpSchema.methods.isValidOTP = function(providedOTP) {
  // Check if OTP has expired
  if (this.expiresAt < new Date()) {
    return { valid: false, reason: 'OTP has expired' };
  }
  
  // Check if OTP has been used
  if (this.isUsed) {
    return { valid: false, reason: 'OTP has already been used' };
  }
  
  // Check if maximum attempts exceeded
  if (this.attempts >= this.maxAttempts) {
    return { valid: false, reason: 'Maximum verification attempts exceeded' };
  }
  
  // Check if OTP matches
  if (this.otp !== providedOTP.toString()) {
    return { valid: false, reason: 'Invalid OTP' };
  }
  
  return { valid: true };
};

// Instance method to mark OTP as used
otpSchema.methods.markAsUsed = function() {
  this.isUsed = true;
  this.verifiedAt = new Date();
  return this.save();
};

// Instance method to increment attempts
otpSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  return this.save();
};

// Static method to generate a new 6-digit OTP
otpSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to find valid OTP for a mobile number
otpSchema.statics.findValidOTP = function(mobileNumber, purpose = 'login') {
  return this.findOne({
    mobileNumber,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: 3 },
  }).sort({ createdAt: -1 }); // Get the latest OTP
};

// Static method to cleanup expired OTPs (called manually or via cron job)
otpSchema.statics.cleanupExpiredOTPs = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isUsed: true },
      { attempts: { $gte: 3 } },
    ],
  });
};

// Static method to check rate limiting for OTP generation
otpSchema.statics.checkRateLimit = async function(mobileNumber, timeWindowMinutes = 1, maxOTPs = 3) {
  const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
  const recentOTPs = await this.countDocuments({
    mobileNumber,
    createdAt: { $gte: since },
  });
  
  return {
    allowed: recentOTPs < maxOTPs,
    count: recentOTPs,
    maxAllowed: maxOTPs,
    timeWindow: timeWindowMinutes,
  };
};

module.exports = mongoose.model('OTP', otpSchema);
