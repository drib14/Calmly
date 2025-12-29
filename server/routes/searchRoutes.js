const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Identity = require('../models/Identity');

router.get('/', async (req, res) => {
  const { q, type } = req.query; // type='identities' to skip posts

  try {
    let posts = [];
    let identities = [];

    // If no query, return all (or recent) identities for the "Suggested" list
    if (!q) {
        if (type === 'identities' || !type) {
            identities = await Identity.find({ type: { $ne: 'anonymous' } })
                .sort({ createdAt: -1 })
                .limit(20);
        }
        return res.json({ posts: [], identities });
    }

    const regex = new RegExp(q, 'i');

    if (type !== 'identities') {
        posts = await Post.find({
          $or: [{ content: regex }, { tags: regex }, { title: regex }],
          visibility: 'public'
        })
        .populate('identity', 'name type handle avatar')
        .limit(10);
    }

    if (type !== 'posts') {
        identities = await Identity.find({
          $or: [{ name: regex }, { handle: regex }],
          type: { $ne: 'anonymous' }
        })
        .limit(10);
    }

    res.json({ posts, identities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
