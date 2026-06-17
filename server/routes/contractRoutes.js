// =========================================================================
// Contract API Routes
// =========================================================================
// This file registers Express routes for document ingestion and database management.
// It uses Multer middleware to process file uploads, transferring PDFs or DOCX 
// files into a temporary staging folder for extraction.

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  uploadAndAnalyzeContract,
  getAllContracts,
  getContractById,
  deleteContract,
  globalSearch
} = require('../controllers/contractController');

const router = express.Router();

// =========================================================================
// Multer Configuration (File Upload Staging)
// =========================================================================
// We define a disk storage engine for storing incoming files.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Ensure the uploads directory exists on the system before storing
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique name to prevent collisions if users upload files with the same name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Define filter to block non-document files from hitting the server
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'), false);
  }
};

// Set up the multer upload middleware instance with size limit (10MB)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 Megabytes
});

// =========================================================================
// Endpoints Routing Definition
// =========================================================================

// 1. Global Search Endpoint
// Note: We place this ABOVE '/:id' to prevent Express from confusing the keyword 'search' with a contract ID.
router.get('/search', globalSearch);

// 2. Main Upload and Analysis Endpoint (Requires Multer upload middleware)
router.post('/upload', upload.single('contract'), uploadAndAnalyzeContract);

// 3. Get All Contracts
router.get('/', getAllContracts);

// 4. Get Single Contract Details & Graph Structure
router.get('/:id', getContractById);

// 5. Delete Contract
router.delete('/:id', deleteContract);

module.exports = router;
