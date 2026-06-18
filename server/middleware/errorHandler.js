// =========================================================================
// Express Global Error Handling Middleware
// =========================================================================
// This middleware intercepts any unhandled exceptions or next(error) triggers 
// across our route stack. It returns a uniform JSON response, preventing
// raw server stacks from leaking to users—enhancing security and polish.

const errorHandler = (err, req, res, next) => {
  console.error('[Server Error Handler]:', err.stack || err.message);

  // Handle Multer upload violations (e.g. file size exceeding limit)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Upload limit exceeded. Maximum file size allowed is 10MB.'
    });
  }

  // Handle database CastError (e.g. invalid MongoDB ID path format)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      success: false,
      message: 'Invalid record ID format provided.'
    });
  }

  // Prefer an explicit status from AppError / ExtractionError; otherwise fall
  // back to any status already set on the response, else 500.
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected error occurred on the server.',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;
