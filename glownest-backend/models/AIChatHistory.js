// ─────────────────────────────────────
//  models/AIChatHistory.js – AI Consultation Schema
// ─────────────────────────────────────

const mongoose = require('mongoose');

const AIChatHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  skinProfile: {
    skinType:     { type: String },
    concerns:     [{ type: String }],
    currentProducts: { type: String }
  },
  routine: {
    morning: [{ type: String }],
    evening: [{ type: String }],
    tips:    [{ type: String }]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AIChatHistory', AIChatHistorySchema);
