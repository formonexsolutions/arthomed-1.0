const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');
const User = require('../models/User');
const { sendOTP } = require('../utils/otpService');
const { asyncHandler, AppError, notFoundError, forbiddenError } = require('../middleware/errorHandler');

/**
 * @desc    Book new appointment
 * @route   POST /api/appointments
 * @access  Private/Patient
 */
const bookAppointment = asyncHandler(async (req, res, next) => {
  const {
    doctorId,
    appointmentDate,
    appointmentTime,
    reason,
    symptoms,
    priority = 'medium',
    type = 'consultation',
  } = req.body;

  // Verify doctor exists and is active
  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor' || !doctor.isActive || !doctor.isVerified) {
    return next(notFoundError('Doctor not found or not available'));
  }

  // Parse appointment date
  const apptDate = new Date(appointmentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Validate appointment date
  if (apptDate < today) {
    return next(new AppError('Cannot book appointment for past dates', 400));
  }

  // Check if appointment is more than 3 months in future
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  if (apptDate > threeMonthsFromNow) {
    return next(new AppError('Cannot book appointment more than 3 months in advance', 400));
  }

  // Check doctor availability for the day
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][apptDate.getDay()];
  const schedule = doctor.doctorInfo.schedule?.find(s => s.day === dayName && s.isAvailable);

  if (!schedule) {
    return next(new AppError(`Doctor is not available on ${dayName}`, 400));
  }

  // Check if appointment time is within doctor's working hours
  if (appointmentTime < schedule.startTime || appointmentTime > schedule.endTime) {
    return next(new AppError(
      `Appointment time must be between ${schedule.startTime} and ${schedule.endTime}`,
      400
    ));
  }

  // Check for conflicts with existing appointments
  const conflicts = await Appointment.findConflicts(
    doctorId,
    apptDate,
    appointmentTime,
    30 // Default 30 minutes duration
  );

  if (conflicts.length > 0) {
    return next(new AppError('Selected time slot is not available', 409));
  }

  // Check if patient has any pending appointments with the same doctor on the same day
  const existingAppointment = await Appointment.findOne({
    patient: req.user.id,
    doctor: doctorId,
    appointmentDate: {
      $gte: new Date(apptDate.getFullYear(), apptDate.getMonth(), apptDate.getDate()),
      $lt: new Date(apptDate.getFullYear(), apptDate.getMonth(), apptDate.getDate() + 1),
    },
    status: { $nin: ['cancelled', 'no-show', 'completed'] },
  });

  if (existingAppointment) {
    return next(new AppError('You already have an appointment with this doctor on the same day', 409));
  }

  // Create appointment
  const appointment = new Appointment({
    patient: req.user.id,
    doctor: doctorId,
    appointmentDate: apptDate,
    appointmentTime,
    reason,
    symptoms,
    priority,
    type,
    createdBy: req.user.id,
    payment: {
      amount: doctor.doctorInfo.consultationFee || 0,
      status: 'pending',
    },
  });

  await appointment.save();

  // Populate appointment with patient and doctor details
  await appointment.populate([
    { path: 'patient', select: 'name mobileNumber email profile' },
    { path: 'doctor', select: 'name mobileNumber email doctorInfo.specialization' },
  ]);

  res.status(201).json({
    success: true,
    message: 'Appointment booked successfully',
    data: { appointment },
  });
});

/**
 * @desc    Get all appointments (with filters)
 * @route   GET /api/appointments
 * @access  Private
 */
const getAllAppointments = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    status,
    doctorId,
    patientId,
    startDate,
    endDate,
    sortBy = 'appointmentDate',
    sortOrder = 'asc',
  } = req.query;

  // Build filter based on user role
  let filter = {};

  if (req.user.role === 'patient') {
    filter.patient = req.user.id;
  } else if (req.user.role === 'doctor') {
    filter.doctor = req.user.id;
  }
  // Admin and receptionist can see all appointments

  // Apply additional filters
  if (status) filter.status = status;
  if (doctorId && req.user.role !== 'doctor') filter.doctor = doctorId;
  if (patientId && req.user.role !== 'patient') filter.patient = patientId;

  // Date range filter
  if (startDate || endDate) {
    filter.appointmentDate = {};
    if (startDate) filter.appointmentDate.$gte = new Date(startDate);
    if (endDate) filter.appointmentDate.$lte = new Date(endDate);
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Execute query
  const appointments = await Appointment.find(filter)
    .populate('patient', 'name mobileNumber email profile')
    .populate('doctor', 'name mobileNumber email doctorInfo.specialization')
    .populate('createdBy', 'name role')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count
  const total = await Appointment.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      appointments,
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
 * @desc    Get appointment by ID
 * @route   GET /api/appointments/:id
 * @access  Private
 */
const getAppointmentById = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'name mobileNumber email profile patientInfo')
    .populate('doctor', 'name mobileNumber email doctorInfo')
    .populate('createdBy', 'name role')
    .populate('lastModifiedBy', 'name role');

  if (!appointment) {
    return next(notFoundError('Appointment not found'));
  }

  // Check access permissions
  const hasAccess = 
    req.user.role === 'admin' ||
    req.user.role === 'receptionist' ||
    (req.user.role === 'patient' && appointment.patient._id.toString() === req.user.id) ||
    (req.user.role === 'doctor' && appointment.doctor._id.toString() === req.user.id);

  if (!hasAccess) {
    return next(forbiddenError('Access denied'));
  }

  res.status(200).json({
    success: true,
    data: { appointment },
  });
});

/**
 * @desc    Update appointment
 * @route   PUT /api/appointments/:id
 * @access  Private
 */
const updateAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return next(notFoundError('Appointment not found'));
  }

  // Check permissions
  const canUpdate = 
    req.user.role === 'admin' ||
    req.user.role === 'receptionist' ||
    (req.user.role === 'doctor' && appointment.doctor.toString() === req.user.id) ||
    (req.user.role === 'patient' && appointment.patient.toString() === req.user.id && 
     ['scheduled', 'confirmed'].includes(appointment.status));

  if (!canUpdate) {
    return next(forbiddenError('Cannot update this appointment'));
  }

  // Prepare update data based on user role
  const updateData = { ...req.body };
  updateData.lastModifiedBy = req.user.id;

  // Patients can only update limited fields and only before confirmation
  if (req.user.role === 'patient') {
    const allowedFields = ['reason', 'symptoms', 'notes.patient'];
    const filteredData = {};
    allowedFields.forEach(field => {
      if (field in updateData) {
        if (field === 'notes.patient') {
          filteredData.notes = { ...appointment.notes, patient: updateData.notes?.patient };
        } else {
          filteredData[field] = updateData[field];
        }
      }
    });
    Object.assign(updateData, filteredData);
  }

  // If updating appointment time/date, check for conflicts
  if (updateData.appointmentDate || updateData.appointmentTime) {
    const newDate = updateData.appointmentDate ? new Date(updateData.appointmentDate) : appointment.appointmentDate;
    const newTime = updateData.appointmentTime || appointment.appointmentTime;

    const conflicts = await Appointment.findConflicts(
      appointment.doctor,
      newDate,
      newTime,
      appointment.duration,
      appointment._id
    );

    if (conflicts.length > 0) {
      return next(new AppError('Selected time slot is not available', 409));
    }
  }

  // Update appointment
  Object.assign(appointment, updateData);
  await appointment.save();

  // Populate updated appointment
  await appointment.populate([
    { path: 'patient', select: 'name mobileNumber email profile' },
    { path: 'doctor', select: 'name mobileNumber email doctorInfo.specialization' },
  ]);

  res.status(200).json({
    success: true,
    message: 'Appointment updated successfully',
    data: { appointment },
  });
});

/**
 * @desc    Cancel appointment
 * @route   DELETE /api/appointments/:id
 * @access  Private
 */
const cancelAppointment = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return next(notFoundError('Appointment not found'));
  }

  // Check if appointment can be cancelled
  const canCancel = appointment.canBeCancelled();
  if (!canCancel.allowed) {
    return next(new AppError(canCancel.reason, 400));
  }

  // Check permissions
  const hasPermission = 
    req.user.role === 'admin' ||
    req.user.role === 'receptionist' ||
    appointment.patient.toString() === req.user.id ||
    appointment.doctor.toString() === req.user.id;

  if (!hasPermission) {
    return next(forbiddenError('Cannot cancel this appointment'));
  }

  // Calculate refund amount
  const refundAmount = appointment.calculateRefund();

  // Update appointment
  appointment.status = 'cancelled';
  appointment.cancellation = {
    reason: reason || 'Cancelled by user',
    cancelledBy: req.user.id,
    cancelledAt: new Date(),
    refundAmount,
  };
  appointment.lastModifiedBy = req.user.id;

  // Update payment status if refund is applicable
  if (refundAmount > 0 && appointment.payment.status === 'paid') {
    appointment.payment.status = 'refunded';
  }

  await appointment.save();

  res.status(200).json({
    success: true,
    message: 'Appointment cancelled successfully',
    data: {
      appointment,
      refundAmount,
    },
  });
});

/**
 * @desc    Get my appointments (patient specific)
 * @route   GET /api/appointments/my-appointments
 * @access  Private/Patient
 */
const getMyAppointments = asyncHandler(async (req, res, next) => {
  const {
    status,
    upcoming = false,
    past = false,
    limit = 10,
    page = 1,
  } = req.query;

  let filter = { patient: req.user.id };

  // Filter by status
  if (status) filter.status = status;

  // Filter by time
  if (upcoming === 'true') {
    filter.appointmentDate = { $gte: new Date() };
    filter.status = { $in: ['scheduled', 'confirmed'] };
  }

  if (past === 'true') {
    filter.$or = [
      { appointmentDate: { $lt: new Date() } },
      { status: { $in: ['completed', 'cancelled', 'no-show'] } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const appointments = await Appointment.find(filter)
    .populate('doctor', 'name mobileNumber doctorInfo.specialization doctorInfo.consultationFee')
    .sort({ appointmentDate: upcoming === 'true' ? 1 : -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Appointment.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      appointments,
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
 * @desc    Get appointment statistics
 * @route   GET /api/appointments/stats
 * @access  Private
 */
const getAppointmentStats = asyncHandler(async (req, res, next) => {
  let filter = {};

  // Apply role-based filters
  if (req.user.role === 'patient') {
    filter.patient = req.user.id;
  } else if (req.user.role === 'doctor') {
    filter.doctor = req.user.id;
  }

  const stats = await Appointment.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // Get today's appointments count
  const today = new Date();
  const todayFilter = {
    ...filter,
    appointmentDate: {
      $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
    },
  };

  const todayCount = await Appointment.countDocuments(todayFilter);

  // Get upcoming appointments count
  const upcomingCount = await Appointment.countDocuments({
    ...filter,
    appointmentDate: { $gte: new Date() },
    status: { $in: ['scheduled', 'confirmed'] },
  });

  res.status(200).json({
    success: true,
    data: {
      byStatus: stats,
      today: todayCount,
      upcoming: upcomingCount,
    },
  });
});

/**
 * @desc    Get available slots for a doctor on a specific date
 * @route   GET /api/appointments/slots
 * @access  Private
 */
const getAvailableSlots = asyncHandler(async (req, res, next) => {
  const { doctorId, date } = req.query;

  if (!doctorId || !date) {
    return next(new AppError('Doctor ID and date are required', 400));
  }

  // Verify doctor exists
  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor' || !doctor.isActive) {
    return next(notFoundError('Doctor not found or not available'));
  }

  const queryDate = new Date(date);
  
  // Generate slots if they don't exist
  await Slot.generateSlotsForDate(doctorId, queryDate, req.user.id);
  
  // Get available slots
  const slots = await Slot.getAvailableSlots(doctorId, queryDate);

  res.status(200).json({
    success: true,
    data: {
      doctor: {
        id: doctor._id,
        name: doctor.name,
        specialization: doctor.doctorInfo.specialization,
        consultationFee: doctor.doctorInfo.consultationFee,
      },
      date: queryDate.toISOString().split('T')[0],
      slots: slots.map(slot => ({
        id: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration,
        fee: slot.fee,
        available: slot.status === 'available',
        status: slot.status,
      })),
    },
  });
});

/**
 * @desc    Book appointment with image upload
 * @route   POST /api/appointments/book
 * @access  Private/Patient
 */

/**
 * @desc    Get pending appointments (Receptionist)
 * @route   GET /api/appointments/pending
 * @access  Private/Receptionist
 */
const getPendingAppointments = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    doctorId,
    date,
    sortBy = 'appointmentDate',
    sortOrder = 'asc',
  } = req.query;

  let filter = { status: 'pending' };
  
  if (doctorId) filter.doctor = doctorId;
  
  if (date) {
    const queryDate = new Date(date);
    filter.appointmentDate = {
      $gte: new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate()),
      $lt: new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate() + 1),
    };
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const appointments = await Appointment.find(filter)
    .populate('patient', 'name mobileNumber email profile')
    .populate('doctor', 'name mobileNumber doctorInfo.specialization doctorInfo.consultationFee')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Appointment.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      appointments,
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
 * @desc    Confirm appointment (Receptionist)
 * @route   POST /api/appointments/confirm/:id
 * @access  Private/Receptionist
 */
const confirmAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'name mobileNumber')
    .populate('doctor', 'name doctorInfo.specialization');

  if (!appointment) {
    return next(notFoundError('Appointment not found'));
  }

  if (appointment.status !== 'pending') {
    return next(new AppError('Only pending appointments can be confirmed', 400));
  }

  // Update appointment status
  appointment.status = 'confirmed';
  appointment.lastModifiedBy = req.user.id;
  await appointment.save();

  // Send confirmation SMS to patient
  try {
    const message = `Dear ${appointment.patient.name}, your appointment with Dr. ${appointment.doctor.name} (${appointment.doctor.doctorInfo.specialization}) on ${appointment.appointmentDate.toDateString()} at ${appointment.appointmentTime} has been confirmed. Thank you - Arthomed`;
    
    await sendOTP({
      mobileNumber: appointment.patient.mobileNumber,
      otp: '', // Not an OTP, just a message
      purpose: 'appointment_confirmation',
      customMessage: message,
    });
  } catch (error) {
    console.error('SMS sending failed:', error);
  }

  res.status(200).json({
    success: true,
    message: 'Appointment confirmed successfully',
    data: { appointment },
  });
});

/**
 * @desc    Reject appointment (Receptionist)
 * @route   POST /api/appointments/reject/:id
 * @access  Private/Receptionist
 */
const rejectAppointment = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'name mobileNumber');

  if (!appointment) {
    return next(notFoundError('Appointment not found'));
  }

  if (appointment.status !== 'pending') {
    return next(new AppError('Only pending appointments can be rejected', 400));
  }

  // Update appointment status
  appointment.status = 'rejected';
  appointment.cancellation = {
    reason: reason || 'Rejected by receptionist',
    cancelledBy: req.user.id,
    cancelledAt: new Date(),
  };
  appointment.lastModifiedBy = req.user.id;
  await appointment.save();

  // Release the slot if it was booked
  if (appointment.slotId) {
    await Slot.releaseSlot(appointment.slotId);
  }

  // Send rejection SMS to patient
  try {
    const message = `Dear ${appointment.patient.name}, your appointment request has been declined. Reason: ${reason || 'Scheduling conflict'}. Please book another slot. - Arthomed`;
    
    await sendOTP({
      mobileNumber: appointment.patient.mobileNumber,
      otp: '',
      purpose: 'appointment_rejection',
      customMessage: message,
    });
  } catch (error) {
    console.error('SMS sending failed:', error);
  }

  res.status(200).json({
    success: true,
    message: 'Appointment rejected successfully',
    data: { appointment },
  });
});

/**
 * @desc    Create manual appointment (Receptionist)
 * @route   POST /api/appointments/manual
 * @access  Private/Receptionist
 */
const createManualAppointment = asyncHandler(async (req, res, next) => {
  const {
    patientMobile,
    patientName,
    doctorId,
    appointmentDate,
    appointmentTime,
    purposeOfVisit,
    reason,
    isWalkIn = false,
  } = req.body;

  // Find or create patient
  let patient = await User.findOne({ mobileNumber: patientMobile });
  
  if (!patient) {
    // Create new patient
    patient = new User({
      mobileNumber: patientMobile,
      name: patientName,
      role: 'patient',
      isVerified: true, // Receptionist verified
      isActive: true,
    });
    await patient.save();
  }

  // Verify doctor
  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor' || !doctor.isActive) {
    return next(notFoundError('Doctor not found or not available'));
  }

  const apptDate = new Date(appointmentDate);

  // Check for conflicts if not walk-in
  if (!isWalkIn) {
    const conflicts = await Appointment.find({
      doctor: doctorId,
      appointmentDate: {
        $gte: new Date(apptDate.getFullYear(), apptDate.getMonth(), apptDate.getDate()),
        $lt: new Date(apptDate.getFullYear(), apptDate.getMonth(), apptDate.getDate() + 1),
      },
      appointmentTime: appointmentTime,
      status: { $nin: ['cancelled', 'rejected', 'no-show'] },
    });

    if (conflicts.length > 0) {
      return next(new AppError('Time slot already booked', 409));
    }
  }

  // Create appointment
  const appointment = new Appointment({
    patient: patient._id,
    doctor: doctorId,
    appointmentDate: apptDate,
    appointmentTime,
    purposeOfVisit: purposeOfVisit || 'consultation',
    reason: reason || 'Walk-in appointment',
    status: 'confirmed', // Manual appointments are auto-confirmed
    type: isWalkIn ? 'walk-in' : 'manual',
    createdBy: req.user.id,
    payment: {
      amount: doctor.doctorInfo.consultationFee || 0,
      status: 'pending',
    },
  });

  await appointment.save();

  // Populate appointment details
  await appointment.populate([
    { path: 'patient', select: 'name mobileNumber email profile' },
    { path: 'doctor', select: 'name mobileNumber doctorInfo.specialization doctorInfo.consultationFee' },
  ]);

  res.status(201).json({
    success: true,
    message: 'Manual appointment created successfully',
    data: { appointment },
  });
});

module.exports = {
  bookAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  getMyAppointments,
  getAppointmentStats,
  getAvailableSlots,
  getPendingAppointments,
  confirmAppointment,
  rejectAppointment,
  createManualAppointment,
};
