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
    required: true,
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Identity'
  }],
  reposts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Identity'
  }],
  media: [{
    url: String,
    type: { type: String, enum: ['image', 'video'] }
  }],
  contentWarnings: [String], // e.g. "Self-harm mention"
  burnAfter: {
    type: Date, // Auto-delete date
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
