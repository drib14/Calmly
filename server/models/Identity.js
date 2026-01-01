const mongoose = require('mongoose');

const identitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['real', 'pseudonym', 'anonymous'],
    required: true,
  },
  name: {
    type: String,
    required: true, // "Anonymous" for anonymous type
  },
  handle: {
    type: String, // e.g. @poet_soul
    sparse: true,
  },
  bio: {
    type: String,
    default: '',
  },
  avatar: {
    type: String, // URL
    default: '',
  },
  coverPhoto: {
    type: String, // URL
    default: '',
  },
  avatarHistory: [{ type: String }], // Array of URLs
  coverHistory: [{ type: String }], // Array of URLs
  isLocked: {
    type: Boolean,
    default: false, // If true, cannot be edited/deleted easily
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Identity = mongoose.model('Identity', identitySchema);

module.exports = Identity;
