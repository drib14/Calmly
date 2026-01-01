const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Quote = require('../models/Quote');
const Identity = require('../models/Identity');

// Get recent quotes (Feed widget)
router.get('/feed', protect, async (req, res) => {
  try {
    // Get latest quote per user/identity.
    // We want unique identities.
    // Simple approach: Get all quotes from last 24h, sort by date desc.
    // Client can dedup if needed, or we aggregate.

    // Aggregation to get ONE quote per identity (latest)
    const quotes = await Quote.aggregate([
        { $sort: { createdAt: -1 } },
        { $group: {
            _id: "$identity",
            doc: { $first: "$$ROOT" }
        }},
        { $replaceRoot: { newRoot: "$doc" } }
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

    // Optional: Delete previous active quote for this identity to avoid duplicates
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

// Delete Quote
router.delete('/:id', protect, async (req, res) => {
    try {
        const quote = await Quote.findById(req.params.id);
        if (!quote) return res.status(404).json({ message: 'Quote not found' });

        if (quote.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        await quote.deleteOne();
        res.json({ message: 'Quote removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
