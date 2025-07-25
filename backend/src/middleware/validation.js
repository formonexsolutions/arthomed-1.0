const { body, param, query, validationResult } = require('express-validator');
const { validationError } = require('./errorHandler');

/**
 * Handle validation results
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
    });
  }
  
  next();
};

/**
 * Mobile number validation
 */
const validateMobileNumber = () => [
  body('mobileNumber')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9'),
];

/**
 * OTP validation
 */
const validateOTP = () => [
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
];

/**
 * User registration validation
 */
const validateUserRegistration = () => [
  ...validateMobileNumber(),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['admin', 'doctor', 'receptionist', 'patient'])
    .withMessage('Invalid role specified'),
];

/**
 * User login validation
 */
const validateUserLogin = () => [
  ...validateMobileNumber(),
  ...validateOTP(),
];

/**
 * Send OTP validation
 */
const validateSendOTP = () => [
  ...validateMobileNumber(),
  body('purpose')
    .optional()
    .isIn(['registration', 'login', 'password_reset'])
    .withMessage('Invalid OTP purpose'),
];

/**
 * Verify OTP validation
 */
const validateVerifyOTP = () => [
  ...validateMobileNumber(),
  ...validateOTP(),
  body('purpose')
    .optional()
    .isIn(['registration', 'login', 'password_reset'])
    .withMessage('Invalid OTP purpose'),
];

/**
 * Appointment booking validation
 */
const validateAppointmentBooking = () => [
  body('doctorId')
    .isMongoId()
    .withMessage('Invalid doctor ID'),
  body('appointmentDate')
    .isISO8601()
    .withMessage('Please provide a valid date in ISO format')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        throw new Error('Appointment date cannot be in the past');
      }
      
      // Check if appointment is not more than 3 months in future
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      
      if (appointmentDate > threeMonthsFromNow) {
        throw new Error('Appointment date cannot be more than 3 months in the future');
      }
      
      return true;
    }),
  body('appointmentTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide time in HH:MM format'),
  body('reason')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters'),
  body('symptoms')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Symptoms description cannot exceed 1000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'emergency'])
    .withMessage('Invalid priority level'),
  body('type')
    .optional()
    .isIn(['consultation', 'follow-up', 'emergency', 'routine-checkup'])
    .withMessage('Invalid appointment type'),
];

/**
 * Appointment update validation
 */
const validateAppointmentUpdate = () => [
  body('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
    .withMessage('Invalid appointment status'),
  body('appointmentDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date in ISO format'),
  body('appointmentTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide time in HH:MM format'),
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters'),
  body('notes.doctor')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Doctor notes cannot exceed 2000 characters'),
  body('notes.receptionist')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Receptionist notes cannot exceed 1000 characters'),
];

/**
 * Doctor info validation
 */
const validateDoctorInfo = () => [
  body('doctorInfo.specialization')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Specialization must be between 2 and 100 characters'),
  body('doctorInfo.qualification')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Qualification must be between 2 and 200 characters'),
  body('doctorInfo.experience')
    .optional()
    .isInt({ min: 0, max: 70 })
    .withMessage('Experience must be between 0 and 70 years'),
  body('doctorInfo.consultationFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a positive number'),
  body('doctorInfo.registrationNumber')
    .optional()
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('Registration number must be between 5 and 50 characters'),
];

/**
 * Patient info validation
 */
const validatePatientInfo = () => [
  body('patientInfo.bloodGroup')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood group'),
  body('patientInfo.allergies')
    .optional()
    .isArray()
    .withMessage('Allergies must be an array'),
  body('patientInfo.chronicConditions')
    .optional()
    .isArray()
    .withMessage('Chronic conditions must be an array'),
];

/**
 * Profile validation
 */
const validateProfile = () => [
  body('profile.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      const dob = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      
      if (age < 0 || age > 150) {
        throw new Error('Invalid date of birth');
      }
      
      return true;
    }),
  body('profile.gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Invalid gender'),
  body('profile.address.pincode')
    .optional()
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Please enter a valid 6-digit pincode'),
];

/**
 * MongoDB ObjectId validation
 */
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
];

/**
 * Query parameters validation
 */
const validateQueryParams = () => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isString()
    .withMessage('SortBy must be a string'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('SortOrder must be asc or desc'),
  query('status')
    .optional()
    .isString()
    .withMessage('Status must be a string'),
  query('role')
    .optional()
    .isIn(['admin', 'doctor', 'receptionist', 'patient'])
    .withMessage('Invalid role'),
];

/**
 * Date range validation
 */
const validateDateRange = () => [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date')
    .custom((value, { req }) => {
      if (req.query.startDate && value) {
        const start = new Date(req.query.startDate);
        const end = new Date(value);
        
        if (end <= start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
];

module.exports = {
  handleValidationErrors,
  validateMobileNumber,
  validateOTP,
  validateUserRegistration,
  validateUserLogin,
  validateSendOTP,
  validateVerifyOTP,
  validateAppointmentBooking,
  validateAppointmentUpdate,
  validateDoctorInfo,
  validatePatientInfo,
  validateProfile,
  validateObjectId,
  validateQueryParams,
  validateDateRange,
};
