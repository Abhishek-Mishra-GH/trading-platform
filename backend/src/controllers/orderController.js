const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const marketDataService = require('../services/marketDataService');
const { emitOrderExecuted } = require('../services/socketService');
const { sendOrderConfirmationEmail } = require('../services/emailService');

exports.placeOrder = async (req, res) => {
  try {
    const { symbol, type, quantity, orderType } = req.body;
    const userId = req.user._id;

    const quote = await marketDataService.getQuote(symbol);
    const currentPrice = quote.currentPrice;
    if(!currentPrice) return res.status(400).json({ message: 'Could not fetch price' });

    const totalValue = quantity * currentPrice;
    let fees = 20 + (totalValue * 0.001);
    if (type === 'sell') fees += (totalValue * 0.001);
    
    const requiredAmount = type === 'buy' ? totalValue + fees : 0;
    const netAmount = type === 'buy' ? -(totalValue + fees) : (totalValue - fees);

    const wallet = await Wallet.findOne({ userId });
    if (type === 'buy' && wallet.balance < requiredAmount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    let portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) portfolio = await Portfolio.create({ userId });

    if (type === 'sell') {
      const holding = portfolio.holdings.find(h => h.symbol === symbol);
      if (!holding || holding.quantity < quantity) {
        return res.status(400).json({ message: 'Insufficient holdings to sell' });
      }
    }

    const order = await Order.create({
      userId, symbol, type, orderType, quantity, price: currentPrice,
      totalAmount: totalValue, status: 'executed', executedAt: Date.now()
    });

    if (type === 'buy') {
      wallet.balance += netAmount;
      await wallet.save();
      
      const holding = portfolio.holdings.find(h => h.symbol === symbol);
      if (holding) {
        const totalInvested = holding.investedAmount + totalValue;
        holding.quantity += quantity;
        holding.avgBuyPrice = totalInvested / holding.quantity;
        holding.investedAmount = totalInvested;
      } else {
        portfolio.holdings.push({
          symbol, quantity, avgBuyPrice: currentPrice, investedAmount: totalValue
        });
      }
    } else {
      wallet.balance += netAmount;
      await wallet.save();

      const holding = portfolio.holdings.find(h => h.symbol === symbol);
      holding.quantity -= quantity;
      holding.investedAmount = holding.quantity * holding.avgBuyPrice;
      if (holding.quantity === 0) {
        portfolio.holdings = portfolio.holdings.filter(h => h.symbol !== symbol);
      }
    }

    await portfolio.save();

    await Transaction.create({
      userId, type, symbol, quantity, price: currentPrice,
      totalAmount: totalValue, fees, netAmount: Math.abs(netAmount)
    });

    emitOrderExecuted(userId, order);
    await sendOrderConfirmationEmail(req.user, order);

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try { res.json(await Order.find({ userId: req.user._id }).sort('-createdAt')); }
  catch (error) { res.status(500).json({ message: error.message }); }
};

exports.cancelOrder = async (req, res) => {
  res.json({ message: 'Order cancelled' });
};
