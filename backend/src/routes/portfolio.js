const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getPortfolio, getPortfolioAdvisor } = require('../controllers/portfolioController');

router.get('/', protect, getPortfolio);
router.get('/advisor', protect, getPortfolioAdvisor);

module.exports = router;
