const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAdvancedMetrics,
  getPortfolioHistory,
  getHeatmapData,
  getSectorBreakdown,
  getRiskAnalysis,
  getAIPortfolioAnalysis,
  stockRecommendation
} = require('../controllers/analyticsController');

router.get('/metrics', protect, getAdvancedMetrics);
router.get('/portfolio-history', protect, getPortfolioHistory);
router.get('/heatmap', protect, getHeatmapData);
router.get('/sector-breakdown', protect, getSectorBreakdown);
router.get('/risk-analysis', protect, getRiskAnalysis);
router.get('/ai-portfolio-analysis', protect, getAIPortfolioAnalysis);
router.post('/stock-recommendation/:symbol', protect, stockRecommendation);

module.exports = router;
