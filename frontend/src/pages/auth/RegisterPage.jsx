import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import { toast, Toaster } from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', form);
      toast.success('Registration successful. Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
      <Toaster />
      <div className="w-full max-w-md bg-bg-card p-8 rounded-2xl shadow-xl border border-bg-surface">
        <h2 className="text-3xl font-bold text-primary mb-6 text-center">Join FinovaX</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-text-muted mb-1 block">Name</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 rounded bg-bg-dark border border-bg-surface text-text-primary focus:border-primary outline-none" required />
          </div>
          <div>
            <label className="text-sm text-text-muted mb-1 block">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-3 rounded bg-bg-dark border border-bg-surface text-text-primary focus:border-primary outline-none" required />
          </div>
          <div>
            <label className="text-sm text-text-muted mb-1 block">Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full p-3 rounded bg-bg-dark border border-bg-surface text-text-primary focus:border-primary outline-none" required />
          </div>
          <button type="submit" className="w-full py-3 bg-primary text-bg-dark font-bold rounded-lg hover:bg-opacity-90 transition shadow-lg shadow-primary/20">Register</button>
        </form>
        <div className="mt-6 text-center text-sm text-text-muted">
          <Link to="/login" className="hover:text-primary transition">Already have an account? Login</Link>
        </div>
      </div>
    </div>
  );
}
