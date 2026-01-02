const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Quote = require('../models/Quote');
const Identity = require('../models/Identity');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Get recent quotes (Feed widget)
router.get('/feed', protect, async (req, res) => {
  try {
    // Filter for quotes created in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const quotes = await Quote.aggregate([
        { $match: { createdAt: { $gt: twentyFourHoursAgo } } },
        { $sort: { createdAt: -1 } },
        { $group: {
            _id: "$identity",
            doc: { $first: "$$ROOT" }
        }},
        { $replaceRoot: { newRoot: "$doc" } },
    ]);

    // Populate identity details
    await Quote.populate(quotes, { path: 'identity', select: 'name handle avatar type' });

    // Mark 'viewed' status for current user
    const quotesWithStatus = quotes.map(q => ({
        ...q,
        viewed: q.views && q.views.some(v => v.user.toString() === req.user._id.toString())
    }));

    res.json(quotesWithStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a Quote
router.post('/', protect, async (req, res) => {
  const { content, mood, font, identityId, music } = req.body;

  if (!identityId) return res.status(400).json({ message: 'Identity required' });

  try {
    const identity = await Identity.findOne({ _id: identityId, user: req.user._id });
    if (!identity) return res.status(403).json({ message: 'Unauthorized identity' });

    // Handle previous active quotes
    // If autoArchiveExpired is enabled, we just leave them alone (they will disappear from feed due to timestamp)
    // If disabled, we might want to hard delete them to keep DB clean?
    // But logically, "Archive Expired" setting implies we KEEP them.
    // If setting is OFF, should we delete them?
    // User schema default is TRUE now.
    // Let's check User settings.
    const user = await User.findById(req.user._id);
    const shouldArchive = user.settings?.autoArchiveExpired !== false; // Default true

    if (!shouldArchive) {
        // If user wants to delete old stuff, we delete previous quotes for this identity
        // But maybe only "expired" ones?
        // Actually, logic usually is: New Quote replaces Old Quote on the "Board".
        // If we want to keep history (Archive), we just let the old one exist in DB.
        // If we want to delete history, we delete it here.
        await Quote.deleteMany({ identity: identityId });
    } else {
        // If archiving, we might want to ensure only ONE "active" (recent) quote exists?
        // The feed aggregation picks the latest. So multiple recent quotes logic:
        // If I post again within 24h, do I have 2 stories?
        // Usually Story = Stack.
        // Current logic: `feed` aggregates by Identity and takes `$first` (latest).
        // So effectively only the latest is shown on the widget cover.
        // But the Viewer might want to show all "active" ones.
        // My Viewer logic in `StoriesWidget` uses `quotes.forEach`.
        // Wait, `quotes` comes from `/feed` which only returns ONE per identity.
        // This means I can only have ONE quote at a time?
        // The user request "unify... quote(not note) and clips"
        // Clips support multiple. Quotes might be singular status?
        // "Profile with quote bubble... the same way in viewer".
        // If I post a new quote, does it add to the stack or replace?
        // Usually "Notes" replace. "Stories" stack.
        // Prompt says "Quote (not note)".
        // I will assume for now it replaces on the feed (Aggregation), but we keep it in DB for Archive.
        // So I won't delete here if archiving is on.
    }

    // Emit expiry for old quotes to update clients?
    // Actually, simply emitting 'quote_created' is better.
    // But if we deleted, we should emit.
    if (!shouldArchive) {
         const io = req.app.get('io');
         if (io) io.emit('quote_expired', identityId); // simplistic
    }

    const quote = await Quote.create({
      user: req.user._id,
      identity: identityId,
      content,
      mood,
      font,
      music
      // No expiresAt needed for DB TTL anymore
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

        const alreadyViewed = quote.views.some(v => v.user.toString() === req.user._id.toString());

        if (!alreadyViewed && quote.user.toString() !== req.user._id.toString()) {
             quote.views.push({ user: req.user._id });
             await quote.save();

             const io = req.app.get('io');
             if (io) {
                 io.emit('quote_viewed', { quoteId: quote._id, viewerId: req.user._id });
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

                    const io = req.app.get('io');
                    if (io) {
                        io.to(recipientIdentity.user.toString()).emit('new_notification', notification);
                    }
                }
            }
        }

        await quote.save();

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
