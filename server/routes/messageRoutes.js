const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const Identity = require('../models/Identity');
const { upload } = require('../utils/cloudinary');

// Send Message (Supports Media)
router.post('/', protect, upload.array('media', 4), async (req, res) => {
  const { senderIdentityId, recipientIdentityId, content } = req.body;
  let media = [];

  if (req.files) {
      media = req.files.map(file => ({
          url: file.path,
          type: file.mimetype.startsWith('video') ? 'video' : file.mimetype.startsWith('audio') ? 'audio' : 'image',
          name: file.originalname
      }));
  }

  try {
    const sender = await Identity.findOne({ _id: senderIdentityId, user: req.user._id });
    if (!sender) return res.status(403).json({ message: 'Invalid sender identity' });

    const message = await Message.create({
      sender: senderIdentityId,
      recipient: recipientIdentityId,
      content,
      media
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Conversation between two identities
router.get('/conversation', protect, async (req, res) => {
    const { identity1, identity2 } = req.query;
    try {
        const messages = await Message.find({
            $or: [
                { sender: identity1, recipient: identity2 },
                { sender: identity2, recipient: identity1 }
            ]
        })
        .sort({ createdAt: 1 })
        .populate('sender', 'name type handle avatar')
        .populate('recipient', 'name type handle avatar'); // Populate recipient for self-chat clarity

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Inbox (Last message per conversation)
router.get('/inbox', protect, async (req, res) => {
  try {
    const userIdentities = await Identity.find({ user: req.user._id });
    const identityIds = userIdentities.map(i => i._id);

    // Find messages involving any of user's identities
    const messages = await Message.find({
        $or: [{ recipient: { $in: identityIds } }, { sender: { $in: identityIds } }]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'name type handle avatar')
    .populate('recipient', 'name type handle avatar');

    // Group by conversation
    const conversations = {};
    messages.forEach(msg => {
        const isSender = identityIds.some(id => id.toString() === msg.sender._id.toString());
        const otherId = isSender ? msg.recipient._id.toString() : msg.sender._id.toString();

        if (!conversations[otherId]) {
            conversations[otherId] = msg;
        }
    });

    res.json(Object.values(conversations));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
