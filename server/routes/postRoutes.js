const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Post = require('../models/Post');
const Identity = require('../models/Identity');

// Create a post
router.post('/', protect, async (req, res) => {
  const { identityId, type, content, mood, visibility, title, tags } = req.body;

  try {
    // Verify identity belongs to user
    const identity = await Identity.findOne({ _id: identityId, user: req.user._id });
    if (!identity) {
      return res.status(403).json({ message: 'Invalid identity' });
    }

    const post = await Post.create({
      identity: identityId,
      type,
      content,
      mood,
      visibility,
      title,
      tags
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Feed (Public posts)
router.get('/feed', async (req, res) => {
  const { mood, type } = req.query;
  let query = { visibility: 'public' };

  if (mood) query.mood = mood;
  if (type) query.type = type;

  try {
    const posts = await Post.find(query)
      .populate('identity', 'name type handle avatar')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
