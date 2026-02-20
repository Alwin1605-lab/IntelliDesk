const express = require('express');
const KnowledgeBase = require('../models/KnowledgeBase');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/kb
router.get('/', protect, async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (search) {
      filter.$text = { $search: search };
    }

    const articles = await KnowledgeBase.find(filter)
      .populate('createdBy', 'name')
      .sort({ views: -1, helpful: -1 })
      .limit(50);

    res.json({ data: articles });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/kb/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const article = await KnowledgeBase.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('createdBy', 'name');

    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json({ data: article });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/kb
router.post('/', protect, authorize('admin', 'technician'), async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Title, content, and category are required' });
    }
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

// PUT /api/kb/:id
router.put('/:id', protect, authorize('admin', 'technician'), async (req, res) => {
  try {
    const article = await KnowledgeBase.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json({ data: article });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/kb/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await KnowledgeBase.findByIdAndDelete(req.params.id);
    res.json({ message: 'Article deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/kb/:id/rate
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

module.exports = router;
