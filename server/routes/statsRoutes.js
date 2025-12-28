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
        const activeUsers = await User.countDocuments({ isVerified: true });

        const feedbacks = await Feedback.find({ rating: { $gte: 4 } })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'email');

        const enrichedFeedbacks = await Promise.all(feedbacks.map(async (fb) => {
            if (!fb.user) return null;
            const identity = await Identity.findOne({ user: fb.user._id, type: 'real' });
            return {
                _id: fb._id,
                rating: fb.rating,
                comment: fb.comment,
                user: identity ? { name: identity.name, avatar: identity.avatar } : { name: 'Calmly User' }
            };
        }));

        // Graph: Full 7-Day History (Backwards from today)
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }

        const last7DaysDate = new Date();
        last7DaysDate.setDate(last7DaysDate.getDate() - 7);

        const rawStats = await Post.aggregate([
            { $match: { createdAt: { $gte: last7DaysDate } } },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }}
        ]);

        // Merge with full 7-day range
        const postsPerDay = days.map(date => {
            const stat = rawStats.find(s => s._id === date);
            return {
                _id: date,
                count: stat ? stat.count : 0
            };
        });

        res.json({
            totalPosts,
            activeUsers,
            feedbacks: enrichedFeedbacks.filter(f => f !== null),
            postsPerDay
        });
    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ message: error.message });
    }
});

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
