const express = require('express');
const router = express.Router();
const {
  register, login, logout, refreshToken, verifyEmail,
  forgotPassword, resetPassword, enableTwoFactor,
  verifyTwoFactor, disableTwoFactor, getMe
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

router.post('/enable-2fa', protect, enableTwoFactor);
router.post('/verify-2fa', verifyTwoFactor); // Does not require full protect, just temp token
router.post('/disable-2fa', protect, disableTwoFactor);
router.get('/me', protect, getMe);

module.exports = router;
