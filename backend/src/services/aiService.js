const { GoogleGenAI } = require('@google/genai');
const marketDataService = require('./marketDataService');
const Portfolio = require('../models/Portfolio');
const Wallet = require('../models/Wallet');

const apiKey = process.env.GEMINI_API_KEY || 'fake_key';
const ai = new GoogleGenAI({ apiKey });

// Helper to handle 503 load balancing by falling back to stable older models
const generateWithFallback = async (prompt, primaryModel = 'gemini-3.1-flash-lite-preview') => {
  try {
    return await ai.models.generateContent({ model: primaryModel, contents: prompt });
  } catch (error) {
    if (error.status === 503) {
      console.warn(`[AI 503 Fallback] High demand on ${primaryModel}, falling back to gemini-1.5-flash.`);
      return await ai.models.generateContent({ model: 'gemini-1.5-flash', contents: prompt });
    }
    throw error;
  }
};

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

    const result = await generateWithFallback(fullPrompt);
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

    const result = await generateWithFallback(prompt);
    return result.text;
  } catch (error) {
    return "Could not generate insight at this time.";
  }
};

exports.generateRecommendation = async (symbol, quote, profile, news) => {
  try {
    const prompt = `You are a quantitative stock analyzer. Given the data below, provide a trade recommendation for the Indian stock ${symbol}.
Company: ${profile ? profile.name : symbol}
Sector: ${profile ? profile.sector : 'N/A'}
Current Price: ₹${quote ? quote.currentPrice : 'N/A'}
Daily Change: ${quote ? quote.changePercent : 0}%
Recent News: ${JSON.stringify((news || []).slice(0, 3).map(n => n.headline))}

You MUST return the output EXACTLY as valid JSON with NO markdown formatting, NO \`\`\` blocks, and NO extra text:
{
  "recommendation": "BUY" or "SELL" or "HOLD",
  "confidence": <integer from 1 to 100>,
  "reason": "<one concise paragraph explaining the technical/fundamental reasoning>"
}`;

    const result = await generateWithFallback(prompt);
    let text = (result.text || '').trim();
    if(text.startsWith('\`\`\`json')){ text = text.replace(/^\`\`\`json/,'').replace(/\`\`\`$/,'').trim(); }
    return JSON.parse(text);
  } catch (error) {
    console.error('Recommendation generation failed:', error);
    return { recommendation: "HOLD", confidence: 50, reason: "Insufficient data or API error to generate a clear signal." };
  }
};

exports.getDeepStockPrediction = async (symbol, quote, profile, news, history) => {
  try {
    const prompt = `You are a legendary quantitative stock analyst and fundamental researcher. Analyze the Indian stock ${symbol}.
Company Name: ${profile?.name || symbol}
Sector/Industry: ${profile?.sector || 'N/A'} | ${profile?.industry || 'N/A'}
Current Quote: ₹${quote?.currentPrice || 'N/A'} (${quote?.changePercent || 0}%)
Recent Price Action Snippet: ${JSON.stringify((history || []).slice(-10).map(h => h.close))}
Recent Headlines: ${JSON.stringify((news || []).slice(0, 5).map(n => n.headline))}

Extrapolate technicals, compute potential upside, assess risk, and supply a deep evaluation.
You MUST return EXACTLY valid JSON with NO markdown formatting (\`\`\` blocks) and NO extra text:
{
  "recommendation": "BUY", "SELL", or "HOLD",
  "confidence": <1-100 integer>,
  "targetPrices": {
    "shortTerm": <number in INR>,
    "longTerm": <number in INR>
  },
  "riskLevel": "Low", "Medium", or "High",
  "technicalAnalysis": "<1 paragraph analyzing volume, trends, moving average assumptions based on the snippet>",
  "fundamentalAnalysis": "<1 paragraph analyzing sector momentum, news sentiment, and macro fundamentals>"
}`;

    const result = await generateWithFallback(prompt);
    
    let text = (result.text || '').trim();
    if(text.startsWith('\`\`\`json')){ text = text.replace(/^\`\`\`json/,'').replace(/\`\`\`$/,'').trim(); }
    else if(text.startsWith('\`\`\`')){ text = text.replace(/^\`\`\`/,'').replace(/\`\`\`$/,'').trim(); }
    return JSON.parse(text);
  } catch (error) {
    console.error('Deep Prediction generation failed:', error);
    throw error;
  }
};

exports.getPortfolioAdvice = async (portfolio, marketContext) => {
  try {
    const prompt = `You are a top-tier Indian portfolio advisor. Analyze the following user portfolio.
Total Invested: ₹${portfolio.totalInvested || 0}
Current Value: ₹${portfolio.totalCurrentValue || 0}
Holdings: ${JSON.stringify(portfolio.holdings || [])}
Overall Market Context: ${JSON.stringify(marketContext)}

Identify overexposures, profit booking opportunities, or accumulation zones.
You MUST return the output EXACTLY as valid JSON with NO markdown formatting, NO \`\`\` blocks, and NO extra text:
{
  "score": <integer 0-100 representing portfolio health>,
  "healthSummary": "<one short paragraph summarizing overall health and risks>",
  "actions": [
    {
      "action": "<short command, e.g., 'Scale down TCS', 'Accumulate HDFCBANK'>",
      "reason": "<one sentence reasoning>",
      "type": "buy" or "sell" or "hold"
    }
  ]
}`;

    const result = await generateWithFallback(prompt);
    let text = (result.text || '').trim();
    if(text.startsWith('\`\`\`json')){ text = text.replace(/^\`\`\`json/,'').replace(/\`\`\`$/,'').trim(); }
    return JSON.parse(text);
  } catch (error) {
    console.error('Portfolio advice AI failed:', error);
    return {
      score: 50,
      healthSummary: "Unable to analyze portfolio health currently due to systems connection.",
      actions: []
    };
  }
};

exports.generatePortfolioInsight = async (snapshot) => {
  try {
    const prompt = `You are an institutional portfolio analyst.
Given this portfolio snapshot, provide exactly one concise paragraph (4-6 sentences).
Focus on risk-adjusted quality, diversification, concentration, and 2 practical rebalancing ideas.
Avoid markdown, bullet points, and hype.
Include a disclaimer sentence that this is not financial advice.

Portfolio Snapshot:
${JSON.stringify(snapshot)}`;

    const result = await generateWithFallback(prompt);

    return (result.text || '').trim();
  } catch (error) {
    return '';
  }
};
