const mongoose = require('mongoose');

const kbSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  category: {
    type: String,
    enum: ['network', 'software', 'hardware', 'authentication', 'email', 'database', 'security', 'hr', 'other'],
    required: true,
  },
  tags: [String],
  helpful: { type: Number, default: 0 },
  notHelpful: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });

kbSchema.index({ category: 1 });
kbSchema.index({ tags: 1 });
kbSchema.index({ title: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('KnowledgeBase', kbSchema);
