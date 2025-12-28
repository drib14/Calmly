const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Identity = require('../models/Identity');

router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ posts: [], identities: [] });

  try {
    const regex = new RegExp(q, 'i');

    const posts = await Post.find({
      $or: [{ content: regex }, { tags: regex }, { title: regex }],
      visibility: 'public'
    })
    .populate('identity', 'name type handle avatar')
    .limit(10);

    const identities = await Identity.find({
      $or: [{ name: regex }, { handle: regex }],
      type: { $ne: 'anonymous' } // Don't search anonymous users
    })
    .limit(10);

    res.json({ posts, identities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
