const express = require('express');
const KnowledgeBase = require('../models/KnowledgeBase');
const Ticket = require('../models/Ticket');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/kb  (list) ───────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const articles = await KnowledgeBase.find(filter)
      .populate('createdBy', 'name')
      .populate('sourceTicket', 'ticketId title status')
      .sort({ affectedCount: -1, views: -1 })
      .limit(50);

    res.json({ data: articles });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/kb/suggest?title=...&category=...  (similar KB for new ticket) ──
router.get('/suggest', protect, async (req, res) => {
  try {
    const { title, category } = req.query;
    if (!title) return res.json({ data: [] });

    const filter = { isPublished: true };
    if (category) filter.category = category;

    // Full-text search on title
    const byText = await KnowledgeBase.find(
      { ...filter, $text: { $search: title } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(3)
      .select('title category affectedCount tags views');

    // Fallback: category match if no text hits
    let results = byText;
    if (!results.length && category) {
      results = await KnowledgeBase.find(filter)
        .sort({ affectedCount: -1 })
        .limit(3)
        .select('title category affectedCount tags views');
    }

    res.json({ data: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/kb/:id ──────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const article = await KnowledgeBase.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('createdBy', 'name role')
      .populate('sourceTicket', 'ticketId title status createdAt')
      .populate('linkedTickets', 'ticketId title status createdAt')
      .populate('comments.author', 'name role');

    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json({ data: article });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/kb  (manual create) ────────────────────────────────────────
router.post('/', protect, authorize('admin', 'technician'), async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    if (!title || !content || !category)
      return res.status(400).json({ message: 'Title, content, and category are required' });

    const article = await KnowledgeBase.create({
      title, content, category,
      tags: tags || [],
      createdBy: req.user._id,
    });
    res.status(201).json({ data: article });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/kb/from-ticket/:ticketId  (auto-create from resolved ticket) ──
router.post('/from-ticket/:ticketId', protect, authorize('admin', 'technician'), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId)
      .populate('createdBy', 'name');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Check if a KB article already exists for this ticket
    const existing = await KnowledgeBase.findOne({ sourceTicket: ticket._id });
    if (existing) return res.status(409).json({ message: 'KB article already exists for this ticket', data: existing });

    // Build content from resolution + AI suggestions
    let content = ticket.resolution || ticket.description;
    if (ticket.aiSuggestions?.length) {
      content += '\n\nRecommended Steps:\n' + ticket.aiSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n');
    }

    const article = await KnowledgeBase.create({
      title:        ticket.title,
      content,
      category:     ticket.category,
      tags:         ticket.tags || [],
      createdBy:    req.user._id,
      sourceTicket: ticket._id,
      affectedCount: 1,
    });

    // Back-link: store KB article id on the ticket's relatedArticles
    await Ticket.findByIdAndUpdate(ticket._id, {
      $addToSet: { relatedArticles: article._id }
    });

    res.status(201).json({ data: article });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/kb/:id ──────────────────────────────────────────────────────
router.put('/:id', protect, authorize('admin', 'technician'), async (req, res) => {
  try {
    const article = await KnowledgeBase.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json({ data: article });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /api/kb/:id ───────────────────────────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await KnowledgeBase.findByIdAndDelete(req.params.id);
    res.json({ message: 'Article deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/kb/:id/rate ────────────────────────────────────────────────
router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { rating } = req.body;
    const update = rating === 'helpful' ? { $inc: { helpful: 1 } } : { $inc: { notHelpful: 1 } };
    await KnowledgeBase.findByIdAndUpdate(req.params.id, update);
    res.json({ message: 'Feedback recorded' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/kb/:id/link-ticket  (link a duplicate ticket) ──────────────
router.post('/:id/link-ticket', protect, authorize('admin', 'technician'), async (req, res) => {
  try {
    const { ticketId } = req.body;
    if (!ticketId) return res.status(400).json({ message: 'ticketId is required' });

    const article = await KnowledgeBase.findByIdAndUpdate(
      req.params.id,
      {
        $addToSet: { linkedTickets: ticketId },
        $inc: { affectedCount: 1 },
      },
      { new: true }
    )
      .populate('createdBy', 'name role')
      .populate('sourceTicket', 'ticketId title status createdAt')
      .populate('linkedTickets', 'ticketId title status createdAt')
      .populate('comments.author', 'name role');

    if (!article) return res.status(404).json({ message: 'Article not found' });

    // Also store the KB ref on the ticket
    await Ticket.findByIdAndUpdate(ticketId, {
      $addToSet: { relatedArticles: article._id }
    });

    res.json({ data: article });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/kb/:id/comments ────────────────────────────────────────────
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const article = await KnowledgeBase.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { text: text.trim(), author: req.user._id } } },
      { new: true }
    ).populate('comments.author', 'name role');

    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json({ data: article.comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
