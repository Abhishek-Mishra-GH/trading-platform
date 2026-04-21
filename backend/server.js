require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketService = require('./src/services/socketService');

const authRoutes = require('./src/routes/auth');
const stocksRoutes = require('./src/routes/stocks');
const portfolioRoutes = require('./src/routes/portfolio');
const ordersRoutes = require('./src/routes/orders');
const watchlistRoutes = require('./src/routes/watchlist');
const walletRoutes = require('./src/routes/wallet');
const chatbotRoutes = require('./src/routes/chatbot');
const analyticsRoutes = require('./src/routes/analytics');
const backtestRoutes = require('./src/routes/backtest');
const { handleStripeWebhook } = require('./src/controllers/walletController');

const app = express();
const server = http.createServer(app);

// Connect MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log('MongoDB Error: ', err.message));

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
// Stripe signature verification requires the unparsed request body.
app.post('/api/wallet/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/backtest', backtestRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Server Error' });
});

socketService.init(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
