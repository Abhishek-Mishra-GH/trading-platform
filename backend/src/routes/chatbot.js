const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { chat, getHistory, getStockInsight, clearHistory } = require('../controllers/chatbotController');

router.post('/message', protect, chat);
router.get('/history', protect, getHistory);
router.post('/stock-insight/:symbol', protect, getStockInsight);
router.delete('/clear', protect, clearHistory);

module.exports = router;
