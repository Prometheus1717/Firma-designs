import { lazy, Suspense, Component, useEffect } from 'react';
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
const BirthDataPage = lazyRetry(() => import('./pages/BirthDataPage'));
const Dashboard = lazyRetry(() => import('./pages/Dashboard'));
const AdminPage = lazyRetry(() => import('./pages/AdminPage'));
const ResetPasswordPage = lazyRetry(() => import('./pages/ResetPasswordPage'));
const LandingPage = lazyRetry(() => import('./pages/LandingPage'));

// Warm the Dashboard chunk only on routes that will likely land there.
// On /landing, /auth, /admin, /reset-password the user is unlikely to hit the
// Dashboard before the chunk loads naturally, so we skip the eager prefetch
// and save ~480 KB of parse work on low-powered devices.
if (typeof window !== 'undefined') {
  const p = window.location.pathname;
  if (p === '/' || p.startsWith('/dashboard') || p.startsWith('/birth-data')) {
    setTimeout(() => import('./pages/Dashboard').catch(() => {}), 1);
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
    } catch {}
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
    } catch {}
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

function AuthRoute({ children }) {
  const { user, loading, hasBirthData } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={hasBirthData ? '/dashboard' : '/'} replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!profile?.is_admin) return <Navigate to="/dashboard" replace />;
  return children;
}

function SmartRedirect() {
  const { user, loading, hasBirthData } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (hasBirthData) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/" replace />;
}

function DemoOrDashboard() {
  const { user, loading, hasBirthData, showBirthDataModal, dismissBirthDataModal, loadProfile } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Dashboard demo />;
  if (hasBirthData) return <Navigate to="/dashboard" replace />;
  return (
    <>
      <Dashboard demo />
      {showBirthDataModal && (
        <BirthDataModal
          onComplete={() => {
            dismissBirthDataModal();
            if (user) loadProfile(user.id);
          }}
          onDismiss={dismissBirthDataModal}
        />
      )}
    </>
  );
}

function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
}

try { sessionStorage.removeItem('nn_err_reloads'); } catch {}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundaryWithLocation>
        <PageViewTracker />
        <AuthProvider>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<DemoOrDashboard />} />
              <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
              <Route path="/birth-data" element={<ProtectedRoute><BirthDataPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
              <Route path="/reset-password" element={<ProtectedRoute><ResetPasswordPage /></ProtectedRoute>} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="*" element={<SmartRedirect />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ErrorBoundaryWithLocation>
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  );
}
