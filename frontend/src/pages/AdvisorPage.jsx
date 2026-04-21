import { AlertTriangle, ShieldCheck, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import { usePortfolioStore } from '../store/portfolioStore';
import { useState, useEffect } from 'react';
import api from '../api/client';

export default function AdvisorPage() {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdvice = async () => {
      try {
        const { data } = await api.get('/portfolio/advisor');
        setAdvice(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAdvice();
  }, []);

  if (!advice) return <div className="p-8 text-text-muted animate-pulse font-medium">No advice metrics generated yet.</div>;

  const score = advice.score || 0;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="mb-8">
        <h1 className="text-4xl font-black mb-2 tracking-tight">AI Portfolio Advisor</h1>
        <p className="text-text-muted font-medium">Smart AI insights to optimize your investments</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-gradient-to-br from-[#162032] to-[#0A0E1A] p-8 rounded-3xl border border-bg-surface shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <div className="relative z-10">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle cx="96" cy="96" r="84" className="stroke-bg-surface" strokeWidth="16" fill="none" />
              <circle cx="96" cy="96" r="84" className={`stroke-primary`} strokeWidth="16" fill="none" strokeDasharray={`${(score / 100) * 528} 528`} strokeLinecap="round" style={{transition: 'stroke-dasharray 1.5s ease-out'}}/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-black">{score}</span>
              <span className="text-xs uppercase font-black text-text-muted tracking-widest mt-1">Health</span>
            </div>
          </div>
          <h3 className={`mt-8 font-black text-2xl uppercase tracking-widest ${score > 75 ? 'text-primary' : 'text-danger'}`}>{score > 75 ? 'Excellent' : 'Needs Attention'}</h3>
        </div>

        <div className="md:col-span-2 space-y-6 flex flex-col justify-center">
          <div className="bg-bg-card border border-bg-surface p-8 rounded-3xl shadow-xl flex items-start group flex-1 hover:border-primary/30 transition">
            <div className="bg-primary/10 p-5 rounded-2xl mr-6 group-hover:scale-110 transition shrink-0"><AlertTriangle className="text-primary" size={32}/></div>
            <div>
              <h3 className="font-black text-2xl mb-2 text-text-primary tracking-tight">AI Health Summary</h3>
              <p className="text-text-muted text-base leading-relaxed">{advice.healthSummary || "No health summary provided."}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-bg-card border border-bg-surface rounded-3xl shadow-xl p-10 mt-8">
        <h3 className="font-black text-xl mb-8 uppercase tracking-widest text-text-primary border-b border-bg-surface pb-5 flex items-center"><ShieldCheck className="mr-3 text-primary" size={28}/> Recommended Actions</h3>
        <div className="space-y-5">
          {(advice.actions || []).map((rec, i) => (
            <div key={i} className="flex justify-between items-center bg-[#0A0E1A] border border-bg-surface p-6 rounded-2xl hover:border-primary/40 transition group cursor-pointer shadow-inner">
              <div className="flex items-center">
                <CheckCircle className="text-text-muted mr-6 group-hover:text-primary transition" size={24}/>
                <div>
                  <h4 className="font-black text-xl text-primary transition mb-1 tracking-tight group-hover:text-primary transition">{rec.action} <span className={`text-xs ml-2 uppercase px-2 py-0.5 rounded ${rec.type === 'buy' ? 'bg-green-500/10 text-green-500' : rec.type === 'sell' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{rec.type}</span></h4>
                  <p className="text-text-muted text-base font-medium">{rec.reason}</p>
                </div>
              </div>
              <button className="bg-bg-card border border-bg-surface hover:bg-primary hover:text-bg-dark hover:border-primary text-text-primary px-6 py-3 rounded-xl transition text-xs font-black uppercase tracking-widest flex items-center ml-4 shrink-0">
                Action <ArrowRight size={16} className="ml-2"/>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
