const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getWallet, initiateDeposit, verifyPayment, initiateWithdrawal } = require('../controllers/walletController');

router.get('/', protect, getWallet);
router.post('/deposit/initiate', protect, initiateDeposit);
router.post('/deposit/verify', protect, verifyPayment);
router.post('/withdraw', protect, initiateWithdrawal);

module.exports = router;
