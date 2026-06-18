// =========================================================================
// AppError — operational error with an HTTP status code
// =========================================================================
// Lets controllers/services signal a specific HTTP outcome by THROWING, instead
// of each handler formatting its own res.status(...).json(...). The central
// errorHandler middleware reads `statusCode` and produces the uniform response.

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes expected errors from bugs
  }
}

module.exports = AppError;
