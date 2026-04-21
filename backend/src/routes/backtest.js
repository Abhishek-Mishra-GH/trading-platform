const express = require('express');
const router = express.Router();
const backtestController = require('../controllers/backtestController');
const { protect } = require('../middleware/auth');

router.post('/run', protect, backtestController.runBacktest);

module.exports = router;
