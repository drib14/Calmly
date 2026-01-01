const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const Identity = require('../models/Identity');
const { upload } = require('../utils/cloudinary');

router.post('/', protect, upload.array('media', 4), async (req, res) => {
  try {
      const { senderIdentityId, recipientIdentityId, content, replyToQuote } = req.body;
      let media = [];
      let parsedReplyQuote = null;

      if (replyToQuote) {
        try {
            parsedReplyQuote = JSON.parse(replyToQuote);
        } catch (e) {
            console.error("Failed to parse replyToQuote", e);
        }
      }

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
                  name: file.originalname,
                  size: file.size
              };
          });
      }

      if (!senderIdentityId || !recipientIdentityId) {
          return res.status(400).json({ message: 'Sender and Recipient IDs are required' });
      }

      const sender = await Identity.findOne({ _id: senderIdentityId, user: req.user._id });
      if (!sender) return res.status(403).json({ message: 'Invalid sender identity' });

      const recipient = await Identity.findById(recipientIdentityId).populate('user', 'settings');
      if (!recipient) return res.status(404).json({ message: 'Recipient not found' });

      // Check Privacy Settings
      const settings = recipient.user.settings || {};

      if (settings.enablePrivateMessaging === false) {
          return res.status(403).json({ message: 'This user has disabled private messaging.' });
      }

      if (sender.type === 'anonymous' && settings.allowAnonymousDMs === false) {
          return res.status(403).json({ message: 'This user does not accept anonymous messages.' });
      }

      if (sender.type === 'pseudonym' && settings.allowPseudonymDMs === false) {
          return res.status(403).json({ message: 'This user does not accept messages from pseudonyms.' });
      }

      const message = await Message.create({
        sender: senderIdentityId,
        recipient: recipientIdentityId,
        content: content || '',
        replyToQuote: parsedReplyQuote,
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
        .populate('recipient', 'name type handle avatar'); // We might want to populate user settings here too for read receipts logic in frontend if needed

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
    .populate({
        path: 'recipient',
        select: 'name type handle avatar',
        populate: { path: 'user', select: 'settings' } // Populate settings to check read receipt prefs
    })
    .populate({
        path: 'sender', // Double populate for when WE are recipient to know sender's settings?
        select: 'name type handle avatar',
        populate: { path: 'user', select: 'settings' }
    });

    // Note: The structure above is a bit tricky because sender/recipient swaps.
    // Ideally we populate both sides fully.

    const conversations = {};
    messages.forEach(msg => {
        if (!msg.sender || !msg.recipient) return;
        const isSender = identityIds.some(id => id.toString() === msg.sender._id.toString());
        const otherId = isSender ? msg.recipient._id.toString() : msg.sender._id.toString();

        // Attach the *other* person's Identity object (with user settings populated) to the conversation
        // This allows the frontend to see if they allow read receipts etc.
        if (!conversations[otherId]) {
            conversations[otherId] = msg;
        }
    });

    res.json(Object.values(conversations));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Unread Count
router.get('/unread-count', protect, async (req, res) => {
    try {
        const userIdentities = await Identity.find({ user: req.user._id });
        const identityIds = userIdentities.map(i => i._id);

        const count = await Message.countDocuments({
            recipient: { $in: identityIds },
            read: false,
            sender: { $nin: identityIds }
        });

        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark Conversation as Read
router.put('/read', protect, async (req, res) => {
    const { otherIdentityId } = req.body;
    try {
        const userIdentities = await Identity.find({ user: req.user._id });
        const identityIds = userIdentities.map(i => i._id);

        await Message.updateMany(
            {
                sender: otherIdentityId,
                recipient: { $in: identityIds },
                read: false
            },
            { read: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
