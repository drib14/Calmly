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

    // Robust Ownership Check (Handle orphaned identities)
    const isOwner = identity.user && identity.user.toString() === req.user._id.toString();

    // If orphaned identity (no user), return 404 or treat as unavailable
    if (!identity.user) {
         console.warn(`Orphaned Identity Accessed: ${handle} (ID: ${identity._id})`);
         return res.status(404).json({ message: 'User not active' });
    }

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
    // Ensure we are matching strictly by identity._id to avoid any population artifacts

    // Filtering:
    // 1. Regular Feed:
    //    - Owner: All posts (except hidden ones which go to archive, unless we want to show them everywhere? Prompt says "all hidden posts must be listed in archive tab". Usually they are hidden from main feed).
    //    - Visitor: Public posts, not hidden.
    // 2. Archive Feed (Owner only):
    //    - Hidden posts.

    const baseMatch = {
        identity: new mongoose.Types.ObjectId(identity._id),
        deletedAt: null
    };

    const regularPostMatch = isOwner
        ? { ...baseMatch, hidden: { $ne: true } }
        : { ...baseMatch, visibility: 'public', hidden: { $ne: true } };

    const archiveMatch = isOwner
        ? { ...baseMatch, hidden: true }
        : null;

    // Get Authored Posts
    const authoredPosts = await fetchWithComments(regularPostMatch);
    let archives = [];
    if (archiveMatch) {
        archives = await fetchWithComments(archiveMatch);
    }

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
        archives,
        isOwner // Helper for frontend
    });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
