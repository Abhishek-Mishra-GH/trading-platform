import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      toast.success('Logged in successfully');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
      <Toaster />
      <div className="w-full max-w-md bg-bg-card p-8 rounded-2xl shadow-xl border border-bg-surface">
        <h2 className="text-3xl font-bold text-primary mb-6 text-center">TradeSphere</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-text-muted mb-1 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 rounded bg-bg-dark border border-bg-surface focus:border-primary text-text-primary" required />
          </div>
          <div>
            <label className="text-sm text-text-muted mb-1 block">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 rounded bg-bg-dark border border-bg-surface focus:border-primary text-text-primary" required />
          </div>
          <button type="submit" className="w-full py-3 bg-primary text-bg-dark font-bold rounded-lg hover:bg-opacity-90 transition">Login</button>
        </form>
        <div className="mt-6 flex justify-between text-sm text-text-muted">
          <Link to="/register" className="hover:text-primary transition">Register</Link>
          <Link to="/forgot-password" className="hover:text-primary transition">Forgot Password?</Link>
        </div>
      </div>
    </div>
  );
}
