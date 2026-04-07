import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { calculateChart } from '../lib/calculateChart';
import { setCachedChart } from '../lib/chartCache';
import { isLightMode, getTheme } from '../lib/theme';
import { t, getLang } from '../lib/i18n';

const F = { fontFamily: 'JetBrains Mono, monospace' };

export default function BirthDataModal({ onComplete, onDismiss }) {
  const { saveBirthData, signOut } = useAuth();
  const light = isLightMode();
  const T = getTheme(light);
  const btnTx = light ? '#FFFFFF' : '#0A1018';
  const lang = getLang();
  const [step, setStep] = useState(0);
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
  const [visible, setVisible] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

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
            return { name: parts.join(', '), lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
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
    if (!selectedCity) { setError(t('selectCityError', lang)); return; }
    if (!date || !time) { setError(t('dateTimeError', lang)); return; }

    setSubmitting(true);
    try {
      const birthInput = { date, time, lat: selectedCity.lat, lng: selectedCity.lng };
      const withTimeout = (promise, ms) => Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out. Check your connection and try again.')), ms)),
      ]);

      // Calculate chart synchronously — instant (~200ms)
      let chartData = null;
      try { chartData = calculateChart(birthInput); } catch {}
      if (chartData) setCachedChart(birthInput, chartData);

      // Transition to dashboard immediately — don't wait for DB save
      onComplete?.();

      // Save to DB in background (fire-and-forget)
      withTimeout(saveBirthData({
        name: name.trim(), date, time,
        city: selectedCity.name,
        lat: selectedCity.lat, lng: selectedCity.lng,
      }), 15000).catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', background: T.bg,
    border: `1px solid ${T.bd}`, borderRadius: 8, color: T.tx,
    ...F, fontSize: 13, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    ...F, fontSize: 9, color: T.td, letterSpacing: 1.5,
    display: 'block', marginBottom: 8, textTransform: 'uppercase',
  };

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: light ? 'rgba(242,240,237,0.85)' : 'rgba(5, 8, 12, 0.85)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.4s ease',
      padding: 16,
      overflowY: 'auto',
    }}>
      {/* Modal Card */}
      <div style={{
        width: '100%', maxWidth: 480,
        background: T.p,
        border: `1px solid ${T.bd}`,
        borderRadius: 16,
        boxShadow: light ? '0 24px 80px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 168, 107, 0.05)' : '0 24px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(0, 216, 138, 0.05)',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
        opacity: visible ? 1 : 0,
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {/* Top accent line */}
        <div style={{
          height: 3, background: T.ac,
          borderRadius: '16px 16px 0 0',
        }} />

        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 0' }}>
          <span onClick={() => { if (onDismiss) onDismiss(); else signOut(); }} style={{ ...F, fontSize: 13, color: T.td, cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }}>✕</span>
        </div>

        <div style={{ padding: '0 28px 32px' }}>
          {step === 0 ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: light ? 'linear-gradient(135deg, #E8F0EA, #F2F0ED)' : 'linear-gradient(135deg, #0D2818, #0D1520)',
                border: `1px solid ${T.acBd}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24, fontSize: 32,
              }}>
                &#10024;
              </div>

              <div style={{ ...F, fontSize: 11, color: T.ac, letterSpacing: 3, marginBottom: 12 }}>
                {t('emailVerified', lang)}
              </div>

              <h2 style={{
                ...F, fontSize: 22, fontWeight: 700, color: T.tx,
                margin: '0 0 12px', lineHeight: 1.3,
              }}>
                {t('welcomeToNN', lang)}
              </h2>

              <p style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: 14, color: T.tm, lineHeight: 1.7,
                margin: '0 0 8px', padding: '0 8px',
              }}>
                {t('welcomeReady', lang)}
              </p>

              <p style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: 12, color: T.td, lineHeight: 1.6,
                margin: '0 0 32px', padding: '0 8px',
              }}>
                {t('precisionNote', lang)}
              </p>

              <button
                onClick={() => setStep(1)}
                style={{
                  width: '100%', padding: '14px 0',
                  background: T.ac, border: 'none', borderRadius: 10,
                  color: btnTx, ...F, fontSize: 13, fontWeight: 700,
                  letterSpacing: 1.5, cursor: 'pointer',
                  transition: 'background 0.2s, transform 0.1s',
                }}
              >
                {t('enterBirthDataBtn', lang)}
              </button>

              <div style={{
                ...F, fontSize: 9, color: T.mu, marginTop: 16,
              }}>
                {t('takesLess', lang)}
              </div>

              <div onClick={() => signOut()} style={{
                ...F, fontSize: 9, color: T.td, marginTop: 20, cursor: 'pointer',
                textDecoration: 'underline', textUnderlineOffset: 3,
              }}>
                {t('signOut', lang) || 'Sign out'}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ ...F, fontSize: 11, color: T.ac, letterSpacing: 3, marginBottom: 8 }}>
                  {t('birthDataHeading', lang)}
                </div>
                <div style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontSize: 13, color: T.td, lineHeight: 1.5,
                }}>
                  {t('enterDetailsFor', lang)}
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <label style={labelStyle}>{t('yourName', lang)}</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 16 }}
                  placeholder={t('optionalPlaceholder', lang)}
                />

                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>{t('birthDateLabel', lang)}</label>
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
                    <label style={labelStyle}>{t('birthTimeLabel', lang)}</label>
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

                <label style={labelStyle}>{t('birthCityLabel', lang)}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={citySearch}
                    onChange={e => { setCitySearch(e.target.value); setSelectedCity(null); }}
                    style={inputStyle}
                    placeholder={t('cityPlaceholder', lang)}
                  />
                  {searching && (
                    <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', ...F, fontSize: 9, color: T.td }}>
                      {t('searchingCity', lang)}
                    </div>
                  )}
                </div>

                {!selectedCity && results.length > 0 && (
                  <div style={{
                    maxHeight: 180, overflowY: 'auto',
                    background: T.bg, border: `1px solid ${T.bd}`,
                    borderRadius: 8, marginTop: 4, marginBottom: 12,
                  }}>
                    {results.map((c, i) => (
                      <div
                        key={i}
                        onClick={() => { setSelectedCity(c); setCitySearch(c.name); setResults([]); }}
                        style={{
                          padding: '10px 14px', cursor: 'pointer',
                          borderBottom: `1px solid ${T.d}`,
                          ...F, fontSize: 11, color: T.tm,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = T.c}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>{c.name}</div>
                        <div style={{ fontSize: 9, color: T.mu, marginTop: 2 }}>
                          {c.lat.toFixed(4)}, {c.lng.toFixed(4)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!selectedCity && !searching && citySearch.length >= 2 && results.length === 0 && (
                  <div style={{ ...F, fontSize: 9, color: T.td, padding: '8px 0', marginBottom: 8 }}>
                    {t('noResults', lang)}
                  </div>
                )}

                {selectedCity && (
                  <div style={{
                    ...F, fontSize: 10, color: T.ac, marginTop: 8, marginBottom: 16,
                    padding: '10px 14px', background: T.acBg,
                    borderRadius: 8, border: `1px solid ${T.acBd}`,
                  }}>
                    <span style={{ color: T.ac }}>&#10003;</span> {selectedCity.name}
                    <span style={{ color: T.td }}> ({selectedCity.lat.toFixed(2)}, {selectedCity.lng.toFixed(2)})</span>
                    <span
                      onClick={() => { setSelectedCity(null); setCitySearch(''); setResults([]); }}
                      style={{ color: T.td, cursor: 'pointer', marginLeft: 12, textDecoration: 'underline' }}
                    >{t('changeCity', lang)}</span>
                  </div>
                )}

                {!selectedCity && citySearch.length === 0 && <div style={{ height: 8 }} />}

                {error && (
                  <div style={{
                    ...F, fontSize: 10, color: '#F04060', marginBottom: 12,
                    padding: '10px 14px', background: 'rgba(240,64,96,0.08)',
                    borderRadius: 8, border: '1px solid rgba(240,64,96,0.2)', lineHeight: 1.5,
                  }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%', padding: '14px 0',
                    background: submitting ? T.bd : T.ac,
                    border: 'none', borderRadius: 10,
                    color: btnTx, ...F, fontSize: 12, fontWeight: 700,
                    letterSpacing: 1, cursor: submitting ? 'wait' : 'pointer',
                    marginTop: 8, transition: 'background 0.2s',
                  }}
                >
                  {submitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span style={{
                        display: 'inline-block', width: 14, height: 14,
                        border: `2px solid ${btnTx}`, borderTopColor: 'transparent',
                        borderRadius: '50%', animation: 'nn-spin .6s linear infinite',
                      }} />
                      {t('calculatingChart', lang)}
                    </span>
                  ) : t('generateChart', lang)}
                </button>

                <div
                  onClick={() => setStep(0)}
                  style={{
                    ...F, fontSize: 9, color: T.td, textAlign: 'center',
                    marginTop: 16, cursor: 'pointer',
                  }}
                >
                  {t('back', lang)}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes nn-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
