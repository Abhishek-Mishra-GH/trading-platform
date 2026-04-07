import { useEffect, useState } from 'react';
import { usePortfolioStore } from '../store/portfolioStore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Briefcase, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const COLORS = ['#1DB954', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#F97316'];

export default function PortfolioPage() {
  const { portfolio, fetchPortfolio, loading } = usePortfolioStore();
  const [expandedHolding, setExpandedHolding] = useState(null);

  useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="animate-pulse text-sm" style={{ color: 'var(--text-muted)' }}>Loading Portfolio…</div>
    </div>
  );

  const currentVal = portfolio?.totalCurrentValue || 0;
  const invested = portfolio?.totalInvested || 0;
  const pnl = currentVal - invested;
  const isPos = pnl >= 0;
  const pct = invested > 0 ? ((pnl / invested) * 100).toFixed(2) : '0.00';

  const holdings = portfolio?.holdings || [];

  // Sector allocation from holdings
  const sectorMap = {};
  holdings.forEach(h => {
    const sector = h.sector || 'Other';
    sectorMap[sector] = (sectorMap[sector] || 0) + (h.currentValue || 0);
  });
  const sectorData = Object.entries(sectorMap).map(([name, value]) => ({ name, value }));

  // Holdings for bar chart
  const holdingChart = holdings.map(h => ({ name: h.symbol, pnl: h.profitLoss || 0 }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Portfolio</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your positions and performance</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition hover:bg-slate-50" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          <Download size={15} /> Export
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Current Value', value: `₹${currentVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, highlight: false },
          { label: 'Invested', value: `₹${invested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, highlight: false },
          { label: 'Total P&L', value: `${isPos ? '+' : ''}₹${Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, highlight: true, positive: isPos },
          { label: 'Return %', value: `${isPos ? '+' : ''}${pct}%`, highlight: true, positive: isPos },
        ].map(c => (
          <div key={c.label} className="rounded-xl p-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
            <p className={`text-xl font-black ${c.highlight ? (c.positive ? 'text-green-600' : 'text-red-500') : ''}`} style={!c.highlight ? { color: 'var(--text-primary)' } : {}}>
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sector allocation */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Sector Allocation</h3>
            <div className="flex items-center gap-6">
              <div className="h-44 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sectorData.length > 0 ? sectorData : [{ name: 'No Data', value: 1 }]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                      {sectorData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Value']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {sectorData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span style={{ color: 'var(--text-muted)' }}>{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* P&L per stock */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>P&L by Stock</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={holdingChart} margin={{ left: -20, right: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'P&L']}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {holdingChart.map((entry, i) => (
                      <Cell key={i} fill={entry.pnl >= 0 ? '#16A34A' : '#DC2626'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Holdings table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          <Briefcase size={18} style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Holdings</h3>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
            {holdings.length} stocks
          </span>
        </div>

        {holdings.length === 0 ? (
          <div className="py-20 text-center">
            <Briefcase size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No holdings yet.</p>
            <Link to="/trade" className="text-sm font-semibold mt-2 inline-block" style={{ color: 'var(--primary)' }}>Start Trading →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead style={{ background: 'var(--bg-surface)' }}>
                <tr>
                  {['Symbol', 'Qty', 'Avg Buy', 'LTP', 'Current Value', 'P&L', 'Return %'].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => {
                  const pl = h.profitLoss || 0;
                  const plPct = h.profitLossPercent || 0;
                  const isHPos = pl >= 0;
                  return (
                    <tr
                      key={h.symbol}
                      className="hover:bg-slate-50 transition border-b last:border-b-0 cursor-pointer"
                      style={{ borderColor: 'var(--border)' }}
                      onClick={() => setExpandedHolding(expandedHolding === h.symbol ? null : h.symbol)}
                    >
                      <td className="px-5 py-4">
                        <Link to={`/trade/${h.symbol}`} className="font-bold text-sm hover:underline" style={{ color: 'var(--text-primary)' }}>
                          {h.symbol}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{h.quantity}</td>
                      <td className="px-5 py-4 text-sm font-mono" style={{ color: 'var(--text-muted)' }}>₹{(h.avgBuyPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-4 text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>₹{(h.currentPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-4 text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>₹{(h.currentValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-4">
                        <span className={`text-sm font-bold font-mono ${isHPos ? 'text-green-600' : 'text-red-500'}`}>
                          {isHPos ? '+' : ''}₹{Math.abs(pl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${isHPos ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {isHPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {isHPos ? '+' : ''}{Math.abs(plPct).toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
