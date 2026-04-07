const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'buy', 'sell', 'transfer'], required: true },
  symbol: { type: String },
  quantity: { type: Number },
  price: { type: Number },
  totalAmount: { type: Number, required: true },
  fees: { type: Number, default: 0 },
  netAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  paymentMethod: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
