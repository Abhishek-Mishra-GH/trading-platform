import { useEffect, useMemo, useState } from 'react';
import { usePortfolioStore } from '../store/portfolioStore';
import api from '../api/client';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar
} from 'recharts';
import { BrainCircuit, Briefcase, Download, ShieldAlert, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const COLORS = ['#16A34A', '#2563EB', '#F59E0B', '#EF4444', '#0EA5E9', '#8B5CF6', '#D946EF', '#14B8A6'];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const riskTagForHolding = (weight, returnPct) => {
  if (weight >= 28 && returnPct < 0) return { text: 'High Risk', color: 'bg-red-50 text-red-600' };
  if (weight >= 18 || returnPct < -6) return { text: 'Watchlist', color: 'bg-amber-50 text-amber-600' };
  if (returnPct > 10) return { text: 'Momentum', color: 'bg-green-50 text-green-700' };
  return { text: 'Balanced', color: 'bg-blue-50 text-blue-700' };
};

export default function PortfolioPage() {
  const { portfolio, fetchPortfolio, loading } = usePortfolioStore();
  const [metrics, setMetrics] = useState(null);
  const [risk, setRisk] = useState(null);
  const [aiBrief, setAIBrief] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const loadPortfolioIntelligence = async () => {
    setAnalysisLoading(true);
    try {
      const [metricsRes, riskRes, aiRes] = await Promise.all([
        api.get('/analytics/metrics'),
        api.get('/analytics/risk-analysis'),
        api.get('/analytics/ai-portfolio-analysis')
      ]);
      setMetrics(metricsRes.data);
      setRisk(riskRes.data);
      setAIBrief(aiRes.data);
    } catch (error) {
      setMetrics(null);
      setRisk(null);
      setAIBrief(null);
    } finally {
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    loadPortfolioIntelligence();
  }, [fetchPortfolio]);

  const holdings = portfolio?.holdings || [];
  const currentValue = toNumber(portfolio?.totalCurrentValue);
  const invested = toNumber(portfolio?.totalInvested);
  const pnl = currentValue - invested;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
  const isPositive = pnl >= 0;

  const sectorData = useMemo(() => {
    if (!metrics?.sector_allocation) return [];
    return Object.entries(metrics.sector_allocation)
      .map(([name, value]) => ({ name, value: toNumber(value) }))
      .sort((a, b) => b.value - a.value);
  }, [metrics]);

  const concentrationData = useMemo(() => {
    if (!holdings.length || currentValue <= 0) return [];
    return holdings
      .map((holding) => ({
        name: holding.symbol,
        weight: (toNumber(holding.currentValue) / currentValue) * 100,
        returnPct: toNumber(holding.profitLossPercent)
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 8);
  }, [holdings, currentValue]);

  const healthRadar = useMemo(() => {
    const concentrationRisk = toNumber(metrics?.concentration_risk);
    const diversification = toNumber(metrics?.diversification_score);
    const health = toNumber(metrics?.health_score);
    const sharpe = toNumber(metrics?.sharpe_ratio);
    const sortino = toNumber(metrics?.sortino_ratio);
    const drawdown = Math.abs(toNumber(metrics?.max_drawdown));

    return [
      { metric: 'Health', value: clamp(health, 0, 100) },
      { metric: 'Diversification', value: clamp(diversification, 0, 100) },
      { metric: 'Risk Control', value: clamp(100 - concentrationRisk, 0, 100) },
      { metric: 'Sharpe Quality', value: clamp((sharpe + 1) * 26, 0, 100) },
      { metric: 'Downside Control', value: clamp((sortino + 1) * 24, 0, 100) },
      { metric: 'Drawdown Shield', value: clamp(100 - (drawdown * 2.8), 0, 100) }
    ];
  }, [metrics]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="animate-pulse text-sm" style={{ color: 'var(--text-muted)' }}>Loading portfolio intelligence...</div>
      </div>
    );
  }

  const cards = [
    {
      label: 'Current Value',
      value: `INR ${currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      tone: 'var(--text-primary)'
    },
    {
      label: 'Net Return',
      value: `${isPositive ? '+' : ''}INR ${Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      tone: isPositive ? '#16A34A' : '#DC2626'
    },
    {
      label: 'Return %',
      value: `${isPositive ? '+' : ''}${pnlPct.toFixed(2)}%`,
      tone: isPositive ? '#16A34A' : '#DC2626'
    },
    {
      label: 'Diversification',
      value: `${toNumber(metrics?.diversification_score).toFixed(1)}/100`,
      tone: '#2563EB'
    },
    {
      label: 'Health Score',
      value: `${toNumber(metrics?.health_score).toFixed(1)}/100`,
      tone: '#7C3AED'
    },
    {
      label: 'Concentration Risk',
      value: `${toNumber(metrics?.concentration_risk).toFixed(1)}%`,
      tone: '#D97706'
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" style={{ color: 'var(--text-primary)' }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Portfolio Intelligence</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Multi-factor analysis with AI-backed risk and allocation diagnostics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadPortfolioIntelligence}
            disabled={analysisLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-70"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <Sparkles size={15} /> {analysisLoading ? 'Refreshing...' : 'Refresh AI'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition hover:bg-slate-50" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl p-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
            <p className="text-lg font-black" style={{ color: card.tone }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-xl border p-5 space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <BrainCircuit size={17} style={{ color: 'var(--primary)' }} />
            <h3 className="text-sm font-bold uppercase tracking-wider">AI Strategy Brief</h3>
          </div>
          <p className="text-sm leading-6" style={{ color: 'var(--text-primary)' }}>
            {aiBrief?.summary || 'AI insight will appear once analytics data is available for this portfolio.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg p-3 border" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-bold uppercase mb-2" style={{ color: '#16A34A' }}>Strengths</p>
              {(aiBrief?.strengths || []).slice(0, 3).map((item) => (
                <p key={item} className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>• {item}</p>
              ))}
              {!aiBrief?.strengths?.length && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No strengths available yet.</p>}
            </div>
            <div className="rounded-lg p-3 border" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-bold uppercase mb-2" style={{ color: '#D97706' }}>Risks</p>
              {(aiBrief?.risks || []).slice(0, 3).map((item) => (
                <p key={item} className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>• {item}</p>
              ))}
              {!aiBrief?.risks?.length && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No explicit risks detected.</p>}
            </div>
            <div className="rounded-lg p-3 border" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-bold uppercase mb-2" style={{ color: '#2563EB' }}>Actions</p>
              {(aiBrief?.actions || []).slice(0, 3).map((item) => (
                <p key={item} className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>• {item}</p>
              ))}
              {!aiBrief?.actions?.length && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No actions generated yet.</p>}
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert size={16} style={{ color: '#D97706' }} />
            <h3 className="text-sm font-bold uppercase tracking-wider">Risk Radar</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={healthRadar}>
                <PolarGrid stroke="rgba(148,163,184,0.3)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#64748B' }} />
                <Radar dataKey="value" stroke="#2563EB" fill="#2563EB" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            Risk level: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{risk?.riskLevel || 'Unknown'}</span>
          </p>
        </div>
      </div>

      {holdings.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Sector Allocation</h3>
            <div className="flex items-center gap-4">
              <div className="h-56 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorData.length ? sectorData : [{ name: 'No Data', value: 1 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={88}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {sectorData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`INR ${Number(value).toLocaleString('en-IN')}`, 'Exposure']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 min-w-40">
                {sectorData.slice(0, 7).map((sector, index) => (
                  <div key={sector.name} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span style={{ color: 'var(--text-muted)' }}>{sector.name}</span>
                    <span className="ml-auto font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {((sector.value / (currentValue || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Position Weight vs Return</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={concentrationData} margin={{ left: -12, right: 12 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value, key) => {
                      if (key === 'weight') return [`${Number(value).toFixed(2)}%`, 'Weight'];
                      return [`${Number(value).toFixed(2)}%`, 'Return'];
                    }}
                  />
                  <Bar yAxisId="left" dataKey="weight" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="returnPct" radius={[4, 4, 0, 0]}>
                    {concentrationData.map((item, index) => (
                      <Cell key={index} fill={item.returnPct >= 0 ? '#16A34A' : '#DC2626'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          <Briefcase size={18} style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-bold text-sm">Holdings Deep Dive</h3>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
            {holdings.length} positions
          </span>
        </div>

        {!holdings.length ? (
          <div className="py-20 text-center">
            <Briefcase size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No holdings yet.</p>
            <Link to="/trade" className="text-sm font-semibold mt-2 inline-block" style={{ color: 'var(--primary)' }}>Start Trading {'->'}</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead style={{ background: 'var(--bg-surface)' }}>
                <tr>
                  {['Symbol', 'Sector', 'Weight', 'Quantity', 'Avg Buy', 'Current Value', 'P&L', 'Return %', 'Signal'].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => {
                  const value = toNumber(holding.currentValue);
                  const weight = currentValue > 0 ? (value / currentValue) * 100 : 0;
                  const pl = toNumber(holding.profitLoss);
                  const plPct = toNumber(holding.profitLossPercent);
                  const positive = pl >= 0;
                  const tag = riskTagForHolding(weight, plPct);

                  return (
                    <tr key={holding.symbol} className="hover:bg-slate-50 transition border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-5 py-4">
                        <Link to={`/trade/${holding.symbol}`} className="font-bold text-sm hover:underline" style={{ color: 'var(--text-primary)' }}>
                          {holding.symbol}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>{holding.sector || 'Others'}</td>
                      <td className="px-5 py-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{weight.toFixed(2)}%</td>
                      <td className="px-5 py-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{holding.quantity}</td>
                      <td className="px-5 py-4 text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
                        INR {toNumber(holding.avgBuyPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                        INR {value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-sm font-bold font-mono ${positive ? 'text-green-600' : 'text-red-500'}`}>
                          {positive ? '+' : '-'}INR {Math.abs(pl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${positive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {positive ? '+' : ''}{plPct.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex text-xs font-semibold px-2 py-1 rounded ${tag.color}`}>
                          {tag.text}
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
