import { useState, useEffect, useCallback } from 'react';
import { Search, Bell, X, TrendingUp, TrendingDown, Plus, Eye } from 'lucide-react';
import api from '../api/client';
import { toast, Toaster } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const NIFTY50_SUGGESTIONS = [
  'RELIANCE','TCS','HDFCBANK','INFY','ICICIBANK','HINDUNILVR','ITC','SBIN',
  'BHARTIARTL','KOTAKBANK','BAJFINANCE','WIPRO','AXISBANK','LT','ASIANPAINT',
  'MARUTI','SUNPHARMA','TITAN','ULTRACEMCO','DMART'
];

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState([]);
  const [quotes, setQuotes] = useState({});
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [alertPrice, setAlertPrice] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    try {
      const { data } = await api.get('/watchlist');
      setWatchlist(data.stocks || []);
      setLoading(false);
    } catch { setLoading(false); }
  }, []);

  useEffect(() => { fetchWatchlist(); }, [fetchWatchlist]);

  // Fetch live quotes for all watchlist items
  const refreshQuotes = useCallback(async () => {
    if (watchlist.length === 0) return;
    setRefreshing(true);
    const results = await Promise.allSettled(
      watchlist.map(s => api.get(`/stocks/${s.symbol}/quote`))
    );
    const newQuotes = {};
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') newQuotes[watchlist[i].symbol] = r.value.data;
    });
    setQuotes(newQuotes);
    setRefreshing(false);
  }, [watchlist]);

  useEffect(() => {
    refreshQuotes();
    const interval = setInterval(refreshQuotes, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [refreshQuotes]);

  // Search autocomplete
  useEffect(() => {
    if (!searchInput) { setSearchResults([]); setShowDropdown(false); return; }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/stocks/search', { params: { q: searchInput } });
        setSearchResults(data || []);
        setShowDropdown(true);
      } catch { setSearchResults(NIFTY50_SUGGESTIONS.filter(s => s.includes(searchInput.toUpperCase())).map(s => ({ symbol: s, name: s }))); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleAdd = async (sym) => {
    if (!sym) return;
    try {
      await api.post('/watchlist/add', { symbol: sym.toUpperCase() });
      toast.success(`Added ${sym.toUpperCase()} to watchlist`);
      setSearchInput(''); setShowDropdown(false); setSearchResults([]);
      await fetchWatchlist();
    } catch { toast.error('Failed to add symbol'); }
  };

  const handleRemove = async (symbol) => {
    try {
      await api.delete(`/watchlist/remove/${symbol}`);
      toast.success(`Removed ${symbol}`);
      fetchWatchlist();
    } catch { toast.error('Failed to remove symbol'); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" style={{ color: 'var(--text-primary)' }}>
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Watchlist</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Track your favourite NSE stocks live</p>
        </div>
        <div className="flex items-center gap-2">
          {refreshing && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Refreshing…</span>}
          <span className="live-dot" />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Live</span>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onFocus={() => searchResults.length && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="Search and add stocks (e.g. RELIANCE, TCS)…"
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-1 rounded-lg border shadow-xl z-50 overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            {searchResults.map(r => (
              <button
                key={r.symbol}
                onMouseDown={() => handleAdd(r.symbol)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center justify-between transition"
              >
                <div>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{r.symbol}</span>
                  <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>{r.name}</span>
                </div>
                <Plus size={15} style={{ color: 'var(--primary)' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Watchlist table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-pulse text-sm" style={{ color: 'var(--text-muted)' }}>Loading watchlist…</div>
          </div>
        ) : watchlist.length === 0 ? (
          <div className="py-20 text-center">
            <Eye size={40} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Your watchlist is empty</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Search above to add Nifty 50 stocks</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead style={{ background: 'var(--bg-surface)' }}>
              <tr>
                {['Symbol', 'LTP', 'Change', '% Change', '52W H/L', 'Volume', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {watchlist.map(stock => {
                const q = quotes[stock.symbol];
                const isPos = (q?.changePercent ?? 0) >= 0;
                return (
                  <tr key={stock.symbol} className="hover:bg-slate-50 transition border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-5 py-4">
                      <Link to={`/trade/${stock.symbol}`} className="font-bold text-sm hover:underline" style={{ color: 'var(--text-primary)' }}>
                        {stock.symbol}
                      </Link>
                      {q?.name && <p className="text-xs mt-0.5 truncate max-w-[120px]" style={{ color: 'var(--text-muted)' }}>{q.name}</p>}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {q ? `₹${(q.currentPrice || 0).toFixed(2)}` : '—'}
                    </td>
                    <td className={`px-5 py-4 text-sm font-semibold ${isPos ? 'text-green-600' : 'text-red-500'}`}>
                      {q ? `${isPos ? '+' : ''}${(q.change || 0).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {q ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${isPos ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {isPos ? '+' : ''}{(q.changePercent || 0).toFixed(2)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      {q ? `₹${(q.fiftyTwoWeekHigh || 0).toFixed(0)} / ₹${(q.fiftyTwoWeekLow || 0).toFixed(0)}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      {q ? (q.volume || 0).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/trade/${stock.symbol}`}
                          className="px-3 py-1 rounded text-xs font-bold transition"
                          style={{ background: '#DCFCE7', color: '#15803D' }}
                        >
                          Trade
                        </Link>
                        <button
                          onClick={() => { setSelectedStock(stock); setAlertPrice(q?.currentPrice?.toFixed(2) || ''); setShowAlertModal(true); }}
                          className="p-1.5 rounded hover:bg-slate-100 transition"
                          title="Set Alert"
                        >
                          <Bell size={14} style={{ color: 'var(--text-muted)' }} />
                        </button>
                        <button
                          onClick={() => handleRemove(stock.symbol)}
                          className="p-1.5 rounded hover:bg-red-50 hover:text-red-500 transition"
                          title="Remove"
                        >
                          <X size={14} style={{ color: 'var(--text-muted)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Add - Nifty 50 Suggestions */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Quick Add — Nifty 50</p>
        <div className="flex flex-wrap gap-2">
          {NIFTY50_SUGGESTIONS.map(sym => (
            <button
              key={sym}
              onClick={() => handleAdd(sym)}
              disabled={watchlist.some(w => w.symbol === sym)}
              className="px-3 py-1.5 rounded-md border text-xs font-semibold transition disabled:opacity-40"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Alert modal */}
      {showAlertModal && selectedStock && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl border shadow-2xl w-full max-w-sm p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-lg font-black mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Bell size={18} style={{ color: 'var(--primary)' }} /> Set Price Alert
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>{selectedStock.symbol}</p>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-muted)' }}>Target Price (₹)</label>
            <input
              type="number"
              value={alertPrice}
              onChange={e => setAlertPrice(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border text-lg font-bold mb-4"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={() => { setShowAlertModal(false); toast.success(`Alert set for ${selectedStock.symbol} @ ₹${alertPrice}`); }}
              className="w-full py-2.5 rounded-lg text-sm font-black text-white mb-2"
              style={{ background: 'var(--primary)' }}
            >
              Save Alert
            </button>
            <button
              onClick={() => setShowAlertModal(false)}
              className="w-full py-2 text-sm font-semibold"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
