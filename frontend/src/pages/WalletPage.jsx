import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, Clock, Search } from 'lucide-react';
import api from '../api/client';
import { toast, Toaster } from 'react-hot-toast';

export default function WalletPage() {
  const { wallet, fetchWallet, loading } = useWalletStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [txSearch, setTxSearch] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(false);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  useEffect(() => {
    const stripeStatus = searchParams.get('stripe_status');
    const sessionId = searchParams.get('session_id');

    if (!stripeStatus) return;

    if (stripeStatus === 'cancelled') {
      toast.error('Stripe payment cancelled');
      setSearchParams({}, { replace: true });
      return;
    }

    if (stripeStatus === 'success' && sessionId && !verifyingSession) {
      const verifyStripeSession = async () => {
        setVerifyingSession(true);
        try {
          await api.post('/wallet/deposit/verify', { sessionId });
          await fetchWallet();
          toast.success('Stripe payment verified and wallet credited');
        } catch (err) {
          toast.error(err.response?.data?.message || 'Unable to verify Stripe payment');
        } finally {
          setVerifyingSession(false);
          setShowDeposit(false);
          setAmount('');
          setSearchParams({}, { replace: true });
        }
      };

      verifyStripeSession();
    }
  }, [searchParams, setSearchParams, fetchWallet, verifyingSession]);

  const handleDeposit = async (e) => {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 100 || value > 100000) {
      toast.error('Enter an amount between 100 and 100000');
      return;
    }

    setDepositLoading(true);
    try {
      const { data } = await api.post('/wallet/deposit/initiate', { amount: value });
      if (!data.checkoutUrl) {
        throw new Error('Stripe checkout is unavailable');
      }
      window.location.assign(data.checkoutUrl);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Deposit failed');
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setWithdrawLoading(true);
    try {
      await api.post('/wallet/withdraw', { amount: Number(amount) });
      toast.success(`Withdrawal of ₹${Number(amount).toLocaleString('en-IN')} initiated`);
      setShowWithdraw(false);
      setAmount('');
      fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="animate-pulse text-sm" style={{ color: 'var(--text-muted)' }}>Loading Wallet...</div>
    </div>
  );

  const balance = wallet?.balance || 0;
  const txs = (wallet?.transactions || []).filter(tx =>
    !txSearch || tx.type?.includes(txSearch.toLowerCase()) || tx.symbol?.toLowerCase().includes(txSearch.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto" style={{ color: 'var(--text-primary)' }}>
      <Toaster position="top-right" />

      {verifyingSession && (
        <div className="rounded-xl border px-4 py-3 text-sm font-semibold" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          Verifying Stripe payment and updating your wallet...
        </div>
      )}

      <div>
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Funds</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage your trading capital</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 rounded-2xl p-6 border relative overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="absolute right-5 top-5 opacity-5">
            <WalletIcon size={120} />
          </div>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Available Balance</p>
          <h2 className="text-4xl font-black mb-5" style={{ color: 'var(--text-primary)' }}>
            ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeposit(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-70"
              style={{ background: 'var(--primary)' }}
              disabled={verifyingSession}
            >
              <ArrowDownToLine size={16} /> Add Funds
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition hover:bg-slate-50"
              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <ArrowUpFromLine size={16} /> Withdraw
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl p-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Total Deposited</p>
            <p className="text-xl font-black" style={{ color: 'var(--primary)' }}>₹{(wallet?.totalDeposited || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-xl p-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Total Withdrawn</p>
            <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>₹{(wallet?.totalWithdrawn || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <Clock size={16} style={{ color: 'var(--text-muted)' }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Transaction History</h3>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search..."
              value={txSearch}
              onChange={e => setTxSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm rounded-lg border"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', width: 150 }}
            />
          </div>
        </div>
        {txs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No transactions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead style={{ background: 'var(--bg-surface)' }}>
                <tr>
                  {['Type', 'Symbol', 'Date', 'Amount', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txs.map(tx => (
                  <tr key={tx._id} className="hover:bg-slate-50 transition border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-5 py-4">
                      <span className={tx.type === 'deposit' || tx.type === 'sell' ? 'badge-buy' : 'badge-sell'}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{tx.symbol || '-'}</td>
                    <td className="px-5 py-4 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{new Date(tx.createdAt).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4 text-sm font-mono font-bold" style={{ color: 'var(--text-primary)' }}>₹{(tx.netAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-4 text-xs font-semibold uppercase" style={{ color: tx.status === 'completed' ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {tx.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDeposit && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl border shadow-2xl w-full max-w-sm p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-lg font-black mb-1" style={{ color: 'var(--text-primary)' }}>Add Funds</h2>
            <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>You will be redirected to Stripe Checkout.</p>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Test card: 4242 4242 4242 4242, any future date, any CVC.</p>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-muted)' }}>Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  min="100"
                  autoFocus
                  required
                  disabled={depositLoading}
                  className="w-full px-3 py-3 rounded-lg border text-2xl font-black text-center"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex gap-2">
                {[1000, 5000, 10000, 25000].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v.toString())}
                    disabled={depositLoading}
                    className="flex-1 py-2 text-xs font-bold rounded-lg border transition hover:bg-slate-50 disabled:opacity-70"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                  >
                    ₹{v.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
              <button type="submit" disabled={depositLoading} className="w-full py-3 rounded-xl text-sm font-black text-white disabled:opacity-70" style={{ background: 'var(--primary)' }}>
                {depositLoading ? 'Redirecting to Stripe...' : `Proceed to Pay ₹${Number(amount || 0).toLocaleString('en-IN')}`}
              </button>
              <button type="button" onClick={() => setShowDeposit(false)} disabled={depositLoading} className="w-full py-2 text-sm disabled:opacity-70" style={{ color: 'var(--text-muted)' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {showWithdraw && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl border shadow-2xl w-full max-w-sm p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-lg font-black mb-1" style={{ color: 'var(--text-primary)' }}>Withdraw Funds</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Max: ₹{balance.toLocaleString('en-IN')}. Flat ₹5 fee.</p>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-muted)' }}>Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  min="100"
                  max={balance}
                  autoFocus
                  required
                  disabled={withdrawLoading}
                  className="w-full px-3 py-3 rounded-lg border text-2xl font-black text-center"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <button type="submit" disabled={withdrawLoading} className="w-full py-3 rounded-xl text-sm font-black text-white bg-red-500 disabled:opacity-70">
                {withdrawLoading ? 'Processing...' : `Withdraw ₹${Number(amount || 0).toLocaleString('en-IN')}`}
              </button>
              <button type="button" onClick={() => setShowWithdraw(false)} disabled={withdrawLoading} className="w-full py-2 text-sm disabled:opacity-70" style={{ color: 'var(--text-muted)' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
