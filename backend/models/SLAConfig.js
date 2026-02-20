const mongoose = require('mongoose');

const slaConfigSchema = new mongoose.Schema(
  {
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      required: true,
      unique: true,
    },
    responseMinutes: {
      type: Number,
      required: true,
    },
    resolutionMinutes: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SLAConfig', slaConfigSchema);
