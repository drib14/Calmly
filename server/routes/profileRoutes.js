const express = require('express');
const router = express.Router();
const Identity = require('../models/Identity');
const Post = require('../models/Post');

// Get profile by handle
router.get('/:handle', async (req, res) => {
  try {
    const handle = req.params.handle.startsWith('@') ? req.params.handle : `@${req.params.handle}`;

    // Find Identity
    const identity = await Identity.findOne({ handle });
    if (!identity) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (identity.type === 'anonymous') {
        return res.status(403).json({ message: 'Anonymous profiles cannot be viewed.' });
    }

    // Get Public Posts
    const posts = await Post.find({ identity: identity._id, visibility: 'public' })
      .sort({ createdAt: -1 })
      .populate('identity', 'name type handle avatar');

    res.json({ identity, posts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
