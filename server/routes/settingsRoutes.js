const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getSettings,
  updateSettings,
  changePassword,
  updateEmail,
  logoutAllDevices,
  deleteAccount,
  getSessions,
  toggleJournalLock,
  verifyJournalPassword,
  downloadUserData,
  blockUser,
  reportUser
} = require('../controllers/settingsController');

// All routes are protected
router.use(protect);

router.get('/', getSettings);
router.put('/', updateSettings);
router.put('/password', changePassword);
router.put('/email', updateEmail);
router.post('/logout-all', logoutAllDevices);
router.get('/sessions', getSessions);
router.delete('/account', deleteAccount);

router.get('/download-data', downloadUserData);

// Block/Report User (via Settings/List logic)
router.post('/block-user', blockUser);
router.post('/report-user', reportUser);

// Journal Lock Routes
router.put('/journal-lock', toggleJournalLock);
router.post('/journal-verify', verifyJournalPassword);

module.exports = router;
