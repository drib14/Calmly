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

    if (identity.type === 'anonymous') {
        if (identity.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Anonymous profiles cannot be viewed.' });
        }
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
            { path: 'reposts.identity', select: 'name type handle avatar' }
        ]);

        return posts;
    };

    // Get Authored Posts
    const authoredPosts = await fetchWithComments({ identity: identity._id, visibility: 'public' });

    // Get Reposted Posts (Where this identity is in the reposts array)
    // Note: in aggregation, 'reposts.identity' matching ObjectId needs careful handling if Repost schema is objects.
    // 'reposts' is array of objects { user: ID, identity: ID }.
    // Match: { 'reposts.identity': identity._id } works in standard Mongoose find.
    // In aggregate $match, it also works if identity._id is ObjectId.
    const repostedPosts = await fetchWithComments({ 'reposts.identity': identity._id, visibility: 'public' });

    // Get Active Quote
    const activeQuote = await Quote.findOne({ identity: identity._id }).sort({ createdAt: -1 });

    res.json({
        identity,
        quote: activeQuote,
        posts: authoredPosts,
        reposts: repostedPosts
    });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
