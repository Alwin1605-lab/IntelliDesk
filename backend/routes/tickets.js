const express = require('express');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { validateTicket, validateComment, validateObjectId } = require('../middleware/validate');
const { asyncHandler } = require('../utils/helpers');
const { classifyTicket, predictPriority, getRecommendations } = require('../services/aiService');
const { assignTechnician, releaseTechnician } = require('../services/routingService');
const { computeSLADeadlines } = require('../services/slaService');
const { sendEmail, templates } = require('../services/emailService');

const router = express.Router();

// GET /api/tickets - List tickets (filtered by role)
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};

    // Role-based filtering
    if (req.user.role === 'employee') {
      filter.createdBy = req.user._id;
    } else if (req.user.role === 'technician') {
      filter.assignedTo = req.user._id;
    }
    // admin sees all

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ticketId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate('createdBy', 'name email role department')
        .populate('assignedTo', 'name email role department')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Ticket.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  })
);

// GET /api/tickets/:id - Get ticket detail
router.get(
  '/:id',
  auth,
  validateObjectId,
  asyncHandler(async (req, res) => {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email role department')
      .populate('assignedTo', 'name email role department')
      .populate('comments.author', 'name email role');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Employees can only see their own tickets
    if (
      req.user.role === 'employee' &&
      ticket.createdBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: { ticket },
    });
  })
);

// POST /api/tickets - Create ticket
router.post(
  '/',
  auth,
  validateTicket,
  asyncHandler(async (req, res) => {
    const { title, description, channel = 'web' } = req.body;
    const combinedText = `${title} ${description}`;

    // AI classification, priority prediction, and KB recommendations (in parallel)
    const [classResult, priorityResult, suggestions] = await Promise.all([
      classifyTicket(combinedText),
      predictPriority(combinedText, ''),
      getRecommendations(combinedText),
    ]);

    const category = classResult.category;
    const priority = priorityResult.priority;

    // Compute SLA deadlines
    const slaDeadline = computeSLADeadlines(priority);

    // Auto-assign technician
    const technician = await assignTechnician(category);

    // Create ticket
    const ticket = await Ticket.create({
      title,
      description,
      category,
      priority,
      status: technician ? 'In Progress' : 'Open',
      channel,
      createdBy: req.user._id,
      assignedTo: technician ? technician._id : null,
      department: category === 'Access' ? 'IT' : category,
      aiClassification: {
        category: classResult.category,
        confidence: classResult.confidence,
        prioritySuggestion: priorityResult.priority,
        priorityScore: priorityResult.score,
      },
      aiSuggestions: suggestions.slice(0, 3),
      slaDeadline,
    });

    // Populate for response
    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email role department')
      .populate('assignedTo', 'name email role department');

    // Send emails (non-blocking)
    const emailPromises = [];
    const creator = await User.findById(req.user._id);
    emailPromises.push(
      sendEmail({
        to: creator.email,
        ...templates.ticketCreated(populatedTicket, creator),
      })
    );

    if (technician) {
      emailPromises.push(
        sendEmail({
          to: technician.email,
          ...templates.ticketAssigned(populatedTicket, technician),
        })
      );
    }

    // Fire and forget email sending
    Promise.all(emailPromises).catch((err) =>
      console.error('[Email] Send error:', err.message)
    );

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: { ticket: populatedTicket },
    });
  })
);

// PATCH /api/tickets/:id - Update ticket (status, priority, assignment, etc.)
router.patch(
  '/:id',
  auth,
  roleGuard('admin', 'technician'),
  validateObjectId,
  asyncHandler(async (req, res) => {
    const { status, priority, assignedTo, category } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    const oldStatus = ticket.status;
    const oldAssignee = ticket.assignedTo;

    if (status) ticket.status = status;
    if (priority) {
      ticket.priority = priority;
      ticket.slaDeadline = computeSLADeadlines(priority);
    }
    if (category) ticket.category = category;

    // Handle status transitions
    if (status === 'Resolved' && oldStatus !== 'Resolved') {
      ticket.resolvedAt = new Date();
      // Release technician
      if (ticket.assignedTo) {
        await releaseTechnician(ticket.assignedTo);
      }
      // Send resolution email
      const creator = await User.findById(ticket.createdBy);
      if (creator) {
        const emailData = templates.ticketResolved(ticket, creator);
        sendEmail({ to: creator.email, ...emailData }).catch(() => {});
      }
    }

    if (status === 'Closed' && oldStatus !== 'Closed') {
      ticket.closedAt = new Date();
      if (!ticket.resolvedAt) ticket.resolvedAt = new Date();
      if (ticket.assignedTo && oldStatus !== 'Resolved') {
        await releaseTechnician(ticket.assignedTo);
      }
    }

    if (status === 'In Progress' && !ticket.respondedAt) {
      ticket.respondedAt = new Date();
    }

    // Handle reassignment
    if (assignedTo && assignedTo !== (oldAssignee ? oldAssignee.toString() : null)) {
      if (oldAssignee) await releaseTechnician(oldAssignee);
      await User.findByIdAndUpdate(assignedTo, {
        $inc: { activeTicketCount: 1 },
      });
      ticket.assignedTo = assignedTo;

      const newTech = await User.findById(assignedTo);
      if (newTech) {
        const emailData = templates.ticketAssigned(ticket, newTech);
        sendEmail({ to: newTech.email, ...emailData }).catch(() => {});
      }
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email role department')
      .populate('assignedTo', 'name email role department')
      .populate('comments.author', 'name email role');

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: { ticket: updatedTicket },
    });
  })
);

// POST /api/tickets/:id/comments - Add comment
router.post(
  '/:id/comments',
  auth,
  validateObjectId,
  validateComment,
  asyncHandler(async (req, res) => {
    const { text, isInternal = false } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    ticket.comments.push({
      author: req.user._id,
      text,
      isInternal,
    });

    // Mark as responded if technician/admin comments
    if (['technician', 'admin'].includes(req.user.role) && !ticket.respondedAt) {
      ticket.respondedAt = new Date();
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email role department')
      .populate('assignedTo', 'name email role department')
      .populate('comments.author', 'name email role');

    res.json({
      success: true,
      message: 'Comment added',
      data: { ticket: updatedTicket },
    });
  })
);

module.exports = router;
