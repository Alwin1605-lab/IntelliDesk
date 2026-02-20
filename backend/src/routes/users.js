const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/users — admin only
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({ isActive: { $ne: false } }).select('-password');
    res.json({ data: users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/technicians — get available technicians
router.get('/technicians', protect, async (req, res) => {
  try {
    const technicians = await User.find({
      role: 'technician',
      isActive: { $ne: false },
    }).select('name email skills activeTickets totalResolved isAvailable').sort({ activeTickets: 1 });
    res.json({ data: technicians });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id — admin update user
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { password, ...updates } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    Object.assign(user, updates);
    if (password) user.password = password;
    await user.save();

    res.json({ data: user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id — deactivate user
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
