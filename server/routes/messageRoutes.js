const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const Identity = require('../models/Identity');

// Send Message
router.post('/', protect, async (req, res) => {
  const { senderIdentityId, recipientIdentityId, content } = req.body;
  try {
    // Verify sender belongs to user
    const sender = await Identity.findOne({ _id: senderIdentityId, user: req.user._id });
    if (!sender) return res.status(403).json({ message: 'Invalid sender identity' });

    const message = await Message.create({
      sender: senderIdentityId,
      recipient: recipientIdentityId,
      content
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Inbox (Messages received by any of user's identities)
router.get('/inbox', protect, async (req, res) => {
  try {
    const userIdentities = await Identity.find({ user: req.user._id });
    const identityIds = userIdentities.map(i => i._id);

    const messages = await Message.find({ recipient: { $in: identityIds } })
      .populate('sender', 'name type handle avatar')
      .populate('recipient', 'name')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
