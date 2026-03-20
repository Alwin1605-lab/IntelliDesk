const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'dev-secret', {
  expiresIn: process.env.JWT_EXPIRE || '7d',
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department, skills } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const existing = await User.findOne({ email }).select('+password');
    if (existing) {
      // Allow a shadow user (created by email poller, never logged in) to claim their account
      const isShadowUser = !existing.lastLogin && existing.department === 'External';
      if (!isShadowUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      // Merge registration data into the shadow account so existing tickets are preserved
      existing.name = name;
      existing.password = password; // pre-save hook will hash it
      existing.department = department || 'IT';
      existing.role = role || 'user';
      if (skills) existing.skills = skills;
      existing.lastLogin = new Date();
      await existing.save();
      const token = signToken(existing._id);
      return res.status(200).json({
        token,
        user: { _id: existing._id, name: existing.name, email: existing.email, role: existing.role, department: existing.department }
      });
    }

    const user = await User.create({ name, email, password, role: role || 'user', department, skills });
    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, department: user.department }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.isActive === false) return res.status(401).json({ message: 'Account is deactivated' });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, department: user.department, skills: user.skills }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ data: req.user });
});

module.exports = router;
