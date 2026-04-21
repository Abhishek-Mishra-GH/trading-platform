import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useThemeStore } from '../store/themeStore';
import { Bot, TrendingUp, ShieldCheck, Zap, Moon, Sun, ArrowRight, Github, Twitter, Linkedin, Activity, Code } from 'lucide-react';

const MOCK_TICKERS = [
  { symbol: "RELIANCE", price: "2950.40", change: "+1.2%" },
  { symbol: "TCS", price: "4120.15", change: "-0.4%" },
  { symbol: "HDFCBANK", price: "1480.90", change: "+2.1%" },
  { symbol: "INFY", price: "1650.00", change: "+0.8%" },
  { symbol: "ICICIBANK", price: "1050.25", change: "+1.5%" },
  { symbol: "SBI", price: "760.30", change: "-1.1%" },
  { symbol: "BAJFINANCE", price: "7200.50", change: "+3.4%" },
  { symbol: "ITC", price: "430.75", change: "+0.2%" },
];

export default function LandingPage() {
  const { theme, toggleTheme, initTheme } = useThemeStore();

  useEffect(() => { initTheme(); }, [initTheme]);

  // Framer Motion variants
  const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
  const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } };

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary overflow-hidden font-sans">
      
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-bg-dark/80 backdrop-blur-md border-b border-bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary/20 flex items-center justify-center rounded-xl border border-primary/50">
                 <Bot className="text-primary" size={24}/>
              </div>
              <span className="font-black text-2xl tracking-tighter">FinovaX</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-bg-surface transition text-text-muted hover:text-primary">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <Link to="/login" className="font-bold text-sm tracking-widest uppercase hover:text-primary transition hidden sm:block">Sign In</Link>
              <Link to="/register" className="bg-primary text-bg-dark border border-primary px-6 py-2.5 rounded-xl font-bold tracking-widest uppercase hover:bg-transparent hover:text-primary transition shadow-xl shadow-primary/20">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Scrolling Ticker (Below Nav) */}
      <div className="pt-20 bg-bg-dark border-b border-bg-surface overflow-hidden whitespace-nowrap flex relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-bg-dark to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-bg-dark to-transparent z-10 pointer-events-none"></div>
        <div className="flex w-max animate-marquee space-x-12 py-3 px-6 hover:[animation-play-state:paused]">
          {[...MOCK_TICKERS, ...MOCK_TICKERS, ...MOCK_TICKERS].map((tick, i) => (
            <div key={i} className="inline-flex items-center space-x-3 font-mono text-sm tracking-wide">
              <span className="font-extrabold text-text-primary">{tick.symbol}</span>
              <span className="text-text-muted">₹{tick.price}</span>
              <span className={tick.change.startsWith('+') ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>{tick.change}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative pt-8 pb-20 lg:pt-12 lg:pb-32">
        {/* Abstract Background Shapes */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] mix-blend-screen opacity-50"></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto">
            <motion.div variants={fadeIn} className="inline-flex items-center space-x-2 bg-bg-card border border-bg-surface px-4 py-2 rounded-full mb-8 shadow-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Gemini 3.1 Powered Trading</span>
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-6xl lg:text-8xl font-black mb-8 tracking-tighter leading-tight">
              Smarter Trading, <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Supercharged by AI.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl lg:text-2xl text-text-muted mb-12 font-medium leading-relaxed max-w-3xl mx-auto">
              FinovaX is the ultimate fintech platform. Execute trades, visualize analytics, and get personalized portfolio advice from our cutting-edge AI Agent in real-time.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link to="/register" className="w-full sm:w-auto bg-primary text-bg-dark text-lg px-10 py-5 rounded-2xl font-black tracking-widest uppercase hover:scale-105 transition transform shadow-2xl shadow-primary/30 flex items-center justify-center group">
                Begin Journey <ArrowRight size={20} className="ml-3 group-hover:translate-x-2 transition" />
              </Link>
              <Link to="/login" className="w-full sm:w-auto bg-bg-card border border-bg-surface text-lg px-10 py-5 rounded-2xl font-bold tracking-widest uppercase hover:bg-bg-surface transition transform flex items-center justify-center">
                Access Dashboard
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-bg-card/50 border-t border-bg-surface relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="text-center mb-20">
            <h2 className="text-4xl font-black tracking-tight mb-4 text-text-primary">Next-Generation Capabilities</h2>
            <p className="text-text-muted text-lg font-medium">Everything you need to master the markets, built elegantly.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Bot size={36} className="text-primary"/>, title: "AI Portfolio Advisor", desc: "Get real-time health scores and actionable insights generated dynamically for your active holdings." },
              { icon: <TrendingUp size={36} className="text-blue-500"/>, title: "Advanced Analytics", desc: "Treemaps, CAGR metrics, Sharpe Ratios, and Volatility tracking visualized via beautiful interactive Recharts." },
              { icon: <Zap size={36} className="text-amber-500"/>, title: "Lightning Execution", desc: "Instant simulated order placements integrated closely with live Finnhub market feeds and candlestick history." },
              { icon: <ShieldCheck size={36} className="text-emerald-500"/>, title: "Bank-Grade Security", desc: "Your data stays safe with rigorous JWT authentication, robust password hashing, and optional 2FA checks." }
            ].map((feature, idx) => (
              <motion.div key={idx} variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} whileHover={{ y: -10 }} className="bg-bg-dark border border-bg-surface p-10 rounded-3xl shadow-xl flex flex-col items-start group transition">
                <div className="bg-bg-card p-4 rounded-2xl border border-bg-surface mb-6 group-hover:scale-110 transition shrink-0 shadow-lg">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black mb-3">{feature.title}</h3>
                <p className="text-text-muted leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="py-32 relative">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-[3rem] p-12 lg:p-20 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <h2 className="text-4xl lg:text-6xl font-black tracking-tight mb-6 relative z-10">Ready to outsmart the market?</h2>
          <p className="text-text-muted text-xl mb-10 font-medium relative z-10 max-w-2xl mx-auto">Join the new era of fintech trading where artificial intelligence fuels your every alpha-generating decision.</p>
          <Link to="/register" className="inline-block bg-primary text-bg-dark text-lg px-12 py-5 rounded-2xl font-black tracking-widest uppercase hover:scale-105 transition transform shadow-2xl shadow-primary/30 relative z-10">
            Create Free Account
          </Link>
        </div>
      </div>

      {/* Footer System */}
      <footer className="bg-bg-card border-t border-bg-surface pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8 mb-16">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-primary/20 flex items-center justify-center rounded-lg border border-primary/50">
                   <Zap className="text-primary" size={18}/>
                </div>
                <span className="font-black text-xl tracking-tighter">FinovaX</span>
              </div>
              <p className="text-text-muted text-sm font-medium leading-relaxed mb-6">
                Institutional-grade technology, bringing advanced quantitative analytics and machine learning directly to retail traders in India.
              </p>
            </div>
            
            <div>
              <h4 className="font-black text-text-primary tracking-widest uppercase text-xs mb-6">Platform</h4>
              <ul className="space-y-4">
                <li><Link to="/trade" className="text-text-muted text-sm hover:text-primary transition font-medium">Terminal Edge</Link></li>
                <li><Link to="/backtest" className="text-text-muted text-sm hover:text-primary transition font-medium">Backtesting Engine</Link></li>
                <li><Link to="/advisor" className="text-text-muted text-sm hover:text-primary transition font-medium flex items-center">AI Advisor <span className="ml-2 bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded font-bold">NEW</span></Link></li>
                <li><a href="#" className="text-text-muted text-sm hover:text-primary transition font-medium">Market Feeds</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-text-primary tracking-widest uppercase text-xs mb-6">Resources</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-text-muted text-sm hover:text-primary transition font-medium">Documentation</a></li>
                <li><a href="#" className="text-text-muted text-sm hover:text-primary transition font-medium">API Endpoints</a></li>
                <li><a href="#" className="text-text-muted text-sm hover:text-primary transition font-medium">Server Status</a></li>
                <li><a href="#" className="text-text-muted text-sm hover:text-primary transition font-medium mt-4 flex items-center"><Activity size={14} className="mr-2 text-green-500"/> All systems functional</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-text-primary tracking-widest uppercase text-xs mb-6">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-text-muted text-sm hover:text-primary transition font-medium">About Us</a></li>
                <li><a href="#" className="text-text-muted text-sm hover:text-primary transition font-medium">Careers</a></li>
                <li><a href="#" className="text-text-muted text-sm hover:text-primary transition font-medium">Privacy Policy</a></li>
                <li><a href="#" className="text-text-muted text-sm hover:text-primary transition font-medium">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-bg-surface flex flex-col md:flex-row justify-center items-center">
            <p className="text-text-muted text-sm font-medium mb-4 md:mb-0">
              © {new Date().getFullYear()} FinovaX Trading Systems. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
