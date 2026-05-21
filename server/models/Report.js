const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Polymorphic References
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  identity: { type: mongoose.Schema.Types.ObjectId, ref: 'Identity' }, // For reporting a user profile
  message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },

  targetType: {
      type: String,
      enum: ['Post', 'Comment', 'Identity', 'Message'],
      required: true
  },

  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending'
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema);
