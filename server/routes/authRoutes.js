const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser, refreshToken, forgotPassword, verifyCode, resetPassword } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/refresh', refreshToken);
router.post('/forgotpassword', forgotPassword);
router.post('/verify-code', verifyCode);
router.post('/resetpassword', resetPassword);

module.exports = router;
