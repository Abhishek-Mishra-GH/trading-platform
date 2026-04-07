import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import {
  TrendingUp, TrendingDown, Search, ShieldAlert, Clock,
  BarChart2, LineChart as LineChartIcon, ExternalLink, RefreshCw, ArrowLeft
} from 'lucide-react';
import api from '../api/client';
import { toast, Toaster } from 'react-hot-toast';

const PERIODS = [
  { label: '1D', period: '5d', interval: '5m' },
  { label: '1W', period: '5d', interval: '15m' },
  { label: '1M', period: '1mo', interval: '1d' },
  { label: '3M', period: '3mo', interval: '1d' },
  { label: '6M', period: '6mo', interval: '1d' },
  { label: '1Y', period: '1y', interval: '1d' },
];

function PriceChart({ symbol, chartType, activePeriod }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const volSeriesRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!chartRef.current || !symbol) return;
    try {
      const { data } = await api.get(`/stocks/${symbol}/history`, {
        params: { period: activePeriod.period, interval: activePeriod.interval }
      });
      if (!data || data.length === 0) return;

      const sorted = [...data].sort((a, b) => a.time - b.time);

      if (chartType === 'candlestick' && seriesRef.current?.type === 'Candlestick') {
        seriesRef.current.setData(sorted);
      } else if (chartType === 'line' && seriesRef.current?.type !== 'Candlestick') {
        seriesRef.current.setData(sorted.map(d => ({ time: d.time, value: d.close })));
      }

      if (volSeriesRef.current) {
        volSeriesRef.current.setData(sorted.map(d => ({
          time: d.time,
          value: d.volume,
          color: d.close >= d.open ? '#16A34A33' : '#DC262633',
        })));
      }
      chartRef.current.timeScale().fitContent();
    } catch (e) {
      console.error('Chart load error', e);
    }
  }, [symbol, chartType, activePeriod]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: { background: { color: '#ffffff' }, textColor: '#64748B' },
      grid: { vertLines: { color: '#F1F5F9' }, horzLines: { color: '#F1F5F9' } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#E2E8F0', scaleMargins: { top: 0.1, bottom: 0.25 } },
      timeScale: { borderColor: '#E2E8F0', timeVisible: true },
      handleScroll: true, handleScale: true,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });
    chartRef.current = chart;

    // Volume series
    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volSeriesRef.current = volSeries;

    // Price series (candlestick or line)
    if (chartType === 'candlestick') {
      const cs = chart.addSeries(CandlestickSeries, {
        upColor: '#16A34A', downColor: '#DC2626',
        borderUpColor: '#16A34A', borderDownColor: '#DC2626',
        wickUpColor: '#16A34A', wickDownColor: '#DC2626',
      });
      cs.type = 'Candlestick';
      seriesRef.current = cs;
    } else {
      const ls = chart.addSeries(LineSeries, {
        color: '#1DB954', lineWidth: 2, crosshairMarkerVisible: true,
      });
      seriesRef.current = ls;
    }

    const ro = new ResizeObserver(entries => {
      if (entries[0]) chart.applyOptions({ width: entries[0].contentRect.width });
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType]);

  useEffect(() => { loadData(); }, [loadData]);

  return <div ref={containerRef} className="w-full h-full" />;
}

export default function TradePage() {
  const { symbol: paramSymbol } = useParams();
  const navigate = useNavigate();
  const [symbol, setSymbol] = useState(paramSymbol || 'RELIANCE');
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [stockData, setStockData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [news, setNews] = useState([]);
  const [loadingStock, setLoadingStock] = useState(true);

  const [chartType, setChartType] = useState('candlestick');
  const [activePeriod, setActivePeriod] = useState(PERIODS[2]);

  const [orderType, setOrderType] = useState('buy');
  const [executionType, setExecutionType] = useState('market');
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  // Fetch stock quote + profile + news
  const fetchStock = useCallback(async (sym) => {
    setLoadingStock(true);
    try {
      const [quoteRes, newsRes] = await Promise.allSettled([
        api.get(`/stocks/${sym}/quote`),
        api.get(`/stocks/${sym}/news`),
      ]);
      if (quoteRes.status === 'fulfilled') setStockData(quoteRes.value.data);
      if (newsRes.status === 'fulfilled') setNews(newsRes.value.data || []);
    } catch (e) { console.error(e); }
    setLoadingStock(false);
  }, []);

  useEffect(() => { fetchStock(symbol); }, [symbol, fetchStock]);

  // Autocomplete search
  useEffect(() => {
    if (!searchInput || searchInput.length < 1) { setSearchResults([]); setShowDropdown(false); return; }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/stocks/search', { params: { q: searchInput } });
        setSearchResults(data || []);
        setShowDropdown(true);
      } catch { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const selectStock = (sym) => {
    setSymbol(sym); setSearchInput(''); setShowDropdown(false); setSearchResults([]);
  };

  const handlePlaceOrder = async () => {
    if (!quantity || Number(quantity) < 1) return toast.error('Enter a valid quantity');
    setPlacingOrder(true);
    try {
      await api.post('/orders/place', {
        symbol,
        type: orderType,
        orderType: executionType,
        quantity: Number(quantity),
        ...(executionType !== 'market' && { price: Number(limitPrice || stockData?.currentPrice) })
      });
      toast.success(`${orderType.toUpperCase()} order placed for ${quantity} × ${symbol}!`);
      setQuantity('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    }
    setPlacingOrder(false);
  };

  const isPositive = (stockData?.changePercent ?? 0) >= 0;
  const cp = stockData?.currentPrice || 0;
  const qty = Number(quantity) || 0;
  const price = executionType === 'market' ? cp : (Number(limitPrice) || cp);
  const value = price * qty;
  const brokerage = qty > 0 ? Math.min(20, value * 0.0003) : 0;
  const stt = orderType === 'sell' ? value * 0.001 : 0;
  const total = orderType === 'buy' ? value + brokerage : value - brokerage - stt;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Toaster position="top-right" />

      {/* ─── Top Bar ─── */}
      <div
        className="flex items-center gap-4 px-4 h-14 border-b flex-shrink-0"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate('/trade')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition hover:bg-slate-50 flex-shrink-0"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={13} /> Markets
        </button>

        {/* Search */}
        <div className="relative w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onFocus={() => searchResults.length && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="Search NSE stocks…"
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-md border"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          {showDropdown && searchResults.length > 0 && (
            <div
              className="absolute top-full left-0 w-full mt-1 rounded-lg border shadow-lg z-50 overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              {searchResults.map(r => (
                <button
                  key={r.symbol}
                  onMouseDown={() => selectStock(r.symbol)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{r.symbol}</span>
                    <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>{r.name}</span>
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                    {r.exchange || 'NSE'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Symbol info */}
        {stockData && (
          <div className="flex items-center gap-6 ml-2">
            <div>
              <span className="text-base font-black" style={{ color: 'var(--text-primary)' }}>{symbol}</span>
              <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>NSE</span>
            </div>
            <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              ₹{cp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className={`text-sm font-semibold flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isPositive ? '+' : ''}{(stockData.change || 0).toFixed(2)} ({(stockData.changePercent || 0).toFixed(2)}%)
            </div>
            <button onClick={() => fetchStock(symbol)} className="p-1.5 rounded-md hover:bg-slate-100 transition">
              <RefreshCw size={14} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
        )}
      </div>

      {/* ─── Main area ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chart + Info column */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chart controls */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-1">
              {PERIODS.map(p => (
                <button
                  key={p.label}
                  onClick={() => setActivePeriod(p)}
                  className="px-3 py-1 rounded text-xs font-semibold transition"
                  style={{
                    background: activePeriod.label === p.label ? 'var(--primary)' : 'transparent',
                    color: activePeriod.label === p.label ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setChartType('candlestick')}
                className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition"
                style={{
                  background: chartType === 'candlestick' ? 'var(--bg-surface)' : 'transparent',
                  color: chartType === 'candlestick' ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <BarChart2 size={13} /> Candles
              </button>
              <button
                onClick={() => setChartType('line')}
                className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition"
                style={{
                  background: chartType === 'line' ? 'var(--bg-surface)' : 'transparent',
                  color: chartType === 'line' ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <LineChartIcon size={13} /> Line
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 relative" style={{ background: '#fff' }}>
            <PriceChart symbol={symbol} chartType={chartType} activePeriod={activePeriod} />
          </div>

          {/* Stock stats bar */}
          {stockData && (
            <div
              className="flex items-center gap-6 px-6 py-2 border-t flex-shrink-0 text-xs"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              {[
                { label: 'Open', value: `₹${(stockData.open || 0).toFixed(2)}` },
                { label: 'High', value: `₹${(stockData.high || 0).toFixed(2)}` },
                { label: 'Low', value: `₹${(stockData.low || 0).toFixed(2)}` },
                { label: 'Prev Close', value: `₹${(stockData.previousClose || 0).toFixed(2)}` },
                { label: 'Volume', value: (stockData.volume || 0).toLocaleString('en-IN') },
                { label: '52W High', value: `₹${(stockData.fiftyTwoWeekHigh || 0).toFixed(2)}` },
                { label: '52W Low', value: `₹${(stockData.fiftyTwoWeekLow || 0).toFixed(2)}` },
              ].map(stat => (
                <div key={stat.label}>
                  <span style={{ color: 'var(--text-muted)' }}>{stat.label}: </span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{stat.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* News */}
          <div
            className="border-t overflow-y-auto flex-shrink-0"
            style={{ maxHeight: '200px', borderColor: 'var(--border)', background: 'var(--bg-card)' }}
          >
            <div className="px-5 py-3 border-b font-semibold text-xs uppercase tracking-widest" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              Latest News
            </div>
            {news.length === 0 ? (
              <p className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>No news found.</p>
            ) : news.map(n => (
              <a
                key={n.id}
                href={n.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-start justify-between gap-4 px-5 py-3 border-b hover:bg-slate-50 transition"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{n.headline}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{n.source} · {n.time}</p>
                </div>
                <ExternalLink size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
              </a>
            ))}
          </div>
        </div>

        {/* ─── Order Panel ─── */}
        <div
          className="w-72 flex-shrink-0 flex flex-col border-l overflow-y-auto"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          {/* Buy/Sell toggle */}
          <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => setOrderType('buy')}
              className="flex-1 py-3 text-sm font-bold transition"
              style={{
                background: orderType === 'buy' ? '#DCFCE7' : 'transparent',
                color: orderType === 'buy' ? '#15803D' : 'var(--text-muted)',
                borderBottom: orderType === 'buy' ? '2px solid #16A34A' : '2px solid transparent',
              }}
            >
              BUY
            </button>
            <button
              onClick={() => setOrderType('sell')}
              className="flex-1 py-3 text-sm font-bold transition"
              style={{
                background: orderType === 'sell' ? '#FEE2E2' : 'transparent',
                color: orderType === 'sell' ? '#B91C1C' : 'var(--text-muted)',
                borderBottom: orderType === 'sell' ? '2px solid #DC2626' : '2px solid transparent',
              }}
            >
              SELL
            </button>
          </div>

          <div className="p-4 flex flex-col gap-4">
            {/* Order type buttons */}
            <div className="flex gap-2">
              {['market', 'limit', 'stopLoss'].map(t => (
                <button
                  key={t}
                  onClick={() => setExecutionType(t)}
                  className="flex-1 py-1.5 rounded text-xs font-semibold border transition"
                  style={{
                    background: executionType === t ? 'var(--bg-surface)' : 'transparent',
                    borderColor: executionType === t ? 'var(--border-strong)' : 'var(--border)',
                    color: executionType === t ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {t === 'stopLoss' ? 'SL' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Qty input */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Quantity (Shares)</label>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                min="1"
                placeholder="0"
                className="w-full px-3 py-2.5 rounded-lg border text-sm font-semibold"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Price input for limit/SL */}
            {executionType !== 'market' && (
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                  {executionType === 'limit' ? 'Limit Price' : 'Trigger Price'} (₹)
                </label>
                <input
                  type="number"
                  value={limitPrice || cp}
                  onChange={e => setLimitPrice(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm font-semibold"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            )}

            {/* Margin summary */}
            <div className="rounded-lg p-3 space-y-2.5 text-xs" style={{ background: 'var(--bg-surface)' }}>
              {[
                { label: 'Market Price', value: `₹${cp.toFixed(2)}` },
                { label: 'Est. Value', value: `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                { label: 'Brokerage', value: `₹${brokerage.toFixed(2)}` },
                { label: 'STT', value: `₹${stt.toFixed(2)}` },
              ].map(({ label, value: v }) => (
                <div key={label} className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="font-semibold font-mono" style={{ color: 'var(--text-secondary)' }}>{v}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--border-strong)' }}>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Total</span>
                <span className="font-black font-mono" style={{ color: orderType === 'buy' ? 'var(--buy)' : 'var(--sell)' }}>
                  ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Place Order button */}
            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder || !quantity}
              className="w-full py-3 rounded-lg text-sm font-black tracking-wide transition disabled:opacity-50"
              style={{
                background: orderType === 'buy' ? '#16A34A' : '#DC2626',
                color: '#fff',
              }}
            >
              {placingOrder ? 'Placing…' : `${orderType === 'buy' ? 'Buy' : 'Sell'} ${symbol}`}
            </button>

            {/* AI insight box */}
            <div className="rounded-lg p-3 border" style={{ borderColor: '#E0F2FE', background: '#F0F9FF' }}>
              <p className="text-xs font-bold mb-1 flex items-center gap-1" style={{ color: '#0284C7' }}>
                <ShieldAlert size={12} /> AI Disclaimer
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#0369A1' }}>
                Orders execute at live NSE market prices. Check your wallet balance before trading.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
