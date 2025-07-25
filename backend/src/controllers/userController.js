const User = require('../models/User');
const { asyncHandler, AppError, notFoundError, forbiddenError } = require('../middleware/errorHandler');

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 10, 
    role, 
    isActive, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    search 
  } = req.query;

  // Build filter object
  const filter = {};
  
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { mobileNumber: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Execute query
  const users = await User.find(filter)
    .select('-__v')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count
  const total = await User.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit),
      },
    },
  });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-__v');
  
  if (!user) {
    return next(notFoundError('User not found'));
  }

  // Patients can only view their own profile
  if (req.user.role === 'patient' && req.user.id !== user._id.toString()) {
    return next(forbiddenError('Access denied'));
  }

  res.status(200).json({
    success: true,
    data: { user },
  });
});

/**
 * @desc    Create new user (admin only)
 * @route   POST /api/users
 * @access  Private/Admin
 */
const createUser = asyncHandler(async (req, res, next) => {
  const { 
    mobileNumber, 
    name, 
    email, 
    role = 'patient',
    profile,
    doctorInfo,
    patientInfo,
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { mobileNumber },
      ...(email ? [{ email }] : []),
    ],
  });

  if (existingUser) {
    if (existingUser.mobileNumber === mobileNumber) {
      return next(new AppError('Mobile number already registered', 409));
    }
    if (existingUser.email === email) {
      return next(new AppError('Email already registered', 409));
    }
  }

  // Create user data
  const userData = {
    mobileNumber,
    name: name.trim(),
    role,
    isVerified: true, // Admin-created users are auto-verified
    isActive: true,
  };

  if (email) userData.email = email.toLowerCase();
  if (profile) userData.profile = profile;
  if (role === 'doctor' && doctorInfo) userData.doctorInfo = doctorInfo;
  if (role === 'patient' && patientInfo) userData.patientInfo = patientInfo;

  const user = new User(userData);
  await user.save();

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { user },
  });
});

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private
 */
const updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(notFoundError('User not found'));
  }

  // Check permissions
  const canUpdate = 
    req.user.role === 'admin' || 
    req.user.id === user._id.toString();

  if (!canUpdate) {
    return next(forbiddenError('Access denied'));
  }

  // Only admin can update certain fields
  const adminOnlyFields = ['role', 'isActive', 'isVerified'];
  const updateData = { ...req.body };

  if (req.user.role !== 'admin') {
    adminOnlyFields.forEach(field => {
      delete updateData[field];
    });
  }

  // Don't allow mobile number update after verification
  if (user.isVerified && updateData.mobileNumber) {
    delete updateData.mobileNumber;
  }

  // Update user
  Object.assign(user, updateData);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: { user },
  });
});

/**
 * @desc    Delete user (admin only)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(notFoundError('User not found'));
  }

  // Prevent admin from deleting themselves
  if (req.user.id === user._id.toString()) {
    return next(new AppError('Cannot delete your own account', 400));
  }

  // Soft delete by deactivating
  user.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully',
  });
});

/**
 * @desc    Get doctors
 * @route   GET /api/users/doctors
 * @access  Private
 */
const getDoctors = asyncHandler(async (req, res, next) => {
  const { specialization, isAvailable = true } = req.query;

  const filter = {
    role: 'doctor',
    isActive: true,
    isVerified: true,
  };

  if (specialization) {
    filter['doctorInfo.specialization'] = { $regex: specialization, $options: 'i' };
  }

  const doctors = await User.find(filter)
    .select('name mobileNumber email doctorInfo profile.address')
    .sort({ 'doctorInfo.specialization': 1, name: 1 });

  res.status(200).json({
    success: true,
    data: { doctors },
  });
});

/**
 * @desc    Get doctor availability
 * @route   GET /api/users/doctors/:id/availability
 * @access  Private
 */
const getDoctorAvailability = asyncHandler(async (req, res, next) => {
  const { date } = req.query;
  const doctorId = req.params.id;

  const doctor = await User.findById(doctorId);
  
  if (!doctor || doctor.role !== 'doctor') {
    return next(notFoundError('Doctor not found'));
  }

  if (!doctor.isActive || !doctor.isVerified) {
    return next(new AppError('Doctor is not available', 400));
  }

  const targetDate = date ? new Date(date) : new Date();
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][targetDate.getDay()];
  
  const schedule = doctor.doctorInfo.schedule?.find(s => s.day === dayName && s.isAvailable);

  if (!schedule) {
    return res.status(200).json({
      success: true,
      data: {
        available: false,
        reason: 'Doctor not available on this day',
        date: targetDate,
        day: dayName,
      },
    });
  }

  // Get booked appointments for this date
  const Appointment = require('../models/Appointment');
  const appointments = await Appointment.find({
    doctor: doctorId,
    appointmentDate: {
      $gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
      $lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1),
    },
    status: { $nin: ['cancelled', 'no-show'] },
  }).select('appointmentTime duration');

  const bookedSlots = appointments.map(apt => ({
    startTime: apt.appointmentTime,
    endTime: apt.endTime,
  }));

  res.status(200).json({
    success: true,
    data: {
      available: true,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        specialization: doctor.doctorInfo.specialization,
        consultationFee: doctor.doctorInfo.consultationFee,
      },
      schedule: {
        day: dayName,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      },
      bookedSlots,
      date: targetDate,
    },
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(notFoundError('User not found'));
  }

  const allowedUpdates = ['name', 'email', 'profile', 'doctorInfo', 'patientInfo'];
  const updateData = {};

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  // Role-specific validation
  if (updateData.doctorInfo && user.role !== 'doctor') {
    delete updateData.doctorInfo;
  }

  if (updateData.patientInfo && user.role !== 'patient') {
    delete updateData.patientInfo;
  }

  Object.assign(user, updateData);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  });
});

/**
 * @desc    Get user statistics (admin only)
 * @route   GET /api/users/stats
 * @access  Private/Admin
 */
const getUserStats = asyncHandler(async (req, res, next) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: { $sum: { $cond: ['$isActive', 1, 0] } },
        verified: { $sum: { $cond: ['$isVerified', 1, 0] } },
      },
    },
  ]);

  const totalUsers = await User.countDocuments();
  const recentUsers = await User.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
  });

  res.status(200).json({
    success: true,
    data: {
      total: totalUsers,
      recent: recentUsers,
      byRole: stats,
    },
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getDoctors,
  getDoctorAvailability,
  updateProfile,
  getUserStats,
};
