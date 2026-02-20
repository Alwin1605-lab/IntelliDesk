const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  isInternal: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 5000,
    },
    category: {
      type: String,
      enum: ['Network', 'Hardware', 'Software', 'Security', 'Access', 'Other'],
      default: 'Other',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed', 'Escalated'],
      default: 'Open',
    },
    channel: {
      type: String,
      enum: ['web', 'chatbot', 'email'],
      default: 'web',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    department: {
      type: String,
      default: 'General',
    },
    comments: [commentSchema],
    aiClassification: {
      category: String,
      confidence: Number,
      prioritySuggestion: String,
      priorityScore: Number,
    },
    aiSuggestions: [
      {
        title: String,
        solution: String,
        similarity: Number,
        articleId: String,
      },
    ],
    slaDeadline: {
      response: Date,
      resolution: Date,
    },
    respondedAt: Date,
    resolvedAt: Date,
    closedAt: Date,
    isEscalated: {
      type: Boolean,
      default: false,
    },
    escalatedAt: Date,
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate ticketId
ticketSchema.pre('save', async function (next) {
  if (this.isNew && !this.ticketId) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketId = `TIQ-${String(count + 1001).padStart(6, '0')}`;
  }
  next();
});

// Virtual: SLA breach check
ticketSchema.virtual('slaBreached').get(function () {
  if (!this.slaDeadline || !this.slaDeadline.resolution) return false;
  if (this.status === 'Resolved' || this.status === 'Closed') {
    return this.resolvedAt && this.resolvedAt > this.slaDeadline.resolution;
  }
  return new Date() > this.slaDeadline.resolution;
});

// Index for performance
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ createdBy: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ category: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
