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
  audience: {
    type: String,
    enum: ['public', 'followers', 'me'],
    default: 'public',
  },
  duration: {
    type: Number, // In hours, for reference
    default: 24,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expireAt: {
    type: Date,
    index: { expires: 0 }, // Documents expire at this time
  },
});

const Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote;
