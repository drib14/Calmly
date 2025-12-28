const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Post = require('../models/Post');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const Identity = require('../models/Identity');

// Get Public Stats
router.get('/public', async (req, res) => {
    try {
        const totalPosts = await Post.countDocuments({ visibility: 'public' });

        // Active Users: For now, users who are verified.
        const activeUsers = await User.countDocuments({ isVerified: true });

        // Get recent positive feedbacks (4-5 stars)
        const feedbacks = await Feedback.find({ rating: { $gte: 4 } })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'email'); // Note: User model might not have name if using Identity.

        // Enrich feedbacks with Identity info
        const enrichedFeedbacks = await Promise.all(feedbacks.map(async (fb) => {
            const identity = await Identity.findOne({ user: fb.user._id, type: 'real' });
            return {
                _id: fb._id,
                rating: fb.rating,
                comment: fb.comment,
                user: identity ? { name: identity.name, avatar: identity.avatar } : { name: 'Calmly User' }
            };
        }));

        // For Graph: Posts per day (last 7 days)
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const postsPerDay = await Post.aggregate([
            { $match: { createdAt: { $gte: last7Days } } },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]);

        res.json({
            totalPosts,
            activeUsers,
            feedbacks: enrichedFeedbacks,
            postsPerDay
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Submit Feedback
router.post('/feedback', protect, async (req, res) => {
    const { rating, comment } = req.body;
    try {
        const feedback = await Feedback.create({
            user: req.user._id,
            rating,
            comment
        });
        res.status(201).json(feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
