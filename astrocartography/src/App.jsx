import { lazy, Suspense, Component, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import BirthDataModal from './components/BirthDataModal';
import { initPostHog, trackPageView } from './lib/posthog';

// Initialize PostHog on app load
initPostHog();

// Lazy imports with retry — if chunk fails to load (mobile network), retry once
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

// Preload Dashboard chunk after a tick — most users end up here.
// Deferred to avoid module initialization race conditions with the bundler.
setTimeout(() => import('./pages/Dashboard').catch(() => {}), 1);

const F = { fontFamily: 'JetBrains Mono, monospace' };

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A1018', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...F, fontSize: 16, fontWeight: 700, color: '#00D88A', letterSpacing: 5, marginBottom: 20 }}>NATAL NAVIGATOR</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: '#00D88A',
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}

// Error boundary — catches JS errors and recovers silently.
// For transient TDZ / chunk-load errors it auto-reloads the page (up to 2 times)
// so the user never sees the "Something went wrong" screen on first visit.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, reloading: false };
  }
  static getDerivedStateFromError(error) {
    // Check if we should auto-reload (transient errors) — if so, show loading, not error
    try {
      const key = 'nn_err_reloads';
      const count = parseInt(sessionStorage.getItem(key) || '0', 10);
      if (count < 2) {
        return { error, reloading: true };
      }
    } catch { /* sessionStorage disabled */ }
    return { error, reloading: false };
  }
  componentDidCatch() {
    // Auto-reload for transient initialization errors (TDZ, chunk race conditions).
    // sessionStorage counter prevents infinite reload loops.
    try {
      const key = 'nn_err_reloads';
      const count = parseInt(sessionStorage.getItem(key) || '0', 10);
      if (count < 2) {
        sessionStorage.setItem(key, String(count + 1));
        window.location.reload();
        return;
      }
      // Clear counter so next visit starts fresh
      sessionStorage.removeItem(key);
    } catch { /* sessionStorage disabled */ }
  }
  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.locationKey !== this.props.locationKey) {
      this.setState({ error: null, reloading: false });
    }
  }
  render() {
    if (this.state.error) {
      // During auto-reload, show the loading screen — never flash the error UI
      if (this.state.reloading) {
        return (
          <div style={{ minHeight: '100vh', background: '#0A1018', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ ...F, fontSize: 16, fontWeight: 700, color: '#00D88A', letterSpacing: 5, marginBottom: 20 }}>NATAL NAVIGATOR</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#00D88A',
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
            <style>{`@keyframes pulse { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
          </div>
        );
      }
      return (
        <div style={{ minHeight: '100vh', background: '#0A1018', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ ...F, fontSize: 16, fontWeight: 700, color: '#00D88A', letterSpacing: 5, marginBottom: 20 }}>NATAL NAVIGATOR</div>
          <div style={{ ...F, fontSize: 12, color: '#F04060', marginBottom: 12 }}>Something went wrong</div>
          <div style={{ ...F, fontSize: 10, color: '#5A7088', marginBottom: 20, maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => { window.location.reload(); }}
              style={{ ...F, fontSize: 11, color: '#00D88A', background: 'transparent', border: '1px solid #00D88A', borderRadius: 6, padding: '10px 24px', cursor: 'pointer' }}
            >
              Try Again
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              style={{ ...F, fontSize: 11, color: '#5A7088', background: 'transparent', border: '1px solid #1A2840', borderRadius: 6, padding: '10px 24px', cursor: 'pointer' }}
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

// Wrapper to pass location key into ErrorBoundary (class component can't use hooks)
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
  // No birth data — redirect to home where modal will show
  return <Navigate to="/" replace />;
}

// Landing page: demo for guests, redirect for logged-in users
function DemoOrDashboard() {
  const { user, loading, hasBirthData, showBirthDataModal, dismissBirthDataModal, loadProfile } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Dashboard demo />;
  if (hasBirthData) return <Navigate to="/dashboard" replace />;
  // User is logged in but has no birth data — show demo globe with modal overlay
  // Always show modal for logged-in users without birth data (whether newly verified or returning)
  return (
    <>
      <Dashboard demo />
      <BirthDataModal onComplete={() => {
        dismissBirthDataModal();
        if (user) loadProfile(user.id);
      }} />
    </>
  );
}

// SPA pageview tracker — fires on every route change
function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
}

// Clear error-reload counter on successful app mount
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
