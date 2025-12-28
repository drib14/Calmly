const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyEmail, logoutUser, refreshToken } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify/:token', verifyEmail);
router.post('/logout', logoutUser);
router.get('/refresh', refreshToken);

module.exports = router;
