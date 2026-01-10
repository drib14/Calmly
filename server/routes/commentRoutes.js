const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Identity = require('../models/Identity');
const Report = require('../models/Report');
const { upload } = require('../utils/cloudinary');

// Get comments for a post
router.get('/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId, deletedAt: null })
      .populate('identity', 'name type handle avatar')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a comment (Supports Media)
router.post('/:postId', protect, upload.array('media', 2), async (req, res) => {
  if (req.user.restrictions?.comment) {
      return res.status(403).json({ message: 'Your account is restricted from commenting.' });
  }

  const { content, identityId, parentCommentId } = req.body;
  let media = [];

  if (req.files) {
      media = req.files.map(file => ({
          url: file.path,
          type: file.mimetype.startsWith('video') ? 'video' : 'image'
      }));
  }

  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const identity = await Identity.findOne({ _id: identityId, user: req.user._id });
    if (!identity) return res.status(403).json({ message: 'Invalid identity' });

    const comment = await Comment.create({
      post: req.params.postId,
      identity: identityId,
      content,
      media,
      parentComment: parentCommentId || null
    });

    await comment.populate('identity', 'name type handle avatar');

    res.status(201).json(comment);
  } catch (error) {
    console.error("Comment Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Toggle Like on Comment
router.put('/:id/like', protect, async (req, res) => {
    const { identityId } = req.body;
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        const identity = await Identity.findOne({ _id: identityId, user: req.user._id });
        if (!identity) return res.status(403).json({ message: 'Invalid identity' });

        const index = comment.likes.indexOf(identityId);

        if (index > -1) {
            comment.likes.splice(index, 1);
        } else {
            comment.likes.push(identityId);
        }
        await comment.save();
        res.json(comment.likes);
    } catch (error) {
        console.error("Comment Like Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Hide Comment
router.put('/:id/hide', protect, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        // Check ownership
        const identity = await Identity.findOne({ _id: comment.identity, user: req.user._id });
        if (!identity && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

        comment.hidden = !comment.hidden;
        await comment.save();
        res.json({ hidden: comment.hidden });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Comment (Soft)
router.delete('/:id', protect, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        const identity = await Identity.findOne({ _id: comment.identity, user: req.user._id });
        if (!identity && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

        comment.deletedAt = new Date();
        await comment.save();
        res.json({ message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Report Comment
router.post('/:id/report', protect, async (req, res) => {
    const { reason } = req.body;
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        await Report.create({
            reporter: req.user._id,
            comment: req.params.id,
            targetType: 'Comment',
            reason: reason || 'Inappropriate content'
        });

        res.status(201).json({ message: 'Report submitted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Edit Comment
router.put('/:id', protect, async (req, res) => {
    const { content } = req.body;
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        const identity = await Identity.findOne({ _id: comment.identity, user: req.user._id });
        if (!identity) return res.status(403).json({ message: 'Not authorized' });

        comment.content = content;
        await comment.save();
        res.json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
