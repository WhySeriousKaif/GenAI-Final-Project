// =========================================================================
// JWT Authentication & Role-based Authorization Middleware
// =========================================================================
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../errors/AppError');

// Protect Routes (Verify token exists and is valid)
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_123456');
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return next(new AppError('User not found', 401));
    }

    next();
  } catch (err) {
    return next(new AppError('Not authorized to access this route', 401));
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const role = req.user ? req.user.role : 'none';
      return next(new AppError(`User role '${role}' is not authorized to access this resource`, 403));
    }
    next();
  };
};
