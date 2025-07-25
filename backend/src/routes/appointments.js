const express = require('express');
const {
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
} = require('../controllers/appointmentController');
const {
  authenticate,
  requirePatient,
  requireStaff,
  requireReceptionist,
  authorize,
} = require('../middleware/auth');
const {
  validateAppointmentBooking,
  validateAppointmentUpdate,
  validateObjectId,
  validateQueryParams,
  validateDateRange,
  handleValidationErrors,
} = require('../middleware/validation');
const { uploadAppointmentImages, handleUploadError } = require('../utils/fileUpload');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @desc    Get available time slots for a doctor
 * @route   GET /api/appointments/slots
 * @access  Private
 */
router.get('/slots', getAvailableSlots);

/**
 * @desc    Get appointment statistics
 * @route   GET /api/appointments/stats
 * @access  Private
 */
router.get('/stats', getAppointmentStats);

/**
 * @desc    Get pending appointments (Receptionist)
 * @route   GET /api/appointments/pending
 * @access  Private/Receptionist
 */
router.get(
  '/pending',
  requireReceptionist,
  validateQueryParams(),
  handleValidationErrors,
  getPendingAppointments
);

/**
 * @desc    Get my appointments (patient specific)
 * @route   GET /api/appointments/my
 * @access  Private/Patient
 */
router.get(
  '/my',
  requirePatient,
  validateQueryParams(),
  handleValidationErrors,
  getMyAppointments
);

/**
 * @desc    Book new appointment with image upload
 * @route   POST /api/appointments/book
 * @access  Private/Patient
 */
router.post(
  '/book',
  requirePatient,
  uploadAppointmentImages,
  handleUploadError,
  validateAppointmentBooking(),
  handleValidationErrors,
  bookAppointment
);

/**
 * @desc    Create manual appointment (Receptionist)
 * @route   POST /api/appointments/manual
 * @access  Private/Receptionist
 */
router.post(
  '/manual',
  requireReceptionist,
  validateAppointmentBooking(),
  handleValidationErrors,
  createManualAppointment
);

/**
 * @desc    Confirm appointment (Receptionist)
 * @route   POST /api/appointments/confirm/:id
 * @access  Private/Receptionist
 */
router.post(
  '/confirm/:id',
  requireReceptionist,
  validateObjectId('id'),
  handleValidationErrors,
  confirmAppointment
);

/**
 * @desc    Reject appointment (Receptionist)
 * @route   POST /api/appointments/reject/:id
 * @access  Private/Receptionist
 */
router.post(
  '/reject/:id',
  requireReceptionist,
  validateObjectId('id'),
  handleValidationErrors,
  rejectAppointment
);

/**
 * @desc    Get all appointments (with filters)
 * @route   GET /api/appointments
 * @access  Private
 */
router.get(
  '/',
  [
    validateQueryParams(),
    validateDateRange(),
  ],
  handleValidationErrors,
  getAllAppointments
);

/**
 * @desc    Get appointment by ID
 * @route   GET /api/appointments/:id
 * @access  Private
 */
router.get(
  '/:id',
  validateObjectId('id'),
  handleValidationErrors,
  getAppointmentById
);

/**
 * @desc    Update appointment
 * @route   PUT /api/appointments/:id
 * @access  Private
 */
router.put(
  '/:id',
  [
    validateObjectId('id'),
    validateAppointmentUpdate(),
  ],
  handleValidationErrors,
  updateAppointment
);

/**
 * @desc    Cancel appointment
 * @route   DELETE /api/appointments/:id
 * @access  Private
 */
router.delete(
  '/:id',
  validateObjectId('id'),
  handleValidationErrors,
  cancelAppointment
);

module.exports = router;
