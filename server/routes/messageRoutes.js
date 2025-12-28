const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const Identity = require('../models/Identity');
const { upload } = require('../utils/cloudinary');

router.post('/', protect, upload.array('media', 4), async (req, res) => {
  try {
      const { senderIdentityId, recipientIdentityId, content } = req.body;
      let media = [];

      if (req.files) {
          media = req.files.map(file => {
              // Determine type
              let type = 'image';
              if (file.mimetype.startsWith('video')) type = 'video';
              else if (file.mimetype.startsWith('audio')) type = 'audio';
              else if (file.mimetype === 'application/pdf' || file.mimetype.includes('document') || file.mimetype.includes('msword')) type = 'file';

              return {
                  url: file.path,
                  type: type,
                  name: file.originalname
              };
          });
      }

      if (!senderIdentityId || !recipientIdentityId) {
          return res.status(400).json({ message: 'Sender and Recipient IDs are required' });
      }

      const sender = await Identity.findOne({ _id: senderIdentityId, user: req.user._id });
      if (!sender) return res.status(403).json({ message: 'Invalid sender identity' });

      const recipient = await Identity.findById(recipientIdentityId);
      if (!recipient) return res.status(404).json({ message: 'Recipient not found' });

      const message = await Message.create({
        sender: senderIdentityId,
        recipient: recipientIdentityId,
        content: content || '',
        media
      });
      res.status(201).json(message);
  } catch (error) {
    console.error("Message Error:", error);
    res.status(500).json({ message: error.message });
  }
});

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
        .populate('recipient', 'name type handle avatar');

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/inbox', protect, async (req, res) => {
  try {
    const userIdentities = await Identity.find({ user: req.user._id });
    const identityIds = userIdentities.map(i => i._id);

    const messages = await Message.find({
        $or: [{ recipient: { $in: identityIds } }, { sender: { $in: identityIds } }]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'name type handle avatar')
    .populate('recipient', 'name type handle avatar');

    const conversations = {};
    messages.forEach(msg => {
        if (!msg.sender || !msg.recipient) return;
        const isSender = identityIds.some(id => id.toString() === msg.sender._id.toString());
        const otherId = isSender ? msg.recipient._id.toString() : msg.sender._id.toString();
        if (!conversations[otherId]) conversations[otherId] = msg;
    });

    res.json(Object.values(conversations));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
