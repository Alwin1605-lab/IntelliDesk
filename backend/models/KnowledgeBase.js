const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 300,
    },
    problem: {
      type: String,
      required: [true, 'Problem description is required'],
      maxlength: 5000,
    },
    solution: {
      type: String,
      required: [true, 'Solution is required'],
      maxlength: 10000,
    },
    category: {
      type: String,
      enum: ['Network', 'Hardware', 'Software', 'Security', 'Access', 'Other'],
      required: true,
    },
    tags: [String],
    resolvedTicketRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      default: null,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

knowledgeBaseSchema.index({ category: 1 });
knowledgeBaseSchema.index({ tags: 1 });
knowledgeBaseSchema.index({ title: 'text', problem: 'text', solution: 'text' });

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
