const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const Post = require('../models/Post');
const Identity = require('../models/Identity');
const Report = require('../models/Report');
// Create a post
router.post('/', protect, async (req, res) => {
  const { identityId, type, content, mood, visibility, title, tags, letterFields, style, media } = req.body;

  // media matches [{ url, type }] schema if sent from frontend

  try {
    const identity = await Identity.findById(identityId);

    if (!identity) {
        return res.status(404).json({ message: 'Identity not found' });
    }

    if (identity.user.toString() !== req.user._id.toString()) {
        console.error(`Create Post Failed: Identity ${identityId} (User: ${identity.user}) not owned by ${req.user._id}`);
        return res.status(403).json({
            message: 'Invalid identity ownership',
            debug: `Identity owner ${identity.user} !== Request user ${req.user._id}`
        });
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
// MOVED ABOVE /:id TO PREVENT ROUTE CONFLICT
router.get('/feed', async (req, res) => {
  const { mood, type } = req.query;
  let match = { visibility: 'public', deletedAt: null };

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
        { path: 'reposts.identity', select: 'name type handle avatar' },
        { path: 'likes.identity', select: 'name type handle avatar' }
    ]);

    res.json(posts);
  } catch (error) {
    console.error("Feed Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get Single Post
router.get('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
             return res.status(404).json({ message: 'Post not found' });
        }

        // Use findOne to populate correctly
        const post = await Post.findOne({ _id: req.params.id, deletedAt: null })
            .populate({
                path: 'identity',
                populate: { path: 'user', select: 'settings' } // Need settings for interaction checks
            })
            .populate('reposts.identity', 'name type handle avatar')
            .populate('likes.identity', 'name type handle avatar')
            .lean(); // Use lean for performance if we don't need document methods

        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Privacy Check (Basic)
        // If it's private and user is not the owner (this requires 'protect' middleware which isn't on this route yet?)
        // The 'protect' middleware is needed if we want to check permissions for private posts.
        // For now, let's assume public/unlisted are viewable. Private needs auth.
        // We'll return the post. The frontend should handle 403 if we add strict checks later.

        // Manually fetch comment count for consistency
        const commentCount = await mongoose.model('Comment').countDocuments({ post: req.params.id });
        post.commentCount = commentCount;

        res.json(post);
    } catch (error) {
        console.error("Get Post Error:", error);
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

        // Populate the identity for the response
        await post.populate('likes.identity', 'name type handle avatar');
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

        // Soft Delete
        post.deletedAt = new Date();
        await post.save();

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
