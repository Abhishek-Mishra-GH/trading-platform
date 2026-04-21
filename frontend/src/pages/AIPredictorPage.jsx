import { useState, useEffect } from 'react';
import { Search, ShieldAlert, Target, Activity, TrendingUp, AlertTriangle, CheckCircle, BarChart2, BookOpen, Anchor } from 'lucide-react';
import api from '../api/client';

const COVERED_STOCKS = [
  { symbol: "RELIANCE", name: "Reliance Industries" },
  { symbol: "TCS", name: "Tata Consultancy" },
  { symbol: "HDFCBANK", name: "HDFC Bank" },
  { symbol: "INFY", name: "Infosys" },
  { symbol: "ICICIBANK", name: "ICICI Bank" },
  { symbol: "SBIN", name: "State Bank of India" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance" },
  { symbol: "ITC", name: "ITC Limited" },
  { symbol: "LT", name: "Larsen & Toubro" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel" },
];

export default function AIPredictorPage() {
  const [symbol, setSymbol] = useState('RELIANCE');
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

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
    fetchPrediction(sym);
  };

  const fetchPrediction = async (sym) => {
    if (!sym) return;
    setLoading(true);
    setPrediction(null);
    try {
      const { data } = await api.get(`/stocks/${sym}/deep-prediction`);
      setPrediction(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => { fetchPrediction(symbol); }, []);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Main Analysis Pane */}
      <div className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black mb-2 tracking-tight">AI Quantitative Predictor</h1>
            <p className="text-text-muted font-medium">Deep fundamental & technical forecasting augmented by Gemini 3.1 Flash</p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onFocus={() => searchResults.length && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Analyze another stock..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border bg-bg-card text-text-primary focus:border-primary transition font-bold"
              style={{ borderColor: 'var(--border)' }}
            />
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 rounded-xl border shadow-2xl z-50 overflow-hidden bg-bg-card" style={{ borderColor: 'var(--border)' }}>
                {searchResults.map(r => (
                  <button
                    key={r.symbol}
                    onMouseDown={() => selectStock(r.symbol)}
                    className="w-full text-left px-5 py-3 text-sm hover:bg-bg-surface flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-text-primary">{r.symbol}</span>
                      <span className="ml-2 text-xs text-text-muted">{r.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        {!prediction && loading && (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-bg-surface rounded-3xl animate-pulse min-h-[400px]">
            <Activity size={48} className="text-primary mb-4 opacity-50" />
            <p className="text-lg font-bold text-text-muted">Synthesizing live data and processing quantitative models...</p>
          </div>
        )}

        {prediction && !loading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl">
            {/* Top Hero Card */}
            <div className="bg-bg-card border border-bg-surface rounded-3xl p-8 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                <div>
                  <span className="bg-bg-surface text-text-muted px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest mb-4 inline-block">Analysis Payload</span>
                  <h2 className="text-5xl font-black text-text-primary tracking-tighter">{symbol}</h2>
                </div>
                
                <div className="flex flex-col items-end mt-6 md:mt-0">
                  <div className="text-right mb-2">
                    <span className="text-sm font-bold text-text-muted uppercase tracking-widest mr-3">Recommendation</span>
                    <span className={`px-4 py-1.5 rounded-lg text-sm font-black tracking-widest uppercase ${prediction.recommendation === 'BUY' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : prediction.recommendation === 'SELL' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                      {prediction.recommendation}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 w-48 mt-4">
                    <span className="text-xs font-bold text-text-muted">CONFIDENCE</span>
                    <div className="flex-1 bg-bg-surface h-2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${prediction.confidence}%`, background: prediction.confidence > 75 ? 'var(--primary)' : prediction.confidence > 40 ? '#EAB308' : '#EF4444' }}></div>
                    </div>
                    <span className="text-xs font-black">{prediction.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Layout for Targets & Risk */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="bg-bg-card border border-bg-surface rounded-3xl p-6 shadow-lg flex items-center group">
                 <div className="bg-primary/10 p-4 rounded-2xl mr-5 group-hover:scale-110 transition"><Target className="text-primary"/></div>
                 <div>
                   <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">Short-Term Target</p>
                   <p className="text-2xl font-black">₹{prediction.targetPrices?.shortTerm || 'N/A'}</p>
                 </div>
              </div>

              <div className="bg-bg-card border border-bg-surface rounded-3xl p-6 shadow-lg flex items-center group">
                 <div className="bg-blue-500/10 p-4 rounded-2xl mr-5 group-hover:scale-110 transition"><TrendingUp className="text-blue-500"/></div>
                 <div>
                   <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">Long-Term Target</p>
                   <p className="text-2xl font-black">₹{prediction.targetPrices?.longTerm || 'N/A'}</p>
                 </div>
              </div>

              <div className="bg-bg-card border border-bg-surface rounded-3xl p-6 shadow-lg flex items-center group">
                 <div className={`p-4 rounded-2xl mr-5 group-hover:scale-110 transition ${prediction.riskLevel === 'Low' ? 'bg-green-500/10 text-green-500' : prediction.riskLevel === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                   <ShieldAlert />
                 </div>
                 <div>
                   <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">Risk Profile</p>
                   <p className={`text-2xl font-black ${prediction.riskLevel === 'Low' ? 'text-green-500' : prediction.riskLevel === 'Medium' ? 'text-yellow-500' : 'text-red-500'}`}>{prediction.riskLevel}</p>
                 </div>
              </div>
            </div>

            {/* Deep Analytics Texts */}
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 pb-12">
              <div className="bg-bg-card border border-bg-surface rounded-3xl p-8 shadow-xl flex flex-col">
                <h3 className="text-lg font-black uppercase tracking-widest flex items-center mb-6 pb-4 border-b border-bg-surface">
                  <BarChart2 className="mr-3 text-primary" size={24} /> Technical Analysis
                </h3>
                <p className="text-text-muted leading-relaxed font-medium text-sm flex-1">{prediction.technicalAnalysis}</p>
              </div>

              <div className="bg-bg-card border border-bg-surface rounded-3xl p-8 shadow-xl flex flex-col">
                <h3 className="text-lg font-black uppercase tracking-widest flex items-center mb-6 pb-4 border-b border-bg-surface">
                  <BookOpen className="mr-3 text-blue-500" size={24} /> Fundamental Analysis
                </h3>
                <p className="text-text-muted leading-relaxed font-medium text-sm flex-1">{prediction.fundamentalAnalysis}</p>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Right Side Pane for Direct Selection */}
      <div className="w-80 border-l border-bg-surface bg-bg-card hidden lg:flex flex-col shrink-0">
        <div className="p-6 border-b border-bg-surface">
          <h3 className="font-black tracking-widest text-sm uppercase text-text-primary flex items-center"><Target size={16} className="mr-2 text-primary"/> Covered Assets</h3>
          <p className="text-xs text-text-muted mt-2 font-medium">Select a stock to run AI inference</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {COVERED_STOCKS.map(st => (
             <button
                key={st.symbol}
                onClick={() => selectStock(st.symbol)}
                className={`w-full text-left p-4 rounded-2xl transition border ${symbol === st.symbol ? 'bg-primary/10 border-primary shadow-sm' : 'bg-transparent border-bg-surface hover:bg-bg-surface'}`}
             >
                <div className="flex justify-between items-center">
                  <span className={`font-black tracking-wide ${symbol === st.symbol ? 'text-primary' : 'text-text-primary'}`}>{st.symbol}</span>
                  {symbol === st.symbol && <Activity size={14} className="text-primary animate-pulse"/>}
                </div>
                <div className="text-xs font-medium mt-1 truncate" style={{ color: symbol === st.symbol ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {st.name}
                </div>
             </button>
          ))}
        </div>
      </div>

    </div>
  );
}
