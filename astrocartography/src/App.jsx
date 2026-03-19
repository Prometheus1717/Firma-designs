import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

const AuthPage = lazy(() => import('./pages/AuthPage'));
const BirthDataPage = lazy(() => import('./pages/BirthDataPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

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

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
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

// Smart redirect: if user has birth data → dashboard, else → birth-data form
function SmartRedirect() {
  const { user, loading, hasBirthData } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (hasBirthData) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/birth-data" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
            <Route path="/birth-data" element={<ProtectedRoute><BirthDataPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            <Route path="*" element={<SmartRedirect />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
