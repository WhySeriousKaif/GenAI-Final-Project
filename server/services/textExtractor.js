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
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts raw text from a given file path based on its file extension.
 * 
 * @param {string} filePath - Absolute path to the file on the server's disk
 * @param {string} originalName - Original filename uploaded by the user (to detect extension)
 * @returns {Promise<string>} - The extracted raw text string
 */
const extractTextFromFile = async (filePath, originalName) => {
  // Extract file extension and convert to lowercase to handle cases like .PDF or .Docx
  const extension = path.extname(originalName).toLowerCase();

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  // Handle PDF files
  if (extension === '.pdf') {
    try {
      // Read file into memory as a binary buffer
      const dataBuffer = fs.readFileSync(filePath);
      
      // pdf-parse reads the buffer and extracts the text content page by page
      const parsedData = await pdfParse(dataBuffer);
      
      // parsedData contains properties like metadata, numpages, and text.
      // We return the raw text, trimming outer whitespaces.
      if (!parsedData.text || parsedData.text.trim() === '') {
        throw new Error('PDF file appears to be empty or contains scanned images (OCR required)');
      }
      
      return parsedData.text;
    } catch (error) {
      console.error(`[Text Extractor Error - PDF]: ${error.message}`);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  } 
  
  // Handle DOCX files
  else if (extension === '.docx') {
    try {
      // mammoth parses XML streams inside .docx files.
      // extractRawText is optimized to strip formatting styles and return plain paragraphs.
      const result = await mammoth.extractRawText({ path: filePath });
      
      if (!result.value || result.value.trim() === '') {
        throw new Error('Word document appears to be empty');
      }
      
      // result.value contains the text, result.messages contains conversion warnings
      return result.value;
    } catch (error) {
      console.error(`[Text Extractor Error - DOCX]: ${error.message}`);
      throw new Error(`Failed to extract text from Word Document: ${error.message}`);
    }
  } 
  
  // Unsupported File Formats
  else {
    throw new Error(`Unsupported file extension "${extension}". Only PDF and DOCX files are allowed.`);
  }
};

module.exports = {
  extractTextFromFile
};
