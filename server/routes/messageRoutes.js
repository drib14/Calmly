const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const Identity = require('../models/Identity');
const { upload } = require('../utils/cloudinary');
const pusher = require('../utils/pusher');

router.post('/', protect, upload.array('media', 4), async (req, res) => {
  try {
      const { senderIdentityId, recipientIdentityId, content, sharedPost, sharedPostId, replyToQuote } = req.body;
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

      const messageData = {
        sender: senderIdentityId,
        recipient: recipientIdentityId,
        content: content || '',
        media
      };

      if (sharedPost || sharedPostId) {
          messageData.sharedPost = sharedPost || sharedPostId;
      }

      if (replyToQuote) {
          // Parse if it came as a JSON string (Multipart form data)
          messageData.replyToQuote = typeof replyToQuote === 'string' ? JSON.parse(replyToQuote) : replyToQuote;
      }

      const message = await Message.create(messageData);

      // Populate for immediate return (so frontend can render cards)
      await message.populate('sharedPost');

      // Real-time trigger via Pusher
      try {
          if (recipient.user) {
              const channel = `user-${recipient.user._id}`;
              await pusher.trigger(channel, 'new_message', message);
          }
      } catch (pusherErr) {
          console.error("Pusher Trigger Error:", pusherErr);
      }

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
        .populate('recipient', 'name type handle avatar')
        .populate({
            path: 'sharedPost',
            populate: { path: 'identity', select: 'name type handle avatar' }
        });

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
    .populate('sharedPost') // Populate shared post for preview text logic
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

// Delete Message (Soft delete or Hard delete?)
// User asking "Delete Message" implies for themselves (remove from view) or unsend?
// Unsend usually only if recent. Deleting for self is common.
// For simplicity, we'll implement "Delete for everyone" if owner, or hard delete.
router.delete('/:id', protect, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        const userIdentities = await Identity.find({ user: req.user._id });
        const identityIds = userIdentities.map(i => i._id.toString());

        // Check ownership (sender)
        if (!identityIds.includes(message.sender.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Message.findByIdAndDelete(req.params.id);
        res.json({ message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Conversation
router.delete('/conversation/:identityId', protect, async (req, res) => {
    try {
        const otherId = req.params.identityId;
        const userIdentities = await Identity.find({ user: req.user._id });
        const identityIds = userIdentities.map(i => i._id);

        // Delete all messages between My Identities AND Other Identity
        await Message.deleteMany({
            $or: [
                { sender: { $in: identityIds }, recipient: otherId },
                { sender: otherId, recipient: { $in: identityIds } }
            ]
        });

        res.json({ message: 'Conversation deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
