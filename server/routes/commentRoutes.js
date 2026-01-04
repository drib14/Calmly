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
    // Fetch comments (flat list or nested logic handled by frontend, but usually flat list with parentId is easiest,
    // or fetch top level and populate replies if schema supports it).
    // The previous schema didn't explicitly have `replies` array on Comment, only `parentComment`.
    // So we fetch ALL comments for the post and let frontend reconstruct tree, OR fetch top level and run separate queries.
    // Simplest for now: Fetch all for this post.
    const comments = await Comment.find({ post: req.params.postId })
      .populate('identity', 'name type handle avatar')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a comment (Supports Media)
router.post('/:postId', protect, upload.array('media', 2), async (req, res) => {
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

    // Populate for immediate frontend display
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

        // Check if already liked
        // Note: Comment schema likes array stores Identity ObjectIds
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

// Delete Comment
router.delete('/:id', protect, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id).populate('identity');
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        // Check ownership (Comment identity's user must match requesting user)
        // We populated identity, but we need to check the user field of that identity
        const identity = await Identity.findById(comment.identity._id);
        if (!identity || identity.user.toString() !== req.user._id.toString()) {
             // Also allow Post owner to delete comments? Usually yes.
             const post = await Post.findById(comment.post).populate('identity');
             // Need to check post owner identity's user
             const postOwnerIdentity = await Identity.findById(post.identity._id || post.identity);

             if (!postOwnerIdentity || postOwnerIdentity.user.toString() !== req.user._id.toString()) {
                 return res.status(403).json({ message: 'Unauthorized' });
             }
        }

        await comment.deleteOne();
        res.json({ message: 'Comment deleted' });
    } catch (error) {
        console.error("Delete Comment Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Report Comment
router.post('/:id/report', protect, async (req, res) => {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason required' });

    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        await Report.create({
            reporter: req.user._id,
            comment: comment._id,
            reason
        });

        res.status(201).json({ message: 'Report submitted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
