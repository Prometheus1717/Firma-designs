import { useMemo } from 'react';

// ── Zodiac order & glyphs ──
const ZODIAC = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SYM = { Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍', Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓' };
const ELEM = { Aries:'Fire', Taurus:'Earth', Gemini:'Air', Cancer:'Water', Leo:'Fire', Virgo:'Earth', Libra:'Air', Scorpio:'Water', Sagittarius:'Fire', Capricorn:'Earth', Aquarius:'Air', Pisces:'Water' };

// Element arc colors — muted palette from reference
const ELEM_ARC = { Fire:'#C84A3A', Earth:'#7A9B45', Air:'#3A7BB8', Water:'#C8913A' };
const ELEM_SYM = { Fire:'#B43020', Earth:'#5A7820', Air:'#205598', Water:'#A0701A' };

// Planet colors — muted earthy tones matching reference
const PC = {
  Sun:'#C86A20', Moon:'#3AA0B8', Mercury:'#9A9020', Venus:'#5A9830',
  Mars:'#C82020', Jupiter:'#3A5098', Saturn:'#5A5848',
  Uranus:'#B85020', Neptune:'#4A3890', Pluto:'#3A4060',
  Node:'#3A8090', Fortune:'#303030', Chiron:'#884020', Lilith:'#2A2020',
};

// Extra body glyphs
const EXTRA_SYM = { Node:'☊', Fortune:'⊗', Chiron:'⚷', Lilith:'⚸' };

// Aspects
const ASPECTS = [
  { angle: 0,   orb: 8, color: '#A07820', dash: '' },       // Conjunction — amber
  { angle: 60,  orb: 5, color: '#4A78C0', dash: '4,3' },    // Sextile — blue dashed
  { angle: 90,  orb: 7, color: '#C03838', dash: '' },       // Square — red
  { angle: 120, orb: 8, color: '#3A9840', dash: '' },       // Trine — green
  { angle: 180, orb: 8, color: '#C03838', dash: '6,3' },    // Opposition — red dashed
];

function norm(a) { return ((a % 360) + 360) % 360; }

// Ecliptic → chart angle. ASC at 9-o'clock (180°). Ecliptic increases counter-clockwise.
function e2c(ecl, asc) { return norm(180 - (ecl - asc)); }

function pol(cx, cy, r, deg) {
  const rad = deg * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
}

// Porphyry house cusps
function porphyry(ascLon, mcLon) {
  const dsc = norm(ascLon + 180), ic = norm(mcLon + 180);
  function tri(a, b) { const s = norm(b - a); return [norm(a + s / 3), norm(a + 2 * s / 3)]; }
  const [c2, c3] = tri(ic, ascLon);
  const [c11, c12] = tri(ascLon, mcLon);
  const [c8, c9] = tri(mcLon, dsc);
  const [c5, c6] = tri(dsc, ic);
  return [null, ascLon, c2, c3, ic, c5, c6, dsc, c8, c9, mcLon, c11, c12];
}

function degMin(lon) {
  const signIdx = Math.floor(lon / 30) % 12;
  const within = lon - signIdx * 30;
  const d = Math.floor(within);
  const m = Math.floor((within - d) * 60);
  return { sign: ZODIAC[signIdx], deg: d, min: m };
}

export default function NatalWheel({ planets, natal, extras, size = 600 }) {
  const chart = useMemo(() => {
    if (!planets || !natal?.asc) return null;
    const ascLon = natal.asc.fullDeg;
    const mcLon = natal.mc.fullDeg;
    const R = size / 2, cx = R, cy = R;

    // Ring radii (from outside in)
    const rOuter   = R * 0.97;  // outermost edge
    const rElemIn  = R * 0.93;  // inner edge of element color ring
    const rSignOut = R * 0.93;  // outer edge of zodiac sign band
    const rSignIn  = R * 0.82;  // inner edge of zodiac sign band
    const rHouseIn = R * 0.56;  // inner edge of house area (start of aspect circle)

    // Zodiac signs
    const signs = ZODIAC.map((name, i) => ({
      name, sym: SYM[name], elem: ELEM[name], eclStart: i * 30,
    }));

    // Collect bodies: 10 classical planets + optional extras
    const bodies = planets.map(p => ({
      id: p.id, symbol: p.symbol, sign: p.sign, deg: p.deg, min: p.min,
      fullDeg: p.fullDeg, retrograde: p.retrograde,
      color: PC[p.id] || '#555',
    }));
    if (extras) {
      for (const ex of extras) {
        const z = degMin(ex.fullDeg);
        bodies.push({
          id: ex.id, symbol: EXTRA_SYM[ex.id] || '?',
          sign: z.sign, deg: z.deg, min: z.min,
          fullDeg: ex.fullDeg, retrograde: !!ex.retrograde,
          color: PC[ex.id] || '#555',
        });
      }
    }

    // Compute display angles with collision avoidance
    bodies.forEach(b => { b.chartAngle = e2c(b.fullDeg, ascLon); b.displayAngle = b.chartAngle; });
    bodies.sort((a, b) => a.displayAngle - b.displayAngle);
    const gap = 10;
    for (let pass = 0; pass < 8; pass++) {
      for (let i = 0; i < bodies.length; i++) {
        const j = (i + 1) % bodies.length;
        let d = norm(bodies[j].displayAngle - bodies[i].displayAngle);
        if (d < gap && d > 0) {
          const s = (gap - d) / 2;
          bodies[i].displayAngle = norm(bodies[i].displayAngle - s);
          bodies[j].displayAngle = norm(bodies[j].displayAngle + s);
        }
      }
    }

    const cusps = porphyry(ascLon, mcLon);

    // Aspects (classical planets only, no Node/Fortune/etc.)
    const classical = bodies.filter(b => PC[b.id] && !['Node','Fortune','Chiron','Lilith'].includes(b.id));
    const aspects = [];
    for (let i = 0; i < classical.length; i++) {
      for (let j = i + 1; j < classical.length; j++) {
        const diff = Math.abs(classical[i].fullDeg - classical[j].fullDeg);
        const ang = diff > 180 ? 360 - diff : diff;
        for (const asp of ASPECTS) {
          if (Math.abs(ang - asp.angle) <= asp.orb) {
            aspects.push({ a: classical[i], b: classical[j], color: asp.color, dash: asp.dash });
            break;
          }
        }
      }
    }

    return { cx, cy, rOuter, rElemIn, rSignOut, rSignIn, rHouseIn, signs, bodies, cusps, aspects, ascLon, mcLon };
  }, [planets, natal, extras, size]);

  if (!chart) return null;
  const { cx, cy, rOuter, rElemIn, rSignOut, rSignIn, rHouseIn, signs, bodies, cusps, aspects, ascLon, mcLon } = chart;

  function arcSeg(rO, rI, eclStart, span) {
    const a1 = e2c(eclStart, ascLon);
    const a2 = e2c(eclStart + span, ascLon);
    const p1 = pol(cx, cy, rO, a1), p2 = pol(cx, cy, rO, a2);
    const p3 = pol(cx, cy, rI, a2), p4 = pol(cx, cy, rI, a1);
    return `M${p1[0]},${p1[1]} A${rO},${rO} 0 0,0 ${p2[0]},${p2[1]} L${p3[0]},${p3[1]} A${rI},${rI} 0 0,1 ${p4[0]},${p4[1]} Z`;
  }

  const fs = size / 600;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', fontFamily: 'Georgia, serif', userSelect: 'none' }}>

      {/* Outer black frame */}
      <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="#000" strokeWidth={1.2 * fs} />

      {/* ── Element color ring (outermost thin band) ── */}
      {signs.map((s, i) => (
        <path key={'e' + i} d={arcSeg(rOuter, rElemIn, s.eclStart, 30)}
          fill={ELEM_ARC[s.elem]} fillOpacity="0.85" stroke={ELEM_ARC[s.elem]} strokeWidth="0.5" />
      ))}

      {/* ── Zodiac sign band (white) ── */}
      {signs.map((s, i) => (
        <path key={'s' + i} d={arcSeg(rSignOut, rSignIn, s.eclStart, 30)}
          fill="#F6F2EA" stroke="none" />
      ))}

      {/* Sign band outline */}
      <circle cx={cx} cy={cy} r={rSignOut} fill="none" stroke="#000" strokeWidth={0.8 * fs} />
      <circle cx={cx} cy={cy} r={rSignIn} fill="none" stroke="#000" strokeWidth={0.8 * fs} />

      {/* Sign divider lines — between signs */}
      {signs.map((s, i) => {
        const angle = e2c(s.eclStart, ascLon);
        const p1 = pol(cx, cy, rSignOut, angle), p2 = pol(cx, cy, rSignIn, angle);
        return <line key={'d' + i} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke="#000" strokeWidth={0.6 * fs} />;
      })}

      {/* Sign glyphs centered in band */}
      {signs.map((s, i) => {
        const mid = e2c(s.eclStart + 15, ascLon);
        const p = pol(cx, cy, (rSignOut + rSignIn) / 2, mid);
        return (
          <text key={'sym' + i} x={p[0]} y={p[1]} textAnchor="middle" dominantBaseline="central"
            fill={ELEM_SYM[s.elem]} fontSize={22 * fs} fontWeight="400">{s.sym}</text>
        );
      })}

      {/* ── House area background (white) — this is where aspects also draw ── */}
      <circle cx={cx} cy={cy} r={rSignIn - 0.5} fill="#FBF8F2" />

      {/* ── House cusp lines — from sign band inward ── */}
      {cusps.slice(1).map((eclCusp, i) => {
        const hNum = i + 1;
        const angle = e2c(eclCusp, ascLon);
        const isAxis = hNum === 1 || hNum === 4 || hNum === 7 || hNum === 10;
        const pO = pol(cx, cy, rSignIn, angle);
        const pI = pol(cx, cy, rHouseIn, angle);
        return (
          <line key={'hl' + i} x1={pO[0]} y1={pO[1]} x2={pI[0]} y2={pI[1]}
            stroke={isAxis ? '#202020' : '#6A6A6A'} strokeWidth={isAxis ? 1.2 * fs : 0.6 * fs}
            strokeDasharray={isAxis ? 'none' : '2,2'} />
        );
      })}

      {/* ── House cusp DEGREE LABELS on outer edge — "28 ♎ 23" format ── */}
      {cusps.slice(1).map((eclCusp, i) => {
        const hNum = i + 1;
        const angle = e2c(eclCusp, ascLon);
        // Offset just inside the element color ring
        const rLabel = rOuter + 10 * fs;
        const isAxis = hNum === 1 || hNum === 4 || hNum === 7 || hNum === 10;
        const z = degMin(eclCusp);
        const pDeg = pol(cx, cy, rLabel, angle + (isAxis ? 0 : 2.5));
        const pSign = pol(cx, cy, rLabel, angle);
        const pMin = pol(cx, cy, rLabel, angle - (isAxis ? 0 : 2.5));
        return (
          <g key={'cl' + i}>
            <text x={pDeg[0]} y={pDeg[1] - 10 * fs} textAnchor="middle" dominantBaseline="central"
              fill="#F6F2EA" fontSize={9 * fs} fontWeight="700" fontFamily="Georgia, serif">{z.deg}</text>
            <text x={pSign[0]} y={pSign[1]} textAnchor="middle" dominantBaseline="central"
              fill="#F6F2EA" fontSize={11 * fs} fontWeight="400">{SYM[z.sign]}</text>
            <text x={pMin[0]} y={pMin[1] + 10 * fs} textAnchor="middle" dominantBaseline="central"
              fill="#F6F2EA" fontSize={8 * fs} fontFamily="Georgia, serif">{String(z.min).padStart(2, '0')}</text>
          </g>
        );
      })}

      {/* ── House numbers at midpoint of each house (small, inside aspect circle) ── */}
      {cusps.slice(1).map((eclCusp, i) => {
        const hNum = i + 1;
        const nextCusp = cusps[hNum === 12 ? 1 : hNum + 1];
        const midEcl = norm(eclCusp + norm(nextCusp - eclCusp) / 2);
        const midA = e2c(midEcl, ascLon);
        const rh = rHouseIn + (rSignIn - rHouseIn) * 0.08;
        const hP = pol(cx, cy, rh, midA);
        return (
          <text key={'hn' + i} x={hP[0]} y={hP[1]} textAnchor="middle" dominantBaseline="central"
            fill="#5A5040" fontSize={13 * fs} fontWeight="400" fontFamily="Georgia, serif">{hNum}</text>
        );
      })}

      {/* ── Axis arrow lines (ASC/DC and MC/IC) extend across whole inner area ── */}
      {[
        { a: ascLon, label: 'ASC' },
        { a: norm(ascLon + 180), label: 'DC' },
        { a: mcLon, label: 'MC' },
        { a: norm(mcLon + 180), label: 'IC' },
      ].map((ax, i) => {
        const angle = e2c(ax.a, ascLon);
        const p1 = pol(cx, cy, rSignIn, angle);
        const p2 = pol(cx, cy, rHouseIn, angle);
        return (
          <line key={'ax' + i} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]}
            stroke="#202020" strokeWidth={1.2 * fs} />
        );
      })}

      {/* ── Inner aspect circle (same cream background as house area, just a border) ── */}
      <circle cx={cx} cy={cy} r={rHouseIn} fill="#FBF8F2" stroke="#000" strokeWidth={0.8 * fs} />

      {/* ── Aspect lines ── */}
      {aspects.map((asp, i) => {
        const p1 = pol(cx, cy, rHouseIn - 1, asp.a.chartAngle);
        const p2 = pol(cx, cy, rHouseIn - 1, asp.b.chartAngle);
        return (
          <line key={'al' + i} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]}
            stroke={asp.color} strokeWidth={1.3 * fs} opacity="0.75"
            strokeDasharray={asp.dash || 'none'} />
        );
      })}

      {/* ── Planets/bodies (stacked info: deg / sign / min, + Rx) ── */}
      {bodies.map((b, i) => {
        const exactA = b.chartAngle;
        const dispA = b.displayAngle;
        const tickO = pol(cx, cy, rSignIn, exactA);
        const tickI = pol(cx, cy, rSignIn - 5 * fs, exactA);

        // Planet glyph — sits partway between sign band and house center
        const symR = rSignIn - (rSignIn - rHouseIn) * 0.30;
        const symP = pol(cx, cy, symR, dispA);

        // Info below glyph: degree / sign glyph / minutes, stacked
        const infoR = rSignIn - (rSignIn - rHouseIn) * 0.58;
        const infoP = pol(cx, cy, infoR, dispA);

        // Connector from tick down to symbol area
        const connEnd = pol(cx, cy, symR + 10 * fs, dispA);

        return (
          <g key={'p' + i}>
            {/* Tick on sign ring */}
            <line x1={tickO[0]} y1={tickO[1]} x2={tickI[0]} y2={tickI[1]}
              stroke={b.color} strokeWidth={1.4 * fs} />
            {/* Thin connector if displaced by collision-avoidance */}
            {Math.abs(norm(dispA - exactA)) > 0.5 && (
              <line x1={tickI[0]} y1={tickI[1]} x2={connEnd[0]} y2={connEnd[1]}
                stroke={b.color} strokeWidth={0.5 * fs} opacity="0.4" />
            )}
            {/* Planet glyph */}
            <text x={symP[0]} y={symP[1]} textAnchor="middle" dominantBaseline="central"
              fill={b.color} fontSize={20 * fs} fontWeight="400">{b.symbol}</text>
            {/* Stacked: degree */}
            <text x={infoP[0]} y={infoP[1] - 9 * fs} textAnchor="middle" dominantBaseline="central"
              fill="#3A3020" fontSize={10 * fs} fontWeight="700" fontFamily="Georgia, serif">{b.deg}</text>
            {/* Stacked: sign glyph */}
            <text x={infoP[0]} y={infoP[1] + 2 * fs} textAnchor="middle" dominantBaseline="central"
              fill={ELEM_SYM[ELEM[b.sign]] || '#3A3020'} fontSize={11 * fs}>{SYM[b.sign]}</text>
            {/* Stacked: minutes */}
            <text x={infoP[0]} y={infoP[1] + 13 * fs} textAnchor="middle" dominantBaseline="central"
              fill="#5A5040" fontSize={8 * fs} fontFamily="Georgia, serif">{String(b.min).padStart(2, '0')}</text>
            {/* Retrograde below */}
            {b.retrograde && (
              <text x={infoP[0]} y={infoP[1] + 24 * fs} textAnchor="middle" dominantBaseline="central"
                fill="#C03838" fontSize={8 * fs} fontFamily="Georgia, serif" fontWeight="700" fontStyle="italic">Rx</text>
            )}
          </g>
        );
      })}

      {/* ── ASC/MC labels just outside the sign band ── */}
      {[
        { label: 'ASC', ecl: ascLon },
        { label: 'MC', ecl: mcLon },
      ].map((a, i) => {
        const angle = e2c(a.ecl, ascLon);
        const lP = pol(cx, cy, rSignOut + 20 * fs, angle);
        return (
          <text key={'axl' + i} x={lP[0]} y={lP[1]} textAnchor="middle" dominantBaseline="central"
            fill="#F6F2EA" fontSize={12 * fs} fontWeight="700" fontFamily="Georgia, serif" letterSpacing="1">{a.label}</text>
        );
      })}
    </svg>
  );
}
