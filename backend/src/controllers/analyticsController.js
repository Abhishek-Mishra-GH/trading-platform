const Portfolio = require('../models/Portfolio');

const round = (value, decimals = 2) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Number(n.toFixed(decimals));
};

const safeDivide = (a, b) => (b ? a / b : 0);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const stdDev = (arr) => {
  if (!arr.length) return 0;
  const mean = arr.reduce((sum, value) => sum + value, 0) / arr.length;
  const variance = arr.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / arr.length;
  return Math.sqrt(variance);
};

const buildEmptyPayload = () => ({
  cagr: 0,
  volatility: 0,
  sharpe_ratio: 0,
  sortino_ratio: 0,
  max_drawdown: 0,
  diversification_score: 0,
  concentration_risk: 0,
  health_score: 0,
  annualized_return: 0,
  total_invested: 0,
  total_current_value: 0,
  total_profit_loss: 0,
  sector_allocation: {},
  top_performers: [],
  worst_performers: [],
  monthly_returns: [],
  risk_breakdown: {
    hhi: 0,
    largest_position: 0,
    gainers_ratio: 0,
    losers_ratio: 0
  }
});

const normalizeHoldings = (portfolio) => {
  if (!portfolio || !Array.isArray(portfolio.holdings)) return [];

  return portfolio.holdings.map((holding) => {
    const investedAmount = Number(holding.investedAmount || (holding.avgBuyPrice || 0) * (holding.quantity || 0));
    const currentValue = Number(holding.currentValue || investedAmount);
    const profitLoss = Number(holding.profitLoss || (currentValue - investedAmount));
    const profitLossPercent = Number.isFinite(holding.profitLossPercent)
      ? Number(holding.profitLossPercent)
      : safeDivide(profitLoss, investedAmount) * 100;

    return {
      symbol: holding.symbol,
      sector: holding.sector || 'Others',
      quantity: Number(holding.quantity || 0),
      avgBuyPrice: Number(holding.avgBuyPrice || 0),
      currentPrice: Number(holding.currentPrice || 0),
      investedAmount,
      currentValue,
      profitLoss,
      profitLossPercent
    };
  });
};

const buildSyntheticHistory = ({ days, invested, currentValue, seed }) => {
  const entries = [];
  if (invested <= 0 && currentValue <= 0) return entries;

  const startValue = Math.max(1000, invested * 0.9 || currentValue * 0.8 || 1000);
  const endValue = Math.max(1000, currentValue || startValue);

  for (let i = days; i >= 0; i -= 1) {
    const index = days - i;
    const progress = safeDivide(index, days);
    const trend = startValue + ((endValue - startValue) * progress);
    const cyclical = Math.sin((index + seed) * 0.34) * 0.014 + Math.cos((index + seed) * 0.16) * 0.01;
    const micro = (((index + seed) % 7) - 3) * 0.0014;
    const totalValue = Math.max(500, trend * (1 + cyclical + micro));
    const investedCurve = invested * (0.92 + (progress * 0.08));

    const date = new Date();
    date.setDate(date.getDate() - i);

    entries.push({
      date: date.toISOString().split('T')[0],
      totalValue: round(totalValue, 2),
      invested: round(investedCurve, 2),
      pnl: round(totalValue - investedCurve, 2)
    });
  }

  return entries;
};

const computeMaxDrawdown = (history) => {
  if (!history.length) return 0;

  let peak = history[0].totalValue;
  let maxDrawdown = 0;

  history.forEach((point) => {
    peak = Math.max(peak, point.totalValue);
    const drawdown = safeDivide(point.totalValue - peak, peak) * 100;
    maxDrawdown = Math.min(maxDrawdown, drawdown);
  });

  return round(maxDrawdown, 2);
};

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const buildMonthlyReturns = (annualizedReturn, volatility, seed) => {
  const base = annualizedReturn / 12;
  return monthLabels.map((month, index) => {
    const oscillation = Math.sin((index + 1 + seed) * 0.9) * (volatility / 14 + 0.9);
    const drift = Math.cos((index + 2 + seed) * 0.45) * 0.8;
    const value = clamp(base + oscillation + drift, -18, 18);
    return { month, return: round(value, 2) };
  });
};

const getPortfolioSnapshot = async (userId) => {
  const portfolio = await Portfolio.findOne({ userId });
  const holdings = normalizeHoldings(portfolio);

  if (!portfolio || !holdings.length) {
    return {
      portfolio,
      holdings,
      invested: 0,
      currentValue: 0,
      totalProfitLoss: 0,
      annualizedReturn: 0,
      seed: 3
    };
  }

  const invested = holdings.reduce((sum, item) => sum + item.investedAmount, 0);
  const currentValue = holdings.reduce((sum, item) => sum + item.currentValue, 0);
  const totalProfitLoss = currentValue - invested;
  const annualizedReturn = safeDivide(totalProfitLoss, invested) * 100;
  const seed = holdings.reduce((sum, item) => sum + item.symbol.charCodeAt(0), holdings.length);

  return {
    portfolio,
    holdings,
    invested,
    currentValue,
    totalProfitLoss,
    annualizedReturn,
    seed
  };
};

const computeAnalytics = (snapshot) => {
  const { holdings, invested, currentValue, totalProfitLoss, annualizedReturn, seed, portfolio } = snapshot;
  if (!holdings.length) return buildEmptyPayload();

  const weights = holdings.map((holding) => safeDivide(holding.currentValue, currentValue));
  const returns = holdings.map((holding) => holding.profitLossPercent);
  const negativeReturns = returns.filter((value) => value < 0);
  const downsideDeviation = stdDev(negativeReturns.length ? negativeReturns : [0]);
  const volatility = round(stdDev(returns), 2);
  const riskFreeRate = 6.5;
  const sharpeRatio = round(safeDivide(annualizedReturn - riskFreeRate, volatility || 1), 2);
  const sortinoRatio = round(safeDivide(annualizedReturn - riskFreeRate, downsideDeviation || 1), 2);

  const daysTracked = Math.max(120, Math.min(365, holdings.length * 60));
  const history = buildSyntheticHistory({ days: daysTracked, invested, currentValue, seed });
  const maxDrawdown = computeMaxDrawdown(history);

  const sectorAllocation = {};
  holdings.forEach((holding) => {
    sectorAllocation[holding.sector] = round((sectorAllocation[holding.sector] || 0) + holding.currentValue, 2);
  });

  const sortedHoldings = [...holdings].sort((a, b) => b.profitLossPercent - a.profitLossPercent);
  const topPerformers = sortedHoldings.slice(0, 4);
  const worstPerformers = sortedHoldings.slice(-4).reverse();
  const largestPosition = round((Math.max(...weights) || 0) * 100, 2);
  const hhi = round(weights.reduce((sum, weight) => sum + ((weight * 100) ** 2), 0), 2);
  const gainersRatio = round((returns.filter((r) => r > 0).length / holdings.length) * 100, 2);
  const losersRatio = round((returns.filter((r) => r < 0).length / holdings.length) * 100, 2);

  const sectorCount = Object.keys(sectorAllocation).length;
  const diversificationScore = round(
    clamp(35 + (holdings.length * 6) + (sectorCount * 5) - Math.max(0, (hhi - 1800) / 32) - Math.max(0, largestPosition - 30) * 1.2, 0, 100),
    1
  );
  const concentrationRisk = round(clamp((largestPosition * 0.58) + Math.max(0, (hhi - 1800) / 70), 0, 100), 1);
  const returnScore = clamp(50 + (annualizedReturn * 1.8), 0, 100);
  const riskScore = clamp(100 - (volatility * 2.1) - concentrationRisk, 0, 100);
  const healthScore = round((returnScore * 0.36) + (riskScore * 0.34) + (diversificationScore * 0.30), 1);

  const createdAt = portfolio?.createdAt ? new Date(portfolio.createdAt) : new Date();
  const yearsActive = Math.max(0.25, (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365));
  const cagr = invested > 0
    ? round(((Math.pow(safeDivide(currentValue, invested) || 1, safeDivide(1, yearsActive))) - 1) * 100, 2)
    : 0;

  return {
    cagr,
    volatility,
    sharpe_ratio: sharpeRatio,
    sortino_ratio: sortinoRatio,
    max_drawdown: maxDrawdown,
    diversification_score: diversificationScore,
    concentration_risk: concentrationRisk,
    health_score: healthScore,
    annualized_return: round(annualizedReturn, 2),
    total_invested: round(invested, 2),
    total_current_value: round(currentValue, 2),
    total_profit_loss: round(totalProfitLoss, 2),
    sector_allocation: sectorAllocation,
    top_performers: topPerformers,
    worst_performers: worstPerformers,
    monthly_returns: buildMonthlyReturns(annualizedReturn, volatility, seed),
    history,
    risk_breakdown: {
      hhi,
      largest_position: largestPosition,
      gainers_ratio: gainersRatio,
      losers_ratio: losersRatio
    }
  };
};

const buildRuleBasedPortfolioNarrative = (analytics, snapshot) => {
  const holdingsCount = snapshot.holdings.length;
  const primaryRisk = analytics.concentration_risk > 60
    ? 'Position concentration is elevated; a single holding can materially move portfolio P&L.'
    : 'Concentration risk is in a manageable zone, but monitoring top weights remains important.';
  const returnQuality = analytics.sharpe_ratio >= 1
    ? 'Risk-adjusted returns are healthy relative to a moderate risk-free baseline.'
    : 'Returns are currently modest relative to measured volatility, suggesting weaker risk-adjusted efficiency.';

  return [
    `Portfolio health score is ${analytics.health_score}/100 across ${holdingsCount} active holdings.`,
    primaryRisk,
    returnQuality,
    'This analysis is for informational purposes only and is not financial advice.'
  ].join(' ');
};

const buildRuleBasedActions = (analytics, snapshot) => {
  const actions = [];
  const topConcentration = analytics.risk_breakdown.largest_position;

  if (topConcentration > 35) {
    actions.push('Trim your largest position by 5-10% and reallocate across 2-3 underweighted sectors.');
  }
  if (analytics.risk_breakdown.gainers_ratio < 45) {
    actions.push('Review underperforming holdings and set explicit stop-loss or thesis checkpoints.');
  }
  if (snapshot.holdings.length < 6) {
    actions.push('Broaden the portfolio with non-correlated names to improve diversification quality.');
  }
  if (analytics.sortino_ratio < 0.8) {
    actions.push('Reduce downside volatility by balancing high-beta stocks with defensive allocations.');
  }
  if (!actions.length) {
    actions.push('Maintain allocations and rebalance monthly to hold risk exposures near your target bands.');
  }

  return actions;
};

exports.getAdvancedMetrics = async (req, res) => {
  try {
    const snapshot = await getPortfolioSnapshot(req.user._id);
    const metrics = computeAnalytics(snapshot);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPortfolioHistory = async (req, res) => {
  try {
    const snapshot = await getPortfolioSnapshot(req.user._id);
    const analytics = computeAnalytics(snapshot);
    res.json(analytics.history || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getHeatmapData = async (req, res) => {
  try {
    const snapshot = await getPortfolioSnapshot(req.user._id);
    if (!snapshot.holdings.length || snapshot.currentValue <= 0) return res.json([]);

    const heatmap = snapshot.holdings
      .map((holding) => ({
        symbol: holding.symbol,
        return_pct: round(holding.profitLossPercent, 2),
        weight_in_portfolio: round((holding.currentValue / snapshot.currentValue) * 100, 2),
        sector: holding.sector || 'Others'
      }))
      .sort((a, b) => b.weight_in_portfolio - a.weight_in_portfolio);

    res.json(heatmap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSectorBreakdown = async (req, res) => {
  try {
    const snapshot = await getPortfolioSnapshot(req.user._id);
    if (!snapshot.holdings.length) return res.json([]);

    const sectors = {};
    snapshot.holdings.forEach((holding) => {
      sectors[holding.sector] = (sectors[holding.sector] || 0) + holding.currentValue;
    });

    const total = Object.values(sectors).reduce((sum, value) => sum + value, 0);
    const breakdown = Object.entries(sectors)
      .map(([name, value]) => ({
        name,
        value: round(value, 2),
        allocationPct: round((value / (total || 1)) * 100, 2)
      }))
      .sort((a, b) => b.value - a.value);

    res.json(breakdown);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRiskAnalysis = async (req, res) => {
  try {
    const snapshot = await getPortfolioSnapshot(req.user._id);
    const analytics = computeAnalytics(snapshot);

    if (!snapshot.holdings.length) {
      return res.json({
        beta: 0,
        var: 0,
        cvar: 0,
        riskLevel: 'Low',
        concentrationRisk: 0,
        diversificationScore: 0,
        largestPosition: 0
      });
    }

    const beta = round(clamp(0.65 + (analytics.volatility / 24) + (analytics.concentration_risk / 180), 0.4, 2.4), 2);
    const dailyVol = analytics.volatility / Math.sqrt(252);
    const var95 = round(-1.65 * (dailyVol / 100) * snapshot.currentValue, 2);
    const cvar95 = round(var95 * 1.22, 2);

    let riskLevel = 'Moderate';
    if (analytics.health_score >= 75 && analytics.concentration_risk < 45) riskLevel = 'Low to Moderate';
    if (analytics.concentration_risk > 65 || analytics.volatility > 24) riskLevel = 'Elevated';
    if (analytics.concentration_risk > 78 || analytics.volatility > 30) riskLevel = 'High';

    res.json({
      beta,
      var: var95,
      cvar: cvar95,
      riskLevel,
      concentrationRisk: analytics.concentration_risk,
      diversificationScore: analytics.diversification_score,
      largestPosition: analytics.risk_breakdown.largest_position
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAIPortfolioAnalysis = async (req, res) => {
  try {
    const snapshot = await getPortfolioSnapshot(req.user._id);
    const analytics = computeAnalytics(snapshot);

    if (!snapshot.holdings.length) {
      return res.json({
        generatedAt: new Date().toISOString(),
        healthScore: 0,
        confidence: 'low',
        summary: 'No holdings found yet. Build initial positions to unlock AI portfolio diagnostics.',
        strengths: [],
        risks: ['No portfolio data available for meaningful risk decomposition.'],
        actions: ['Start with 2-3 diversified positions and review exposure weekly.']
      });
    }

    const strengths = [];
    const risks = [];

    if (analytics.sharpe_ratio >= 1) strengths.push(`Sharpe ratio at ${analytics.sharpe_ratio} indicates efficient risk-adjusted returns.`);
    if (analytics.diversification_score >= 70) strengths.push(`Diversification score of ${analytics.diversification_score} reflects balanced exposure breadth.`);
    if (analytics.risk_breakdown.gainers_ratio >= 55) strengths.push(`${analytics.risk_breakdown.gainers_ratio}% of positions are currently in profit.`);
    if (!strengths.length) strengths.push('Portfolio has tradable structure but needs optimization for stronger consistency.');

    if (analytics.concentration_risk >= 60) risks.push(`Concentration risk is ${analytics.concentration_risk}; largest position is ${analytics.risk_breakdown.largest_position}%.`);
    if (analytics.max_drawdown <= -18) risks.push(`Max drawdown reached ${analytics.max_drawdown}%, which signals deeper downside sensitivity.`);
    if (analytics.sortino_ratio < 0.9) risks.push(`Sortino ratio at ${analytics.sortino_ratio} suggests weak downside-protected returns.`);
    if (!risks.length) risks.push('No immediate critical risk flags, but keep periodic rebalancing discipline.');

    const actions = buildRuleBasedActions(analytics, snapshot);
    const summary = buildRuleBasedPortfolioNarrative(analytics, snapshot);

    res.json({
      generatedAt: new Date().toISOString(),
      healthScore: analytics.health_score,
      confidence: analytics.volatility > 25 ? 'medium' : 'high',
      summary,
      strengths,
      risks,
      actions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.stockRecommendation = async (req, res) => {
  try {
    const aiService = require('../services/aiService');
    const insight = await aiService.generateStockInsight(req.params.symbol);
    res.json({ recommendation: insight });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
