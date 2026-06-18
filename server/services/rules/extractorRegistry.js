// =========================================================================
// Document Extractor Registry (Open/Closed Principle)
// =========================================================================
// Replaces the extension-based if/else in textExtractor with a registry keyed
// by file extension. Supporting a new format (e.g. '.txt', '.rtf') = one new
// entry; the dispatcher never changes.
//
// Each handler receives an absolute file path and returns the extracted raw
// text, throwing a descriptive error on empty/failed extraction.

const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const EXTRACTORS = {
  '.pdf': async (filePath) => {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const parsedData = await pdfParse(dataBuffer);

      if (!parsedData.text || parsedData.text.trim() === '') {
        throw new Error('PDF file appears to be empty or contains scanned images (OCR required)');
      }
      return parsedData.text;
    } catch (error) {
      console.error(`[Text Extractor Error - PDF]: ${error.message}`);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  },

  '.docx': async (filePath) => {
    try {
      const result = await mammoth.extractRawText({ path: filePath });

      if (!result.value || result.value.trim() === '') {
        throw new Error('Word document appears to be empty');
      }
      return result.value;
    } catch (error) {
      console.error(`[Text Extractor Error - DOCX]: ${error.message}`);
      throw new Error(`Failed to extract text from Word Document: ${error.message}`);
    }
  }
};

/** Returns the extractor handler for an extension, or undefined if unsupported. */
const getExtractor = (extension) => EXTRACTORS[extension];

/** List of supported extensions (used for validation / file filters). */
const supportedExtensions = () => Object.keys(EXTRACTORS);

module.exports = { EXTRACTORS, getExtractor, supportedExtensions };
