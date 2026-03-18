import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const F = { fontFamily: 'JetBrains Mono, monospace' };

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // login | signup | reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        navigate('/dashboard');
      } else if (mode === 'signup') {
        await signUp(email, password);
        setMessage('Check your email to confirm your account.');
        setMode('login');
      } else {
        await resetPassword(email);
        setMessage('Password reset link sent to your email.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A1018', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ ...F, fontSize: 18, fontWeight: 700, color: '#00D88A', letterSpacing: 6, marginBottom: 8 }}>NATAL NAVIGATOR</div>
        <div style={{ ...F, fontSize: 10, color: '#5A7088', letterSpacing: 2 }}>ASTROCARTOGRAPHY · PERSONALIZED</div>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 400, background: '#0D1520', border: '1px solid #1A2840', borderRadius: 12, padding: 32 }}>
        <div style={{ ...F, fontSize: 14, fontWeight: 700, color: '#D0DDE8', marginBottom: 24, textAlign: 'center' }}>
          {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
        </div>

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
                placeholder="••••••••"
              />
            </>
          )}

          {error && <div style={{ ...F, fontSize: 10, color: '#F04060', marginBottom: 12, padding: '8px 10px', background: '#F0406010', borderRadius: 4 }}>{error}</div>}
          {message && <div style={{ ...F, fontSize: 10, color: '#00D88A', marginBottom: 12, padding: '8px 10px', background: '#00D88A10', borderRadius: 4 }}>{message}</div>}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '12px 0', background: submitting ? '#1A2840' : '#00D88A',
              border: 'none', borderRadius: 6, color: '#0A1018', ...F, fontSize: 12, fontWeight: 700,
              letterSpacing: 1, cursor: submitting ? 'wait' : 'pointer', transition: 'background .2s',
            }}
          >
            {submitting ? '...' : mode === 'login' ? 'SIGN IN' : mode === 'signup' ? 'CREATE ACCOUNT' : 'SEND RESET LINK'}
          </button>
        </form>

        {/* Toggle links */}
        <div style={{ marginTop: 20, textAlign: 'center', ...F, fontSize: 10 }}>
          {mode === 'login' && (
            <>
              <span style={{ color: '#5A7088' }}>No account? </span>
              <span onClick={() => { setMode('signup'); setError(''); setMessage(''); }} style={{ color: '#00D88A', cursor: 'pointer' }}>Sign up</span>
              <span style={{ color: '#1A2840', margin: '0 8px' }}>|</span>
              <span onClick={() => { setMode('reset'); setError(''); setMessage(''); }} style={{ color: '#5A7088', cursor: 'pointer' }}>Forgot password?</span>
            </>
          )}
          {mode === 'signup' && (
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
    </div>
  );
}
