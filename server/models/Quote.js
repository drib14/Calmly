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
  views: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      identity: { type: mongoose.Schema.Types.ObjectId, ref: 'Identity' },
      timestamp: { type: Date, default: Date.now }
  }],
  reactions: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      identity: { type: mongoose.Schema.Types.ObjectId, ref: 'Identity' },
      type: { type: String, default: 'heart' }
  }],
  lastCheckedViews: { type: Date },
  createdAt: {
    type: Date,
    default: Date.now,
    // Removed TTL index to support archiving. Expiration handled by app logic.
  },
});

const Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote;
