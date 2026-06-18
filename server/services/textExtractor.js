// =========================================================================
// Document Text Extraction Service
// =========================================================================
// This service is responsible for reading uploaded files (PDF/DOCX) and
// extracting their raw string content.
// 
// 1. pdf-parse: Reads binary PDF files and extracts text pages.
// 2. mammoth: Reads binary Word (.docx) files and parses XML structures into raw text.

const fs = require('fs');
const path = require('path');
const { getExtractor } = require('./rules/extractorRegistry');

/**
 * Extracts raw text from a given file path based on its file extension.
 * Format-specific parsing lives in the extractor registry (Open/Closed) — this
 * function only validates and dispatches.
 *
 * @param {string} filePath - Absolute path to the file on the server's disk
 * @param {string} originalName - Original filename uploaded by the user (to detect extension)
 * @returns {Promise<string>} - The extracted raw text string
 */
const extractTextFromFile = async (filePath, originalName) => {
  // Normalize extension to handle cases like .PDF or .Docx
  const extension = path.extname(originalName).toLowerCase();

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  const extractor = getExtractor(extension);
  if (!extractor) {
    throw new Error(`Unsupported file extension "${extension}". Only PDF and DOCX files are allowed.`);
  }

  return extractor(filePath);
};

module.exports = {
  extractTextFromFile
};
