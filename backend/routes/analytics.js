const express = require('express');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { asyncHandler } = require('../utils/helpers');

const router = express.Router();

// GET /api/analytics/dashboard - Admin dashboard stats
router.get(
  '/dashboard',
  auth,
  roleGuard('admin'),
  asyncHandler(async (req, res) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Run all aggregations in parallel
    const [
      totalTickets,
      statusCounts,
      categoryCounts,
      priorityCounts,
      avgResolution,
      recentTickets,
      slaStats,
      techWorkload,
      ticketTrend,
    ] = await Promise.all([
      // Total tickets
      Ticket.countDocuments(),

      // Tickets by status
      Ticket.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Tickets by category
      Ticket.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),

      // Tickets by priority
      Ticket.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),

      // Average resolution time (for resolved tickets)
      Ticket.aggregate([
        {
          $match: {
            resolvedAt: { $ne: null },
          },
        },
        {
          $project: {
            resolutionTime: {
              $subtract: ['$resolvedAt', '$createdAt'],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: '$resolutionTime' },
            minTime: { $min: '$resolutionTime' },
            maxTime: { $max: '$resolutionTime' },
          },
        },
      ]),

      // Recent tickets (last 10)
      Ticket.find()
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // SLA compliance
      Ticket.aggregate([
        {
          $match: {
            'slaDeadline.resolution': { $ne: null },
            status: { $in: ['Resolved', 'Closed'] },
          },
        },
        {
          $project: {
            breached: {
              $cond: {
                if: { $gt: ['$resolvedAt', '$slaDeadline.resolution'] },
                then: 1,
                else: 0,
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            breached: { $sum: '$breached' },
          },
        },
      ]),

      // Technician workload
      User.find({ role: 'technician', isActive: true })
        .select('name email department activeTicketCount')
        .sort({ activeTicketCount: -1 })
        .lean(),

      // Ticket trend (last 30 days, grouped by day)
      Ticket.aggregate([
        {
          $match: { createdAt: { $gte: thirtyDaysAgo } },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Process status counts into a map
    const statusMap = {};
    statusCounts.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    // Calculate SLA compliance percentage
    const slaCompliance =
      slaStats.length > 0
        ? Math.round(
            ((slaStats[0].total - slaStats[0].breached) / slaStats[0].total) *
              100
          )
        : 100;

    // Format avg resolution time
    const avgResolutionMs =
      avgResolution.length > 0 ? avgResolution[0].avgTime : 0;
    const avgResolutionHours = Math.round(avgResolutionMs / (1000 * 60 * 60) * 10) / 10;

    // Count open, in progress, escalated
    const openTickets = (statusMap['Open'] || 0) + (statusMap['Escalated'] || 0);
    const inProgress = statusMap['In Progress'] || 0;
    const resolved = (statusMap['Resolved'] || 0) + (statusMap['Closed'] || 0);
    const escalated = statusMap['Escalated'] || 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalTickets,
          openTickets,
          inProgress,
          resolved,
          escalated,
          slaCompliance,
          avgResolutionHours,
        },
        byCategory: categoryCounts.map((c) => ({
          name: c._id,
          value: c.count,
        })),
        byPriority: priorityCounts.map((p) => ({
          name: p._id,
          value: p.count,
        })),
        byStatus: statusCounts.map((s) => ({
          name: s._id,
          value: s.count,
        })),
        techWorkload: techWorkload.map((t) => ({
          name: t.name,
          department: t.department,
          activeTickets: t.activeTicketCount,
        })),
        ticketTrend: ticketTrend.map((t) => ({
          date: t._id,
          count: t.count,
        })),
        recentTickets,
      },
    });
  })
);

// GET /api/analytics/sla - SLA detailed stats
router.get(
  '/sla',
  auth,
  roleGuard('admin'),
  asyncHandler(async (req, res) => {
    const [
      breachedTickets,
      upcomingBreaches,
      complianceByPriority,
    ] = await Promise.all([
      // Currently breached
      Ticket.find({
        status: { $in: ['Open', 'In Progress', 'Escalated'] },
        'slaDeadline.resolution': { $lt: new Date() },
      })
        .populate('assignedTo', 'name email')
        .sort({ 'slaDeadline.resolution': 1 })
        .limit(20)
        .lean(),

      // Breaching within next 2 hours
      Ticket.find({
        status: { $in: ['Open', 'In Progress'] },
        'slaDeadline.resolution': {
          $gt: new Date(),
          $lt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      })
        .populate('assignedTo', 'name email')
        .sort({ 'slaDeadline.resolution': 1 })
        .lean(),

      // Compliance by priority
      Ticket.aggregate([
        {
          $match: {
            'slaDeadline.resolution': { $ne: null },
            resolvedAt: { $ne: null },
          },
        },
        {
          $project: {
            priority: 1,
            breached: {
              $cond: {
                if: { $gt: ['$resolvedAt', '$slaDeadline.resolution'] },
                then: 1,
                else: 0,
              },
            },
          },
        },
        {
          $group: {
            _id: '$priority',
            total: { $sum: 1 },
            breached: { $sum: '$breached' },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        breachedTickets,
        upcomingBreaches,
        complianceByPriority: complianceByPriority.map((p) => ({
          priority: p._id,
          total: p.total,
          compliant: p.total - p.breached,
          breached: p.breached,
          complianceRate:
            Math.round(((p.total - p.breached) / p.total) * 100),
        })),
      },
    });
  })
);

module.exports = router;
