import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      // Explicitly sending only name, email, and password. Gating roles server-side.
      await api.post('/auth/signup', { name, email, password });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error.message);
      } else {
        setError('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-bg px-16 font-sans">
      <div className="w-full max-w-[400px] p-24 bg-surface border border-border rounded shadow-sm space-y-24">
        {/* Brand/Header */}
        <div className="text-center space-y-8">
          <span className="inline-block bg-accent text-white px-12 py-6 rounded-sm text-lg font-bold tracking-wider select-none">
            AF
          </span>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">AssetFlow</h1>
          <p className="text-sm text-text-secondary">Register Employee Account</p>
        </div>

        {error && (
          <div className="p-12 text-xs bg-danger-subtle border border-danger text-danger rounded-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-12 text-xs bg-success-subtle border border-success text-success rounded-sm">
            Account request created successfully! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-16">
          <div className="space-y-8">
            <label className="block text-sm font-medium text-text-secondary">Full Name</label>
            <input 
              type="text"
              placeholder="e.g. Priya Shah"
              className="w-full h-36 px-12 border border-border rounded bg-surface text-sm text-text-primary placeholder-text-muted transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10 focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading || success}
              required
            />
          </div>

          <div className="space-y-8">
            <label className="block text-sm font-medium text-text-secondary">Email Address</label>
            <input 
              type="email"
              placeholder="e.g. priya@assetflow.dev"
              className="w-full h-36 px-12 border border-border rounded bg-surface text-sm text-text-primary placeholder-text-muted transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || success}
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-8">
            <label className="block text-sm font-medium text-text-secondary">Password</label>
            <input 
              type="password"
              placeholder="Create strong password (min 8 chars)"
              className="w-full h-36 px-12 border border-border rounded bg-surface text-sm text-text-primary placeholder-text-muted transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || success}
              autoComplete="new-password"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full h-36 mt-8 flex items-center justify-center text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || success}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-xs text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent hover:text-accent-hover focus:outline-none focus:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
