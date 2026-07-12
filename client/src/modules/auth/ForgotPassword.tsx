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
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#F7F8FA] px-16 font-sans">
      <div className="w-full max-w-[400px] p-24 bg-white border border-[#DDE1E6] rounded-[6px] space-y-24 shadow-sm">
        {/* Brand/Header */}
        <div className="text-center space-y-8">
          <span className="inline-block bg-[#2F5DE0] text-white px-12 py-6 rounded-[4px] text-lg font-bold tracking-wider select-none">
            AF
          </span>
          <h1 className="text-xl font-bold text-[#1A1D23] tracking-tight">AssetFlow</h1>
          <p className="text-sm text-[#5B6270]">Reset Account Password</p>
        </div>

        {error && (
          <div className="p-12 text-xs bg-[#FBEAE9] border border-[#C1352E] text-[#C1352E] rounded-[4px]">
            {error}
          </div>
        )}

        {successMsg && !resetSuccess && (
          <div className="p-12 text-xs bg-[#EAF0FE] border border-[#2F5DE0] text-[#2F5DE0] rounded-[4px]">
            {successMsg}
          </div>
        )}

        {resetSuccess && (
          <div className="p-12 text-xs bg-[#E6F6EE] border border-[#1E8E5A] text-[#1E8E5A] rounded-[4px]">
            {successMsg}
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleRequestReset} className="space-y-16">
            <div className="space-y-8">
              <label className="block text-sm font-medium text-[#5B6270]">Email Address</label>
              <input 
                type="email"
                placeholder="e.g. employee@assetflow.dev"
                className="w-full h-36 px-12 border border-[#DDE1E6] rounded-[6px] bg-white text-sm text-[#1A1D23] placeholder-[#8A909C] transition-colors focus:border-[#2F5DE0] focus:ring-2 focus:ring-[#2F5DE0]/10 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full h-36 mt-8 flex items-center justify-center text-sm font-medium text-white bg-[#2F5DE0] hover:bg-[#274CBD] rounded-[6px] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2F5DE0]/20 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Requesting...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {successMsg && demoToken && !resetSuccess && (
          <form onSubmit={handleApplyReset} className="space-y-16 pt-8 border-t border-[#DDE1E6]">
            <div className="space-y-8">
              <div className="p-8 text-[11px] font-mono bg-[#EEF0F3] border border-[#C4C9D1] text-[#1A1D23] rounded-[4px] break-all">
                <span className="font-semibold text-xs block mb-4 text-[#5B6270]">Demo Mode Token Received:</span>
                {demoToken}
              </div>
            </div>

            <div className="space-y-8">
              <label className="block text-sm font-medium text-[#5B6270]">New Password</label>
              <input 
                type="password"
                placeholder="Enter your new password"
                className="w-full h-36 px-12 border border-[#DDE1E6] rounded-[6px] bg-white text-sm text-[#1A1D23] placeholder-[#8A909C] transition-colors focus:border-[#2F5DE0] focus:ring-2 focus:ring-[#2F5DE0]/10 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full h-36 mt-8 flex items-center justify-center text-sm font-medium text-white bg-[#2F5DE0] hover:bg-[#274CBD] rounded-[6px] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2F5DE0]/20 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-[#5B6270]">
          <Link to="/login" className="font-semibold text-[#2F5DE0] hover:text-[#274CBD] focus:outline-none focus:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
