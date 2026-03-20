import { lazy, Suspense, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

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

// Error boundary — catches JS errors and shows a recovery screen instead of blank page.
// Uses `key={pathname}` so it auto-resets when the route changes (no stuck error screens).
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, retries: 0 };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    // Auto-retry once for transient initialization errors (TDZ, chunk race conditions)
    if (this.state.retries < 2) {
      setTimeout(() => this.setState({ error: null, retries: this.state.retries + 1 }), 100);
    }
  }
  componentDidUpdate(prevProps) {
    // Auto-reset error state when location changes (user navigated away)
    if (this.state.error && prevProps.locationKey !== this.props.locationKey) {
      this.setState({ error: null, retries: 0 });
    }
  }
  render() {
    if (this.state.error && this.state.retries >= 2) {
      return (
        <div style={{ minHeight: '100vh', background: '#0A1018', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ ...F, fontSize: 16, fontWeight: 700, color: '#00D88A', letterSpacing: 5, marginBottom: 20 }}>NATAL NAVIGATOR</div>
          <div style={{ ...F, fontSize: 12, color: '#F04060', marginBottom: 12 }}>Something went wrong</div>
          <div style={{ ...F, fontSize: 10, color: '#5A7088', marginBottom: 20, maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => this.setState({ error: null, retries: 0 })}
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
  if (user) return <Navigate to={hasBirthData ? '/dashboard' : '/birth-data'} replace />;
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
  const { user, loading, hasBirthData, profile } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (hasBirthData || !profile) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/birth-data" replace />;
}

// Landing page: demo for guests, redirect for logged-in users
function DemoOrDashboard() {
  const { user, loading, hasBirthData, profile } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user && hasBirthData) return <Navigate to="/dashboard" replace />;
  if (user && profile && !hasBirthData) return <Navigate to="/birth-data" replace />;
  if (user && !profile) return <Navigate to="/dashboard" replace />;
  return <Dashboard demo />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundaryWithLocation>
        <AuthProvider>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<DemoOrDashboard />} />
              <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
              <Route path="/birth-data" element={<ProtectedRoute><BirthDataPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
              <Route path="*" element={<SmartRedirect />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ErrorBoundaryWithLocation>
    </BrowserRouter>
  );
}
