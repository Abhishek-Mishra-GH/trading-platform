import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { toast, Toaster } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Reset link sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send link');
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
      <Toaster />
      <div className="w-full max-w-md bg-bg-card p-8 rounded-2xl shadow-xl border border-bg-surface">
        <h2 className="text-2xl font-bold text-primary mb-2 text-center">Reset Password</h2>
        <p className="text-text-muted text-center text-sm mb-6">Enter your email and we'll send a link to reset your password.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 rounded bg-bg-dark border border-bg-surface text-text-primary focus:border-primary outline-none" required />
          </div>
          <button type="submit" className="w-full py-3 bg-primary text-bg-dark font-bold rounded-lg hover:bg-opacity-90 transition">Send Link</button>
        </form>
        <div className="mt-6 text-center text-sm text-text-muted">
          <Link to="/login" className="hover:text-primary transition">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
