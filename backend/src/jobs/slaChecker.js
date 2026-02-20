const Ticket = require('../models/Ticket');
const User = require('../models/User');

/**
 * Runs every 30 minutes to:
 * 1. Mark tickets as SLA breached
 * 2. Auto-escalate critical/high tickets that are approaching SLA breach
 */
async function checkSLABreaches(io) {
  const now = new Date();
  console.log('[SLA Checker] Running at', now.toISOString());

  // Mark breached
  const breachResult = await Ticket.updateMany(
    {
      slaDeadline: { $lt: now },
      slaBreached: false,
      status: { $nin: ['resolved', 'closed'] },
    },
    { $set: { slaBreached: true } }
  );
  if (breachResult.modifiedCount > 0) {
    console.log(`[SLA Checker] Marked ${breachResult.modifiedCount} tickets as SLA breached`);
    if (io) io.emit('sla:breached', { count: breachResult.modifiedCount, timestamp: now });
  }

  // Auto-escalate: tickets close to breach (75% of SLA elapsed) not yet in-progress
  const thresholdMultiplier = 0.25; // within last 25% of SLA time
  const escalationCandidates = await Ticket.find({
    slaBreached: false,
    status: 'open',
    priority: { $in: ['critical', 'high'] },
    slaDeadline: { $gt: now },
  }).populate('createdBy', 'name email');

  for (const ticket of escalationCandidates) {
    const totalSlaMs = ticket.slaHours * 3600 * 1000;
    const elapsed = now - ticket.createdAt;
    const pct = elapsed / totalSlaMs;

    if (pct >= 0.75) {
      // Find admin/senior technician to escalate
      const admin = await User.findOne({ role: 'admin', isActive: { $ne: false } });
      if (admin && (!ticket.assignedTo || ticket.assignedTo.toString() !== admin._id.toString())) {
        await Ticket.findByIdAndUpdate(ticket._id, {
          $push: {
            history: {
              action: 'escalated',
              oldValue: ticket.status,
              newValue: 'escalated',
              changedBy: admin._id,
              timestamp: now,
            }
          },
          $set: { status: 'in-progress' },
        });
        console.log(`[SLA Checker] Escalated ticket ${ticket.ticketId}`);
        if (io) io.emit('ticket:escalated', { ticketId: ticket.ticketId, priority: ticket.priority });
      }
    }
  }
}

module.exports = { checkSLABreaches };
