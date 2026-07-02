import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isLightMode, getTheme } from '../lib/theme';
import { t, getLang } from '../lib/i18n';
import { useMobileFormViewport } from '../lib/mobileFormViewport';

const F = { fontFamily: 'JetBrains Mono, monospace' };

export default function AuthPage() {
  const navigate = useNavigate();
  const light = isLightMode();
  const T = getTheme(light);
  const btnTx = light ? '#FFFFFF' : '#0A1018';
  // New / first-time visitors land on the register form so they can sign up in
  // one step (better conversion into the purchase flow). Returning users — those
  // who have signed in on this device before (nn_returning flag, set in useAuth)
  // — get the familiar "Welcome back" login. An explicit ?mode=signup|login in
  // the URL always wins.
  const [mode, setMode] = useState(() => {
    try {
      const m = new URLSearchParams(window.location.search).get('mode');
      if (m === 'signup' || m === 'login') return m;
      if (localStorage.getItem('nn_returning') === '1') return 'login';
    } catch { /* storage/URL unavailable — fall through */ }
    return 'signup';
  });
  // The welcome email's "Open my map" button links here with ?email= so the
  // buyer only has to tap the login-link button — no typing on any device.
  const [email, setEmail] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('email') || '';
    } catch { return ''; }
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Passwordless is the default sign-in: guest buyers get their account
  // provisioned at checkout and never set a password, so "email me a login
  // link" must be the primary path. The password form stays one tap away for
  // everyone who prefers one.
  const [usePassword, setUsePassword] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const lang = getLang();
  const { containerRef, scrollFocusedField } = useMobileFormViewport();

  useEffect(() => {
    document.title = mode === 'login' ? 'Sign In \u2014 Natal Navigator' : mode === 'signup' ? 'Create Account \u2014 Natal Navigator' : 'Reset Password \u2014 Natal Navigator';
  }, [mode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      if (mode === 'signup' && password.length < 10) {
        // Belt-and-braces check — the minLength HTML attribute can be tampered
        // with via devtools. Supabase server-side enforces its own minimum
        // (configurable in dashboard), but we standardise on 10 client-side.
        throw new Error(t('passwordTooShort', lang) || 'Password must be at least 10 characters.');
      }
      if (mode === 'login' && !usePassword) {
        // Magic-link login: an email with a one-tap link, no password involved.
        // shouldCreateUser=false so a typo'd email cannot silently create an
        // empty account — it errors instead, and we point to sign-up.
        const { supabase } = await import('../lib/supabase');
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          email: email.trim().toLowerCase(),
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            shouldCreateUser: false,
          },
        });
        if (otpErr) {
          if (/signups? not allowed/i.test(otpErr.message)) {
            throw new Error(t('noAccountForEmail', lang));
          }
          throw otpErr;
        }
        setMessage(t('loginLinkSent', lang));
      } else if (mode === 'login') {
        await signIn(email, password);
      } else if (mode === 'signup') {
        const data = await signUp(email, password);
        if (data?.user && !data?.session) {
          setMessage(t('accountCreated', lang));
        }
      } else {
        await resetPassword(email);
        setMessage(t('resetLinkSent', lang));
      }
    } catch (err) {
      if (mode === 'login' && /invalid.*credentials/i.test(err.message)) {
        setError(t('invalidCredentials', lang));
      } else {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      ref={containerRef}
      className="nn-form-shell nn-auth-shell"
      style={{
        height: 'var(--app-height, 100dvh)',
        minHeight: 'var(--app-height, 100dvh)',
        background: T.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        boxSizing: 'border-box',
      }}
    >
      {/* Logo */}
      <header className="nn-auth-header" style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1 style={{ ...F, fontSize: 22, fontWeight: 700, color: T.ac, letterSpacing: 6, margin: '0 0 8px' }}>NATAL NAVIGATOR</h1>
        <p style={{ ...F, fontSize: 10, color: T.td, letterSpacing: 2, margin: 0 }}>YOUR PERSONAL ASTROCARTOGRAPHY MAP</p>
      </header>

      {/* Card */}
      <div className="nn-auth-card" style={{ width: '100%', maxWidth: 400, background: T.p, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 32, position: 'relative', boxSizing: 'border-box' }}>
        <span onClick={() => navigate('/')} style={{ position: 'absolute', top: 14, right: 16, cursor: 'pointer', ...F, fontSize: 18, color: T.td, lineHeight: 1, zIndex: 1 }}>{'✕'}</span>
        <div style={{ ...F, fontSize: 14, fontWeight: 700, color: T.tx, marginBottom: 20, textAlign: 'center' }}>
          {mode === 'login' ? t('welcomeBack', lang) : mode === 'signup' ? t('createAccount', lang) : t('resetPassword', lang)}
        </div>

        {mode === 'signup' && !message && (
          <div style={{ ...F, fontSize: 10, color: T.td, marginBottom: 16, lineHeight: 1.6, textAlign: 'center' }}>
            {t('discoverCities', lang)}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ ...F, fontSize: 9, color: T.td, letterSpacing: 1, display: 'block', marginBottom: 6 }}>{t('emailLabel', lang)}</label>
          <input
            className="nn-form-input"
            type="email"
            autoComplete={mode === 'login' ? 'username' : 'email'}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="email"
            required
            value={email}
            onFocus={scrollFocusedField}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', background: T.bg, border: `1px solid ${T.bd}`,
              borderRadius: 6, color: T.tx, ...F, fontSize: 16, marginBottom: 16, outline: 'none',
              boxSizing: 'border-box',
            }}
            placeholder={t('emailPlaceholder', lang)}
          />

          {mode !== 'reset' && (mode !== 'login' || usePassword) && (
            <>
              <label style={{ ...F, fontSize: 9, color: T.td, letterSpacing: 1, display: 'block', marginBottom: 6 }}>{t('passwordLabel', lang)}</label>
              <input
                className="nn-form-input"
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                minLength={10}
                value={password}
                onFocus={scrollFocusedField}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', background: T.bg, border: `1px solid ${T.bd}`,
                  borderRadius: 6, color: T.tx, ...F, fontSize: 16, marginBottom: 20, outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder={t('passwordPlaceholder', lang)}
              />
            </>
          )}
          {mode === 'login' && !usePassword && !message && (
            <div style={{ ...F, fontSize: 10, color: T.td, marginBottom: 16, lineHeight: 1.6, textAlign: 'center' }}>
              {t('loginLinkHint', lang)}
            </div>
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
                  {mode === 'login' ? (usePassword ? t('signingIn', lang) : t('sendingLoginLink', lang)) : t('creatingAccount', lang)}
                </span>
              ) : (
                mode === 'login' ? (usePassword ? t('signInBtn', lang) : t('emailLoginLink', lang)) : mode === 'signup' ? t('createAccountBtn', lang) : t('sendResetLink', lang)
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
              {t('goToSignIn', lang)}
            </button>
          )}
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', ...F, fontSize: 10 }}>
          {mode === 'login' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <span
                  onClick={() => { setUsePassword(v => !v); setError(''); setMessage(''); }}
                  style={{ color: T.ac, cursor: 'pointer' }}
                >
                  {usePassword ? t('useLoginLinkInstead', lang) : t('usePasswordInstead', lang)}
                </span>
              </div>
              <div
                onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                style={{ display: 'inline-block', padding: '10px 24px', border: `1px solid ${T.ac}`, borderRadius: 6, color: T.ac, cursor: 'pointer', marginBottom: 12, fontWeight: 600, letterSpacing: 1 }}
              >
                {t('newHere', lang)}
              </div>
              {usePassword && (
                <div>
                  <span onClick={() => { setMode('reset'); setError(''); setMessage(''); }} style={{ color: T.td, cursor: 'pointer' }}>{t('forgotPassword', lang)}</span>
                </div>
              )}
            </>
          )}
          {mode === 'signup' && !message && (
            <>
              <span style={{ color: T.td }}>{t('alreadyHaveAccount', lang)} </span>
              <span onClick={() => { setMode('login'); setError(''); setMessage(''); }} style={{ color: T.ac, cursor: 'pointer' }}>{t('signInLink', lang)}</span>
            </>
          )}
          {mode === 'reset' && (
            <span onClick={() => { setMode('login'); setError(''); setMessage(''); }} style={{ color: T.ac, cursor: 'pointer' }}>{t('backToSignIn', lang)}</span>
          )}
        </div>
      </div>

      <div style={{ ...F, fontSize: 8, color: T.bd, marginTop: 32 }}>NATAL NAVIGATOR {'©'} 2026</div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .nn-form-input {
          min-height: 48px;
          caret-color: ${T.ac};
          -webkit-text-size-adjust: 100%;
          -webkit-appearance: none;
          appearance: none;
        }
        .nn-form-input:-webkit-autofill {
          -webkit-text-fill-color: ${T.tx};
          box-shadow: 0 0 0 1000px ${T.bg} inset;
          transition: background-color 999999s ease-out;
        }
        @media (max-width: 640px) {
          .nn-auth-shell {
            justify-content: flex-start !important;
            padding-top: max(44px, calc(env(safe-area-inset-top) + 36px)) !important;
            padding-bottom: calc(260px + env(safe-area-inset-bottom) + var(--keyboard-inset, 0px)) !important;
            scroll-padding-top: 28px;
            scroll-padding-bottom: calc(260px + env(safe-area-inset-bottom));
          }
          .nn-auth-header {
            margin-bottom: 28px !important;
          }
          .nn-auth-card {
            padding: 28px 20px !important;
          }
        }
      `}</style>
    </main>
  );
}
