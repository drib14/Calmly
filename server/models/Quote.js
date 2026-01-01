const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  identity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Identity',
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxLength: 140, // Short like a status
  },
  mood: {
    type: String, // e.g. "Happy", "Sad" - maps to colors on frontend
    default: 'Neutral',
  },
  font: {
    type: String,
    default: 'font-serif',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // Auto-expire after 24 hours
  },
});

const Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote;
