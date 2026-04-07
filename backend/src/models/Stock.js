const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  exchange: { type: String },
  currentPrice: { type: Number, required: true },
  previousClose: { type: Number },
  change: { type: Number },
  changePercent: { type: Number },
  volume: { type: Number },
  marketCap: { type: Number },
  high52w: { type: Number },
  low52w: { type: Number },
  sector: { type: String },
  industry: { type: String },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Stock', stockSchema);
