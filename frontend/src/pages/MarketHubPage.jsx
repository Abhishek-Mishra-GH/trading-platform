import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Search, Zap, Star, BarChart2,
  ArrowUpRight, ArrowDownRight, Activity, Bot, ChevronRight, RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../api/client';
import { usePortfolioStore } from '../store/portfolioStore';

// ─── Sub-components ──────────────────────────────────────────────────────────

function StockCard({ stock, onClick }) {
  const isPos = (stock.changePercent ?? 0) >= 0;
  return (
    <button
      onClick={() => onClick(stock.symbol)}
      className="w-full text-left rounded-xl border p-4 transition hover:shadow-md hover:border-green-200 group"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{stock.symbol}</p>
          <p className="text-xs mt-0.5 truncate max-w-[110px]" style={{ color: 'var(--text-muted)' }}>{stock.name}</p>
        </div>
        <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${isPos ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {isPos ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {isPos ? '+' : ''}{(stock.changePercent || 0).toFixed(2)}%
        </span>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-lg font-black font-mono" style={{ color: 'var(--text-primary)' }}>
          ₹{(stock.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
        <p className={`text-xs font-semibold ${isPos ? 'text-green-600' : 'text-red-500'}`}>
          {isPos ? '+' : ''}₹{Math.abs(stock.change || 0).toFixed(2)}
        </p>
      </div>
      <div
        className="mt-3 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
        style={{ background: isPos ? '#16A34A' : '#DC2626' }}
      />
    </button>
  );
}

function SectionHeader({ icon: Icon, title, color, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon size={17} style={{ color: color || 'var(--text-muted)' }} />
        <h2 className="text-sm font-black uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      {action && (
        <button onClick={onAction} className="text-xs font-semibold flex items-center gap-1 hover:underline" style={{ color: 'var(--primary)' }}>
          {action} <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

function IndexPill({ index }) {
  const isPos = (index.changePercent ?? 0) >= 0;
  return (
    <div
      className="flex items-center gap-4 px-5 py-3 rounded-xl border"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div>
        <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{index.symbol}</p>
        <p className="text-xl font-black font-mono" style={{ color: 'var(--text-primary)' }}>
          {(index.price || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </p>
      </div>
      <div className={`text-right ${isPos ? 'text-green-600' : 'text-red-500'}`}>
        <p className="text-sm font-bold flex items-center gap-1">
          {isPos ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {isPos ? '+' : ''}{(index.change || 0).toFixed(2)}
        </p>
        <p className={`text-xs font-bold mt-0.5 px-2 py-0.5 rounded-full ${isPos ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {isPos ? '+' : ''}{(index.changePercent || 0).toFixed(2)}%
        </p>
      </div>
    </div>
  );
}

// ─── Quick search constants ───────────────────────────────────────────────────
const POPULAR_TAGS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN', 'BHARTIARTL', 'ICICIBANK', 'WIPRO', 'MARUTI', 'TITAN'];

// ─── Main Market Hub Page ─────────────────────────────────────────────────────
export default function MarketHubPage() {
  const navigate = useNavigate();
  const { portfolio, fetchPortfolio } = usePortfolioStore();

  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDrop, setShowDrop] = useState(false);

  const [indices, setIndices] = useState([]);
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [nifty50, setNifty50] = useState([]);
  const [niftyQuotes, setNiftyQuotes] = useState({});
  const [aiInsight, setAiInsight] = useState('');
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [loadingInsight, setLoadingInsight] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all | gainers | losers

  const goToStock = (symbol) => navigate(`/trade/${symbol}`);

  // ─── Fetch market data ───────────────────────────────────────────────────
  const loadMarket = async () => {
    setRefreshing(true);
    try {
      const [overviewRes, listRes] = await Promise.all([
        api.get('/stocks/market/overview'),
        api.get('/stocks/nifty50/list'),
      ]);
      setIndices(overviewRes.data.indices || []);
      setGainers(overviewRes.data.gainers || []);
      setLosers(overviewRes.data.losers || []);
      setNifty50(listRes.data || []);
      setLoadingMarket(false);

      // Fetch live quotes for top 10 Nifty stocks
      const top10 = (listRes.data || []).slice(0, 10);
      const quoteResults = await Promise.allSettled(
        top10.map(s => api.get(`/stocks/${s.symbol}/quote`))
      );
      const qmap = {};
      quoteResults.forEach((r, i) => {
        if (r.status === 'fulfilled') qmap[top10[i].symbol] = r.value.data;
      });
      setNiftyQuotes(qmap);
    } catch (e) {
      console.error(e);
      setLoadingMarket(false);
    }
    setRefreshing(false);
  };

  // ─── Fetch AI insight ─────────────────────────────────────────────────────
  const loadInsight = async () => {
    setLoadingInsight(true);
    try {
      const res = await api.post('/chatbot/message', {
        message: 'Give me a brief 2-3 sentence Indian market analysis for today with Nifty 50 outlook and top sector to watch. Be concise.',
        history: [],
      });
      setAiInsight(res.data.response || '');
    } catch {
      setAiInsight('Market data is loading. AI insights will appear here after connecting to the AI service.');
    }
    setLoadingInsight(false);
  };

  useEffect(() => {
    fetchPortfolio();
    loadMarket();
    loadInsight();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Stock search autocomplete ────────────────────────────────────────────
  useEffect(() => {
    if (!searchInput) { setSearchResults([]); setShowDrop(false); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/stocks/search', { params: { q: searchInput } });
        setSearchResults(data || []);
        setShowDrop(true);
      } catch { setSearchResults([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Holdings with quotes merged
  const holdings = portfolio?.holdings || [];

  // Tab filtered list
  const topMovers = activeTab === 'gainers' ? gainers : activeTab === 'losers' ? losers : [...gainers, ...losers];

  // All Nifty stocks with live quotes merged in
  const enrichedNifty = nifty50.slice(0, 10).map(s => ({
    ...s,
    price: niftyQuotes[s.symbol]?.currentPrice || 0,
    change: niftyQuotes[s.symbol]?.change || 0,
    changePercent: niftyQuotes[s.symbol]?.changePercent || 0,
  }));

  const displayList = activeTab === 'gainers'
    ? gainers
    : activeTab === 'losers'
    ? losers
    : enrichedNifty;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ─── Top Bar ─── */}
      <div
        className="flex items-center gap-4 px-6 h-14 border-b flex-shrink-0"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="relative flex-1 max-w-lg">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onFocus={() => searchResults.length && setShowDrop(true)}
            onBlur={() => setTimeout(() => setShowDrop(false), 200)}
            placeholder="Search any NSE stock to trade…"
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          {showDrop && searchResults.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-1 rounded-lg border shadow-xl z-50 overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              {searchResults.map(r => (
                <button
                  key={r.symbol}
                  onMouseDown={() => goToStock(r.symbol)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center justify-between transition"
                >
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{r.symbol}</span>
                    <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>{r.name}</span>
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>NSE</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Indices pills in top bar */}
        <div className="hidden xl:flex items-center gap-3">
          {indices.map(idx => {
            const isPos = idx.changePercent >= 0;
            return (
              <div key={idx.symbol} className="flex items-center gap-2 text-xs">
                <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>{idx.symbol}</span>
                <span className="font-black font-mono" style={{ color: 'var(--text-primary)' }}>
                  {(idx.price || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className={`font-bold ${isPos ? 'text-green-600' : 'text-red-500'}`}>
                  {isPos ? '+' : ''}{(idx.changePercent || 0).toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => loadMarket()}
          disabled={refreshing}
          className="ml-auto p-2 rounded-lg hover:bg-slate-100 transition"
          title="Refresh market data"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Indices row */}
        <div className="grid grid-cols-3 gap-4">
          {loadingMarket
            ? [1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--bg-surface)' }} />
              ))
            : indices.map(idx => <IndexPill key={idx.symbol} index={idx} />)
          }
        </div>

        {/* Popular quick tags */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Quick Access</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_TAGS.map(sym => (
              <button
                key={sym}
                onClick={() => goToStock(sym)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* My Holdings row */}
        {holdings.length > 0 && (
          <div>
            <SectionHeader icon={Star} title="My Holdings" color="#F59E0B" action="View All" onAction={() => navigate('/portfolio')} />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {holdings.slice(0, 5).map(h => (
                <StockCard
                  key={h.symbol}
                  stock={{
                    symbol: h.symbol,
                    name: h.symbol,
                    price: h.currentPrice || 0,
                    change: (h.currentPrice || 0) - (h.avgBuyPrice || 0),
                    changePercent: h.profitLossPercent || 0,
                  }}
                  onClick={goToStock}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main stock grid with tabs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BarChart2 size={17} style={{ color: 'var(--text-muted)' }} />
                <h2 className="text-sm font-black uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Markets</h2>
              </div>
              <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--bg-surface)' }}>
                {[
                  { key: 'all', label: 'Nifty 50' },
                  { key: 'gainers', label: '🟢 Gainers' },
                  { key: 'losers', label: '🔴 Losers' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="px-3 py-1 rounded-md text-xs font-semibold transition"
                    style={{
                      background: activeTab === tab.key ? 'var(--bg-card)' : 'transparent',
                      color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
                      boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            {refreshing && <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Activity size={12} className="animate-spin" /> Refreshing…</span>}
          </div>

          {loadingMarket ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: 'var(--bg-surface)' }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {displayList.map(stock => (
                <StockCard key={stock.symbol} stock={stock} onClick={goToStock} />
              ))}
            </div>
          )}
        </div>

        {/* Bottom row: AI insight + Top performers table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* AI Market Analysis */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary)' }}>
                <Bot size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>AI Market Analysis</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Powered by Gemini</p>
              </div>
              <button
                onClick={loadInsight}
                disabled={loadingInsight}
                className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <RefreshCw size={13} className={loadingInsight ? 'animate-spin' : ''} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            {loadingInsight ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-3 rounded animate-pulse" style={{ background: 'var(--bg-surface)', width: i === 3 ? '60%' : '100%' }} />
                ))}
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...p}) => <h1 className="text-base font-black mt-3 mb-1" style={{ color: 'var(--text-primary)' }} {...p} />,
                    h2: ({node, ...p}) => <h2 className="text-sm font-bold mt-3 mb-1" style={{ color: 'var(--text-primary)' }} {...p} />,
                    h3: ({node, ...p}) => <h3 className="text-sm font-bold mt-2 mb-1" style={{ color: 'var(--text-primary)' }} {...p} />,
                    p:  ({node, ...p}) => <p className="text-sm leading-relaxed mb-2 last:mb-0" style={{ color: 'var(--text-secondary)' }} {...p} />,
                    strong: ({node, ...p}) => <strong className="font-bold" style={{ color: 'var(--text-primary)' }} {...p} />,
                    em: ({node, ...p}) => <em className="italic" style={{ color: 'var(--text-muted)' }} {...p} />,
                    ul: ({node, ...p}) => <ul className="list-disc pl-4 mb-2 space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }} {...p} />,
                    ol: ({node, ...p}) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }} {...p} />,
                    li: ({node, ...p}) => <li className="text-sm" style={{ color: 'var(--text-secondary)' }} {...p} />,
                  }}
                >
                  {aiInsight}
                </ReactMarkdown>
              </div>
            )}
            <button
              onClick={() => navigate('/chatbot')}
              className="mt-4 flex items-center gap-1.5 text-xs font-semibold hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              <Zap size={12} /> Ask more in AI Chat <ChevronRight size={12} />
            </button>
          </div>

          {/* Top movers table */}
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => setActiveTab('gainers')}
                className="flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                style={{
                  color: activeTab === 'gainers' ? '#15803D' : 'var(--text-muted)',
                  background: activeTab === 'gainers' ? '#F0FDF4' : 'transparent',
                  borderBottom: activeTab === 'gainers' ? '2px solid #16A34A' : '2px solid transparent',
                }}
              >
                <TrendingUp size={13} /> Top Gainers
              </button>
              <button
                onClick={() => setActiveTab('losers')}
                className="flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                style={{
                  color: activeTab === 'losers' ? '#B91C1C' : 'var(--text-muted)',
                  background: activeTab === 'losers' ? '#FEF2F2' : 'transparent',
                  borderBottom: activeTab === 'losers' ? '2px solid #DC2626' : '2px solid transparent',
                }}
              >
                <TrendingDown size={13} /> Top Losers
              </button>
            </div>
            <div>
              {(activeTab === 'losers' ? losers : gainers).map((s, i) => {
                const isPos = (s.changePercent ?? 0) >= 0;
                return (
                  <button
                    key={s.symbol}
                    onClick={() => goToStock(s.symbol)}
                    className="w-full flex items-center justify-between px-5 py-3 border-b last:border-b-0 hover:bg-slate-50 transition text-left"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold w-4" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{s.symbol}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>₹{(s.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-black flex items-center gap-1 ${isPos ? 'text-green-600' : 'text-red-500'}`}>
                      {isPos ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {isPos ? '+' : ''}{(s.changePercent || 0).toFixed(2)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
