import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { calculateChart } from '../lib/calculateChart';
import { setCachedChart } from '../lib/chartCache';
import { isLightMode, getTheme } from '../lib/theme';

const F = { fontFamily: 'JetBrains Mono, monospace' };

export default function BirthDataPage() {
  const { saveBirthData, signOut, hasBirthData, profile, user } = useAuth();
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

  useEffect(() => { document.title = isEditing ? 'Edit Birth Data \u2014 Natal Navigator' : 'Enter Birth Data \u2014 Natal Navigator'; }, [isEditing]);

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
      const withTimeout = (promise, ms) => Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out. Check your internet connection and try again.')), ms)),
      ]);

      const [, chartData] = await Promise.all([
        withTimeout(saveBirthData({
          name: name.trim(), date, time,
          city: selectedCity.name,
          lat: selectedCity.lat, lng: selectedCity.lng,
        }), 15000),
        new Promise((resolve) => {
          try { resolve(calculateChart(birthInput)); }
          catch { resolve(null); }
        }),
      ]);

      if (chartData) setCachedChart(birthInput, chartData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', background: T.bg, border: `1px solid ${T.bd}`,
    borderRadius: 6, color: T.tx, ...F, fontSize: 12, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <main style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <header style={{ marginBottom: 32, textAlign: 'center' }}>
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

      <div style={{ width: '100%', maxWidth: 460, background: T.p, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 32 }}>
        <div style={{ ...F, fontSize: 11, color: T.tm, marginBottom: 20, lineHeight: 1.7 }}>
          For accurate astrocartography lines, we need your exact birth date, time, and location. The more precise, the better your chart.
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ ...F, fontSize: 9, color: T.td, letterSpacing: 1, display: 'block', marginBottom: 6 }}>YOUR NAME</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ ...inputStyle, fontSize: 13, marginBottom: 16 }}
            placeholder="Optional"
          />

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ ...F, fontSize: 9, color: T.td, letterSpacing: 1, display: 'block', marginBottom: 6 }}>BIRTH DATE * <span style={{ color: T.mu }}>(dd.mm.yyyy)</span></label>
              <input
                type="text"
                required
                value={dateDisplay}
                placeholder="18.03.1995"
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
                type="text"
                required
                value={timeDisplay}
                placeholder="14:30"
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
              type="text"
              value={citySearch}
              onChange={e => { setCitySearch(e.target.value); setSelectedCity(null); }}
              style={{ ...inputStyle, fontSize: 13 }}
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
    </main>
  );
}
