const mongoose = require('mongoose');

const clipSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  identity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Identity',
    required: true
  },
  mediaUrl: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  viewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Identity'
  }],
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Auto-delete when expired
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Clip', clipSchema);
