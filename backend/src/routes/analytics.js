const express = require('express');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { analyzeRootCause } = require('../utils/aiService');

const router = express.Router();

// GET /api/analytics/summary
router.get('/summary', protect, authorize('admin', 'technician'), async (req, res) => {
  try {
    const now = new Date();
    const [
      totalTickets, openTickets, inProgressTickets, resolvedTickets,
      criticalTickets, slaBreached
    ] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: 'open' }),
      Ticket.countDocuments({ status: 'in-progress' }),
      Ticket.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
      Ticket.countDocuments({ priority: 'critical', status: { $nin: ['resolved', 'closed'] } }),
      Ticket.countDocuments({ slaBreached: true }),
    ]);

    // Avg resolution time (hours)
    const resolved = await Ticket.find({
      status: { $in: ['resolved', 'closed'] },
      resolvedAt: { $exists: true },
      createdAt: { $exists: true },
    }).select('createdAt resolvedAt');

    const avgResolutionTime = resolved.length
      ? Math.round(resolved.reduce((sum, t) => {
          return sum + (t.resolvedAt - t.createdAt) / 3600000;
        }, 0) / resolved.length * 10) / 10
      : 0;

    res.json({
      data: {
        totalTickets, openTickets, inProgressTickets, resolvedTickets,
        criticalTickets, slaBreached, avgResolutionTime,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/trends
router.get('/trends', protect, authorize('admin', 'technician'), async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const [byCategory, byPriority, byStatus, ticketsByDay, topTechnicians] = await Promise.all([
      Ticket.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Ticket.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Ticket.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            created: { $sum: 1 },
            resolved: {
              $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } },
      ]),
      User.find({ role: 'technician', totalResolved: { $gt: 0 } })
        .select('name activeTickets totalResolved avgResolutionTime')
        .sort({ totalResolved: -1 })
        .limit(10),
    ]);

    // Category trend (week over week)
    const categoryTrend = await Ticket.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 14 * 24 * 3600 * 1000) } } },
      {
        $group: {
          _id: {
            category: '$category',
            week: { $week: '$createdAt' },
          },
          count: { $sum: 1 },
        }
      },
    ]);

    res.json({
      data: { byCategory, byPriority, byStatus, ticketsByDay, topTechnicians, categoryTrend }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/sla
router.get('/sla', protect, authorize('admin', 'technician'), async (req, res) => {
  try {
    const slaData = await Ticket.aggregate([
      {
        $group: {
          _id: '$priority',
          total: { $sum: 1 },
          breached: { $sum: { $cond: ['$slaBreached', 1, 0] } },
          avgResolutionHours: {
            $avg: {
              $cond: [
                { $and: [{ $ne: ['$resolvedAt', null] }, { $ne: ['$createdAt', null] }] },
                { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000] },
                null,
              ]
            }
          }
        }
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ data: slaData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/root-cause
router.get('/root-cause', protect, authorize('admin', 'technician'), async (req, res) => {
  try {
    const { days = 30, category } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 3600 * 1000);
    const filter = { createdAt: { $gte: since } };
    if (category) filter.category = category;

    const tickets = await Ticket.find(filter).select('title description category priority status').limit(200);
    const analysis = await analyzeRootCause(tickets);

    // Also find most repeated issue categories
    const categoryCount = await Ticket.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({ data: { ...analysis, categoryCount } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/team-performance
router.get('/team-performance', protect, authorize('admin', 'technician'), async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician' })
      .select('name email department skills activeTickets totalResolved avgResolutionTime isAvailable');

    const performance = await Promise.all(technicians.map(async (tech) => {
      const tickets = await Ticket.find({ assignedTo: tech._id }).select('status priority createdAt resolvedAt slaBreached');
      const resolved = tickets.filter(t => ['resolved', 'closed'].includes(t.status));
      const avgTime = resolved.length
        ? resolved.filter(t => t.resolvedAt).reduce((s, t) => s + (t.resolvedAt - t.createdAt) / 3600000, 0) / resolved.length
        : 0;
      const slaBreached = tickets.filter(t => t.slaBreached).length;

      return {
        ...tech.toObject(),
        resolvedCount: resolved.length,
        totalAssigned: tickets.length,
        avgResolutionTime: Math.round(avgTime * 10) / 10,
        slaBreachCount: slaBreached,
        successRate: tickets.length > 0 ? Math.round((resolved.length / tickets.length) * 100) : 0,
      };
    }));

    res.json({ data: performance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
