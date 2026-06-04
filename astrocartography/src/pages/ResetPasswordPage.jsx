import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { isLightMode, getTheme } from '../lib/theme';

const F = { fontFamily: 'JetBrains Mono, monospace' };

export default function ResetPasswordPage() {
  useEffect(() => { document.title = 'Reset Password \u2014 Natal Navigator'; }, []);
  const light = isLightMode();
  const T = getTheme(light);
  const btnTx = light ? '#FFFFFF' : '#0A1018';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 10) { setError('Password must be at least 10 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setSubmitting(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <header style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1 style={{ ...F, fontSize: 22, fontWeight: 700, color: T.ac, letterSpacing: 6, margin: '0 0 8px' }}>NATAL NAVIGATOR</h1>
        <p style={{ ...F, fontSize: 10, color: T.td, letterSpacing: 2, margin: 0 }}>RESET YOUR PASSWORD</p>
      </header>

      <div style={{ width: '100%', maxWidth: 400, background: T.p, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 32 }}>
        {done ? (
          <>
            <div style={{ ...F, fontSize: 12, color: T.ac, marginBottom: 16, textAlign: 'center', lineHeight: 1.6 }}>
              Password updated successfully!
            </div>
            <button
              onClick={() => { window.location.href = '/dashboard'; }}
              style={{ width: '100%', padding: '12px 0', background: T.ac, border: 'none', borderRadius: 6, color: btnTx, ...F, fontSize: 12, fontWeight: 700, letterSpacing: 1, cursor: 'pointer' }}
            >
              GO TO DASHBOARD
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ ...F, fontSize: 14, fontWeight: 700, color: T.tx, marginBottom: 20, textAlign: 'center' }}>
              Choose a New Password
            </div>

            <label style={{ ...F, fontSize: 9, color: T.td, letterSpacing: 1, display: 'block', marginBottom: 6 }}>NEW PASSWORD</label>
            <input
              type="password"
              required
              minLength={10}
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 6, color: T.tx, ...F, fontSize: 13, marginBottom: 16, outline: 'none', boxSizing: 'border-box' }}
              placeholder="Min. 10 characters"
            />

            <label style={{ ...F, fontSize: 9, color: T.td, letterSpacing: 1, display: 'block', marginBottom: 6 }}>CONFIRM PASSWORD</label>
            <input
              type="password"
              required
              minLength={10}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 6, color: T.tx, ...F, fontSize: 13, marginBottom: 20, outline: 'none', boxSizing: 'border-box' }}
              placeholder="Repeat password"
            />

            {error && (
              <div style={{ ...F, fontSize: 10, color: '#F04060', marginBottom: 12, padding: '10px 12px', background: 'rgba(240,64,96,0.08)', borderRadius: 6, border: '1px solid rgba(240,64,96,0.2)', lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{ width: '100%', padding: '12px 0', background: submitting ? T.bd : T.ac, border: 'none', borderRadius: 6, color: btnTx, ...F, fontSize: 12, fontWeight: 700, letterSpacing: 1, cursor: submitting ? 'wait' : 'pointer' }}
            >
              {submitting ? 'UPDATING...' : 'UPDATE PASSWORD'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
