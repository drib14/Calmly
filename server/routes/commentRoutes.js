const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Comment = require('../models/Comment');
const Identity = require('../models/Identity');

// Get comments for a post (Top level + replies populated)
router.get('/:postId', async (req, res) => {
  try {
    // Only fetch top-level comments initially
    const comments = await Comment.find({ post: req.params.postId, parentComment: null })
      .populate('identity', 'name type handle avatar')
      .populate({
          path: 'replies',
          populate: { path: 'identity', select: 'name type handle avatar' }
      })
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const { upload } = require('../utils/cloudinary');

// Create a comment (or reply) with media
router.post('/:postId', protect, upload.array('media', 2), async (req, res) => {
  const { content, identityId, parentId } = req.body;
  let media = [];

  if (req.files) {
      media = req.files.map(file => ({
          url: file.path,
          type: file.mimetype.startsWith('video') ? 'video' : 'image'
      }));
  }

  try {
     const identity = await Identity.findOne({ _id: identityId, user: req.user._id });
     if (!identity) return res.status(403).json({ message: 'Invalid identity' });

     const comment = await Comment.create({
       post: req.params.postId,
       identity: identityId,
       content,
       media,
       parentComment: parentId || null
     });

     if (parentId) {
         await Comment.findByIdAndUpdate(parentId, { $push: { replies: comment._id } });
     }

     await comment.populate('identity', 'name type handle avatar');
     res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle Comment Like
router.put('/:id/like', protect, async (req, res) => {
    const { identityId } = req.body;
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        const identity = await Identity.findOne({ _id: identityId, user: req.user._id });
        if (!identity) return res.status(403).json({ message: 'Invalid identity' });

        if (comment.likes.includes(identityId)) {
            comment.likes = comment.likes.filter(id => id.toString() !== identityId);
        } else {
            comment.likes.push(identityId);
        }
        await comment.save();
        res.json(comment.likes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
