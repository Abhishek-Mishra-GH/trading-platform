const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  holdings: [{
    symbol: { type: String, required: true },
    stockName: String,
    quantity: { type: Number, required: true },
    avgBuyPrice: { type: Number, required: true },
    currentPrice: { type: Number },
    investedAmount: { type: Number },
    currentValue: { type: Number },
    profitLoss: { type: Number },
    profitLossPercent: { type: Number },
    sector: { type: String },
    lastUpdated: { type: Date, default: Date.now }
  }],
  totalInvested: { type: Number, default: 0 },
  totalCurrentValue: { type: Number, default: 0 },
  totalProfitLoss: { type: Number, default: 0 },
  totalProfitLossPercent: { type: Number, default: 0 },
  dayChange: { type: Number, default: 0 },
  dayChangePercent: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
