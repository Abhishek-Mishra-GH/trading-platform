# 🚀 TradeSphere — Full-Stack AI Trading Platform MVP

TradeSphere is a clean, visually appealing, end-to-end working MVP for a stock and portfolio management platform integrated with Google Gemini AI.

## Features
- **Authentication**: JWT-based auth with simulated 2FA and password recovery.
- **Dashboard**: Real-time mock portfolio value, indices, and recent orders.
- **Market Data**: Integration with Finnhub / AlphaVantage fallback for live stock discovery and quotes.
- **Trading**: Buy/Sell execution with mock portfolio ledger and transaction history.
- **Wallet**: Integrated mock Razorpay/Stripe deposit and withdrawal flow.
- **AI Chatbot**: Dedicated Google Gemini 1.5 Flash bot acting as a financial assistant.
- **AI Advisor**: Risk analysis, portfolio health score, and automated insights.
- **Advanced Analytics**: Treemaps and CAGR charts via Recharts.

## Architecture Overview
- **Frontend**: React (Vite), Tailwind CSS v4, Zustand, React Router, Recharts, Lucide Icons.
- **Backend**: Express.js (Node.js), MongoDB (Mongoose), Socket.io, Google Generative AI SDK, JSON Web Tokens.
- No monorepo; standard dual-directory setup.

## Setup Instructions

### 1. Root Setup
Ensure you have Node.js and MongoDB installed locally.

### 2. Backend Setup
1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in your keys:
   - `MONGODB_URI=mongodb://localhost:27017/tradesphere`
   - `GEMINI_API_KEY=your_gemini_key`
   - `FINNHUB_API_KEY=your_finnhub_key`
4. Start the server:
   - `node server.js` (Runs on port 5000)

### Stripe deposit testing
- Set `STRIPE_SECRET_KEY` to a Stripe **test** key (typically starts with `sk_test_`) and `STRIPE_WEBHOOK_SECRET` from your Stripe CLI/webhook endpoint.
- `POST /api/wallet/deposit/initiate` now creates a Stripe Checkout Session and returns a hosted `checkoutUrl`.
- The frontend redirects users to Stripe, then returns to `/wallet?stripe_status=success&session_id=...` after payment.
- `POST /api/wallet/deposit/verify` validates the returned Checkout Session server-side and credits the wallet only when Stripe reports a paid session.
- Webhook endpoint: `POST /api/wallet/stripe/webhook` (expects Stripe signature and raw body). It safely handles duplicate events and prevents double-credit.

### 3. Frontend Setup
1. `cd frontend`
2. `npm install`
3. Create `.env` if required (`VITE_API_URL=http://localhost:5000/api`)
4. Start the dev server:
   - `npm run dev` (Runs on port 3000)

## MVP Scope Note
This is an MVP optimized for speed and demo readiness. It does not contain an external ML microservice (using Gemini API instead) and mocks certain banking/payment webhooks for demonstration purposes. It is not currently optimized for millions of concurrent users.
