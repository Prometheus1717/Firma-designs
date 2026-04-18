import { useMemo } from 'react';

// ── Zodiac data ──
const ZODIAC = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SYM = { Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍', Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓' };
const ELEM = { Aries:'Fire', Taurus:'Earth', Gemini:'Air', Cancer:'Water', Leo:'Fire', Virgo:'Earth', Libra:'Air', Scorpio:'Water', Sagittarius:'Fire', Capricorn:'Earth', Aquarius:'Air', Pisces:'Water' };

// Element colors (matching classical astrology software conventions)
const ELEM_COL = { Fire:'#DC143C', Earth:'#228B22', Air:'#1E90FF', Water:'#4169E1' };

// Planet colors (matching Matrix/WinStar convention)
const PCOL = {
  Sun:     '#DAA520',  // goldenrod
  Moon:    '#CD853F',  // peru/orange
  Mercury: '#6A0DAD',  // deep purple
  Venus:   '#228B22',  // forest green
  Mars:    '#B22222',  // firebrick red
  Jupiter: '#708090',  // slate gray
  Saturn:  '#8B0000',  // dark red
  Uranus:  '#DC143C',  // crimson
  Neptune: '#1E90FF',  // dodger blue
  Pluto:   '#8B0000',  // dark red
  Node:    '#2F4F4F',  // dark slate
  Lilith:  '#4B0082',  // indigo
  Fortune: '#B8860B',  // dark goldenrod
};

// Planet glyphs
const BSYM = {
  Sun:'☉', Moon:'☽', Mercury:'☿', Venus:'♀', Mars:'♂',
  Jupiter:'♃', Saturn:'♄', Uranus:'♅', Neptune:'♆', Pluto:'♇',
  Node:'☊', Lilith:'⚸', Fortune:'⊗',
};

// Aspects with classical colors
const ASPECTS = [
  { angle: 0,   orb: 8, color: '#228B22', dash: '',      w: 1.3, sym: '☌' }, // conj — green
  { angle: 60,  orb: 5, color: '#1E90FF', dash: '',      w: 0.9, sym: '⚹' }, // sextile — blue
  { angle: 90,  orb: 7, color: '#DC143C', dash: '',      w: 1.2, sym: '□' }, // square — red
  { angle: 120, orb: 7, color: '#1E90FF', dash: '',      w: 1.3, sym: '△' }, // trine — blue
  { angle: 150, orb: 3, color: '#228B22', dash: '3,2',   w: 0.7, sym: '⚻' }, // quincunx — dashed green
  { angle: 180, orb: 8, color: '#DC143C', dash: '',      w: 1.4, sym: '☍' }, // opp — red
];

// ── Math helpers ──
const norm = a => ((a % 360) + 360) % 360;
const e2c  = (ecl, asc) => norm(180 - (ecl - asc));
const pol  = (cx, cy, r, deg) => {
  const rad = deg * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
};

function fmtDeg(lon) {
  const i = Math.floor(lon / 30) % 12;
  const within = lon - i * 30;
  const d = Math.floor(within);
  const m = Math.floor((within - d) * 60);
  return { d, m, sign: ZODIAC[i], sym: SYM[ZODIAC[i]] };
}

export default function NatalWheel({ planets, natal, houseCusps, extras = [], size = 500 }) {
  const chart = useMemo(() => {
    if (!planets || !natal?.asc) return null;
    const ascLon = natal.asc.fullDeg;
    const mcLon  = natal.mc.fullDeg;
    const R = size / 2, cx = R, cy = R;

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

    // ── Ring radii (Matrix/WinStar proportions) ──
    // Leaves 20% padding around rOuter for external cusp labels
    const rOuter    = R * 0.78;  // outer edge of wheel
    const rSignIn   = R * 0.67;  // inner edge of zodiac band (narrow)
    const rHouseOut = R * 0.36;  // outer edge of house numbers ring
    const rHouseIn  = R * 0.32;  // inner edge of house numbers ring
    const rInner    = R * 0.32;  // inner aspect circle

    const bodies = [
      ...planets.map(p => ({
        id: p.id, symbol: BSYM[p.id] || p.symbol, sign: p.sign,
        deg: p.deg, min: p.min, fullDeg: p.fullDeg,
        retrograde: p.retrograde, color: PCOL[p.id] || '#333',
        isMajor: true,
      })),
      ...(extras || []).map(e => ({
        id: e.id, symbol: BSYM[e.id] || '?', sign: e.sign,
        deg: e.deg, min: e.min, fullDeg: e.fullDeg,
        retrograde: !!e.retrograde, color: PCOL[e.id] || '#333',
        isMajor: false,
      })),
    ];

    bodies.forEach(b => { b.chartAngle = e2c(b.fullDeg, ascLon); b.displayAngle = b.chartAngle; });
    bodies.sort((a, b) => a.displayAngle - b.displayAngle);
    const minGap = 10;
    for (let pass = 0; pass < 16; pass++) {
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

    const aspectables = bodies.filter(b => b.isMajor || b.id === 'Node');
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

    return { cx, cy, R, rOuter, rSignIn, rHouseOut, rHouseIn, rInner, bodies, cusps, aspects, ascLon, mcLon };
  }, [planets, natal, houseCusps, extras, size]);

  if (!chart) return null;
  const { cx, cy, R, rOuter, rSignIn, rHouseOut, rHouseIn, rInner, bodies, cusps, aspects, ascLon, mcLon } = chart;
  const f = size / 500;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', userSelect: 'none', background: '#FFFFFF' }}>

      {/* ── Background (white) ── */}
      <circle cx={cx} cy={cy} r={rOuter} fill="#FFFFFF" stroke="#000" strokeWidth={1.0 * f} />

      {/* ── Zodiac sign band dividers ── */}
      {ZODIAC.map((_, i) => {
        const angle = e2c(i * 30, ascLon);
        const [x1,y1] = pol(cx, cy, rOuter, angle);
        const [x2,y2] = pol(cx, cy, rSignIn, angle);
        return <line key={'sd'+i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth={0.5 * f} />;
      })}

      {/* ── Degree tick marks (5° and 1°) inside the zodiac ring ── */}
      {Array.from({ length: 360 }, (_, d) => {
        const angle = e2c(d, ascLon);
        const len = d % 5 === 0 ? 5 * f : 2.5 * f;
        const [x1,y1] = pol(cx, cy, rSignIn, angle);
        const [x2,y2] = pol(cx, cy, rSignIn + len, angle);
        return <line key={'tk'+d} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#555" strokeWidth={0.3 * f} />;
      })}

      {/* ── Sign glyphs centered in band ── */}
      {ZODIAC.map((name, i) => {
        const mid = e2c(i * 30 + 15, ascLon);
        const [x,y] = pol(cx, cy, (rOuter + rSignIn) / 2, mid);
        return (
          <text key={'sg'+i} x={x} y={y} textAnchor="middle" dominantBaseline="central"
            fill={ELEM_COL[ELEM[name]]} fontSize={20 * f} fontFamily="serif" fontWeight="500">
            {SYM[name]}
          </text>
        );
      })}

      {/* ── Inner border of zodiac band ── */}
      <circle cx={cx} cy={cy} r={rSignIn} fill="none" stroke="#000" strokeWidth={0.8 * f} />

      {/* ── House cusp lines (thin solid, axes bolder) ── */}
      {cusps.slice(1).map((eclCusp, i) => {
        const hNum = i + 1;
        const angle = e2c(eclCusp, ascLon);
        const isAxis = [1, 4, 7, 10].includes(hNum);
        const [x1,y1] = pol(cx, cy, rSignIn, angle);
        const [x2,y2] = pol(cx, cy, rInner, angle);
        return (
          <line key={'hl'+i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#000"
            strokeWidth={(isAxis ? 1.2 : 0.4) * f} />
        );
      })}

      {/* ── House numbers ring borders ── */}
      <circle cx={cx} cy={cy} r={rHouseOut} fill="none" stroke="#000" strokeWidth={0.6 * f} />
      <circle cx={cx} cy={cy} r={rHouseIn} fill="none" stroke="#000" strokeWidth={0.6 * f} />

      {/* ── House numbers (1-12) in the house ring ── */}
      {cusps.slice(1).map((eclCusp, i) => {
        const hNum = i + 1;
        const nextCusp = cusps[hNum === 12 ? 1 : hNum + 1];
        const midEcl = norm(eclCusp + norm(nextCusp - eclCusp) / 2);
        const midA = e2c(midEcl, ascLon);
        const [x,y] = pol(cx, cy, (rHouseOut + rHouseIn) / 2, midA);
        return (
          <text key={'hn'+i} x={x} y={y} textAnchor="middle" dominantBaseline="central"
            fill="#000" fontSize={9 * f} fontFamily="serif" fontWeight="500">{hNum}</text>
        );
      })}

      {/* ── Aspect lines (inside inner circle) ── */}
      {aspects.map((asp, i) => {
        const [x1,y1] = pol(cx, cy, rInner - 1, asp.a.chartAngle);
        const [x2,y2] = pol(cx, cy, rInner - 1, asp.b.chartAngle);
        // Midpoint for aspect symbol
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        return (
          <g key={'al'+i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={asp.color} strokeWidth={asp.w * f} opacity={0.85}
              strokeDasharray={asp.dash || 'none'} />
            {asp.angle !== 0 && asp.angle !== 180 && (
              <text x={mx} y={my} textAnchor="middle" dominantBaseline="central"
                fill={asp.color} fontSize={7 * f} fontFamily="serif"
                style={{ paintOrder: 'stroke', stroke: '#FFF', strokeWidth: 2 }}>
                {asp.sym}
              </text>
            )}
          </g>
        );
      })}

      {/* ── ASC / MC axis arrows ── */}
      {[
        { label: 'ASC', ecl: ascLon, dir: 1  },
        { label: 'MC',  ecl: mcLon,  dir: 1  },
      ].map((a, i) => {
        const angle = e2c(a.ecl, ascLon);
        const [x1,y1] = pol(cx, cy, rInner, angle);
        const [x2,y2] = pol(cx, cy, rSignIn, angle);
        // Draw arrow at the outside end
        const arrowLen = 10 * f;
        const aw = 5 * f;
        const [ax, ay] = pol(cx, cy, rSignIn - arrowLen, angle);
        const perpAngle = (angle + 90) * Math.PI / 180;
        const [px, py] = [Math.cos(perpAngle) * aw, -Math.sin(perpAngle) * aw];
        return (
          <g key={'ax'+i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth={1.2 * f} />
            <polygon points={`${x2},${y2} ${ax+px},${ay+py} ${ax-px},${ay-py}`} fill="#000" />
          </g>
        );
      })}

      {/* ── Planets (glyph + deg + sign + min + Rx, stacked vertically) ── */}
      {bodies.map((b, i) => {
        // Band where planets live: from rSignIn inward to rHouseOut
        // Glyph placed closer to the zodiac (outer), info stacked inward
        const planetBand = rSignIn - rHouseOut;
        const glyphR  = rHouseOut + planetBand * 0.72;
        const degR    = rHouseOut + planetBand * 0.50;  // degree + sign glyph
        const minR    = rHouseOut + planetBand * 0.28;  // minutes
        const rxR     = rHouseOut + planetBand * 0.10;  // Rx

        const [gx,gy] = pol(cx, cy, glyphR, b.displayAngle);
        const [dx,dy] = pol(cx, cy, degR, b.displayAngle);
        const [mx,my] = pol(cx, cy, minR, b.displayAngle);
        const [rx,ry] = pol(cx, cy, rxR, b.displayAngle);

        // Tick mark at exact position on inside of zodiac ring
        const [tx1,ty1] = pol(cx, cy, rSignIn, b.chartAngle);
        const [tx2,ty2] = pol(cx, cy, rSignIn - 4 * f, b.chartAngle);

        const displaced = Math.abs(norm(b.displayAngle - b.chartAngle + 180) - 180) > 1.2;
        const signColor = ELEM_COL[ELEM[b.sign]];

        return (
          <g key={'b'+i}>
            {/* Tick at exact ecliptic position */}
            <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke={b.color} strokeWidth={1.2 * f} />
            {/* Leader line if displaced */}
            {displaced && (() => {
              const [lx,ly] = pol(cx, cy, glyphR + 10 * f, b.displayAngle);
              return <line x1={tx2} y1={ty2} x2={lx} y2={ly} stroke={b.color} strokeWidth={0.5 * f} opacity={0.5} />;
            })()}
            {/* Planet glyph */}
            <text x={gx} y={gy} textAnchor="middle" dominantBaseline="central"
              fill={b.color} fontSize={(b.isMajor ? 19 : 15) * f} fontFamily="serif">
              {b.symbol}
            </text>
            {/* Degree + sign glyph inline */}
            <text x={dx} y={dy} textAnchor="middle" dominantBaseline="central"
              fill="#000" fontSize={8 * f} fontFamily="serif">
              <tspan fontWeight="600">{b.deg}°</tspan>
              <tspan fill={signColor} fontSize={9 * f} dx={1 * f}>{SYM[b.sign]}</tspan>
            </text>
            {/* Minutes */}
            <text x={mx} y={my} textAnchor="middle" dominantBaseline="central"
              fill="#444" fontSize={7.5 * f} fontFamily="serif">
              {String(b.min).padStart(2,'0')}'
            </text>
            {/* Rx */}
            {b.retrograde && (
              <text x={rx} y={ry} textAnchor="middle" dominantBaseline="central"
                fill="#B22222" fontSize={7 * f} fontFamily="serif" fontWeight="700" fontStyle="italic">
                Rx
              </text>
            )}
          </g>
        );
      })}

      {/* ── Cusp degree labels OUTSIDE the wheel (degree / sign / minutes stacked) ── */}
      {cusps.slice(1).map((eclCusp, i) => {
        const hNum = i + 1;
        const angle = e2c(eclCusp, ascLon);
        const c = fmtDeg(eclCusp);
        const [x,y] = pol(cx, cy, rOuter + 18 * f, angle);
        const signColor = ELEM_COL[ELEM[c.sign]];
        const isAxis = [1, 4, 7, 10].includes(hNum);

        return (
          <g key={'cl'+i}>
            <text x={x} y={y - 9 * f} textAnchor="middle" dominantBaseline="central"
              fill="#000" fontSize={9 * f} fontFamily="serif" fontWeight={isAxis ? '700' : '500'}>
              {c.d}°
            </text>
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
              fill={signColor} fontSize={11 * f} fontFamily="serif">
              {c.sym}
            </text>
            <text x={x} y={y + 9 * f} textAnchor="middle" dominantBaseline="central"
              fill="#000" fontSize={8 * f} fontFamily="serif">
              {String(c.m).padStart(2,'0')}'
            </text>
          </g>
        );
      })}
    </svg>
  );
}
