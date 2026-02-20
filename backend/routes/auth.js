const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../middleware/validate');
const roleGuard = require('../middleware/roleGuard');
const { asyncHandler } = require('../utils/helpers');

const router = express.Router();

// POST /api/auth/login
router.post(
  '/login',
  validateLogin,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Contact admin.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const userObj = user.toJSON();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userObj,
      },
    });
  })
);

// POST /api/auth/register (Admin only)
router.post(
  '/register',
  auth,
  roleGuard('admin'),
  validateRegister,
  asyncHandler(async (req, res) => {
    const { name, email, password, role, department } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'employee',
      department: department || 'General',
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user },
    });
  })
);

// GET /api/auth/me
router.get(
  '/me',
  auth,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: { user: req.user },
    });
  })
);

module.exports = router;
