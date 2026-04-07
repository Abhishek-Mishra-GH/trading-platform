const Portfolio = require('../models/Portfolio');
const aiService = require('../services/aiService');

exports.getAdvancedMetrics = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio || portfolio.holdings.length === 0) {
      return res.json({ cagr:0, volatility:0, sharpe_ratio:0, max_drawdown:0, sector_allocation:{}, top_performers:[], worst_performers:[], monthly_returns:[] });
    }

    const metrics = {
      cagr: 12.5,
      volatility: 18.2, 
      sharpe_ratio: 1.4,
      max_drawdown: -15.4,
      sector_allocation: {},
      top_performers: [],
      worst_performers: [],
      monthly_returns: [ { month: 'Jan', return: 2.1 }, { month: 'Feb', return: -1.0 }, { month: 'Mar', return: 3.5 } ]
    };

    portfolio.holdings.forEach(h => {
      const sector = h.sector || 'Others';
      metrics.sector_allocation[sector] = (metrics.sector_allocation[sector] || 0) + h.currentValue;
    });

    const sortedHoldings = [...portfolio.holdings].sort((a,b) => b.profitLossPercent - a.profitLossPercent);
    metrics.top_performers = sortedHoldings.slice(0, 3);
    metrics.worst_performers = sortedHoldings.slice(-3).reverse();

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPortfolioHistory = async (req, res) => {
  try {
    const history = [];
    const baseVal = 100000;
    for(let i=30; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      history.push({
        date: d.toISOString().split('T')[0],
        totalValue: baseVal + (Math.random() * 20000 - 10000),
        invested: baseVal,
        pnl: Math.random() * 10000
      });
    }
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getHeatmapData = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio || portfolio.holdings.length === 0) return res.json([]);
    
    const totalVal = portfolio.totalCurrentValue || 1;
    const heatmap = portfolio.holdings.map(h => ({
      symbol: h.symbol,
      return_pct: h.profitLossPercent,
      weight_in_portfolio: (h.currentValue / totalVal) * 100,
      sector: h.sector || 'Others'
    }));

    res.json(heatmap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSectorBreakdown = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) return res.json([]);
    
    const sectors = {};
    portfolio.holdings.forEach(h => {
      const s = h.sector || 'Others';
      sectors[s] = (sectors[s] || 0) + h.currentValue;
    });
    const result = Object.keys(sectors).map(k => ({ name: k, value: sectors[k] }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRiskAnalysis = async (req, res) => {
  res.json({ beta: 1.1, var: -2.5, riskLevel: 'Moderate' });
};

exports.stockRecommendation = async (req, res) => {
  try {
    const insight = await aiService.generateStockInsight(req.params.symbol);
    res.json({ recommendation: insight });
  } catch(error) {
    res.status(500).json({ message: error.message });
  }
};
