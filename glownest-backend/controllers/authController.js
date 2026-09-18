// ─────────────────────────────────────
//  controllers/authController.js
//  Register · Login · Get Me · Logout
// ─────────────────────────────────────

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── Helper: generate JWT ──
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// ── Helper: send token response ──
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id:          user._id,
      name:         user.name,
      username:     user.username,
      email:        user.email,
      role:         user.role,
      avatar:       user.avatar,
      bio:          user.bio,
      skinType:     user.skinType,
      skinConcerns: user.skinConcerns,
      skinScore:    user.skinScore,
      streak:       user.streak
    }
  });
};

// ──────────────────────────────────────
//  @route  POST /api/auth/register
//  @desc   Register new user
//  @access Public
// ──────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // Validate required fields
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, username, email, and password'
      });
    }

    // Check if email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(400).json({
        success: false,
        message: `An account with this ${field} already exists`
      });
    }

    // Create user
    const user = await User.create({ name, username, email, password });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────
//  @route  POST /api/auth/login
//  @desc   Login user
//  @access Public
// ──────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Mark as online
    user.isOnline = true;
    user.lastSeen = Date.now();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────
//  @route  GET /api/auth/me
//  @desc   Get current logged-in user
//  @access Private
// ──────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', 'name username avatar isOnline lastSeen');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────
//  @route  POST /api/auth/logout
//  @desc   Logout – mark user offline
//  @access Private
// ──────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: Date.now()
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────
//  @route  PUT /api/auth/update-profile
//  @desc   Update user profile
//  @access Private
// ──────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, skinType, skinConcerns, avatar } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, skinType, skinConcerns, avatar },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────
//  @route  PUT /api/auth/change-password
//  @desc   Change password
//  @access Private
// ──────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
