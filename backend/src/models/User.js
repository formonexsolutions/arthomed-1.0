const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'],
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'receptionist', 'patient'],
    default: 'patient',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  profile: {
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    emergencyContact: {
      name: String,
      relationship: String,
      mobile: String,
    },
  },
  // Doctor-specific fields
  doctorInfo: {
    specialization: String,
    qualification: String,
    experience: Number, // in years
    consultationFee: Number,
    schedule: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
      startTime: String, // HH:MM format
      endTime: String,   // HH:MM format
      isAvailable: { type: Boolean, default: true },
    }],
    registrationNumber: String,
  },
  // Patient-specific fields
  patientInfo: {
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    allergies: [String],
    chronicConditions: [String],
    insuranceInfo: {
      provider: String,
      policyNumber: String,
      validTill: Date,
    },
  },
  loginAttempts: {
    count: { type: Number, default: 0 },
    lastAttempt: Date,
    lockedUntil: Date,
  },
  lastLogin: Date,
  deviceInfo: [{
    deviceId: String,
    deviceType: String,
    lastLogin: Date,
    isActive: { type: Boolean, default: true },
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'doctorInfo.specialization': 1 });
userSchema.index({ isActive: 1, isVerified: 1 });

// Virtual for user's age
userSchema.virtual('age').get(function() {
  if (this.profile.dateOfBirth) {
    return Math.floor((Date.now() - this.profile.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }
  return null;
});

// Pre-save middleware to hash passwords (if password field is added later)
userSchema.pre('save', async function(next) {
  // Only run if mobile number is modified (for OTP verification)
  if (!this.isModified('mobileNumber')) {
    return next();
  }
  next();
});

// Instance method to check if user can login
userSchema.methods.canLogin = function() {
  if (!this.isActive) {
    throw new Error('Account is deactivated');
  }
  
  if (!this.isVerified) {
    throw new Error('Mobile number not verified');
  }
  
  if (this.loginAttempts.lockedUntil && this.loginAttempts.lockedUntil > Date.now()) {
    throw new Error('Account temporarily locked due to too many failed attempts');
  }
  
  return true;
};

// Instance method to update login attempts
userSchema.methods.updateLoginAttempts = function(isSuccess = false) {
  if (isSuccess) {
    // Reset login attempts on successful login
    this.loginAttempts.count = 0;
    this.loginAttempts.lockedUntil = undefined;
    this.lastLogin = new Date();
  } else {
    // Increment failed attempts
    this.loginAttempts.count += 1;
    this.loginAttempts.lastAttempt = new Date();
    
    // Lock account after 5 failed attempts for 30 minutes
    if (this.loginAttempts.count >= 5) {
      this.loginAttempts.lockedUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
    }
  }
  
  return this.save();
};

// Static method to find doctors by specialization
userSchema.statics.findDoctorsBySpecialization = function(specialization) {
  return this.find({
    role: 'doctor',
    isActive: true,
    isVerified: true,
    'doctorInfo.specialization': { $regex: specialization, $options: 'i' },
  }).select('name mobileNumber email doctorInfo profile.address');
};

// Static method to find available doctors for a specific day and time
userSchema.statics.findAvailableDoctors = function(day, time) {
  return this.find({
    role: 'doctor',
    isActive: true,
    isVerified: true,
    'doctorInfo.schedule': {
      $elemMatch: {
        day: day.toLowerCase(),
        isAvailable: true,
        startTime: { $lte: time },
        endTime: { $gte: time },
      },
    },
  }).select('name mobileNumber doctorInfo.specialization doctorInfo.consultationFee doctorInfo.schedule');
};

module.exports = mongoose.model('User', userSchema);
