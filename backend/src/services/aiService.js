const { GoogleGenAI } = require('@google/genai');
const marketDataService = require('./marketDataService');
const Portfolio = require('../models/Portfolio');
const Wallet = require('../models/Wallet');

const apiKey = process.env.GEMINI_API_KEY || 'fake_key';
const ai = new GoogleGenAI({ apiKey });

exports.buildSystemPrompt = (userContext) => {
  return `You are TradeSphere AI, an Indian stock market assistant.
Help with stock analysis, market trends, and portfolio guidance.
Always mention this is not financial advice.
Use INR (₹) and clear sections.

Context:
- Wallet Balance: ₹${userContext.walletBalance}
- Portfolio Invested: ₹${userContext.portfolioInvested}
- Portfolio Value: ₹${userContext.portfolioValue}
- Holdings: ${JSON.stringify(userContext.holdings)}`;
};

exports.chatWithContext = async (userId, message, conversationHistory) => {
  try {
    const wallet = await Wallet.findOne({ userId });
    const portfolio = await Portfolio.findOne({ userId });
    
    const userContext = {
      walletBalance: wallet ? wallet.balance : 0,
      portfolioInvested: portfolio ? portfolio.totalInvested : 0,
      portfolioValue: portfolio ? portfolio.totalCurrentValue : 0,
      holdings: portfolio && portfolio.holdings ? portfolio.holdings.map(h => ({ symbol: h.symbol, qty: h.quantity })) : []
    };

    const systemPrompt = exports.buildSystemPrompt(userContext);
    const fullPrompt = `${systemPrompt}\n\nUser History: ${JSON.stringify(conversationHistory)}\nUser: ${message}\nAssistant:`;

    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: fullPrompt
    });
    const response = result.text;

    return { response, suggestions: ["What's my portfolio value?", "Analyze Reliance", "Market trends"] };
  } catch (error) {
    console.error('Gemini API Error', error);
    return { response: "I'm sorry, I cannot connect to the trading brain right now.", suggestions: [] };
  }
};

exports.generateStockInsight = async (symbol) => {
  try {
    const quote = await marketDataService.getQuote(symbol);
    const profile = await marketDataService.getCompanyProfile(symbol);
    
    const prompt = `Provide a structured, short stock insight for ${symbol}.
Company: ${profile ? profile.name : symbol}
Current Price: ₹${quote ? quote.currentPrice : 'N/A'}

Cover: Sentiment, Key Risks, Recent Developments.`;

    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return result.text;
  } catch (error) {
    return "Could not generate insight at this time.";
  }
};
