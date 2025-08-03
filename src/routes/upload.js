const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Mobile-optimized file upload config
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for mobile
    files: 1 // Single file upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, CSV, XLS, XLSX allowed.'));
    }
  }
});

// File upload endpoint
router.post('/file', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        accepted: ['PDF', 'CSV', 'XLS', 'XLSX']
      });
    }

    const fileInfo = {
      id: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedAt: new Date().toISOString()
    };

    // Mobile-optimized response
    res.json({
      success: true,
      file: fileInfo,
      message: 'File uploaded successfully',
      nextSteps: {
        process: `/api/upload/process/${fileInfo.id}`,
        status: `/api/upload/status/${fileInfo.id}`
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

// URL processing endpoint
router.post('/url', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        error: 'URL required',
        format: { url: 'https://example.com/conference-schedule' }
      });
    }

    const urlInfo = {
      id: Date.now().toString(),
      url: url,
      status: 'processing',
      submittedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      submission: urlInfo,
      message: 'URL submitted for processing'
    });

  } catch (error) {
    res.status(500).json({
      error: 'URL processing failed',
      message: error.message
    });
  }
});

module.exports = router;