const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Post = require('../models/Post');
const Identity = require('../models/Identity');
const { upload } = require('../utils/cloudinary');

// Create a post
router.post('/', protect, upload.array('media', 4), async (req, res) => {
  const { identityId, type, content, mood, visibility, title, tags } = req.body;
  let media = [];

  if (req.files) {
      media = req.files.map(file => ({
          url: file.path,
          type: file.mimetype.startsWith('video') ? 'video' : 'image'
      }));
  }

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
      tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [], // Handle multipart form data array
      media
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

// Toggle Like
router.put('/:id/like', protect, async (req, res) => {
    const { identityId } = req.body;
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Verify identity ownership
        const identity = await Identity.findOne({ _id: identityId, user: req.user._id });
        if (!identity) return res.status(403).json({ message: 'Invalid identity' });

        if (post.likes.includes(identityId)) {
            post.likes = post.likes.filter(id => id.toString() !== identityId);
        } else {
            post.likes.push(identityId);
        }
        await post.save();
        res.json(post.likes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Toggle Repost
router.put('/:id/repost', protect, async (req, res) => {
    const { identityId } = req.body;
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const identity = await Identity.findOne({ _id: identityId, user: req.user._id });
        if (!identity) return res.status(403).json({ message: 'Invalid identity' });

        if (post.reposts.includes(identityId)) {
            post.reposts = post.reposts.filter(id => id.toString() !== identityId);
        } else {
            post.reposts.push(identityId);
        }
        await post.save();
        res.json(post.reposts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
