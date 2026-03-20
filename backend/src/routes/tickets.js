const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const KnowledgeBase = require('../models/KnowledgeBase');
const { protect, authorize } = require('../middleware/auth');
const { classifyTicket, findSimilarTickets } = require('../utils/aiService');

const router = express.Router();

// ─── File upload setup ───
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, Office docs, text, zip
    const allowed = /\.(jpe?g|png|gif|webp|svg|pdf|docx?|xlsx?|pptx?|txt|csv|zip|log)$/i;
    if (allowed.test(path.extname(file.originalname))) return cb(null, true);
    cb(new Error(`File type not allowed: ${file.originalname}`));
  },
});

// ─── Helper: auto-assign to least busy technician ───
async function autoAssignTechnician(category) {
  const skillMap = {
    network: ['network'], hardware: ['hardware'], software: ['software'],
    authentication: ['authentication', 'security'], email: ['email'],
    database: ['database'], security: ['security'], hr: ['hr'],
  };
  const requiredSkills = skillMap[category] || [];

  const query = {
    role: 'technician',
    isActive: { $ne: false },
    isAvailable: true,
  };
  if (requiredSkills.length) {
    query.skills = { $in: requiredSkills };
  }

  // Find least busy technician with matching skill
  let technician = await User.findOne(query).sort({ activeTickets: 1 });
  if (!technician) {
    // Fallback: any available technician
    technician = await User.findOne({ role: 'technician', isActive: { $ne: false }, isAvailable: true }).sort({ activeTickets: 1 });
  }
  return technician;
}

// GET /api/tickets
router.get('/', protect, async (req, res) => {
  try {
    const { status, category, priority, assignedTo, page = 1, limit = 20, sort = '-createdAt', search } = req.query;
    const filter = {};

    if (req.user.role === 'user') filter.createdBy = req.user._id;
    else if (req.user.role === 'technician') {
      filter.$or = [{ assignedTo: req.user._id }, { assignedTo: null }];
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { ticketId: { $regex: search, $options: 'i' } },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate('createdBy', 'name email department')
        .populate('assignedTo', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Ticket.countDocuments(filter),
    ]);

    res.json({ data: tickets, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tickets/classify
router.post('/classify', protect, async (req, res) => {
  try {
    const { title, description } = req.body;
    const result = await classifyTicket(title, description);
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tickets
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, category, priority, source, tags } = req.body;
    if (!title || !description) return res.status(400).json({ message: 'Title and description required' });

    // AI Classification
    let aiData = {};
    try {
      aiData = await classifyTicket(title, description);
    } catch (e) { console.error('AI error:', e.message); }

    const finalCategory = category || aiData.category || 'other';
    const finalPriority = priority || aiData.priority || 'medium';

    // Auto-assign
    const technician = await autoAssignTechnician(finalCategory);

    // SLA
    const slaMap = { critical: 1, high: 4, medium: 24, low: 72 };
    const slaHours = slaMap[finalPriority] || 24;
    const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000);

    // Find related KB articles
    const relatedArticles = await KnowledgeBase.find({ category: finalCategory, isPublished: true }).limit(3).select('_id');

    const ticket = await Ticket.create({
      title, description,
      category: finalCategory,
      priority: finalPriority,
      source: source || 'web',
      tags: tags || [],
      createdBy: req.user._id,
      assignedTo: technician?._id || null,
      assignedTeam: aiData.assignedTeam || '',
      aiConfidence: aiData.confidence || 0,
      aiSuggestions: aiData.aiSuggestions || [],
      similarTickets: aiData.similarTickets || [],
      categoryProbabilities: aiData.categoryProbabilities || {},
      slaHours,
      slaDeadline,
      relatedArticles: relatedArticles.map(a => a._id),
      history: [{
        action: 'created',
        newValue: 'open',
        changedBy: req.user._id,
      }],
    });

    // Update technician load
    if (technician) {
      await User.findByIdAndUpdate(technician._id, { $inc: { activeTickets: 1 } });
    }

    const populated = await ticket.populate([
      { path: 'createdBy', select: 'name email department' },
      { path: 'assignedTo', select: 'name email' },
      { path: 'relatedArticles', select: 'title category' },
    ]);

    // Emit real-time event
    const io = req.app.get('io');
    if (io) io.emit('ticket:created', populated);

    res.status(201).json({ data: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tickets/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email department')
      .populate('assignedTo', 'name email activeTickets')
      .populate('comments.author', 'name role')
      .populate('relatedArticles', 'title category');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Users can only see their own tickets
    if (req.user.role === 'user' && ticket.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ data: ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tickets/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const { status, priority, assignedTo, category, title, description, resolution } = req.body;
    const history = [];

    if (status && status !== ticket.status) {
      history.push({ action: 'status_changed', oldValue: ticket.status, newValue: status, changedBy: req.user._id });
      ticket.status = status;
      if (['resolved', 'closed'].includes(status)) {
        ticket.resolvedAt = new Date();
        // Update technician stats
        if (ticket.assignedTo) {
          await User.findByIdAndUpdate(ticket.assignedTo, {
            $inc: { activeTickets: -1, totalResolved: 1 },
          });
        }
        // Auto-create KB article on resolve if resolution text provided
        const resolutionText = resolution !== undefined ? resolution : ticket.resolution;
        if (resolutionText && resolutionText.trim()) {
          const existingKb = await KnowledgeBase.findOne({ sourceTicket: ticket._id });
          if (!existingKb) {
            let content = resolutionText.trim();
            if (ticket.aiSuggestions?.length) {
              content += '\n\nRecommended Steps:\n' + ticket.aiSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n');
            }
            const kbArticle = await KnowledgeBase.create({
              title: ticket.title,
              content,
              category: ticket.category,
              tags: ticket.tags || [],
              createdBy: req.user._id,
              sourceTicket: ticket._id,
              affectedCount: 1,
              isPublished: true,
            });
            if (!ticket.relatedArticles) ticket.relatedArticles = [];
            ticket.relatedArticles.push(kbArticle._id);
          }
        }
      }
    }    if (priority && priority !== ticket.priority) {
      history.push({ action: 'priority_changed', oldValue: ticket.priority, newValue: priority, changedBy: req.user._id });
      ticket.priority = priority;
      const slaMap = { critical: 1, high: 4, medium: 24, low: 72 };
      ticket.slaHours = slaMap[priority] || 24;
      ticket.slaDeadline = new Date(Date.now() + ticket.slaHours * 3600 * 1000);
    }

    if (assignedTo !== undefined) {
      // Decrement old assignee
      if (ticket.assignedTo) {
        await User.findByIdAndUpdate(ticket.assignedTo, { $inc: { activeTickets: -1 } });
      }
      history.push({ action: 'assigned', oldValue: ticket.assignedTo?.toString(), newValue: assignedTo, changedBy: req.user._id });
      ticket.assignedTo = assignedTo || null;
      if (assignedTo) {
        await User.findByIdAndUpdate(assignedTo, { $inc: { activeTickets: 1 } });
        if (!ticket.firstResponseAt) ticket.firstResponseAt = new Date();
      }
    }

    if (category && category !== ticket.category) {
      history.push({ action: 'category_changed', oldValue: ticket.category, newValue: category, changedBy: req.user._id });
      ticket.category = category;
    }

    if (title) ticket.title = title;
    if (description) ticket.description = description;
    if (resolution !== undefined) ticket.resolution = resolution;

    ticket.history.push(...history);
    await ticket.save();

    const updated = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email department')
      .populate('assignedTo', 'name email')
      .populate('comments.author', 'name role')
      .populate('relatedArticles', 'title category');

    const io = req.app.get('io');
    if (io) io.emit('ticket:updated', updated);

    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tickets/:id (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ message: 'Ticket deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tickets/:id/comments  (multipart/form-data, up to 5 files)
router.post('/:id/comments', protect, upload.array('files', 5), async (req, res) => {
  try {
    const { text, isInternal } = req.body;
    if (!text?.trim() && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: 'Comment must have text or at least one attachment' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const attachments = (req.files || []).map(f => ({
      filename:     f.filename,
      originalName: f.originalname,
      mimetype:     f.mimetype,
      size:         f.size,
      url:          `/api/uploads/${f.filename}`,
    }));

    ticket.comments.push({
      text:        text?.trim() || '',
      author:      req.user._id,
      isInternal:  !!isInternal,
      attachments,
    });

    if (!ticket.firstResponseAt && req.user.role !== 'user') {
      ticket.firstResponseAt = new Date();
    }
    if (ticket.status === 'open' && req.user.role !== 'user') {
      ticket.status = 'in-progress';
    }
    await ticket.save();

    await ticket.populate('comments.author', 'name role');
    res.json({ data: ticket.comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tickets/:id/feedback
router.post('/:id/feedback', protect, async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    await Ticket.findByIdAndUpdate(req.params.id, { rating, feedback });
    res.json({ message: 'Feedback saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tickets/:id/resolve — auto-resolve
router.post('/:id/resolve', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedAt: new Date(),
        $push: { history: { action: 'auto_resolved', newValue: 'resolved', changedBy: req.user._id } }
      },
      { new: true }
    ).populate('createdBy', 'name email department').populate('assignedTo', 'name email');

    if (ticket?.assignedTo) {
      await User.findByIdAndUpdate(ticket.assignedTo, { $inc: { activeTickets: -1, totalResolved: 1 } });
    }
    res.json({ data: ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tickets/:id/similar
router.get('/:id/similar', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    const similar = await findSimilarTickets(ticket.title, ticket.description);
    res.json({ data: similar });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
