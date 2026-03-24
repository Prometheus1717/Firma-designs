import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchAllProfiles, fetchAdminStats, fetchPaywallSetting, updatePaywallSetting, toggleUserPremium } from '../lib/adminApi';

const F = { fontFamily: 'JetBrains Mono, monospace' };

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: '#0D1520', border: '1px solid #1A2840', borderRadius: 10, padding: '18px 20px', flex: 1, minWidth: 140 }}>
      <div style={{ ...F, fontSize: 8, color: '#5A7088', letterSpacing: 1.5, marginBottom: 8 }}>{label}</div>
      <div style={{ ...F, fontSize: 28, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y?.slice(-2)}`;
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  return `${h}:${m}`;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('updated_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paywallEnabled, setPaywallEnabled] = useState(true);
  const [paywallLoading, setPaywallLoading] = useState(false);
  const [premiumToggling, setPremiumToggling] = useState(null);
  const pageSize = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, pw] = await Promise.all([
        fetchAdminStats(),
        fetchAllProfiles({ search, sortField, sortAsc, page, pageSize }),
        fetchPaywallSetting(),
      ]);
      setStats(s);
      setUsers(u.data);
      setTotal(u.total);
      setPaywallEnabled(pw);
    } catch (e) {
      console.error('Admin fetch error:', e);
    }
    setLoading(false);
  }, [search, sortField, sortAsc, page]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const totalPages = Math.ceil(total / pageSize);

  function handleSort(field) {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
    setPage(1);
  }

  const sortArrow = (field) => sortField === field ? (sortAsc ? ' ▲' : ' ▼') : '';

  const columns = [
    { key: 'display_name', label: 'NAME', w: 140 },
    { key: 'email', label: 'EMAIL', w: 220 },
    { key: 'birth_city', label: 'BIRTH CITY', w: 140 },
    { key: 'birth_date', label: 'BIRTH DATE', w: 100 },
    { key: 'birth_time', label: 'TIME', w: 70 },
    { key: 'updated_at', label: 'LAST UPDATE', w: 120 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0A1018', color: '#D0DDE8', overflow: 'hidden' }}>
      {/* TOPBAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 38, minHeight: 38, background: '#0D1520', borderBottom: '1px solid #1A2840', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ ...F, fontSize: 12, fontWeight: 700, color: '#00D88A', letterSpacing: 3 }}>NATAL NAVIGATOR</span>
          <div style={{ width: 1, height: 16, background: '#1A2840' }} />
          <span style={{ ...F, fontSize: 9, color: '#D8A030', background: '#D8A03015', padding: '2px 8px', borderRadius: 3, letterSpacing: 1 }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ ...F, fontSize: 9, color: '#5A7088' }}>{profile?.display_name}</span>
          <span
            onClick={() => navigate('/dashboard')}
            style={{ ...F, fontSize: 9, color: '#00D88A', cursor: 'pointer', background: '#101C28', padding: '4px 10px', borderRadius: 4, border: '1px solid #1A2840' }}
          >
            DASHBOARD
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {/* PAYWALL TOGGLE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0D1520', border: `1px solid ${paywallEnabled ? '#E8A83830' : '#00D88A30'}`, borderRadius: 10, padding: '14px 20px', marginBottom: 20 }}>
          <div>
            <div style={{ ...F, fontSize: 11, fontWeight: 600, color: '#D0DDE8' }}>Paywall</div>
            <div style={{ ...F, fontSize: 9, color: '#5A7088', marginTop: 2 }}>
              {paywallEnabled ? 'Active — free users see the upgrade screen' : 'Disabled — all users have full access'}
            </div>
          </div>
          <div
            onClick={async () => {
              setPaywallLoading(true);
              try {
                await updatePaywallSetting(!paywallEnabled);
                setPaywallEnabled(!paywallEnabled);
              } catch (e) { console.error('Paywall toggle error:', e); }
              setPaywallLoading(false);
            }}
            style={{ ...F, fontSize: 9, fontWeight: 600, cursor: paywallLoading ? 'default' : 'pointer', padding: '8px 20px', borderRadius: 6, letterSpacing: 0.5, transition: 'all .2s', color: paywallEnabled ? '#F04060' : '#00D88A', border: `1px solid ${paywallEnabled ? '#F0406040' : '#00D88A40'}`, background: paywallEnabled ? '#F0406010' : '#00D88A10' }}
          >
            {paywallLoading ? '...' : paywallEnabled ? 'DISABLE' : 'ENABLE'}
          </div>
        </div>

        {/* STATS */}
        {stats && (
          <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
            <StatCard label="TOTAL USERS" value={stats.totalUsers} color="#00D88A" />
            <StatCard label="LAST 7 DAYS" value={stats.recentSignups} color="#D8A030" />
            <StatCard label="PROFILES COMPLETE" value={stats.withBirthData} color="#5BA8D4" />
            <StatCard label="PREMIUM USERS" value={stats.premiumUsers} color="#E8A838" />
          </div>
        )}

        {/* SEARCH */}
        <div style={{ marginBottom: 16 }}>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name, email, or city..."
            style={{ width: '100%', maxWidth: 400, padding: '10px 14px', background: '#0A1018', border: '1px solid #1A2840', borderRadius: 6, color: '#D0DDE8', ...F, fontSize: 11, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* TABLE */}
        <div style={{ background: '#0D1520', border: '1px solid #1A2840', borderRadius: 10, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', background: '#0B1218', borderBottom: '1px solid #1A2840', padding: '10px 14px' }}>
            {columns.map(col => (
              <div
                key={col.key}
                onClick={() => handleSort(col.key)}
                style={{ ...F, fontSize: 8, color: '#5A7088', letterSpacing: 1.2, cursor: 'pointer', width: col.w, flexShrink: 0, userSelect: 'none' }}
              >
                {col.label}{sortArrow(col.key)}
              </div>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', ...F, fontSize: 11, color: '#5A7088' }}>Loading...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', ...F, fontSize: 11, color: '#5A7088' }}>No users found</div>
          ) : (
            users.map(u => (
              <div
                key={u.id}
                onClick={() => setSelected(selected?.id === u.id ? null : u)}
                style={{ display: 'flex', padding: '10px 14px', borderBottom: '1px solid #14202C', cursor: 'pointer', background: selected?.id === u.id ? '#101C28' : 'transparent', transition: 'background .15s' }}
                onMouseEnter={e => { if (selected?.id !== u.id) e.currentTarget.style.background = '#0C1620'; }}
                onMouseLeave={e => { if (selected?.id !== u.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ ...F, fontSize: 11, color: '#D0DDE8', width: 140, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.display_name || '—'}
                  {u.is_admin && <span style={{ ...F, fontSize: 7, color: '#D8A030', marginLeft: 6 }}>ADMIN</span>}
                  {u.is_premium && <span style={{ ...F, fontSize: 7, color: '#E8A838', marginLeft: 4 }}>PRO</span>}
                </div>
                <div style={{ ...F, fontSize: 11, color: '#8098B0', width: 220, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email || '—'}</div>
                <div style={{ ...F, fontSize: 11, color: '#8098B0', width: 140, flexShrink: 0 }}>{u.birth_city || '—'}</div>
                <div style={{ ...F, fontSize: 11, color: '#8098B0', width: 100, flexShrink: 0 }}>{formatDate(u.birth_date)}</div>
                <div style={{ ...F, fontSize: 11, color: '#8098B0', width: 70, flexShrink: 0 }}>{formatTime(u.birth_time)}</div>
                <div style={{ ...F, fontSize: 11, color: '#5A7088', width: 120, flexShrink: 0 }}>{u.updated_at ? new Date(u.updated_at).toLocaleDateString('de-DE') : '—'}</div>
              </div>
            ))
          )}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16 }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              style={{ ...F, fontSize: 9, color: page <= 1 ? '#3A5068' : '#00D88A', background: 'transparent', border: '1px solid #1A2840', borderRadius: 4, padding: '6px 12px', cursor: page <= 1 ? 'default' : 'pointer' }}
            >
              PREV
            </button>
            <span style={{ ...F, fontSize: 9, color: '#5A7088' }}>{page} / {totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              style={{ ...F, fontSize: 9, color: page >= totalPages ? '#3A5068' : '#00D88A', background: 'transparent', border: '1px solid #1A2840', borderRadius: 4, padding: '6px 12px', cursor: page >= totalPages ? 'default' : 'pointer' }}
            >
              NEXT
            </button>
          </div>
        )}

        {/* USER DETAIL PANEL */}
        {selected && (
          <div style={{ marginTop: 16, background: '#0D1520', border: `1px solid ${selected.is_admin ? '#D8A03040' : '#1A2840'}`, borderRadius: 10, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ ...F, fontSize: 16, fontWeight: 700, color: '#D0DDE8' }}>
                {selected.display_name || 'No name'}
                {selected.is_admin && <span style={{ ...F, fontSize: 9, color: '#D8A030', marginLeft: 10 }}>ADMIN</span>}
                {selected.is_premium && <span style={{ ...F, fontSize: 9, color: '#E8A838', marginLeft: 10 }}>PREMIUM</span>}
              </div>
              <span onClick={() => setSelected(null)} style={{ ...F, fontSize: 11, color: '#5A7088', cursor: 'pointer' }}>CLOSE</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {[
                ['EMAIL', selected.email],
                ['USER ID', selected.id],
                ['BIRTH DATE', formatDate(selected.birth_date)],
                ['BIRTH TIME', formatTime(selected.birth_time)],
                ['BIRTH CITY', selected.birth_city],
                ['COORDINATES', selected.birth_lat != null ? `${selected.birth_lat?.toFixed(2)}, ${selected.birth_lng?.toFixed(2)}` : '—'],
                ['STRIPE ID', selected.stripe_customer_id || '—'],
                ['LAST UPDATE', selected.updated_at ? new Date(selected.updated_at).toLocaleString('de-DE') : '—'],
                ['CREATED', selected.created_at ? new Date(selected.created_at).toLocaleString('de-DE') : '—'],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ ...F, fontSize: 8, color: '#5A7088', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                  <div style={{ ...F, fontSize: 11, color: '#B0C0D0', wordBreak: 'break-all' }}>{val || '—'}</div>
                </div>
              ))}
            </div>
            {/* Premium toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #1A2840' }}>
              <div>
                <div style={{ ...F, fontSize: 10, fontWeight: 600, color: '#D0DDE8' }}>Premium Status</div>
                <div style={{ ...F, fontSize: 9, color: '#5A7088', marginTop: 2 }}>
                  {selected.is_premium ? 'This user has premium access' : 'This user is on the free plan'}
                </div>
              </div>
              <div
                onClick={async () => {
                  if (premiumToggling === selected.id) return;
                  setPremiumToggling(selected.id);
                  try {
                    const newVal = !selected.is_premium;
                    await toggleUserPremium(selected.id, newVal);
                    setSelected({ ...selected, is_premium: newVal });
                    setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, is_premium: newVal } : u));
                  } catch (e) { console.error('Premium toggle error:', e); }
                  setPremiumToggling(null);
                }}
                style={{ ...F, fontSize: 9, fontWeight: 600, cursor: premiumToggling === selected.id ? 'default' : 'pointer', padding: '8px 18px', borderRadius: 6, letterSpacing: 0.5, transition: 'all .2s', color: selected.is_premium ? '#F04060' : '#E8A838', border: `1px solid ${selected.is_premium ? '#F0406040' : '#E8A83840'}`, background: selected.is_premium ? '#F0406010' : '#E8A83810' }}
              >
                {premiumToggling === selected.id ? '...' : selected.is_premium ? 'REVOKE PREMIUM' : 'GRANT PREMIUM'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
