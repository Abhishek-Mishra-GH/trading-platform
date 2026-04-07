const Portfolio = require('../models/Portfolio');
const marketDataService = require('../services/marketDataService');

exports.getPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio || portfolio.holdings.length === 0) {
      return res.json({ holdings: [], totalInvested: 0, totalCurrentValue: 0, totalProfitLoss: 0, totalProfitLossPercent: 0 });
    }

    let totalCurrentValue = 0;
    let totalInvested = 0;

    for (const h of portfolio.holdings) {
      const quote = await marketDataService.getQuote(h.symbol);
      if (quote && quote.currentPrice) {
        h.currentPrice = quote.currentPrice;
        h.currentValue = h.quantity * h.currentPrice;
        h.profitLoss = h.currentValue - h.investedAmount;
        h.profitLossPercent = (h.profitLoss / h.investedAmount) * 100;
        
        totalCurrentValue += h.currentValue;
      } else {
        h.currentValue = h.investedAmount;
        totalCurrentValue += h.investedAmount;
      }
      totalInvested += h.investedAmount;
    }

    portfolio.totalInvested = totalInvested;
    portfolio.totalCurrentValue = totalCurrentValue;
    portfolio.totalProfitLoss = totalCurrentValue - totalInvested;
    portfolio.totalProfitLossPercent = totalInvested > 0 ? (portfolio.totalProfitLoss / totalInvested) * 100 : 0;

    await portfolio.save();
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
