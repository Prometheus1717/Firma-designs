import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Globe from '../components/Globe';
import { calculateChart } from '../lib/calculateChart';
import { ALL_CITIES, CITIES_T1, CITIES_T2, CITIES_T3 } from '../data/cities';
import { getCachedChart, setCachedChart } from '../lib/chartCache';
import { redirectToCheckout } from '../lib/stripe';
import { trackEvent } from '../lib/posthog';

// Demo chart: Elon Musk — public birth data
const DEMO = {
  date: '1971-06-28', time: '07:00',
  lat: -25.7479, lng: 28.2293,
  city: 'Pretoria, South Africa',
  name: 'Elon Musk',
};

const F = { fontFamily: 'JetBrains Mono, monospace' };
const COL = { thrive: '#00D88A', avoid: '#F04060', neutral: '#D8A030' };
const PCOL = { Sun: '#E8A838', Moon: '#C0C0C0', Mercury: '#5BA8D4', Venus: '#D4729A', Mars: '#D45050', Jupiter: '#8068C0', Saturn: '#887058', Uranus: '#40B0A0', Neptune: '#4868B8', Pluto: '#7048A0' };
const SIGN_SYMBOLS = { Aries: '♈\uFE0E', Taurus: '♉\uFE0E', Gemini: '♊\uFE0E', Cancer: '♋\uFE0E', Leo: '♌\uFE0E', Virgo: '♍\uFE0E', Libra: '♎\uFE0E', Scorpio: '♏\uFE0E', Sagittarius: '♐\uFE0E', Capricorn: '♑\uFE0E', Aquarius: '♒\uFE0E', Pisces: '♓\uFE0E' };
const SIGN_ELEMENTS = { Aries: 'Fire', Taurus: 'Earth', Gemini: 'Air', Cancer: 'Water', Leo: 'Fire', Virgo: 'Earth', Libra: 'Air', Scorpio: 'Water', Sagittarius: 'Fire', Capricorn: 'Earth', Aquarius: 'Air', Pisces: 'Water' };
const SIGN_MODES = { Aries: 'Cardinal', Taurus: 'Fixed', Gemini: 'Mutable', Cancer: 'Cardinal', Leo: 'Fixed', Virgo: 'Mutable', Libra: 'Cardinal', Scorpio: 'Fixed', Sagittarius: 'Mutable', Capricorn: 'Cardinal', Aquarius: 'Fixed', Pisces: 'Mutable' };
const ELEM_COL = { Fire: '#F04060', Earth: '#00D88A', Air: '#5BA8D4', Water: '#4868B8' };


const ANGLE_INFO = {
  MC: { label: 'MC', full: 'Medium Coeli (Midheaven)', dash: 'solid', desc: 'The highest point in the sky at your birth. Represents career, public reputation, and how the world sees your achievements. On your MC line, you feel professionally empowered and publicly recognized.' },
  IC: { label: 'IC', full: 'Imum Coeli (Nadir)', dash: 'dashed', desc: 'The deepest point below the horizon. Represents home, roots, family, and inner emotional life. On your IC line, you feel a deep sense of belonging and emotional grounding.' },
  ASC: { label: 'ASC', full: 'Ascendant (Rising)', dash: 'long dash', desc: 'The eastern horizon at your birth. Represents your identity, self-expression, and first impressions. On your ASC line, your personality shines and others see your authentic self.' },
  DC: { label: 'DC', full: 'Descendant (Setting)', dash: 'dotted', desc: 'The western horizon, opposite the Ascendant. Represents partnerships, relationships, and how you connect with others. On your DC line, meaningful relationships and alliances form naturally.' },
};

const ANGLE_ORDER = ['MC', 'IC', 'ASC', 'DC'];


// Spatial grid index for O(1) cell lookup instead of brute-force O(n*m)
// At 100k users each computing their own chart, this saves ~90% of CPU per client
const GRID_SIZE = 5; // 5° cells — larger than threshold so one neighbor ring suffices
let _cityGrid = null;
function getCityGrid(cities) {
  if (_cityGrid) return _cityGrid;
  const grid = {};
  for (const city of cities) {
    const key = `${Math.floor(city[0] / GRID_SIZE)},${Math.floor((city[1] + 180) / GRID_SIZE)}`;
    (grid[key] || (grid[key] = [])).push(city);
  }
  _cityGrid = grid;
  return grid;
}

function getCitiesNearPoint(grid, lat, lon, radius) {
  const result = [];
  const latMin = Math.floor((lat - radius) / GRID_SIZE);
  const latMax = Math.floor((lat + radius) / GRID_SIZE);
  const lonMin = Math.floor((lon + 180 - radius) / GRID_SIZE);
  const lonMax = Math.floor((lon + 180 + radius) / GRID_SIZE);
  for (let la = latMin; la <= latMax; la++) {
    for (let lo = lonMin; lo <= lonMax; lo++) {
      const key = `${la},${lo}`;
      if (grid[key]) result.push(...grid[key]);
    }
  }
  return result;
}

const TO_RAD = Math.PI / 180;
function gcDist(la1, lo1, la2, lo2) {
  const dLa = (la2 - la1) * TO_RAD, dLo = (lo2 - lo1) * TO_RAD;
  const a = Math.sin(dLa / 2) ** 2 + Math.cos(la1 * TO_RAD) * Math.cos(la2 * TO_RAD) * Math.sin(dLo / 2) ** 2;
  return Math.asin(Math.min(1, Math.sqrt(a))) * 2 / TO_RAD;
}

function getCitiesOnLines(lines, cities, threshold = 3.5) {
  const grid = getCityGrid(cities);
  // Phase 1: compute distance from every city to every line, keep the best (closest) match
  const best = new Map(); // cityName → { la, lo, name, line, lc, q, dist, desc }

  for (const l of lines) {
    if (l.type === 'curve') {
      const pts = [];
      for (const seg of (l.segments || [l.points])) { if (seg) pts.push(...seg); }
      if (!pts.length) continue;
      // Sample curve points and gather candidate cities from grid cells
      const candidates = new Map();
      for (let i = 0; i < pts.length; i += 4) {
        const nearby = getCitiesNearPoint(grid, pts[i][1], pts[i][0], threshold + 1);
        for (const c of nearby) {
          if (!candidates.has(c[2])) candidates.set(c[2], c);
        }
      }
      for (const [name, [la, lo]] of candidates) {
        let minD = Infinity, bestI = 0;
        for (let i = 0; i < pts.length; i += 8) {
          const d = gcDist(la, lo, pts[i][1], pts[i][0]);
          if (d < minD) { minD = d; bestI = i; }
          if (minD < 0.5) break;
        }
        if (minD < threshold * 2) {
          const s = Math.max(0, bestI - 8), e = Math.min(pts.length, bestI + 9);
          for (let i = s; i < e; i++) {
            const d = gcDist(la, lo, pts[i][1], pts[i][0]);
            if (d < minD) minD = d;
          }
        }
        if (minD <= threshold) {
          const prev = best.get(name);
          if (!prev || minD < prev.dist) {
            best.set(name, { la, lo, name, line: l.n, lc: l.c, q: l.quality, dist: Math.round(minD * 10) / 10, desc: l.desc });
          }
        }
      }
    } else {
      // Meridian line
      for (const [la, lo, name] of cities) {
        const d = Math.min(Math.abs(lo - l.lo), 360 - Math.abs(lo - l.lo));
        if (d <= threshold) {
          const prev = best.get(name);
          const rounded = Math.round(d * 10) / 10;
          if (!prev || rounded < prev.dist) {
            best.set(name, { la, lo, name, line: l.n, lc: l.c, q: l.quality, dist: rounded, desc: l.desc });
          }
        }
      }
    }
  }
  return Array.from(best.values()).sort((a, b) => a.dist - b.dist);
}

const CITY_READINGS = {
  // ── SUN ──
  'Sun-MC-thrive': (n) => `${n} lies on your Sun MC line — the most powerful place for your career and public recognition. Here you step into authority naturally. People see you as a leader and your professional ambitions gain real traction. This is where you can build a lasting reputation and be celebrated for who you truly are.`,
  'Sun-IC-thrive': (n) => `${n} lies on your Sun IC line — a place of deep inner vitality and connection to your roots. Living here strengthens your sense of self at the most fundamental level. Family bonds deepen, your home life feels radiant and warm, and you discover a quiet but powerful inner confidence.`,
  'Sun-ASC-thrive': (n) => `${n} lies on your Sun ASC line — here your personality shines at full wattage. You feel genuinely alive, confident, and visible. Others are drawn to your energy. This is an ideal place to reinvent yourself, start fresh, or simply feel like the best version of you.`,
  'Sun-DC-thrive': (n) => `${n} lies on your Sun DC line — partnerships become a source of joy and empowerment here. You attract confident, generous people who elevate your life. Romantic and business relationships flourish, and collaborations feel balanced and mutually energizing.`,
  // ── MOON ──
  'Moon-MC-thrive': (n) => `${n} lies on your Moon MC line — your emotional intelligence becomes your greatest public asset here. People feel connected to you on a deep level. You can thrive in nurturing professions — counseling, hospitality, healthcare, teaching — anything where empathy is valued. The public embraces your warmth.`,
  'Moon-IC-thrive': (n) => `${n} lies on your Moon IC line — this is your soul's home. No other placement creates such a profound sense of belonging. Living here feels like coming home after a long journey. Emotional healing happens naturally, your intuition sharpens, and domestic life is deeply fulfilling.`,
  'Moon-ASC-thrive': (n) => `${n} lies on your Moon ASC line — here your emotional world is visible and magnetic. Others sense your depth and respond with care. You become more intuitive, more empathetic, more attuned to the moods around you. Ideal for creative self-expression and emotional growth.`,
  'Moon-DC-thrive': (n) => `${n} lies on your Moon DC line — deep emotional bonds form here almost effortlessly. Partnerships feel fated and nurturing. You attract caring, emotionally available people. Romantic connections are tender and intuitive. This is a powerful place for building family.`,
  // ── MERCURY ──
  'Mercury-MC-neutral': (n) => `${n} is near your Mercury MC line — your communication skills gain visibility here. Writing, speaking, teaching, and media work flow more easily. You may attract intellectual recognition, though the energy is subtle rather than dramatic. Good for networking and building a voice in your field.`,
  'Mercury-IC-neutral': (n) => `${n} is near your Mercury IC line — your mental life deepens here. You think more clearly in private, journaling and study feel natural, and ideas come easily at home. The effect is gentle — a quiet intellectual sharpening rather than a dramatic shift. Good for writing retreats or academic work.`,
  'Mercury-ASC-neutral': (n) => `${n} is near your Mercury ASC line — you come across as quick-witted and articulate here. Communication defines how others see you. The influence is moderate — you won't be transformed, but you'll notice conversations flow more easily and your ideas land with more impact.`,
  'Mercury-DC-neutral': (n) => `${n} is near your Mercury DC line — intellectual connections thrive here. You attract smart, communicative partners and collaborators. Conversations spark new ideas. The effect is subtle but enriching — ideal for short-term collaborations, study abroad, or finding like-minded communities.`,
  // ── VENUS ──
  'Venus-MC-thrive': (n) => `${n} lies on your Venus MC line — you are perceived as charming, beautiful, and artistically gifted here. This is one of the best places for creative careers, fashion, art, music, and anything aesthetic. Social success comes easily — people want to be around you, and doors open through your natural magnetism.`,
  'Venus-IC-thrive': (n) => `${n} lies on your Venus IC line — your home life becomes a sanctuary of beauty and comfort. Living here nourishes your soul through art, nature, and sensory pleasure. Relationships with family soften, your living space feels like a work of art, and daily life takes on a graceful, pleasurable quality.`,
  'Venus-ASC-thrive': (n) => `${n} lies on your Venus ASC line — personal beauty, charm, and grace define your presence here. Others find you irresistible. This is an incredible placement for romance, social life, and self-confidence. You naturally attract love, compliments, and harmonious experiences wherever you go.`,
  'Venus-DC-thrive': (n) => `${n} lies on your Venus DC line — this is one of the most powerful places for love and partnership. Romantic connections are harmonious, passionate, and enduring. You attract partners who value beauty, affection, and balance. Business partnerships also benefit from Venus's grace and diplomacy.`,
  // ── MARS ──
  'Mars-MC-neutral': (n) => `${n} is near your Mars MC line — career ambition intensifies here, but so does conflict with authority. You feel driven to compete, achieve, and lead, yet power struggles with bosses or institutions may arise. Channel this energy into entrepreneurship, athletics, or any field that rewards bold action.`,
  'Mars-IC-avoid': (n) => `${n} falls on your Mars IC line — domestic life becomes volatile here. Arguments at home, property disputes, and family tensions are more likely. You may feel restless, irritable, or combative within your own walls. Short visits can energize you, but long-term residence risks chronic stress and conflict at your foundation.`,
  'Mars-ASC-neutral': (n) => `${n} is near your Mars ASC line — physical energy and assertiveness spike here. You become bolder, more direct, and physically active. This can be channeled into sports, fitness, or courageous action. But impulsivity and confrontations also rise. Visit with awareness — this energy needs conscious direction.`,
  'Mars-DC-avoid': (n) => `${n} falls on your Mars DC line — relationships become a battleground here. Partners provoke conflict, power struggles erupt, and arguments escalate. You attract combative, aggressive people. Existing relationships may fracture under the pressure. Avoid settling here long-term if harmony in partnerships matters to you.`,
  // ── JUPITER ──
  'Jupiter-MC-thrive': (n) => `${n} lies on your Jupiter MC line — this is one of the luckiest places for your career. Opportunities expand, mentors appear, and professional success feels almost effortless. You are seen as wise, generous, and trustworthy. Ideal for entrepreneurship, academia, law, publishing, or international business.`,
  'Jupiter-IC-thrive': (n) => `${n} lies on your Jupiter IC line — home life feels abundant and generous here. Your living space expands, family relationships are warm and supportive, and there's a feeling of inner wealth and contentment. This is an excellent place to raise a family, buy property, or build a deeply satisfying private life.`,
  'Jupiter-ASC-thrive': (n) => `${n} lies on your Jupiter ASC line — optimism, growth, and good fortune define your experience here. You feel larger than life — confident, adventurous, and open to possibility. Others see you as generous and inspiring. Travel, education, and philosophical exploration thrive in this location.`,
  'Jupiter-DC-thrive': (n) => `${n} lies on your Jupiter DC line — partnerships expand and flourish here. You attract generous mentors, beneficial business partners, and warm romantic connections. Relationships bring growth, adventure, and mutual upliftment. This is an ideal place to find collaborators who share your vision.`,
  // ── SATURN ──
  'Saturn-MC-neutral': (n) => `${n} is near your Saturn MC line — career takes on a serious, disciplined quality here. Success is possible but demands hard work, patience, and resilience. You may face heavy responsibilities, rigid structures, or slow advancement. Those who persist build something enduring, but it will not come easy or quickly.`,
  'Saturn-IC-avoid': (n) => `${n} falls on your Saturn IC line — home life feels heavy and burdensome here. Family obligations weigh on you, the living environment may feel cold or restrictive, and emotional warmth is hard to find. Loneliness, depression, or a sense of being trapped at home can develop over time. Not recommended for long-term living.`,
  'Saturn-ASC-avoid': (n) => `${n} falls on your Saturn ASC line — your sense of self contracts here. You may feel older, heavier, more limited. Spontaneity fades, self-expression feels blocked, and others perceive you as stern or withdrawn. Chronic fatigue, low mood, or health issues related to restriction may surface. Best avoided for extended stays.`,
  'Saturn-DC-avoid': (n) => `${n} falls on your Saturn DC line — relationships become heavy, demanding, and isolating here. Partners may be controlling, critical, or emotionally unavailable. Loneliness within partnerships is common. Commitments feel like burdens rather than choices. Long-term residence risks deep relational dissatisfaction.`,
  // ── URANUS ──
  'Uranus-MC-neutral': (n) => `${n} is near your Uranus MC line — your career takes unexpected turns here. Sudden breakthroughs, radical pivots, and unconventional professional paths are likely. This can bring exciting innovation, but also instability. Freelancers, tech founders, and creative rebels thrive here — traditional careers may feel disrupted.`,
  'Uranus-IC-avoid': (n) => `${n} falls on your Uranus IC line — domestic stability is difficult here. Sudden relocations, housing disruptions, and unpredictable family dynamics keep you off-balance. You may feel unable to put down roots or create lasting security at home. The restless energy makes long-term settling challenging and stressful.`,
  'Uranus-ASC-neutral': (n) => `${n} is near your Uranus ASC line — radical self-expression and individuality intensify here. Others see you as eccentric, visionary, or unpredictable. This can be liberating — you feel free to be yourself without compromise. But it can also make you feel alienated or misunderstood. Best for creative breakthroughs and reinvention.`,
  'Uranus-DC-avoid': (n) => `${n} falls on your Uranus DC line — partnerships are unstable and unpredictable here. Relationships may begin suddenly and end without warning. Partners can be unreliable, commitment-averse, or emotionally erratic. If you value relational stability and consistency, this is not the place to build lasting bonds.`,
  // ── NEPTUNE ──
  'Neptune-MC-avoid': (n) => `${n} falls on your Neptune MC line — career direction becomes foggy and confused here. Professional boundaries dissolve, you may be deceived by colleagues, or your public reputation suffers from misunderstandings. Creative and spiritual work can still channel this energy, but practical career goals need extreme clarity and vigilance.`,
  'Neptune-IC-avoid': (n) => `${n} falls on your Neptune IC line — your sense of home and roots dissolves here. Boundaries blur, you may feel ungrounded or lost. Housing problems, water damage, or deceptive living situations are more likely. Emotional confusion about where you belong can make long-term residence deeply disorienting.`,
  'Neptune-ASC-avoid': (n) => `${n} falls on your Neptune ASC line — your identity becomes elusive and blurred here. Others project fantasies onto you, and you may lose clarity about who you really are. While this creates a mysterious, ethereal presence, it also risks confusion, escapism, and susceptibility to deception. Artistic types may find inspiration, but grounding is essential.`,
  'Neptune-DC-avoid': (n) => `${n} falls on your Neptune DC line — partnerships are idealized but potentially deceptive here. You attract partners who seem magical but turn out to be unreliable, dishonest, or emotionally unavailable. Romantic illusions shatter painfully. Existing relationships may suffer from hidden lies or unclear boundaries. Approach with caution.`,
  // ── PLUTO ──
  'Pluto-MC-avoid': (n) => `${n} falls on your Pluto MC line — intense power struggles define your career here. You encounter formidable opponents, manipulation in professional settings, and relentless pressure to transform. While some experience profound career metamorphosis, the process is grueling. Not for the faint of heart — only settle here if you're ready for total professional reinvention.`,
  'Pluto-IC-avoid': (n) => `${n} falls on your Pluto IC line — psychological intensity at home reaches extreme levels here. Buried family secrets surface, power struggles within the household erupt, and deep emotional crises force confrontation with your past. While transformative, this energy is overwhelming for most people. Long-term residence demands extraordinary emotional resilience.`,
  'Pluto-ASC-avoid': (n) => `${n} falls on your Pluto ASC line — your identity undergoes forced, intense transformation here. Others perceive you as powerful but intimidating. You attract obsessive attention and power dynamics. While this can catalyze profound personal rebirth, the process often involves crisis, loss, and ego death. Not suitable for those seeking stability.`,
  'Pluto-DC-avoid': (n) => `${n} falls on your Pluto DC line — relationships become intense, obsessive, and potentially manipulative here. Partners may try to control or dominate you, and you may find yourself drawn into toxic power dynamics. Existing bonds deepen to an almost unbearable degree. Only settle here if you can handle extreme emotional intensity in partnerships.`,
};

function cityReading(c) {
  const parts = c.line.split(' ');
  const planet = parts[0];
  const angle = parts[1];
  const key = `${planet}-${angle}-${c.q}`;
  const fn = CITY_READINGS[key];
  if (fn) return fn(c.name);
  // Fallback for any unmapped combination
  if (c.q === 'thrive') return `${c.name} lies on your ${c.line} line — a zone of activation where this planetary energy amplifies your strengths. Spending time here supports growth in ${ANGLE_EFFECTS[angle]?.area || 'this area of life'}.`;
  if (c.q === 'avoid') return `${c.name} falls on your ${c.line} line — a zone of challenge where this planetary energy brings tension. Short visits may teach valuable lessons, but long-term residence requires conscious effort to navigate.`;
  return `${c.name} is near your ${c.line} line — a zone of subtle influence. The effects are moderate and depend on how you engage with the energy. Neither strongly positive nor negative, this placement offers nuance rather than extremes.`;
}

const PLANET_DOMAINS = {
  Sun: { domain: 'Identity · Career · Vitality', icon: '☉' },
  Moon: { domain: 'Emotions · Home · Intuition', icon: '☽' },
  Mercury: { domain: 'Communication · Intellect · Trade', icon: '☿' },
  Venus: { domain: 'Love · Beauty · Finance', icon: '♀' },
  Mars: { domain: 'Drive · Ambition · Conflict', icon: '♂' },
  Jupiter: { domain: 'Growth · Luck · Expansion', icon: '♃' },
  Saturn: { domain: 'Discipline · Limits · Karma', icon: '♄' },
  Uranus: { domain: 'Innovation · Disruption · Freedom', icon: '♅' },
  Neptune: { domain: 'Spirituality · Illusion · Art', icon: '♆' },
  Pluto: { domain: 'Transformation · Power · Depth', icon: '♇' },
};

const ANGLE_EFFECTS = {
  MC: { area: 'Career & Public Life', short: 'public sphere' },
  IC: { area: 'Home & Roots', short: 'private life' },
  ASC: { area: 'Self & Identity', short: 'self-expression' },
  DC: { area: 'Partnerships', short: 'relationships' },
};

function cityImpact(c) {
  const parts = c.line.split(' ');
  const planet = parts[0];
  const angle = parts[1];
  const pd = PLANET_DOMAINS[planet];
  const ae = ANGLE_EFFECTS[angle];
  if (!pd || !ae) return { planet, angle, domain: '', area: '', summary: c.desc || '' };
  const strength = c.dist < 1 ? 'EXACT' : c.dist < 2 ? 'STRONG' : 'MODERATE';
  const strengthPct = Math.max(0, Math.round((1 - c.dist / 3.5) * 100));
  return { planet, angle, domain: pd.domain, area: ae.area, icon: pd.icon, strength, strengthPct, summary: c.desc || '' };
}

// Try to hydrate chart from cache synchronously — avoids flash of loading screen
function getInitialChart(demo, profile) {
  try {
    const birthInput = demo
      ? { date: DEMO.date, time: DEMO.time, lat: DEMO.lat, lng: DEMO.lng }
      : (profile?.birth_date && profile?.birth_time && profile?.birth_lat != null)
        ? { date: profile.birth_date, time: profile.birth_time, lat: profile.birth_lat, lng: profile.birth_lng }
        : null;
    if (!birthInput) return null;
    return getCachedChart(birthInput);
  } catch { return null; }
}

export default function Dashboard({ demo = false }) {
  const { user, profile, hasBirthData, isPremium, signOut, deleteAccount, updateDisplayName, loadProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [lightMode, setLightMode] = useState(() => { try { return localStorage.getItem('nn_theme') === 'light'; } catch { return false; } });
  useEffect(() => { try { localStorage.setItem('nn_theme', lightMode ? 'light' : 'dark'); } catch {} }, [lightMode]);
  // Hydrate chart from localStorage cache on first render — zero loading screen for returning users
  const [chartData, setChartData] = useState(() => getInitialChart(demo, profile));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('thrive');
  // clock is rendered via ref to avoid re-renders
  const [popup, setPopup] = useState(null);
  const [cityPop, setCityPop] = useState(null);
  const [w, setW] = useState(900);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('profile');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expandedPlanet, setExpandedPlanet] = useState(null);
  const [showAngleInfo, setShowAngleInfo] = useState(false);
  const [flatMap, setFlatMap] = useState(false);
  const [hiddenPlanets, setHiddenPlanets] = useState(new Set());
  const [showNatal, setShowNatal] = useState(false);
  const [natalTab, setNatalTab] = useState('chart'); // 'chart' | 'planets'
  const [selectedPlacement, setSelectedPlacement] = useState(null); // { id, type } for detail view
  const [showDemoGate, setShowDemoGate] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideTab, _setGuideTab] = useState(0);
  const guideContentRef = useRef(null);
  const setGuideTab = (i) => { _setGuideTab(i); if (guideContentRef.current) guideContentRef.current.scrollTop = 0; };
  const [pageVisible, setPageVisible] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success' | 'cancelled'
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [paywallEnabled, setPaywallEnabled] = useState(null);
  const [displayPrice, setDisplayPrice] = useState('3.99');
  const [displayCurrency, setDisplayCurrency] = useState('EUR');
  const [priceLabel, setPriceLabel] = useState('ONE-TIME · LIFETIME ACCESS');
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => { document.title = demo ? 'Astrocartography Globe Demo — Natal Navigator' : 'Your Astrocartography Dashboard — Natal Navigator'; }, [demo]);

  // Handle ?payment=success|cancelled redirect from Stripe
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') {
      setPaymentStatus('success');
      trackEvent('payment_success');
      // Refresh profile to pick up is_premium=true from webhook
      if (user) {
        // Small delay to let webhook process
        const t = setTimeout(() => loadProfile(user.id), 1500);
        return () => clearTimeout(t);
      }
      // Clean URL
      setSearchParams({}, { replace: true });
    } else if (payment === 'cancelled') {
      setPaymentStatus('cancelled');
      trackEvent('payment_cancelled');
      setSearchParams({}, { replace: true });
      setTimeout(() => setPaymentStatus(null), 5000);
    }
  }, []);

  // Fetch global app settings (paywall, pricing, announcement)
  useEffect(() => {
    if (demo) return;
    import('../lib/supabase').then(({ supabase }) => {
      supabase.from('app_settings').select('key, value')
        .then(({ data }) => {
          if (!data) return;
          const s = {};
          data.forEach(r => { s[r.key] = r.value; });
          if (s.paywall_enabled !== undefined) setPaywallEnabled(s.paywall_enabled === 'true');
          if (s.display_price) setDisplayPrice(s.display_price);
          if (s.display_currency) setDisplayCurrency(s.display_currency);
          if (s.price_label) setPriceLabel(s.price_label);
          if (s.announcement_active === 'true' && s.announcement_text) {
            setAnnouncement({ text: s.announcement_text, color: s.announcement_color || '#D8A030' });
          }
        });
    });
  }, [demo]);

  // Determine if user should see paywall
  const showPaywall = !demo && paywallEnabled === true && !isPremium && profile?.is_admin !== true;

  // Track paywall impression once
  const paywallTracked = useRef(false);
  useEffect(() => {
    if (showPaywall && !paywallTracked.current) {
      paywallTracked.current = true;
      trackEvent('paywall_viewed');
    }
  }, [showPaywall]);

  // Upgrade handler with error handling
  const handleUpgrade = async () => {
    if (!user?.email) return;
    trackEvent('checkout_clicked');
    setUpgradeLoading(true);
    setUpgradeError('');
    try {
      await redirectToCheckout(user.email, user.id);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Stripe not configured') || msg.includes('Failed to create checkout')) {
        setUpgradeError('Payment is being set up. Please try again soon.');
      } else {
        setUpgradeError(msg || 'Something went wrong. Please try again.');
      }
      setUpgradeLoading(false);
    }
  };

  // Pause animations & timers when tab is hidden
  useEffect(() => {
    const handler = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // Demo: show sign-up prompt after 25 seconds
  useEffect(() => {
    if (!demo) return;
    const t = setTimeout(() => setShowDemoGate(true), 25000);
    return () => clearTimeout(t);
  }, [demo]);

  const mob = w < 900;

  // Close all popups/overlays — prevents window overlap
  const closeAllPopups = useCallback((except) => {
    if (except !== 'popup') setPopup(null);
    if (except !== 'natal') setShowNatal(false);
    if (except !== 'angle') setShowAngleInfo(false);
    if (except !== 'city') setCityPop(null);
    if (except !== 'guide') setShowGuide(false);
    if (except !== 'demoGate') setShowDemoGate(false);
    if (except !== 'settings') setShowSettings(false);
  }, []);

  // Clock — update via ref + DOM to avoid re-rendering; pauses when tab is hidden
  const clockRef = useRef(null);
  useEffect(() => {
    const fmt = () => {
      if (document.hidden) return; // skip work when not visible
      const now = new Date();
      const dd = String(now.getUTCDate()).padStart(2, '0');
      const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
      const yy = String(now.getUTCFullYear()).slice(-2);
      const h24 = now.getUTCHours();
      const min = String(now.getUTCMinutes()).padStart(2, '0');
      const sec = String(now.getUTCSeconds()).padStart(2, '0');
      const h12 = h24 % 12 || 12;
      const ampm = h24 < 12 ? 'AM' : 'PM';
      if (clockRef.current) clockRef.current.textContent = `${dd}.${mm}.${yy}  ${String(h24).padStart(2, '0')}:${min}:${sec} (${h12}:${min} ${ampm}) UTC`;
    };
    fmt();
    const t = setInterval(fmt, 30000);
    return () => clearInterval(t);
  }, []);
  // Debounced resize — prevents re-render storm during window dragging
  useEffect(() => {
    let raf;
    const h = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setW(window.innerWidth)); };
    h(); window.addEventListener('resize', h);
    return () => { window.removeEventListener('resize', h); cancelAnimationFrame(raf); };
  }, []);

  // Redirect if no birth data (skip in demo mode)
  useEffect(() => {
    if (demo) return;
    if (!hasBirthData && profile !== null) {
      navigate('/birth-data', { replace: true });
    }
  }, [demo, hasBirthData, profile, navigate]);

  // Calculate chart — reads from localStorage cache first (pre-calculated by BirthDataPage),
  // falls back to direct main-thread calculation (~200ms, faster than Worker spawn on mobile).
  useEffect(() => {
    const birthInput = demo
      ? { date: DEMO.date, time: DEMO.time, lat: DEMO.lat, lng: DEMO.lng }
      : (hasBirthData && profile?.birth_date)
        ? { date: profile.birth_date, time: profile.birth_time, lat: profile.birth_lat, lng: profile.birth_lng }
        : null;
    if (!birthInput) return;

    // 1. Check localStorage cache — instant for returning users and users coming from BirthDataPage
    const cached = getCachedChart(birthInput);
    if (cached) {
      setChartData(cached);
      return;
    }

    // 2. No cache — calculate directly on main thread.
    // This is faster than spawning a Web Worker on mobile (~200ms calc vs 500ms+ worker startup).
    setLoading(true);
    setError('');
    // Use requestAnimationFrame so the loading UI renders before blocking calculation
    requestAnimationFrame(() => {
      try {
        const data = calculateChart(birthInput);
        setCachedChart(birthInput, data);
        setChartData(data);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    });
  }, [demo, hasBirthData, profile]);

  // Lazy-load natal readings data when chart is available
  useEffect(() => {
    if (!chartData?.planets || window.__natalReadings) return;
    import('../data/natalReadings').then(mod => { window.__natalReadings = mod; }).catch(() => {});
  }, [chartData]);

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

  // Group lines by planet for sidebar — O(n) instead of O(n²)
  const planetGroups = useMemo(() => {
    const map = new Map();
    for (const l of lines) {
      let g = map.get(l.planet);
      if (!g) { g = { planet: l.planet, symbol: l.symbol, color: l.c, quality: l.quality, lines: [] }; map.set(l.planet, g); }
      g.lines.push(l);
    }
    return Array.from(map.values());
  }, [lines]);

  // Single-pass city categorization — avoids 4 separate filter() calls over onLines
  const { thriveC, avoidC, neutralC, bestCities } = useMemo(() => {
    const t = [], a = [], n = [];
    for (const c of onLines) {
      if (c.q === 'thrive') t.push(c);
      else if (c.q === 'avoid') a.push(c);
      else n.push(c);
    }
    return { thriveC: t, avoidC: a, neutralC: n, bestCities: t.slice(0, 5) };
  }, [onLines]);
  const filteredTab = tab === 'thrive' ? thriveC : tab === 'avoid' ? avoidC : tab === 'neutral' ? neutralC : onLines;

  const homeLocation = demo ? [DEMO.lng, DEMO.lat, 'Pretoria'] : profile ? [profile.birth_lng, profile.birth_lat, profile.birth_city?.split(',')[0] || 'HOME'] : null;
  const displayName = demo ? DEMO.name : profile?.display_name || user?.email?.split('@')[0] || 'User';
  const planetString = chartData?.planetString || '';

  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPDF = useCallback(async () => {
    if (pdfLoading || !chartData) return;
    setPdfLoading(true);
    trackEvent('pdf_download');
    try {
      const nR = window.__natalReadings || await import('../data/natalReadings');
      const { generateNatalPDF } = await import('../lib/generatePDF');
      await generateNatalPDF({ displayName, chartData, thriveC, avoidC, neutralC, cityReadingFn: cityReading, natalReadings: nR });
    } catch (err) { console.error('PDF generation failed:', err); }
    finally { setPdfLoading(false); }
  }, [pdfLoading, chartData, displayName, thriveC, avoidC, neutralC]);

  const flyTo = useCallback((la, lo) => {
    Globe.flyTo?.(la, lo);
  }, []);

  const handleCityClick = useCallback((city) => {
    setCityPop(city);
  }, []);

  // Safety timeout: if stuck loading for too long (e.g. profile never arrives),
  // reload the page once rather than showing "Connecting..." forever.
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const isLoading = !chartData && (demo ? loading : (loading || hasBirthData || !profile));
  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => setLoadingTooLong(true), 8000);
    return () => clearTimeout(t);
  }, [isLoading]);

  useEffect(() => {
    if (loadingTooLong && isLoading) {
      // One auto-reload attempt, then stop
      try {
        const key = 'nn_dash_reload';
        const count = parseInt(sessionStorage.getItem(key) || '0', 10);
        if (count < 1) {
          sessionStorage.setItem(key, String(count + 1));
          window.location.reload();
        } else {
          sessionStorage.removeItem(key);
        }
      } catch {}
    }
  }, [loadingTooLong, isLoading]);

  // Clear dashboard reload counter on successful render
  useEffect(() => {
    if (chartData) {
      try { sessionStorage.removeItem('nn_dash_reload'); } catch {}
    }
  }, [chartData]);

  // Prevent pinch-zoom on everything except the globe/map canvas
  useEffect(() => {
    const preventZoom = (e) => {
      if (e.touches && e.touches.length > 1) {
        // Allow multi-touch on the canvas (globe/map handles its own zoom)
        if (e.target.tagName === 'CANVAS') return;
        e.preventDefault();
      }
    };
    const preventGesture = (e) => {
      if (e.target.tagName === 'CANVAS') return;
      e.preventDefault();
    };
    document.addEventListener('touchmove', preventZoom, { passive: false });
    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });
    return () => {
      document.removeEventListener('touchmove', preventZoom);
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
    };
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A1018', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...F, fontSize: 18, fontWeight: 700, color: '#00D88A', letterSpacing: 6, marginBottom: 24 }}>NATAL NAVIGATOR</div>
        <div style={{ ...F, fontSize: 11, color: '#8098B0', marginBottom: 20 }}>{demo ? 'Loading demo chart...' : !profile ? 'Connecting...' : 'Calculating your planetary lines...'}</div>
        <div style={{ width: 240, height: 3, background: '#1A2840', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', background: '#00D88A', borderRadius: 2, animation: 'loadbar 1.5s ease-in-out infinite' }} />
        </div>
        <style>{`@keyframes loadbar { 0% { transform: translateX(-100%); } 50% { transform: translateX(0%); } 100% { transform: translateX(100%); } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
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

  // ─── PAYWALL SCREEN ───
  if (showPaywall) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A1018', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        {/* Payment success banner */}
        {paymentStatus === 'success' && (
          <div style={{ ...F, fontSize: 11, color: '#00D88A', background: '#00D88A10', border: '1px solid #00D88A30', borderRadius: 8, padding: '12px 20px', marginBottom: 24, textAlign: 'center' }}>
            Payment received! Activating your account...
          </div>
        )}

        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          {/* Logo */}
          <div style={{ ...F, fontSize: 22, fontWeight: 700, color: '#00D88A', letterSpacing: 6, marginBottom: 8 }}>NATAL NAVIGATOR</div>
          <div style={{ ...F, fontSize: 9, color: '#5A7088', letterSpacing: 3, marginBottom: 40 }}>YOUR PERSONAL ASTROCARTOGRAPHY MAP</div>

          {/* Upgrade card */}
          <div style={{ background: 'linear-gradient(160deg, #0F1A28 0%, #0A1018 50%, #10182A 100%)', border: '1px solid #1A2840', borderRadius: 20, padding: mob ? 28 : 44, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Subtle glow effect */}
            <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 200, height: 120, background: 'radial-gradient(ellipse, #00D88A08 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ ...F, fontSize: 11, fontWeight: 600, color: '#00D88A', letterSpacing: 3, marginBottom: 6, textTransform: 'uppercase' }}>Premium</div>
            <div style={{ ...F, fontSize: mob ? 20 : 24, fontWeight: 700, color: '#D0DDE8', marginBottom: 10, lineHeight: 1.3 }}>Your Personal<br />Astrocartography Map</div>
            <div style={{ ...F, fontSize: 11, color: '#6A8098', lineHeight: 1.7, marginBottom: 32, maxWidth: 340, margin: '0 auto 32px' }}>
              Planetary lines, city analysis, and natal chart — calculated from your exact birth data.
            </div>

            {/* Price — centered, clean */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
                <span style={{ ...F, fontSize: 14, fontWeight: 500, color: '#D0DDE8', alignSelf: 'flex-start', marginTop: 6 }}>{displayCurrency === 'EUR' ? '€' : displayCurrency === 'GBP' ? '£' : displayCurrency === 'CHF' ? 'CHF' : '$'}</span>
                <span style={{ ...F, fontSize: 48, fontWeight: 700, color: '#D0DDE8', letterSpacing: -1 }}>{displayPrice}</span>
              </div>
              <div style={{ ...F, fontSize: 12, fontWeight: 600, color: '#00D88A', marginTop: 8, letterSpacing: 2 }}>{priceLabel}</div>
            </div>

            {/* CTA */}
            {upgradeError && (
              <div style={{ ...F, fontSize: 10, color: '#F04060', marginBottom: 12 }}>{upgradeError}</div>
            )}
            <div
              onClick={handleUpgrade}
              style={{ ...F, fontSize: 13, fontWeight: 700, color: '#0A1018', background: upgradeLoading ? '#5A7088' : '#00D88A', padding: '15px 0', borderRadius: 10, cursor: upgradeLoading ? 'default' : 'pointer', letterSpacing: 1.5, transition: 'all .2s', boxShadow: upgradeLoading ? 'none' : '0 0 20px #00D88A20' }}
            >
              {upgradeLoading ? 'REDIRECTING...' : 'GET STARTED'}
            </div>

            {/* What's included — compact */}
            <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', maxWidth: 260, margin: '28px auto 0', justifyItems: 'center' }}>
              {[
                '3D Globe',
                'City Analysis',
                'Natal Chart',
                'Flat Map View',
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, justifySelf: 'center' }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#00D88A', flexShrink: 0 }} />
                  <span style={{ ...F, fontSize: 10, color: '#6A8098' }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Security note */}
            <div style={{ ...F, fontSize: 8, color: '#2A3848', marginTop: 20, letterSpacing: 0.5 }}>
              Secure checkout via Stripe &middot; No card data stored
            </div>
          </div>

          {/* Sign out link */}
          <div onClick={signOut} style={{ ...F, fontSize: 9, color: '#5A7088', cursor: 'pointer', marginTop: 20 }}>
            Sign out
          </div>
        </div>

        <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'fixed', inset: 0, background: '#0A1018', color: '#D0DDE8', fontFamily: 'Instrument Sans, sans-serif', overflow: 'hidden', filter: lightMode ? 'invert(1) hue-rotate(180deg)' : 'none', transition: 'filter .3s' }}>
      {lightMode && <style>{`canvas, img, video, svg line, svg circle { filter: invert(1) hue-rotate(180deg); }`}</style>}
      {/* Payment success banner */}
      {paymentStatus === 'success' && (
        <div onClick={() => setPaymentStatus(null)} style={{ ...F, fontSize: 11, color: '#00D88A', background: '#00D88A10', borderBottom: '1px solid #00D88A30', padding: '8px 16px', textAlign: 'center', cursor: 'pointer', zIndex: 400, flexShrink: 0 }}>
          Premium activated! Welcome to NatalNavigator Premium. &#10003;
        </div>
      )}
      {/* Announcement banner from admin settings */}
      {announcement && (
        <div onClick={() => setAnnouncement(null)} style={{ ...F, fontSize: 10, color: announcement.color, background: `${announcement.color}10`, borderBottom: `1px solid ${announcement.color}30`, padding: '7px 16px', textAlign: 'center', cursor: 'pointer', zIndex: 399, flexShrink: 0, lineHeight: 1.5 }}>
          {announcement.text}
        </div>
      )}
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>Natal Navigator — Astrocartography Dashboard</h1>
      {/* TOPBAR */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: mob ? '0 8px' : '0 16px', height: 38, minHeight: 38, background: '#0D1520', borderBottom: '1px solid #1A2840', zIndex: 300, flexShrink: 0, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: mob ? 6 : 12, minWidth: 0, overflow: 'hidden' }}>
          <span style={{ ...F, fontSize: mob ? 10 : 12, fontWeight: 700, color: '#00D88A', letterSpacing: mob ? 1.5 : 3, whiteSpace: 'nowrap' }}>NATAL NAVIGATOR</span>
          <span style={{ ...F, fontSize: 9, color: '#00D88A', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00D88A', boxShadow: '0 0 6px #00D88A' }} />
            {!mob && 'LIVE'}
          </span>
          <span onClick={() => { closeAllPopups('guide'); setGuideTab(0); setShowGuide(true); }} style={{ ...F, fontSize: mob ? 7 : 9, fontWeight: 600, color: '#5A7088', cursor: 'pointer', padding: mob ? '3px 7px' : '4px 10px', borderRadius: 4, border: '1px solid #1A2840', letterSpacing: 0.5 }}>HOW IT WORKS</span>
          <span onClick={() => setLightMode(!lightMode)} style={{ ...F, fontSize: mob ? 12 : 14, cursor: 'pointer', padding: mob ? '2px 6px' : '3px 8px', borderRadius: 4, border: '1px solid #1A2840', background: lightMode ? '#FFF3D0' : '#101C28', transition: 'all .2s', lineHeight: 1, userSelect: 'none' }}>{lightMode ? '☀' : '☾'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: mob ? 8 : 12 }}>
          {!mob && <span ref={clockRef} style={{ ...F, fontSize: 9, color: '#5A7088' }} />}
          {demo ? <>
            <span style={{ ...F, fontSize: mob ? 7 : 8, color: '#5A7088', background: '#101C28', padding: mob ? '2px 6px' : '3px 8px', borderRadius: 3, border: '1px solid #1A2840' }}>DEMO: {DEMO.name}</span>
            <span onClick={() => navigate('/auth')} style={{ ...F, fontSize: mob ? 8 : 9, fontWeight: 600, color: '#0A1018', background: '#00D88A', padding: mob ? '4px 10px' : '5px 14px', borderRadius: 4, cursor: 'pointer', letterSpacing: 1 }}>SIGN UP</span>
          </> : <>
            {profile?.is_admin && <span onClick={() => navigate('/admin')} style={{ ...F, fontSize: 9, color: '#D8A030', cursor: 'pointer', background: '#D8A03010', padding: '4px 10px', borderRadius: 4, border: '1px solid #2A2018', letterSpacing: 1 }}>ADMIN</span>}
            <div onClick={() => { closeAllPopups('settings'); setShowSettings(!showSettings); setSettingsTab('profile'); setEditingName(false); setConfirmDelete(false); }} style={{ ...F, fontSize: 9, color: showSettings ? '#00D88A' : '#8098B0', cursor: 'pointer', background: showSettings ? '#00D88A10' : '#101C28', padding: '4px 10px', borderRadius: 4, border: `1px solid ${showSettings ? '#00D88A40' : '#1A2840'}`, transition: 'all .2s' }}>
              ◉ {displayName}
            </div>
          </>}
        </div>
      </nav>

      {/* PLANET TICKER */}
      <div style={{ height: 24, minHeight: 24, background: '#0B1218', borderBottom: '1px solid #14202C', display: 'flex', alignItems: 'center', overflow: 'hidden', flexShrink: 0, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 20, whiteSpace: 'nowrap', ...F, fontSize: 9, animation: 'ts 80s linear infinite', animationPlayState: pageVisible ? 'running' : 'paused', willChange: 'transform', backfaceVisibility: 'hidden' }}>
          {[planetString, planetString].map((t, i) => <span key={i} style={{ color: '#E8A838', padding: '0 20px' }}>{t}</span>)}
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0 }}>
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
                  <div onClick={() => { setExpandedPlanet(isOpen ? null : g.planet); }} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
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
                    <div key={li} onClick={() => { setPopup(lines.indexOf(l) === popup ? null : lines.indexOf(l)); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 28px', cursor: 'pointer', borderBottom: '1px solid #0F1820' }}>
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
            <div key={i} onClick={() => { flyTo(c.la, c.lo); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', cursor: 'pointer', ...F, fontSize: 9 }}>
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
          <Globe lines={visibleLines} citiesOnLines={onLines} allCities={ALL_CITIES} citiesTiers={[CITIES_T1, CITIES_T2, CITIES_T3]} homeLocation={homeLocation} onCityClick={handleCityClick} flat={flatMap} />

          {/* Map mode toggle — top right */}
          <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 50, display: 'flex', background: 'rgba(13,21,32,.92)', border: '1px solid #1A2840', borderRadius: 6, overflow: 'hidden', width: 160 }}>
            <button onClick={() => setFlatMap(false)} style={{ ...F, fontSize: 9, fontWeight: 600, padding: '7px 0', border: 'none', cursor: 'pointer', color: !flatMap ? '#00D88A' : '#5A7088', background: !flatMap ? '#00D88A15' : 'transparent', borderRight: '1px solid #1A2840', flex: 1 }}>
              ◉ Globe
            </button>
            <button onClick={() => setFlatMap(true)} style={{ ...F, fontSize: 9, fontWeight: 600, padding: '7px 0', border: 'none', cursor: 'pointer', color: flatMap ? '#00D88A' : '#5A7088', background: flatMap ? '#00D88A15' : 'transparent', flex: 1 }}>
              ▭ Map
            </button>
          </div>

          {/* Natal chart button — below map toggle */}
          <div onClick={() => { if (!showNatal) closeAllPopups('natal'); setShowNatal(!showNatal); }} style={{ position: 'absolute', top: 42, right: 8, zIndex: 50, ...F, fontSize: 9, fontWeight: 600, padding: '7px 0', background: showNatal ? 'rgba(0,216,138,.12)' : 'rgba(13,21,32,.92)', border: `1px solid ${showNatal ? '#00D88A40' : '#1A2840'}`, borderRadius: 6, cursor: 'pointer', color: showNatal ? '#00D88A' : '#5A7088', transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: 160 }}>
            ☉ Natal Chart
          </div>

          {/* Natal chart popup */}
          {showNatal && chartData?.planets && (
            <><div style={{ position: 'absolute', inset: 0, zIndex: 105 }} onClick={() => { setShowNatal(false); setSelectedPlacement(null); setNatalTab('chart'); }} />
            <div style={{ position: 'absolute', top: mob ? 4 : 76, right: mob ? 4 : 8, left: mob ? 4 : 'auto', bottom: mob ? 4 : 'auto', zIndex: 110, width: mob ? 'auto' : 420, maxHeight: mob ? 'auto' : 'calc(100% - 84px)', background: 'rgba(10,16,24,.98)', border: '1px solid #1A2840', borderRadius: 8, boxShadow: '0 16px 48px rgba(0,0,0,.6)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #1A2840', background: '#0D1520', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selectedPlacement && <span onClick={() => setSelectedPlacement(null)} style={{ cursor: 'pointer', ...F, fontSize: 11, color: '#5A7088', marginRight: 4 }}>&larr;</span>}
                  <span style={{ ...F, fontSize: 10, fontWeight: 700, color: '#D0DDE8', letterSpacing: 1 }}>{selectedPlacement ? (selectedPlacement.type === 'asc' ? 'ASCENDANT' : selectedPlacement.type === 'mc' ? 'MIDHEAVEN' : selectedPlacement.id?.toUpperCase()) : 'NATAL CHART'}</span>
                  {!selectedPlacement && chartData.natal && <span style={{ ...F, fontSize: 8, color: '#3A5068' }}>ASC {chartData.natal.asc?.sign} {chartData.natal.asc?.deg}° · MC {chartData.natal.mc?.sign} {chartData.natal.mc?.deg}°</span>}
                </div>
                <span onClick={() => { setShowNatal(false); setSelectedPlacement(null); setNatalTab('chart'); }} style={{ cursor: 'pointer', ...F, fontSize: 14, color: '#5A7088' }}>✕</span>
              </div>

              {/* Tab bar — only when no detail view */}
              {!selectedPlacement && (
                <div style={{ display: 'flex', borderBottom: '1px solid #1A2840', background: '#0B1218', flexShrink: 0 }}>
                  {[{ key: 'chart', label: 'NATAL CHART' }, { key: 'planets', label: 'PERSONALITY' }, { key: 'pdf', label: '↓ PDF' }].map(t => (
                    <div key={t.key} onClick={() => t.key === 'pdf' ? handleDownloadPDF() : setNatalTab(t.key)} style={{ ...F, fontSize: 9, fontWeight: 600, letterSpacing: 1, padding: '10px 16px', cursor: 'pointer', color: t.key === 'pdf' ? (pdfLoading ? '#00D88A' : '#5A7088') : natalTab === t.key ? '#00D88A' : '#5A7088', borderBottom: natalTab === t.key && t.key !== 'pdf' ? '2px solid #00D88A' : '2px solid transparent', transition: 'all .15s', flex: 1, textAlign: 'center', userSelect: 'none' }}>
                      {t.key === 'pdf' && pdfLoading ? '⏳ ...' : t.label}
                    </div>
                  ))}
                </div>
              )}

              {/* ═══ DETAIL VIEW — Planet / ASC / MC reading ═══ */}
              {selectedPlacement && (() => {
                const sp = selectedPlacement;
                let signData, signReading, houseReading, houseNum, pc, degStr;
                if (sp.type === 'planet') {
                  const p = chartData.planets.find(pl => pl.id === sp.id);
                  if (!p) return null;
                  pc = PCOL[p.id] || '#8098B0';
                  degStr = `${p.deg}° ${p.sign.slice(0,3)} ${String(p.min).padStart(2,'0')}'${p.retrograde ? ' ℞' : ''}`;
                  houseNum = p.house;
                  signData = p;
                  const nR = window.__natalReadings;
                  signReading = nR?.PLANET_IN_SIGN?.[`${p.id}-${p.sign}`];
                  houseReading = nR?.PLANET_IN_HOUSE?.[`${p.id}-${houseNum}`];
                } else if (sp.type === 'asc') {
                  const a = chartData.natal.asc;
                  pc = '#E8A838';
                  degStr = `${a.deg}° ${a.sign.slice(0,3)} ${String(a.min).padStart(2,'0')}'`;
                  signData = a;
                  houseNum = null;
                  const nR = window.__natalReadings;
                  signReading = nR?.ASC_IN_SIGN?.[a.sign];
                  houseReading = null;
                } else if (sp.type === 'mc') {
                  const m = chartData.natal.mc;
                  pc = '#E8A838';
                  degStr = `${m.deg}° ${m.sign.slice(0,3)} ${String(m.min).padStart(2,'0')}'`;
                  signData = m;
                  houseNum = null;
                  const nR = window.__natalReadings;
                  signReading = nR?.MC_IN_SIGN?.[m.sign];
                  houseReading = null;
                }
                const elem = SIGN_ELEMENTS[signData?.sign] || '';
                const titleLabel = sp.type === 'asc' ? 'Ascendant' : sp.type === 'mc' ? 'Midheaven' : sp.id;
                const nR = window.__natalReadings;
                const houseInfo = houseNum ? nR?.HOUSE_INFO?.[houseNum] : null;
                const planetInfo = sp.type === 'planet' ? nR?.PLANET_INFO?.[sp.id] : null;
                return (
                  <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    {/* Title section */}
                    <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid #14202C' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 28, color: pc, lineHeight: 1 }}>{sp.type === 'asc' ? '△' : sp.type === 'mc' ? '▽' : (chartData.planets.find(pl => pl.id === sp.id)?.symbol || '')}</span>
                        <span style={{ fontSize: 28, color: ELEM_COL[elem] || '#5A7088', lineHeight: 1 }}>{SIGN_SYMBOLS[signData?.sign] || ''}</span>
                      </div>
                      <div style={{ ...F, fontSize: 18, fontWeight: 700, color: '#D0DDE8', letterSpacing: 0.5, marginBottom: 4 }}>{titleLabel} in {signData?.sign}</div>
                      <div style={{ ...F, fontSize: 11, color: '#5A7088' }}>{degStr}</div>
                      {houseNum && <div style={{ ...F, fontSize: 11, color: pc, marginTop: 4 }}>{titleLabel} in the {['','First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth','Eleventh','Twelfth'][houseNum]} House</div>}
                    </div>

                    {/* Planet info badge */}
                    {planetInfo && (
                      <div style={{ padding: '10px 18px', borderBottom: '1px solid #14202C', background: '#0C1420' }}>
                        <div style={{ ...F, fontSize: 9, color: '#5A7088', lineHeight: 1.6 }}>{planetInfo.description}</div>
                      </div>
                    )}

                    {/* Sign reading */}
                    {signReading && (
                      <div style={{ padding: '18px 18px 14px' }}>
                        <div style={{ ...F, fontSize: 8, fontWeight: 700, color: '#3A5068', letterSpacing: 1.5, marginBottom: 10 }}>{sp.type === 'asc' ? 'YOUR RISING SIGN' : sp.type === 'mc' ? 'YOUR MIDHEAVEN' : `${sp.id?.toUpperCase()} IN ${signData?.sign?.toUpperCase()}`}</div>
                        <div style={{ fontSize: 13, color: '#B0C0D0', lineHeight: 1.85, fontFamily: 'system-ui, -apple-system, sans-serif' }}>{signReading.text}</div>
                      </div>
                    )}

                    {/* House reading */}
                    {houseReading && (
                      <div style={{ padding: '14px 18px 18px', borderTop: '1px solid #14202C' }}>
                        <div style={{ ...F, fontSize: 8, fontWeight: 700, color: '#3A5068', letterSpacing: 1.5, marginBottom: 10 }}>{sp.id?.toUpperCase()} IN THE {['','FIRST','SECOND','THIRD','FOURTH','FIFTH','SIXTH','SEVENTH','EIGHTH','NINTH','TENTH','ELEVENTH','TWELFTH'][houseNum]} HOUSE</div>
                        <div style={{ fontSize: 13, color: '#B0C0D0', lineHeight: 1.85, fontFamily: 'system-ui, -apple-system, sans-serif' }}>{houseReading.text}</div>
                      </div>
                    )}

                    {/* Details section */}
                    <div style={{ padding: '14px 18px 20px', borderTop: '1px solid #1A2840' }}>
                      <div style={{ ...F, fontSize: 8, fontWeight: 700, color: '#3A5068', letterSpacing: 1.5, marginBottom: 10 }}>DETAILS</div>
                      {[
                        ['Position', `${signData?.deg}° ${String(signData?.min || 0).padStart(2,'0')}' ${signData?.sign}`],
                        houseNum ? ['House', `${houseNum}${houseNum===1?'st':houseNum===2?'nd':houseNum===3?'rd':'th'} House${houseInfo ? ' — ' + houseInfo.keyword : ''}`] : null,
                        ['Element', elem],
                        ['Mode', SIGN_MODES[signData?.sign] || ''],
                        sp.type === 'planet' && chartData.planets.find(pl => pl.id === sp.id)?.retrograde ? ['Motion', 'Retrograde ℞'] : null,
                        planetInfo?.rules ? ['Rules', planetInfo.rules] : null,
                      ].filter(Boolean).map(([label, val]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #14202C' }}>
                          <span style={{ ...F, fontSize: 11, fontWeight: 600, color: '#8098B0' }}>{label}</span>
                          <span style={{ ...F, fontSize: 11, color: '#D0DDE8' }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* ═══ CHART TAB — original planet table ═══ */}
              {!selectedPlacement && natalTab === 'chart' && (
                <>
                  {/* Column headers */}
                  <div style={{ display: 'flex', padding: '5px 14px', borderBottom: '1px solid #14202C', background: '#0A1018', flexShrink: 0 }}>
                    <span style={{ ...F, fontSize: 7, color: '#3A5068', fontWeight: 700, width: 90, letterSpacing: 1 }}>PLANET</span>
                    <span style={{ ...F, fontSize: 7, color: '#3A5068', fontWeight: 700, width: 80, letterSpacing: 1 }}>SIGN</span>
                    <span style={{ ...F, fontSize: 7, color: '#3A5068', fontWeight: 700, width: 60, letterSpacing: 1, textAlign: 'right' }}>DEGREE</span>
                    <span style={{ ...F, fontSize: 7, color: '#3A5068', fontWeight: 700, width: 50, letterSpacing: 1, textAlign: 'center' }}>ELEM</span>
                    <span style={{ ...F, fontSize: 7, color: '#3A5068', fontWeight: 700, flex: 1, letterSpacing: 1 }}>DOMAIN</span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {chartData.planets.map((p, i) => {
                      const elem = SIGN_ELEMENTS[p.sign] || '';
                      const mode = SIGN_MODES[p.sign] || '';
                      const pc = PCOL[p.id] || '#8098B0';
                      const pd = PLANET_DOMAINS[p.id];
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', borderBottom: '1px solid #14202C', transition: 'background .1s' }} onMouseEnter={e => e.currentTarget.style.background = '#101C28'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ width: 90, display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ ...F, fontSize: 15, color: pc, lineHeight: 1, width: 18, textAlign: 'center', flexShrink: 0 }}>{p.symbol}</span>
                            <div>
                              <div style={{ ...F, fontSize: 10, color: pc, fontWeight: 600 }}>{p.id}</div>
                              {p.retrograde && <div style={{ ...F, fontSize: 7, color: '#F04060', fontWeight: 700, letterSpacing: 0.5 }}>R RETRO</div>}
                            </div>
                          </div>
                          <div style={{ width: 80, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ ...F, fontSize: 13, color: ELEM_COL[elem] || '#5A7088', lineHeight: 1 }}>{SIGN_SYMBOLS[p.sign] || ''}</span>
                            <span style={{ ...F, fontSize: 9, color: '#B0C0D0', fontWeight: 600 }}>{p.sign}</span>
                          </div>
                          <div style={{ width: 60, textAlign: 'right' }}>
                            <span style={{ ...F, fontSize: 10, color: '#D0DDE8', fontWeight: 600 }}>{p.deg}°</span>
                            <span style={{ ...F, fontSize: 8, color: '#5A7088' }}>{String(p.min).padStart(2, '0')}'</span>
                          </div>
                          <div style={{ width: 50, textAlign: 'center' }}>
                            <span style={{ ...F, fontSize: 7, fontWeight: 700, color: ELEM_COL[elem] || '#5A7088', background: (ELEM_COL[elem] || '#5A7088') + '18', padding: '2px 5px', borderRadius: 2 }}>{elem}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ ...F, fontSize: 8, color: '#6A8098' }}>{pd?.domain || ''}</div>
                            <div style={{ ...F, fontSize: 7, color: '#3A5068' }}>{mode}</div>
                          </div>
                        </div>
                      );
                    })}
                    {chartData.natal && <>
                      <div style={{ ...F, fontSize: 7, fontWeight: 700, color: '#3A5068', letterSpacing: 1.5, padding: '8px 14px 4px', borderTop: '1px solid #1A2840' }}>ANGLES</div>
                      {[
                        { label: 'Ascendant', short: 'ASC', data: chartData.natal.asc, desc: 'Rising sign — your outward persona' },
                        { label: 'Midheaven', short: 'MC', data: chartData.natal.mc, desc: 'Career & public reputation' },
                      ].map((a, i) => a.data && (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', borderBottom: '1px solid #14202C' }}>
                          <div style={{ width: 90, display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ ...F, fontSize: 15, color: '#E8A838', lineHeight: 1 }}>{a.short === 'ASC' ? '△' : '▽'}</span>
                            <div>
                              <div style={{ ...F, fontSize: 10, color: '#E8A838', fontWeight: 600 }}>{a.label}</div>
                              <div style={{ ...F, fontSize: 7, color: '#5A7088' }}>{a.short}</div>
                            </div>
                          </div>
                          <div style={{ width: 80, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ ...F, fontSize: 13, color: ELEM_COL[SIGN_ELEMENTS[a.data.sign]] || '#5A7088', lineHeight: 1 }}>{SIGN_SYMBOLS[a.data.sign] || ''}</span>
                            <span style={{ ...F, fontSize: 9, color: '#B0C0D0', fontWeight: 600 }}>{a.data.sign}</span>
                          </div>
                          <div style={{ width: 60, textAlign: 'right' }}>
                            <span style={{ ...F, fontSize: 10, color: '#D0DDE8', fontWeight: 600 }}>{a.data.deg}°</span>
                            <span style={{ ...F, fontSize: 8, color: '#5A7088' }}>{String(a.data.min).padStart(2, '0')}'</span>
                          </div>
                          <div style={{ width: 50, textAlign: 'center' }}>
                            <span style={{ ...F, fontSize: 7, fontWeight: 700, color: ELEM_COL[SIGN_ELEMENTS[a.data.sign]] || '#5A7088', background: (ELEM_COL[SIGN_ELEMENTS[a.data.sign]] || '#5A7088') + '18', padding: '2px 5px', borderRadius: 2 }}>{SIGN_ELEMENTS[a.data.sign]}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ ...F, fontSize: 8, color: '#6A8098' }}>{a.desc}</div>
                          </div>
                        </div>
                      ))}
                    </>}
                    <div style={{ padding: '8px 14px', borderTop: '1px solid #1A2840', background: '#0D1520', display: 'flex', gap: 12 }}>
                      {['Fire', 'Earth', 'Air', 'Water'].map(el => {
                        const count = chartData.planets.filter(p => SIGN_ELEMENTS[p.sign] === el).length;
                        return (
                          <div key={el} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 6, height: 6, borderRadius: 1, background: ELEM_COL[el] }} />
                            <span style={{ ...F, fontSize: 8, color: ELEM_COL[el], fontWeight: 600 }}>{el}</span>
                            <span style={{ ...F, fontSize: 9, color: '#D0DDE8', fontWeight: 700 }}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* ═══ PLANETS TAB — clickable list with readings ═══ */}
              {!selectedPlacement && natalTab === 'planets' && (
                <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  {chartData.planets.map((p, i) => {
                    const elem = SIGN_ELEMENTS[p.sign] || '';
                    const pc = PCOL[p.id] || '#8098B0';
                    return (
                      <div key={i} onClick={() => setSelectedPlacement({ id: p.id, type: 'planet' })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #14202C', cursor: 'pointer', transition: 'background .1s' }} onMouseEnter={e => e.currentTarget.style.background = '#101C28'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 18, color: pc, lineHeight: 1, width: 22, textAlign: 'center', flexShrink: 0 }}>{p.symbol}</span>
                          <div>
                            <div style={{ ...F, fontSize: 12, fontWeight: 600, color: '#D0DDE8' }}>{p.id} in {p.sign}</div>
                            {p.house && <div style={{ ...F, fontSize: 9, color: '#5A7088', marginTop: 2 }}>{p.house}{p.house===1?'st':p.house===2?'nd':p.house===3?'rd':'th'} House{p.retrograde ? ' · Retrograde' : ''}</div>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ ...F, fontSize: 10, color: '#5A7088' }}>{p.deg}° {p.sign.slice(0,3)} {String(p.min).padStart(2,'0')}'</span>
                          <span style={{ ...F, fontSize: 12, color: '#3A5068' }}>&rsaquo;</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Angles */}
                  <div style={{ ...F, fontSize: 7, fontWeight: 700, color: '#3A5068', letterSpacing: 1.5, padding: '12px 18px 6px', borderTop: '1px solid #1A2840' }}>ANGLES</div>
                  {[
                    { label: 'Ascendant', type: 'asc', data: chartData.natal?.asc, symbol: '△' },
                    { label: 'Midheaven', type: 'mc', data: chartData.natal?.mc, symbol: '▽' },
                  ].map(a => a.data && (
                    <div key={a.type} onClick={() => setSelectedPlacement({ id: a.label, type: a.type })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #14202C', cursor: 'pointer', transition: 'background .1s' }} onMouseEnter={e => e.currentTarget.style.background = '#101C28'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 18, color: '#E8A838', lineHeight: 1, width: 22, textAlign: 'center', flexShrink: 0 }}>{a.symbol}</span>
                        <div style={{ ...F, fontSize: 12, fontWeight: 600, color: '#D0DDE8' }}>{a.label} in {a.data.sign}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ ...F, fontSize: 10, color: '#5A7088' }}>{a.data.deg}° {a.data.sign.slice(0,3)} {String(a.data.min).padStart(2,'0')}'</span>
                        <span style={{ ...F, fontSize: 12, color: '#3A5068' }}>&rsaquo;</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </>)}

          {/* Line info popup */}
          {typeof popup === 'number' && lines[popup] && (<>
            <div style={{ position: 'absolute', inset: 0, zIndex: 95 }} onClick={() => setPopup(null)} />
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
          </>)}

          {/* City reading popup */}
          {cityPop && (<>
            <div style={{ position: 'absolute', inset: 0, zIndex: 95 }} onClick={() => setCityPop(null)} />
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
          </>)}

          {/* SETTINGS PANEL */}
          {showSettings && !demo && (() => {
            const tabs = [
              { id: 'profile', label: 'PROFILE', icon: '◉' },
              { id: 'birth', label: 'BIRTH DATA', icon: '☿' },
              { id: 'account', label: 'ACCOUNT', icon: '⛓' },
            ];
            const [y, m, d] = (profile?.birth_date || '').split('-');
            const dateFmt = y ? `${d}.${m}.${y}` : '—';
            const bt = profile?.birth_time || '';
            const [hh, mi] = bt.split(':').map(Number);
            const h12 = hh % 12 || 12;
            const ampm = hh < 12 ? 'AM' : 'PM';
            const timeFmt = bt ? `${String(hh).padStart(2, '0')}:${String(mi).padStart(2, '0')} (${h12}:${String(mi).padStart(2, '0')} ${ampm})` : '—';

            return (<>
              <div onClick={() => setShowSettings(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(5,10,16,.92)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 700, animation: 'fadeIn .2s ease-out' }} />
              <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: mob ? 'calc(100% - 24px)' : 520, maxHeight: mob ? 'calc(100% - 48px)' : '80vh', background: '#0D1520', border: '1px solid #1A2840', borderRadius: 16, zIndex: 710, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,.5), 0 0 0 1px rgba(0,216,138,.05)', animation: 'fadeIn .25s ease-out' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: mob ? '14px 16px' : '18px 24px', borderBottom: '1px solid #1A2840', flexShrink: 0 }}>
                  <div>
                    <div style={{ ...F, fontSize: 11, fontWeight: 700, color: '#D0DDE8', letterSpacing: 2 }}>SETTINGS</div>
                    <div style={{ ...F, fontSize: 9, color: '#5A7088', marginTop: 2 }}>{user?.email}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div onClick={signOut} title="Sign out" style={{ ...F, fontSize: 11, color: '#F04060', cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid #F0406030', background: '#F0406008', transition: 'all .15s' }}>⏻</div>
                    <div onClick={() => setShowSettings(false)} style={{ ...F, fontSize: 14, color: '#5A7088', cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid #1A2840', transition: 'all .15s' }}>×</div>
                  </div>
                </div>

                {/* Tab navigation */}
                <div style={{ display: 'flex', padding: mob ? '0 12px' : '0 20px', gap: mob ? 0 : 4, borderBottom: '1px solid #1A2840', flexShrink: 0, overflowX: 'auto' }}>
                  {tabs.map(t => (
                    <div key={t.id} onClick={() => { setSettingsTab(t.id); setEditingName(false); setConfirmDelete(false); }} style={{ ...F, fontSize: mob ? 8 : 9, fontWeight: 600, color: settingsTab === t.id ? '#00D88A' : '#5A7088', padding: mob ? '10px 8px' : '12px 14px', cursor: 'pointer', borderBottom: settingsTab === t.id ? '2px solid #00D88A' : '2px solid transparent', transition: 'all .15s', whiteSpace: 'nowrap', letterSpacing: 0.5 }}>
                      <span style={{ marginRight: 5, fontSize: mob ? 9 : 10 }}>{t.icon}</span>{t.label}
                    </div>
                  ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: mob ? 16 : 24 }}>

                  {/* ── PROFILE TAB ── */}
                  {settingsTab === 'profile' && (<div>
                    {/* Avatar / initials */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #00D88A30, #00D88A10)', border: '2px solid #00D88A40', display: 'flex', alignItems: 'center', justifyContent: 'center', ...F, fontSize: 20, fontWeight: 700, color: '#00D88A' }}>
                        {(displayName || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ ...F, fontSize: 16, fontWeight: 700, color: '#D0DDE8' }}>{displayName}</div>
                          {isPremium && <div style={{ ...F, fontSize: 7, fontWeight: 700, color: '#E8A838', padding: '2px 6px', borderRadius: 3, background: '#E8A83818', border: '1px solid #E8A83830', letterSpacing: 1 }}>PREMIUM</div>}
                        </div>
                        <div style={{ ...F, fontSize: 10, color: '#5A7088', marginTop: 2 }}>{user?.email}</div>
                      </div>
                    </div>

                    {/* Display name */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ ...F, fontSize: 9, fontWeight: 600, color: '#5A7088', letterSpacing: 1.5, marginBottom: 8 }}>DISPLAY NAME</div>
                      {editingName ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input value={nameInput} onChange={e => setNameInput(e.target.value)} maxLength={40} autoFocus style={{ ...F, fontSize: 13, color: '#D0DDE8', background: '#0A1018', border: '1px solid #1A2840', borderRadius: 6, padding: '8px 12px', flex: 1, outline: 'none' }} onKeyDown={e => { if (e.key === 'Enter' && nameInput.trim()) { setSavingName(true); updateDisplayName(nameInput.trim()).then(() => { setEditingName(false); setSavingName(false); }).catch(() => setSavingName(false)); } if (e.key === 'Escape') setEditingName(false); }} />
                          <div onClick={() => { if (nameInput.trim() && !savingName) { setSavingName(true); updateDisplayName(nameInput.trim()).then(() => { setEditingName(false); setSavingName(false); }).catch(() => setSavingName(false)); }}} style={{ ...F, fontSize: 9, color: savingName ? '#3A5068' : '#00D88A', cursor: savingName ? 'default' : 'pointer', padding: '8px 14px', borderRadius: 6, border: '1px solid #00D88A40', background: '#00D88A10' }}>{savingName ? 'SAVING...' : 'SAVE'}</div>
                          <div onClick={() => setEditingName(false)} style={{ ...F, fontSize: 9, color: '#5A7088', cursor: 'pointer', padding: '8px 10px' }}>CANCEL</div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ ...F, fontSize: 13, color: '#D0DDE8', background: '#0A1018', border: '1px solid #14202C', borderRadius: 6, padding: '8px 12px', flex: 1 }}>{displayName || '—'}</div>
                          <div onClick={() => { setNameInput(displayName || ''); setEditingName(true); }} style={{ ...F, fontSize: 9, color: '#5A7088', cursor: 'pointer', padding: '8px 14px', borderRadius: 6, border: '1px solid #1A2840' }}>EDIT</div>
                        </div>
                      )}
                    </div>

                    {/* Email (read-only) */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ ...F, fontSize: 9, fontWeight: 600, color: '#5A7088', letterSpacing: 1.5, marginBottom: 8 }}>EMAIL</div>
                      <div style={{ ...F, fontSize: 13, color: '#8098B0', background: '#0A1018', border: '1px solid #14202C', borderRadius: 6, padding: '8px 12px' }}>{user?.email}</div>
                    </div>

                    {/* Member since */}
                    <div>
                      <div style={{ ...F, fontSize: 9, fontWeight: 600, color: '#5A7088', letterSpacing: 1.5, marginBottom: 8 }}>MEMBER SINCE</div>
                      <div style={{ ...F, fontSize: 13, color: '#8098B0', background: '#0A1018', border: '1px solid #14202C', borderRadius: 6, padding: '8px 12px' }}>{user?.created_at ? new Date(user.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}</div>
                    </div>
                  </div>)}

                  {/* ── BIRTH DATA TAB ── */}
                  {settingsTab === 'birth' && (<div>
                    <div style={{ ...F, fontSize: 10, color: '#8098B0', marginBottom: 20, lineHeight: 1.6 }}>
                      Your birth data is the foundation of your astrocartography chart. All planetary line calculations depend on these values.
                    </div>

                    <div style={{ display: 'grid', gap: 16 }}>
                      <div style={{ background: '#0A1018', border: '1px solid #14202C', borderRadius: 10, padding: 16 }}>
                        <div style={{ ...F, fontSize: 9, fontWeight: 600, color: '#5A7088', letterSpacing: 1.5, marginBottom: 8 }}>DATE OF BIRTH</div>
                        <div style={{ ...F, fontSize: 15, color: '#D0DDE8', fontWeight: 600 }}>{dateFmt}</div>
                      </div>

                      <div style={{ background: '#0A1018', border: '1px solid #14202C', borderRadius: 10, padding: 16 }}>
                        <div style={{ ...F, fontSize: 9, fontWeight: 600, color: '#5A7088', letterSpacing: 1.5, marginBottom: 8 }}>TIME OF BIRTH</div>
                        <div style={{ ...F, fontSize: 15, color: '#D0DDE8', fontWeight: 600 }}>{timeFmt}</div>
                        <div style={{ ...F, fontSize: 9, color: '#3A5068', marginTop: 4 }}>Precision matters — even 4 minutes shifts your ASC lines by ~1°</div>
                      </div>

                      <div style={{ background: '#0A1018', border: '1px solid #14202C', borderRadius: 10, padding: 16 }}>
                        <div style={{ ...F, fontSize: 9, fontWeight: 600, color: '#5A7088', letterSpacing: 1.5, marginBottom: 8 }}>BIRTH LOCATION</div>
                        <div style={{ ...F, fontSize: 15, color: '#D0DDE8', fontWeight: 600 }}>{profile?.birth_city || '—'}</div>
                        <div style={{ ...F, fontSize: 9, color: '#3A5068', marginTop: 4 }}>
                          {profile?.birth_lat != null ? `${Math.abs(profile.birth_lat).toFixed(4)}°${profile.birth_lat >= 0 ? 'N' : 'S'} · ${Math.abs(profile.birth_lng).toFixed(4)}°${profile.birth_lng >= 0 ? 'E' : 'W'}` : '—'}
                        </div>
                      </div>
                    </div>

                    <div onClick={() => { setShowSettings(false); navigate('/birth-data', { state: { edit: true } }); }} style={{ ...F, fontSize: 10, fontWeight: 600, color: '#00D88A', cursor: 'pointer', padding: '12px 0', marginTop: 20, textAlign: 'center', border: '1px solid #00D88A40', borderRadius: 8, background: '#00D88A08', letterSpacing: 1 }}>
                      EDIT BIRTH DATA
                    </div>
                  </div>)}

                  {/* ── ACCOUNT TAB ── */}
                  {settingsTab === 'account' && (<div>
                    {/* Premium status */}
                    <div style={{ background: isPremium ? '#00D88A08' : '#E8A83808', border: `1px solid ${isPremium ? '#00D88A20' : '#E8A83820'}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ ...F, fontSize: 11, fontWeight: 600, color: '#D0DDE8' }}>Plan</div>
                            <div style={{ ...F, fontSize: 8, fontWeight: 700, color: isPremium ? '#00D88A' : '#E8A838', padding: '2px 8px', borderRadius: 4, background: isPremium ? '#00D88A18' : '#E8A83818', border: `1px solid ${isPremium ? '#00D88A30' : '#E8A83830'}`, letterSpacing: 1 }}>{isPremium ? 'PREMIUM' : 'FREE'}</div>
                          </div>
                          <div style={{ ...F, fontSize: 9, color: '#5A7088', marginTop: 3 }}>{isPremium ? 'Full access to all features' : 'Upgrade to unlock all features'}</div>
                        </div>
                        {!isPremium && (
                          <div onClick={handleUpgrade} style={{ ...F, fontSize: 9, fontWeight: 600, color: '#E8A838', cursor: upgradeLoading ? 'default' : 'pointer', padding: '8px 18px', borderRadius: 6, border: '1px solid #E8A83840', background: '#E8A83810', letterSpacing: 0.5 }}>{upgradeLoading ? '...' : 'UPGRADE'}</div>
                        )}
                      </div>
                    </div>

                    {/* Sign out */}
                    <div style={{ background: '#0A1018', border: '1px solid #14202C', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ ...F, fontSize: 11, fontWeight: 600, color: '#D0DDE8' }}>Sign Out</div>
                          <div style={{ ...F, fontSize: 9, color: '#5A7088', marginTop: 3 }}>Sign out of your account on this device</div>
                        </div>
                        <div onClick={signOut} style={{ ...F, fontSize: 9, fontWeight: 600, color: '#F04060', cursor: 'pointer', padding: '8px 18px', borderRadius: 6, border: '1px solid #F0406040', background: '#F0406010', letterSpacing: 0.5 }}>SIGN OUT</div>
                      </div>
                    </div>

                    {/* Danger zone */}
                    <div style={{ borderTop: '1px solid #F0406020', paddingTop: 20, marginTop: 8 }}>
                      <div style={{ ...F, fontSize: 9, fontWeight: 600, color: '#F04060', letterSpacing: 1.5, marginBottom: 12 }}>DANGER ZONE</div>
                      <div style={{ background: '#F0406008', border: '1px solid #F0406020', borderRadius: 10, padding: 16 }}>
                        <div style={{ ...F, fontSize: 11, fontWeight: 600, color: '#D0DDE8', marginBottom: 4 }}>Delete Account</div>
                        <div style={{ ...F, fontSize: 9, color: '#8098B0', lineHeight: 1.6, marginBottom: 14 }}>
                          Permanently delete your profile and all associated data. This action cannot be undone.
                        </div>
                        {!confirmDelete ? (
                          <div onClick={() => setConfirmDelete(true)} style={{ ...F, fontSize: 9, fontWeight: 600, color: '#F04060', cursor: 'pointer', padding: '8px 18px', borderRadius: 6, border: '1px solid #F0406040', background: 'transparent', display: 'inline-block', letterSpacing: 0.5 }}>DELETE ACCOUNT</div>
                        ) : (
                          <div style={{ background: '#F0406010', border: '1px solid #F0406030', borderRadius: 8, padding: 14 }}>
                            <div style={{ ...F, fontSize: 10, color: '#F04060', fontWeight: 600, marginBottom: 10 }}>Are you sure? This cannot be undone.</div>
                            <div style={{ display: 'flex', gap: 10 }}>
                              <div onClick={() => { deleteAccount(); }} style={{ ...F, fontSize: 9, fontWeight: 600, color: '#fff', cursor: 'pointer', padding: '8px 18px', borderRadius: 6, background: '#F04060', letterSpacing: 0.5 }}>YES, DELETE</div>
                              <div onClick={() => setConfirmDelete(false)} style={{ ...F, fontSize: 9, color: '#5A7088', cursor: 'pointer', padding: '8px 14px', borderRadius: 6, border: '1px solid #1A2840' }}>CANCEL</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>)}

                </div>
              </div>
            </>);
          })()}

          {/* HOW IT WORKS guide */}
          {showGuide && (() => {
            const TABS = [
              { id: 'overview', label: 'OVERVIEW', color: '#00D88A' },
              { id: 'lines', label: 'LINES', color: '#5BA8D4' },
              { id: 'planets', label: 'PLANETS', color: '#D4729A' },
              { id: 'zones', label: 'ZONES', color: '#E8A838' },
              { id: 'usage', label: 'HOW TO USE', color: '#8068C0' },
              { id: 'faq', label: 'FAQ', color: '#40B0A0' },
            ];
            const gt = guideTab;
            const cur = TABS[gt];
            const hasNext = gt < TABS.length - 1;
            const hasPrev = gt > 0;
            return (
            <div style={{ position: 'absolute', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,16,24,.88)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }} onClick={() => setShowGuide(false)}>
              <div onClick={e => e.stopPropagation()} style={{ background: '#0D1520', border: '1px solid #1A2840', borderRadius: 10, width: mob ? 'calc(100% - 24px)' : 620, maxWidth: 660, maxHeight: mob ? 'calc(100% - 24px)' : 'calc(100% - 48px)', boxShadow: '0 24px 64px rgba(0,0,0,.7)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #1A2840', background: '#0A1018', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ ...F, fontSize: 12, fontWeight: 700, color: '#00D88A', letterSpacing: 2 }}>SYSTEM GUIDE</span>
                    <span style={{ ...F, fontSize: 8, color: '#3A5068' }}>{gt + 1}/{TABS.length}</span>
                  </div>
                  <span onClick={() => setShowGuide(false)} style={{ cursor: 'pointer', ...F, fontSize: 16, color: '#5A7088', lineHeight: 1 }}>✕</span>
                </div>

                {/* Tab bar */}
                <div style={{ display: 'flex', borderBottom: '1px solid #1A2840', background: '#0B1218', flexShrink: 0, overflowX: 'auto' }}>
                  {TABS.map((t, i) => (
                    <button key={t.id} onClick={() => setGuideTab(i)} style={{
                      ...F, fontSize: mob ? 7 : 8, fontWeight: 700, letterSpacing: 1,
                      padding: mob ? '8px 8px' : '9px 14px', border: 'none', cursor: 'pointer',
                      color: i === gt ? t.color : '#3A5068',
                      background: i === gt ? t.color + '12' : 'transparent',
                      borderBottom: i === gt ? `2px solid ${t.color}` : '2px solid transparent',
                      whiteSpace: 'nowrap', flex: mob ? 1 : 'none',
                    }}>{t.label}</button>
                  ))}
                </div>

                {/* Content */}
                <div ref={guideContentRef} style={{ flex: 1, overflowY: 'auto', padding: mob ? 16 : 24 }}>

                  {/* TAB 0: Overview */}
                  {gt === 0 && <>
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ ...F, fontSize: 9, fontWeight: 700, color: '#00D88A', letterSpacing: 2, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 16, height: 1, background: '#00D88A' }} />WHAT IS NATAL NAVIGATOR
                      </div>
                      <div style={{ fontSize: 13, color: '#B0C0D0', lineHeight: 1.8 }}>
                        Natal Navigator is an <strong style={{ color: '#D0DDE8' }}>astrocartography tool</strong> that maps your birth chart onto the globe. It reveals which cities and regions of the world are energetically aligned with your planetary positions — showing you where your strengths are amplified and where challenges may arise.
                      </div>
                    </div>
                    <div style={{ width: '100%', height: 1, background: '#1A2840', marginBottom: 24 }} />
                    <div>
                      <div style={{ ...F, fontSize: 9, fontWeight: 700, color: '#E8A838', letterSpacing: 2, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 16, height: 1, background: '#E8A838' }} />WHAT IS ASTROCARTOGRAPHY
                      </div>
                      <div style={{ fontSize: 13, color: '#B0C0D0', lineHeight: 1.8, marginBottom: 12 }}>
                        Astrocartography (or locational astrology) calculates where each planet in your birth chart was rising, setting, culminating, or at its lowest point — and projects those positions as <strong style={{ color: '#D0DDE8' }}>lines across the globe</strong>. Living near or traveling to these lines activates the planet's energy in your life.
                      </div>
                      <div style={{ fontSize: 13, color: '#B0C0D0', lineHeight: 1.8 }}>
                        Your birth chart is a snapshot of the sky at the exact moment you were born. The positions of the Sun, Moon, and planets at that time define your personality traits, strengths, and life themes. Astrocartography extends this by asking: <em style={{ color: '#8098B0' }}>where on Earth were these planetary energies strongest?</em>
                      </div>
                    </div>
                  </>}

                  {/* TAB 1: Lines */}
                  {gt === 1 && <>
                    <div style={{ ...F, fontSize: 9, fontWeight: 700, color: '#5BA8D4', letterSpacing: 2, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 16, height: 1, background: '#5BA8D4' }} />THE FOUR LINE TYPES
                    </div>
                    <div style={{ fontSize: 12, color: '#6A8098', lineHeight: 1.7, marginBottom: 16 }}>
                      Each planet produces four lines on the globe — one for each angle. The line type determines <em style={{ color: '#B0C0D0' }}>which area of life</em> the planet's energy activates at that location.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 10 }}>
                      {[
                        { angle: 'MC', label: 'Midheaven', dash: '', desc: 'Where a planet culminates — its highest point. Activates career, public reputation, and ambition. The most visible and outward-facing energy.' },
                        { angle: 'IC', label: 'Nadir', dash: '4,3', desc: 'Where a planet is at its lowest point below the horizon. Activates home life, emotional roots, and inner security. Deep, private energy.' },
                        { angle: 'ASC', label: 'Ascendant', dash: '8,3', desc: 'Where a planet was rising on the eastern horizon. Activates identity, self-expression, and first impressions. Personal and physical energy.' },
                        { angle: 'DC', label: 'Descendant', dash: '2,2', desc: 'Where a planet was setting on the western horizon. Activates partnerships, relationships, and collaboration. Interpersonal energy.' },
                      ].map(a => (
                        <div key={a.angle} style={{ background: '#0A1420', border: '1px solid #14202C', borderRadius: 6, padding: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke="#8098B0" strokeWidth="2" strokeDasharray={a.dash || undefined} /></svg>
                            <span style={{ ...F, fontSize: 12, fontWeight: 700, color: '#D0DDE8' }}>{a.angle}</span>
                            <span style={{ ...F, fontSize: 8, color: '#5A7088' }}>{a.label}</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#6A8098', lineHeight: 1.7 }}>{a.desc}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ ...F, fontSize: 8, color: '#3A5068', lineHeight: 1.6, marginTop: 14, padding: '10px 12px', background: '#0A1420', borderRadius: 5, border: '1px solid #14202C' }}>
                      MC & IC are vertical meridian lines (pole to pole). ASC & DC are curved lines that follow the horizon.
                    </div>
                  </>}

                  {/* TAB 2: Planets */}
                  {gt === 2 && <>
                    <div style={{ ...F, fontSize: 9, fontWeight: 700, color: '#D4729A', letterSpacing: 2, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 16, height: 1, background: '#D4729A' }} />PLANETARY ENERGIES
                    </div>
                    <div style={{ fontSize: 12, color: '#6A8098', lineHeight: 1.7, marginBottom: 16 }}>
                      Each planet governs specific life themes. When you live near or visit a planetary line, that planet's energy is amplified in the corresponding area of your life.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 1, background: '#14202C', borderRadius: 6, overflow: 'hidden', border: '1px solid #14202C' }}>
                      {Object.entries(PLANET_DOMAINS).map(([planet, { domain, icon }]) => (
                        <div key={planet} style={{ background: '#0D1520', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 18, color: PCOL[planet], lineHeight: 1, width: 24, textAlign: 'center' }}>{icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ ...F, fontSize: 11, fontWeight: 700, color: PCOL[planet] }}>{planet}</div>
                            <div style={{ ...F, fontSize: 8, color: '#5A7088', marginTop: 1 }}>{domain}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>}

                  {/* TAB 3: Zones */}
                  {gt === 3 && <>
                    <div style={{ ...F, fontSize: 9, fontWeight: 700, color: '#E8A838', letterSpacing: 2, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 16, height: 1, background: '#E8A838' }} />ZONE CLASSIFICATION
                    </div>
                    <div style={{ fontSize: 12, color: '#6A8098', lineHeight: 1.7, marginBottom: 16 }}>
                      Cities near your lines are classified into three zones based on the planet's traditional nature. Use these as guidance, not absolute rules.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { zone: 'THRIVE', color: '#00D88A', sym: '▲', desc: 'Benefic planetary lines — Sun (vitality, recognition), Moon (emotional belonging), Venus (love, beauty), and Jupiter (luck, expansion). Each planet activates different strengths depending on the angle: MC amplifies career, IC deepens roots, ASC enhances identity, DC enriches partnerships.' },
                        { zone: 'NEUTRAL', color: '#D8A030', sym: '◆', desc: 'Mixed-energy lines — Mercury (communication, intellect) and some Mars/Saturn/Uranus angles. Effects are subtle and depend on conscious engagement. These placements offer both opportunity and challenge — how you work with the energy determines the outcome.' },
                        { zone: 'CAUTION', color: '#F04060', sym: '▼', desc: 'Challenging planetary lines — Saturn (restriction, heaviness), Mars (conflict, aggression), Neptune (confusion, deception), Pluto (power struggles, intensity), and certain Uranus angles (instability). Each planet brings specific difficulties: Saturn isolates, Mars provokes, Neptune confuses, Pluto overwhelms. Short visits can teach lessons; long-term stays require awareness.' },
                      ].map(z => (
                        <div key={z.zone} style={{ background: '#0A1420', border: `1px solid ${z.color}20`, borderRadius: 6, padding: 14, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                          <div style={{ ...F, fontSize: 16, color: z.color, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{z.sym}</div>
                          <div>
                            <div style={{ ...F, fontSize: 11, fontWeight: 700, color: z.color, letterSpacing: 1, marginBottom: 5 }}>{z.zone}</div>
                            <div style={{ fontSize: 12, color: '#6A8098', lineHeight: 1.7 }}>{z.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>}

                  {/* TAB 4: How to Use */}
                  {gt === 4 && <>
                    <div style={{ ...F, fontSize: 9, fontWeight: 700, color: '#8068C0', letterSpacing: 2, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 16, height: 1, background: '#8068C0' }} />HOW TO USE
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#14202C', borderRadius: 6, overflow: 'hidden', border: '1px solid #14202C' }}>
                      {[
                        { step: '01', title: 'Create your chart', desc: 'Sign up and enter your exact birth date, time, and location. Accuracy matters — even 15 minutes can shift your lines.' },
                        { step: '02', title: 'Explore the globe', desc: 'Drag to rotate, scroll to zoom. Your planetary lines are projected across the globe. Each colored line represents a planet-angle combination.' },
                        { step: '03', title: 'Click on cities', desc: 'Cities near your lines appear in the bottom panel. Click any city to get a detailed reading of what that planetary energy means for you there.' },
                        { step: '04', title: 'Filter by planet', desc: 'Use the left sidebar to toggle planets on/off, expand them to see their individual lines, and filter by thrive/neutral/caution zones.' },
                        { step: '05', title: 'Read your natal chart', desc: 'Click "Natal Chart" to see your planetary positions. Switch to "Your Birth Chart" for detailed readings — tap any planet to see what it means in your sign and house.' },
                      ].map(s => (
                        <div key={s.step} style={{ background: '#0D1520', padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                          <span style={{ ...F, fontSize: 20, fontWeight: 700, color: '#8068C040', lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{s.step}</span>
                          <div>
                            <div style={{ ...F, fontSize: 11, fontWeight: 700, color: '#D0DDE8', marginBottom: 4 }}>{s.title}</div>
                            <div style={{ fontSize: 12, color: '#6A8098', lineHeight: 1.7 }}>{s.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>}

                  {/* TAB 5: FAQ */}
                  {gt === 5 && <>
                    <div style={{ ...F, fontSize: 9, fontWeight: 700, color: '#40B0A0', letterSpacing: 2, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 16, height: 1, background: '#40B0A0' }} />FREQUENTLY ASKED QUESTIONS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#14202C', borderRadius: 6, overflow: 'hidden', border: '1px solid #14202C' }}>
                      {[
                        { q: 'Do I need to know my exact birth time?', a: 'Yes. Your birth time determines the Ascendant and house cusps, which shift your lines significantly. If you don\'t know your exact time, check your birth certificate or contact the hospital of birth.' },
                        { q: 'How close to a line do I need to be?', a: 'The influence is strongest within 1-2° of a line (roughly 100-200 km). We show cities up to 3.5° away, with signal strength decreasing with distance.' },
                        { q: 'Can I live on a "caution" line?', a: 'It depends on the planet. Saturn lines bring heaviness, isolation, and slow progress — manageable for disciplined people, but draining over years. Mars IC/DC lines create domestic conflict and relationship battles — not ideal for family life. Neptune lines dissolve clarity and attract deception — risky for practical decisions. Pluto lines force intense psychological transformation — powerful but overwhelming. Short visits can teach valuable lessons; long stays require deep self-awareness.' },
                        { q: 'What\'s the difference between globe and map view?', a: 'Globe view shows Earth in 3D for spatial context. Map view unfolds the projection flat, making it easier to trace lines across continents and compare regions.' },
                        { q: 'Is this based on real astronomy?', a: 'Yes. Planetary positions are calculated using high-precision astronomical algorithms (astronomy-engine), comparable to research-grade ephemeris data. Astrocartography then applies astrological interpretation to these positions.' },
                      ].map((faq, i) => (
                        <div key={i} style={{ background: '#0D1520', padding: '14px 16px' }}>
                          <div style={{ ...F, fontSize: 11, fontWeight: 700, color: '#B0C0D0', marginBottom: 6, display: 'flex', gap: 8 }}>
                            <span style={{ color: '#40B0A0', flexShrink: 0 }}>Q</span>{faq.q}
                          </div>
                          <div style={{ fontSize: 12, color: '#5A7088', lineHeight: 1.7, paddingLeft: 20 }}>{faq.a}</div>
                        </div>
                      ))}
                    </div>
                  </>}
                </div>

                {/* Bottom navigation */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderTop: '1px solid #1A2840', background: '#0A1018', flexShrink: 0 }}>
                  {hasPrev ? (
                    <div onClick={() => setGuideTab(gt - 1)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <span style={{ ...F, fontSize: 12, color: '#5A7088' }}>←</span>
                      <span style={{ ...F, fontSize: 9, color: '#5A7088' }}>{TABS[gt - 1].label}</span>
                    </div>
                  ) : <div />}
                  {hasNext ? (
                    <div onClick={() => setGuideTab(gt + 1)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: TABS[gt + 1].color + '12', border: `1px solid ${TABS[gt + 1].color}30`, borderRadius: 5, padding: '6px 14px' }}>
                      <span style={{ ...F, fontSize: 9, color: TABS[gt + 1].color, fontWeight: 600 }}>{TABS[gt + 1].label}</span>
                      <span style={{ ...F, fontSize: 12, color: TABS[gt + 1].color }}>→</span>
                    </div>
                  ) : (
                    <div onClick={() => setShowGuide(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: '#00D88A15', border: '1px solid #00D88A30', borderRadius: 5, padding: '6px 14px' }}>
                      <span style={{ ...F, fontSize: 9, color: '#00D88A', fontWeight: 600 }}>START EXPLORING</span>
                      <span style={{ ...F, fontSize: 12, color: '#00D88A' }}>→</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );})()}

          {/* Demo gate popup */}
          {showDemoGate && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,16,24,.88)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} onClick={() => setShowDemoGate(false)}>
              <div onClick={e => e.stopPropagation()} style={{ background: '#0D1520', border: '1px solid #1A2840', borderRadius: 12, padding: mob ? 24 : 32, width: mob ? 'calc(100% - 40px)' : 380, maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,.6)', textAlign: 'center', position: 'relative' }}>
                <span onClick={() => setShowDemoGate(false)} style={{ position: 'absolute', top: 12, right: 14, cursor: 'pointer', ...F, fontSize: 16, color: '#5A7088', lineHeight: 1, zIndex: 1 }}>✕</span>
                <div style={{ ...F, fontSize: 14, fontWeight: 700, color: '#00D88A', letterSpacing: 2, marginBottom: 12 }}>DISCOVER YOUR CHART</div>
                <div style={{ fontSize: 13, color: '#8098B0', lineHeight: 1.7, marginBottom: 24 }}>
                  You're viewing <strong style={{ color: '#D0DDE8' }}>{DEMO.name}'s</strong> chart as a demo.<br />
                  Sign up to see <strong style={{ color: '#00D88A' }}>your own</strong> planetary lines, city readings, and natal chart.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={() => navigate('/auth')} style={{ ...F, fontSize: 12, fontWeight: 700, color: '#0A1018', background: '#00D88A', border: 'none', borderRadius: 6, padding: '12px 0', cursor: 'pointer', letterSpacing: 1, width: '100%' }}>
                    CREATE MY CHART
                  </button>
                  <button onClick={() => navigate('/auth')} style={{ ...F, fontSize: 11, color: '#8098B0', background: 'transparent', border: '1px solid #1A2840', borderRadius: 6, padding: '10px 0', cursor: 'pointer', width: '100%' }}>
                    I already have an account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile legend toggle */}
          {mob && <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 50 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <div onClick={() => { if (popup !== 'leg') { closeAllPopups('popup'); setPopup('leg'); } else setPopup(null); }} style={{ ...F, fontSize: 9, color: popup === 'leg' ? '#00D88A' : '#8098B0', background: 'rgba(13,21,32,.95)', border: `1px solid ${popup === 'leg' ? '#00D88A40' : '#1A2840'}`, borderRadius: 4, padding: '6px 10px', cursor: 'pointer' }}>☰ PLANETS</div>
              <div onClick={() => { if (!showAngleInfo) { closeAllPopups('angle'); setShowAngleInfo(true); } else setShowAngleInfo(false); }} style={{ ...F, fontSize: 9, color: showAngleInfo ? '#00D88A' : '#5A7088', background: 'rgba(13,21,32,.95)', border: '1px solid #1A2840', borderRadius: 4, padding: '6px 8px', cursor: 'pointer' }}>?</div>
            </div>
            {popup === 'leg' && <><div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => setPopup(null)} /><div style={{ position: 'relative', zIndex: 56, background: 'rgba(13,21,32,.97)', border: '1px solid #1A2840', borderRadius: 6, padding: 10, marginTop: 4, minWidth: 220, maxHeight: '60vh', overflowY: 'auto' }}>
              {hiddenPlanets.size > 0 && <div onClick={() => setHiddenPlanets(new Set())} style={{ ...F, fontSize: 8, color: '#00D88A', cursor: 'pointer', padding: '4px 8px', marginBottom: 6, borderRadius: 3, border: '1px solid #00D88A40', background: '#00D88A10', textAlign: 'center' }}>Show all planets</div>}
              {planetGroups.map(g => {
                const isHid = hiddenPlanets.has(g.planet);
                return (
                <div key={g.planet} style={{ marginBottom: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px' }}>
                    <div onClick={e => { e.stopPropagation(); togglePlanet(g.planet); }} style={{ width: 28, height: 18, borderRadius: 9, background: isHid ? '#1A2840' : g.color + '35', border: `1px solid ${isHid ? '#2A3848' : g.color + '60'}`, cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'all .15s' }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: isHid ? '#3A5068' : g.color, position: 'absolute', top: 2, left: isHid ? 2 : 12, transition: 'all .15s' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, cursor: 'pointer', opacity: isHid ? 0.4 : 1, transition: 'opacity .15s' }} onClick={e => { e.stopPropagation(); setExpandedPlanet(expandedPlanet === g.planet ? null : g.planet); }}>
                      <span style={{ fontSize: 14 }}>{g.symbol}</span>
                      <span style={{ ...F, fontSize: 10, color: '#B0C0D0', fontWeight: 600 }}>{g.planet}</span>
                      <div style={{ display: 'flex', gap: 3, marginLeft: 'auto' }}>
                        {g.lines.map(l => (
                          <span key={l.angle} style={{ ...F, fontSize: 6, color: l.quality === 'thrive' ? '#00D88A' : l.quality === 'avoid' ? '#F04060' : '#D8A030', background: (l.quality === 'thrive' ? '#00D88A' : l.quality === 'avoid' ? '#F04060' : '#D8A030') + '15', padding: '1px 3px', borderRadius: 2 }}>{l.angle}</span>
                        ))}
                      </div>
                      <span style={{ ...F, fontSize: 11, color: '#3A5068', transform: expandedPlanet === g.planet ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .15s' }}>›</span>
                    </div>
                  </div>
                  {expandedPlanet === g.planet && g.lines.map((l, li) => (
                    <div key={li} onClick={e => { e.stopPropagation(); setPopup(lines.indexOf(l)); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 4px 5px 40px', cursor: 'pointer', borderBottom: '1px solid #14202C' }}>
                      <svg width="16" height="4" style={{ flexShrink: 0 }}>
                        {l.angle === 'MC' && <line x1="0" y1="2" x2="16" y2="2" stroke={l.c} strokeWidth="2" />}
                        {l.angle === 'IC' && <line x1="0" y1="2" x2="16" y2="2" stroke={l.c} strokeWidth="2" strokeDasharray="3,2" />}
                        {l.angle === 'ASC' && <line x1="0" y1="2" x2="16" y2="2" stroke={l.c} strokeWidth="2" strokeDasharray="6,2" />}
                        {l.angle === 'DC' && <line x1="0" y1="2" x2="16" y2="2" stroke={l.c} strokeWidth="2" strokeDasharray="1.5,1.5" />}
                      </svg>
                      <span style={{ ...F, fontSize: 9, color: '#8098B0' }}>{l.angle}</span>
                      <span style={{ ...F, fontSize: 7, color: l.quality === 'thrive' ? '#00D88A' : l.quality === 'avoid' ? '#F04060' : '#D8A030' }}>
                        {l.quality === 'thrive' ? '▲' : l.quality === 'avoid' ? '▼' : '◆'}
                      </span>
                    </div>
                  ))}
                </div>
              )})}
            </div></>}
            {/* Mobile angle info */}
            {showAngleInfo && <><div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => setShowAngleInfo(false)} /><div style={{ position: 'relative', zIndex: 56, background: 'rgba(13,21,32,.97)', border: '1px solid #1A2840', borderRadius: 6, padding: 12, marginTop: 4, minWidth: 260, maxHeight: '60vh', overflowY: 'auto' }}>
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
            </div></>}
          </div>}
        </div>
      </div>

      {/* BOTTOM PANEL — Bloomberg-style */}
      <div style={{ minHeight: mob ? 200 : 240, maxHeight: mob ? 200 : 240, background: '#0D1520', borderTop: '1px solid #1A2840', display: 'flex', flexShrink: 0, zIndex: 200, overflow: 'hidden', minWidth: 0 }}>
        {/* Left: City table */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #14202C', flexShrink: 0 }}>
            {[
              { id: 'thrive', label: '▲ THRIVE', count: thriveC.length, col: COL.thrive },
              { id: 'neutral', label: '◆ NEUTRAL', count: neutralC.length, col: COL.neutral },
              { id: 'avoid', label: '▼ AVOID', count: avoidC.length, col: COL.avoid },
              { id: 'all', label: 'ALL', count: onLines.length, col: '#B0C0D0' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, background: tab === t.id ? '#101C28' : 'transparent', border: 'none',
                borderBottom: tab === t.id ? `2px solid ${t.col}` : '2px solid transparent',
                color: tab === t.id ? t.col : '#3A5068',
                cursor: 'pointer', padding: mob ? '5px 0' : '6px 0', ...F, fontSize: mob ? 8 : 9, fontWeight: 700, letterSpacing: 1
              }}>
                {t.label} ({t.count})
              </button>
            ))}
          </div>

          {/* Column headers */}
          {!mob && <div style={{ display: 'flex', padding: '4px 12px', borderBottom: '1px solid #14202C', flexShrink: 0, background: '#0A1018' }}>
            <span style={{ ...F, fontSize: 7, color: '#3A5068', fontWeight: 700, width: 130, letterSpacing: 1 }}>CITY</span>
            <span style={{ ...F, fontSize: 7, color: '#3A5068', fontWeight: 700, width: 100, letterSpacing: 1 }}>LINE</span>
            <span style={{ ...F, fontSize: 7, color: '#3A5068', fontWeight: 700, width: 60, letterSpacing: 1, textAlign: 'center' }}>SIGNAL</span>
            <span style={{ ...F, fontSize: 7, color: '#3A5068', fontWeight: 700, width: 130, letterSpacing: 1 }}>DOMAIN</span>
            <span style={{ ...F, fontSize: 7, color: '#3A5068', fontWeight: 700, width: 110, letterSpacing: 1 }}>LIFE AREA</span>
            <span style={{ ...F, fontSize: 7, color: '#3A5068', fontWeight: 700, flex: 1, letterSpacing: 1 }}>READING</span>
          </div>}

          {/* City rows */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredTab.map((c, i) => {
              const imp = cityImpact(c);
              const qCol = c.q === 'thrive' ? COL.thrive : c.q === 'avoid' ? COL.avoid : COL.neutral;
              return mob ? (
                <div key={i} onClick={() => { handleCityClick(c); flyTo(c.la, c.lo); }} style={{ padding: '6px 10px', borderBottom: '1px solid #14202C', cursor: 'pointer', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, minWidth: 0 }}>
                    <div style={{ width: 3, height: 18, borderRadius: 1, background: c.lc, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#D0DDE8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flexShrink: 1 }}>{c.name}</span>
                    <span style={{ ...F, fontSize: 7, color: c.lc, background: c.lc + '15', padding: '1px 5px', borderRadius: 2, flexShrink: 0, whiteSpace: 'nowrap' }}>{c.line}</span>
                    <span style={{ ...F, fontSize: 7, color: qCol, marginLeft: 'auto', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>{imp.strengthPct}%</span>
                  </div>
                  <div style={{ ...F, fontSize: 8, color: '#5A7088', lineHeight: 1.4, marginLeft: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{imp.domain} → {imp.area}</div>
                </div>
              ) : (
                <div key={i} onClick={() => { handleCityClick(c); flyTo(c.la, c.lo); }} style={{ display: 'flex', alignItems: 'center', padding: '5px 12px', borderBottom: '1px solid #14202C', cursor: 'pointer', transition: 'background .1s' }} onMouseEnter={e => e.currentTarget.style.background = '#101C28'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {/* City */}
                  <div style={{ width: 130, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <div style={{ width: 3, height: 24, borderRadius: 1, background: c.lc, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#D0DDE8', lineHeight: 1.2 }}>{c.name}</div>
                      <div style={{ ...F, fontSize: 7, color: '#3A5068' }}>{c.la.toFixed(1)}° {c.la >= 0 ? 'N' : 'S'}, {c.lo.toFixed(1)}° {c.lo >= 0 ? 'E' : 'W'}</div>
                    </div>
                  </div>
                  {/* Line */}
                  <div style={{ width: 100, flexShrink: 0 }}>
                    <span style={{ ...F, fontSize: 9, color: c.lc, fontWeight: 600 }}>{imp.icon} {c.line}</span>
                    <div style={{ ...F, fontSize: 7, color: '#3A5068' }}>{c.dist.toFixed(1)}° orb</div>
                  </div>
                  {/* Signal strength */}
                  <div style={{ width: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ ...F, fontSize: 8, fontWeight: 700, color: qCol }}>{imp.strengthPct}%</span>
                    <div style={{ width: 36, height: 3, background: '#14202C', borderRadius: 2, marginTop: 2 }}>
                      <div style={{ width: `${imp.strengthPct}%`, height: '100%', background: qCol, borderRadius: 2 }} />
                    </div>
                    <span style={{ ...F, fontSize: 6, color: '#3A5068', marginTop: 1 }}>{imp.strength}</span>
                  </div>
                  {/* Domain */}
                  <div style={{ width: 130, flexShrink: 0 }}>
                    <div style={{ ...F, fontSize: 8, color: '#8098B0' }}>{imp.domain}</div>
                  </div>
                  {/* Life area */}
                  <div style={{ width: 110, flexShrink: 0 }}>
                    <span style={{ ...F, fontSize: 8, color: qCol, fontWeight: 600 }}>{imp.area}</span>
                  </div>
                  {/* Reading */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...F, fontSize: 8, color: '#6A8098', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{imp.summary}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Lines summary — desktop only */}
        {!mob && <div style={{ width: 260, minWidth: 260, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid #1A2840' }}>
          <div style={{ ...F, fontSize: 9, fontWeight: 600, color: '#5A7088', letterSpacing: 1.5, padding: '8px 12px', borderBottom: '1px solid #14202C', background: '#0A1018' }}>
            ON YOUR LINES — {onLines.length} CITIES
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '2px 0' }}>
            {visibleLines.map((l, i) => {
              const cities = onLines.filter(c => c.line === l.n);
              if (!cities.length) return null;
              const qCol = l.quality === 'thrive' ? COL.thrive : l.quality === 'avoid' ? COL.avoid : COL.neutral;
              return (
                <div key={i} style={{ padding: '3px 12px', borderBottom: '1px solid #0F1820' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <div style={{ width: 10, height: 2, background: l.c, borderRadius: 1, flexShrink: 0 }} />
                    <span style={{ ...F, fontSize: 8, color: '#8098B0', fontWeight: 600 }}>{l.n}</span>
                    <span style={{ ...F, fontSize: 6, color: qCol, fontWeight: 700, marginLeft: 'auto' }}>{l.quality === 'thrive' ? '▲' : l.quality === 'avoid' ? '▼' : '◆'} {cities.length}</span>
                  </div>
                  <div style={{ ...F, fontSize: 7, color: '#5A7088', lineHeight: 1.4 }}>{cities.map(c => c.name).join(' · ')}</div>
                </div>
              );
            })}
          </div>
        </div>}
      </div>

      {/* BOTTOM TICKER */}
      <div style={{ height: 22, minHeight: 22, background: '#0A1018', borderTop: '1px solid #14202C', display: 'flex', alignItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 24, whiteSpace: 'nowrap', ...F, fontSize: 8, animation: 'ts 55s linear infinite', animationPlayState: pageVisible ? 'running' : 'paused', willChange: 'transform', backfaceVisibility: 'hidden' }}>
          {[...Array(2)].flatMap(() => [
            bestCities[0] ? `★ Best city: ${bestCities[0].name} (${bestCities[0].line})` : '★ Your personalized chart',
            `▲ ${thriveC.length} thrive`,
            `◆ ${neutralC.length} neutral`,
            `▼ ${avoidC.length} caution`,
            `◉ ${onLines.length} total cities on your natal lines`,
          ]).map((t, i) => (
            <span key={i} style={{ color: t.startsWith('▼') ? '#F04060' : t.startsWith('▲') ? '#00D88A' : '#5A7088', padding: '0 4px' }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
