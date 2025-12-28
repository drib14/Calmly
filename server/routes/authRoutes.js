const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyEmail, logoutUser, refreshToken, forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify/:token', verifyEmail);
router.post('/logout', logoutUser);
router.get('/refresh', refreshToken);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resetToken', resetPassword);

module.exports = router;
