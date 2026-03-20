const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const historySchema = new mongoose.Schema({
  action: String,
  oldValue: String,
  newValue: String,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
});

const attachmentSchema = new mongoose.Schema({
  filename:     { type: String, required: true },
  originalName: { type: String, required: true },
  mimetype:     { type: String, required: true },
  size:         { type: Number, required: true },
  url:          { type: String, required: true },
});

const commentSchema = new mongoose.Schema({
  text:        { type: String, default: '' },
  author:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isInternal:  { type: Boolean, default: false },
  attachments: [attachmentSchema],
  createdAt:   { type: Date, default: Date.now },
});

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    default: () => `TKT-${Date.now().toString(36).toUpperCase()}`,
  },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['network', 'software', 'hardware', 'authentication', 'email', 'database', 'security', 'hr', 'other'],
    default: 'other',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'pending', 'resolved', 'closed'],
    default: 'open',
  },
  source: {
    type: String,
    enum: ['web', 'email', 'chatbot', 'api', 'mobile'],
    default: 'web',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedTeam: { type: String, default: '' },

  // AI fields
  aiConfidence: { type: Number, default: 0 },
  aiSuggestions: [String],
  similarTickets: [mongoose.Schema.Types.Mixed],
  categoryProbabilities: mongoose.Schema.Types.Mixed,

  // SLA
  slaDeadline: Date,
  slaBreached: { type: Boolean, default: false },
  slaHours: { type: Number, default: 24 },

  // Timestamps
  firstResponseAt: Date,
  resolvedAt: Date,

  // Resolution
  resolution: { type: String, default: '' },

  // Feedback
  rating: { type: Number, min: 1, max: 5 },
  feedback: String,

  tags: [String],
  comments: [commentSchema],
  history: [historySchema],

  // Relations
  relatedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeBase' }],
}, { timestamps: true });

// Auto-compute SLA deadline before save
ticketSchema.pre('save', function (next) {
  if (this.isNew && !this.slaDeadline) {
    const slaMap = { critical: 1, high: 4, medium: 24, low: 72 };
    const hours = slaMap[this.priority] || 24;
    this.slaHours = hours;
    this.slaDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);
  }
  if (!this.isNew && this.isModified('status') && ['resolved', 'closed'].includes(this.status)) {
    if (!this.resolvedAt) this.resolvedAt = new Date();
  }
  next();
});

// Index for performance
ticketSchema.index({ createdBy: 1, status: 1 });
ticketSchema.index({ assignedTo: 1, status: 1 });
ticketSchema.index({ priority: 1, status: 1 });
ticketSchema.index({ slaDeadline: 1, slaBreached: 1 });
ticketSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);
