const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { asyncHandler } = require('../utils/helpers');

const router = express.Router();

// GET /api/users - List users (Admin only)
router.get(
  '/',
  auth,
  roleGuard('admin'),
  asyncHandler(async (req, res) => {
    const { role, department, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { users },
    });
  })
);

// GET /api/users/technicians - List technicians with workload
router.get(
  '/technicians',
  auth,
  roleGuard('admin'),
  asyncHandler(async (req, res) => {
    const technicians = await User.find({
      role: 'technician',
      isActive: true,
    }).sort({ activeTicketCount: 1 });

    res.json({
      success: true,
      data: { technicians },
    });
  })
);

// PATCH /api/users/:id - Update user (Admin only)
router.patch(
  '/:id',
  auth,
  roleGuard('admin'),
  asyncHandler(async (req, res) => {
    const { name, role, department, isActive } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (department) updateData.department = department;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User updated',
      data: { user },
    });
  })
);

module.exports = router;
