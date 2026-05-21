const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');
const Support = require('../models/Support');
const Comment = require('../models/Comment');
const Identity = require('../models/Identity');
const SystemLog = require('../models/SystemLog');
const SystemSetting = require('../models/SystemSetting');

// Helper to log
const logAction = async (adminId, action, target, details) => {
    try {
        await SystemLog.create({
            admin: adminId,
            action,
            target,
            details
        });
    } catch (e) {
        console.error("Failed to log action:", e);
    }
};

// ... (Previous stats/logs/users functions remain)

// @desc    Get Admin Stats
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

const getLogs = async (req, res) => {
    try {
        const logs = await SystemLog.find()
            .populate('admin', 'email')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const toggleBanUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot ban an admin' });
        }

        user.isBanned = !user.isBanned;
        await user.save();

        await logAction(req.user._id, user.isBanned ? 'BAN_USER' : 'UNBAN_USER', `User: ${user._id}`, { email: user.email });

        res.json({ message: user.isBanned ? 'User banned' : 'User unbanned', isBanned: user.isBanned });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const toggleRestriction = async (req, res) => {
    const { type } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.restrictions) user.restrictions = {};

        user.restrictions[type] = !user.restrictions[type];
        await user.save();

        await logAction(req.user._id, 'RESTRICT_USER', `User: ${user._id}`, { type, status: user.restrictions[type] });

        res.json({ message: `User ${type} restriction updated`, restrictions: user.restrictions });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ... (Reports and Support remain)

const getReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('reporter', 'email')
            .populate('post')
            .sort({ createdAt: -1 });

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

const resolveReport = async (req, res) => {
    try {
        if (!req.params.id || req.params.id.length !== 24) {
             return res.status(400).json({ message: 'Invalid Report ID' });
        }

        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        const newStatus = req.body.status || 'resolved';
        report.status = newStatus;
        report.resolvedBy = req.user._id;
        await report.save();

        try {
            await logAction(req.user._id, 'RESOLVE_REPORT', `Report: ${report._id}`, { status: newStatus, reason: report.reason });
        } catch (logErr) {
            console.error("Log Error:", logErr);
        }

        res.json(report);
    } catch (err) {
        console.error("Resolve Report Error:", err);
        res.status(500).json({ message: err.message });
    }
};

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

        await logAction(req.user._id, 'REPLY_TICKET', `Ticket: ${ticket._id}`, { close: req.body.close });

        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- NEW FEATURES ---

// @desc Get All Posts (Admin)
const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('identity', 'name handle')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc Delete Post (Admin)
const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Hard delete for admin cleanup? Or soft? Soft is safer.
        post.deletedAt = new Date();
        await post.save();

        await logAction(req.user._id, 'DELETE_POST_ADMIN', `Post: ${post._id}`, {});
        res.json({ message: 'Post deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc Get System Settings
const getSystemSettings = async (req, res) => {
    try {
        const settings = await SystemSetting.find();
        // Convert array to object
        const settingsObj = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(settingsObj);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc Update System Setting
const updateSystemSetting = async (req, res) => {
    const { key, value } = req.body;
    try {
        let setting = await SystemSetting.findOne({ key });
        if (setting) {
            setting.value = value;
            setting.updatedBy = req.user._id;
            setting.updatedAt = Date.now();
        } else {
            setting = new SystemSetting({
                key,
                value,
                updatedBy: req.user._id
            });
        }
        await setting.save();
        await logAction(req.user._id, 'UPDATE_SETTING', `Setting: ${key}`, { value });
        res.json(setting);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getStats,
    getLogs,
    getUsers,
    toggleBanUser,
    toggleRestriction,
    getReports,
    resolveReport,
    getSupportTickets,
    replySupportTicket,
    getAllPosts,
    deletePost,
    getSystemSettings,
    updateSystemSetting
};
