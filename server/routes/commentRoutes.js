const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Comment = require('../models/Comment');
const Identity = require('../models/Identity');

// Get comments for a post
router.get('/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('identity', 'name type handle avatar')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a comment
router.post('/:postId', protect, async (req, res) => {
  const { content, identityId } = req.body;
  try {
     // Verify identity belongs to user
     const identity = await Identity.findOne({ _id: identityId, user: req.user._id });
     if (!identity) {
       return res.status(403).json({ message: 'Invalid identity' });
     }

     const comment = await Comment.create({
       post: req.params.postId,
       identity: identityId,
       content
     });

     // Populate for immediate return
     await comment.populate('identity', 'name type handle avatar');

     res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
