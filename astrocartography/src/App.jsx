import { lazy, Suspense, Component, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import BirthDataModal from './components/BirthDataModal';
import { initPostHog, trackPageView } from './lib/posthog';
import { isLightMode, getTheme } from './lib/theme';

initPostHog();

function lazyRetry(fn) {
  return lazy(() => fn().catch(() => new Promise(resolve => {
    setTimeout(() => resolve(fn()), 1500);
  })));
}

const AuthPage = lazyRetry(() => import('./pages/AuthPage'));
const CreatePage = lazyRetry(() => import('./pages/CreatePage'));
const BirthDataPage = lazyRetry(() => import('./pages/BirthDataPage'));
const Dashboard = lazyRetry(() => import('./pages/Dashboard'));
const AdminPage = lazyRetry(() => import('./pages/AdminPage'));
const ResetPasswordPage = lazyRetry(() => import('./pages/ResetPasswordPage'));
const LandingPage = lazyRetry(() => import('./pages/LandingPage'));
const LegalPage = lazyRetry(() => import('./pages/LegalPage'));

// Warm the Dashboard chunk only on routes that will likely land there.
// On /landing, /auth, /admin, /reset-password the user is unlikely to hit the
// Dashboard before the chunk loads naturally, so we skip the eager prefetch
// and save ~480 KB of parse work on low-powered devices.
// '/' serves the LANDING to anonymous visitors since the landing
// consolidation — only signed-in users get redirected into the app. So the
// eager Dashboard prefetch on '/' is gated on an existing Supabase session
// (sb-*-auth-token in localStorage); anonymous landing views skip the ~480 KB.
if (typeof window !== 'undefined') {
  const p = window.location.pathname;
  const hasSession = (() => {
    try {
      return Object.keys(window.localStorage).some(k => k.startsWith('sb-') && k.includes('auth-token'));
    } catch { return false; }
  })();
  if ((p === '/' && hasSession) || p.startsWith('/dashboard') || p.startsWith('/birth-data')) {
    setTimeout(() => import('./pages/Dashboard').catch(() => {}), 1);
  }
  // Anonymous visitors on '/' render the LandingPage. Kick its lazy chunk off
  // NOW, in parallel with React bootstrapping, instead of waiting for the
  // first render to discover it — removes one full network round-trip from
  // the landing's LCP chain. lazy() reuses the same in-flight module promise.
  if (p === '/' && !hasSession) {
    import('./pages/LandingPage').catch(() => {});
  }
}

const F = { fontFamily: 'JetBrains Mono, monospace' };

function LoadingScreen() {
  const T = getTheme(isLightMode());
  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...F, fontSize: 16, fontWeight: 700, color: T.ac, letterSpacing: 5, marginBottom: 20 }}>NATAL NAVIGATOR</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: T.ac,
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}

// Shown when loadProfile exhausted its 5-attempt retry loop and we still
// have no profile data. We DO NOT route the user anywhere in this case —
// any default destination would be wrong (a paying user on the paywall, an
// admin on the demo, etc.). The user explicitly retries or signs out; no
// silent degradation is allowed.
function ProfileRecoveryScreen({ user }) {
  const T = getTheme(isLightMode());
  const { loadProfile, signOut } = useAuth();
  const [retrying, setRetrying] = useState(false);
  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ ...F, fontSize: 16, fontWeight: 700, color: T.ac, letterSpacing: 5, marginBottom: 28 }}>NATAL NAVIGATOR</div>
      <div style={{ ...F, fontSize: 12, color: T.tx, marginBottom: 10, textAlign: 'center', maxWidth: 380, lineHeight: 1.6 }}>
        We could not load your account right now.
      </div>
      <div style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 13, color: T.td, marginBottom: 28, textAlign: 'center', maxWidth: 380, lineHeight: 1.6 }}>
        This is usually a brief network hiccup. Your data is safe — we just need to fetch it again.
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={async () => {
            if (retrying || !user?.id) return;
            setRetrying(true);
            try { await loadProfile(user.id); }
            finally { setRetrying(false); }
          }}
          disabled={retrying}
          style={{ ...F, fontSize: 11, fontWeight: 700, letterSpacing: 1, color: T.bg, background: T.ac, border: 'none', borderRadius: 6, padding: '10px 26px', cursor: retrying ? 'wait' : 'pointer' }}
        >
          {retrying ? 'RETRYING…' : 'TRY AGAIN'}
        </button>
        <button
          onClick={() => { signOut(); }}
          style={{ ...F, fontSize: 11, color: T.td, background: 'transparent', border: `1px solid ${T.bd}`, borderRadius: 6, padding: '10px 22px', cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, reloading: false };
  }
  static getDerivedStateFromError(error) {
    try {
      const key = 'nn_err_reloads';
      const count = parseInt(sessionStorage.getItem(key) || '0', 10);
      if (count < 2) {
        return { error, reloading: true };
      }
    } catch {
      // Storage may be unavailable; fall through to the normal error screen.
    }
    return { error, reloading: false };
  }
  componentDidCatch() {
    try {
      const key = 'nn_err_reloads';
      const count = parseInt(sessionStorage.getItem(key) || '0', 10);
      if (count < 2) {
        sessionStorage.setItem(key, String(count + 1));
        window.location.reload();
        return;
      }
      sessionStorage.removeItem(key);
    } catch {
      // Storage may be unavailable; the error boundary still renders safely.
    }
  }
  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.locationKey !== this.props.locationKey) {
      this.setState({ error: null, reloading: false });
    }
  }
  render() {
    if (this.state.error) {
      const light = isLightMode();
      const T = getTheme(light);
      if (this.state.reloading) {
        return (
          <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ ...F, fontSize: 16, fontWeight: 700, color: T.ac, letterSpacing: 5, marginBottom: 20 }}>NATAL NAVIGATOR</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: T.ac,
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
            <style>{`@keyframes pulse { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
          </div>
        );
      }
      return (
        <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ ...F, fontSize: 16, fontWeight: 700, color: T.ac, letterSpacing: 5, marginBottom: 20 }}>NATAL NAVIGATOR</div>
          <div style={{ ...F, fontSize: 12, color: '#F04060', marginBottom: 12 }}>Something went wrong</div>
          <div style={{ ...F, fontSize: 10, color: T.td, marginBottom: 20, maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => { window.location.reload(); }}
              style={{ ...F, fontSize: 11, color: T.ac, background: 'transparent', border: `1px solid ${T.ac}`, borderRadius: 6, padding: '10px 24px', cursor: 'pointer' }}
            >
              Try Again
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              style={{ ...F, fontSize: 11, color: T.td, background: 'transparent', border: `1px solid ${T.bd}`, borderRadius: 6, padding: '10px 24px', cursor: 'pointer' }}
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ErrorBoundaryWithLocation({ children }) {
  const location = useLocation();
  return <ErrorBoundary locationKey={location.key}>{children}</ErrorBoundary>;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

// All four route guards below MUST defer their is_admin / hasBirthData
// decision until the profile fetch has actually resolved. The previous
// implementation evaluated `profile?.is_admin` on the very first render
// after sign-in or page-load, while loadProfile was still in flight. The
// nullish chain made admin look like a non-admin → Navigate('/') → demo +
// BirthDataModal trap, even though the database row was correct. The
// `profileResolved` flag flips true after the first lookup completes
// (success or fail) or after a 2.5 s backstop, so guards either wait for
// the truth or fall through safely.
// Routing matrix — three signed-in states, one anonymous state, ZERO mixed
// demo-for-logged-in users. The previous design (demo + modal + "Enter
// birth data" button) repeatedly produced UX confusion and race conditions.
// Now every signed-in user lands on exactly one focused page:
//
//   admin            -> /admin
//   has birth data   -> /dashboard (real globe + chart)
//   no birth data    -> /birth-data (full-page setup form)
//   anonymous        -> / (demo dashboard with sample chart)
//
// The demo dashboard is reserved for anonymous visitors. Signed-in users
// never see it. This eliminates the "why am I seeing Elon Musk's chart"
// trap and removes the entire class of bugs around the welcome modal.
// FLOW: birth data FIRST, paywall AFTER. A signed-in user without a chart is
// sent to /birth-data regardless of payment status; only once they have a chart
// do they land on /dashboard, where `showPaywall` gates the *content* (not the
// birth-data entry). Do NOT re-add a `requiresPayment -> /dashboard` short
// circuit here: that traps paid users on the paywall (stale is_premium cache)
// and blocks unpaid users from ever entering their birth data.
function AuthRoute({ children }) {
  const { user, profile, profileResolved, isAdminKnown, loading, hasBirthData } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user && isAdminKnown) return <Navigate to="/admin" replace />;
  if (user && !profile && !profileResolved) return <LoadingScreen />;
  if (user) return <Navigate to={hasBirthData ? '/dashboard' : '/birth-data'} replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, profile, profileResolved, isAdminKnown, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (isAdminKnown) return children;
  if (!profile && !profileResolved) return <LoadingScreen />;
  if (!profile?.is_admin) return <Navigate to="/dashboard" replace />;
  return children;
}

function SmartRedirect() {
  const { user, profile, profileResolved, isAdminKnown, loading, hasBirthData } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (isAdminKnown) return <Navigate to="/admin" replace />;
  if (!profile && !profileResolved) return <LoadingScreen />;
  // Birth data first: users without a chart go to /birth-data even if unpaid.
  if (hasBirthData) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/birth-data" replace />;
}

// natalnavigator.com is the marketing landing page: anonymous visitors at "/"
// get the LandingPage, and the live web app lives at "/demo" (also embedded
// into the landing via an iframe).
// The iframe that embeds the live demo loads "/demo?embed=1". Once that embedded
// app navigates internally (brand logo, connect menu, etc.) the query string is
// lost, so a naive ?embed=1 check would then render the landing page nested
// inside its own demo window. We pin the embedded state to this browsing
// context's sessionStorage the first time we see ?embed=1: the demo iframe is a
// separate context from the top-level landing, so the flag stays set across the
// iframe's internal navigations and never leaks to the real landing page (nor to
// preview tools that merely frame the landing without ?embed=1).
const EMBED_FLAG = 'nn_embedded_demo';
export function isEmbeddedDemoRequest() {
  // The persisted flag is only meaningful inside the landing page's iframe.
  // A visitor can otherwise carry it into a normal top-level "/" navigation
  // in the same tab and incorrectly get the demo dashboard instead of the
  // marketing landing page.
  let isFramed = false;
  try {
    isFramed = window.self !== window.top;
  } catch {
    // Cross-origin frame access can throw in hardened browsers. Treat that as
    // framed; a real top-level window never throws while comparing self/top.
    isFramed = true;
  }
  if (!isFramed) {
    try { window.sessionStorage.removeItem(EMBED_FLAG); } catch { /* storage blocked */ }
    return false;
  }

  try {
    if (new URLSearchParams(window.location.search).get('embed') === '1') {
      try { window.sessionStorage.setItem(EMBED_FLAG, '1'); } catch { /* storage blocked */ }
      return true;
    }
  } catch {
    // URLSearchParams unavailable — fall through to the persisted flag.
  }
  try {
    return window.sessionStorage.getItem(EMBED_FLAG) === '1';
  } catch {
    return false;
  }
}

function DemoOrDashboard() {
  const { user, profile, profileResolved, isAdminKnown, loading, hasBirthData } = useAuth();
  if (loading) return <LoadingScreen />;
  // Anonymous visitors → marketing landing page at "/". The live demo lives at
  // "/demo" and is embedded into the landing via an iframe; if that embedded
  // app ever navigates back to "/", keep rendering the demo instead of nesting
  // the landing page inside itself.
  if (!user) return isEmbeddedDemoRequest() ? <Dashboard demo /> : <LandingPage />;
  if (isAdminKnown) return <Navigate to="/admin" replace />;
  if (!profile && !profileResolved) return <LoadingScreen />;
  // Birth data first: a user with a chart lands on the dashboard (where the
  // paywall gates the content for non-premium). Without a chart → setup page.
  if (hasBirthData) return <Dashboard />;
  return <Navigate to="/birth-data" replace />;
}

function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
}

function ErrorReloadCleanup() {
  // Clear the reload-attempt counter only AFTER a successful first render
  // (we got past the boundary). Doing this at module load — as we used to —
  // reset the counter on every reload triggered by the boundary, so an
  // intermittent boot error could trigger an unbounded reload chain instead
  // of the intended 2-attempt cap.
  useEffect(() => {
    const id = setTimeout(() => {
      try { sessionStorage.removeItem('nn_err_reloads'); } catch {
        // Storage may be unavailable; this cleanup is best effort.
      }
    }, 3000);
    return () => clearTimeout(id);
  }, []);
  return null;
}

// Global gate: when the user is logged in but the robust profile fetcher
// gave up after 5 retries, show the recovery screen on TOP of every route.
// This is the one place that makes "we have no profile" a UI state instead
// of letting the routing decide. Critical for paywall correctness: a paid
// user must NEVER be routed back through billing UI just because a single
// network blip swallowed their profile fetch.
function GlobalProfileGate({ children }) {
  const { user, profile, profileLoadFailed, loading } = useAuth();
  // Only intercept if: user is logged in, retry truly exhausted, and we
  // don't even have a stale cached profile to fall back on. /landing,
  // /reset-password etc. still render normally for anonymous traffic.
  if (!loading && user && profileLoadFailed && !profile) {
    return <ProfileRecoveryScreen user={user} />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundaryWithLocation>
        <ErrorReloadCleanup />
        <PageViewTracker />
        <AuthProvider>
          <Suspense fallback={<LoadingScreen />}>
            <GlobalProfileGate>
              <Routes>
                <Route path="/" element={<DemoOrDashboard />} />
                <Route path="/demo" element={<Dashboard demo />} />
                {/* Purchase funnel: /create is the anonymous order form (birth
                    data → straight to Stripe checkout; nothing personalised is
                    rendered before payment). /result is the delivery page a
                    buyer returns to — it server-verifies the checkout session
                    and then shows their full map; unpaid visitors are sent
                    back to /create. Both public. */}
                <Route path="/create" element={<CreatePage />} />
                <Route path="/result" element={<Dashboard teaser />} />
                <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
                <Route path="/birth-data" element={<ProtectedRoute><BirthDataPage /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                <Route path="/reset-password" element={<ProtectedRoute><ResetPasswordPage /></ProtectedRoute>} />
                {/* Stable landing preview: always renders the marketing page,
                    even when signed in, so it can be reviewed without being
                    bounced to the dashboard. noindex (vercel.json) keeps it from
                    competing with "/" for ranking. */}
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/impressum" element={<LegalPage doc="impressum" />} />
                <Route path="/datenschutz" element={<LegalPage doc="datenschutz" />} />
                <Route path="/agb" element={<LegalPage doc="agb" />} />
                <Route path="/widerruf" element={<LegalPage doc="widerruf" />} />
                <Route path="/kontakt" element={<LegalPage doc="kontakt" />} />
                <Route path="*" element={<SmartRedirect />} />
              </Routes>
            </GlobalProfileGate>
          </Suspense>
        </AuthProvider>
      </ErrorBoundaryWithLocation>
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  );
}
