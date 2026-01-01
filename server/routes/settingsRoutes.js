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
  getBlockedUsers,
  blockUser,
  unblockUser,
  getMutedKeywords,
  addMutedKeyword,
  removeMutedKeyword,
  getMutedConversations,
  unmuteConversation
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

// Blocking & Muting
router.get('/blocked-users', getBlockedUsers);
router.post('/blocked-users', blockUser);
router.delete('/blocked-users/:id', unblockUser);

router.get('/muted-keywords', getMutedKeywords);
router.post('/muted-keywords', addMutedKeyword);
router.delete('/muted-keywords/:keyword', removeMutedKeyword);

// Muted Conversations (New)
router.get('/muted-conversations', getMutedConversations);
router.delete('/muted-conversations/:id', unmuteConversation);

// Journal Lock Routes
router.put('/journal-lock', toggleJournalLock);
router.post('/journal-verify', verifyJournalPassword);

module.exports = router;
