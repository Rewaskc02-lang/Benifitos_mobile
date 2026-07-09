const TesseractOCRProvider = require("./TesseractOCRProvider");

/**
 * Decoupled interface to trigger OCR text extraction on uploaded files.
 * The calling client does not need to know which OCR provider is active.
 * 
 * @param {Object} file Multer file upload parameter object.
 * @returns {Promise<Object>} Object containing { text, confidence }
 */
exports.extractText = async (file) => {
  if (!file || !file.path) {
    console.warn("[OCR Provider] No valid file path provided for extraction.");
    return { text: "", confidence: 0 };
  }
  
  // Delegate processing to the active Tesseract OCR Provider
  return TesseractOCRProvider.extractText(file.path);
};

exports.preprocessImage = async (filePath) => {
  return TesseractOCRProvider.preprocessImage(filePath);
};
