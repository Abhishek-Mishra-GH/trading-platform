const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  stocks: [{
    symbol: { type: String, required: true },
    stockName: String,
    addedAt: { type: Date, default: Date.now },
    targetPrice: { type: Number },
    alertEnabled: { type: Boolean, default: false }
  }]
});

module.exports = mongoose.model('Watchlist', watchlistSchema);
