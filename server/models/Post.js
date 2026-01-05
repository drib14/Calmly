const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  identity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Identity',
    required: true,
  },
  type: {
    type: String,
    enum: ['confession', 'poetry', 'letter', 'mood'],
    required: true,
  },
  title: {
    type: String, // For poetry/letters
  },
  content: {
    type: String,
  },
  letterFields: {
      header: String,
      footer: String,
      paperType: { type: String, default: 'classic' }
  },
  style: {
      backgroundColor: String, // For poetry
      font: String, // For poetry
      align: String, // For poetry
  },
  mood: {
    type: String,
    required: true, // e.g., "Melancholy", "Hopeful"
  },
  tags: [String],
  visibility: {
    type: String,
    enum: ['public', 'unlisted', 'private'],
    default: 'public',
  },
  likes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    identity: { type: mongoose.Schema.Types.ObjectId, ref: 'Identity' }
  }],
  reposts: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    identity: { type: mongoose.Schema.Types.ObjectId, ref: 'Identity' }
  }],
  media: [{
    url: String,
    type: { type: String, enum: ['image', 'video'] }
  }],
  contentWarnings: [String], // e.g. "Self-harm mention"
  commentCount: {
    type: Number,
    default: 0
  },
  burnAfter: {
    type: Date, // Auto-delete date
  },
  deletedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
