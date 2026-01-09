const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser, refreshToken, forgotPassword, verifyCode, resetPassword, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/refresh', refreshToken);
router.post('/forgotpassword', forgotPassword);
router.post('/verify-code', verifyCode);
router.post('/resetpassword', resetPassword);
router.get('/me', protect, getUserProfile);

module.exports = router;
