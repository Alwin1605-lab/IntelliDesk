const express = require('express');
const { protect } = require('../middleware/auth');
const { chatbotResponse } = require('../utils/aiService');
const KnowledgeBase = require('../models/KnowledgeBase');

const router = express.Router();

// POST /api/chatbot/message
router.post('/message', protect, async (req, res) => {
  try {
    const { message, sessionId, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });

    // Pre-fetch KB articles to give the LLM relevant context
    const kbMatches = await KnowledgeBase.find({
      isPublished: true,
      $or: [
        { title: { $regex: message.slice(0, 60), $options: 'i' } },
        { content: { $regex: message.slice(0, 60), $options: 'i' } },
        { tags: { $regex: message.slice(0, 30), $options: 'i' } },
      ],
    }).select('title content category').limit(3);

    // Build a compact KB context string for the LLM system prompt
    const kbContext = kbMatches.length
      ? kbMatches.map(a =>
          `[${a.category.toUpperCase()}] ${a.title}:\n${(a.content || '').slice(0, 300)}`
        ).join('\n\n')
      : '';

    // Convert frontend history [{role:'bot'|'user', text}] to LLM format
    const llmHistory = history
      .filter(h => h.role && h.text)
      .map(h => ({ role: h.role === 'bot' ? 'assistant' : 'user', content: h.text }));

    const aiResponse = await chatbotResponse(message, llmHistory, kbContext);

    // Fetch KB articles by category to show as links
    let kbArticles = [];
    if (aiResponse.category && aiResponse.category !== 'other') {
      kbArticles = await KnowledgeBase.find({
        category: aiResponse.category,
        isPublished: true,
      }).select('_id title category').limit(3);
    } else if (kbMatches.length) {
      kbArticles = kbMatches.map(a => ({ _id: a._id, title: a.title, category: a.category }));
    }

    res.json({
      data: {
        response: aiResponse.response,
        category: aiResponse.category,
        confidence: aiResponse.confidence,
        suggestions: aiResponse.suggestions || [],
        kbArticles,
        suggestTicketCreation: aiResponse.suggestTicket || false,
        model: aiResponse.model || 'unknown',
        sessionId,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
