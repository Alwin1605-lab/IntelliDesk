const User = require('../models/User');

const categoryToDepartment = {
  Network: 'Network',
  Hardware: 'Hardware',
  Software: 'Software',
  Security: 'Security',
  Access: 'IT',
  Other: 'General',
};

/**
 * Find the least busy technician for a given category.
 * Falls back to any available technician if no department match.
 */
const assignTechnician = async (category) => {
  const department = categoryToDepartment[category] || 'General';

  // Try to find a technician in the matching department with fewest active tickets
  let technician = await User.findOne({
    role: 'technician',
    isActive: true,
    department: department,
  }).sort({ activeTicketCount: 1 });

  // Fallback: any active technician with fewest tickets
  if (!technician) {
    technician = await User.findOne({
      role: 'technician',
      isActive: true,
    }).sort({ activeTicketCount: 1 });
  }

  if (technician) {
    // Increment their active ticket count
    await User.findByIdAndUpdate(technician._id, {
      $inc: { activeTicketCount: 1 },
    });
  }

  return technician;
};

/**
 * Decrement technician's active ticket count when a ticket is resolved/closed
 */
const releaseTechnician = async (technicianId) => {
  if (!technicianId) return;
  await User.findByIdAndUpdate(technicianId, {
    $inc: { activeTicketCount: -1 },
    $min: { activeTicketCount: 0 }, // prevent negative
  });
};

module.exports = { assignTechnician, releaseTechnician };
