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
  getSessions
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

module.exports = router;
