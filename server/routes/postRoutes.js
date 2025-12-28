const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Post = require('../models/Post');
const Identity = require('../models/Identity');
const Report = require('../models/Report');
const { upload } = require('../utils/cloudinary');

// Create a post
router.post('/', protect, upload.array('media', 4), async (req, res) => {
  const { identityId, type, content, mood, visibility, title, tags, letterFields, style } = req.body;
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

    const postData = {
      identity: identityId,
      type,
      content,
      mood,
      visibility,
      title,
      tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
      media
    };

    if (letterFields) postData.letterFields = typeof letterFields === 'string' ? JSON.parse(letterFields) : letterFields;
    if (style) postData.style = typeof style === 'string' ? JSON.parse(style) : style;

    const post = await Post.create(postData);

    res.status(201).json(post);
  } catch (error) {
    console.error("Create Post Error:", error);
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
      .populate('reposts.identity', 'name type handle avatar')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(posts);
  } catch (error) {
    console.error("Feed Error:", error);
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

        const existingLikeIndex = post.likes.findIndex(like => like.user.toString() === req.user._id.toString());

        if (existingLikeIndex > -1) {
            // Already liked by this User (remove it to toggle off)
            post.likes.splice(existingLikeIndex, 1);
        } else {
            // Add like with specific identity
            post.likes.push({ user: req.user._id, identity: identity._id });
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

        const existingRepostIndex = post.reposts.findIndex(r => r.user.toString() === req.user._id.toString());

        if (existingRepostIndex > -1) {
            post.reposts.splice(existingRepostIndex, 1);
        } else {
            post.reposts.push({ user: req.user._id, identity: identity._id });
        }
        await post.save();

        // Populate for frontend return
        await post.populate('reposts.identity', 'name type handle avatar');

        res.json(post.reposts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Post
router.delete('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Check ownership
        // post.identity is an ID. We need to check if that identity belongs to req.user
        const identity = await Identity.findOne({ _id: post.identity, user: req.user._id });

        if (!identity) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        await Post.deleteOne({ _id: req.params.id });
        res.json({ message: 'Post removed' });
    } catch (error) {
        console.error("Delete Post Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Report Post
router.post('/:id/report', protect, async (req, res) => {
    const { reason } = req.body;
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        await Report.create({
            reporter: req.user._id,
            post: req.params.id,
            reason: reason || 'Inappropriate content'
        });

        res.status(201).json({ message: 'Report submitted' });
    } catch (error) {
        console.error("Report Post Error:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
