import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, TrendingUp, BriefcaseIcon, Eye, Wallet,
  BarChart2, Bot, LogOut, ChevronRight, Settings, Zap
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/trade', icon: TrendingUp, label: 'Trade' },
  { to: '/portfolio', icon: BriefcaseIcon, label: 'Portfolio' },
  { to: '/watchlist', icon: Eye, label: 'Watchlist' },
  { to: '/wallet', icon: Wallet, label: 'Funds' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/chatbot', icon: Bot, label: 'AI Chat' },
];

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-dark)' }}>
      {/* ─── Sidebar ───────────────────────────────────── */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col border-r"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <Zap size={20} className="mr-2" style={{ color: 'var(--primary)' }} />
          <span className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            TradeSphere
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'hover:bg-slate-100'
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--primary)' : undefined,
                color: isActive ? '#fff' : 'var(--text-muted)',
              })}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t p-3" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-100 cursor-pointer group mb-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--primary)' }}
            >
              {(user?.name || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.name || 'Investor'}
              </p>
              <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                {user?.email || ''}
              </p>
            </div>
            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      {/* ─── Main Content ──────────────────────────────── */}
      <main className="flex-1 overflow-auto min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
