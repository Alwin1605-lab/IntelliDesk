const express = require('express');
const KnowledgeBase = require('../models/KnowledgeBase');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { asyncHandler } = require('../utils/helpers');
const { rebuildIndex } = require('../services/aiService');

const router = express.Router();

// GET /api/knowledge-base - List/search knowledge base
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { search, category, page = 1, limit = 20 } = req.query;
    const filter = { isPublished: true };

    if (category) filter.category = category;
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [articles, total] = await Promise.all([
      KnowledgeBase.find(filter)
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      KnowledgeBase.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        articles,
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

// GET /api/knowledge-base/:id - Get single article
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const article = await KnowledgeBase.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('createdBy', 'name');

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }

    res.json({
      success: true,
      data: { article },
    });
  })
);

// POST /api/knowledge-base - Create article (Admin/Technician)
router.post(
  '/',
  auth,
  roleGuard('admin', 'technician'),
  asyncHandler(async (req, res) => {
    const { title, problem, solution, category, tags } = req.body;

    const article = await KnowledgeBase.create({
      title,
      problem,
      solution,
      category,
      tags: tags || [],
      createdBy: req.user._id,
    });

    // Trigger FAISS index rebuild (non-blocking)
    const allArticles = await KnowledgeBase.find({ isPublished: true }).lean();
    rebuildIndex(
      allArticles.map((a) => ({
        id: a._id.toString(),
        title: a.title,
        problem: a.problem,
        solution: a.solution,
        category: a.category,
      }))
    ).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Article created',
      data: { article },
    });
  })
);

// PATCH /api/knowledge-base/:id/helpful - Mark as helpful
router.patch(
  '/:id/helpful',
  auth,
  asyncHandler(async (req, res) => {
    const article = await KnowledgeBase.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }

    res.json({
      success: true,
      message: 'Marked as helpful',
      data: { article },
    });
  })
);

module.exports = router;
