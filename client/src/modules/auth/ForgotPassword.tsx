import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [demoToken, setDemoToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const response = await api.post('/auth/forgot-password', { email });
      setSuccessMsg(response.data.message || 'If the email matches an account, a link has been generated.');
      
      // Store the token locally if it is exposed in the API (useful for Odoo hackathon judges)
      if (response.data._demoToken) {
        setDemoToken(response.data._demoToken);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error.message);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter a new password.');
      return;
    }

    try {
      setError('');
      setLoading(true);

      await api.post('/auth/reset-password', {
        token: demoToken,
        password: password
      });

      setResetSuccess(true);
      setSuccessMsg('Your password has been successfully reset! You can now log in.');
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error.message);
      } else {
        setError('Reset failed. Please try requesting a new link.');
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
          <p className="text-xs text-text-secondary">Reset Account Password</p>
        </div>

        {error && (
          <div className="p-12 text-xs bg-danger-subtle border border-danger/10 text-danger rounded-sm font-semibold">
            {error}
          </div>
        )}

        {successMsg && !resetSuccess && (
          <div className="p-12 text-xs bg-info-subtle border border-info/10 text-info rounded-sm font-semibold">
            {successMsg}
          </div>
        )}

        {resetSuccess && (
          <div className="p-12 text-xs bg-success-subtle border border-success/10 text-success rounded-sm font-semibold">
            {successMsg}
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleRequestReset} className="space-y-16">
            <div className="space-y-6">
              <label className="block text-xs font-bold text-text-secondary">Email Address</label>
              <input 
                type="email"
                placeholder="e.g. employee@assetflow.dev"
                className="w-full h-36 px-12 border border-border rounded bg-surface text-xs text-text-primary placeholder-text-muted transition-colors focus:border-accent focus:ring-4 focus:ring-accent/10 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full h-36 mt-8 flex items-center justify-center text-xs font-bold text-white bg-accent hover:bg-accent-hover rounded-sm shadow-md shadow-accent/15 btn-premium"
              disabled={loading}
            >
              {loading ? 'Requesting...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {successMsg && demoToken && !resetSuccess && (
          <form onSubmit={handleApplyReset} className="space-y-16 pt-8 border-t border-border/60">
            <div className="space-y-6">
              <div className="p-8 text-[11px] font-mono bg-surface-sunken border border-border/60 text-text-primary rounded break-all">
                <span className="font-bold text-xs block mb-4 text-text-secondary">Demo Mode Token Received:</span>
                {demoToken}
              </div>
            </div>

            <div className="space-y-6">
              <label className="block text-xs font-bold text-text-secondary">New Password</label>
              <input 
                type="password"
                placeholder="Enter your new password"
                className="w-full h-36 px-12 border border-border rounded bg-surface text-xs text-text-primary placeholder-text-muted transition-colors focus:border-accent focus:ring-4 focus:ring-accent/10 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full h-36 mt-8 flex items-center justify-center text-xs font-bold text-white bg-accent hover:bg-accent-hover rounded-sm shadow-md shadow-accent/15 btn-premium"
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-text-secondary pt-8 border-t border-border/60">
          <Link to="/login" className="font-bold text-accent hover:text-accent-hover focus:outline-none">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
