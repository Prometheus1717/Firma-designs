import { useMemo } from 'react';

// ─── Zodiac ───
const ZODIAC = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SYM = { Aries:'\u2648', Taurus:'\u2649', Gemini:'\u264A', Cancer:'\u264B', Leo:'\u264C', Virgo:'\u264D', Libra:'\u264E', Scorpio:'\u264F', Sagittarius:'\u2650', Capricorn:'\u2651', Aquarius:'\u2652', Pisces:'\u2653' };
const ELEM = { Aries:'Fire', Taurus:'Earth', Gemini:'Air', Cancer:'Water', Leo:'Fire', Virgo:'Earth', Libra:'Air', Scorpio:'Water', Sagittarius:'Fire', Capricorn:'Earth', Aquarius:'Air', Pisces:'Water' };

// Classic astrology colors (TimePassages / Solar Fire convention)
const ELEM_COL = { Fire:'#C0392B', Earth:'#27AE60', Air:'#E67E22', Water:'#2980B9' };
const SIGN_BG  = { Fire:'#FDEDEC', Earth:'#E8F8F0', Air:'#FDF2E9', Water:'#EAF2F8' };

// Planet glyphs (Unicode)
const BSYM = {
  Sun:'\u2609', Moon:'\u263D', Mercury:'\u263F', Venus:'\u2640', Mars:'\u2642',
  Jupiter:'\u2643', Saturn:'\u2644', Uranus:'\u2645', Neptune:'\u2646', Pluto:'\u2647',
  Node:'\u260A', Lilith:'\u26B8', Fortune:'\u2297',
};

const PCOL = {
  Sun:'#E67E22', Moon:'#7F8C8D', Mercury:'#16A085', Venus:'#27AE60',
  Mars:'#C0392B', Jupiter:'#2980B9', Saturn:'#34495E', Uranus:'#8E44AD',
  Neptune:'#1ABC9C', Pluto:'#7D3C98', Node:'#555555', Lilith:'#4B0082', Fortune:'#B8860B',
};

const ASPECTS = [
  { angle: 0,   orb: 8, color:'#16A085', w: 1.1 }, // conjunction
  { angle: 60,  orb: 4, color:'#2980B9', w: 0.8 }, // sextile
  { angle: 90,  orb: 6, color:'#C0392B', w: 1.1 }, // square
  { angle: 120, orb: 6, color:'#2980B9', w: 1.1 }, // trine
  { angle: 180, orb: 8, color:'#C0392B', w: 1.2 }, // opposition
];

// ─── Math ───
const norm = a => ((a % 360) + 360) % 360;
const e2c  = (ecl, asc) => norm(180 - (ecl - asc));
const pol  = (cx, cy, r, deg) => {
  const rad = deg * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
};
const arcPath = (cx, cy, r, a1, a2) => {
  const [x1,y1] = pol(cx, cy, r, a1);
  const [x2,y2] = pol(cx, cy, r, a2);
  const large = norm(a2 - a1) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2}`;
};
const sectorPath = (cx, cy, rIn, rOut, a1, a2) => {
  const [ox1,oy1] = pol(cx, cy, rOut, a1);
  const [ox2,oy2] = pol(cx, cy, rOut, a2);
  const [ix2,iy2] = pol(cx, cy, rIn,  a2);
  const [ix1,iy1] = pol(cx, cy, rIn,  a1);
  const large = norm(a2 - a1) > 180 ? 1 : 0;
  return `M ${ox1} ${oy1} A ${rOut} ${rOut} 0 ${large} 0 ${ox2} ${oy2} L ${ix2} ${iy2} A ${rIn} ${rIn} 0 ${large} 1 ${ix1} ${iy1} Z`;
};

function fmtDeg(lon) {
  const i = Math.floor(lon / 30) % 12;
  const within = lon - i * 30;
  const d = Math.floor(within);
  const m = Math.floor((within - d) * 60);
  return { d, m, sign: ZODIAC[i] };
}

export default function NatalWheel({ planets, natal, houseCusps, extras = [], size = 560 }) {
  const chart = useMemo(() => {
    if (!planets || !natal?.asc) return null;
    const ascLon = natal.asc.fullDeg;
    const mcLon  = natal.mc.fullDeg;

    // Pad viewBox so cusp labels fit outside the wheel
    const PAD = size * 0.12;
    const vb = size + PAD * 2;
    const cx = vb / 2, cy = vb / 2;
    const R = size / 2;

    let cusps;
    if (houseCusps?.length) {
      cusps = [null, ...houseCusps.map(h => h.fullDeg)];
    } else {
      const dsc = norm(ascLon + 180), ic = norm(mcLon + 180);
      const tri = (a, b) => { const s = norm(b - a); return [norm(a + s/3), norm(a + 2*s/3)]; };
      const [c2, c3] = tri(ascLon, ic);
      const [c5, c6] = tri(ic, dsc);
      const [c8, c9] = tri(dsc, mcLon);
      const [c11,c12]= tri(mcLon, ascLon);
      cusps = [null, ascLon, c2, c3, ic, c5, c6, dsc, c8, c9, mcLon, c11, c12];
    }

    // Radii (large outer, clean proportions)
    const rZodOut   = R * 1.00;
    const rZodIn    = R * 0.86;
    const rPlanOut  = R * 0.84;  // planet band outer
    const rPlanIn   = R * 0.50;  // planet band inner
    const rHouseOut = R * 0.50;
    const rHouseIn  = R * 0.44;
    const rAspOut   = R * 0.44;  // aspect area outer

    // Build all bodies
    const bodies = [
      ...planets.map(p => ({
        id: p.id, symbol: BSYM[p.id] || p.symbol, sign: p.sign,
        deg: p.deg, min: p.min, fullDeg: p.fullDeg, retrograde: p.retrograde,
        color: PCOL[p.id] || '#333', isMajor: true,
      })),
      ...(extras || []).map(e => ({
        id: e.id, symbol: BSYM[e.id] || '?', sign: e.sign,
        deg: e.deg, min: e.min, fullDeg: e.fullDeg, retrograde: !!e.retrograde,
        color: PCOL[e.id] || '#333', isMajor: false,
      })),
    ];

    // True chart angle for each body; then nudge displayAngle apart for legibility
    bodies.forEach(b => { b.chartAngle = e2c(b.fullDeg, ascLon); b.displayAngle = b.chartAngle; });
    bodies.sort((a, b) => a.displayAngle - b.displayAngle);
    const MIN_GAP = 9;
    for (let pass = 0; pass < 24; pass++) {
      let moved = false;
      for (let i = 0; i < bodies.length; i++) {
        const j = (i + 1) % bodies.length;
        const d = norm(bodies[j].displayAngle - bodies[i].displayAngle);
        if (d > 0 && d < MIN_GAP) {
          const s = (MIN_GAP - d) / 2;
          bodies[i].displayAngle = norm(bodies[i].displayAngle - s);
          bodies[j].displayAngle = norm(bodies[j].displayAngle + s);
          moved = true;
        }
      }
      if (!moved) break;
    }

    // Aspects
    const aspectables = bodies.filter(b => b.isMajor);
    const aspects = [];
    for (let i = 0; i < aspectables.length; i++) {
      for (let j = i + 1; j < aspectables.length; j++) {
        const diff = Math.abs(aspectables[i].fullDeg - aspectables[j].fullDeg);
        const ang = diff > 180 ? 360 - diff : diff;
        for (const asp of ASPECTS) {
          if (Math.abs(ang - asp.angle) <= asp.orb) {
            aspects.push({ a: aspectables[i], b: aspectables[j], ...asp });
            break;
          }
        }
      }
    }

    return { cx, cy, R, vb, rZodOut, rZodIn, rPlanOut, rPlanIn, rHouseOut, rHouseIn, rAspOut, bodies, cusps, aspects, ascLon, mcLon };
  }, [planets, natal, houseCusps, extras, size]);

  if (!chart) return null;
  const { cx, cy, R, vb, rZodOut, rZodIn, rPlanOut, rPlanIn, rHouseOut, rHouseIn, rAspOut, bodies, cusps, aspects, ascLon, mcLon } = chart;
  const f = size / 560;
  // Font stack that supports astrological glyphs reliably on all platforms
  const astroFont = '"Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols2", "Noto Sans Symbols", "Symbola", "DejaVu Sans", serif';

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${vb} ${vb}`}
      style={{ display: 'block', userSelect: 'none', background: '#FFFFFF' }}>

      {/* ─── Zodiac band: colored sector backgrounds ─── */}
      {ZODIAC.map((name, i) => {
        const a1 = e2c(i * 30, ascLon);
        const a2 = e2c((i + 1) * 30, ascLon);
        return (
          <path key={'sb'+i} d={sectorPath(cx, cy, rZodIn, rZodOut, a2, a1)}
            fill={SIGN_BG[ELEM[name]]} stroke="none" />
        );
      })}

      {/* Zodiac band borders */}
      <circle cx={cx} cy={cy} r={rZodOut} fill="none" stroke="#1E1E1E" strokeWidth={1.4 * f} />
      <circle cx={cx} cy={cy} r={rZodIn}  fill="none" stroke="#1E1E1E" strokeWidth={1.0 * f} />

      {/* Zodiac sign dividers */}
      {ZODIAC.map((_, i) => {
        const a = e2c(i * 30, ascLon);
        const [x1,y1] = pol(cx, cy, rZodOut, a);
        const [x2,y2] = pol(cx, cy, rZodIn,  a);
        return <line key={'sd'+i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1E1E1E" strokeWidth={0.9 * f} />;
      })}

      {/* Degree tick marks inside zodiac band */}
      {Array.from({ length: 360 }, (_, d) => {
        const a = e2c(d, ascLon);
        const isMajor = d % 10 === 0;
        const isMid   = d % 5 === 0;
        const len = isMajor ? 8 * f : isMid ? 5 * f : 2.5 * f;
        const [x1,y1] = pol(cx, cy, rZodIn, a);
        const [x2,y2] = pol(cx, cy, rZodIn + len, a);
        return <line key={'tk'+d} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={isMajor ? '#1E1E1E' : '#888'} strokeWidth={(isMajor ? 0.7 : 0.35) * f} />;
      })}

      {/* Sign glyphs */}
      {ZODIAC.map((name, i) => {
        const mid = e2c(i * 30 + 15, ascLon);
        const [x,y] = pol(cx, cy, (rZodOut + rZodIn) / 2, mid);
        return (
          <text key={'sg'+i} x={x} y={y} textAnchor="middle" dominantBaseline="central"
            fill={ELEM_COL[ELEM[name]]} fontSize={26 * f} fontFamily={astroFont} fontWeight="400">
            {SYM[name]}
          </text>
        );
      })}

      {/* ─── House cusp lines (inner area only) ─── */}
      {cusps.slice(1).map((eclCusp, i) => {
        const hNum = i + 1;
        const a = e2c(eclCusp, ascLon);
        const isAxis = [1, 4, 7, 10].includes(hNum);
        const [x1,y1] = pol(cx, cy, rZodIn, a);
        const [x2,y2] = pol(cx, cy, isAxis ? 0 : rAspOut, a);
        return (
          <line key={'hl'+i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={isAxis ? '#1E1E1E' : '#9A9A9A'}
            strokeWidth={(isAxis ? 1.1 : 0.5) * f}
            strokeDasharray={isAxis ? 'none' : `${3*f},${2*f}`} />
        );
      })}

      {/* ─── House number ring ─── */}
      <circle cx={cx} cy={cy} r={rHouseOut} fill="none" stroke="#1E1E1E" strokeWidth={0.7 * f} />
      <circle cx={cx} cy={cy} r={rHouseIn}  fill="none" stroke="#1E1E1E" strokeWidth={0.7 * f} />
      {cusps.slice(1).map((eclCusp, i) => {
        const hNum = i + 1;
        const nextCusp = cusps[hNum === 12 ? 1 : hNum + 1];
        const midEcl = norm(eclCusp + norm(nextCusp - eclCusp) / 2);
        const a = e2c(midEcl, ascLon);
        const [x,y] = pol(cx, cy, (rHouseOut + rHouseIn) / 2, a);
        return (
          <text key={'hn'+i} x={x} y={y} textAnchor="middle" dominantBaseline="central"
            fill="#555" fontSize={9 * f} fontFamily="serif" fontWeight="600">
            {hNum}
          </text>
        );
      })}

      {/* ─── Aspect lines in center ─── */}
      {aspects.map((asp, i) => {
        const [x1,y1] = pol(cx, cy, rAspOut, asp.a.chartAngle);
        const [x2,y2] = pol(cx, cy, rAspOut, asp.b.chartAngle);
        return (
          <line key={'al'+i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={asp.color} strokeWidth={asp.w * f} opacity={0.75} />
        );
      })}

      {/* ─── ASC / DC / MC / IC labels at axis tips (inside zodiac band) ─── */}
      {[
        { label:'AC', ecl: ascLon },
        { label:'DC', ecl: norm(ascLon + 180) },
        { label:'MC', ecl: mcLon },
        { label:'IC', ecl: norm(mcLon + 180) },
      ].map((a, i) => {
        const ang = e2c(a.ecl, ascLon);
        const [x,y] = pol(cx, cy, rPlanOut - 8 * f, ang);
        return (
          <g key={'ax'+i}>
            <circle cx={x} cy={y} r={9 * f} fill="#FFFFFF" stroke="#1E1E1E" strokeWidth={0.9 * f} />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
              fill="#1E1E1E" fontSize={8 * f} fontFamily="serif" fontWeight="700">
              {a.label}
            </text>
          </g>
        );
      })}

      {/* ─── Planets (glyph, tick mark, degree label) ─── */}
      {bodies.map((b, i) => {
        const glyphR = rPlanOut - 20 * f;
        const degR   = glyphR - 18 * f;
        const [gx,gy] = pol(cx, cy, glyphR, b.displayAngle);
        const [dx,dy] = pol(cx, cy, degR,   b.displayAngle);

        // Exact-position tick on inner edge of zodiac band
        const [tx1,ty1] = pol(cx, cy, rZodIn, b.chartAngle);
        const [tx2,ty2] = pol(cx, cy, rZodIn - 6 * f, b.chartAngle);

        // Leader line if glyph displaced
        const displaced = Math.abs(norm(b.displayAngle - b.chartAngle + 180) - 180) > 1.2;
        const signColor = ELEM_COL[ELEM[b.sign]];

        return (
          <g key={'b'+i}>
            <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke={b.color} strokeWidth={1.4 * f} />
            {displaced && (() => {
              const [lx,ly] = pol(cx, cy, glyphR + 10 * f, b.displayAngle);
              return <line x1={tx2} y1={ty2} x2={lx} y2={ly} stroke={b.color} strokeWidth={0.5 * f} opacity={0.45} />;
            })()}
            {/* White halo so glyph reads clearly over lines */}
            <circle cx={gx} cy={gy} r={12 * f} fill="#FFFFFF" opacity={0.85} />
            <text x={gx} y={gy} textAnchor="middle" dominantBaseline="central"
              fill={b.color} fontSize={(b.isMajor ? 22 : 17) * f} fontFamily={astroFont} fontWeight="400">
              {b.symbol}
            </text>
            {/* Degree + sign glyph + minute */}
            <text x={dx} y={dy} textAnchor="middle" dominantBaseline="central"
              fontFamily="serif" fontSize={8 * f} fill="#1E1E1E">
              <tspan fontWeight="600">{b.deg}°</tspan>
              <tspan fill={signColor} fontFamily={astroFont} fontSize={10 * f} dx={1.5 * f}>{SYM[b.sign]}</tspan>
              <tspan dx={1.5 * f}>{String(b.min).padStart(2,'0')}'</tspan>
              {b.retrograde && <tspan fill="#C0392B" fontStyle="italic" fontWeight="700" dx={2 * f}>℞</tspan>}
            </text>
          </g>
        );
      })}

      {/* ─── Cusp degree labels OUTSIDE the wheel ─── */}
      {cusps.slice(1).map((eclCusp, i) => {
        const hNum = i + 1;
        const a = e2c(eclCusp, ascLon);
        const c = fmtDeg(eclCusp);
        const [x,y] = pol(cx, cy, rZodOut + 20 * f, a);
        const signColor = ELEM_COL[ELEM[c.sign]];
        const isAxis = [1, 4, 7, 10].includes(hNum);
        return (
          <g key={'cl'+i}>
            <text x={x} y={y - 7 * f} textAnchor="middle" dominantBaseline="central"
              fill="#1E1E1E" fontSize={9 * f} fontFamily="serif" fontWeight={isAxis ? '700' : '500'}>
              {c.d}°{String(c.m).padStart(2,'0')}'
            </text>
            <text x={x} y={y + 5 * f} textAnchor="middle" dominantBaseline="central"
              fill={signColor} fontSize={11 * f} fontFamily={astroFont}>
              {SYM[c.sign]}
            </text>
          </g>
        );
      })}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={2 * f} fill="#1E1E1E" />
    </svg>
  );
}
