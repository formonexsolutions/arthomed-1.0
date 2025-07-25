const express = require('express');
const path = require('path');
const fs = require('fs');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @desc    Serve uploaded files
 * @route   GET /api/files/:type/:filename
 * @access  Private (with optional auth for public files)
 */
router.get('/:type/:filename', optionalAuth, (req, res) => {
  const { type, filename } = req.params;
  
  // Validate file type
  const allowedTypes = ['appointments', 'documents', 'profiles'];
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type',
    });
  }
  
  // Construct file path
  const filePath = path.join(__dirname, '../../uploads', type, filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'File not found',
    });
  }
  
  // For sensitive files, require authentication
  const sensitiveTypes = ['appointments', 'documents'];
  if (sensitiveTypes.includes(type) && !req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required to access this file',
    });
  }
  
  // Set appropriate headers
  const stat = fs.statSync(filePath);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours cache
  
  // Serve the file
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving file:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error serving file',
        });
      }
    }
  });
});

/**
 * @desc    Delete uploaded file
 * @route   DELETE /api/files/:type/:filename
 * @access  Private
 */
router.delete('/:type/:filename', authenticate, (req, res) => {
  const { type, filename } = req.params;
  
  // Only admin or file owner can delete files
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only admin can delete files',
    });
  }
  
  const filePath = path.join(__dirname, '../../uploads', type, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'File not found',
    });
  }
  
  try {
    fs.unlinkSync(filePath);
    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
    });
  }
});

module.exports = router;
