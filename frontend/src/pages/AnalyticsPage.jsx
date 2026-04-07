import { useEffect, useMemo, useState } from 'react';
import { usePortfolioStore } from '../store/portfolioStore';
import {
  Activity,
  BarChart2,
  LineChart as LineChartIcon,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import api from '../api/client';

const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6', '#06B6D4', '#D946EF', '#14B8A6'];

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const riskTone = (level) => {
  const normalized = (level || '').toLowerCase();
  if (normalized.includes('high')) return { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' };
  if (normalized.includes('elevated')) return { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' };
  return { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534' };
};

export default function AnalyticsPage() {
  const { portfolio, fetchPortfolio, loading } = usePortfolioStore();
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [sectorBreakdown, setSectorBreakdown] = useState([]);
  const [risk, setRisk] = useState(null);
  const [aiBrief, setAIBrief] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async () => {
    setRefreshing(true);
    try {
      const [metricsRes, historyRes, heatmapRes, sectorRes, riskRes, aiRes] = await Promise.all([
        api.get('/analytics/metrics'),
        api.get('/analytics/portfolio-history'),
        api.get('/analytics/heatmap'),
        api.get('/analytics/sector-breakdown'),
        api.get('/analytics/risk-analysis'),
        api.get('/analytics/ai-portfolio-analysis')
      ]);

      setMetrics(metricsRes.data);
      setHistory(historyRes.data || []);
      setHeatmap(heatmapRes.data || []);
      setSectorBreakdown(sectorRes.data || []);
      setRisk(riskRes.data);
      setAIBrief(aiRes.data);
    } catch (error) {
      setMetrics(null);
      setHistory([]);
      setHeatmap([]);
      setSectorBreakdown([]);
      setRisk(null);
      setAIBrief(null);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    loadAnalytics();
  }, [fetchPortfolio]);

  const monthlyReturns = metrics?.monthly_returns || [];

  const allocationData = useMemo(() => {
    if (sectorBreakdown?.length) return sectorBreakdown;
    return [];
  }, [sectorBreakdown]);

  const topHeatmap = useMemo(() => {
    return [...heatmap].sort((a, b) => b.weight_in_portfolio - a.weight_in_portfolio).slice(0, 10);
  }, [heatmap]);

  const cards = [
    { label: 'CAGR', value: `${toNumber(metrics?.cagr).toFixed(2)}%`, color: '#16A34A', icon: TrendingUp },
    { label: 'Volatility', value: `${toNumber(metrics?.volatility).toFixed(2)}%`, color: '#2563EB', icon: Activity },
    { label: 'Sharpe Ratio', value: toNumber(metrics?.sharpe_ratio).toFixed(2), color: '#7C3AED', icon: BarChart2 },
    { label: 'Sortino Ratio', value: toNumber(metrics?.sortino_ratio).toFixed(2), color: '#0EA5E9', icon: LineChartIcon },
    { label: 'Max Drawdown', value: `${toNumber(metrics?.max_drawdown).toFixed(2)}%`, color: '#DC2626', icon: TrendingDown },
    { label: 'Portfolio Health', value: `${toNumber(metrics?.health_score).toFixed(1)}/100`, color: '#D97706', icon: ShieldAlert }
  ];

  if (loading || !metrics) {
    return (
      <div className="p-6 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
        <Activity size={16} className="animate-spin" /> Loading analytics intelligence...
      </div>
    );
  }

  const riskStyle = riskTone(risk?.riskLevel);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" style={{ color: 'var(--text-primary)' }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Advanced Analytics</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Quant diagnostics, allocation intelligence, and AI generated portfolio commentary.
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          disabled={refreshing}
          className="w-fit px-4 py-2 rounded-lg border text-sm font-semibold flex items-center gap-2 disabled:opacity-70"
          style={{ borderColor: 'var(--border)' }}
        >
          <Sparkles size={14} /> {refreshing ? 'Refreshing...' : 'Refresh Analytics'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl p-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
                <Icon size={15} style={{ color: card.color }} />
              </div>
              <p className="text-xl font-black" style={{ color: card.color }}>{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border p-5" style={{ background: riskStyle.bg, borderColor: riskStyle.border }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: riskStyle.text }}>
          Risk Regime: {risk?.riskLevel || 'Unknown'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <p style={{ color: riskStyle.text }}>Beta: <span className="font-bold">{toNumber(risk?.beta).toFixed(2)}</span></p>
          <p style={{ color: riskStyle.text }}>VaR 95%: <span className="font-bold">INR {Math.abs(toNumber(risk?.var)).toLocaleString('en-IN')}</span></p>
          <p style={{ color: riskStyle.text }}>CVaR 95%: <span className="font-bold">INR {Math.abs(toNumber(risk?.cvar)).toLocaleString('en-IN')}</span></p>
          <p style={{ color: riskStyle.text }}>Largest Position: <span className="font-bold">{toNumber(risk?.largestPosition).toFixed(2)}%</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Portfolio Value Trajectory</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="portfolioArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  formatter={(value, key) => [`INR ${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, key]}
                />
                <Area type="monotone" dataKey="totalValue" stroke="#2563EB" fill="url(#portfolioArea)" strokeWidth={2} />
                <Line type="monotone" dataKey="invested" stroke="#94A3B8" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>AI Intelligence Brief</h3>
          <p className="text-sm leading-6 mb-4" style={{ color: 'var(--text-primary)' }}>
            {aiBrief?.summary || 'AI summary unavailable for the current snapshot.'}
          </p>
          <div className="space-y-2">
            {(aiBrief?.actions || []).slice(0, 3).map((item) => (
              <div key={item} className="text-xs rounded-md p-2 border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {item}
              </div>
            ))}
            {!aiBrief?.actions?.length && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No recommended actions yet.</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Monthly Return Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyReturns} margin={{ left: -16, right: 10 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Return']} />
                <Bar dataKey="return" radius={[4, 4, 0, 0]}>
                  {monthlyReturns.map((entry, index) => (
                    <Cell key={index} fill={entry.return >= 0 ? '#16A34A' : '#DC2626'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Sector Exposure Ladder</h3>
          <div className="space-y-3">
            {allocationData.slice(0, 8).map((sector, index) => (
              <div key={sector.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: 'var(--text-primary)' }} className="font-semibold">{sector.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{toNumber(sector.allocationPct).toFixed(2)}%</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: 'var(--bg-surface)' }}>
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, toNumber(sector.allocationPct))}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
            {!allocationData.length && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No sector allocation data.</p>}
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Position Heatmap (Weight vs Return)</h3>
        {topHeatmap.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {topHeatmap.map((item) => {
              const isPositive = toNumber(item.return_pct) >= 0;
              const intensity = Math.min(0.9, Math.abs(toNumber(item.return_pct)) / 25 + 0.2);
              const bg = isPositive
                ? `rgba(22,163,74,${intensity})`
                : `rgba(220,38,38,${intensity})`;
              return (
                <div key={item.symbol} className="rounded-lg p-3 text-white" style={{ background: bg }}>
                  <p className="text-sm font-black">{item.symbol}</p>
                  <p className="text-xs mt-1">Weight: {toNumber(item.weight_in_portfolio).toFixed(2)}%</p>
                  <p className="text-xs">Return: {toNumber(item.return_pct).toFixed(2)}%</p>
                  <p className="text-[11px] opacity-80 mt-2">{item.sector}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No heatmap data yet.</p>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Top Performers</h3>
          <div className="space-y-3">
            {(metrics?.top_performers || []).slice(0, 4).map((stock) => (
              <div key={stock.symbol} className="rounded-lg border p-3 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="font-bold text-sm">{stock.symbol}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stock.sector || 'Others'}</p>
                </div>
                <p className="text-sm font-bold text-green-600">+{toNumber(stock.profitLossPercent).toFixed(2)}%</p>
              </div>
            ))}
            {!metrics?.top_performers?.length && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No outperformers yet.</p>}
          </div>
        </div>

        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Underperformers</h3>
          <div className="space-y-3">
            {(metrics?.worst_performers || []).slice(0, 4).map((stock) => (
              <div key={stock.symbol} className="rounded-lg border p-3 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="font-bold text-sm">{stock.symbol}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stock.sector || 'Others'}</p>
                </div>
                <p className="text-sm font-bold text-red-600">{toNumber(stock.profitLossPercent).toFixed(2)}%</p>
              </div>
            ))}
            {!metrics?.worst_performers?.length && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No underperformers yet.</p>}
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4 border flex items-start gap-3" style={{ background: '#FFF7ED', borderColor: '#FED7AA' }}>
        <ShieldAlert size={18} style={{ color: '#D97706' }} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold" style={{ color: '#92400E' }}>Risk Disclaimer</p>
          <p className="text-sm mt-1" style={{ color: '#B45309' }}>
            This dashboard combines model-based metrics with AI narrative guidance. Treat insights as decision support, not financial advice.
          </p>
          <p className="text-xs mt-2" style={{ color: '#B45309' }}>
            Snapshot holdings: {portfolio?.holdings?.length || 0} | Generated: {aiBrief?.generatedAt ? new Date(aiBrief.generatedAt).toLocaleString('en-IN') : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}
