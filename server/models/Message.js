const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Identity',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Identity',
    required: true,
  },
  content: {
    type: String,
  },
  sharedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  },
  replyToQuote: {
    quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
    content: String,
    mood: String,
    font: String,
    identity: { // Snapshot identity in case quote/user is deleted
        name: String,
        handle: String,
        avatar: String
    }
  },
  // Added replyToMessage for chat replies
  replyToMessage: {
      id: String,
      content: String,
      sender: String // Name of original sender
  },
  media: [{
    url: String,
    type: { type: String, enum: ['image', 'video', 'audio', 'file'] },
    name: String // For files
  }],
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
