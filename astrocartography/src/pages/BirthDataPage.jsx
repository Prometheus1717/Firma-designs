import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { calculateChart } from '../lib/calculateChart';
import { setCachedChart } from '../lib/chartCache';
import { isLightMode, getTheme } from '../lib/theme';
import { useMobileFormViewport } from '../lib/mobileFormViewport';

const F = { fontFamily: 'JetBrains Mono, monospace' };

// Stash form input in localStorage so a timeout or refresh never destroys
// what the user typed. Keyed by user id so a different account on the same
// device can't see another user's draft.
const DRAFT_KEY = 'nn_birth_draft';
function readDraft(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.userId !== userId) return null;
    if (!parsed?.ts || Date.now() - parsed.ts > 24 * 60 * 60 * 1000) return null;
    return parsed.data || null;
  } catch { return null; }
}
function writeDraft(userId, data) {
  if (!userId) return;
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ userId, ts: Date.now(), data })); } catch {}
}
function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch {} }

export default function BirthDataPage() {
  const { saveBirthData, signOut, hasBirthData, profile, user, loadProfile } = useAuth();
  // Welcome hero: shown only for first-time visitors whose email was just
  // confirmed (< 5 min ago). Replaces the popup modal that used to do this.
  // Quiet for editing flows and returning users so the page never feels
  // patronising the second time around.
  const justConfirmed = (() => {
    if (!user?.email_confirmed_at) return false;
    const ms = Date.now() - new Date(user.email_confirmed_at).getTime();
    return ms >= 0 && ms < 5 * 60 * 1000;
  })();
  const showWelcomeHero = justConfirmed && !hasBirthData;
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = location.state?.edit === true;
  const light = isLightMode();
  const T = getTheme(light);
  const btnTx = light ? '#FFFFFF' : '#0A1018';
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [dateDisplay, setDateDisplay] = useState('');
  const [time, setTime] = useState('');
  const [timeDisplay, setTimeDisplay] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef(null);
  const { containerRef, scrollFocusedField } = useMobileFormViewport();

  useEffect(() => { document.title = isEditing ? 'Edit Birth Data \u2014 Natal Navigator' : 'Enter Birth Data \u2014 Natal Navigator'; }, [isEditing]);

  // Birth data first, paywall after: unpaid users MUST be able to reach and
  // submit this page. Payment is enforced later by `showPaywall` on the
  // dashboard, not here. (Do not re-add a `requiresPayment -> /dashboard`
  // redirect \u2014 it bounces unpaid users out of the setup form and traps paid
  // users whose is_premium hasn't refreshed in the client yet.)

  // Bullet-proof guard: this page should NEVER be shown to admins or to
  // users who already have a chart. The route guards in App.jsx try to
  // prevent it, but if the profile fetch during signIn failed for any
  // reason (auth-lock, slow network, JWT-refresh edge case), the guards
  // see profile=null and default to /birth-data. So we re-fetch on mount,
  // and if the fresh profile says admin or has a chart, we redirect away.
  // This is the safety net that catches the route-guard race once and for all.
  useEffect(() => {
    if (isEditing) return;
    if (profile?.is_admin) { navigate('/admin', { replace: true }); return; }
    if (hasBirthData) { navigate('/dashboard', { replace: true }); return; }
    if (!user?.id || typeof loadProfile !== 'function') return;
    // Profile is null or incomplete — force a fresh fetch from the DB.
    let cancelled = false;
    (async () => {
      const fresh = await loadProfile(user.id);
      if (cancelled || !fresh) return;
      if (fresh.is_admin === true) {
        navigate('/admin', { replace: true });
        return;
      }
      const freshHasBirth = !!(fresh.birth_date && fresh.birth_time && fresh.birth_lat != null && fresh.birth_lng != null);
      if (freshHasBirth) navigate('/dashboard', { replace: true });
    })();
    return () => { cancelled = true; };
  }, [user?.id, profile, hasBirthData, isEditing, navigate, loadProfile]);

  useEffect(() => {
    if (hasBirthData && !isEditing) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasBirthData, isEditing, navigate]);

  useEffect(() => {
    if (isEditing && profile) {
      setName(profile.display_name || '');
      if (profile.birth_date) {
        const [y, m, d] = profile.birth_date.split('-');
        setDate(profile.birth_date);
        setDateDisplay(`${d}.${m}.${y}`);
      }
      if (profile.birth_time) {
        setTime(profile.birth_time);
        const [hh, mi] = profile.birth_time.split(':');
        setTimeDisplay(`${hh}:${mi}`);
      }
      if (profile.birth_city) {
        setCitySearch(profile.birth_city);
        setSelectedCity({
          name: profile.birth_city,
          lat: profile.birth_lat,
          lng: profile.birth_lng,
        });
      }
    }
  }, [isEditing, profile]);

  // Recover any in-progress draft for this user — typical case: the user
  // typed everything, hit save, got a timeout error, refreshed the page in
  // frustration. Without this they had to start over from scratch and most
  // gave up at that point. Skip in edit mode since we already pre-fill from
  // the saved profile.
  useEffect(() => {
    if (isEditing) return;
    if (!user?.id) return;
    const draft = readDraft(user.id);
    if (!draft) return;
    if (draft.name) setName(draft.name);
    if (draft.date) {
      setDate(draft.date);
      const [y, m, d] = draft.date.split('-');
      if (y && m && d) setDateDisplay(`${d}.${m}.${y}`);
    }
    if (draft.time) {
      setTime(draft.time);
      setTimeDisplay(draft.time.slice(0, 5));
    }
    if (draft.city) {
      setCitySearch(draft.city.name || '');
      setSelectedCity(draft.city);
    }
  }, [user?.id, isEditing]);

  // Auto-save the draft on every change. localStorage write is cheap (~µs)
  // and means the very moment the user types something it's safe even if
  // the browser tab crashes immediately after.
  useEffect(() => {
    if (isEditing) return;
    if (!user?.id) return;
    writeDraft(user.id, {
      name,
      date,
      time,
      city: selectedCity ? { name: selectedCity.name, lat: selectedCity.lat, lng: selectedCity.lng } : null,
    });
  }, [user?.id, isEditing, name, date, time, selectedCity]);

  useEffect(() => {
    if (selectedCity) return;
    if (citySearch.length < 2) { setResults([]); return; }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const query = encodeURIComponent(citySearch);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=8&addressdetails=1&accept-language=en`,
          { headers: { 'User-Agent': 'NatalNavigator/1.0' } }
        );
        const data = await res.json();
        const cities = data
          .filter(r => ['city', 'town', 'village', 'hamlet', 'suburb', 'municipality', 'administrative'].includes(r.type) || r.class === 'place' || r.class === 'boundary')
          .map(r => {
            const parts = [];
            if (r.address?.city || r.address?.town || r.address?.village || r.address?.hamlet || r.address?.municipality) {
              parts.push(r.address.city || r.address.town || r.address.village || r.address.hamlet || r.address.municipality);
            } else {
              parts.push(r.name || r.display_name.split(',')[0]);
            }
            if (r.address?.state) parts.push(r.address.state);
            if (r.address?.country_code) parts.push(r.address.country_code.toUpperCase());
            return {
              name: parts.join(', '),
              displayName: r.display_name,
              lat: parseFloat(r.lat),
              lng: parseFloat(r.lon),
            };
          });
        setResults(cities);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [citySearch, selectedCity]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!selectedCity) { setError('Please search and select your birth city.'); return; }
    if (!date || !time) { setError('Please enter your birth date and exact time.'); return; }

    setSubmitting(true);
    try {
      const birthInput = { date, time, lat: selectedCity.lat, lng: selectedCity.lng };
      const payload = {
        name: name.trim(), date, time,
        city: selectedCity.name,
        lat: selectedCity.lat, lng: selectedCity.lng,
      };

      // Run the local chart calc in parallel so it overlaps with the network
      // round-trip — saves ~200 ms total on the happy path.
      const chartPromise = new Promise((resolve) => {
        try { resolve(calculateChart(birthInput)); }
        catch { resolve(null); }
      });

      // Try the save up to 3 times with exponential backoff, each attempt
      // bounded by a 30 s timeout (raised from 15 s — too aggressive for
      // slow mobile networks; concrete user keririchardson@hotmail timed
      // out yesterday). 30 + 31 + 33 s = ~94 s worst case, which is
      // acceptable for the "I'm setting up my account" moment.
      const ATTEMPTS = 3;
      const PER_ATTEMPT_MS = 30_000;
      const isTransient = (msg) => /timed out|abort|network|fetch failed|lock|stolen|503|504|gateway|temporarily/i.test(msg || '');
      const withTimeout = (p, ms) => Promise.race([
        p,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out. We will retry automatically — please wait.')), ms)),
      ]);

      let lastErr = null;
      for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
        try {
          await withTimeout(saveBirthData(payload), PER_ATTEMPT_MS);
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          if (attempt === ATTEMPTS || !isTransient(err?.message)) break;
          // Backoff: 1 s, then 3 s. Inline retry; UI stays in "submitting"
          // state so the user just sees a longer spinner, not a flash of
          // error followed by a magical recovery.
          await new Promise(r => setTimeout(r, attempt === 1 ? 1000 : 3000));
        }
      }
      if (lastErr) throw lastErr;

      const chartData = await chartPromise;
      if (chartData) setCachedChart(birthInput, chartData);
      clearDraft();
      navigate('/dashboard');
    } catch (err) {
      // Friendly message: keep their data, tell them it will resume on retry.
      const msg = err?.message || '';
      if (/timed out|network|fetch failed|abort/i.test(msg)) {
        setError('Could not reach the server. Your data is saved locally — please check your connection and click Save again.');
      } else if (/jwt|expired|sign in|unauthor/i.test(msg)) {
        setError('Your session expired. Please sign in again — your data is preserved.');
      } else {
        setError(msg || 'Could not save your birth data. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', background: T.bg, border: `1px solid ${T.bd}`,
    borderRadius: 6, color: T.tx, ...F, fontSize: 16, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <main
      ref={containerRef}
      className="nn-form-shell nn-birth-shell"
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
      <header className="nn-birth-header" style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{ ...F, fontSize: 18, fontWeight: 700, color: T.ac, letterSpacing: 6, margin: '0 0 8px' }}>NATAL NAVIGATOR</h1>
        <p style={{ ...F, fontSize: 10, color: T.td, letterSpacing: 2, margin: 0 }}>{isEditing ? 'EDIT YOUR BIRTH DATA' : 'ENTER YOUR BIRTH DATA'}</p>
      </header>

      {showWelcomeHero && (
        <div style={{ width: '100%', maxWidth: 460, marginBottom: 18, textAlign: 'center' }}>
          <div style={{ ...F, fontSize: 11, color: T.ac, letterSpacing: 3, marginBottom: 10 }}>EMAIL VERIFIED</div>
          <h2 style={{ ...F, fontSize: 22, fontWeight: 700, color: T.tx, margin: '0 0 10px', lineHeight: 1.3 }}>Welcome to NatalNavigator</h2>
          <p style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 13, color: T.tm, lineHeight: 1.6, margin: '0 14px' }}>
            Your account is ready. Enter your exact birth details below to generate your personalised astrocartography globe.
          </p>
        </div>
      )}

      <div className="nn-birth-card" style={{ width: '100%', maxWidth: 460, background: T.p, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 32, boxSizing: 'border-box' }}>
        <div style={{ ...F, fontSize: 11, color: T.tm, marginBottom: 20, lineHeight: 1.7 }}>
          For accurate astrocartography lines, we need your exact birth date, time, and location. The more precise, the better your chart.
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ ...F, fontSize: 9, color: T.td, letterSpacing: 1, display: 'block', marginBottom: 6 }}>YOUR NAME</label>
          <input
            className="nn-form-input"
            type="text"
            autoComplete="name"
            value={name}
            onFocus={scrollFocusedField}
            onChange={e => setName(e.target.value)}
            style={{ ...inputStyle, marginBottom: 16 }}
            placeholder="Optional"
          />

          <div className="nn-birth-grid" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ ...F, fontSize: 9, color: T.td, letterSpacing: 1, display: 'block', marginBottom: 6 }}>BIRTH DATE * <span style={{ color: T.mu }}>(dd.mm.yyyy)</span></label>
              <input
                className="nn-form-input"
                type="text"
                autoComplete="bday"
                inputMode="numeric"
                required
                value={dateDisplay}
                placeholder="18.03.1995"
                onFocus={scrollFocusedField}
                onChange={e => {
                  let v = e.target.value.replace(/[^0-9.]/g, '');
                  const digits = v.replace(/\./g, '');
                  if (digits.length >= 5) v = digits.slice(0, 2) + '.' + digits.slice(2, 4) + '.' + digits.slice(4, 8);
                  else if (digits.length >= 3) v = digits.slice(0, 2) + '.' + digits.slice(2, 4);
                  setDateDisplay(v);
                  const m = v.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
                  setDate(m ? `${m[3]}-${m[2]}-${m[1]}` : '');
                }}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ ...F, fontSize: 9, color: T.td, letterSpacing: 1, display: 'block', marginBottom: 6 }}>BIRTH TIME * <span style={{ color: T.mu }}>(exact)</span></label>
              <input
                className="nn-form-input"
                type="text"
                autoComplete="off"
                inputMode="numeric"
                required
                value={timeDisplay}
                placeholder="14:30"
                onFocus={scrollFocusedField}
                onChange={e => {
                  let v = e.target.value.replace(/[^0-9:]/g, '');
                  const digits = v.replace(/:/g, '');
                  if (digits.length >= 3) v = digits.slice(0, 2) + ':' + digits.slice(2, 4);
                  setTimeDisplay(v);
                  const m = v.match(/^(\d{2}):(\d{2})$/);
                  setTime(m && +m[1] < 24 && +m[2] < 60 ? `${m[1]}:${m[2]}` : '');
                }}
                style={inputStyle}
              />
              {time && (
                <div style={{ ...F, fontSize: 9, color: T.td, marginTop: 4 }}>
                  {(() => { const [h, mi] = time.split(':').map(Number); const h12 = h % 12 || 12; return `${h12}:${String(mi).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; })()}
                </div>
              )}
            </div>
          </div>

          <label style={{ ...F, fontSize: 9, color: T.td, letterSpacing: 1, display: 'block', marginBottom: 6 }}>
            BIRTH CITY * <span style={{ color: T.mu }}>(search worldwide)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              className="nn-form-input"
              type="text"
              autoComplete="address-level2"
              value={citySearch}
              onFocus={scrollFocusedField}
              onChange={e => { setCitySearch(e.target.value); setSelectedCity(null); }}
              style={inputStyle}
              placeholder="London, New York, Sydney..."
            />
            {searching && (
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', ...F, fontSize: 9, color: T.td }}>
                searching...
              </div>
            )}
          </div>

          {!selectedCity && results.length > 0 && (
            <div style={{ maxHeight: 200, overflowY: 'auto', background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 6, marginTop: 4, marginBottom: 12 }}>
              {results.map((c, i) => (
                <div
                  key={i}
                  onClick={() => { setSelectedCity(c); setCitySearch(c.name); setResults([]); }}
                  style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: `1px solid ${T.d}`, ...F, fontSize: 11, color: T.tm, transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.c}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>{c.name}</div>
                  <div style={{ fontSize: 9, color: T.mu, marginTop: 2 }}>{c.lat.toFixed(4)}\u00B0, {c.lng.toFixed(4)}\u00B0</div>
                </div>
              ))}
            </div>
          )}

          {!selectedCity && !searching && citySearch.length >= 2 && results.length === 0 && (
            <div style={{ ...F, fontSize: 9, color: T.td, padding: '8px 0', marginBottom: 8 }}>
              No results. Try a different spelling or a nearby larger city.
            </div>
          )}

          {selectedCity && (
            <div style={{ ...F, fontSize: 10, color: T.ac, marginTop: 8, marginBottom: 16, padding: '8px 12px', background: T.acBg, borderRadius: 6, border: `1px solid ${T.acBd}` }}>
              \u2713 {selectedCity.name} <span style={{ color: T.td }}>({selectedCity.lat.toFixed(4)}\u00B0, {selectedCity.lng.toFixed(4)}\u00B0)</span>
              <span onClick={() => { setSelectedCity(null); setCitySearch(''); setResults([]); }} style={{ color: T.td, cursor: 'pointer', marginLeft: 12, textDecoration: 'underline' }}>change</span>
            </div>
          )}

          {!selectedCity && citySearch.length === 0 && <div style={{ height: 8 }} />}

          {error && (
            <div style={{ ...F, fontSize: 10, color: '#F04060', marginBottom: 12, padding: '10px 12px', background: 'rgba(240,64,96,0.08)', borderRadius: 6, border: '1px solid rgba(240,64,96,0.2)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '12px 0', background: submitting ? T.bd : T.ac,
              border: 'none', borderRadius: 6, color: btnTx, ...F, fontSize: 12, fontWeight: 700,
              letterSpacing: 1, cursor: submitting ? 'wait' : 'pointer', marginTop: 8,
            }}
          >
            {submitting ? 'CALCULATING YOUR CHART...' : isEditing ? 'UPDATE MY NATAL CHART' : 'GENERATE MY NATAL CHART'}
          </button>
        </form>

        {isEditing ? (
          <div onClick={() => navigate('/dashboard')} style={{ ...F, fontSize: 9, color: T.td, textAlign: 'center', marginTop: 16, cursor: 'pointer' }}>\u2190 Back to Dashboard</div>
        ) : (
          <div onClick={async () => { await signOut(); window.location.href = '/'; }} style={{ ...F, fontSize: 9, color: T.mu, textAlign: 'center', marginTop: 16, cursor: 'pointer' }}>Sign out</div>
        )}
      </div>
      <style>{`
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
          .nn-birth-shell {
            justify-content: flex-start !important;
            padding-top: max(28px, calc(env(safe-area-inset-top) + 18px)) !important;
            padding-bottom: calc(280px + env(safe-area-inset-bottom) + var(--keyboard-inset, 0px)) !important;
            scroll-padding-top: 24px;
            scroll-padding-bottom: calc(280px + env(safe-area-inset-bottom));
          }
          .nn-birth-header {
            margin-bottom: 22px !important;
          }
          .nn-birth-card {
            padding: 24px 18px !important;
          }
        }
        @media (max-width: 420px) {
          .nn-birth-grid {
            flex-direction: column !important;
          }
        }
      `}</style>
    </main>
  );
}
