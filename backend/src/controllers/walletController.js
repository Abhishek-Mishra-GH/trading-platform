const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

const stripeClient = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY || 'INR').toLowerCase();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const MIN_DEPOSIT = 100;
const MAX_DEPOSIT = 100000;

const normalizeAmount = (amountInPaise) => Number((amountInPaise / 100).toFixed(2));

const applyWalletDeposit = async ({ userId, amount, paymentMethod, stripePaymentIntentId, stripeCheckoutSessionId }) => {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await Wallet.create({ userId });
  }

  wallet.balance += amount;
  wallet.totalDeposited += amount;
  await wallet.save();

  const transaction = await Transaction.create({
    userId,
    type: 'deposit',
    totalAmount: amount,
    netAmount: amount,
    status: 'completed',
    paymentMethod,
    stripePaymentIntentId,
    stripeCheckoutSessionId
  });

  return { wallet, transaction };
};

const processCheckoutSessionDeposit = async (session) => {
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id;

  const existing = await Transaction.findOne({
    $or: [
      { stripeCheckoutSessionId: session.id },
      paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : null
    ].filter(Boolean)
  });

  if (existing) {
    const wallet = await Wallet.findOne({ userId: existing.userId });
    return { wallet, transaction: existing, alreadyProcessed: true };
  }

  if (session.payment_status !== 'paid') {
    throw new Error('Stripe payment is not completed');
  }

  const userId = session.metadata?.userId;
  if (!userId) {
    throw new Error('Stripe session missing user metadata');
  }

  const amount = normalizeAmount(session.amount_total || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Stripe session amount is invalid');
  }

  const result = await applyWalletDeposit({
    userId,
    amount,
    paymentMethod: 'stripe',
    stripePaymentIntentId: paymentIntentId,
    stripeCheckoutSessionId: session.id
  });

  return { ...result, alreadyProcessed: false };
};

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
    const value = Number(req.body.amount);
    if (!Number.isFinite(value) || value < MIN_DEPOSIT || value > MAX_DEPOSIT) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    if (!stripeClient) {
      return res.status(503).json({ message: 'Stripe is not configured on the server' });
    }

    const orderId = `order_${req.user._id.toString().slice(-4)}_${Date.now()}`;
    const returnBaseUrl = req.headers.origin || FRONTEND_URL;
    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      customer_email: req.user.email,
      client_reference_id: req.user._id.toString(),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: STRIPE_CURRENCY,
            unit_amount: Math.round(value * 100),
            product_data: {
              name: 'TradeSphere Wallet Top-Up',
              description: `Wallet credit of ${value.toFixed(2)} ${STRIPE_CURRENCY.toUpperCase()}`
            }
          }
        }
      ],
      metadata: {
        userId: req.user._id.toString(),
        walletOrderId: orderId,
        requestedAmount: value.toString()
      },
      success_url: `${returnBaseUrl}/wallet?stripe_status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnBaseUrl}/wallet?stripe_status=cancelled`
    });

    res.json({
      orderId,
      amount: value,
      currency: STRIPE_CURRENCY,
      paymentProvider: 'stripe',
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    if (!stripeClient) {
      return res.status(503).json({ message: 'Stripe is not configured on the server' });
    }

    const sessionId = req.body.sessionId;
    if (!sessionId) {
      return res.status(400).json({ message: 'Stripe session id is required' });
    }

    const session = await stripeClient.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    if (!session || session.mode !== 'payment') {
      return res.status(400).json({ message: 'Invalid Stripe checkout session' });
    }

    if (session.metadata?.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'This checkout session does not belong to the current user' });
    }

    if (session.status !== 'complete' || session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Stripe payment is not completed yet' });
    }

    const { wallet, transaction, alreadyProcessed } = await processCheckoutSessionDeposit(session);
    res.json({
      message: alreadyProcessed ? 'Payment already processed' : 'Payment successful',
      transaction,
      balance: wallet ? wallet.balance : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.handleStripeWebhook = async (req, res) => {
  try {
    if (!stripeClient || !STRIPE_WEBHOOK_SECRET) {
      return res.status(503).json({ message: 'Stripe webhook is not configured' });
    }

    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ message: 'Missing Stripe signature' });
    }

    let event;
    try {
      event = stripeClient.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (error) {
      return res.status(400).json({ message: `Webhook signature verification failed: ${error.message}` });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await processCheckoutSessionDeposit(session);
    }

    res.json({ received: true });
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
      userId: req.user._id,
      type: 'withdrawal',
      totalAmount: amount + 5,
      fees: 5,
      netAmount: amount,
      status: 'completed'
    });

    res.json({ message: 'Withdrawal initiated', transaction, balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
