import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const response = await api.post('/auth/login', { email, password });
      
      const { accessToken, user } = response.data;
      login(accessToken, user);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error.message);
      } else {
        setError('Login failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-bg px-16 font-sans relative overflow-hidden">
      {/* Decorative Radial Amethyst Glow Backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/8 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[400px] p-32 bg-surface border border-border/80 rounded-md shadow-[0_10px_40px_-6px_rgba(99,102,241,0.06)] relative z-10 space-y-24 animate-scale-up">
        {/* Brand/Header */}
        <div className="text-center space-y-12">
          <span className="inline-block bg-gradient-to-r from-accent to-accent-hover text-white px-16 py-8 rounded-sm text-base font-black tracking-wider shadow-sm select-none">
            AF
          </span>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">AssetFlow</h1>
          <p className="text-xs text-text-secondary">Enterprise Resource & Asset Management</p>
        </div>

        {error && (
          <div className="p-12 text-xs bg-danger-subtle border border-danger/10 text-danger rounded-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-16">
          <div className="space-y-6">
            <label className="block text-xs font-bold text-text-secondary">Email Address</label>
            <input 
              type="email"
              placeholder="e.g. employee@assetflow.dev"
              className="w-full h-36 px-12 border border-border rounded bg-surface text-xs text-text-primary placeholder-text-muted transition-colors focus:border-accent focus:ring-4 focus:ring-accent/10 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-text-secondary">Password</label>
              <Link to="/forgot-password" className="text-[11px] font-bold text-accent hover:text-accent-hover focus:outline-none focus:underline">
                Forgot password?
              </Link>
            </div>
            <input 
              type="password"
              placeholder="Enter your password"
              className="w-full h-36 px-12 border border-border rounded bg-surface text-xs text-text-primary placeholder-text-muted transition-colors focus:border-accent focus:ring-4 focus:ring-accent/10 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full h-36 mt-8 flex items-center justify-center text-xs font-bold text-white bg-accent hover:bg-accent-hover rounded-sm shadow-md shadow-accent/15 btn-premium"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs text-text-secondary pt-8 border-t border-border/60">
          Don't have an account?{' '}
          <Link to="/signup" className="font-bold text-accent hover:text-accent-hover focus:outline-none">
            Request Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
