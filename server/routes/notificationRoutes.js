const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getNotifications, markRead, clearNotifications } = require('../controllers/notificationController');

router.get('/', protect, getNotifications);
router.put('/read', protect, markRead);
router.delete('/', protect, clearNotifications);

module.exports = router;
