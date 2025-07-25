const express = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getDoctors,
  getDoctorAvailability,
  updateProfile,
  getUserStats,
} = require('../controllers/userController');
const {
  authenticate,
  requireAdmin,
  requireAdminOrReceptionist,
  authorize,
} = require('../middleware/auth');
const {
  validateUserRegistration,
  validateObjectId,
  validateQueryParams,
  validateDoctorInfo,
  validatePatientInfo,
  validateProfile,
  handleValidationErrors,
} = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
router.get(
  '/',
  requireAdmin,
  validateQueryParams(),
  handleValidationErrors,
  getAllUsers
);

/**
 * @desc    Get user statistics
 * @route   GET /api/users/stats
 * @access  Private/Admin
 */
router.get('/stats', requireAdmin, getUserStats);

/**
 * @desc    Get all doctors
 * @route   GET /api/users/doctors
 * @access  Private
 */
router.get('/doctors', getDoctors);

/**
 * @desc    Get doctor availability
 * @route   GET /api/users/doctors/:id/availability
 * @access  Private
 */
router.get(
  '/doctors/:id/availability',
  validateObjectId('id'),
  handleValidationErrors,
  getDoctorAvailability
);

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
router.put(
  '/profile',
  [
    validateProfile(),
    validateDoctorInfo(),
    validatePatientInfo(),
  ],
  handleValidationErrors,
  updateProfile
);

/**
 * @desc    Create new user
 * @route   POST /api/users
 * @access  Private/Admin
 */
router.post(
  '/',
  requireAdmin,
  [
    validateUserRegistration(),
    validateDoctorInfo(),
    validatePatientInfo(),
    validateProfile(),
  ],
  handleValidationErrors,
  createUser
);

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
router.get(
  '/:id',
  validateObjectId('id'),
  handleValidationErrors,
  getUserById
);

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private
 */
router.put(
  '/:id',
  [
    validateObjectId('id'),
    validateProfile(),
    validateDoctorInfo(),
    validatePatientInfo(),
  ],
  handleValidationErrors,
  updateUser
);

/**
 * @desc    Delete user (soft delete)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  requireAdmin,
  validateObjectId('id'),
  handleValidationErrors,
  deleteUser
);

module.exports = router;
