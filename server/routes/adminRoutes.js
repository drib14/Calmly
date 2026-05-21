const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/adminController');

router.use(protect);
router.use(admin); // Apply admin check to all routes

router.get('/stats', getStats);
router.get('/logs', getLogs);
router.get('/users', getUsers);
router.put('/users/:id/ban', toggleBanUser);
router.put('/users/:id/restrict', toggleRestriction);
router.get('/reports', getReports);
router.put('/reports/:id', resolveReport);
router.get('/support', getSupportTickets);
router.post('/support/:id/reply', replySupportTicket);

// New Routes
router.get('/posts', getAllPosts);
router.delete('/posts/:id', deletePost);
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSetting);

module.exports = router;
