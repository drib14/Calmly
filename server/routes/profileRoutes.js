const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const Identity = require('../models/Identity');
const Post = require('../models/Post');
const Quote = require('../models/Quote');
const Clip = require('../models/Clip');
const User = require('../models/User');

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

    // Helper to fetch posts
    const fetchWithComments = async (match) => {
        const posts = await Post.aggregate([
            { $match: match },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: 'identities',
                    localField: 'identity',
                    foreignField: '_id',
                    as: 'identity'
                }
            },
            { $unwind: '$identity' },
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

        await Post.populate(posts, [
            { path: 'reposts.identity', select: 'name type handle avatar' }
        ]);

        return posts;
    };

    const isOwner = req.user && identity.user.toString() === req.user._id.toString();
    const visibilityMatch = isOwner ? {} : { visibility: 'public' };

    // Get Authored Posts (Public + Private if owner)
    const allPosts = await fetchWithComments({ identity: identity._id, ...visibilityMatch });

    // Separate for tabs
    const publicPosts = allPosts.filter(p => p.visibility === 'public');
    const privatePosts = allPosts.filter(p => p.visibility === 'private');

    // Get Reposted Posts
    const repostedPosts = await fetchWithComments({ 'reposts.identity': identity._id, visibility: 'public' });

    // Active Items (Feed logic: < 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const activeQuote = await Quote.findOne({
        identity: identity._id,
        createdAt: { $gt: twentyFourHoursAgo }
    }).sort({ createdAt: -1 });

    const activeClips = await Clip.find({
        identity: identity._id,
        expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    // Archives (Owner Only)
    let archives = [];
    if (isOwner) {
        // 1. Private Posts
        const archivedPosts = privatePosts.map(p => ({ ...p, type: 'post' }));

        // 2. Expired Quotes (Older than 24h)
        const expiredQuotes = await Quote.find({
            identity: identity._id,
            createdAt: { $lte: twentyFourHoursAgo }
        }).sort({ createdAt: -1 }).lean();

        // 3. Expired Clips
        const expiredClips = await Clip.find({
            identity: identity._id,
            expiresAt: { $lte: new Date() }
        }).sort({ createdAt: -1 }).lean();

        // Populate details for consistency
        // Note: Post aggregation already populated Identity. Quote/Clip queries need it or rely on `identity` object.
        // We'll stick to basic fields.

        archives = [
            ...archivedPosts,
            ...expiredQuotes.map(q => ({ ...q, type: 'quote' })),
            ...expiredClips.map(c => ({ ...c, type: 'clip' }))
        ];

        // Sort all archives by createdAt descending
        archives.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({
        identity,
        quote: activeQuote,
        clips: activeClips || [],
        posts: publicPosts,
        reposts: repostedPosts,
        archives: isOwner ? archives : []
    });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
