import { useMemo } from 'react';

// ── Zodiac data ──
const ZODIAC = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SYM = { Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍', Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓' };
const ELEM = { Aries:'Fire', Taurus:'Earth', Gemini:'Air', Cancer:'Water', Leo:'Fire', Virgo:'Earth', Libra:'Air', Scorpio:'Water', Sagittarius:'Fire', Capricorn:'Earth', Aquarius:'Air', Pisces:'Water' };

// Element ring colors (saturated, for outer band) and glyph colors (lighter)
const ELEM_COL    = { Fire:'#E53935', Earth:'#43A047', Air:'#1E88E5', Water:'#FB8C00' };
const ELEM_GLYPH  = { Fire:'#FF8A80', Earth:'#A5D6A7', Air:'#90CAF9', Water:'#FFCC80' };
const ELEM_BG     = { Fire:'#2A1010', Earth:'#0F1F0F', Air:'#0F1828', Water:'#291A0A' };

// Planet/body colors (bright, distinctive)
const PCOL = {
  Sun:'#FFC107', Moon:'#E1F5FE', Mercury:'#CE93D8', Venus:'#A5D6A7',
  Mars:'#EF5350', Jupiter:'#7986CB', Saturn:'#BCAAA4',
  Uranus:'#4DD0E1', Neptune:'#9575CD', Pluto:'#90A4AE',
  Node:'#B39DDB', Lilith:'#8D6E63', Fortune:'#FFD54F',
};

// Body symbols including extras
const BSYM = {
  Sun:'☉', Moon:'☽', Mercury:'☿', Venus:'♀', Mars:'♂',
  Jupiter:'♃', Saturn:'♄', Uranus:'♅', Neptune:'♆', Pluto:'♇',
  Node:'☊', Lilith:'⚸', Fortune:'⊗',
};

// Major aspects (Ptolemaic + Sextile)
const ASPECTS = [
  { name: 'Conjunction', angle: 0,   orb: 8, color: '#FFD54F', dash: '',     weight: 1.4 },
  { name: 'Opposition',  angle: 180, orb: 8, color: '#EF5350', dash: '',     weight: 1.4 },
  { name: 'Trine',       angle: 120, orb: 7, color: '#66BB6A', dash: '',     weight: 1.2 },
  { name: 'Square',      angle: 90,  orb: 7, color: '#EF5350', dash: '',     weight: 1.2 },
  { name: 'Sextile',     angle: 60,  orb: 5, color: '#42A5F5', dash: '4,3',  weight: 0.9 },
];

// ── Math helpers ──
const norm = a => ((a % 360) + 360) % 360;
const e2c  = (ecl, asc) => norm(180 - (ecl - asc));   // ASC at 9-o'clock; ecliptic CCW
const pol  = (cx, cy, r, deg) => {
  const rad = deg * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
};

// Compute aspect between two ecliptic longitudes
function aspectBetween(a, b) {
  const diff = Math.abs(a - b);
  const ang  = diff > 180 ? 360 - diff : diff;
  for (const asp of ASPECTS) {
    if (Math.abs(ang - asp.angle) <= asp.orb) return { ...asp, exact: ang };
  }
  return null;
}

export default function NatalWheel({ planets, natal, houseCusps, extras = [], size = 480 }) {
  const chart = useMemo(() => {
    if (!planets || !natal?.asc) return null;
    const ascLon = natal.asc.fullDeg;
    const mcLon  = natal.mc.fullDeg;
    const R = size / 2, cx = R, cy = R;

    // House cusps from props (precomputed by calculateChart) — fallback to inline porphyry
    let cusps;
    if (houseCusps?.length) {
      cusps = [null, ...houseCusps.map(h => h.fullDeg)];
    } else {
      const dsc = norm(ascLon + 180), ic = norm(mcLon + 180);
      const tri = (a, b) => { const s = norm(b - a); return [norm(a + s/3), norm(a + 2*s/3)]; };
      const [c2, c3]   = tri(ascLon, ic);
      const [c5, c6]   = tri(ic, dsc);
      const [c8, c9]   = tri(dsc, mcLon);
      const [c11, c12] = tri(mcLon, ascLon);
      cusps = [null, ascLon, c2, c3, ic, c5, c6, dsc, c8, c9, mcLon, c11, c12];
    }

    // ── Ring radii (proportional to size) ──
    const rOuter   = R * 0.985;  // outer rim
    const rDegOut  = R * 0.985;  // tick marks (same as rim)
    const rDegIn   = R * 0.945;  // inside tick marks → element band starts here too
    const rElemIn  = R * 0.92;   // inner edge of element band
    const rSignIn  = R * 0.785;  // inner edge of sign band  (sign band ≈ R*0.135 wide)
    const rPlanIn  = R * 0.575;  // inner edge of planet zone
    const rHouseN  = R * 0.50;   // house numbers radius
    const rInner   = R * 0.46;   // inner aspect circle

    // ── All bodies (planets + extras) with display angles ──
    const bodies = [
      ...planets.map(p => ({
        id: p.id, symbol: BSYM[p.id] || p.symbol, sign: p.sign,
        deg: p.deg, min: p.min, fullDeg: p.fullDeg,
        retrograde: p.retrograde, color: PCOL[p.id] || '#AAA',
        isMajor: true,
      })),
      ...(extras || []).map(e => ({
        id: e.id, symbol: BSYM[e.id] || '?', sign: e.sign,
        deg: e.deg, min: e.min, fullDeg: e.fullDeg,
        retrograde: !!e.retrograde, color: PCOL[e.id] || '#AAA',
        isMajor: false,
      })),
    ];

    bodies.forEach(b => { b.chartAngle = e2c(b.fullDeg, ascLon); b.displayAngle = b.chartAngle; });
    // Stable collision-avoidance: spread overlapping symbols apart, max 12 passes
    bodies.sort((a, b) => a.displayAngle - b.displayAngle);
    const minGap = 13;
    for (let pass = 0; pass < 14; pass++) {
      let moved = false;
      for (let i = 0; i < bodies.length; i++) {
        const j = (i + 1) % bodies.length;
        const d = norm(bodies[j].displayAngle - bodies[i].displayAngle);
        if (d > 0 && d < minGap) {
          const s = (minGap - d) / 2;
          bodies[i].displayAngle = norm(bodies[i].displayAngle - s);
          bodies[j].displayAngle = norm(bodies[j].displayAngle + s);
          moved = true;
        }
      }
      if (!moved) break;
    }

    // ── Aspects (between major planets only; Sun..Pluto + Node) ──
    const aspectables = bodies.filter(b => b.isMajor || b.id === 'Node');
    const aspects = [];
    for (let i = 0; i < aspectables.length; i++) {
      for (let j = i + 1; j < aspectables.length; j++) {
        const asp = aspectBetween(aspectables[i].fullDeg, aspectables[j].fullDeg);
        if (asp) aspects.push({ a: aspectables[i], b: aspectables[j], ...asp });
      }
    }

    return {
      cx, cy, R, rOuter, rDegOut, rDegIn, rElemIn, rSignIn, rPlanIn, rHouseN, rInner,
      bodies, cusps, aspects, ascLon, mcLon,
    };
  }, [planets, natal, houseCusps, extras, size]);

  if (!chart) return null;
  const {
    cx, cy, R, rOuter, rDegOut, rDegIn, rElemIn, rSignIn, rPlanIn, rHouseN, rInner,
    bodies, cusps, aspects, ascLon, mcLon,
  } = chart;
  const s = size / 480; // global scale factor

  // Polar arc segment (outer rO, inner rI) spanning `span` degrees of ecliptic from `eclStart`
  const arc = (rO, rI, eclStart, span) => {
    const a1 = e2c(eclStart, ascLon);
    const a2 = e2c(eclStart + span, ascLon);
    const [x1,y1] = pol(cx, cy, rO, a1);
    const [x2,y2] = pol(cx, cy, rO, a2);
    const [x3,y3] = pol(cx, cy, rI, a2);
    const [x4,y4] = pol(cx, cy, rI, a1);
    return `M${x1},${y1} A${rO},${rO} 0 0,0 ${x2},${y2} L${x3},${y3} A${rI},${rI} 0 0,1 ${x4},${y4} Z`;
  };

  // Tick marks every 1°/5°/10°/30°
  const ticks = [];
  for (let d = 0; d < 360; d++) {
    const angle = e2c(d, ascLon);
    let len, w;
    if (d % 30 === 0)      { len = 12 * s; w = 0.9 * s; }
    else if (d % 10 === 0) { len = 8  * s; w = 0.6 * s; }
    else if (d % 5 === 0)  { len = 5  * s; w = 0.5 * s; }
    else                   { len = 3  * s; w = 0.3 * s; }
    const [x1,y1] = pol(cx, cy, rDegOut, angle);
    const [x2,y2] = pol(cx, cy, rDegOut - len, angle);
    ticks.push({ x1, y1, x2, y2, w, color: d % 30 === 0 ? '#888' : '#555' });
  }

  // Cusp degree formatter
  const fmtCusp = (lon) => {
    const i = Math.floor(lon / 30) % 12;
    const within = lon - i * 30;
    const d = Math.floor(within);
    const m = Math.floor((within - d) * 60);
    return { d, m, sign: ZODIAC[i], sym: SYM[ZODIAC[i]] };
  };

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', userSelect: 'none' }}
      role="img" aria-label="Natal chart wheel">

      {/* ── Background ── */}
      <circle cx={cx} cy={cy} r={R} fill="#0A0418" />
      <circle cx={cx} cy={cy} r={rOuter} fill="#13081F" stroke="#3A2A4F" strokeWidth={0.7 * s} />

      {/* ── Outer degree ticks ── */}
      {ticks.map((t, i) => (
        <line key={'t'+i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.color} strokeWidth={t.w} />
      ))}

      {/* ── Element color band per sign ── */}
      {ZODIAC.map((name, i) => (
        <path key={'e'+i} d={arc(rDegIn, rElemIn, i * 30, 30)}
          fill={ELEM_COL[ELEM[name]]} fillOpacity={0.55} stroke="none" />
      ))}

      {/* ── Zodiac sign band (dark with element-tinted background) ── */}
      {ZODIAC.map((name, i) => (
        <path key={'s'+i} d={arc(rElemIn, rSignIn, i * 30, 30)}
          fill={ELEM_BG[ELEM[name]]} stroke="none" />
      ))}
      <circle cx={cx} cy={cy} r={rElemIn} fill="none" stroke="#3A2A4F" strokeWidth={0.5 * s} />
      <circle cx={cx} cy={cy} r={rSignIn} fill="none" stroke="#4A3A5F" strokeWidth={0.7 * s} />

      {/* ── Sign divider lines (full, thin) ── */}
      {ZODIAC.map((_, i) => {
        const angle = e2c(i * 30, ascLon);
        const [x1,y1] = pol(cx, cy, rDegIn, angle);
        const [x2,y2] = pol(cx, cy, rSignIn, angle);
        return <line key={'sd'+i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4A3A5F" strokeWidth={0.55 * s} />;
      })}

      {/* ── Sign glyphs centered in band ── */}
      {ZODIAC.map((name, i) => {
        const mid = e2c(i * 30 + 15, ascLon);
        const [x,y] = pol(cx, cy, (rElemIn + rSignIn) / 2, mid);
        return (
          <text key={'sg'+i} x={x} y={y} textAnchor="middle" dominantBaseline="central"
            fill={ELEM_GLYPH[ELEM[name]]} fontSize={18 * s}
            fontFamily="'Apple Symbols','Noto Sans Symbols','Segoe UI Symbol',serif">{SYM[name]}</text>
        );
      })}

      {/* ── House interior background ── */}
      <circle cx={cx} cy={cy} r={rSignIn - 0.5} fill="#0A0418" />

      {/* ── House cusp lines (axes thicker, intermediate dashed) ── */}
      {cusps.slice(1).map((eclCusp, i) => {
        const hNum = i + 1;
        const angle = e2c(eclCusp, ascLon);
        const isAxis = [1, 4, 7, 10].includes(hNum);
        const [x1,y1] = pol(cx, cy, rSignIn, angle);
        const [x2,y2] = pol(cx, cy, isAxis ? rInner : rInner + 4, angle);
        return (
          <line key={'hl'+i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={isAxis ? '#9080A0' : '#4A3A5F'}
            strokeWidth={(isAxis ? 1.3 : 0.5) * s}
            strokeDasharray={isAxis ? 'none' : `${2.5 * s},${2 * s}`} />
        );
      })}

      {/* ── Cusp degree labels (small, just inside sign band) ── */}
      {cusps.slice(1).map((eclCusp, i) => {
        const angle = e2c(eclCusp, ascLon);
        const [x,y] = pol(cx, cy, rSignIn - 9 * s, angle);
        const c = fmtCusp(eclCusp);
        return (
          <g key={'cd'+i}>
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
              fill="#A090B0" fontSize={6.5 * s} fontFamily="'JetBrains Mono',monospace">
              {c.d}°{String(c.m).padStart(2,'0')}
            </text>
          </g>
        );
      })}

      {/* ── House numbers (small, in middle of each house arc) ── */}
      {cusps.slice(1).map((eclCusp, i) => {
        const hNum = i + 1;
        const nextCusp = cusps[hNum === 12 ? 1 : hNum + 1];
        const midEcl = norm(eclCusp + norm(nextCusp - eclCusp) / 2);
        const midA = e2c(midEcl, ascLon);
        const [x,y] = pol(cx, cy, rHouseN, midA);
        return (
          <text key={'hn'+i} x={x} y={y} textAnchor="middle" dominantBaseline="central"
            fill="#705F85" fontSize={9 * s} fontFamily="'JetBrains Mono',monospace" fontWeight="600">{hNum}</text>
        );
      })}

      {/* ── Inner aspect circle ── */}
      <circle cx={cx} cy={cy} r={rInner} fill="#06030F" stroke="#3A2A4F" strokeWidth={0.6 * s} />

      {/* ── Aspect lines ── */}
      {aspects.map((asp, i) => {
        const [x1,y1] = pol(cx, cy, rInner - 1, asp.a.chartAngle);
        const [x2,y2] = pol(cx, cy, rInner - 1, asp.b.chartAngle);
        return (
          <line key={'al'+i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={asp.color} strokeWidth={asp.weight * s} opacity={0.55}
            strokeDasharray={asp.dash || 'none'} strokeLinecap="round" />
        );
      })}

      {/* ── Planets / bodies ── */}
      {bodies.map((b, i) => {
        const sigP    = pol(cx, cy, rSignIn - 5 * s, b.chartAngle);
        const sigO    = pol(cx, cy, rSignIn,        b.chartAngle);
        const glyphR  = rPlanIn + (rSignIn - rPlanIn) * 0.55;
        const labelR  = rPlanIn + (rSignIn - rPlanIn) * 0.18;
        const [gx,gy] = pol(cx, cy, glyphR, b.displayAngle);
        const [lx,ly] = pol(cx, cy, labelR, b.displayAngle);
        const displaced = Math.abs(norm(b.displayAngle - b.chartAngle + 180) - 180) > 1.2;

        return (
          <g key={'b'+i}>
            {/* Tick on the inside edge of the sign band, at exact ecliptic position */}
            <line x1={sigO[0]} y1={sigO[1]} x2={sigP[0]} y2={sigP[1]} stroke={b.color} strokeWidth={1.3 * s} />
            {displaced && (() => {
              const [cx2,cy2] = pol(cx, cy, glyphR + 13 * s, b.displayAngle);
              return <line x1={sigP[0]} y1={sigP[1]} x2={cx2} y2={cy2} stroke={b.color} strokeWidth={0.45 * s} opacity={0.4} />;
            })()}
            {/* Glyph */}
            <text x={gx} y={gy} textAnchor="middle" dominantBaseline="central"
              fill={b.color} fontSize={(b.isMajor ? 18 : 14) * s}
              fontFamily="'Apple Symbols','Noto Sans Symbols','Segoe UI Symbol',serif">{b.symbol}</text>
            {/* Single-line label: deg sign min, with optional R */}
            <text x={lx} y={ly - 4 * s} textAnchor="middle" dominantBaseline="central"
              fill="#C8B8D8" fontSize={7 * s} fontFamily="'JetBrains Mono',monospace" fontWeight="600">
              {b.deg}° {String(b.min).padStart(2,'0')}'
            </text>
            <text x={lx} y={ly + 4 * s} textAnchor="middle" dominantBaseline="central"
              fill={ELEM_GLYPH[ELEM[b.sign]]} fontSize={9 * s}
              fontFamily="'Apple Symbols','Noto Sans Symbols','Segoe UI Symbol',serif">
              {SYM[b.sign]}{b.retrograde ? ' ℞' : ''}
            </text>
          </g>
        );
      })}

      {/* ── Axis labels just outside the rim ── */}
      {[
        { label: 'AC',  ecl: ascLon },
        { label: 'DC',  ecl: norm(ascLon + 180) },
        { label: 'MC',  ecl: mcLon },
        { label: 'IC',  ecl: norm(mcLon + 180) },
      ].map((a, i) => {
        const angle = e2c(a.ecl, ascLon);
        const [x,y] = pol(cx, cy, rOuter - 22 * s, angle);
        return (
          <g key={'ax'+i}>
            <rect x={x - 11 * s} y={y - 6 * s} width={22 * s} height={12 * s} rx={2 * s}
              fill="#13081F" stroke="#7060A0" strokeWidth={0.6 * s} />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
              fill="#D8C0F0" fontSize={8 * s} fontWeight="700" fontFamily="'JetBrains Mono',monospace" letterSpacing={0.5}>{a.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
