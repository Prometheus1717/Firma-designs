import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Globe from '../components/Globe';
import { calculateChart } from '../lib/calculateChart';

const F = { fontFamily: 'JetBrains Mono, monospace' };
const COL = { thrive: '#00D88A', avoid: '#F04060', neutral: '#D8A030' };

const ANGLE_INFO = {
  MC: { label: 'MC', full: 'Medium Coeli (Midheaven)', dash: 'solid', desc: 'The highest point in the sky at your birth. Represents career, public reputation, and how the world sees your achievements. On your MC line, you feel professionally empowered and publicly recognized.' },
  IC: { label: 'IC', full: 'Imum Coeli (Nadir)', dash: 'dashed', desc: 'The deepest point below the horizon. Represents home, roots, family, and inner emotional life. On your IC line, you feel a deep sense of belonging and emotional grounding.' },
  ASC: { label: 'ASC', full: 'Ascendant (Rising)', dash: 'long dash', desc: 'The eastern horizon at your birth. Represents your identity, self-expression, and first impressions. On your ASC line, your personality shines and others see your authentic self.' },
  DC: { label: 'DC', full: 'Descendant (Setting)', dash: 'dotted', desc: 'The western horizon, opposite the Ascendant. Represents partnerships, relationships, and how you connect with others. On your DC line, meaningful relationships and alliances form naturally.' },
};

const ANGLE_ORDER = ['MC', 'IC', 'ASC', 'DC'];

const ALL_CITIES = [
  [51.51, -.13, 'London'], [48.86, 2.35, 'Paris'], [50.94, 6.96, 'Köln'], [52.52, 13.4, 'Berlin'],
  [48.14, 11.58, 'München'], [50.11, 8.68, 'Frankfurt'], [53.55, 9.99, 'Hamburg'], [51.23, 6.78, 'Düsseldorf'],
  [48.78, 9.18, 'Stuttgart'], [47.37, 8.54, 'Zürich'], [46.2, 6.14, 'Genève'], [48.21, 16.37, 'Wien'],
  [50.08, 14.44, 'Praha'], [52.23, 21.01, 'Warszawa'], [47.5, 19.04, 'Budapest'], [44.43, 26.1, 'Bucureşti'],
  [42.7, 23.32, 'Sofia'], [37.98, 23.73, 'Athina'], [41.01, 28.98, 'İstanbul'], [40.42, -3.7, 'Madrid'],
  [41.39, 2.17, 'Barcelona'], [39.47, -.38, 'Valencia'], [38.72, -9.14, 'Lisboa'], [41.16, -8.63, 'Porto'],
  [45.46, 9.19, 'Milano'], [41.9, 12.5, 'Roma'], [43.77, 11.25, 'Firenze'], [40.85, 14.27, 'Napoli'],
  [50.85, 4.35, 'Bruxelles'], [52.37, 4.9, 'Amsterdam'], [51.92, 4.48, 'Rotterdam'],
  [53.35, -6.26, 'Dublin'], [55.95, -3.19, 'Edinburgh'], [53.48, -2.24, 'Manchester'],
  [59.33, 18.07, 'Stockholm'], [59.91, 10.75, 'Oslo'], [55.68, 12.57, 'København'], [60.17, 24.94, 'Helsinki'],
  [56.95, 24.11, 'Riga'], [54.69, 25.28, 'Vilnius'], [59.44, 24.75, 'Tallinn'],
  [55.75, 37.62, 'Moscow'], [50.45, 30.52, 'Kyiv'], [53.9, 27.57, 'Minsk'],
  [40.71, -74.01, 'New York'], [34.05, -118.24, 'Los Angeles'], [41.88, -87.63, 'Chicago'],
  [29.76, -95.37, 'Houston'], [33.45, -112.07, 'Phoenix'], [39.74, -104.99, 'Denver'],
  [37.77, -122.42, 'San Francisco'], [47.61, -122.33, 'Seattle'], [25.76, -80.19, 'Miami'],
  [38.91, -77.04, 'Washington DC'], [42.36, -71.06, 'Boston'], [36.17, -115.14, 'Las Vegas'],
  [32.72, -117.16, 'San Diego'], [30.27, -97.74, 'Austin'], [45.5, -73.57, 'Montréal'],
  [43.65, -79.38, 'Toronto'], [49.28, -123.12, 'Vancouver'], [51.05, -114.07, 'Calgary'],
  [19.43, -99.13, 'México City'], [14.63, -90.51, 'Guatemala'], [9.93, -84.08, 'San José CR'],
  [4.71, -74.07, 'Bogotá'], [-.18, -78.47, 'Quito'], [-12.05, -77.04, 'Lima'],
  [-33.45, -70.67, 'Santiago'], [-34.6, -58.38, 'Buenos Aires'], [-22.91, -43.17, 'Rio de Janeiro'],
  [-23.55, -46.63, 'São Paulo'], [-15.79, -47.88, 'Brasília'],
  [35.69, 51.39, 'Tehran'], [33.31, 44.37, 'Baghdad'], [24.71, 46.68, 'Riyadh'],
  [25.2, 55.27, 'Dubai'], [21.42, 39.83, 'Mecca'], [31.95, 35.93, 'Amman'],
  [33.89, 35.5, 'Beirut'], [32.08, 34.78, 'Tel Aviv'], [40.18, 44.51, 'Yerevan'],
  [39.92, 32.85, 'Ankara'], [38.42, 27.14, 'İzmir'],
  [30.04, 31.24, 'Cairo'], [36.75, 3.04, 'Algiers'], [33.97, -6.85, 'Rabat'],
  [6.52, 3.38, 'Lagos'], [-1.29, 36.82, 'Nairobi'], [-33.92, 18.42, 'Cape Town'],
  [-26.2, 28.04, 'Johannesburg'], [9.02, 38.75, 'Addis Ababa'], [5.56, -.19, 'Accra'],
  [39.91, 116.39, 'Beijing'], [31.23, 121.47, 'Shanghai'], [22.32, 114.17, 'Hong Kong'],
  [23.13, 113.26, 'Guangzhou'], [30.57, 104.07, 'Chengdu'],
  [35.68, 139.69, 'Tokyo'], [34.69, 135.5, 'Osaka'], [35.01, 135.77, 'Kyoto'],
  [37.57, 126.98, 'Seoul'], [35.18, 129.08, 'Busan'], [25.03, 121.57, 'Taipei'],
  [1.35, 103.82, 'Singapore'], [13.76, 100.5, 'Bangkok'], [21.03, 105.85, 'Hanoi'],
  [10.82, 106.63, 'Ho Chi Minh'], [14.6, 120.98, 'Manila'], [-6.21, 106.85, 'Jakarta'],
  [3.14, 101.69, 'Kuala Lumpur'],
  [28.61, 77.21, 'Delhi'], [19.08, 72.88, 'Mumbai'], [12.97, 77.59, 'Bengaluru'],
  [22.57, 88.36, 'Kolkata'], [27.18, 84.99, 'Kathmandu'], [33.69, 73.04, 'Islamabad'],
  [-33.87, 151.21, 'Sydney'], [-37.81, 144.96, 'Melbourne'], [-27.47, 153.03, 'Brisbane'],
  [-31.95, 115.86, 'Perth'], [-36.85, 174.76, 'Auckland'],
  [64.15, -21.94, 'Reykjavík'], [34.53, 69.17, 'Kabul'], [41.3, 69.28, 'Tashkent'],
];

function getCitiesOnLines(lines, cities, threshold = 3.5) {
  const r = [], seen = new Set();
  lines.forEach(l => {
    if (l.type === 'curve') {
      // For curved lines (ASC/DSC), check proximity to any point on the curve
      cities.forEach(([la, lo, name]) => {
        if (seen.has(name)) return;
        const near = l.points?.some(([pLo, pLa]) => {
          const dLo = Math.abs(lo - pLo);
          const dLa = Math.abs(la - pLa);
          return dLo < threshold && dLa < threshold;
        });
        if (near) {
          seen.add(name);
          r.push({ la, lo, name, line: l.n, lc: l.c, q: l.quality, dist: 1, desc: l.desc });
        }
      });
    } else {
      // MC/IC lines — check longitude proximity
      cities.forEach(([la, lo, name]) => {
        const d = Math.min(Math.abs(lo - l.lo), 360 - Math.abs(lo - l.lo));
        if (d <= threshold && !seen.has(name)) {
          seen.add(name);
          r.push({ la, lo, name, line: l.n, lc: l.c, q: l.quality, dist: d, desc: l.desc });
        }
      });
    }
  });
  return r.sort((a, b) => a.dist - b.dist);
}

function cityReading(c) {
  if (c.q === 'thrive') return `${c.name} lies on your ${c.line} line (${c.dist.toFixed(1)}° off). This is a zone of activation — your strengths are amplified here. Spending time in ${c.name} could boost your energy, career, and sense of purpose.`;
  if (c.q === 'avoid') return `${c.name} falls on your ${c.line} line (${c.dist.toFixed(1)}° off). This is a zone of challenge — difficulties may surface here. Short visits are fine, but long-term residence could drain your energy.`;
  return `${c.name} is near your ${c.line} line (${c.dist.toFixed(1)}° off). This is a neutral zone — neither strongly positive nor negative. You may experience subtle shifts in energy here.`;
}

export default function Dashboard() {
  const { user, profile, hasBirthData, signOut } = useAuth();
  const navigate = useNavigate();
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('thrive');
  const [clock, setClock] = useState('');
  const [popup, setPopup] = useState(null);
  const [cityPop, setCityPop] = useState(null);
  const [w, setW] = useState(900);
  const [showProf, setShowProf] = useState(false);
  const [expandedPlanet, setExpandedPlanet] = useState(null);
  const [showAngleInfo, setShowAngleInfo] = useState(false);
  const [flatMap, setFlatMap] = useState(false);
  const [hiddenPlanets, setHiddenPlanets] = useState(new Set());

  const mob = w < 900;

  useEffect(() => {
    const fmt = () => {
      const now = new Date();
      const dd = String(now.getUTCDate()).padStart(2, '0');
      const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
      const yy = String(now.getUTCFullYear()).slice(-2);
      const h24 = now.getUTCHours();
      const min = String(now.getUTCMinutes()).padStart(2, '0');
      const sec = String(now.getUTCSeconds()).padStart(2, '0');
      const h12 = h24 % 12 || 12;
      const ampm = h24 < 12 ? 'AM' : 'PM';
      setClock(`${dd}.${mm}.${yy}  ${String(h24).padStart(2, '0')}:${min}:${sec} (${h12}:${min} ${ampm}) UTC`);
    };
    fmt();
    const t = setInterval(fmt, 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    h(); window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // Redirect if no birth data
  useEffect(() => {
    if (!hasBirthData && profile !== null) {
      navigate('/birth-data', { replace: true });
    }
  }, [hasBirthData, profile, navigate]);

  // Calculate chart client-side when we have birth data
  useEffect(() => {
    if (!hasBirthData || !profile?.birth_date) return;

    setLoading(true);
    setError('');
    try {
      const data = calculateChart({
        date: profile.birth_date,
        time: profile.birth_time,
        lat: profile.birth_lat,
        lng: profile.birth_lng,
      });
      setChartData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [hasBirthData, profile]);

  const lines = chartData?.lines || [];
  const visibleLines = useMemo(() => lines.filter(l => !hiddenPlanets.has(l.planet)), [lines, hiddenPlanets]);
  const onLines = useMemo(() => getCitiesOnLines(visibleLines, ALL_CITIES, 3.5), [visibleLines]);

  const togglePlanet = useCallback((planet) => {
    setHiddenPlanets(prev => {
      const next = new Set(prev);
      if (next.has(planet)) next.delete(planet); else next.add(planet);
      return next;
    });
  }, []);

  // Group lines by planet for sidebar
  const planetGroups = useMemo(() => {
    const groups = [];
    const seen = new Set();
    lines.forEach(l => {
      if (!seen.has(l.planet)) {
        seen.add(l.planet);
        groups.push({
          planet: l.planet,
          symbol: l.symbol,
          color: l.c,
          quality: l.quality,
          lines: lines.filter(x => x.planet === l.planet),
        });
      }
    });
    return groups;
  }, [lines]);

  const thriveC = onLines.filter(c => c.q === 'thrive');
  const avoidC = onLines.filter(c => c.q === 'avoid');
  const filteredTab = tab === 'thrive' ? thriveC : tab === 'avoid' ? avoidC : onLines;
  const bestCities = onLines.filter(c => c.q === 'thrive').slice(0, 5);

  const homeLocation = profile ? [profile.birth_lng, profile.birth_lat, profile.birth_city?.split(',')[0] || 'HOME'] : null;
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';
  const planetString = chartData?.planetString || '';

  const flyTo = useCallback((la, lo) => {
    Globe.flyTo?.(la, lo);
  }, []);

  const handleCityClick = useCallback((city) => {
    setCityPop(city);
  }, []);

  // Loading state — only shown when actively fetching chart after birth data is saved
  if (loading && !chartData) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A1018', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...F, fontSize: 18, fontWeight: 700, color: '#00D88A', letterSpacing: 6, marginBottom: 24 }}>NATAL NAVIGATOR</div>
        <div style={{ ...F, fontSize: 11, color: '#8098B0', marginBottom: 20 }}>Calculating your planetary lines...</div>
        <div style={{ width: 240, height: 3, background: '#1A2840', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', background: '#00D88A', borderRadius: 2, animation: 'loadbar 1.5s ease-in-out infinite' }} />
        </div>
        <div style={{ ...F, fontSize: 9, color: '#3A5068', marginTop: 16 }}>Analyzing 10 planets × 4 angles = 40 lines</div>
        <style>{`@keyframes loadbar { 0% { transform: translateX(-100%); } 50% { transform: translateX(0%); } 100% { transform: translateX(100%); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A1018', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ ...F, fontSize: 14, color: '#F04060', marginBottom: 16 }}>Error: {error}</div>
        <button onClick={() => navigate('/birth-data')} style={{ ...F, fontSize: 11, color: '#00D88A', background: 'transparent', border: '1px solid #00D88A', borderRadius: 6, padding: '8px 20px', cursor: 'pointer' }}>
          Re-enter birth data
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0A1018', color: '#D0DDE8', fontFamily: 'Instrument Sans, sans-serif', overflow: 'hidden' }}>
      {/* TOPBAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 38, minHeight: 38, background: '#0D1520', borderBottom: '1px solid #1A2840', zIndex: 300, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ ...F, fontSize: 12, fontWeight: 700, color: '#00D88A', letterSpacing: 3 }}>NATAL NAVIGATOR</span>
          <div style={{ width: 1, height: 16, background: '#1A2840' }} />
          <span style={{ ...F, fontSize: 9, color: '#00D88A', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D88A', boxShadow: '0 0 8px #00D88A' }} />LIVE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!mob && <span style={{ ...F, fontSize: 9, color: '#5A7088' }}>{clock}</span>}
          <div onClick={() => setShowProf(!showProf)} style={{ ...F, fontSize: 9, color: '#8098B0', cursor: 'pointer', background: '#101C28', padding: '4px 10px', borderRadius: 4, border: '1px solid #1A2840', position: 'relative' }}>
            ◉ {displayName}
            {showProf && <div style={{ position: 'absolute', top: 32, right: 0, background: '#0D1520', border: '1px solid #1A2840', borderRadius: 8, padding: 14, minWidth: 220, zIndex: 600, boxShadow: '0 8px 32px rgba(0,0,0,.5)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#D0DDE8', marginBottom: 6 }}>{displayName}</div>
              <div style={{ ...F, fontSize: 10, color: '#8098B0', marginBottom: 3 }}>Born: {(() => {
                const [y, m, d] = (profile?.birth_date || '').split('-');
                const dateFmt = y ? `${d}.${m}.${y.slice(-2)}` : '';
                const t = profile?.birth_time || '';
                const [hh, mi] = t.split(':').map(Number);
                const h12 = hh % 12 || 12;
                const ampm = hh < 12 ? 'AM' : 'PM';
                const timeFmt = t ? `${String(hh).padStart(2, '0')}:${String(mi).padStart(2, '0')} (${h12}:${String(mi).padStart(2, '0')} ${ampm})` : '';
                return `${dateFmt} · ${timeFmt}`;
              })()}</div>
              <div style={{ ...F, fontSize: 10, color: '#8098B0', marginBottom: 6 }}>Location: {profile?.birth_city}</div>
              {chartData?.natal && <div style={{ ...F, fontSize: 9, color: '#5A7088' }}>
                ☉ {chartData.natal.sun?.sign} · ☽ {chartData.natal.moon?.sign} · ASC {chartData.natal.asc?.sign}
              </div>}
              <div style={{ borderTop: '1px solid #1A2840', marginTop: 10, paddingTop: 10, display: 'flex', gap: 12 }}>
                <span onClick={() => navigate('/birth-data')} style={{ ...F, fontSize: 9, color: '#5A7088', cursor: 'pointer' }}>Edit birth data</span>
                <span onClick={signOut} style={{ ...F, fontSize: 9, color: '#F04060', cursor: 'pointer' }}>Sign out</span>
              </div>
            </div>}
          </div>
        </div>
      </div>

      {/* PLANET TICKER */}
      <div style={{ height: 24, minHeight: 24, background: '#0B1218', borderBottom: '1px solid #14202C', display: 'flex', alignItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 20, whiteSpace: 'nowrap', ...F, fontSize: 9, animation: 'ts 80s linear infinite' }}>
          {[planetString, planetString].map((t, i) => <span key={i} style={{ color: '#E8A838', padding: '0 20px' }}>{t}</span>)}
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT SIDEBAR */}
        {!mob && <div style={{ width: 220, minWidth: 220, background: '#0D1520', borderRight: '1px solid #1A2840', overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Header with info button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px 6px' }}>
            <span style={{ ...F, fontSize: 9, fontWeight: 600, color: '#5A7088', letterSpacing: 2 }}>PLANETS</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {hiddenPlanets.size > 0 && <span onClick={() => setHiddenPlanets(new Set())} style={{ ...F, fontSize: 8, color: '#00D88A', cursor: 'pointer', padding: '2px 6px', borderRadius: 3, border: '1px solid #00D88A40', background: '#00D88A10' }}>All on</span>}
              <span onClick={() => setShowAngleInfo(!showAngleInfo)} style={{ ...F, fontSize: 9, color: showAngleInfo ? '#00D88A' : '#3A5068', cursor: 'pointer', padding: '2px 6px', borderRadius: 3, border: `1px solid ${showAngleInfo ? '#00D88A40' : '#1A2840'}`, background: showAngleInfo ? '#00D88A10' : 'transparent' }}>?</span>
            </div>
          </div>

          {/* Angle info panel (collapsible) */}
          {showAngleInfo && <div style={{ margin: '0 8px 8px', background: '#0A1420', border: '1px solid #1A2840', borderRadius: 6, padding: 10 }}>
            <div style={{ ...F, fontSize: 9, fontWeight: 700, color: '#8098B0', marginBottom: 8 }}>LINE TYPES</div>
            {ANGLE_ORDER.map(a => {
              const info = ANGLE_INFO[a];
              return (
                <div key={a} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #14202C' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {/* Visual dash preview */}
                    <svg width="22" height="6" style={{ flexShrink: 0 }}>
                      {a === 'MC' && <line x1="0" y1="3" x2="22" y2="3" stroke="#8098B0" strokeWidth="2" />}
                      {a === 'IC' && <line x1="0" y1="3" x2="22" y2="3" stroke="#8098B0" strokeWidth="2" strokeDasharray="4,3" />}
                      {a === 'ASC' && <line x1="0" y1="3" x2="22" y2="3" stroke="#8098B0" strokeWidth="2" strokeDasharray="8,3" />}
                      {a === 'DC' && <line x1="0" y1="3" x2="22" y2="3" stroke="#8098B0" strokeWidth="2" strokeDasharray="2,2" />}
                    </svg>
                    <span style={{ ...F, fontSize: 9, fontWeight: 700, color: '#D0DDE8' }}>{info.label}</span>
                    <span style={{ ...F, fontSize: 7, color: '#5A7088' }}>{info.full}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#6A8098', lineHeight: 1.5, marginLeft: 30 }}>{info.desc}</div>
                </div>
              );
            })}
            <div style={{ ...F, fontSize: 8, color: '#3A5068', lineHeight: 1.5, borderTop: '1px solid #14202C', paddingTop: 6, marginTop: 2 }}>
              MC & IC are vertical meridian lines (pole to pole).<br />
              ASC & DC are curved lines that follow the horizon.
            </div>
          </div>}

          {/* Planet groups */}
          {planetGroups.map(g => {
            const isOpen = expandedPlanet === g.planet;
            const isHidden = hiddenPlanets.has(g.planet);
            const planetCities = onLines.filter(c => g.lines.some(l => l.n === c.line));
            return (
              <div key={g.planet} style={{ opacity: isHidden ? 0.4 : 1, transition: 'opacity .15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #14202C', background: isOpen ? '#101C28' : 'transparent', transition: 'background .15s' }}>
                  <div onClick={e => { e.stopPropagation(); togglePlanet(g.planet); }} style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, cursor: 'pointer', flexShrink: 0, background: isHidden ? '#1A2840' : g.color + '25', border: `1px solid ${isHidden ? '#1A2840' : g.color + '50'}` }} title={isHidden ? 'Show on map' : 'Hide from map'}>
                    <span style={{ ...F, fontSize: 8, color: isHidden ? '#3A5068' : g.color }}>{isHidden ? '○' : '●'}</span>
                  </div>
                  <div onClick={() => setExpandedPlanet(isOpen ? null : g.planet)} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, lineHeight: 1 }}>{g.symbol}</span>
                    <span style={{ ...F, fontSize: 10, color: '#B0C0D0', flex: 1, fontWeight: 600 }}>{g.planet}</span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {g.lines.map(l => (
                        <span key={l.angle} style={{ ...F, fontSize: 7, color: l.quality === 'thrive' ? '#00D88A' : l.quality === 'avoid' ? '#F04060' : '#D8A030', background: (l.quality === 'thrive' ? '#00D88A' : l.quality === 'avoid' ? '#F04060' : '#D8A030') + '15', padding: '1px 4px', borderRadius: 2 }}>{l.angle}</span>
                      ))}
                    </div>
                    <span style={{ ...F, fontSize: 10, color: '#3A5068', transform: isOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .15s' }}>›</span>
                  </div>
                </div>
                {/* Expanded detail */}
                {isOpen && <div style={{ background: '#0A1420', borderBottom: '1px solid #14202C' }}>
                  {g.lines.map((l, li) => (
                    <div key={li} onClick={() => setPopup(lines.indexOf(l) === popup ? null : lines.indexOf(l))} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 28px', cursor: 'pointer', borderBottom: '1px solid #0F1820' }}>
                      {/* Dash preview */}
                      <svg width="18" height="4" style={{ flexShrink: 0 }}>
                        {l.angle === 'MC' && <line x1="0" y1="2" x2="18" y2="2" stroke={l.c} strokeWidth="2" />}
                        {l.angle === 'IC' && <line x1="0" y1="2" x2="18" y2="2" stroke={l.c} strokeWidth="2" strokeDasharray="4,3" />}
                        {l.angle === 'ASC' && <line x1="0" y1="2" x2="18" y2="2" stroke={l.c} strokeWidth="2" strokeDasharray="8,3" />}
                        {l.angle === 'DC' && <line x1="0" y1="2" x2="18" y2="2" stroke={l.c} strokeWidth="2" strokeDasharray="2,2" />}
                      </svg>
                      <span style={{ ...F, fontSize: 9, color: '#8098B0', flex: 1 }}>{l.angle}</span>
                      <span style={{ ...F, fontSize: 7, color: l.quality === 'thrive' ? '#00D88A' : l.quality === 'avoid' ? '#F04060' : '#D8A030' }}>
                        {l.quality === 'thrive' ? '▲' : l.quality === 'avoid' ? '▼' : '◆'}
                      </span>
                    </div>
                  ))}
                  {planetCities.length > 0 && <div style={{ padding: '4px 12px 6px 28px', ...F, fontSize: 8, color: '#3A5068', lineHeight: 1.5 }}>
                    {planetCities.slice(0, 5).map(c => c.name).join(' · ')}{planetCities.length > 5 ? ` +${planetCities.length - 5}` : ''}
                  </div>}
                </div>}
              </div>
            );
          })}

          {/* Zones */}
          <div style={{ ...F, fontSize: 9, fontWeight: 600, color: '#5A7088', letterSpacing: 2, padding: '12px 12px 6px', borderTop: '1px solid #1A2840', marginTop: 2 }}>ZONES</div>
          {[['thrive', 'Thrive Zone', 'Strengths amplified'], ['avoid', 'Caution Zone', 'Challenges likely'], ['neutral', 'Neutral', 'Subtle influence']].map(([t, l, d]) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 12px', ...F, fontSize: 9, color: '#8098B0' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: COL[t], flexShrink: 0 }} />
              <span>{l}</span>
              <span style={{ fontSize: 7, color: '#3A5068', marginLeft: 'auto' }}>{d}</span>
            </div>
          ))}

          {/* Top Cities */}
          <div style={{ ...F, fontSize: 9, fontWeight: 600, color: '#5A7088', letterSpacing: 2, padding: '12px 12px 6px', borderTop: '1px solid #1A2840', marginTop: 2 }}>TOP CITIES</div>
          {bestCities.map((c, i) => (
            <div key={i} onClick={() => flyTo(c.la, c.lo)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', cursor: 'pointer', ...F, fontSize: 9 }}>
              <span style={{ color: '#00D88A', fontWeight: 700, width: 14 }}>{i + 1}.</span>
              <span style={{ color: '#B0C0D0' }}>{c.name}</span>
              <span style={{ color: '#3A5068', marginLeft: 'auto', fontSize: 8 }}>{c.line}</span>
            </div>
          ))}
          <div style={{ ...F, fontSize: 8, color: '#1A2840', padding: '12px', marginTop: 'auto', lineHeight: 1.6 }}>
            Drag = Rotate · Scroll = Zoom<br />Double-click = Zoom to point<br />Click city = Reading
          </div>
        </div>}

        {/* GLOBE */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0A1018', cursor: 'grab' }}>
          <Globe lines={visibleLines} citiesOnLines={onLines} homeLocation={homeLocation} onCityClick={handleCityClick} flat={flatMap} />

          {/* Map mode toggle — top right */}
          <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 50, display: 'flex', background: 'rgba(13,21,32,.92)', border: '1px solid #1A2840', borderRadius: 6, overflow: 'hidden' }}>
            <button onClick={() => setFlatMap(false)} style={{ ...F, fontSize: 9, fontWeight: 600, padding: '6px 12px', border: 'none', cursor: 'pointer', color: !flatMap ? '#00D88A' : '#5A7088', background: !flatMap ? '#00D88A15' : 'transparent', borderRight: '1px solid #1A2840' }}>
              ◉ Globe
            </button>
            <button onClick={() => setFlatMap(true)} style={{ ...F, fontSize: 9, fontWeight: 600, padding: '6px 12px', border: 'none', cursor: 'pointer', color: flatMap ? '#00D88A' : '#5A7088', background: flatMap ? '#00D88A15' : 'transparent' }}>
              ▭ Map
            </button>
          </div>

          {/* Line info popup */}
          {typeof popup === 'number' && lines[popup] && (
            <div style={{ position: 'absolute', top: mob ? 8 : 50, left: mob ? 8 : 8, right: mob ? 8 : 'auto', width: mob ? 'auto' : 320, background: 'rgba(13,21,32,.97)', border: '1px solid #1A2840', borderRadius: 8, padding: 16, zIndex: 100, boxShadow: '0 12px 40px rgba(0,0,0,.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 20, height: 3, borderRadius: 2, background: lines[popup].c }} />
                <span style={{ ...F, fontSize: 13, fontWeight: 700, color: lines[popup].c }}>{lines[popup].n}</span>
                <span style={{ ...F, fontSize: 9, color: '#5A7088' }}>{lines[popup].angle}</span>
                <span onClick={() => setPopup(null)} style={{ marginLeft: 'auto', cursor: 'pointer', ...F, fontSize: 14, color: '#5A7088' }}>✕</span>
              </div>
              <div style={{ fontSize: 13, color: '#8098B0', lineHeight: 1.8 }}>{lines[popup].desc}</div>
              <div style={{ ...F, fontSize: 9, color: '#3A5068', marginTop: 10 }}>Cities: {onLines.filter(c => c.line === lines[popup].n).map(c => c.name).join(' · ')}</div>
            </div>
          )}

          {/* City reading popup */}
          {cityPop && (
            <div style={{ position: 'absolute', bottom: mob ? 8 : 16, right: mob ? 8 : 16, left: mob ? 8 : 'auto', width: mob ? 'auto' : 340, background: 'rgba(13,21,32,.97)', border: `1px solid ${cityPop.lc}30`, borderRadius: 8, padding: 16, zIndex: 100, boxShadow: '0 12px 40px rgba(0,0,0,.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: cityPop.lc }} />
                <span style={{ ...F, fontSize: 14, fontWeight: 700, color: '#D0DDE8' }}>{cityPop.name}</span>
                <span style={{ ...F, fontSize: 9, fontWeight: 700, color: cityPop.q === 'thrive' ? COL.thrive : cityPop.q === 'avoid' ? COL.avoid : COL.neutral, marginLeft: 'auto' }}>
                  {cityPop.q === 'thrive' ? 'THRIVE' : cityPop.q === 'avoid' ? 'CAUTION' : 'NEUTRAL'}
                </span>
                <span onClick={() => setCityPop(null)} style={{ cursor: 'pointer', ...F, fontSize: 14, color: '#5A7088', marginLeft: 8 }}>✕</span>
              </div>
              <div style={{ ...F, fontSize: 9, color: cityPop.lc, marginBottom: 6 }}>{cityPop.line} · {cityPop.dist.toFixed(1)}° from line</div>
              <div style={{ fontSize: 12, color: '#8098B0', lineHeight: 1.7 }}>{cityReading(cityPop)}</div>
            </div>
          )}

          {/* Mobile legend toggle */}
          {mob && <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 50 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <div onClick={() => setPopup(popup === 'leg' ? null : 'leg')} style={{ ...F, fontSize: 9, color: '#00D88A', background: 'rgba(13,21,32,.95)', border: '1px solid #1A2840', borderRadius: 4, padding: '6px 10px', cursor: 'pointer' }}>☰ PLANETS</div>
              <div onClick={() => setShowAngleInfo(!showAngleInfo)} style={{ ...F, fontSize: 9, color: showAngleInfo ? '#00D88A' : '#5A7088', background: 'rgba(13,21,32,.95)', border: '1px solid #1A2840', borderRadius: 4, padding: '6px 8px', cursor: 'pointer' }}>?</div>
            </div>
            {popup === 'leg' && <div style={{ background: 'rgba(13,21,32,.97)', border: '1px solid #1A2840', borderRadius: 6, padding: 10, marginTop: 4, minWidth: 200, maxHeight: '60vh', overflowY: 'auto' }}>
              {planetGroups.map(g => {
                const isHid = hiddenPlanets.has(g.planet);
                return (
                <div key={g.planet} style={{ marginBottom: 4, opacity: isHid ? 0.4 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 0' }}>
                    <span onClick={e => { e.stopPropagation(); togglePlanet(g.planet); }} style={{ ...F, fontSize: 10, cursor: 'pointer', color: isHid ? '#3A5068' : g.color }}>{isHid ? '○' : '●'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setExpandedPlanet(expandedPlanet === g.planet ? null : g.planet); }}>
                      <span style={{ fontSize: 13 }}>{g.symbol}</span>
                      <span style={{ ...F, fontSize: 9, color: '#B0C0D0', fontWeight: 600 }}>{g.planet}</span>
                      <span style={{ ...F, fontSize: 10, color: '#3A5068', marginLeft: 'auto' }}>›</span>
                    </div>
                  </div>
                  {expandedPlanet === g.planet && g.lines.map((l, li) => (
                    <div key={li} onClick={e => { e.stopPropagation(); setPopup(lines.indexOf(l)); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0 4px 20px', cursor: 'pointer' }}>
                      <svg width="14" height="3" style={{ flexShrink: 0 }}>
                        {l.angle === 'MC' && <line x1="0" y1="1.5" x2="14" y2="1.5" stroke={l.c} strokeWidth="2" />}
                        {l.angle === 'IC' && <line x1="0" y1="1.5" x2="14" y2="1.5" stroke={l.c} strokeWidth="2" strokeDasharray="3,2" />}
                        {l.angle === 'ASC' && <line x1="0" y1="1.5" x2="14" y2="1.5" stroke={l.c} strokeWidth="2" strokeDasharray="6,2" />}
                        {l.angle === 'DC' && <line x1="0" y1="1.5" x2="14" y2="1.5" stroke={l.c} strokeWidth="2" strokeDasharray="1.5,1.5" />}
                      </svg>
                      <span style={{ ...F, fontSize: 9, color: '#8098B0' }}>{l.angle}</span>
                      <span style={{ ...F, fontSize: 7, color: l.quality === 'thrive' ? '#00D88A' : l.quality === 'avoid' ? '#F04060' : '#D8A030' }}>
                        {l.quality === 'thrive' ? '▲' : l.quality === 'avoid' ? '▼' : '◆'}
                      </span>
                    </div>
                  ))}
                </div>
              )})}
            </div>}
            {/* Mobile angle info */}
            {showAngleInfo && <div style={{ background: 'rgba(13,21,32,.97)', border: '1px solid #1A2840', borderRadius: 6, padding: 12, marginTop: 4, minWidth: 260, maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ ...F, fontSize: 9, fontWeight: 700, color: '#8098B0' }}>LINE TYPES</span>
                <span onClick={() => setShowAngleInfo(false)} style={{ ...F, fontSize: 14, color: '#5A7088', cursor: 'pointer' }}>✕</span>
              </div>
              {ANGLE_ORDER.map(a => {
                const info = ANGLE_INFO[a];
                return (
                  <div key={a} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #14202C' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <svg width="16" height="4">
                        {a === 'MC' && <line x1="0" y1="2" x2="16" y2="2" stroke="#8098B0" strokeWidth="2" />}
                        {a === 'IC' && <line x1="0" y1="2" x2="16" y2="2" stroke="#8098B0" strokeWidth="2" strokeDasharray="4,3" />}
                        {a === 'ASC' && <line x1="0" y1="2" x2="16" y2="2" stroke="#8098B0" strokeWidth="2" strokeDasharray="8,3" />}
                        {a === 'DC' && <line x1="0" y1="2" x2="16" y2="2" stroke="#8098B0" strokeWidth="2" strokeDasharray="2,2" />}
                      </svg>
                      <span style={{ ...F, fontSize: 10, fontWeight: 700, color: '#D0DDE8' }}>{info.label}</span>
                      <span style={{ ...F, fontSize: 7, color: '#5A7088' }}>{info.full}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#6A8098', lineHeight: 1.5, marginLeft: 22 }}>{info.desc}</div>
                  </div>
                );
              })}
            </div>}
          </div>}
        </div>
      </div>

      {/* BOTTOM PANEL */}
      <div style={{ minHeight: mob ? 165 : 190, maxHeight: mob ? 165 : 190, background: '#0D1520', borderTop: '1px solid #1A2840', display: 'flex', flexShrink: 0, zIndex: 200 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #1A2840', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #14202C', flexShrink: 0 }}>
            {['thrive', 'avoid', 'all'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, background: tab === t ? '#101C28' : 'transparent', border: 'none',
                borderBottom: tab === t ? `2px solid ${t === 'thrive' ? COL.thrive : t === 'avoid' ? COL.avoid : '#5A7088'}` : '2px solid transparent',
                color: tab === t ? (t === 'thrive' ? COL.thrive : t === 'avoid' ? COL.avoid : '#B0C0D0') : '#3A5068',
                cursor: 'pointer', padding: mob ? '5px 0' : '6px 0', ...F, fontSize: mob ? 8 : 9, fontWeight: 700, letterSpacing: 1
              }}>
                {t === 'thrive' ? `▲ THRIVE (${thriveC.length})` : t === 'avoid' ? `▼ AVOID (${avoidC.length})` : `ALL (${onLines.length})`}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredTab.map((c, i) => (
              <div key={i} onClick={() => flyTo(c.la, c.lo)} style={{ display: 'flex', padding: '5px 12px', borderBottom: '1px solid #14202C', cursor: 'pointer', gap: 7, alignItems: 'center' }}>
                <div style={{ width: 3, height: 20, borderRadius: 1, background: c.lc, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#D0DDE8' }}>{c.name}</span>
                    <span style={{ ...F, fontSize: 7, color: c.lc, background: c.lc + '15', padding: '1px 5px', borderRadius: 2 }}>{c.line}</span>
                    <span style={{ ...F, fontSize: 8, color: '#3A5068', marginLeft: 'auto' }}>{c.dist.toFixed(1)}°</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {!mob && <div style={{ width: 280, minWidth: 280, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ ...F, fontSize: 9, fontWeight: 600, color: '#5A7088', letterSpacing: 1.5, padding: '8px 12px', borderBottom: '1px solid #14202C' }}>
            ON YOUR LINES — {onLines.length} CITIES
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {lines.map((l, i) => {
              const cities = onLines.filter(c => c.line === l.n);
              if (!cities.length) return null;
              return (
                <div key={i} style={{ padding: '4px 12px', borderBottom: '1px solid #0F1820' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <div style={{ width: 10, height: 2, background: l.c, borderRadius: 1 }} />
                    <span style={{ ...F, fontSize: 8, color: '#8098B0', fontWeight: 600 }}>{l.n}</span>
                    <span style={{ ...F, fontSize: 7, color: '#3A5068', marginLeft: 'auto' }}>{cities.length} cities</span>
                  </div>
                  <div style={{ ...F, fontSize: 8, color: '#5A7088', lineHeight: 1.5 }}>{cities.map(c => c.name).join(' · ')}</div>
                </div>
              );
            })}
          </div>
        </div>}
      </div>

      {/* BOTTOM TICKER */}
      <div style={{ height: 22, minHeight: 22, background: '#0A1018', borderTop: '1px solid #14202C', display: 'flex', alignItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 24, whiteSpace: 'nowrap', ...F, fontSize: 8, animation: 'ts 55s linear infinite' }}>
          {[...Array(2)].flatMap(() => [
            bestCities[0] ? `★ Best city: ${bestCities[0].name} (${bestCities[0].line})` : '★ Your personalized chart',
            `▲ ${thriveC.length} cities on thrive lines`,
            `▼ ${avoidC.length} cities on caution lines`,
            `◉ ${onLines.length} total cities on your natal lines`,
          ]).map((t, i) => (
            <span key={i} style={{ color: t.startsWith('▼') ? '#F04060' : t.startsWith('▲') ? '#00D88A' : '#5A7088', padding: '0 4px' }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
