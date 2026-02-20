const express = require('express');
const { protect } = require('../middleware/auth');
const { chatbotResponse } = require('../utils/aiService');
const KnowledgeBase = require('../models/KnowledgeBase');

const router = express.Router();

// POST /api/chatbot/message
router.post('/message', protect, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });

    const aiResponse = await chatbotResponse(message);

    // Fetch related KB articles
    let kbArticles = [];
    if (aiResponse.category && aiResponse.category !== 'other') {
      kbArticles = await KnowledgeBase.find({
        category: aiResponse.category,
        isPublished: true,
      }).select('_id title category').limit(3);
    }

    res.json({
      data: {
        response: aiResponse.response,
        category: aiResponse.category,
        confidence: aiResponse.confidence,
        suggestions: aiResponse.suggestions || [],
        kbArticles,
        suggestTicketCreation: aiResponse.suggestTicket || false,
        sessionId,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
