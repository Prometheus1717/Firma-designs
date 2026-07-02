import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateChart } from '../lib/calculateChart';
import { setCachedChart } from '../lib/chartCache';
import { saveGuestBirth } from '../lib/guestBirth';
import { isLightMode, getTheme } from '../lib/theme';
import { useMobileFormViewport } from '../lib/mobileFormViewport';
import { trackEvent } from '../lib/posthog';

const F = { fontFamily: 'JetBrains Mono, monospace' };

// Anonymous, data-first entry point. A visitor enters their birth details with
// NO account and NO payment; we compute the chart client-side, stash the input
// as guest birth data, and send them to the personalised teaser (/result). This
// is deliberately isolated from the authed BirthDataPage (which saves to
// Supabase, retries, and is entangled with the paid flow) so the proven paid
// path is never touched.
export default function CreatePage() {
  const navigate = useNavigate();
  const light = isLightMode();
  const T = getTheme(light);
  const btnTx = light ? '#FFFFFF' : '#0A1018';
  const { containerRef, scrollFocusedField } = useMobileFormViewport();

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

  useEffect(() => {
    document.title = 'Create Your Map — Natal Navigator';
    trackEvent('create_started');
  }, []);

  // City autocomplete via OpenStreetMap Nominatim (same source as the authed
  // birth-data form). Debounced; skipped once a city is selected.
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

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!selectedCity) { setError('Please search and select your birth city.'); return; }
    if (!date || !time) { setError('Please enter your birth date and exact time.'); return; }

    setSubmitting(true);
    try {
      const birthInput = { date, time, lat: selectedCity.lat, lng: selectedCity.lng };
      // Client-side astronomy — no network, no account needed.
      const chartData = calculateChart(birthInput);
      setCachedChart(birthInput, chartData);
      saveGuestBirth({
        name: name.trim(),
        date, time,
        city: selectedCity.name,
        lat: selectedCity.lat,
        lng: selectedCity.lng,
      });
      trackEvent('create_completed');
      navigate('/result');
    } catch (err) {
      setError(err?.message || 'Could not calculate your chart. Please double-check your birth details.');
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
      <header className="nn-birth-header" style={{ marginBottom: 26, textAlign: 'center' }}>
        <h1 style={{ ...F, fontSize: 18, fontWeight: 700, color: T.ac, letterSpacing: 6, margin: '0 0 8px' }}>NATAL NAVIGATOR</h1>
        <p style={{ ...F, fontSize: 10, color: T.td, letterSpacing: 2, margin: 0 }}>WHERE ON EARTH DO YOU THRIVE?</p>
      </header>

      <div className="nn-birth-card" style={{ width: '100%', maxWidth: 460, background: T.p, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 32, boxSizing: 'border-box' }}>
        <div style={{ ...F, fontSize: 15, fontWeight: 700, color: T.tx, marginBottom: 6, textAlign: 'center' }}>See your best places on Earth</div>
        <div style={{ ...F, fontSize: 11, color: T.tm, marginBottom: 22, lineHeight: 1.7, textAlign: 'center' }}>
          Enter your exact birth date, time and city. No account, no card &mdash; your personal map is calculated instantly.
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
            <div style={{ marginTop: 6, border: `1px solid ${T.bd}`, borderRadius: 6, background: T.p, maxHeight: 200, overflowY: 'auto' }}>
              {results.map((c, i) => (
                <div
                  key={i}
                  onClick={() => { setSelectedCity(c); setCitySearch(c.name); setResults([]); }}
                  style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: i < results.length - 1 ? `1px solid ${T.bd}` : 'none', ...F, fontSize: 12, color: T.tx }}
                >
                  {c.name}
                  <div style={{ ...F, fontSize: 9, color: T.td, marginTop: 2 }}>{c.displayName}</div>
                </div>
              ))}
            </div>
          )}

          {selectedCity && (
            <div style={{ ...F, fontSize: 10, color: T.ac, marginTop: 6 }}>&#10003; {selectedCity.name}</div>
          )}

          {error && (
            <div style={{ ...F, fontSize: 10, color: '#F04060', margin: '16px 0 0', padding: '10px 12px', background: 'rgba(240,64,96,0.08)', borderRadius: 6, border: '1px solid rgba(240,64,96,0.2)', lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', marginTop: 22, padding: '13px 0', background: submitting ? T.bd : T.ac,
              border: 'none', borderRadius: 6, color: btnTx, ...F, fontSize: 12, fontWeight: 700,
              letterSpacing: 1, cursor: submitting ? 'wait' : 'pointer', transition: 'background .2s',
            }}
          >
            {submitting ? 'CALCULATING…' : 'REVEAL MY MAP →'}
          </button>
        </form>
      </div>

      <div
        onClick={() => navigate('/')}
        style={{ ...F, fontSize: 9, color: T.td, textAlign: 'center', marginTop: 18, cursor: 'pointer' }}
      >
        &larr; Back
      </div>
      <div className="nn-form-footer" style={{ ...F, fontSize: 8, color: T.bd, marginTop: 18 }}>NATAL NAVIGATOR {'©'} 2026</div>
    </main>
  );
}
