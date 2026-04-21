const express = require('express');
const router = express.Router();
const marketDataService = require('../services/marketDataService');
const aiService = require('../services/aiService');

// Search stocks (real NSE search)
router.get('/search', async (req, res) => {
  try { res.json(await marketDataService.searchStocks(req.query.q || '')); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

// Get Nifty 50 list (static)
router.get('/nifty50/list', (req, res) => {
  res.json(marketDataService.getNifty50List());
});

// Market overview: indices + gainers + losers
router.get('/market/overview', async (req, res) => {
  try { res.json(await marketDataService.getMarketOverview()); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/market/gainers', async (req, res) => {
  try { res.json(await marketDataService.getTopGainers()); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/market/losers', async (req, res) => {
  try { res.json(await marketDataService.getTopLosers()); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/market/indices', async (req, res) => {
  try { res.json(await marketDataService.getIndices()); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

// Quote for a specific stock
router.get('/:symbol/quote', async (req, res) => {
  try { res.json(await marketDataService.getQuote(req.params.symbol)); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

// Company profile
router.get('/:symbol/profile', async (req, res) => {
  try { res.json(await marketDataService.getCompanyProfile(req.params.symbol)); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

// Historical candle data: period & interval query params
// period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y
// interval: 1m, 5m, 15m, 30m, 1h, 1d, 1wk
router.get('/:symbol/history', async (req, res) => {
  try {
    const { period = '1mo', interval = '1d' } = req.query;
    res.json(await marketDataService.getHistoricalData(req.params.symbol, period, interval));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// News
router.get('/:symbol/news', async (req, res) => {
  try { res.json(await marketDataService.getMarketNews(req.params.symbol)); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

// AI Recommendation
router.get('/:symbol/recommendation', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const [quote, profile, news] = await Promise.all([
      marketDataService.getQuote(symbol),
      marketDataService.getCompanyProfile(symbol),
      marketDataService.getMarketNews(symbol)
    ]);
    const recommendation = await aiService.generateRecommendation(symbol, quote, profile, news);
    res.json(recommendation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Deep AI Prediction
router.get('/:symbol/deep-prediction', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const [quote, profile, news, history] = await Promise.all([
      marketDataService.getQuote(symbol),
      marketDataService.getCompanyProfile(symbol),
      marketDataService.getMarketNews(symbol),
      marketDataService.getHistoricalData(symbol, '3mo', '1d')
    ]);
    const prediction = await aiService.getDeepStockPrediction(symbol, quote, profile, news, history);
    res.json(prediction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
