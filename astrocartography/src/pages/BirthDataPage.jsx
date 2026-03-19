import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const F = { fontFamily: 'JetBrains Mono, monospace' };

export default function BirthDataPage() {
  const { saveBirthData, signOut, hasBirthData, profile, user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [date, setDate] = useState(''); // internal: YYYY-MM-DD
  const [dateDisplay, setDateDisplay] = useState(''); // shown: dd.mm.yyyy
  const [time, setTime] = useState(''); // internal: HH:MM
  const [timeDisplay, setTimeDisplay] = useState(''); // shown: HH:MM (h:MM AM/PM)
  const [citySearch, setCitySearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef(null);

  // If birth data already exists (e.g. returning user), skip straight to dashboard
  useEffect(() => {
    if (hasBirthData) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasBirthData, navigate]);

  // Live search via OpenStreetMap Nominatim (free, worldwide, no API key needed)
  useEffect(() => {
    if (selectedCity) return;
    if (citySearch.length < 2) {
      setResults([]);
      return;
    }

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
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [citySearch, selectedCity]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!selectedCity) {
      setError('Please search and select your birth city.');
      return;
    }
    if (!date || !time) {
      setError('Please enter your birth date and exact time.');
      return;
    }

    setSubmitting(true);
    try {
      await saveBirthData({
        name: name.trim(),
        date,
        time,
        city: selectedCity.name,
        lat: selectedCity.lat,
        lng: selectedCity.lng,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // If birth data exists, redirect fires via useEffect above — no blocking screen needed

  return (
    <div style={{ minHeight: '100vh', background: '#0A1018', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ ...F, fontSize: 18, fontWeight: 700, color: '#00D88A', letterSpacing: 6, marginBottom: 8 }}>NATAL NAVIGATOR</div>
        <div style={{ ...F, fontSize: 10, color: '#5A7088', letterSpacing: 2 }}>ENTER YOUR BIRTH DATA</div>
      </div>

      <div style={{ width: '100%', maxWidth: 460, background: '#0D1520', border: '1px solid #1A2840', borderRadius: 12, padding: 32 }}>
        <div style={{ ...F, fontSize: 11, color: '#8098B0', marginBottom: 20, lineHeight: 1.7 }}>
          For accurate astrocartography lines, we need your exact birth date, time, and location. The more precise, the better your chart.
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <label style={{ ...F, fontSize: 9, color: '#5A7088', letterSpacing: 1, display: 'block', marginBottom: 6 }}>YOUR NAME</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', background: '#0A1018', border: '1px solid #1A2840', borderRadius: 6, color: '#D0DDE8', ...F, fontSize: 13, marginBottom: 16, outline: 'none', boxSizing: 'border-box' }}
            placeholder="Optional"
          />

          {/* Date + Time */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ ...F, fontSize: 9, color: '#5A7088', letterSpacing: 1, display: 'block', marginBottom: 6 }}>BIRTH DATE * <span style={{ color: '#3A5068' }}>(dd.mm.yyyy)</span></label>
              <input
                type="text"
                required
                value={dateDisplay}
                placeholder="18.03.1995"
                onChange={e => {
                  let v = e.target.value.replace(/[^0-9.]/g, '');
                  // Auto-insert dots after dd and mm
                  const digits = v.replace(/\./g, '');
                  if (digits.length >= 5) {
                    v = digits.slice(0, 2) + '.' + digits.slice(2, 4) + '.' + digits.slice(4, 8);
                  } else if (digits.length >= 3) {
                    v = digits.slice(0, 2) + '.' + digits.slice(2, 4);
                  }
                  setDateDisplay(v);
                  // Parse dd.mm.yyyy → YYYY-MM-DD for internal use
                  const m = v.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
                  if (m) {
                    setDate(`${m[3]}-${m[2]}-${m[1]}`);
                  } else {
                    setDate('');
                  }
                }}
                style={{ width: '100%', padding: '10px 12px', background: '#0A1018', border: '1px solid #1A2840', borderRadius: 6, color: '#D0DDE8', ...F, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ ...F, fontSize: 9, color: '#5A7088', letterSpacing: 1, display: 'block', marginBottom: 6 }}>BIRTH TIME * <span style={{ color: '#3A5068' }}>(exact)</span></label>
              <input
                type="text"
                required
                value={timeDisplay}
                placeholder="14:30"
                onChange={e => {
                  let v = e.target.value.replace(/[^0-9:]/g, '');
                  const digits = v.replace(/:/g, '');
                  if (digits.length >= 3) {
                    v = digits.slice(0, 2) + ':' + digits.slice(2, 4);
                  }
                  setTimeDisplay(v);
                  const m = v.match(/^(\d{2}):(\d{2})$/);
                  if (m && +m[1] < 24 && +m[2] < 60) {
                    setTime(`${m[1]}:${m[2]}`);
                  } else {
                    setTime('');
                  }
                }}
                style={{ width: '100%', padding: '10px 12px', background: '#0A1018', border: '1px solid #1A2840', borderRadius: 6, color: '#D0DDE8', ...F, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
              />
              {time && (
                <div style={{ ...F, fontSize: 9, color: '#5A7088', marginTop: 4 }}>
                  {(() => { const [h, mi] = time.split(':').map(Number); const h12 = h % 12 || 12; return `${h12}:${String(mi).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; })()}
                </div>
              )}
            </div>
          </div>

          {/* City search */}
          <label style={{ ...F, fontSize: 9, color: '#5A7088', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
            BIRTH CITY * <span style={{ color: '#3A5068' }}>(search worldwide)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={citySearch}
              onChange={e => { setCitySearch(e.target.value); setSelectedCity(null); }}
              style={{ width: '100%', padding: '10px 12px', background: '#0A1018', border: '1px solid #1A2840', borderRadius: 6, color: '#D0DDE8', ...F, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              placeholder="London, New York, Sydney..."
            />
            {searching && (
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', ...F, fontSize: 9, color: '#5A7088' }}>
                searching...
              </div>
            )}
          </div>

          {/* Search results */}
          {!selectedCity && results.length > 0 && (
            <div style={{ maxHeight: 200, overflowY: 'auto', background: '#0A1018', border: '1px solid #1A2840', borderRadius: 6, marginTop: 4, marginBottom: 12 }}>
              {results.map((c, i) => (
                <div
                  key={i}
                  onClick={() => { setSelectedCity(c); setCitySearch(c.name); setResults([]); }}
                  style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #14202C', ...F, fontSize: 11, color: '#B0C0D0', transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#101C28'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>{c.name}</div>
                  <div style={{ fontSize: 9, color: '#3A5068', marginTop: 2 }}>{c.lat.toFixed(4)}°, {c.lng.toFixed(4)}°</div>
                </div>
              ))}
            </div>
          )}

          {/* No results hint */}
          {!selectedCity && !searching && citySearch.length >= 2 && results.length === 0 && (
            <div style={{ ...F, fontSize: 9, color: '#5A7088', padding: '8px 0', marginBottom: 8 }}>
              No results. Try a different spelling or a nearby larger city.
            </div>
          )}

          {/* Selected city confirmation */}
          {selectedCity && (
            <div style={{ ...F, fontSize: 10, color: '#00D88A', marginTop: 8, marginBottom: 16, padding: '8px 12px', background: 'rgba(0,216,138,0.06)', borderRadius: 6, border: '1px solid rgba(0,216,138,0.15)' }}>
              ✓ {selectedCity.name} <span style={{ color: '#5A7088' }}>({selectedCity.lat.toFixed(4)}°, {selectedCity.lng.toFixed(4)}°)</span>
              <span onClick={() => { setSelectedCity(null); setCitySearch(''); setResults([]); }} style={{ color: '#5A7088', cursor: 'pointer', marginLeft: 12, textDecoration: 'underline' }}>change</span>
            </div>
          )}

          {!selectedCity && citySearch.length === 0 && (
            <div style={{ height: 8 }} />
          )}

          {error && (
            <div style={{ ...F, fontSize: 10, color: '#F04060', marginBottom: 12, padding: '10px 12px', background: 'rgba(240,64,96,0.08)', borderRadius: 6, border: '1px solid rgba(240,64,96,0.2)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '12px 0', background: submitting ? '#1A2840' : '#00D88A',
              border: 'none', borderRadius: 6, color: '#0A1018', ...F, fontSize: 12, fontWeight: 700,
              letterSpacing: 1, cursor: submitting ? 'wait' : 'pointer', marginTop: 8,
            }}
          >
            {submitting ? 'CALCULATING YOUR CHART...' : 'GENERATE MY NATAL CHART'}
          </button>
        </form>

        <div onClick={signOut} style={{ ...F, fontSize: 9, color: '#3A5068', textAlign: 'center', marginTop: 16, cursor: 'pointer' }}>Sign out</div>
      </div>
    </div>
  );
}
