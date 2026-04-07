const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

exports.getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    const transactions = await Transaction.find({ userId: req.user._id }).sort('-createdAt').limit(20);
    res.json({
      balance: wallet ? wallet.balance : 0,
      totalDeposited: wallet ? wallet.totalDeposited : 0,
      totalWithdrawn: wallet ? wallet.totalWithdrawn : 0,
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.initiateDeposit = async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount < 100 || amount > 100000) return res.status(400).json({ message: 'Invalid amount' });
    
    const orderId = `order_mock_${Math.random().toString(36).substring(7)}`;

    res.json({ orderId, amount, currency: 'INR', key: process.env.RAZORPAY_KEY_ID || 'mock_key' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    
    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) wallet = await Wallet.create({ userId: req.user._id });

    wallet.balance += amount;
    wallet.totalDeposited += amount;
    await wallet.save();

    const transaction = await Transaction.create({
      userId: req.user._id, type: 'deposit', totalAmount: amount, netAmount: amount, status: 'completed', paymentMethod: 'razorpay'
    });

    res.json({ message: 'Payment successful', transaction, balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.initiateWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    const wallet = await Wallet.findOne({ userId: req.user._id });

    if (!wallet || wallet.balance < amount + 5) {
      return res.status(400).json({ message: 'Insufficient balance (including flat fee ₹5)' });
    }

    wallet.balance -= (amount + 5);
    wallet.totalWithdrawn += amount;
    await wallet.save();

    const transaction = await Transaction.create({
      userId: req.user._id, type: 'withdrawal', totalAmount: amount + 5, fees: 5, netAmount: amount, status: 'completed'
    });

    res.json({ message: 'Withdrawal initiated', transaction, balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
