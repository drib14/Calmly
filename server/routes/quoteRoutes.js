const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Quote = require('../models/Quote');
const Identity = require('../models/Identity');
const Notification = require('../models/Notification');

// Get recent quotes (Feed widget)
router.get('/feed', protect, async (req, res) => {
  try {
    const quotes = await Quote.aggregate([
        { $sort: { createdAt: -1 } },
        { $group: {
            _id: "$identity",
            doc: { $first: "$$ROOT" }
        }},
        { $replaceRoot: { newRoot: "$doc" } },
        // Ensure we explicitly include fields if aggregation excludes them by default (usually it includes all fields in $$ROOT)
        // However, we need to ensure views array length is visible or passed.
    ]);

    // Populate identity details
    await Quote.populate(quotes, { path: 'identity', select: 'name handle avatar type' });

    res.json(quotes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a Quote
router.post('/', protect, async (req, res) => {
  const { content, mood, font, identityId } = req.body;

  if (!identityId) return res.status(400).json({ message: 'Identity required' });

  try {
    // Verify identity ownership
    const identity = await Identity.findOne({ _id: identityId, user: req.user._id });
    if (!identity) return res.status(403).json({ message: 'Unauthorized identity' });

    // Optional: Delete previous active quote for this identity
    await Quote.deleteMany({ identity: identityId });

    const quote = await Quote.create({
      user: req.user._id,
      identity: identityId,
      content,
      mood,
      font
    });

    res.status(201).json(quote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// View Quote
router.post('/:id/view', protect, async (req, res) => {
    try {
        const quote = await Quote.findById(req.params.id);
        if (!quote) return res.status(404).json({ message: 'Quote not found' });

        // Check if already viewed by this user
        const alreadyViewed = quote.views.some(v => v.user.toString() === req.user._id.toString());

        if (!alreadyViewed && quote.user.toString() !== req.user._id.toString()) {
             // We need an identity context if we want to attribute view to an identity,
             // but 'views' often just track user account to avoid dupes across identities.
             // For now we track User ID.
             quote.views.push({ user: req.user._id });
             await quote.save();

             // Emit real-time update
             const io = req.app.get('io');
             if (io) {
                 io.emit('quote_updated', { quoteId: quote._id, views: quote.views.length });
             }
        }

        res.json({ views: quote.views.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// React to Quote
router.post('/:id/react', protect, async (req, res) => {
    const { identityId } = req.body;
    try {
        const quote = await Quote.findById(req.params.id);
        if (!quote) return res.status(404).json({ message: 'Quote not found' });

        const identity = await Identity.findOne({ _id: identityId, user: req.user._id });
        if (!identity) return res.status(403).json({ message: 'Invalid identity' });

        const existingReactionIndex = quote.reactions.findIndex(r => r.user.toString() === req.user._id.toString());

        if (existingReactionIndex > -1) {
            quote.reactions.splice(existingReactionIndex, 1);
        } else {
            quote.reactions.push({ user: req.user._id, identity: identity._id });

            // Notification
            if (quote.identity.toString() !== identityId.toString()) {
                const recipientIdentity = await Identity.findById(quote.identity);
                if (recipientIdentity) {
                    const notification = await Notification.create({
                        recipient: quote.identity,
                        user: recipientIdentity.user,
                        sender: identity._id,
                        type: 'quote_reaction',
                        quote: quote._id
                    });

                    // Real-time Notification
                    const io = req.app.get('io');
                    if (io) {
                        io.to(recipientIdentity.user.toString()).emit('new_notification', notification);
                    }
                }
            }
        }

        await quote.save();

        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
            io.emit('quote_updated', { quoteId: quote._id, reactions: quote.reactions.length });
        }

        res.json(quote.reactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Quote Details (Viewers/Reactors)
router.get('/:id/details', protect, async (req, res) => {
    try {
        const quote = await Quote.findById(req.params.id)
            .populate('views.user', 'username')
            .populate('reactions.identity', 'name handle avatar type');

        if (!quote) return res.status(404).json({ message: 'Quote not found' });

        if (quote.user.toString() !== req.user._id.toString()) {
             return res.status(403).json({ message: 'Only owner can view analytics' });
        }

        // Update lastCheckedViews
        quote.lastCheckedViews = new Date();
        await quote.save();

        res.json({
            views: quote.views,
            reactions: quote.reactions
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Quote
router.delete('/:id', protect, async (req, res) => {
    try {
        const quote = await Quote.findById(req.params.id);
        if (!quote) return res.status(404).json({ message: 'Quote not found' });

        if (quote.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        await quote.deleteOne();

        // Real-time Expiry/Deletion event
        const io = req.app.get('io');
        if (io) {
            io.emit('quote_expired', quote._id);
        }

        res.json({ message: 'Quote removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
