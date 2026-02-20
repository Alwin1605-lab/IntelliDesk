const cron = require('node-cron');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { sendEmail, templates } = require('./emailService');
const slaDefaults = require('../config/slaDefaults');

/**
 * Compute SLA deadlines based on priority
 */
const computeSLADeadlines = (priority) => {
  const config = slaDefaults[priority] || slaDefaults.Medium;
  const now = new Date();

  return {
    response: new Date(now.getTime() + config.responseMinutes * 60 * 1000),
    resolution: new Date(now.getTime() + config.resolutionMinutes * 60 * 1000),
  };
};

/**
 * Check for SLA breaches and escalate tickets
 */
const checkSLABreaches = async () => {
  try {
    const now = new Date();

    // Find tickets that have breached resolution SLA and are not yet resolved/closed/escalated
    const breachedTickets = await Ticket.find({
      status: { $in: ['Open', 'In Progress'] },
      isEscalated: false,
      'slaDeadline.resolution': { $lt: now },
    }).populate('createdBy assignedTo');

    if (breachedTickets.length === 0) return;

    console.log(`[SLA] Found ${breachedTickets.length} breached ticket(s)`);

    // Get admin users for escalation notification
    const admins = await User.find({ role: 'admin', isActive: true });

    for (const ticket of breachedTickets) {
      // Escalate the ticket
      ticket.status = 'Escalated';
      ticket.isEscalated = true;
      ticket.escalatedAt = now;
      await ticket.save();

      // Send email to each admin
      for (const admin of admins) {
        const emailData = templates.slaBreachWarning(ticket, admin);
        await sendEmail({
          to: admin.email,
          subject: emailData.subject,
          html: emailData.html,
        });
      }
    }
  } catch (error) {
    console.error('[SLA] Breach check error:', error.message);
  }
};

/**
 * Start SLA monitoring cron job (every 5 minutes)
 */
const startSLAMonitor = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[SLA] Running SLA breach check...');
    await checkSLABreaches();
  });

  console.log('[SLA] SLA monitor started (checks every 5 minutes)');
};

module.exports = { computeSLADeadlines, checkSLABreaches, startSLAMonitor };
