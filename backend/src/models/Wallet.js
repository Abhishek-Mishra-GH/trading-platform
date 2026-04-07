const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  transactions: [{
    type: { type: String, enum: ['deposit', 'withdrawal', 'buy', 'sell', 'transfer'] },
    amount: { type: Number, required: true },
    description: String,
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    razorpayOrderId: String,
    stripePaymentIntentId: String,
    createdAt: { type: Date, default: Date.now }
  }],
  totalDeposited: { type: Number, default: 0 },
  totalWithdrawn: { type: Number, default: 0 }
}, { timestamps: true });

walletSchema.virtual('availableBalance').get(function() {
  return this.balance;
});

module.exports = mongoose.model('Wallet', walletSchema);
