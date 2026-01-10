const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');
const Support = require('../models/Support');
const Comment = require('../models/Comment');
const Identity = require('../models/Identity');

// @desc    Get Admin Stats
// @route   GET /api/admin/stats
// @access  Admin
const getStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const postCount = await Post.countDocuments();
        const reportCount = await Report.countDocuments({ status: 'pending' });
        const supportCount = await Support.countDocuments({ status: 'open' });

        res.json({
            users: userCount,
            posts: postCount,
            pendingReports: reportCount,
            openTickets: supportCount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get All Users
// @route   GET /api/admin/users
// @access  Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(100); // Pagination in future
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Ban/Unban User
// @route   PUT /api/admin/users/:id/ban
// @access  Admin
const toggleBanUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot ban an admin' });
        }

        user.isBanned = !user.isBanned;
        await user.save();
        res.json({ message: user.isBanned ? 'User banned' : 'User unbanned', isBanned: user.isBanned });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get Reports
// @route   GET /api/admin/reports
// @access  Admin
const getReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('reporter', 'email')
            .populate('post') // Dynamically populate based on targetType if possible, or just fetch all
            // Mongoose dynamic population is tricky with single path.
            // We will fetch and let frontend handle nulls, or do manual population.
            // For now, simple find.
            .sort({ createdAt: -1 });

        // Manual population for target based on type
        // This is expensive but okay for admin panel with low volume
        const populatedReports = await Promise.all(reports.map(async (report) => {
            const r = report.toObject();
            if (report.targetType === 'Post') r.target = await Post.findById(report.post).populate('identity');
            if (report.targetType === 'Comment') r.target = await Comment.findById(report.comment).populate('identity');
            if (report.targetType === 'Identity') r.target = await Identity.findById(report.identity);
            return r;
        }));

        res.json(populatedReports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Resolve Report
// @route   PUT /api/admin/reports/:id
// @access  Admin
const resolveReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        report.status = req.body.status || 'resolved';
        report.resolvedBy = req.user._id;
        await report.save();

        // Email Notification Logic (Simulated)
        console.log(`[EMAIL] Report ${report._id} status updated to ${report.status}. Notifying reporter ${report.reporter}.`);

        res.json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get Support Tickets
// @route   GET /api/admin/support
// @access  Admin
const getSupportTickets = async (req, res) => {
    try {
        const tickets = await Support.find()
            .populate('user', 'email settings')
            .sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Reply to Support Ticket
// @route   POST /api/admin/support/:id/reply
// @access  Admin
const replySupportTicket = async (req, res) => {
    try {
        const ticket = await Support.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        const { message } = req.body;
        ticket.replies.push({
            sender: 'admin',
            message
        });

        if (req.body.close) {
            ticket.status = 'closed';
        } else {
            ticket.status = 'in_progress';
        }

        await ticket.save();

        // Simulate Email
        console.log(`[EMAIL SENT] To: ${ticket.email}`);
        console.log(`[EMAIL SUBJECT] Re: ${ticket.subject}`);
        console.log(`[EMAIL BODY] ${message}`);

        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getStats,
    getUsers,
    toggleBanUser,
    getReports,
    resolveReport,
    getSupportTickets,
    replySupportTicket
};
