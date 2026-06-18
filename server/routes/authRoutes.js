// =========================================================================
// Backend Authentication Routing Module
// =========================================================================
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../errors/AppError');
const { serializeUser } = require('../dto/userDTO');

// Helper to sign JWT tokens
const generateToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET || 'fallback_secret_key_123456', 
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    throw new AppError('Username or email already exists', 400);
  }

  const user = await User.create({
    username,
    email,
    password,
    role: role || 'user' // Allow setting role during registration for academic demo ease
  });

  const token = generateToken(user._id);

  return res.status(201).json({ success: true, token, user: serializeUser(user) });
}));

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new AppError('Please provide both username and password', 400);
  }

  // Select password explicitly because schema has select: false
  const user = await User.findOne({ username }).select('+password');
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = generateToken(user._id);

  return res.status(200).json({ success: true, token, user: serializeUser(user) });
}));

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  return res.status(200).json({ success: true, user: serializeUser(user) });
}));

module.exports = router;
