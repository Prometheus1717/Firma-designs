import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const F = { fontFamily: 'JetBrains Mono, monospace' };

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        // AuthRoute detects user and redirects automatically
      } else if (mode === 'signup') {
        const data = await signUp(email, password);
        // If email confirmation is required, user won't have a session yet
        if (data?.user && !data?.session) {
          setMessage('Account created! Check your email and click the confirmation link, then come back and sign in.');
        }
        // If auto-confirmed, AuthRoute will redirect automatically
      } else {
        await resetPassword(email);
        setMessage('Password reset link sent to your email.');
      }
    } catch (err) {
      // Supabase returns generic "Invalid login credentials" for wrong email OR password.
      // Make it actionable so users know they may need to sign up first.
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
    <div style={{ minHeight: '100vh', background: '#0A1018', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ ...F, fontSize: 22, fontWeight: 700, color: '#00D88A', letterSpacing: 6, marginBottom: 8 }}>NATAL NAVIGATOR</div>
        <div style={{ ...F, fontSize: 10, color: '#5A7088', letterSpacing: 2 }}>YOUR PERSONAL ASTROCARTOGRAPHY MAP</div>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 400, background: '#0D1520', border: '1px solid #1A2840', borderRadius: 12, padding: 32, position: 'relative' }}>
        <span onClick={() => { window.location.href = '/'; }} style={{ position: 'absolute', top: 14, right: 16, cursor: 'pointer', ...F, fontSize: 18, color: '#5A7088', lineHeight: 1, zIndex: 1 }}>✕</span>
        <div style={{ ...F, fontSize: 14, fontWeight: 700, color: '#D0DDE8', marginBottom: 20, textAlign: 'center' }}>
          {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Your Account' : 'Reset Password'}
        </div>

        {mode === 'signup' && !message && (
          <div style={{ ...F, fontSize: 10, color: '#5A7088', marginBottom: 16, lineHeight: 1.6, textAlign: 'center' }}>
            Discover which cities on Earth align with your stars.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ ...F, fontSize: 9, color: '#5A7088', letterSpacing: 1, display: 'block', marginBottom: 6 }}>EMAIL</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', background: '#0A1018', border: '1px solid #1A2840',
              borderRadius: 6, color: '#D0DDE8', ...F, fontSize: 13, marginBottom: 16, outline: 'none',
              boxSizing: 'border-box',
            }}
            placeholder="you@example.com"
          />

          {mode !== 'reset' && (
            <>
              <label style={{ ...F, fontSize: 9, color: '#5A7088', letterSpacing: 1, display: 'block', marginBottom: 6 }}>PASSWORD</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', background: '#0A1018', border: '1px solid #1A2840',
                  borderRadius: 6, color: '#D0DDE8', ...F, fontSize: 13, marginBottom: 20, outline: 'none',
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
            <div style={{ ...F, fontSize: 10, color: '#00D88A', marginBottom: 12, padding: '10px 12px', background: 'rgba(0,216,138,0.08)', borderRadius: 6, border: '1px solid rgba(0,216,138,0.2)', lineHeight: 1.5 }}>
              {message}
            </div>
          )}

          {!message && (
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%', padding: '12px 0', background: submitting ? '#1A2840' : '#00D88A',
                border: 'none', borderRadius: 6, color: '#0A1018', ...F, fontSize: 12, fontWeight: 700,
                letterSpacing: 1, cursor: submitting ? 'wait' : 'pointer', transition: 'background .2s',
              }}
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #0A1018', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
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
                width: '100%', padding: '12px 0', background: '#00D88A',
                border: 'none', borderRadius: 6, color: '#0A1018', ...F, fontSize: 12, fontWeight: 700,
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
                style={{ display: 'inline-block', padding: '10px 24px', border: '1px solid #00D88A', borderRadius: 6, color: '#00D88A', cursor: 'pointer', marginBottom: 12, fontWeight: 600, letterSpacing: 1 }}
              >
                NEW HERE? CREATE ACCOUNT
              </div>
              <div>
                <span onClick={() => { setMode('reset'); setError(''); setMessage(''); }} style={{ color: '#5A7088', cursor: 'pointer' }}>Forgot password?</span>
              </div>
            </>
          )}
          {mode === 'signup' && !message && (
            <>
              <span style={{ color: '#5A7088' }}>Already have an account? </span>
              <span onClick={() => { setMode('login'); setError(''); setMessage(''); }} style={{ color: '#00D88A', cursor: 'pointer' }}>Sign in</span>
            </>
          )}
          {mode === 'reset' && (
            <span onClick={() => { setMode('login'); setError(''); setMessage(''); }} style={{ color: '#00D88A', cursor: 'pointer' }}>← Back to sign in</span>
          )}
        </div>
      </div>

      <div style={{ ...F, fontSize: 8, color: '#1A2840', marginTop: 32 }}>NATAL NAVIGATOR © 2026</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
