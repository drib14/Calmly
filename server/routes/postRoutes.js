const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const Post = require('../models/Post');
const Identity = require('../models/Identity');
const Report = require('../models/Report');
const { upload } = require('../utils/cloudinary');

// Create a post
router.post('/', protect, upload.array('media', 100), async (req, res) => {
  const { identityId, type, content, mood, visibility, title, tags, letterFields, style } = req.body;
  let media = [];

  if (req.files) {
      media = req.files.map(file => ({
          url: file.path,
          type: file.mimetype.startsWith('video') ? 'video' : 'image'
      }));
  }

  try {
    const identity = await Identity.findOne({ _id: identityId, user: req.user._id });
    if (!identity) {
      console.error(`Create Post Failed: Identity ${identityId} not owned by user ${req.user._id}`);
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

// Get Feed (Public posts) with Aggregated Comment Counts
router.get('/feed', async (req, res) => {
  const { mood, type } = req.query;
  let match = { visibility: 'public' };

  if (mood) match.mood = mood;
  if (type) match.type = type;

  try {
    // Use Aggregation to fetch posts and populate accurately
    const posts = await Post.aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        { $limit: 20 },
        // Lookup Identity
        {
            $lookup: {
                from: 'identities',
                localField: 'identity',
                foreignField: '_id',
                as: 'identity'
            }
        },
        { $unwind: '$identity' },
        // Lookup User for Settings (for interaction permissions)
        {
            $lookup: {
                from: 'users',
                localField: 'identity.user',
                foreignField: '_id',
                as: 'identity.user'
            }
        },
        { $unwind: '$identity.user' }, // Flatten user array

        // Lookup Comment Count (Robust fix for "0 count")
        {
            $lookup: {
                from: 'comments',
                localField: '_id',
                foreignField: 'post',
                as: 'comments'
            }
        },
        {
            $addFields: {
                // Ensure aggregated count is used if stored count is missing or outdated
                // But we should prioritize efficiency.
                // Since user complained about "0", we force calculate it here for the feed.
                commentCount: { $size: '$comments' }
            }
        },
        // Remove the heavy 'comments' array after counting
        { $project: { comments: 0 } },
        // Project only necessary user fields to protect privacy
        {
            $project: {
                'identity.user.password': 0,
                'identity.user.refreshToken': 0,
                'identity.user.verificationToken': 0
            }
        }
    ]);

    // Populate the aggregation result
    await Post.populate(posts, [
        { path: 'reposts.identity', select: 'name type handle avatar' }
    ]);

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

        const identity = await Identity.findOne({ _id: identityId, user: req.user._id });
        if (!identity) return res.status(403).json({ message: 'Invalid identity' });

        const existingLikeIndex = post.likes.findIndex(like => like.user.toString() === req.user._id.toString());

        if (existingLikeIndex > -1) {
            post.likes.splice(existingLikeIndex, 1);
        } else {
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
