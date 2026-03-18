import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import BirthDataPage from './pages/BirthDataPage';
import Dashboard from './pages/Dashboard';

const F = { fontFamily: 'JetBrains Mono, monospace' };
const SITE_PASSWORD = 'ThriveMap';

function GateScreen({ onUnlock }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  function handleSubmit(e) {
    e.preventDefault();
    if (pw === SITE_PASSWORD) {
      sessionStorage.setItem('nn_access', '1');
      onUnlock();
    } else {
      setErr(true);
      setTimeout(() => setErr(false), 1500);
    }
  }
  return (
    <div style={{ minHeight: '100vh', background: '#0A1018', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ ...F, fontSize: 18, fontWeight: 700, color: '#00D88A', letterSpacing: 6, marginBottom: 8 }}>NATAL NAVIGATOR</div>
      <div style={{ ...F, fontSize: 9, color: '#5A7088', letterSpacing: 2, marginBottom: 32 }}>PRIVATE PREVIEW</div>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 340, background: '#0D1520', border: '1px solid #1A2840', borderRadius: 12, padding: 28 }}>
        <label style={{ ...F, fontSize: 9, color: '#5A7088', letterSpacing: 1, display: 'block', marginBottom: 8 }}>ENTER ACCESS CODE</label>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          autoFocus
          style={{ width: '100%', padding: '12px 14px', background: '#0A1018', border: `1px solid ${err ? '#F04060' : '#1A2840'}`, borderRadius: 6, color: '#D0DDE8', ...F, fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color .3s' }}
          placeholder="••••••••"
        />
        {err && <div style={{ ...F, fontSize: 9, color: '#F04060', marginTop: 8 }}>Wrong code. Try again.</div>}
        <button type="submit" style={{ width: '100%', padding: '11px 0', background: '#00D88A', border: 'none', borderRadius: 6, color: '#0A1018', ...F, fontSize: 11, fontWeight: 700, letterSpacing: 1, cursor: 'pointer', marginTop: 14 }}>
          ENTER
        </button>
      </form>
    </div>
  );
}

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
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/birth-data" replace />;
  return children;
}

// Smart redirect: if user has birth data → dashboard, else → birth-data form
function SmartRedirect() {
  const { user, loading, hasBirthData, profileLoading } = useAuth();
  if (loading || profileLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (hasBirthData) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/birth-data" replace />;
}

export default function App() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('nn_access') === '1');

  if (!unlocked) return <GateScreen onUnlock={() => setUnlocked(true)} />;

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
          <Route path="/birth-data" element={<ProtectedRoute><BirthDataPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="*" element={<SmartRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
