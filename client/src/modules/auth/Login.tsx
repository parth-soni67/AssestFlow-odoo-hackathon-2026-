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
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#F7F8FA] px-16 font-sans">
      <div className="w-full max-w-[400px] p-24 bg-white border border-[#DDE1E6] rounded-[6px] space-y-24 shadow-sm">
        {/* Brand/Header */}
        <div className="text-center space-y-8">
          <span className="inline-block bg-[#2F5DE0] text-white px-12 py-6 rounded-[4px] text-lg font-bold tracking-wider select-none">
            AF
          </span>
          <h1 className="text-xl font-bold text-[#1A1D23] tracking-tight">AssetFlow</h1>
          <p className="text-sm text-[#5B6270]">Enterprise Resource & Asset Management</p>
        </div>

        {error && (
          <div className="p-12 text-xs bg-[#FBEAE9] border border-[#C1352E] text-[#C1352E] rounded-[4px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-16">
          <div className="space-y-8">
            <label className="block text-sm font-medium text-[#5B6270]">Email Address</label>
            <input 
              type="email"
              placeholder="e.g. employee@assetflow.dev"
              className="w-full h-36 px-12 border border-[#DDE1E6] rounded-[6px] bg-white text-sm text-[#1A1D23] placeholder-[#8A909C] transition-colors focus:border-[#2F5DE0] focus:ring-2 focus:ring-[#2F5DE0]/10 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-[#5B6270]">Password</label>
              <Link to="/forgot-password" className="text-xs font-medium text-[#2F5DE0] hover:text-[#274CBD] focus:outline-none focus:underline">
                Forgot password?
              </Link>
            </div>
            <input 
              type="password"
              placeholder="Enter your password"
              className="w-full h-36 px-12 border border-[#DDE1E6] rounded-[6px] bg-white text-sm text-[#1A1D23] placeholder-[#8A909C] transition-colors focus:border-[#2F5DE0] focus:ring-2 focus:ring-[#2F5DE0]/10 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full h-36 mt-8 flex items-center justify-center text-sm font-medium text-white bg-[#2F5DE0] hover:bg-[#274CBD] rounded-[6px] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2F5DE0]/20 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs text-[#5B6270]">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-[#2F5DE0] hover:text-[#274CBD] focus:outline-none focus:underline">
            Request Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
