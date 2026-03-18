import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const F = { fontFamily: 'JetBrains Mono, monospace' };

const POPULAR_CITIES = [
  { name: 'Berlin, DE', lat: 52.52, lng: 13.4 },
  { name: 'Köln, DE', lat: 50.94, lng: 6.96 },
  { name: 'München, DE', lat: 48.14, lng: 11.58 },
  { name: 'Hamburg, DE', lat: 53.55, lng: 9.99 },
  { name: 'Frankfurt, DE', lat: 50.11, lng: 8.68 },
  { name: 'Wien, AT', lat: 48.21, lng: 16.37 },
  { name: 'Zürich, CH', lat: 47.37, lng: 8.54 },
  { name: 'London, UK', lat: 51.51, lng: -0.13 },
  { name: 'Paris, FR', lat: 48.86, lng: 2.35 },
  { name: 'New York, US', lat: 40.71, lng: -74.01 },
  { name: 'Los Angeles, US', lat: 34.05, lng: -118.24 },
  { name: 'Istanbul, TR', lat: 41.01, lng: 28.98 },
  { name: 'Tokyo, JP', lat: 35.68, lng: 139.69 },
  { name: 'Sydney, AU', lat: -33.87, lng: 151.21 },
  { name: 'São Paulo, BR', lat: -23.55, lng: -46.63 },
  { name: 'Dubai, AE', lat: 25.2, lng: 55.27 },
  { name: 'Madrid, ES', lat: 40.42, lng: -3.7 },
  { name: 'Roma, IT', lat: 41.9, lng: 12.5 },
  { name: 'Amsterdam, NL', lat: 52.37, lng: 4.9 },
  { name: 'Stockholm, SE', lat: 59.33, lng: 18.07 },
];

export default function BirthDataPage() {
  const { saveBirthData, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredCities = citySearch.length > 0
    ? POPULAR_CITIES.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()))
    : POPULAR_CITIES;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const city = showCustom
      ? { name: citySearch || 'Custom Location', lat: parseFloat(customLat), lng: parseFloat(customLng) }
      : selectedCity;

    if (!city) {
      setError('Please select a birth city or enter coordinates.');
      return;
    }
    if (!date || !time) {
      setError('Please enter your birth date and exact time.');
      return;
    }
    if (isNaN(city.lat) || isNaN(city.lng)) {
      setError('Invalid coordinates.');
      return;
    }

    setSubmitting(true);
    try {
      await saveBirthData({
        name: name.trim(),
        date,
        time,
        city: city.name,
        lat: city.lat,
        lng: city.lng,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

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
              <label style={{ ...F, fontSize: 9, color: '#5A7088', letterSpacing: 1, display: 'block', marginBottom: 6 }}>BIRTH DATE *</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#0A1018', border: '1px solid #1A2840', borderRadius: 6, color: '#D0DDE8', ...F, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ ...F, fontSize: 9, color: '#5A7088', letterSpacing: 1, display: 'block', marginBottom: 6 }}>BIRTH TIME * <span style={{ color: '#3A5068' }}>(exact)</span></label>
              <input
                type="time"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#0A1018', border: '1px solid #1A2840', borderRadius: 6, color: '#D0DDE8', ...F, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* City search */}
          <label style={{ ...F, fontSize: 9, color: '#5A7088', letterSpacing: 1, display: 'block', marginBottom: 6 }}>BIRTH CITY *</label>
          <input
            type="text"
            value={citySearch}
            onChange={e => { setCitySearch(e.target.value); setSelectedCity(null); }}
            style={{ width: '100%', padding: '10px 12px', background: '#0A1018', border: '1px solid #1A2840', borderRadius: 6, color: '#D0DDE8', ...F, fontSize: 13, marginBottom: 4, outline: 'none', boxSizing: 'border-box' }}
            placeholder="Search city..."
          />

          {/* City list */}
          {!selectedCity && !showCustom && (
            <div style={{ maxHeight: 160, overflowY: 'auto', background: '#0A1018', border: '1px solid #1A2840', borderRadius: 6, marginBottom: 12 }}>
              {filteredCities.map(c => (
                <div
                  key={c.name}
                  onClick={() => { setSelectedCity(c); setCitySearch(c.name); }}
                  style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #14202C', ...F, fontSize: 11, color: '#B0C0D0' }}
                  onMouseEnter={e => e.target.style.background = '#101C28'}
                  onMouseLeave={e => e.target.style.background = 'transparent'}
                >
                  {c.name} <span style={{ color: '#3A5068', fontSize: 9 }}>{c.lat.toFixed(2)}°, {c.lng.toFixed(2)}°</span>
                </div>
              ))}
              {filteredCities.length === 0 && (
                <div style={{ padding: '12px', ...F, fontSize: 10, color: '#5A7088', textAlign: 'center' }}>
                  City not found.{' '}
                  <span onClick={() => setShowCustom(true)} style={{ color: '#00D88A', cursor: 'pointer' }}>Enter coordinates manually</span>
                </div>
              )}
            </div>
          )}

          {selectedCity && (
            <div style={{ ...F, fontSize: 10, color: '#00D88A', marginBottom: 16, padding: '6px 0' }}>
              ✓ {selectedCity.name} ({selectedCity.lat}°, {selectedCity.lng}°)
              <span onClick={() => { setSelectedCity(null); setCitySearch(''); }} style={{ color: '#5A7088', cursor: 'pointer', marginLeft: 12 }}>change</span>
            </div>
          )}

          {/* Custom coordinates */}
          {showCustom && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ ...F, fontSize: 9, color: '#5A7088', display: 'block', marginBottom: 4 }}>LATITUDE</label>
                <input
                  type="number"
                  step="any"
                  value={customLat}
                  onChange={e => setCustomLat(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', background: '#0A1018', border: '1px solid #1A2840', borderRadius: 6, color: '#D0DDE8', ...F, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                  placeholder="e.g. 50.94"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ ...F, fontSize: 9, color: '#5A7088', display: 'block', marginBottom: 4 }}>LONGITUDE</label>
                <input
                  type="number"
                  step="any"
                  value={customLng}
                  onChange={e => setCustomLng(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', background: '#0A1018', border: '1px solid #1A2840', borderRadius: 6, color: '#D0DDE8', ...F, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                  placeholder="e.g. 6.96"
                />
              </div>
              <span onClick={() => { setShowCustom(false); }} style={{ ...F, fontSize: 9, color: '#5A7088', cursor: 'pointer', alignSelf: 'flex-end', paddingBottom: 10 }}>cancel</span>
            </div>
          )}

          {error && <div style={{ ...F, fontSize: 10, color: '#F04060', marginBottom: 12, padding: '8px 10px', background: '#F0406010', borderRadius: 4 }}>{error}</div>}

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
