// =========================================================================
// asyncHandler — async route wrapper
// =========================================================================
// Wraps an async controller so any thrown error / rejected promise is forwarded
// to Express's error pipeline (next(err)) and handled by the central
// errorHandler. Removes the repetitive try/catch from every controller.

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
