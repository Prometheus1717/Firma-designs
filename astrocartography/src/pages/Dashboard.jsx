import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Globe from '../components/Globe';
import { calculateChart } from '../lib/calculateChart';
import { ALL_CITIES, CITIES_T1, CITIES_T2, CITIES_T3, CITY_COUNTRY } from '../data/cities';
import { getCachedChart, setCachedChart } from '../lib/chartCache';
import { redirectToCheckout } from '../lib/stripe';
import { trackEvent } from '../lib/posthog';
import { t, getLang, setLang as persistLang, LANGUAGES } from '../lib/i18n';

// Demo chart: Elon Musk — public birth data
const DEMO = {
  date: '1971-06-28', time: '07:00',
  lat: -25.7479, lng: 28.2293,
  city: 'Pretoria, South Africa',
  name: 'Elon Musk',
};

const F = { fontFamily: 'JetBrains Mono, monospace' };

// ── Translatable lookups ──
const tPlanet = (name, lang) => t(`p${name}`, lang);
const tSign = (name, lang) => t(`s${name}`, lang);
const tMode = (mode, lang) => t(`m${mode}`, lang);
const tElem = (elem, lang) => t(elem.toLowerCase(), lang); // fire/earth/air/water already in i18n
const tLine = (line, lang) => { const [p, a] = (line || '').split(' '); return `${tPlanet(p, lang)} ${a || ''}`; };
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

const PLANET_ICONS = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇' };
const getPlanetDomain = (name, lang) => ({ domain: t(`dom${name}`, lang), icon: PLANET_ICONS[name] || '' });

const getAngleEffect = (angle, lang) => ({ area: t(`ae${angle}`, lang), short: t(`ae${angle}short`, lang) });

function cityImpact(c, lang) {
  const parts = c.line.split(' ');
  const planet = parts[0];
  const angle = parts[1];
  const pd = getPlanetDomain(planet, lang);
  const ae = getAngleEffect(angle, lang);
  if (!pd.domain || !ae.area) return { planet, angle, domain: '', area: '', summary: c.desc || '' };
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
  const [lightMode, setLightMode] = useState(() => {
    try { return localStorage.getItem('nn_theme') === 'light'; } catch { return false; }
  });
  const L = lightMode;
  useEffect(() => {
    try { localStorage.setItem('nn_theme', lightMode ? 'light' : 'dark'); } catch {}
  }, [lightMode]);
  const T = useMemo(() => lightMode ? {
    bg: '#F2F0ED', p: '#FFFFFF', c: '#FAF9F7', b: '#F7F6F4', d: '#EDEAE6', a: '#F4F2EF',
    bd: '#D6D2CC', bs: '#E5E2DD',
    tx: '#1C1B1A', tm: '#55524E', td: '#8A8580', mu: '#B5B0AA',
    ac: '#00A86B', acBg: 'rgba(0,168,107,.06)', acBd: 'rgba(0,168,107,.20)',
    pop: 'rgba(255,255,255,.97)', pan: 'rgba(255,255,255,.98)',
    sh: '0 12px 40px rgba(60,50,40,.08)', shH: '0 6px 24px rgba(60,50,40,.06)',
    ov: 'rgba(242,240,237,.88)',
  } : {
    bg: '#0A1018', p: '#0D1520', c: '#101C28', b: '#0B1218', d: '#0A1420', a: '#0C1420',
    bd: '#1A2840', bs: '#14202C',
    tx: '#D0DDE8', tm: '#8098B0', td: '#5A7088', mu: '#3A5068',
    ac: '#00D88A', acBg: '#00D88A10', acBd: '#00D88A40',
    pop: 'rgba(13,21,32,.97)', pan: 'rgba(10,16,24,.98)',
    sh: '0 16px 48px rgba(0,0,0,.5)', shH: '0 8px 32px rgba(0,0,0,.6)',
    ov: 'rgba(5,10,16,.92)',
  }, [lightMode]);
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
  const [lang, setLangState] = useState(() => getLang());
  const [showLangPicker, setShowLangPicker] = useState(false);
  const changeLang = (code) => { persistLang(code); setLangState(code); setShowLangPicker(false); };

  useEffect(() => { document.title = demo ? t('titleDemo', lang) : t('titleDash', lang); }, [demo, lang]);

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
    if (except !== 'lang') setShowLangPicker(false);
  }, []);

  // Clock — update via ref + DOM to avoid re-rendering; pauses when tab is hidden
  const clockRef = useRef(null);
  const langBtnRef = useRef(null);
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
  const planetString = useMemo(() => {
    if (!chartData?.planets) return chartData?.planetString || '';
    return chartData.planets.map(p => {
      const sym = SIGN_SYMBOLS[p.sign] || '';
      const retro = p.retrograde ? '℞' : '';
      return `${sym} ${tSign(p.sign, lang)} ${p.deg}°${String(p.min).padStart(2,'0')}'${retro}`;
    }).join('  ·  ');
  }, [chartData, lang]);

  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPDF = useCallback(async () => {
    if (pdfLoading || !chartData) return;
    setPdfLoading(true);
    trackEvent('pdf_download');
    try {
      const nR = window.__natalReadings || await import('../data/natalReadings');
      const { generateNatalPDF } = await import('../lib/generatePDF');
      await generateNatalPDF({ displayName, chartData, thriveC, avoidC, neutralC, cityReadingFn: cityReading, natalReadings: nR, lang });
    } catch (err) { console.error('PDF generation failed:', err); }
    finally { setPdfLoading(false); }
  }, [pdfLoading, chartData, displayName, thriveC, avoidC, neutralC, lang]);

  const flyTo = useCallback((la, lo, name) => {
    Globe.flyTo?.(la, lo, name);
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
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...F, fontSize: 18, fontWeight: 700, color: T.ac, letterSpacing: 6, marginBottom: 24 }}>NATAL NAVIGATOR</div>
        <div style={{ ...F, fontSize: 11, color: T.tm, marginBottom: 20 }}>{demo ? t('loadingDemo', lang) : !profile ? t('connecting', lang) : t('calculating', lang)}</div>
        <div style={{ width: 240, height: 3, background: T.bd, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', background: T.ac, borderRadius: 2, animation: 'loadbar 1.5s ease-in-out infinite' }} />
        </div>
        <style>{`@keyframes loadbar { 0% { transform: translateX(-100%); } 50% { transform: translateX(0%); } 100% { transform: translateX(100%); } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ ...F, fontSize: 14, color: '#F04060', marginBottom: 16 }}>Error: {error}</div>
        <button onClick={() => navigate('/birth-data')} style={{ ...F, fontSize: 11, color: T.ac, background: 'transparent', border: `1px solid ${T.ac}`, borderRadius: 6, padding: '8px 20px', cursor: 'pointer' }}>
          {t('reEnterBirth', lang)}
        </button>
      </div>
    );
  }

  // ─── PAYWALL SCREEN ───
  if (showPaywall) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        {/* Payment success banner */}
        {paymentStatus === 'success' && (
          <div style={{ ...F, fontSize: 11, color: T.ac, background: T.acBg, border: `1px solid ${T.acBd}`, borderRadius: 8, padding: '12px 20px', marginBottom: 24, textAlign: 'center' }}>
            {t('paymentReceived', lang)}
          </div>
        )}

        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          {/* Logo */}
          <div style={{ ...F, fontSize: 22, fontWeight: 700, color: T.ac, letterSpacing: 6, marginBottom: 8 }}>NATAL NAVIGATOR</div>
          <div style={{ ...F, fontSize: 9, color: T.td, letterSpacing: 3, marginBottom: 40 }}>{t('yourMap', lang)}</div>

          {/* Upgrade card */}
          <div style={{ background: lightMode ? 'linear-gradient(160deg, #FFFFFF 0%, #F2F0ED 50%, #FAF9F7 100%)' : 'linear-gradient(160deg, #0F1A28 0%, #0A1018 50%, #10182A 100%)', border: `1px solid ${T.bd}`, borderRadius: 20, padding: mob ? 28 : 44, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Subtle glow effect */}
            <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 200, height: 120, background: `radial-gradient(ellipse, ${T.acBg} 0%, transparent 70%)`, pointerEvents: 'none' }} />

            <div style={{ ...F, fontSize: 11, fontWeight: 600, color: T.ac, letterSpacing: 3, marginBottom: 6, textTransform: 'uppercase' }}>{t('premium', lang)}</div>
            <div style={{ ...F, fontSize: mob ? 20 : 24, fontWeight: 700, color: T.tx, marginBottom: 10, lineHeight: 1.3 }}>{t('yourPersonalMap', lang).split('\n').map((l, i) => <span key={i}>{l}{i === 0 && <br />}</span>)}</div>
            <div style={{ ...F, fontSize: 11, color: T.td, lineHeight: 1.7, marginBottom: 32, maxWidth: 340, margin: '0 auto 32px' }}>
              {t('mapDescription', lang)}
            </div>

            {/* Price — centered, clean */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
                <span style={{ ...F, fontSize: 14, fontWeight: 500, color: T.tx, alignSelf: 'flex-start', marginTop: 6 }}>{displayCurrency === 'EUR' ? '€' : displayCurrency === 'GBP' ? '£' : displayCurrency === 'CHF' ? 'CHF' : '$'}</span>
                <span style={{ ...F, fontSize: 48, fontWeight: 700, color: T.tx, letterSpacing: -1 }}>{displayPrice}</span>
              </div>
              <div style={{ ...F, fontSize: 12, fontWeight: 600, color: T.ac, marginTop: 8, letterSpacing: 2 }}>{priceLabel}</div>
            </div>

            {/* CTA */}
            {upgradeError && (
              <div style={{ ...F, fontSize: 10, color: '#F04060', marginBottom: 12 }}>{upgradeError}</div>
            )}
            <div
              onClick={handleUpgrade}
              style={{ ...F, fontSize: 13, fontWeight: 700, color: T.bg, background: upgradeLoading ? T.td : T.ac, padding: '15px 0', borderRadius: 10, cursor: upgradeLoading ? 'default' : 'pointer', letterSpacing: 1.5, transition: 'all .2s', boxShadow: upgradeLoading ? 'none' : `0 0 20px ${T.acBg}` }}
            >
              {upgradeLoading ? t('redirecting', lang) : t('getStarted', lang)}
            </div>

            {/* What's included — compact */}
            <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', maxWidth: 260, margin: '28px auto 0', justifyItems: 'center' }}>
              {[
                t('feat3d', lang),
                t('featCity', lang),
                t('featNatal', lang),
                t('featFlat', lang),
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, justifySelf: 'center' }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: T.ac, flexShrink: 0 }} />
                  <span style={{ ...F, fontSize: 10, color: T.td }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Security note */}
            <div style={{ ...F, fontSize: 8, color: T.mu, marginTop: 20, letterSpacing: 0.5 }}>
              {t('secureCheckout', lang)}
            </div>
          </div>

          {/* Sign out link */}
          <div onClick={signOut} style={{ ...F, fontSize: 9, color: T.td, cursor: 'pointer', marginTop: 20 }}>
            {t('signOut', lang)}
          </div>
        </div>

        <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'fixed', inset: 0, background: T.bg, color: T.tx, fontFamily: 'Instrument Sans, sans-serif', overflow: 'hidden', transition: 'background .3s, color .3s' }}>
      {/* Payment success banner */}
      {paymentStatus === 'success' && (
        <div onClick={() => setPaymentStatus(null)} style={{ ...F, fontSize: 11, color: T.ac, background: T.acBg, borderBottom: `1px solid ${T.acBd}`, padding: '8px 16px', textAlign: 'center', cursor: 'pointer', zIndex: 400, flexShrink: 0 }}>
          {t('premiumActivated', lang)}
        </div>
      )}
      {/* Announcement banner from admin settings */}
      {announcement && (
        <div onClick={() => setAnnouncement(null)} style={{ ...F, fontSize: 10, color: announcement.color, background: `${announcement.color}10`, borderBottom: `1px solid ${announcement.color}30`, padding: '7px 16px', textAlign: 'center', cursor: 'pointer', zIndex: 399, flexShrink: 0, lineHeight: 1.5 }}>
          {announcement.text}
        </div>
      )}
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>{t('titleH1', lang)}</h1>
      {/* TOPBAR */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: mob ? '0 8px' : '0 16px', height: 38, minHeight: 38, background: T.p, borderBottom: `1px solid ${T.bd}`, zIndex: 300, flexShrink: 0, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: mob ? 6 : 12, minWidth: 0, overflow: 'hidden' }}>
          <span style={{ ...F, fontSize: mob ? 10 : 12, fontWeight: 700, color: T.ac, letterSpacing: mob ? 1.5 : 3, whiteSpace: 'nowrap' }}>{t('natalNavigator', lang)}</span>
          <span style={{ ...F, fontSize: 9, color: T.ac, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.ac, boxShadow: `0 0 6px ${T.ac}` }} />
            {!mob && t('live', lang)}
          </span>
          <span onClick={() => { closeAllPopups('guide'); setGuideTab(0); setShowGuide(true); }} style={{ ...F, fontSize: mob ? 7 : 9, fontWeight: 600, color: T.td, cursor: 'pointer', padding: mob ? '3px 7px' : '4px 10px', borderRadius: 4, border: `1px solid ${T.bd}`, letterSpacing: 0.5 }}>{t('howItWorks', lang)}</span>
          {/* Language selector */}
          <div style={{ position: 'relative' }}>
            <span ref={langBtnRef} onClick={(e) => { e.stopPropagation(); closeAllPopups('lang'); setShowLangPicker(!showLangPicker); }} style={{ ...F, fontSize: mob ? 7 : 9, fontWeight: 600, color: showLangPicker ? T.ac : T.td, cursor: 'pointer', padding: mob ? '3px 7px' : '4px 10px', borderRadius: 4, border: `1px solid ${showLangPicker ? T.acBd : T.bd}`, background: showLangPicker ? T.acBg : 'transparent', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 4, userSelect: 'none' }}>
              <svg width={mob ? 10 : 12} height={mob ? 10 : 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>
              {!mob && lang.toUpperCase()}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: mob ? 8 : 12 }}>
          {/* Sun/Moon theme toggle */}
          <div onClick={() => setLightMode(!lightMode)} style={{ width: mob ? 36 : 44, height: mob ? 20 : 22, borderRadius: 11, background: lightMode ? '#FFD60A' : '#1A2840', border: `1px solid ${lightMode ? '#F0C800' : '#2A3A50'}`, cursor: 'pointer', position: 'relative', transition: 'all .3s ease', display: 'flex', alignItems: 'center', padding: '0 3px', flexShrink: 0 }}>
            <div style={{ width: mob ? 14 : 16, height: mob ? 14 : 16, borderRadius: '50%', background: lightMode ? '#FFF' : '#D0DDE8', position: 'absolute', left: lightMode ? (mob ? 19 : 25) : 3, transition: 'all .3s cubic-bezier(.4,0,.2,1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: mob ? 8 : 9, boxShadow: lightMode ? '0 1px 3px rgba(0,0,0,.15)' : 'none' }}>
              {lightMode ? '☀' : '☽'}
            </div>
          </div>
          {!mob && <span ref={clockRef} style={{ ...F, fontSize: 9, color: T.td }} />}
          {demo ? <>
            <span style={{ ...F, fontSize: mob ? 7 : 8, color: T.td, background: T.c, padding: mob ? '2px 6px' : '3px 8px', borderRadius: 3, border: `1px solid ${T.bd}` }}>{t('demo', lang)}: {DEMO.name}</span>
            <span onClick={() => navigate('/auth')} style={{ ...F, fontSize: mob ? 8 : 9, fontWeight: 600, color: T.bg, background: T.ac, padding: mob ? '4px 10px' : '5px 14px', borderRadius: 4, cursor: 'pointer', letterSpacing: 1 }}>{t('signUp', lang)}</span>
          </> : <>
            {profile?.is_admin && <span onClick={() => navigate('/admin')} style={{ ...F, fontSize: 9, color: '#D8A030', cursor: 'pointer', background: '#D8A03010', padding: '4px 10px', borderRadius: 4, border: '1px solid #2A2018', letterSpacing: 1 }}>ADMIN</span>}
            <div onClick={() => { closeAllPopups('settings'); setShowSettings(!showSettings); setSettingsTab('profile'); setEditingName(false); setConfirmDelete(false); }} style={{ ...F, fontSize: 9, color: showSettings ? T.ac : T.tm, cursor: 'pointer', background: showSettings ? T.acBg : T.c, padding: '4px 10px', borderRadius: 4, border: `1px solid ${showSettings ? T.acBd : T.bd}`, transition: 'all .2s' }}>
              ◉ {displayName}
            </div>
          </>}
        </div>
      </nav>

      {/* Language dropdown — rendered outside overflow:hidden topbar */}
      {showLangPicker && (() => {
        const r = langBtnRef.current?.getBoundingClientRect();
        return <>
          <div onClick={() => setShowLangPicker(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
          <div style={{ position: 'fixed', top: (r?.bottom || 38) + 4, left: r?.left || 200, background: T.pop, border: `1px solid ${T.bd}`, borderRadius: 8, boxShadow: T.sh, zIndex: 9999, minWidth: 180, maxHeight: 320, overflowY: 'auto', padding: '4px 0' }}>
            {LANGUAGES.map(lg => (
              <div key={lg.code} onClick={() => changeLang(lg.code)} style={{ ...F, fontSize: 11, color: lg.code === lang ? T.ac : T.tm, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, background: lg.code === lang ? T.acBg : 'transparent', transition: 'background .15s' }}
                onMouseEnter={e => { if (lg.code !== lang) e.currentTarget.style.background = T.c; }}
                onMouseLeave={e => { if (lg.code !== lang) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 11 }}>{lg.name}</span>
                {lg.code === lang && <span style={{ marginLeft: 'auto', fontSize: 9, color: T.ac }}>✓</span>}
              </div>
            ))}
          </div>
        </>;
      })()}

      {/* PLANET TICKER */}
      <div style={{ height: 24, minHeight: 24, background: T.b, borderBottom: `1px solid ${T.bs}`, display: 'flex', alignItems: 'center', overflow: 'hidden', flexShrink: 0, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 20, whiteSpace: 'nowrap', ...F, fontSize: 9, animation: 'ts 80s linear infinite', animationPlayState: pageVisible ? 'running' : 'paused', willChange: 'transform', backfaceVisibility: 'hidden' }}>
          {[planetString, planetString].map((ps, i) => <span key={i} style={{ color: '#E8A838', padding: '0 20px' }}>{ps}</span>)}
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0 }}>
        {/* LEFT SIDEBAR */}
        {!mob && <div style={{ width: 220, minWidth: 220, background: T.p, borderRight: `1px solid ${T.bd}`, overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Header with info button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px 6px' }}>
            <span style={{ ...F, fontSize: 9, fontWeight: 600, color: T.td, letterSpacing: 2 }}>{t('planets', lang)}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {hiddenPlanets.size > 0 && <span onClick={() => setHiddenPlanets(new Set())} style={{ ...F, fontSize: 8, color: T.ac, cursor: 'pointer', padding: '2px 6px', borderRadius: 3, border: `1px solid ${T.acBd}`, background: T.acBg }}>{t('allOn', lang)}</span>}
              <span onClick={() => setShowAngleInfo(!showAngleInfo)} style={{ ...F, fontSize: 9, color: showAngleInfo ? T.ac : T.mu, cursor: 'pointer', padding: '2px 6px', borderRadius: 3, border: `1px solid ${showAngleInfo ? T.acBd : T.bd}`, background: showAngleInfo ? T.acBg : 'transparent' }}>?</span>
            </div>
          </div>

          {/* Angle info panel (collapsible) */}
          {showAngleInfo && <div style={{ margin: '0 8px 8px', background: T.d, border: `1px solid ${T.bd}`, borderRadius: 6, padding: 10 }}>
            <div style={{ ...F, fontSize: 9, fontWeight: 700, color: T.tm, marginBottom: 8 }}>{t('lineTypes', lang)}</div>
            {ANGLE_ORDER.map(a => {
              return (
                <div key={a} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${T.bs}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <svg width="22" height="6" style={{ flexShrink: 0 }}>
                      {a === 'MC' && <line x1="0" y1="3" x2="22" y2="3" stroke={T.tm} strokeWidth="2" />}
                      {a === 'IC' && <line x1="0" y1="3" x2="22" y2="3" stroke={T.tm} strokeWidth="2" strokeDasharray="4,3" />}
                      {a === 'ASC' && <line x1="0" y1="3" x2="22" y2="3" stroke={T.tm} strokeWidth="2" strokeDasharray="8,3" />}
                      {a === 'DC' && <line x1="0" y1="3" x2="22" y2="3" stroke={T.tm} strokeWidth="2" strokeDasharray="2,2" />}
                    </svg>
                    <span style={{ ...F, fontSize: 9, fontWeight: 700, color: T.tx }}>{a}</span>
                    <span style={{ ...F, fontSize: 7, color: T.td }}>{t(`${a.toLowerCase()}Full`, lang)}</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.tm, lineHeight: 1.5, marginLeft: 30 }}>{t(`${a.toLowerCase()}AngleDesc`, lang)}</div>
                </div>
              );
            })}
            <div style={{ ...F, fontSize: 8, color: T.mu, lineHeight: 1.5, borderTop: `1px solid ${T.bs}`, paddingTop: 6, marginTop: 2 }}>
              {t('lineFootnote', lang)}
            </div>
          </div>}

          {/* Planet groups */}
          {planetGroups.map(g => {
            const isOpen = expandedPlanet === g.planet;
            const isHidden = hiddenPlanets.has(g.planet);
            const planetCities = onLines.filter(c => g.lines.some(l => l.n === c.line));
            return (
              <div key={g.planet} style={{ opacity: isHidden ? 0.4 : 1, transition: 'opacity .15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${T.bs}`, background: isOpen ? T.c : 'transparent', transition: 'background .15s' }}>
                  <div onClick={e => { e.stopPropagation(); togglePlanet(g.planet); }} style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, cursor: 'pointer', flexShrink: 0, background: isHidden ? T.bd : g.color + '25', border: `1px solid ${isHidden ? T.bd : g.color + '50'}` }} title={isHidden ? 'Show on map' : 'Hide from map'}>
                    <span style={{ ...F, fontSize: 8, color: isHidden ? T.mu : g.color }}>{isHidden ? '○' : '●'}</span>
                  </div>
                  <div onClick={() => { setExpandedPlanet(isOpen ? null : g.planet); }} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, lineHeight: 1 }}>{g.symbol}</span>
                    <span style={{ ...F, fontSize: 10, color: T.tm, flex: 1, fontWeight: 600 }}>{tPlanet(g.planet, lang)}</span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {g.lines.map(l => (
                        <span key={l.angle} style={{ ...F, fontSize: 7, color: l.quality === 'thrive' ? T.ac : l.quality === 'avoid' ? '#F04060' : '#D8A030', background: (l.quality === 'thrive' ? T.ac : l.quality === 'avoid' ? '#F04060' : '#D8A030') + '15', padding: '1px 4px', borderRadius: 2 }}>{l.angle}</span>
                      ))}
                    </div>
                    <span style={{ ...F, fontSize: 10, color: T.mu, transform: isOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .15s' }}>›</span>
                  </div>
                </div>
                {/* Expanded detail */}
                {isOpen && <div style={{ background: T.d, borderBottom: `1px solid ${T.bs}` }}>
                  {g.lines.map((l, li) => (
                    <div key={li} onClick={() => { setPopup(lines.indexOf(l) === popup ? null : lines.indexOf(l)); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 28px', cursor: 'pointer', borderBottom: `1px solid ${T.bs}` }}>
                      {/* Dash preview */}
                      <svg width="18" height="4" style={{ flexShrink: 0 }}>
                        {l.angle === 'MC' && <line x1="0" y1="2" x2="18" y2="2" stroke={l.c} strokeWidth="2" />}
                        {l.angle === 'IC' && <line x1="0" y1="2" x2="18" y2="2" stroke={l.c} strokeWidth="2" strokeDasharray="4,3" />}
                        {l.angle === 'ASC' && <line x1="0" y1="2" x2="18" y2="2" stroke={l.c} strokeWidth="2" strokeDasharray="8,3" />}
                        {l.angle === 'DC' && <line x1="0" y1="2" x2="18" y2="2" stroke={l.c} strokeWidth="2" strokeDasharray="2,2" />}
                      </svg>
                      <span style={{ ...F, fontSize: 9, color: T.tm, flex: 1 }}>{l.angle}</span>
                      <span style={{ ...F, fontSize: 7, color: l.quality === 'thrive' ? T.ac : l.quality === 'avoid' ? '#F04060' : '#D8A030' }}>
                        {l.quality === 'thrive' ? '▲' : l.quality === 'avoid' ? '▼' : '◆'}
                      </span>
                    </div>
                  ))}
                  {planetCities.length > 0 && <div style={{ padding: '4px 12px 6px 28px', ...F, fontSize: 8, color: T.mu, lineHeight: 1.5 }}>
                    {planetCities.slice(0, 5).map(c => c.name).join(' · ')}{planetCities.length > 5 ? ` +${planetCities.length - 5}` : ''}
                  </div>}
                </div>}
              </div>
            );
          })}

          {/* Zones */}
          <div style={{ ...F, fontSize: 9, fontWeight: 600, color: T.td, letterSpacing: 2, padding: '12px 12px 6px', borderTop: `1px solid ${T.bd}`, marginTop: 2 }}>{t('zones', lang)}</div>
          {[['thrive', t('thriveZone', lang), t('strengthsAmplified', lang)], ['avoid', t('cautionZone', lang), t('challengesLikely', lang)], ['neutral', t('neutral', lang), t('subtleInfluence', lang)]].map(([z, l, d]) => (
            <div key={z} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 12px', ...F, fontSize: 9, color: T.tm }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: COL[z], flexShrink: 0 }} />
              <span>{l}</span>
              <span style={{ fontSize: 7, color: T.mu, marginLeft: 'auto' }}>{d}</span>
            </div>
          ))}

          {/* Top Cities */}
          <div style={{ ...F, fontSize: 9, fontWeight: 600, color: T.td, letterSpacing: 2, padding: '12px 12px 6px', borderTop: `1px solid ${T.bd}`, marginTop: 2 }}>{t('topCities', lang)}</div>
          {bestCities.map((c, i) => (
            <div key={i} onClick={() => { flyTo(c.la, c.lo, c.name); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', cursor: 'pointer', ...F, fontSize: 9 }}>
              <span style={{ color: T.ac, fontWeight: 700, width: 14 }}>{i + 1}.</span>
              <span style={{ color: T.tm }}>{c.name}{CITY_COUNTRY[c.name] ? <span style={{ color: T.mu, fontSize: 7 }}>{' · '}{CITY_COUNTRY[c.name]}</span> : null}</span>
              <span style={{ color: T.mu, marginLeft: 'auto', fontSize: 8 }}>{tLine(c.line, lang)}</span>
            </div>
          ))}
          <div style={{ ...F, fontSize: 8, color: T.bd, padding: '12px', marginTop: 'auto', lineHeight: 1.6 }}>
            {t('dragRotate', lang)}<br />{t('dblClickZoom', lang)}<br />{t('clickCity', lang)}
          </div>
        </div>}

        {/* GLOBE */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: T.bg, cursor: 'grab' }}>
          <Globe lines={visibleLines} citiesOnLines={onLines} allCities={ALL_CITIES} citiesTiers={[CITIES_T1, CITIES_T2, CITIES_T3]} homeLocation={homeLocation} onCityClick={handleCityClick} flat={flatMap} lightMode={lightMode} />

          {/* Map mode toggle — top right */}
          <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 50, display: 'flex', background: T.pop, border: `1px solid ${T.bd}`, borderRadius: 6, overflow: 'hidden', width: 160 }}>
            <button onClick={() => setFlatMap(false)} style={{ ...F, fontSize: 9, fontWeight: 600, padding: '7px 0', border: 'none', cursor: 'pointer', color: !flatMap ? T.ac : T.td, background: !flatMap ? T.acBg : 'transparent', borderRight: `1px solid ${T.bd}`, flex: 1 }}>
              ◉ {t('globe', lang)}
            </button>
            <button onClick={() => setFlatMap(true)} style={{ ...F, fontSize: 9, fontWeight: 600, padding: '7px 0', border: 'none', cursor: 'pointer', color: flatMap ? T.ac : T.td, background: flatMap ? T.acBg : 'transparent', flex: 1 }}>
              ▭ {t('map', lang)}
            </button>
          </div>

          {/* Natal chart button — below map toggle */}
          <div onClick={() => { if (!showNatal) closeAllPopups('natal'); setShowNatal(!showNatal); }} style={{ position: 'absolute', top: 42, right: 8, zIndex: 50, ...F, fontSize: 9, fontWeight: 600, padding: '7px 0', background: showNatal ? 'rgba(0,216,138,.12)' : T.pop, border: `1px solid ${showNatal ? T.acBd : T.bd}`, borderRadius: 6, cursor: 'pointer', color: showNatal ? T.ac : T.td, transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: 160 }}>
            ☉ {t('natalChart', lang)}
          </div>

          {/* Natal chart popup */}
          {showNatal && chartData?.planets && (
            <><div style={{ position: 'absolute', inset: 0, zIndex: 105 }} onClick={() => { setShowNatal(false); setSelectedPlacement(null); setNatalTab('chart'); }} />
            <div style={{ position: 'absolute', top: mob ? 4 : 76, right: mob ? 4 : 8, left: mob ? 4 : 'auto', bottom: mob ? 4 : 'auto', zIndex: 110, width: mob ? 'auto' : 420, maxHeight: mob ? 'auto' : 'calc(100% - 84px)', background: T.pan, border: `1px solid ${T.bd}`, borderRadius: 8, boxShadow: '0 16px 48px rgba(0,0,0,.6)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${T.bd}`, background: T.p, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selectedPlacement && <span onClick={() => setSelectedPlacement(null)} style={{ cursor: 'pointer', ...F, fontSize: 11, color: T.td, marginRight: 4 }}>&larr;</span>}
                  <span style={{ ...F, fontSize: 10, fontWeight: 700, color: T.tx, letterSpacing: 1 }}>{selectedPlacement ? (selectedPlacement.type === 'asc' ? t('ascendant', lang).toUpperCase() : selectedPlacement.type === 'mc' ? t('midheaven', lang).toUpperCase() : tPlanet(selectedPlacement.id, lang).toUpperCase()) : t('natalChartTab', lang)}</span>
                  {!selectedPlacement && chartData.natal && <span style={{ ...F, fontSize: 8, color: T.mu }}>ASC {tSign(chartData.natal.asc?.sign, lang)} {chartData.natal.asc?.deg}° · MC {tSign(chartData.natal.mc?.sign, lang)} {chartData.natal.mc?.deg}°</span>}
                </div>
                <span onClick={() => { setShowNatal(false); setSelectedPlacement(null); setNatalTab('chart'); }} style={{ cursor: 'pointer', ...F, fontSize: 14, color: T.td }}>✕</span>
              </div>

              {/* Tab bar — only when no detail view */}
              {!selectedPlacement && (
                <div style={{ display: 'flex', borderBottom: `1px solid ${T.bd}`, background: T.b, flexShrink: 0 }}>
                  {[{ key: 'chart', label: t('natalChartTab', lang) }, { key: 'planets', label: t('personalityTab', lang) }, { key: 'pdf', label: t('pdfTab', lang) }].map(tb => (
                    <div key={tb.key} onClick={() => setNatalTab(tb.key)} style={{ ...F, fontSize: 9, fontWeight: 600, letterSpacing: 1, padding: '10px 16px', cursor: 'pointer', color: natalTab === tb.key ? T.ac : T.td, borderBottom: natalTab === tb.key ? `2px solid ${T.ac}` : '2px solid transparent', transition: 'all .15s', flex: 1, textAlign: 'center', userSelect: 'none' }}>
                      {tb.label}
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
                  pc = PCOL[p.id] || T.tm;
                  degStr = `${p.deg}° ${tSign(p.sign, lang).slice(0,3)} ${String(p.min).padStart(2,'0')}'${p.retrograde ? ' ℞' : ''}`;
                  houseNum = p.house;
                  signData = p;
                  const nR = window.__natalReadings;
                  signReading = nR?.PLANET_IN_SIGN?.[`${p.id}-${p.sign}`];
                  houseReading = nR?.PLANET_IN_HOUSE?.[`${p.id}-${houseNum}`];
                } else if (sp.type === 'asc') {
                  const a = chartData.natal.asc;
                  pc = '#E8A838';
                  degStr = `${a.deg}° ${tSign(a.sign, lang).slice(0,3)} ${String(a.min).padStart(2,'0')}'`;
                  signData = a;
                  houseNum = null;
                  const nR = window.__natalReadings;
                  signReading = nR?.ASC_IN_SIGN?.[a.sign];
                  houseReading = null;
                } else if (sp.type === 'mc') {
                  const m = chartData.natal.mc;
                  pc = '#E8A838';
                  degStr = `${m.deg}° ${tSign(m.sign, lang).slice(0,3)} ${String(m.min).padStart(2,'0')}'`;
                  signData = m;
                  houseNum = null;
                  const nR = window.__natalReadings;
                  signReading = nR?.MC_IN_SIGN?.[m.sign];
                  houseReading = null;
                }
                const elem = SIGN_ELEMENTS[signData?.sign] || '';
                const titleLabel = sp.type === 'asc' ? t('ascendant', lang) : sp.type === 'mc' ? t('midheaven', lang) : tPlanet(sp.id, lang);
                const nR = window.__natalReadings;
                const houseInfo = houseNum ? nR?.HOUSE_INFO?.[houseNum] : null;
                const planetInfo = sp.type === 'planet' ? nR?.PLANET_INFO?.[sp.id] : null;
                return (
                  <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    {/* Title section */}
                    <div style={{ padding: '20px 18px 16px', borderBottom: `1px solid ${T.bs}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 28, color: pc, lineHeight: 1 }}>{sp.type === 'asc' ? '△' : sp.type === 'mc' ? '▽' : (chartData.planets.find(pl => pl.id === sp.id)?.symbol || '')}</span>
                        <span style={{ fontSize: 28, color: ELEM_COL[elem] || T.td, lineHeight: 1 }}>{SIGN_SYMBOLS[signData?.sign] || ''}</span>
                      </div>
                      <div style={{ ...F, fontSize: 18, fontWeight: 700, color: T.tx, letterSpacing: 0.5, marginBottom: 4 }}>{titleLabel} {t('inThe', lang).toLowerCase()} {tSign(signData?.sign, lang)}</div>
                      <div style={{ ...F, fontSize: 11, color: T.td }}>{degStr}</div>
                      {houseNum && <div style={{ ...F, fontSize: 11, color: pc, marginTop: 4 }}>{titleLabel} {t('inThe', lang).toLowerCase()} {t(`ord${houseNum}`, lang)} {t('houseWord', lang)}</div>}
                    </div>

                    {/* Planet info badge */}
                    {planetInfo && (
                      <div style={{ padding: '10px 18px', borderBottom: `1px solid ${T.bs}`, background: T.a }}>
                        <div style={{ ...F, fontSize: 9, color: T.td, lineHeight: 1.6 }}>{planetInfo.description}</div>
                      </div>
                    )}

                    {/* Sign reading */}
                    {signReading && (
                      <div style={{ padding: '18px 18px 14px' }}>
                        <div style={{ ...F, fontSize: 8, fontWeight: 700, color: T.mu, letterSpacing: 1.5, marginBottom: 10 }}>{sp.type === 'asc' ? t('yourRisingSn', lang) : sp.type === 'mc' ? t('yourMidheaven', lang) : `${tPlanet(sp.id, lang).toUpperCase()} ${t('inThe', lang)} ${tSign(signData?.sign, lang).toUpperCase()}`}</div>
                        <div style={{ fontSize: 13, color: T.tm, lineHeight: 1.85, fontFamily: 'system-ui, -apple-system, sans-serif' }}>{signReading.text}</div>
                      </div>
                    )}

                    {/* House reading */}
                    {houseReading && (
                      <div style={{ padding: '14px 18px 18px', borderTop: `1px solid ${T.bs}` }}>
                        <div style={{ ...F, fontSize: 8, fontWeight: 700, color: T.mu, letterSpacing: 1.5, marginBottom: 10 }}>{tPlanet(sp.id, lang).toUpperCase()} {t('inThe', lang)} {t(`ord${houseNum}`, lang).toUpperCase()} {t('houseWord', lang)}</div>
                        <div style={{ fontSize: 13, color: T.tm, lineHeight: 1.85, fontFamily: 'system-ui, -apple-system, sans-serif' }}>{houseReading.text}</div>
                      </div>
                    )}

                    {/* Details section */}
                    <div style={{ padding: '14px 18px 20px', borderTop: `1px solid ${T.bd}` }}>
                      <div style={{ ...F, fontSize: 8, fontWeight: 700, color: T.mu, letterSpacing: 1.5, marginBottom: 10 }}>{t('details', lang)}</div>
                      {[
                        [t('position', lang), `${signData?.deg}° ${String(signData?.min || 0).padStart(2,'0')}' ${tSign(signData?.sign, lang)}`],
                        houseNum ? [t('house', lang), `${t(`ord${houseNum}`, lang)} ${t('houseWord', lang)}${houseInfo ? ' — ' + houseInfo.keyword : ''}`] : null,
                        [t('element', lang), tElem(elem, lang)],
                        [t('mode', lang), tMode(SIGN_MODES[signData?.sign] || '', lang)],
                        sp.type === 'planet' && chartData.planets.find(pl => pl.id === sp.id)?.retrograde ? [t('motion', lang), t('retrograde', lang)] : null,
                        planetInfo?.rules ? [t('rules', lang), planetInfo.rules] : null,
                      ].filter(Boolean).map(([label, val]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.bs}` }}>
                          <span style={{ ...F, fontSize: 11, fontWeight: 600, color: T.tm }}>{label}</span>
                          <span style={{ ...F, fontSize: 11, color: T.tx }}>{val}</span>
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
                  <div style={{ display: 'flex', padding: '5px 14px', borderBottom: `1px solid ${T.bs}`, background: T.bg, flexShrink: 0 }}>
                    <span style={{ ...F, fontSize: 7, color: T.mu, fontWeight: 700, width: 90, letterSpacing: 1 }}>{t('planet', lang)}</span>
                    <span style={{ ...F, fontSize: 7, color: T.mu, fontWeight: 700, width: 80, letterSpacing: 1 }}>{t('sign', lang)}</span>
                    <span style={{ ...F, fontSize: 7, color: T.mu, fontWeight: 700, width: 60, letterSpacing: 1, textAlign: 'right' }}>{t('degree', lang)}</span>
                    <span style={{ ...F, fontSize: 7, color: T.mu, fontWeight: 700, width: 50, letterSpacing: 1, textAlign: 'center' }}>{t('elem', lang)}</span>
                    <span style={{ ...F, fontSize: 7, color: T.mu, fontWeight: 700, flex: 1, letterSpacing: 1 }}>{t('domain', lang)}</span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {chartData.planets.map((p, i) => {
                      const elem = SIGN_ELEMENTS[p.sign] || '';
                      const mode = SIGN_MODES[p.sign] || '';
                      const pc = PCOL[p.id] || T.tm;
                      const pd = getPlanetDomain(p.id, lang);
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', borderBottom: `1px solid ${T.bs}`, transition: 'background .1s' }} onMouseEnter={e => e.currentTarget.style.background = T.c} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ width: 90, display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ ...F, fontSize: 15, color: pc, lineHeight: 1, width: 18, textAlign: 'center', flexShrink: 0 }}>{p.symbol}</span>
                            <div>
                              <div style={{ ...F, fontSize: 10, color: pc, fontWeight: 600 }}>{tPlanet(p.id, lang)}</div>
                              {p.retrograde && <div style={{ ...F, fontSize: 7, color: '#F04060', fontWeight: 700, letterSpacing: 0.5 }}>{t('retro', lang)}</div>}
                            </div>
                          </div>
                          <div style={{ width: 80, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ ...F, fontSize: 13, color: ELEM_COL[elem] || T.td, lineHeight: 1 }}>{SIGN_SYMBOLS[p.sign] || ''}</span>
                            <span style={{ ...F, fontSize: 9, color: T.tm, fontWeight: 600 }}>{tSign(p.sign, lang)}</span>
                          </div>
                          <div style={{ width: 60, textAlign: 'right' }}>
                            <span style={{ ...F, fontSize: 10, color: T.tx, fontWeight: 600 }}>{p.deg}°</span>
                            <span style={{ ...F, fontSize: 8, color: T.td }}>{String(p.min).padStart(2, '0')}'</span>
                          </div>
                          <div style={{ width: 50, textAlign: 'center' }}>
                            <span style={{ ...F, fontSize: 7, fontWeight: 700, color: ELEM_COL[elem] || T.td, background: (ELEM_COL[elem] || T.td) + '18', padding: '2px 5px', borderRadius: 2 }}>{tElem(elem, lang)}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ ...F, fontSize: 8, color: T.tm }}>{pd?.domain || ''}</div>
                            <div style={{ ...F, fontSize: 7, color: T.mu }}>{tMode(mode, lang)}</div>
                          </div>
                        </div>
                      );
                    })}
                    {chartData.natal && <>
                      <div style={{ ...F, fontSize: 7, fontWeight: 700, color: T.mu, letterSpacing: 1.5, padding: '8px 14px 4px', borderTop: `1px solid ${T.bd}` }}>{t('angles', lang)}</div>
                      {[
                        { label: t('ascendant', lang), short: 'ASC', data: chartData.natal.asc, desc: t('ascDesc', lang) },
                        { label: t('midheaven', lang), short: 'MC', data: chartData.natal.mc, desc: t('mcDesc', lang) },
                      ].map((a, i) => a.data && (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', borderBottom: `1px solid ${T.bs}` }}>
                          <div style={{ width: 90, display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ ...F, fontSize: 15, color: '#E8A838', lineHeight: 1 }}>{a.short === 'ASC' ? '△' : '▽'}</span>
                            <div>
                              <div style={{ ...F, fontSize: 10, color: '#E8A838', fontWeight: 600 }}>{a.label}</div>
                              <div style={{ ...F, fontSize: 7, color: T.td }}>{a.short}</div>
                            </div>
                          </div>
                          <div style={{ width: 80, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ ...F, fontSize: 13, color: ELEM_COL[SIGN_ELEMENTS[a.data.sign]] || T.td, lineHeight: 1 }}>{SIGN_SYMBOLS[a.data.sign] || ''}</span>
                            <span style={{ ...F, fontSize: 9, color: T.tm, fontWeight: 600 }}>{tSign(a.data.sign, lang)}</span>
                          </div>
                          <div style={{ width: 60, textAlign: 'right' }}>
                            <span style={{ ...F, fontSize: 10, color: T.tx, fontWeight: 600 }}>{a.data.deg}°</span>
                            <span style={{ ...F, fontSize: 8, color: T.td }}>{String(a.data.min).padStart(2, '0')}'</span>
                          </div>
                          <div style={{ width: 50, textAlign: 'center' }}>
                            <span style={{ ...F, fontSize: 7, fontWeight: 700, color: ELEM_COL[SIGN_ELEMENTS[a.data.sign]] || T.td, background: (ELEM_COL[SIGN_ELEMENTS[a.data.sign]] || T.td) + '18', padding: '2px 5px', borderRadius: 2 }}>{tElem(SIGN_ELEMENTS[a.data.sign] || '', lang)}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ ...F, fontSize: 8, color: T.tm }}>{a.desc}</div>
                          </div>
                        </div>
                      ))}
                    </>}
                    <div style={{ padding: '8px 14px', borderTop: `1px solid ${T.bd}`, background: T.p, display: 'flex', gap: 12 }}>
                      {[['Fire', t('fire', lang)], ['Earth', t('earth', lang)], ['Air', t('air', lang)], ['Water', t('water', lang)]].map(([el, elLabel]) => {
                        const count = chartData.planets.filter(p => SIGN_ELEMENTS[p.sign] === el).length;
                        return (
                          <div key={el} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 6, height: 6, borderRadius: 1, background: ELEM_COL[el] }} />
                            <span style={{ ...F, fontSize: 8, color: ELEM_COL[el], fontWeight: 600 }}>{elLabel}</span>
                            <span style={{ ...F, fontSize: 9, color: T.tx, fontWeight: 700 }}>{count}</span>
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
                    const pc = PCOL[p.id] || T.tm;
                    return (
                      <div key={i} onClick={() => setSelectedPlacement({ id: p.id, type: 'planet' })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${T.bs}`, cursor: 'pointer', transition: 'background .1s' }} onMouseEnter={e => e.currentTarget.style.background = T.c} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 18, color: pc, lineHeight: 1, width: 22, textAlign: 'center', flexShrink: 0 }}>{p.symbol}</span>
                          <div>
                            <div style={{ ...F, fontSize: 12, fontWeight: 600, color: T.tx }}>{p.id} {t('inThe', lang).toLowerCase()} {p.sign}</div>
                            {p.house && <div style={{ ...F, fontSize: 9, color: T.td, marginTop: 2 }}>{t(`ord${p.house}`, lang)} {t('houseWord', lang)}{p.retrograde ? ' · ' + t('retrograde', lang) : ''}</div>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ ...F, fontSize: 10, color: T.td }}>{p.deg}° {p.sign.slice(0,3)} {String(p.min).padStart(2,'0')}'</span>
                          <span style={{ ...F, fontSize: 12, color: T.mu }}>&rsaquo;</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Angles */}
                  <div style={{ ...F, fontSize: 7, fontWeight: 700, color: T.mu, letterSpacing: 1.5, padding: '12px 18px 6px', borderTop: `1px solid ${T.bd}` }}>{t('angles', lang)}</div>
                  {[
                    { label: t('ascendant', lang), type: 'asc', data: chartData.natal?.asc, symbol: '△' },
                    { label: t('midheaven', lang), type: 'mc', data: chartData.natal?.mc, symbol: '▽' },
                  ].map(a => a.data && (
                    <div key={a.type} onClick={() => setSelectedPlacement({ id: a.label, type: a.type })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${T.bs}`, cursor: 'pointer', transition: 'background .1s' }} onMouseEnter={e => e.currentTarget.style.background = T.c} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 18, color: '#E8A838', lineHeight: 1, width: 22, textAlign: 'center', flexShrink: 0 }}>{a.symbol}</span>
                        <div style={{ ...F, fontSize: 12, fontWeight: 600, color: T.tx }}>{a.label} {t('inThe', lang).toLowerCase()} {a.data.sign}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ ...F, fontSize: 10, color: T.td }}>{a.data.deg}° {a.data.sign.slice(0,3)} {String(a.data.min).padStart(2,'0')}'</span>
                        <span style={{ ...F, fontSize: 12, color: T.mu }}>&rsaquo;</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ═══ PDF TAB — info about what the PDF includes ═══ */}
              {!selectedPlacement && natalTab === 'pdf' && (
                <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px 18px' }}>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>📄</span>
                    <div style={{ ...F, fontSize: 14, fontWeight: 700, color: T.tx, letterSpacing: 1 }}>{t('yourNatalReport', lang)}</div>
                    <div style={{ ...F, fontSize: 10, color: T.td, marginTop: 4 }}>{t('pdfSubtitle', lang)}</div>
                  </div>
                  <div style={{ background: T.c, borderRadius: 8, padding: '14px 16px', marginBottom: 12 }}>
                    <div style={{ ...F, fontSize: 9, fontWeight: 700, color: T.ac, letterSpacing: 1, marginBottom: 10 }}>{t('whatsIncluded', lang)}</div>
                    {[
                      ['☉', t('pdfItem1', lang)],
                      ['♀', t('pdfItem2', lang)],
                      ['△', t('pdfItem3', lang)],
                      ['✦', t('pdfItem4', lang)],
                      ['⚠', t('pdfItem5', lang)],
                      ['◎', t('pdfItem6', lang)],
                      ['✍', t('pdfItem7', lang)],
                    ].map(([icon, text], i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: T.ac, flexShrink: 0, width: 16, textAlign: 'center', lineHeight: '18px' }}>{icon}</span>
                        <span style={{ ...F, fontSize: 10, color: T.tm, lineHeight: 1.6 }}>{text}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: T.c, borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                    <div style={{ ...F, fontSize: 9, fontWeight: 700, color: '#D8A030', letterSpacing: 1, marginBottom: 6 }}>{t('format', lang)}</div>
                    <div style={{ ...F, fontSize: 10, color: T.tm, lineHeight: 1.6 }}>{t('pdfFormat', lang)}</div>
                  </div>
                  <button onClick={handleDownloadPDF} disabled={pdfLoading} style={{ ...F, width: '100%', fontSize: 12, fontWeight: 700, letterSpacing: 1, color: T.bg, background: pdfLoading ? T.td : T.ac, border: 'none', borderRadius: 8, padding: '14px 0', cursor: pdfLoading ? 'default' : 'pointer', transition: 'all .2s' }}>
                    {pdfLoading ? t('generating', lang) : t('downloadPdf', lang)}
                  </button>
                </div>
              )}
            </div>
            </>)}

          {/* Line info popup */}
          {typeof popup === 'number' && lines[popup] && (<>
            <div style={{ position: 'absolute', inset: 0, zIndex: 95 }} onClick={() => setPopup(null)} />
            <div style={{ position: 'absolute', top: mob ? 8 : 50, left: mob ? 8 : 8, right: mob ? 8 : 'auto', width: mob ? 'auto' : 320, background: T.pop, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 16, zIndex: 100, boxShadow: T.sh }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 20, height: 3, borderRadius: 2, background: lines[popup].c }} />
                <span style={{ ...F, fontSize: 13, fontWeight: 700, color: lines[popup].c }}>{tLine(lines[popup].n, lang)}</span>
                <span style={{ ...F, fontSize: 9, color: T.td }}>{lines[popup].angle}</span>
                <span onClick={() => setPopup(null)} style={{ marginLeft: 'auto', cursor: 'pointer', ...F, fontSize: 14, color: T.td }}>✕</span>
              </div>
              <div style={{ fontSize: 13, color: T.tm, lineHeight: 1.8 }}>{lines[popup].desc}</div>
              <div style={{ ...F, fontSize: 9, color: T.mu, marginTop: 10 }}>{t('cities', lang)}: {onLines.filter(c => c.line === lines[popup].n).map(c => c.name).join(' · ')}</div>
            </div>
          </>)}

          {/* City reading popup */}
          {cityPop && (<>
            <div style={{ position: 'absolute', inset: 0, zIndex: 95 }} onClick={() => setCityPop(null)} />
            <div style={{ position: 'absolute', bottom: mob ? 8 : 16, right: mob ? 8 : 16, left: mob ? 8 : 'auto', width: mob ? 'auto' : 340, background: T.pop, border: `1px solid ${cityPop.lc}30`, borderRadius: 8, padding: 16, zIndex: 100, boxShadow: T.sh }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: cityPop.lc }} />
                <span style={{ ...F, fontSize: 14, fontWeight: 700, color: T.tx }}>{cityPop.name}</span>
                <span style={{ ...F, fontSize: 9, fontWeight: 700, color: cityPop.q === 'thrive' ? COL.thrive : cityPop.q === 'avoid' ? COL.avoid : COL.neutral, marginLeft: 'auto' }}>
                  {cityPop.q === 'thrive' ? t('thrive', lang) : cityPop.q === 'avoid' ? t('caution', lang) : t('neutralLabel', lang)}
                </span>
                <span onClick={() => setCityPop(null)} style={{ cursor: 'pointer', ...F, fontSize: 14, color: T.td, marginLeft: 8 }}>✕</span>
              </div>
              <div style={{ ...F, fontSize: 9, color: cityPop.lc, marginBottom: 6 }}>{tLine(cityPop.line, lang)} · {cityPop.dist.toFixed(1)}° {t('fromLine', lang)}</div>
              <div style={{ fontSize: 12, color: T.tm, lineHeight: 1.7 }}>{cityReading(cityPop)}</div>
            </div>
          </>)}

          {/* SETTINGS PANEL */}
          {showSettings && !demo && (() => {
            const tabs = [
              { id: 'profile', label: t('profileTab', lang).replace('◉ ', ''), icon: '◉' },
              { id: 'birth', label: t('birthDataTab', lang).replace('☿ ', ''), icon: '☿' },
              { id: 'account', label: t('accountTab', lang).replace('⛓ ', ''), icon: '⛓' },
            ];
            const [y, m, d] = (profile?.birth_date || '').split('-');
            const dateFmt = y ? `${d}.${m}.${y}` : '—';
            const bt = profile?.birth_time || '';
            const [hh, mi] = bt.split(':').map(Number);
            const h12 = hh % 12 || 12;
            const ampm = hh < 12 ? 'AM' : 'PM';
            const timeFmt = bt ? `${String(hh).padStart(2, '0')}:${String(mi).padStart(2, '0')} (${h12}:${String(mi).padStart(2, '0')} ${ampm})` : '—';

            return (<>
              <div onClick={() => setShowSettings(false)} style={{ position: 'fixed', inset: 0, background: T.ov, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 700, animation: 'fadeIn .2s ease-out' }} />
              <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: mob ? 'calc(100% - 24px)' : 520, maxHeight: mob ? 'calc(100% - 48px)' : '80vh', background: T.p, border: `1px solid ${T.bd}`, borderRadius: 16, zIndex: 710, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: `${T.sh}, 0 0 0 1px rgba(0,216,138,.05)`, animation: 'fadeIn .25s ease-out' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: mob ? '14px 16px' : '18px 24px', borderBottom: `1px solid ${T.bd}`, flexShrink: 0 }}>
                  <div>
                    <div style={{ ...F, fontSize: 11, fontWeight: 700, color: T.tx, letterSpacing: 2 }}>{t('settings', lang)}</div>
                    <div style={{ ...F, fontSize: 9, color: T.td, marginTop: 2 }}>{user?.email}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div onClick={signOut} title="Sign out" style={{ ...F, fontSize: 11, color: '#F04060', cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid #F0406030', background: '#F0406008', transition: 'all .15s' }}>⏻</div>
                    <div onClick={() => setShowSettings(false)} style={{ ...F, fontSize: 14, color: T.td, cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: `1px solid ${T.bd}`, transition: 'all .15s' }}>×</div>
                  </div>
                </div>

                {/* Tab navigation */}
                <div style={{ display: 'flex', padding: mob ? '0 12px' : '0 20px', gap: mob ? 0 : 4, borderBottom: `1px solid ${T.bd}`, flexShrink: 0, overflowX: 'auto' }}>
                  {tabs.map(tb => (
                    <div key={tb.id} onClick={() => { setSettingsTab(tb.id); setEditingName(false); setConfirmDelete(false); }} style={{ ...F, fontSize: mob ? 8 : 9, fontWeight: 600, color: settingsTab === tb.id ? T.ac : T.td, padding: mob ? '10px 8px' : '12px 14px', cursor: 'pointer', borderBottom: settingsTab === tb.id ? `2px solid ${T.ac}` : '2px solid transparent', transition: 'all .15s', whiteSpace: 'nowrap', letterSpacing: 0.5 }}>
                      <span style={{ marginRight: 5, fontSize: mob ? 9 : 10 }}>{tb.icon}</span>{tb.label}
                    </div>
                  ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: mob ? 16 : 24 }}>

                  {/* ── PROFILE TAB ── */}
                  {settingsTab === 'profile' && (<div>
                    {/* Avatar / initials */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg, ${T.acBd}, ${T.acBg})`, border: `2px solid ${T.acBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...F, fontSize: 20, fontWeight: 700, color: T.ac }}>
                        {(displayName || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ ...F, fontSize: 16, fontWeight: 700, color: T.tx }}>{displayName}</div>
                          {isPremium && <div style={{ ...F, fontSize: 7, fontWeight: 700, color: '#E8A838', padding: '2px 6px', borderRadius: 3, background: '#E8A83818', border: '1px solid #E8A83830', letterSpacing: 1 }}>PREMIUM</div>}
                        </div>
                        <div style={{ ...F, fontSize: 10, color: T.td, marginTop: 2 }}>{user?.email}</div>
                      </div>
                    </div>

                    {/* Display name */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ ...F, fontSize: 9, fontWeight: 600, color: T.td, letterSpacing: 1.5, marginBottom: 8 }}>{t('displayName', lang)}</div>
                      {editingName ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input value={nameInput} onChange={e => setNameInput(e.target.value)} maxLength={40} autoFocus style={{ ...F, fontSize: 13, color: T.tx, background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 6, padding: '8px 12px', flex: 1, outline: 'none' }} onKeyDown={e => { if (e.key === 'Enter' && nameInput.trim()) { setSavingName(true); updateDisplayName(nameInput.trim()).then(() => { setEditingName(false); setSavingName(false); }).catch(() => setSavingName(false)); } if (e.key === 'Escape') setEditingName(false); }} />
                          <div onClick={() => { if (nameInput.trim() && !savingName) { setSavingName(true); updateDisplayName(nameInput.trim()).then(() => { setEditingName(false); setSavingName(false); }).catch(() => setSavingName(false)); }}} style={{ ...F, fontSize: 9, color: savingName ? T.mu : T.ac, cursor: savingName ? 'default' : 'pointer', padding: '8px 14px', borderRadius: 6, border: `1px solid ${T.acBd}`, background: T.acBg }}>{savingName ? t('saving', lang) : t('save', lang)}</div>
                          <div onClick={() => setEditingName(false)} style={{ ...F, fontSize: 9, color: T.td, cursor: 'pointer', padding: '8px 10px' }}>{t('cancel', lang)}</div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ ...F, fontSize: 13, color: T.tx, background: T.bg, border: `1px solid ${T.bs}`, borderRadius: 6, padding: '8px 12px', flex: 1 }}>{displayName || '—'}</div>
                          <div onClick={() => { setNameInput(displayName || ''); setEditingName(true); }} style={{ ...F, fontSize: 9, color: T.td, cursor: 'pointer', padding: '8px 14px', borderRadius: 6, border: `1px solid ${T.bd}` }}>{t('edit', lang)}</div>
                        </div>
                      )}
                    </div>

                    {/* Email (read-only) */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ ...F, fontSize: 9, fontWeight: 600, color: T.td, letterSpacing: 1.5, marginBottom: 8 }}>{t('email', lang)}</div>
                      <div style={{ ...F, fontSize: 13, color: T.tm, background: T.bg, border: `1px solid ${T.bs}`, borderRadius: 6, padding: '8px 12px' }}>{user?.email}</div>
                    </div>

                    {/* Member since */}
                    <div>
                      <div style={{ ...F, fontSize: 9, fontWeight: 600, color: T.td, letterSpacing: 1.5, marginBottom: 8 }}>{t('memberSince', lang)}</div>
                      <div style={{ ...F, fontSize: 13, color: T.tm, background: T.bg, border: `1px solid ${T.bs}`, borderRadius: 6, padding: '8px 12px' }}>{user?.created_at ? new Date(user.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}</div>
                    </div>
                  </div>)}

                  {/* ── BIRTH DATA TAB ── */}
                  {settingsTab === 'birth' && (<div>
                    <div style={{ ...F, fontSize: 10, color: T.tm, marginBottom: 20, lineHeight: 1.6 }}>
                      {t('birthDataInfo', lang)}
                    </div>

                    <div style={{ display: 'grid', gap: 16 }}>
                      <div style={{ background: T.bg, border: `1px solid ${T.bs}`, borderRadius: 10, padding: 16 }}>
                        <div style={{ ...F, fontSize: 9, fontWeight: 600, color: T.td, letterSpacing: 1.5, marginBottom: 8 }}>{t('dateOfBirth', lang)}</div>
                        <div style={{ ...F, fontSize: 15, color: T.tx, fontWeight: 600 }}>{dateFmt}</div>
                      </div>

                      <div style={{ background: T.bg, border: `1px solid ${T.bs}`, borderRadius: 10, padding: 16 }}>
                        <div style={{ ...F, fontSize: 9, fontWeight: 600, color: T.td, letterSpacing: 1.5, marginBottom: 8 }}>{t('timeOfBirth', lang)}</div>
                        <div style={{ ...F, fontSize: 15, color: T.tx, fontWeight: 600 }}>{timeFmt}</div>
                        <div style={{ ...F, fontSize: 9, color: T.mu, marginTop: 4 }}>{t('timePrecision', lang)}</div>
                      </div>

                      <div style={{ background: T.bg, border: `1px solid ${T.bs}`, borderRadius: 10, padding: 16 }}>
                        <div style={{ ...F, fontSize: 9, fontWeight: 600, color: T.td, letterSpacing: 1.5, marginBottom: 8 }}>{t('birthLocation', lang)}</div>
                        <div style={{ ...F, fontSize: 15, color: T.tx, fontWeight: 600 }}>{profile?.birth_city || '—'}</div>
                        <div style={{ ...F, fontSize: 9, color: T.mu, marginTop: 4 }}>
                          {profile?.birth_lat != null ? `${Math.abs(profile.birth_lat).toFixed(4)}°${profile.birth_lat >= 0 ? 'N' : 'S'} · ${Math.abs(profile.birth_lng).toFixed(4)}°${profile.birth_lng >= 0 ? 'E' : 'W'}` : '—'}
                        </div>
                      </div>
                    </div>

                    <div onClick={() => { setShowSettings(false); navigate('/birth-data', { state: { edit: true } }); }} style={{ ...F, fontSize: 10, fontWeight: 600, color: T.ac, cursor: 'pointer', padding: '12px 0', marginTop: 20, textAlign: 'center', border: `1px solid ${T.acBd}`, borderRadius: 8, background: T.acBg, letterSpacing: 1 }}>
                      {t('editBirthData', lang)}
                    </div>
                  </div>)}

                  {/* ── ACCOUNT TAB ── */}
                  {settingsTab === 'account' && (<div>
                    {/* Premium status */}
                    <div style={{ background: isPremium ? T.acBg : '#E8A83808', border: `1px solid ${isPremium ? T.acBd : '#E8A83820'}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ ...F, fontSize: 11, fontWeight: 600, color: T.tx }}>{t('plan', lang)}</div>
                            <div style={{ ...F, fontSize: 8, fontWeight: 700, color: isPremium ? T.ac : '#E8A838', padding: '2px 8px', borderRadius: 4, background: isPremium ? T.acBg : '#E8A83818', border: `1px solid ${isPremium ? T.acBd : '#E8A83830'}`, letterSpacing: 1 }}>{isPremium ? t('premiumBadge', lang) : t('freeBadge', lang)}</div>
                          </div>
                          <div style={{ ...F, fontSize: 9, color: T.td, marginTop: 3 }}>{isPremium ? t('fullAccess', lang) : t('upgradeUnlock', lang)}</div>
                        </div>
                        {!isPremium && (
                          <div onClick={handleUpgrade} style={{ ...F, fontSize: 9, fontWeight: 600, color: '#E8A838', cursor: upgradeLoading ? 'default' : 'pointer', padding: '8px 18px', borderRadius: 6, border: '1px solid #E8A83840', background: '#E8A83810', letterSpacing: 0.5 }}>{upgradeLoading ? '...' : t('upgrade', lang)}</div>
                        )}
                      </div>
                    </div>

                    {/* Sign out */}
                    <div style={{ background: T.bg, border: `1px solid ${T.bs}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ ...F, fontSize: 11, fontWeight: 600, color: T.tx }}>{t('signOutHeading', lang)}</div>
                          <div style={{ ...F, fontSize: 9, color: T.td, marginTop: 3 }}>{t('signOutDesc', lang)}</div>
                        </div>
                        <div onClick={signOut} style={{ ...F, fontSize: 9, fontWeight: 600, color: '#F04060', cursor: 'pointer', padding: '8px 18px', borderRadius: 6, border: '1px solid #F0406040', background: '#F0406010', letterSpacing: 0.5 }}>{t('signOutBtn', lang)}</div>
                      </div>
                    </div>

                    {/* Danger zone */}
                    <div style={{ borderTop: '1px solid #F0406020', paddingTop: 20, marginTop: 8 }}>
                      <div style={{ ...F, fontSize: 9, fontWeight: 600, color: '#F04060', letterSpacing: 1.5, marginBottom: 12 }}>{t('dangerZone', lang)}</div>
                      <div style={{ background: '#F0406008', border: '1px solid #F0406020', borderRadius: 10, padding: 16 }}>
                        <div style={{ ...F, fontSize: 11, fontWeight: 600, color: T.tx, marginBottom: 4 }}>{t('deleteAccount', lang)}</div>
                        <div style={{ ...F, fontSize: 9, color: T.tm, lineHeight: 1.6, marginBottom: 14 }}>
                          {t('deleteDesc', lang)}
                        </div>
                        {!confirmDelete ? (
                          <div onClick={() => setConfirmDelete(true)} style={{ ...F, fontSize: 9, fontWeight: 600, color: '#F04060', cursor: 'pointer', padding: '8px 18px', borderRadius: 6, border: '1px solid #F0406040', background: 'transparent', display: 'inline-block', letterSpacing: 0.5 }}>{t('deleteBtn', lang)}</div>
                        ) : (
                          <div style={{ background: '#F0406010', border: '1px solid #F0406030', borderRadius: 8, padding: 14 }}>
                            <div style={{ ...F, fontSize: 10, color: '#F04060', fontWeight: 600, marginBottom: 10 }}>{t('deleteConfirm', lang)}</div>
                            <div style={{ display: 'flex', gap: 10 }}>
                              <div onClick={() => { deleteAccount(); }} style={{ ...F, fontSize: 9, fontWeight: 600, color: '#fff', cursor: 'pointer', padding: '8px 18px', borderRadius: 6, background: '#F04060', letterSpacing: 0.5 }}>{t('deleteYes', lang)}</div>
                              <div onClick={() => setConfirmDelete(false)} style={{ ...F, fontSize: 9, color: T.td, cursor: 'pointer', padding: '8px 14px', borderRadius: 6, border: `1px solid ${T.bd}` }}>{t('cancel', lang)}</div>
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
              { id: 'overview', label: t('guideOverview', lang), color: T.ac },
              { id: 'lines', label: t('guideLines', lang), color: '#5BA8D4' },
              { id: 'planets', label: t('guidePlanets', lang), color: '#D4729A' },
              { id: 'zones', label: t('guideZones', lang), color: '#E8A838' },
              { id: 'usage', label: t('guideHowTo', lang), color: '#8068C0' },
              { id: 'faq', label: t('guideFaq', lang), color: '#40B0A0' },
            ];
            const gt = guideTab;
            const cur = TABS[gt];
            const hasNext = gt < TABS.length - 1;
            const hasPrev = gt > 0;
            return (
            <div style={{ position: 'absolute', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.ov, backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }} onClick={() => setShowGuide(false)}>
              <div onClick={e => e.stopPropagation()} style={{ background: T.p, border: `1px solid ${T.bd}`, borderRadius: 10, width: mob ? 'calc(100% - 24px)' : 620, maxWidth: 660, maxHeight: mob ? 'calc(100% - 24px)' : 'calc(100% - 48px)', boxShadow: T.sh, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: `1px solid ${T.bd}`, background: T.bg, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ ...F, fontSize: 12, fontWeight: 700, color: T.ac, letterSpacing: 2 }}>{t('systemGuide', lang)}</span>
                    <span style={{ ...F, fontSize: 8, color: T.mu }}>{gt + 1}/{TABS.length}</span>
                  </div>
                  <span onClick={() => setShowGuide(false)} style={{ cursor: 'pointer', ...F, fontSize: 16, color: T.td, lineHeight: 1 }}>✕</span>
                </div>

                {/* Tab bar */}
                <div style={{ display: 'flex', borderBottom: `1px solid ${T.bd}`, background: T.b, flexShrink: 0, overflowX: 'auto' }}>
                  {TABS.map((tb, i) => (
                    <button key={tb.id} onClick={() => setGuideTab(i)} style={{
                      ...F, fontSize: mob ? 7 : 8, fontWeight: 700, letterSpacing: 1,
                      padding: mob ? '8px 8px' : '9px 14px', border: 'none', cursor: 'pointer',
                      color: i === gt ? tb.color : T.mu,
                      background: i === gt ? tb.color + '12' : 'transparent',
                      borderBottom: i === gt ? `2px solid ${tb.color}` : '2px solid transparent',
                      whiteSpace: 'nowrap', flex: mob ? 1 : 'none',
                    }}>{tb.label}</button>
                  ))}
                </div>

                {/* Content */}
                <div ref={guideContentRef} style={{ flex: 1, overflowY: 'auto', padding: mob ? 16 : 24 }}>

                  {/* TAB 0: Overview */}
                  {gt === 0 && <>
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ ...F, fontSize: 9, fontWeight: 700, color: T.ac, letterSpacing: 2, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 16, height: 1, background: T.ac }} />{t('whatIsNN', lang)}
                      </div>
                      <div style={{ fontSize: 13, color: T.tm, lineHeight: 1.8 }}>
                        {t('whatIsNNBody', lang)}
                      </div>
                    </div>
                    <div style={{ width: '100%', height: 1, background: T.bd, marginBottom: 24 }} />
                    <div>
                      <div style={{ ...F, fontSize: 9, fontWeight: 700, color: '#E8A838', letterSpacing: 2, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 16, height: 1, background: '#E8A838' }} />{t('whatIsAstro', lang)}
                      </div>
                      <div style={{ fontSize: 13, color: T.tm, lineHeight: 1.8, marginBottom: 12 }}>
                        {t('whatIsAstroBody1', lang)}
                      </div>
                      <div style={{ fontSize: 13, color: T.tm, lineHeight: 1.8 }}>
                        {t('whatIsAstroBody2', lang)}
                      </div>
                    </div>
                  </>}

                  {/* TAB 1: Lines */}
                  {gt === 1 && <>
                    <div style={{ ...F, fontSize: 9, fontWeight: 700, color: '#5BA8D4', letterSpacing: 2, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 16, height: 1, background: '#5BA8D4' }} />{t('fourLineTypes', lang)}
                    </div>
                    <div style={{ fontSize: 12, color: T.tm, lineHeight: 1.7, marginBottom: 16 }}>
                      {t('fourLineTypesIntro', lang)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 10 }}>
                      {[
                        { angle: 'MC', label: t('mcLine', lang), dash: '', desc: t('mcLineDesc', lang) },
                        { angle: 'IC', label: t('icLine', lang), dash: '4,3', desc: t('icLineDesc', lang) },
                        { angle: 'ASC', label: t('ascLine', lang), dash: '8,3', desc: t('ascLineDesc', lang) },
                        { angle: 'DC', label: t('dcLine', lang), dash: '2,2', desc: t('dcLineDesc', lang) },
                      ].map(a => (
                        <div key={a.angle} style={{ background: T.d, border: `1px solid ${T.bs}`, borderRadius: 6, padding: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke={T.tm} strokeWidth="2" strokeDasharray={a.dash || undefined} /></svg>
                            <span style={{ ...F, fontSize: 12, fontWeight: 700, color: T.tx }}>{a.angle}</span>
                            <span style={{ ...F, fontSize: 8, color: T.td }}>{a.label}</span>
                          </div>
                          <div style={{ fontSize: 11, color: T.tm, lineHeight: 1.7 }}>{a.desc}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ ...F, fontSize: 8, color: T.mu, lineHeight: 1.6, marginTop: 14, padding: '10px 12px', background: T.d, borderRadius: 5, border: `1px solid ${T.bs}` }}>
                      {t('lineFootnote', lang)}
                    </div>
                  </>}

                  {/* TAB 2: Planets */}
                  {gt === 2 && <>
                    <div style={{ ...F, fontSize: 9, fontWeight: 700, color: '#D4729A', letterSpacing: 2, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 16, height: 1, background: '#D4729A' }} />{t('planetaryEnergies', lang)}
                    </div>
                    <div style={{ fontSize: 12, color: T.tm, lineHeight: 1.7, marginBottom: 16 }}>
                      {t('planetaryEnergiesIntro', lang)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 1, background: T.bs, borderRadius: 6, overflow: 'hidden', border: `1px solid ${T.bs}` }}>
                      {Object.keys(PLANET_ICONS).map(planet => {
                        const pd = getPlanetDomain(planet, lang);
                        return (
                        <div key={planet} style={{ background: T.p, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 18, color: PCOL[planet], lineHeight: 1, width: 24, textAlign: 'center' }}>{pd.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ ...F, fontSize: 11, fontWeight: 700, color: PCOL[planet] }}>{tPlanet(planet, lang)}</div>
                            <div style={{ ...F, fontSize: 8, color: T.td, marginTop: 1 }}>{pd.domain}</div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </>}

                  {/* TAB 3: Zones */}
                  {gt === 3 && <>
                    <div style={{ ...F, fontSize: 9, fontWeight: 700, color: '#E8A838', letterSpacing: 2, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 16, height: 1, background: '#E8A838' }} />{t('zoneClassification', lang)}
                    </div>
                    <div style={{ fontSize: 12, color: T.tm, lineHeight: 1.7, marginBottom: 16 }}>
                      {t('zoneClassificationIntro', lang)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { zone: t('thriveZone', lang).toUpperCase(), color: T.ac, sym: '▲', desc: t('thriveZoneDesc', lang) },
                        { zone: t('neutral', lang).toUpperCase(), color: '#D8A030', sym: '◆', desc: t('neutralZoneDesc', lang) },
                        { zone: t('cautionZone', lang).toUpperCase(), color: '#F04060', sym: '▼', desc: t('cautionZoneDesc', lang) },
                      ].map(z => (
                        <div key={z.zone} style={{ background: T.d, border: `1px solid ${z.color}20`, borderRadius: 6, padding: 14, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                          <div style={{ ...F, fontSize: 16, color: z.color, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{z.sym}</div>
                          <div>
                            <div style={{ ...F, fontSize: 11, fontWeight: 700, color: z.color, letterSpacing: 1, marginBottom: 5 }}>{z.zone}</div>
                            <div style={{ fontSize: 12, color: T.tm, lineHeight: 1.7 }}>{z.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>}

                  {/* TAB 4: How to Use */}
                  {gt === 4 && <>
                    <div style={{ ...F, fontSize: 9, fontWeight: 700, color: '#8068C0', letterSpacing: 2, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 16, height: 1, background: '#8068C0' }} />{t('howToUse', lang)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: T.bs, borderRadius: 6, overflow: 'hidden', border: `1px solid ${T.bs}` }}>
                      {[
                        { step: '01', title: t('step1', lang), desc: t('step1Desc', lang) },
                        { step: '02', title: t('step2', lang), desc: t('step2Desc', lang) },
                        { step: '03', title: t('step3', lang), desc: t('step3Desc', lang) },
                        { step: '04', title: t('step4', lang), desc: t('step4Desc', lang) },
                        { step: '05', title: t('step5', lang), desc: t('step5Desc', lang) },
                      ].map(s => (
                        <div key={s.step} style={{ background: T.p, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                          <span style={{ ...F, fontSize: 20, fontWeight: 700, color: '#8068C040', lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{s.step}</span>
                          <div>
                            <div style={{ ...F, fontSize: 11, fontWeight: 700, color: T.tx, marginBottom: 4 }}>{s.title}</div>
                            <div style={{ fontSize: 12, color: T.tm, lineHeight: 1.7 }}>{s.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>}

                  {/* TAB 5: FAQ */}
                  {gt === 5 && <>
                    <div style={{ ...F, fontSize: 9, fontWeight: 700, color: '#40B0A0', letterSpacing: 2, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 16, height: 1, background: '#40B0A0' }} />{t('faqTitle', lang)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: T.bs, borderRadius: 6, overflow: 'hidden', border: `1px solid ${T.bs}` }}>
                      {[
                        { q: t('faq1Q', lang), a: t('faq1A', lang) },
                        { q: t('faq2Q', lang), a: t('faq2A', lang) },
                        { q: t('faq3Q', lang), a: t('faq3A', lang) },
                        { q: t('faq4Q', lang), a: t('faq4A', lang) },
                        { q: t('faq5Q', lang), a: t('faq5A', lang) },
                      ].map((faq, i) => (
                        <div key={i} style={{ background: T.p, padding: '14px 16px' }}>
                          <div style={{ ...F, fontSize: 11, fontWeight: 700, color: T.tm, marginBottom: 6, display: 'flex', gap: 8 }}>
                            <span style={{ color: '#40B0A0', flexShrink: 0 }}>Q</span>{faq.q}
                          </div>
                          <div style={{ fontSize: 12, color: T.td, lineHeight: 1.7, paddingLeft: 20 }}>{faq.a}</div>
                        </div>
                      ))}
                    </div>
                  </>}
                </div>

                {/* Bottom navigation */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderTop: `1px solid ${T.bd}`, background: T.bg, flexShrink: 0 }}>
                  {hasPrev ? (
                    <div onClick={() => setGuideTab(gt - 1)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <span style={{ ...F, fontSize: 12, color: T.td }}>←</span>
                      <span style={{ ...F, fontSize: 9, color: T.td }}>{TABS[gt - 1].label}</span>
                    </div>
                  ) : <div />}
                  {hasNext ? (
                    <div onClick={() => setGuideTab(gt + 1)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: TABS[gt + 1].color + '12', border: `1px solid ${TABS[gt + 1].color}30`, borderRadius: 5, padding: '6px 14px' }}>
                      <span style={{ ...F, fontSize: 9, color: TABS[gt + 1].color, fontWeight: 600 }}>{TABS[gt + 1].label}</span>
                      <span style={{ ...F, fontSize: 12, color: TABS[gt + 1].color }}>→</span>
                    </div>
                  ) : (
                    <div onClick={() => setShowGuide(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: T.acBg, border: `1px solid ${T.acBd}`, borderRadius: 5, padding: '6px 14px' }}>
                      <span style={{ ...F, fontSize: 9, color: T.ac, fontWeight: 600 }}>{t('startExploring', lang)}</span>
                      <span style={{ ...F, fontSize: 12, color: T.ac }}>→</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );})()}

          {/* Demo gate popup */}
          {showDemoGate && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.ov, backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} onClick={() => setShowDemoGate(false)}>
              <div onClick={e => e.stopPropagation()} style={{ background: T.p, border: `1px solid ${T.bd}`, borderRadius: 12, padding: mob ? 24 : 32, width: mob ? 'calc(100% - 40px)' : 380, maxWidth: 380, boxShadow: T.sh, textAlign: 'center', position: 'relative' }}>
                <span onClick={() => setShowDemoGate(false)} style={{ position: 'absolute', top: 12, right: 14, cursor: 'pointer', ...F, fontSize: 16, color: T.td, lineHeight: 1, zIndex: 1 }}>✕</span>
                <div style={{ ...F, fontSize: 14, fontWeight: 700, color: T.ac, letterSpacing: 2, marginBottom: 12 }}>{t('discoverChart', lang)}</div>
                <div style={{ fontSize: 13, color: T.tm, lineHeight: 1.7, marginBottom: 24 }}>
                  {t('demoViewing', lang).replace('{name}', DEMO.name)}<br />
                  {t('demoSignup', lang)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={() => navigate('/auth')} style={{ ...F, fontSize: 12, fontWeight: 700, color: T.bg, background: T.ac, border: 'none', borderRadius: 6, padding: '12px 0', cursor: 'pointer', letterSpacing: 1, width: '100%' }}>
                    {t('createMyChart', lang)}
                  </button>
                  <button onClick={() => navigate('/auth')} style={{ ...F, fontSize: 11, color: T.tm, background: 'transparent', border: `1px solid ${T.bd}`, borderRadius: 6, padding: '10px 0', cursor: 'pointer', width: '100%' }}>
                    {t('alreadyAccount', lang)}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile legend toggle */}
          {mob && <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 50 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <div onClick={() => { if (popup !== 'leg') { closeAllPopups('popup'); setPopup('leg'); } else setPopup(null); }} style={{ ...F, fontSize: 9, color: popup === 'leg' ? T.ac : T.tm, background: T.pop, border: `1px solid ${popup === 'leg' ? T.acBd : T.bd}`, borderRadius: 4, padding: '6px 10px', cursor: 'pointer' }}>☰ {t('mobilePlanets', lang)}</div>
              <div onClick={() => { if (!showAngleInfo) { closeAllPopups('angle'); setShowAngleInfo(true); } else setShowAngleInfo(false); }} style={{ ...F, fontSize: 9, color: showAngleInfo ? T.ac : T.td, background: T.pop, border: `1px solid ${T.bd}`, borderRadius: 4, padding: '6px 8px', cursor: 'pointer' }}>?</div>
            </div>
            {popup === 'leg' && <><div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => setPopup(null)} /><div style={{ position: 'relative', zIndex: 56, background: T.pop, border: `1px solid ${T.bd}`, borderRadius: 6, padding: 10, marginTop: 4, minWidth: 220, maxHeight: '60vh', overflowY: 'auto' }}>
              {hiddenPlanets.size > 0 && <div onClick={() => setHiddenPlanets(new Set())} style={{ ...F, fontSize: 8, color: T.ac, cursor: 'pointer', padding: '4px 8px', marginBottom: 6, borderRadius: 3, border: `1px solid ${T.acBd}`, background: T.acBg, textAlign: 'center' }}>{t('allOn', lang)}</div>}
              {planetGroups.map(g => {
                const isHid = hiddenPlanets.has(g.planet);
                return (
                <div key={g.planet} style={{ marginBottom: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px' }}>
                    <div onClick={e => { e.stopPropagation(); togglePlanet(g.planet); }} style={{ width: 28, height: 18, borderRadius: 9, background: isHid ? T.bd : g.color + '35', border: `1px solid ${isHid ? '#2A3848' : g.color + '60'}`, cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'all .15s' }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: isHid ? T.mu : g.color, position: 'absolute', top: 2, left: isHid ? 2 : 12, transition: 'all .15s' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, cursor: 'pointer', opacity: isHid ? 0.4 : 1, transition: 'opacity .15s' }} onClick={e => { e.stopPropagation(); setExpandedPlanet(expandedPlanet === g.planet ? null : g.planet); }}>
                      <span style={{ fontSize: 14 }}>{g.symbol}</span>
                      <span style={{ ...F, fontSize: 10, color: T.tm, fontWeight: 600 }}>{tPlanet(g.planet, lang)}</span>
                      <div style={{ display: 'flex', gap: 3, marginLeft: 'auto' }}>
                        {g.lines.map(l => (
                          <span key={l.angle} style={{ ...F, fontSize: 6, color: l.quality === 'thrive' ? T.ac : l.quality === 'avoid' ? '#F04060' : '#D8A030', background: (l.quality === 'thrive' ? T.ac : l.quality === 'avoid' ? '#F04060' : '#D8A030') + '15', padding: '1px 3px', borderRadius: 2 }}>{l.angle}</span>
                        ))}
                      </div>
                      <span style={{ ...F, fontSize: 11, color: T.mu, transform: expandedPlanet === g.planet ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .15s' }}>›</span>
                    </div>
                  </div>
                  {expandedPlanet === g.planet && g.lines.map((l, li) => (
                    <div key={li} onClick={e => { e.stopPropagation(); setPopup(lines.indexOf(l)); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 4px 5px 40px', cursor: 'pointer', borderBottom: `1px solid ${T.bs}` }}>
                      <svg width="16" height="4" style={{ flexShrink: 0 }}>
                        {l.angle === 'MC' && <line x1="0" y1="2" x2="16" y2="2" stroke={l.c} strokeWidth="2" />}
                        {l.angle === 'IC' && <line x1="0" y1="2" x2="16" y2="2" stroke={l.c} strokeWidth="2" strokeDasharray="3,2" />}
                        {l.angle === 'ASC' && <line x1="0" y1="2" x2="16" y2="2" stroke={l.c} strokeWidth="2" strokeDasharray="6,2" />}
                        {l.angle === 'DC' && <line x1="0" y1="2" x2="16" y2="2" stroke={l.c} strokeWidth="2" strokeDasharray="1.5,1.5" />}
                      </svg>
                      <span style={{ ...F, fontSize: 9, color: T.tm }}>{l.angle}</span>
                      <span style={{ ...F, fontSize: 7, color: l.quality === 'thrive' ? T.ac : l.quality === 'avoid' ? '#F04060' : '#D8A030' }}>
                        {l.quality === 'thrive' ? '▲' : l.quality === 'avoid' ? '▼' : '◆'}
                      </span>
                    </div>
                  ))}
                </div>
              )})}
            </div></>}
            {/* Mobile angle info */}
            {showAngleInfo && <><div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => setShowAngleInfo(false)} /><div style={{ position: 'relative', zIndex: 56, background: T.pop, border: `1px solid ${T.bd}`, borderRadius: 6, padding: 12, marginTop: 4, minWidth: 260, maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ ...F, fontSize: 9, fontWeight: 700, color: T.tm }}>{t('lineTypes', lang)}</span>
                <span onClick={() => setShowAngleInfo(false)} style={{ ...F, fontSize: 14, color: T.td, cursor: 'pointer' }}>✕</span>
              </div>
              {ANGLE_ORDER.map(a => (
                  <div key={a} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${T.bs}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <svg width="16" height="4">
                        {a === 'MC' && <line x1="0" y1="2" x2="16" y2="2" stroke={T.tm} strokeWidth="2" />}
                        {a === 'IC' && <line x1="0" y1="2" x2="16" y2="2" stroke={T.tm} strokeWidth="2" strokeDasharray="4,3" />}
                        {a === 'ASC' && <line x1="0" y1="2" x2="16" y2="2" stroke={T.tm} strokeWidth="2" strokeDasharray="8,3" />}
                        {a === 'DC' && <line x1="0" y1="2" x2="16" y2="2" stroke={T.tm} strokeWidth="2" strokeDasharray="2,2" />}
                      </svg>
                      <span style={{ ...F, fontSize: 10, fontWeight: 700, color: T.tx }}>{a}</span>
                      <span style={{ ...F, fontSize: 7, color: T.td }}>{t(`${a.toLowerCase()}Full`, lang)}</span>
                    </div>
                    <div style={{ fontSize: 10, color: T.tm, lineHeight: 1.5, marginLeft: 22 }}>{t(`${a.toLowerCase()}AngleDesc`, lang)}</div>
                  </div>
              ))}
            </div></>}
          </div>}
        </div>
      </div>

      {/* BOTTOM PANEL — Bloomberg-style */}
      <div style={{ minHeight: mob ? 200 : 240, maxHeight: mob ? 200 : 240, background: T.p, borderTop: `1px solid ${T.bd}`, display: 'flex', flexShrink: 0, zIndex: 200, overflow: 'hidden', minWidth: 0 }}>
        {/* Left: City table */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${T.bs}`, flexShrink: 0 }}>
            {[
              { id: 'thrive', label: t('thriveTab', lang), count: thriveC.length, col: COL.thrive },
              { id: 'neutral', label: t('neutralTab', lang), count: neutralC.length, col: COL.neutral },
              { id: 'avoid', label: t('avoidTab', lang), count: avoidC.length, col: COL.avoid },
              { id: 'all', label: t('allTab', lang), count: onLines.length, col: T.tm },
            ].map(tb => (
              <button key={tb.id} onClick={() => setTab(tb.id)} style={{
                flex: 1, background: tab === tb.id ? T.c : 'transparent', border: 'none',
                borderBottom: tab === tb.id ? `2px solid ${tb.col}` : '2px solid transparent',
                color: tab === tb.id ? tb.col : T.mu,
                cursor: 'pointer', padding: mob ? '5px 0' : '6px 0', ...F, fontSize: mob ? 8 : 9, fontWeight: 700, letterSpacing: 1
              }}>
                {tb.label} ({tb.count})
              </button>
            ))}
          </div>

          {/* Column headers */}
          {!mob && <div style={{ display: 'flex', padding: '4px 12px', borderBottom: `1px solid ${T.bs}`, flexShrink: 0, background: T.bg }}>
            <span style={{ ...F, fontSize: 7, color: T.mu, fontWeight: 700, width: 130, letterSpacing: 1 }}>{t('city', lang)}</span>
            <span style={{ ...F, fontSize: 7, color: T.mu, fontWeight: 700, width: 100, letterSpacing: 1 }}>{t('line', lang)}</span>
            <span style={{ ...F, fontSize: 7, color: T.mu, fontWeight: 700, width: 60, letterSpacing: 1, textAlign: 'center' }}>{t('signal', lang)}</span>
            <span style={{ ...F, fontSize: 7, color: T.mu, fontWeight: 700, width: 130, letterSpacing: 1 }}>{t('domain', lang)}</span>
            <span style={{ ...F, fontSize: 7, color: T.mu, fontWeight: 700, width: 110, letterSpacing: 1 }}>{t('lifeArea', lang)}</span>
            <span style={{ ...F, fontSize: 7, color: T.mu, fontWeight: 700, flex: 1, letterSpacing: 1 }}>{t('reading', lang)}</span>
          </div>}

          {/* City rows */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredTab.map((c, i) => {
              const imp = cityImpact(c, lang);
              const qCol = c.q === 'thrive' ? COL.thrive : c.q === 'avoid' ? COL.avoid : COL.neutral;
              return mob ? (
                <div key={i} onClick={() => { handleCityClick(c); flyTo(c.la, c.lo, c.name); }} style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bs}`, cursor: 'pointer', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, minWidth: 0 }}>
                    <div style={{ width: 3, height: 18, borderRadius: 1, background: c.lc, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.tx, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flexShrink: 1 }}>{c.name}{CITY_COUNTRY[c.name] ? <span style={{ fontWeight: 400, color: T.mu, fontSize: 9 }}>{' · '}{CITY_COUNTRY[c.name]}</span> : null}</span>
                    <span style={{ ...F, fontSize: 7, color: c.lc, background: c.lc + '15', padding: '1px 5px', borderRadius: 2, flexShrink: 0, whiteSpace: 'nowrap' }}>{tLine(c.line, lang)}</span>
                    <span style={{ ...F, fontSize: 7, color: qCol, marginLeft: 'auto', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>{imp.strengthPct}%</span>
                  </div>
                  <div style={{ ...F, fontSize: 8, color: T.td, lineHeight: 1.4, marginLeft: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{imp.domain} → {imp.area}</div>
                </div>
              ) : (
                <div key={i} onClick={() => { handleCityClick(c); flyTo(c.la, c.lo, c.name); }} style={{ display: 'flex', alignItems: 'center', padding: '5px 12px', borderBottom: `1px solid ${T.bs}`, cursor: 'pointer', transition: 'background .1s' }} onMouseEnter={e => e.currentTarget.style.background = T.c} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {/* City */}
                  <div style={{ width: 130, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <div style={{ width: 3, height: 24, borderRadius: 1, background: c.lc, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.tx, lineHeight: 1.2 }}>{c.name}</div>
                      <div style={{ ...F, fontSize: 7, color: T.mu }}>{CITY_COUNTRY[c.name] || `${c.la.toFixed(1)}° ${c.la >= 0 ? 'N' : 'S'}, ${c.lo.toFixed(1)}° ${c.lo >= 0 ? 'E' : 'W'}`}</div>
                    </div>
                  </div>
                  {/* Line */}
                  <div style={{ width: 100, flexShrink: 0 }}>
                    <span style={{ ...F, fontSize: 9, color: c.lc, fontWeight: 600 }}>{imp.icon} {tLine(c.line, lang)}</span>
                    <div style={{ ...F, fontSize: 7, color: T.mu }}>{c.dist.toFixed(1)}° orb</div>
                  </div>
                  {/* Signal strength */}
                  <div style={{ width: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ ...F, fontSize: 8, fontWeight: 700, color: qCol }}>{imp.strengthPct}%</span>
                    <div style={{ width: 36, height: 3, background: T.bs, borderRadius: 2, marginTop: 2 }}>
                      <div style={{ width: `${imp.strengthPct}%`, height: '100%', background: qCol, borderRadius: 2 }} />
                    </div>
                    <span style={{ ...F, fontSize: 6, color: T.mu, marginTop: 1 }}>{imp.strength}</span>
                  </div>
                  {/* Domain */}
                  <div style={{ width: 130, flexShrink: 0 }}>
                    <div style={{ ...F, fontSize: 8, color: T.tm }}>{imp.domain}</div>
                  </div>
                  {/* Life area */}
                  <div style={{ width: 110, flexShrink: 0 }}>
                    <span style={{ ...F, fontSize: 8, color: qCol, fontWeight: 600 }}>{imp.area}</span>
                  </div>
                  {/* Reading */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...F, fontSize: 8, color: T.tm, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{imp.summary}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Lines summary — desktop only */}
        {!mob && <div style={{ width: 260, minWidth: 260, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: `1px solid ${T.bd}` }}>
          <div style={{ ...F, fontSize: 9, fontWeight: 600, color: T.td, letterSpacing: 1.5, padding: '8px 12px', borderBottom: `1px solid ${T.bs}`, background: T.bg }}>
            {t('onYourLines', lang)} — {onLines.length} {t('cities', lang)}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '2px 0' }}>
            {visibleLines.map((l, i) => {
              const cities = onLines.filter(c => c.line === l.n);
              if (!cities.length) return null;
              const qCol = l.quality === 'thrive' ? COL.thrive : l.quality === 'avoid' ? COL.avoid : COL.neutral;
              return (
                <div key={i} style={{ padding: '3px 12px', borderBottom: `1px solid ${T.bs}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <div style={{ width: 10, height: 2, background: l.c, borderRadius: 1, flexShrink: 0 }} />
                    <span style={{ ...F, fontSize: 8, color: T.tm, fontWeight: 600 }}>{l.n}</span>
                    <span style={{ ...F, fontSize: 6, color: qCol, fontWeight: 700, marginLeft: 'auto' }}>{l.quality === 'thrive' ? '▲' : l.quality === 'avoid' ? '▼' : '◆'} {cities.length}</span>
                  </div>
                  <div style={{ ...F, fontSize: 7, color: T.td, lineHeight: 1.4 }}>{cities.map(c => c.name).join(' · ')}</div>
                </div>
              );
            })}
          </div>
        </div>}
      </div>

      {/* BOTTOM TICKER */}
      <div style={{ height: 22, minHeight: 22, background: T.bg, borderTop: `1px solid ${T.bs}`, display: 'flex', alignItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 24, whiteSpace: 'nowrap', ...F, fontSize: 8, animation: 'ts 55s linear infinite', animationPlayState: pageVisible ? 'running' : 'paused', willChange: 'transform', backfaceVisibility: 'hidden' }}>
          {[...Array(2)].flatMap(() => [
            bestCities[0] ? `★ ${t('bestCity', lang)}: ${bestCities[0].name} (${bestCities[0].line})` : `★ ${t('yourChart', lang)}`,
            `▲ ${thriveC.length} ${t('thriveZone', lang).toLowerCase()}`,
            `◆ ${neutralC.length} ${t('neutral', lang).toLowerCase()}`,
            `▼ ${avoidC.length} ${t('cautionZone', lang).toLowerCase()}`,
            `◉ ${onLines.length} ${t('total', lang)}`,
          ]).map((s, i) => (
            <span key={i} style={{ color: s.startsWith('▼') ? '#F04060' : s.startsWith('▲') ? T.ac : T.td, padding: '0 4px' }}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
