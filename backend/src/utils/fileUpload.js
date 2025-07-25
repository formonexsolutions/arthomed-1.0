const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create subdirectory based on file type
    const subDir = file.fieldname === 'images' ? 'appointments' : 'documents';
    const fullPath = path.join(uploadsDir, subDir);
    
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
  };

  const fieldAllowedTypes = allowedTypes[file.fieldname] || allowedTypes.images;
  
  if (fieldAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${file.fieldname}. Allowed types: ${fieldAllowedTypes.join(', ')}`), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files
  },
});

/**
 * Middleware for uploading appointment images
 */
const uploadAppointmentImages = upload.array('images', 5);

/**
 * Middleware for uploading single document
 */
const uploadSingleDocument = upload.single('document');

/**
 * Error handling middleware for multer
 */
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.',
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed.',
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.',
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'File upload error.',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
};

/**
 * Get file URL for serving uploaded files
 */
const getFileUrl = (filename, type = 'appointments') => {
  if (!filename) return null;
  return `/api/files/${type}/${filename}`;
};

/**
 * Delete uploaded file
 */
const deleteFile = (filename, type = 'appointments') => {
  try {
    const filePath = path.join(uploadsDir, type, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Process uploaded files for appointment
 */
const processUploadedFiles = (files) => {
  if (!files || files.length === 0) return [];
  
  return files.map(file => ({
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url: getFileUrl(file.filename),
    uploadDate: new Date(),
  }));
};

/**
 * Validate file types for appointment
 */
const validateAppointmentFiles = (files) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const maxFiles = 5;
  
  if (!files || files.length === 0) return { valid: true };
  
  if (files.length > maxFiles) {
    return { valid: false, message: `Maximum ${maxFiles} files allowed` };
  }
  
  for (const file of files) {
    if (!allowedTypes.includes(file.mimetype)) {
      return { 
        valid: false, 
        message: `Invalid file type: ${file.originalname}. Allowed types: JPG, PNG, GIF, WebP, PDF` 
      };
    }
    
    if (file.size > maxSize) {
      return { 
        valid: false, 
        message: `File too large: ${file.originalname}. Maximum size is 10MB` 
      };
    }
  }
  
  return { valid: true };
};

module.exports = {
  upload,
  uploadAppointmentImages,
  uploadSingleDocument,
  handleUploadError,
  getFileUrl,
  deleteFile,
  processUploadedFiles,
  validateAppointmentFiles,
};
