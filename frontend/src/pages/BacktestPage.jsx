import { useState } from 'react';
import { PlayCircle, Settings, BarChart2, TrendingUp, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/client';
import { toast } from 'react-hot-toast';

export default function BacktestPage() {
  const [symbol, setSymbol] = useState('RELIANCE');
  const [strategy, setStrategy] = useState('buy_and_hold');
  const [initialInvestment, setInitialInvestment] = useState(100000);
  const [period, setPeriod] = useState('1y');
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleRunBacktest = async (e) => {
    e.preventDefault();
    if (!symbol || !initialInvestment) return;
    
    setLoading(true);
    try {
      const { data } = await api.post('/backtest/run', {
        symbol, strategy, initialInvestment: Number(initialInvestment), period
      });
      setResults(data);
      toast.success('Backtest complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Backtest failed to run');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 max-w-7xl mx-auto overflow-hidden">
      <header className="mb-8">
        <h1 className="text-4xl font-black mb-2 tracking-tight">Strategy Tester</h1>
        <p className="text-text-muted font-medium">Simulate trading performance against historical records</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden">
        {/* Control Panel */}
        <div className="lg:w-1/3 bg-bg-card border border-bg-surface rounded-3xl p-6 shadow-xl flex flex-col h-full overflow-y-auto">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-bg-surface">
            <Settings className="text-primary" size={24} />
            <h2 className="text-xl font-bold">Parameters</h2>
          </div>

          <form onSubmit={handleRunBacktest} className="space-y-6 flex-1">
            <div>
              <label className="text-sm font-bold text-text-muted mb-2 block">Ticker Symbol</label>
              <input type="text" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} className="w-full bg-bg-dark border border-bg-surface rounded-xl px-4 py-3 text-sm focus:border-primary transition" placeholder="e.g. RELIANCE" />
            </div>

            <div>
              <label className="text-sm font-bold text-text-muted mb-2 block">Trading Strategy</label>
              <select value={strategy} onChange={e => setStrategy(e.target.value)} className="w-full bg-bg-dark border border-bg-surface rounded-xl px-4 py-3 text-sm focus:border-primary transition appearance-none">
                <option value="buy_and_hold">Buy & Hold (Benchmark)</option>
                <option value="sma_crossover">SMA Crossover (5D / 20D) Long/Short</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-text-muted mb-2 block">Initial Capital (₹)</label>
              <input type="number" value={initialInvestment} onChange={e => setInitialInvestment(e.target.value)} className="w-full bg-bg-dark border border-bg-surface rounded-xl px-4 py-3 text-sm focus:border-primary transition" />
            </div>

            <div>
              <label className="text-sm font-bold text-text-muted mb-2 block">Historical Horizon</label>
              <div className="grid grid-cols-3 gap-2">
                {['3mo', '6mo', '1y', '5y'].map(p => (
                  <button type="button" key={p} onClick={() => setPeriod(p)} className={`py-2 rounded-xl text-xs font-bold transition border ${period === p ? 'bg-primary text-bg-dark border-primary' : 'bg-transparent border-bg-surface text-text-muted hover:border-text-muted'}`}>{p.toUpperCase()}</button>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-auto border-t border-bg-surface">
               <button type="submit" disabled={loading} className="w-full bg-primary text-bg-dark font-black px-6 py-4 rounded-xl text-lg uppercase tracking-widest hover:scale-[1.02] transition shadow-lg shadow-primary/20 flex items-center justify-center">
                 {loading ? <span className="animate-pulse">Computing...</span> : <><PlayCircle className="mr-2" /> Run Backtest</>}
               </button>
            </div>
          </form>
        </div>

        {/* Results Graph & Metrics */}
        <div className="lg:w-2/3 flex flex-col gap-6 h-full">
          {results ? (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-3 gap-6">
                 {[
                   { label: 'Total Return', value: `${results.metrics.totalReturnPct}%`, positive: Number(results.metrics.totalReturnPct) >= 0 },
                   { label: 'Alpha (vs B&H)', value: `${results.metrics.alpha}%`, positive: Number(results.metrics.alpha) >= 0 },
                   { label: 'Max Drawdown', value: `-${results.metrics.maxDrawdownPct}%`, positive: false }
                 ].map(k => (
                   <div key={k.label} className="bg-bg-card border border-bg-surface rounded-2xl p-5 shadow-lg flex flex-col justify-center items-center text-center">
                     <span className="text-xs uppercase font-bold text-text-muted tracking-widest">{k.label}</span>
                     <span className={`text-2xl font-black mt-1 ${k.positive ? 'text-primary' : 'text-danger'}`}>{k.value}</span>
                   </div>
                 ))}
              </div>
              
              {/* Chart */}
              <div className="bg-bg-card border border-bg-surface rounded-3xl p-6 shadow-xl flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold flex items-center"><BarChart2 className="mr-2 text-primary text-sm"/> Equity Curve</h3>
                  <span className="text-xs font-mono bg-bg-surface text-text-muted px-2 py-1 rounded">Final: ₹{results.metrics.finalValue}</span>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorStrategy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#6B7280" tick={{fontSize: 10}} tickMargin={10} minTickGap={30} />
                      <YAxis stroke="#6B7280" tick={{fontSize: 10}} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-surface)', borderRadius: '1rem', padding: '1rem', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      <Legend verticalAlign="top" height={36}/>
                      {strategy !== 'buy_and_hold' && <Area type="monotone" name="Benchmark (Hold)" dataKey="benchmark" stroke="#6B7280" fill="none" strokeWidth={2} strokeDasharray="5 5" />}
                      <Area type="monotone" name="Strategy" dataKey="strategy" stroke="#00D4AA" fillOpacity={1} fill="url(#colorStrategy)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 bg-bg-card/50 border border-bg-surface border-dashed rounded-3xl flex flex-col items-center justify-center text-text-muted">
              <TrendingUp size={48} className="mb-4 opacity-20" />
              <p className="font-medium text-lg">Define parameters and run the engine to visualize equity growth.</p>
              <p className="text-sm mt-2 opacity-60">Backtesting compares your strategy purely against raw historical pricing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
