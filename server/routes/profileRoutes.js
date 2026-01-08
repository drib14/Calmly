const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const Identity = require('../models/Identity');
const Post = require('../models/Post');
const Quote = require('../models/Quote');

// Get profile by handle
router.get('/:handle', protect, async (req, res) => {
  try {
    const handle = req.params.handle.startsWith('@') ? req.params.handle : `@${req.params.handle}`;

    // Find Identity
    const identity = await Identity.findOne({ handle });
    if (!identity) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check Ownership
    const isOwner = identity.user.toString() === req.user._id.toString();

    if (identity.type === 'anonymous' && !isOwner) {
        return res.status(403).json({ message: 'Anonymous profiles cannot be viewed.' });
    }

    // Helper to fetch posts with Aggregated Comment Count
    const fetchWithComments = async (match) => {
        const posts = await Post.aggregate([
            { $match: match },
            { $sort: { createdAt: -1 } },
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
            // Lookup Comment Count
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
                    commentCount: { $size: '$comments' }
                }
            },
            { $project: { comments: 0 } }
        ]);

        // Populate Reposts manually after aggregation (Mongoose specific population on plain objects)
        await Post.populate(posts, [
            { path: 'reposts.identity', select: 'name type handle avatar' },
            { path: 'likes.identity', select: 'name type handle avatar' }
        ]);

        return posts;
    };

    // Match Criteria
    // Owner sees all non-deleted posts. Visitors see public posts.
    // Note: 'sensitive' isn't a visibility level, it's content.
    // But if 'Safe Mode' hides posts from the feed API, it shouldn't hide them from the Profile API for the owner.
    // Standard visibility: public, unlisted, private.
    // If Owner: { identity: identity._id, deletedAt: null }
    // If Visitor: { identity: identity._id, visibility: 'public', deletedAt: null }

    const postMatch = isOwner
        ? { identity: identity._id, deletedAt: null }
        : { identity: identity._id, visibility: 'public', deletedAt: null };

    // Get Authored Posts
    const authoredPosts = await fetchWithComments(postMatch);

    // Get Reposted Posts (Where this identity is in the reposts array)
    // Reposts should probably respect visibility of the original post?
    // Usually reposts are public actions. We'll filter public visibility for the original post unless owner.
    // Actually, reposts array contains identities. We find posts where 'reposts.identity' has this ID.
    // And the post itself must be public (or visible to viewer).
    // For simplicity/safety, usually only public posts are repostable/visible.
    const repostMatch = {
        'reposts.identity': identity._id,
        visibility: 'public',
        deletedAt: null
    };
    const repostedPosts = await fetchWithComments(repostMatch);

    // Get Active Quote and POPULATE IDENTITY
    const activeQuote = await Quote.findOne({ identity: identity._id })
        .sort({ createdAt: -1 })
        .populate('identity', 'name handle avatar type');

    res.json({
        identity,
        quote: activeQuote,
        posts: authoredPosts,
        reposts: repostedPosts,
        isOwner // Helper for frontend
    });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
