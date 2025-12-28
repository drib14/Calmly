const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    default: 'Untitled Entry'
  },
  content: {
    type: String,
    required: true,
  },
  mood: {
    type: String,
    required: true,
  },
  tags: [String],
  isLocked: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Journal = mongoose.model('Journal', journalSchema);

module.exports = Journal;
