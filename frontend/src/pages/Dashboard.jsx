import { useEffect, useState } from 'react';
import { usePortfolioStore } from '../store/portfolioStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';

function StatCard({ label, value, sub, positive }) {
  return (
    <div className="rounded-xl p-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</p>
      {sub && (
        <p className={`text-xs font-semibold mt-1 ${positive ? 'text-green-600' : 'text-red-500'}`}>{sub}</p>
      )}
    </div>
  );
}

function IndexCard({ index }) {
  const isPos = (index.changePercent || 0) >= 0;
  return (
    <div className="rounded-xl p-4 border flex items-center justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div>
        <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{index.symbol}</p>
        <p className="text-lg font-black mt-0.5" style={{ color: 'var(--text-primary)' }}>
          {(index.price || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </p>
      </div>
      <div className={`text-right ${isPos ? 'text-green-600' : 'text-red-500'}`}>
        <p className="text-sm font-bold flex items-center gap-1 justify-end">
          {isPos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {isPos ? '+' : ''}{(index.change || 0).toFixed(2)}
        </p>
        <p className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded ${isPos ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {isPos ? '+' : ''}{(index.changePercent || 0).toFixed(2)}%
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { portfolio, fetchPortfolio, loading } = usePortfolioStore();
  const [indices, setIndices] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [loadingMarket, setLoadingMarket] = useState(true);

  useEffect(() => {
    fetchPortfolio();
    api.get('/orders/history').then(res => setRecentOrders(res.data.slice(0, 5))).catch(() => {});
    api.get('/stocks/market/overview')
      .then(res => {
        setIndices(res.data.indices || []);
        setGainers(res.data.gainers || []);
        setLosers(res.data.losers || []);
        setLoadingMarket(false);
      })
      .catch(() => setLoadingMarket(false));
  }, [fetchPortfolio]);

  const currentVal = portfolio?.totalCurrentValue || 0;
  const invested = portfolio?.totalInvested || 0;
  const pnl = currentVal - invested;
  const isPositive = pnl >= 0;
  const pct = invested > 0 ? ((pnl / invested) * 100).toFixed(2) : '0.00';

  // Build simple portfolio value chart from holdings
  const chartData = portfolio?.holdings?.length > 0
    ? portfolio.holdings.map(h => ({ name: h.symbol, value: h.currentValue || 0 }))
    : [{ name: 'Portfolio', value: 0 }];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Live market overview & portfolio summary</p>
      </div>

      {/* Indices row */}
      {loadingMarket ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl p-4 border animate-pulse h-20" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {indices.map(idx => <IndexCard key={idx.symbol} index={idx} />)}
        </div>
      )}

      {/* Portfolio summary + chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio value card */}
        <div className="lg:col-span-2 rounded-xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Portfolio Value</p>
              <h2 className="text-3xl font-black mt-1" style={{ color: 'var(--text-primary)' }}>
                ₹{currentVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-bold ${isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {isPositive ? '+' : ''}{pct}%
            </div>
          </div>
          <div className="flex gap-6 mb-6">
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Invested</p>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>₹{invested.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>P&L</p>
              <p className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? '#16A34A' : '#DC2626'} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={isPositive ? '#16A34A' : '#DC2626'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Value']}
                />
                <Area type="monotone" dataKey="value" stroke={isPositive ? '#16A34A' : '#DC2626'} strokeWidth={2} fill="url(#pv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick stats */}
        <div className="space-y-4">
          <StatCard
            label="Holdings"
            value={portfolio?.holdings?.length || 0}
            sub="Active positions"
          />
          <div className="rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold px-4 pt-4 pb-2 border-b" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
              Top Gainers Today
            </p>
            {gainers.slice(0, 4).map(g => (
              <Link
                key={g.symbol}
                to={`/trade/${g.symbol}`}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition border-b last:border-b-0"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{g.symbol}</span>
                <span className="text-sm font-bold text-green-600">+{(g.changePercent || 0).toFixed(2)}%</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Gainers/Losers + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top losers */}
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
            <TrendingDown size={18} className="text-red-500" />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Top Losers</h3>
          </div>
          {losers.slice(0, 5).map(g => (
            <Link
              key={g.symbol}
              to={`/trade/${g.symbol}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition border-b last:border-b-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{g.symbol}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>₹{(g.price || 0).toFixed(2)}</p>
              </div>
              <span className="text-sm font-bold text-red-500">{(g.changePercent || 0).toFixed(2)}%</span>
            </Link>
          ))}
        </div>

        {/* Recent orders */}
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
            <Clock size={18} style={{ color: 'var(--text-muted)' }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Recent Orders</h3>
          </div>
          {recentOrders.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Zap size={28} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No orders yet. Start trading!</p>
              <Link to="/trade" className="text-sm font-semibold mt-2 inline-block" style={{ color: 'var(--primary)' }}>Go to Trade →</Link>
            </div>
          ) : (
            recentOrders.map(order => (
              <div key={order._id} className="flex items-center justify-between px-5 py-3 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3">
                  <span className={order.type === 'buy' ? 'badge-buy' : 'badge-sell'}>{order.type}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{order.symbol}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {order.quantity} @ ₹{(order.price || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
