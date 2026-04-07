const YahooFinance = require('yahoo-finance2').default;

// Instantiate with v3 constructor (suppress survey and deprecation notices)
const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
});

// ─── In-memory cache ────────────────────────────────────────────────────────
const cache = new Map();

const fetchWithCache = async (key, fn, ttl = 30000) => {
  if (cache.has(key)) {
    const cached = cache.get(key);
    if (Date.now() - cached.timestamp < ttl) return cached.data;
  }
  const data = await fn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

// ─── NSE symbol helper ───────────────────────────────────────────────────────
// Yahoo Finance uses SYMBOL.NS for NSE and SYMBOL.BO for BSE
const toYahooSymbol = (symbol) => {
  if (symbol.includes('.') || symbol.startsWith('^')) return symbol;
  return `${symbol}.NS`;
};

// ─── Nifty 50 stocks list ───────────────────────────────────────────────────
const NIFTY50_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'Technology' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking' },
  { symbol: 'INFY', name: 'Infosys', sector: 'Technology' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG' },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Finance' },
  { symbol: 'WIPRO', name: 'Wipro', sector: 'Technology' },
  { symbol: 'AXISBANK', name: 'Axis Bank', sector: 'Banking' },
  { symbol: 'LT', name: 'Larsen & Toubro', sector: 'Infrastructure' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints', sector: 'Consumer' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', sector: 'Auto' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharma' },
  { symbol: 'TITAN', name: 'Titan Company', sector: 'Consumer' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Materials' },
  { symbol: 'DMART', name: 'Avenue Supermarts', sector: 'Retail' },
  { symbol: 'ONGC', name: 'ONGC', sector: 'Energy' },
  { symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Power' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp', sector: 'Power' },
  { symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'Technology' },
  { symbol: 'TECHM', name: 'Tech Mahindra', sector: 'Technology' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', sector: 'Conglomerate' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports', sector: 'Infrastructure' },
  { symbol: 'TATASTEEL', name: 'Tata Steel', sector: 'Materials' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Auto' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel', sector: 'Materials' },
  { symbol: 'HDFC', name: 'HDFC Ltd', sector: 'Finance' },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv', sector: 'Finance' },
  { symbol: 'GRASIM', name: 'Grasim Industries', sector: 'Materials' },
  { symbol: 'NESTLEIND', name: 'Nestle India', sector: 'FMCG' },
  { symbol: 'COALINDIA', name: 'Coal India', sector: 'Energy' },
  { symbol: 'DIVISLAB', name: "Divi's Laboratories", sector: 'Pharma' },
  { symbol: 'CIPLA', name: 'Cipla', sector: 'Pharma' },
  { symbol: 'EICHERMOT', name: 'Eicher Motors', sector: 'Auto' },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', sector: 'Auto' },
  { symbol: 'BRITANNIA', name: 'Britannia Industries', sector: 'FMCG' },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank', sector: 'Banking' },
  { symbol: 'DRREDDY', name: "Dr. Reddy's Laboratories", sector: 'Pharma' },
  { symbol: 'BPCL', name: 'BPCL', sector: 'Energy' },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products', sector: 'FMCG' },
  { symbol: 'UPL', name: 'UPL Ltd', sector: 'Chemicals' },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', sector: 'Healthcare' },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto', sector: 'Auto' },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance', sector: 'Insurance' },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance', sector: 'Insurance' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra', sector: 'Auto' },
];

const INDICES = [
  { symbol: '^NSEI', name: 'NIFTY 50' },
  { symbol: '^BSESN', name: 'SENSEX' },
  { symbol: '^NSEBANK', name: 'BANK NIFTY' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getPeriodStart = (period) => {
  const now = new Date();
  const map = {
    '1d': 1, '5d': 5, '1mo': 30, '3mo': 90,
    '6mo': 180, '1y': 365, '5y': 1825,
  };
  const days = map[period] || 30;
  return new Date(now - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
};

// ─── Exports ─────────────────────────────────────────────────────────────────

exports.getNifty50List = () => NIFTY50_STOCKS;

exports.getQuote = async (symbol) => {
  const yahooSym = toYahooSymbol(symbol);
  return fetchWithCache(`quote_${yahooSym}`, async () => {
    const data = await yahooFinance.quote(yahooSym);
    return {
      symbol,
      name: data.longName || data.shortName || symbol,
      currentPrice: data.regularMarketPrice,
      change: parseFloat((data.regularMarketChange || 0).toFixed(2)),
      changePercent: parseFloat((data.regularMarketChangePercent || 0).toFixed(2)),
      high: data.regularMarketDayHigh,
      low: data.regularMarketDayLow,
      open: data.regularMarketOpen,
      previousClose: data.regularMarketPreviousClose,
      volume: data.regularMarketVolume,
      marketCap: data.marketCap,
      fiftyTwoWeekHigh: data.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: data.fiftyTwoWeekLow,
      exchange: data.exchange,
    };
  }, 15000);
};

exports.getCompanyProfile = async (symbol) => {
  const yahooSym = toYahooSymbol(symbol);
  return fetchWithCache(`profile_${yahooSym}`, async () => {
    try {
      const data = await yahooFinance.quoteSummary(yahooSym, {
        modules: ['summaryProfile', 'summaryDetail', 'defaultKeyStatistics'],
      });
      const profile = data.summaryProfile || {};
      const stats = data.defaultKeyStatistics || {};
      const detail = data.summaryDetail || {};
      return {
        symbol,
        sector: profile.sector || 'N/A',
        industry: profile.industry || 'N/A',
        description: profile.longBusinessSummary || '',
        peRatio: detail.trailingPE || null,
        eps: stats.trailingEps || null,
        bookValue: stats.bookValue || null,
        dividendYield: detail.dividendYield ? (detail.dividendYield * 100).toFixed(2) : null,
        website: profile.website || null,
        employees: profile.fullTimeEmployees || null,
      };
    } catch {
      return { symbol, sector: 'N/A', industry: 'N/A', description: '' };
    }
  }, 300000);
};

exports.searchStocks = async (query) => {
  if (!query || query.length < 1) return [];
  const q = query.toUpperCase();

  // Search local Nifty 50 list first  
  const localResults = NIFTY50_STOCKS
    .filter(s => s.symbol.includes(q) || s.name.toUpperCase().includes(q))
    .slice(0, 8)
    .map(s => ({ symbol: s.symbol, name: s.name, sector: s.sector, exchange: 'NSE' }));

  if (localResults.length >= 3) return localResults;

  // Fall back to Yahoo search
  try {
    const data = await yahooFinance.search(query, { newsCount: 0, quotesCount: 10 });
    const yahooResults = (data.quotes || [])
      .filter(r => r.exchange && (r.exchange === 'NSI' || r.exchange === 'BSE'))
      .slice(0, 6)
      .map(r => ({
        symbol: (r.symbol || '').replace('.NS', '').replace('.BO', ''),
        name: r.longname || r.shortname || r.symbol,
        exchange: r.exchange === 'NSI' ? 'NSE' : 'BSE',
      }));
    return [...localResults, ...yahooResults].slice(0, 10);
  } catch {
    return localResults;
  }
};

exports.getHistoricalData = async (symbol, period = '1mo', interval = '1d') => {
  const yahooSym = toYahooSymbol(symbol);
  return fetchWithCache(`hist_${yahooSym}_${period}_${interval}`, async () => {
    const period1 = getPeriodStart(period);
    const data = await yahooFinance.chart(yahooSym, { period1, interval });
    const quotes = data.quotes || [];
    return quotes
      .filter(q => q.open != null && q.high != null && q.low != null && q.close != null)
      .map(q => ({
        time: Math.floor(new Date(q.date).getTime() / 1000),
        open: parseFloat((q.open).toFixed(2)),
        high: parseFloat((q.high).toFixed(2)),
        low: parseFloat((q.low).toFixed(2)),
        close: parseFloat((q.close).toFixed(2)),
        volume: q.volume || 0,
      }));
  }, 60000);
};

exports.getMarketNews = async (symbol) => {
  return fetchWithCache(`news_${symbol}`, async () => {
    const data = await yahooFinance.search(symbol, { newsCount: 8, quotesCount: 0 });
    return (data.news || []).map(n => {
      let timeStr = '';
      if (n.providerPublishTime) {
        // v3 returns a Date object directly
        const pubDate = n.providerPublishTime instanceof Date
          ? n.providerPublishTime
          : new Date(n.providerPublishTime);
        const diffMs = Date.now() - pubDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1) timeStr = 'Just now';
        else if (diffMins < 60) timeStr = `${diffMins}m ago`;
        else if (diffHrs < 24) timeStr = `${diffHrs}h ago`;
        else if (diffDays < 7) timeStr = `${diffDays}d ago`;
        else timeStr = pubDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      }
      return {
        id: n.uuid,
        headline: n.title,
        source: n.publisher,
        url: n.link,
        time: timeStr,
      };
    });
  }, 120000);
};

exports.getIndices = async () => {
  return fetchWithCache('indices', async () => {
    const results = await Promise.allSettled(
      INDICES.map(idx => yahooFinance.quote(idx.symbol))
    );
    return results.map((r, i) => {
      if (r.status === 'fulfilled' && r.value) {
        const d = r.value;
        return {
          symbol: INDICES[i].name,
          yahooSymbol: INDICES[i].symbol,
          price: d.regularMarketPrice,
          change: parseFloat((d.regularMarketChange || 0).toFixed(2)),
          changePercent: parseFloat((d.regularMarketChangePercent || 0).toFixed(2)),
          high: d.regularMarketDayHigh,
          low: d.regularMarketDayLow,
        };
      }
      return { symbol: INDICES[i].name, price: 0, change: 0, changePercent: 0 };
    });
  }, 30000);
};

const getTopMovers = async (sort = 'desc') => {
  const results = await Promise.allSettled(
    NIFTY50_STOCKS.slice(0, 25).map(s => yahooFinance.quote(toYahooSymbol(s.symbol)))
  );
  return results
    .map((r, i) => {
      if (r.status === 'fulfilled' && r.value) {
        const d = r.value;
        return {
          symbol: NIFTY50_STOCKS[i].symbol,
          name: NIFTY50_STOCKS[i].name,
          price: d.regularMarketPrice,
          change: parseFloat((d.regularMarketChange || 0).toFixed(2)),
          changePercent: parseFloat((d.regularMarketChangePercent || 0).toFixed(2)),
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => sort === 'desc'
      ? b.changePercent - a.changePercent
      : a.changePercent - b.changePercent
    )
    .slice(0, 5);
};

exports.getTopGainers = () => fetchWithCache('gainers', () => getTopMovers('desc'), 60000);
exports.getTopLosers = () => fetchWithCache('losers', () => getTopMovers('asc'), 60000);

exports.getMarketOverview = async () => {
  const [indices, gainers, losers] = await Promise.all([
    exports.getIndices(),
    exports.getTopGainers(),
    exports.getTopLosers(),
  ]);
  return { indices, gainers, losers };
};
