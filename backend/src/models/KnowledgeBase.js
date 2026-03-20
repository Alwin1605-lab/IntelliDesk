const mongoose = require('mongoose');

const kbCommentSchema = new mongoose.Schema({
  text:      { type: String, required: true },
  author:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

const kbSchema = new mongoose.Schema({
  title:    { type: String, required: true, trim: true },
  content:  { type: String, required: true },
  category: {
    type: String,
    enum: ['network', 'software', 'hardware', 'authentication', 'email', 'database', 'security', 'hr', 'other'],
    required: true,
  },
  tags:         [String],
  helpful:      { type: Number, default: 0 },
  notHelpful:   { type: Number, default: 0 },
  views:        { type: Number, default: 0 },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublished:  { type: Boolean, default: true },

  // Ticket linkage
  sourceTicket:   { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', default: null },
  linkedTickets:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
  affectedCount:  { type: Number, default: 1 }, // sourceTicket counts as 1

  // Community comments
  comments: [kbCommentSchema],
}, { timestamps: true });

kbSchema.index({ category: 1 });
kbSchema.index({ tags: 1 });
kbSchema.index({ title: 'text', content: 'text', tags: 'text' });
kbSchema.index({ sourceTicket: 1 });

module.exports = mongoose.model('KnowledgeBase', kbSchema);
