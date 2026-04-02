import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isLightMode, getTheme } from '../lib/theme';

const F = { fontFamily: 'JetBrains Mono, monospace' };

export default function AuthPage() {
  const navigate = useNavigate();
  const light = isLightMode();
  const T = getTheme(light);
  const btnTx = light ? '#FFFFFF' : '#0A1018';
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();

  useEffect(() => {
    document.title = mode === 'login' ? 'Sign In \u2014 Natal Navigator' : mode === 'signup' ? 'Create Account \u2014 Natal Navigator' : 'Reset Password \u2014 Natal Navigator';
  }, [mode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else if (mode === 'signup') {
        const data = await signUp(email, password);
        if (data?.user && !data?.session) {
          setMessage('Account created! Check your email and click the confirmation link, then come back and sign in.');
        }
      } else {
        await resetPassword(email);
        setMessage('Password reset link sent to your email.');
      }
    } catch (err) {
      if (mode === 'login' && /invalid.*credentials/i.test(err.message)) {
        setError('No account found with these credentials. Check your email and password, or sign up to create a new account.');
      } else {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Logo */}
      <header style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1 style={{ ...F, fontSize: 22, fontWeight: 700, color: T.ac, letterSpacing: 6, margin: '0 0 8px' }}>NATAL NAVIGATOR</h1>
        <p style={{ ...F, fontSize: 10, color: T.td, letterSpacing: 2, margin: 0 }}>YOUR PERSONAL ASTROCARTOGRAPHY MAP</p>
      </header>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 400, background: T.p, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 32, position: 'relative' }}>
        <span onClick={() => { window.location.href = '/'; }} style={{ position: 'absolute', top: 14, right: 16, cursor: 'pointer', ...F, fontSize: 18, color: T.td, lineHeight: 1, zIndex: 1 }}>\u2715</span>
        <div style={{ ...F, fontSize: 14, fontWeight: 700, color: T.tx, marginBottom: 20, textAlign: 'center' }}>
          {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Your Account' : 'Reset Password'}
        </div>

        {mode === 'signup' && !message && (
          <div style={{ ...F, fontSize: 10, color: T.td, marginBottom: 16, lineHeight: 1.6, textAlign: 'center' }}>
            Discover which cities on Earth align with your stars.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ ...F, fontSize: 9, color: T.td, letterSpacing: 1, display: 'block', marginBottom: 6 }}>EMAIL</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', background: T.bg, border: `1px solid ${T.bd}`,
              borderRadius: 6, color: T.tx, ...F, fontSize: 13, marginBottom: 16, outline: 'none',
              boxSizing: 'border-box',
            }}
            placeholder="you@example.com"
          />

          {mode !== 'reset' && (
            <>
              <label style={{ ...F, fontSize: 9, color: T.td, letterSpacing: 1, display: 'block', marginBottom: 6 }}>PASSWORD</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', background: T.bg, border: `1px solid ${T.bd}`,
                  borderRadius: 6, color: T.tx, ...F, fontSize: 13, marginBottom: 20, outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder="Min. 6 characters"
              />
            </>
          )}

          {error && (
            <div style={{ ...F, fontSize: 10, color: '#F04060', marginBottom: 12, padding: '10px 12px', background: 'rgba(240,64,96,0.08)', borderRadius: 6, border: '1px solid rgba(240,64,96,0.2)', lineHeight: 1.5 }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ ...F, fontSize: 10, color: T.ac, marginBottom: 12, padding: '10px 12px', background: T.acBg, borderRadius: 6, border: `1px solid ${T.acBd}`, lineHeight: 1.5 }}>
              {message}
            </div>
          )}

          {!message && (
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%', padding: '12px 0', background: submitting ? T.bd : T.ac,
                border: 'none', borderRadius: 6, color: btnTx, ...F, fontSize: 12, fontWeight: 700,
                letterSpacing: 1, cursor: submitting ? 'wait' : 'pointer', transition: 'background .2s',
              }}
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, border: `2px solid ${btnTx}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
                  {mode === 'login' ? 'SIGNING IN...' : 'CREATING ACCOUNT...'}
                </span>
              ) : (
                mode === 'login' ? 'SIGN IN' : mode === 'signup' ? 'CREATE ACCOUNT' : 'SEND RESET LINK'
              )}
            </button>
          )}

          {message && mode === 'signup' && (
            <button
              type="button"
              onClick={() => { setMode('login'); setMessage(''); setError(''); }}
              style={{
                width: '100%', padding: '12px 0', background: T.ac,
                border: 'none', borderRadius: 6, color: btnTx, ...F, fontSize: 12, fontWeight: 700,
                letterSpacing: 1, cursor: 'pointer',
              }}
            >
              GO TO SIGN IN
            </button>
          )}
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', ...F, fontSize: 10 }}>
          {mode === 'login' && (
            <>
              <div
                onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                style={{ display: 'inline-block', padding: '10px 24px', border: `1px solid ${T.ac}`, borderRadius: 6, color: T.ac, cursor: 'pointer', marginBottom: 12, fontWeight: 600, letterSpacing: 1 }}
              >
                NEW HERE? CREATE ACCOUNT
              </div>
              <div>
                <span onClick={() => { setMode('reset'); setError(''); setMessage(''); }} style={{ color: T.td, cursor: 'pointer' }}>Forgot password?</span>
              </div>
            </>
          )}
          {mode === 'signup' && !message && (
            <>
              <span style={{ color: T.td }}>Already have an account? </span>
              <span onClick={() => { setMode('login'); setError(''); setMessage(''); }} style={{ color: T.ac, cursor: 'pointer' }}>Sign in</span>
            </>
          )}
          {mode === 'reset' && (
            <span onClick={() => { setMode('login'); setError(''); setMessage(''); }} style={{ color: T.ac, cursor: 'pointer' }}>\u2190 Back to sign in</span>
          )}
        </div>
      </div>

      <div style={{ ...F, fontSize: 8, color: T.bd, marginTop: 32 }}>NATAL NAVIGATOR \u00A9 2026</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
