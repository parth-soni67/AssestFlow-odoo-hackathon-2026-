import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    try {
      setError('');
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      login(res.data.accessToken, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ?? 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    /*
     * Full-screen sky backdrop — soft blue-to-white gradient with two
     * decorative blurred cloud shapes, matching the reference image.
     */
    <div
      className="min-h-screen w-screen flex items-center justify-center overflow-hidden relative font-sans"
      style={{ background: 'linear-gradient(160deg, #c9e8f5 0%, #ddf0fa 35%, #eef8fd 60%, #f5fcff 100%)' }}
    >
      {/* ── Decorative cloud blobs ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-60px',
          left: '-80px',
          width: '520px',
          height: '260px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.72)',
          filter: 'blur(28px)',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-40px',
          right: '-60px',
          width: '460px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.65)',
          filter: 'blur(24px)',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '15%',
          left: '-120px',
          width: '340px',
          height: '140px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.50)',
          filter: 'blur(20px)',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '8%',
          right: '-80px',
          width: '300px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.45)',
          filter: 'blur(18px)',
        }}
      />

      {/* ── Glass card ── */}
      <div
        className="relative z-10 w-full animate-scale-up"
        style={{ maxWidth: '380px', margin: '0 16px' }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.85)',
            boxShadow: '0 8px 40px 0 rgba(100,160,200,0.18), 0 1px 0 0 rgba(255,255,255,0.9) inset',
            padding: '36px 32px 32px',
          }}
        >
          {/* Icon badge */}
          <div className="flex justify-center mb-5">
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LogIn size={22} color="#1a1d23" strokeWidth={1.75} />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a1d23', marginBottom: '6px' }}>
              Sign in to AssetFlow
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.5 }}>
              Enterprise asset &amp; resource management
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 12px',
                background: 'rgba(193,53,46,0.08)',
                border: '1px solid rgba(193,53,46,0.25)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#c1352e',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Email field */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255,255,255,0.80)',
                border: '1px solid rgba(210,225,235,0.9)',
                borderRadius: '10px',
                padding: '0 14px',
                height: '44px',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocusCapture={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#2F5DE0';
                (e.currentTarget as HTMLElement).style.boxShadow  = '0 0 0 3px rgba(47,93,224,0.12)';
              }}
              onBlurCapture={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(210,225,235,0.9)';
                (e.currentTarget as HTMLElement).style.boxShadow  = 'none';
              }}
            >
              <Mail size={15} color="#9ca3af" strokeWidth={1.75} style={{ flexShrink: 0 }} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                required
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '0.85rem',
                  color: '#1a1d23',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Password field */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255,255,255,0.80)',
                border: '1px solid rgba(210,225,235,0.9)',
                borderRadius: '10px',
                padding: '0 14px',
                height: '44px',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocusCapture={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#2F5DE0';
                (e.currentTarget as HTMLElement).style.boxShadow  = '0 0 0 3px rgba(47,93,224,0.12)';
              }}
              onBlurCapture={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(210,225,235,0.9)';
                (e.currentTarget as HTMLElement).style.boxShadow  = 'none';
              }}
            >
              <Lock size={15} color="#9ca3af" strokeWidth={1.75} style={{ flexShrink: 0 }} />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                required
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '0.85rem',
                  color: '#1a1d23',
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                tabIndex={-1}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0, flexShrink: 0 }}
              >
                {showPw
                  ? <EyeOff size={15} color="#9ca3af" strokeWidth={1.75} />
                  : <Eye    size={15} color="#9ca3af" strokeWidth={1.75} />
                }
              </button>
            </div>

            {/* Forgot password — right-aligned */}
            <div style={{ textAlign: 'right', marginTop: '-4px' }}>
              <Link
                to="/forgot-password"
                style={{ fontSize: '0.75rem', color: '#5b6270', textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#2F5DE0')}
                onMouseLeave={e => (e.currentTarget.style.color = '#5b6270')}
              >
                Forgot password?
              </Link>
            </div>

            {/* CTA — dark pill button like the reference */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '4px',
                height: '44px',
                width: '100%',
                background: loading ? '#374151' : '#1a1d23',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s, transform 0.1s',
                fontFamily: 'inherit',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#2F5DE0'; }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#1a1d23'; }}
              onMouseDown={e =>  { (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)'; }}
              onMouseUp={e =>    { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.78rem', color: '#6b7280' }}>
            Don't have an account?{' '}
            <Link
              to="/signup"
              style={{ color: '#2F5DE0', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
