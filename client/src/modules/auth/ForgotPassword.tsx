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
    <div className="min-h-screen w-screen flex items-center justify-center bg-bg px-16 font-sans">
      <div className="w-full max-w-[400px] p-24 bg-surface border border-border rounded shadow-sm space-y-24">
        {/* Brand/Header */}
        <div className="text-center space-y-8">
          <span className="inline-block bg-accent text-white px-12 py-6 rounded-sm text-lg font-bold tracking-wider select-none">
            AF
          </span>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">AssetFlow</h1>
          <p className="text-sm text-text-secondary">Reset Account Password</p>
        </div>

        {error && (
          <div className="p-12 text-xs bg-danger-subtle border border-danger text-danger rounded-sm">
            {error}
          </div>
        )}

        {successMsg && !resetSuccess && (
          <div className="p-12 text-xs bg-info-subtle border border-info text-info rounded-sm">
            {successMsg}
          </div>
        )}

        {resetSuccess && (
          <div className="p-12 text-xs bg-success-subtle border border-success text-success rounded-sm">
            {successMsg}
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleRequestReset} className="space-y-16">
            <div className="space-y-8">
              <label className="block text-sm font-medium text-text-secondary">Email Address</label>
              <input 
                type="email"
                placeholder="e.g. employee@assetflow.dev"
                className="w-full h-36 px-12 border border-border rounded bg-surface text-sm text-text-primary placeholder-text-muted transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full h-36 mt-8 flex items-center justify-center text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Requesting...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {successMsg && demoToken && !resetSuccess && (
          <form onSubmit={handleApplyReset} className="space-y-16 pt-8 border-t border-border">
            <div className="space-y-8">
              <div className="p-8 text-[11px] font-mono bg-surface-sunken border border-border text-text-primary rounded-sm break-all">
                <span className="font-semibold text-xs block mb-4 text-text-secondary">Demo Mode Token Received:</span>
                {demoToken}
              </div>
            </div>

            <div className="space-y-8">
              <label className="block text-sm font-medium text-text-secondary">New Password</label>
              <input 
                type="password"
                placeholder="Enter your new password"
                className="w-full h-36 px-12 border border-border rounded bg-surface text-sm text-text-primary placeholder-text-muted transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full h-36 mt-8 flex items-center justify-center text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-text-secondary">
          <Link to="/login" className="font-semibold text-accent hover:text-accent-hover focus:outline-none focus:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
