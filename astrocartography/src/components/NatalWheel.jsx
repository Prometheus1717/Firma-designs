import { useMemo } from 'react';

const ZODIAC = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SYM = { Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍', Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓' };
const ELEM = { Aries:'Fire', Taurus:'Earth', Gemini:'Air', Cancer:'Water', Leo:'Fire', Virgo:'Earth', Libra:'Air', Scorpio:'Water', Sagittarius:'Fire', Capricorn:'Earth', Aquarius:'Air', Pisces:'Water' };

const ELEM_COL  = { Fire:'#E53935', Earth:'#43A047', Air:'#1E88E5', Water:'#FB8C00' };
const ELEM_DARK = { Fire:'#C62828', Earth:'#2E7D32', Air:'#1565C0', Water:'#EF6C00' };

const PCOL = {
  Sun:'#D4880C', Moon:'#5C6BC0', Mercury:'#7CB342', Venus:'#EC407A',
  Mars:'#E53935', Jupiter:'#5C6BC0', Saturn:'#8D6E63',
  Uranus:'#00838F', Neptune:'#5E35B1', Pluto:'#546E7A',
  Node:'#5C6BC0', Lilith:'#6D4C41', Fortune:'#78909C',
};

const BSYM = {
  Sun:'☉', Moon:'☽', Mercury:'☿', Venus:'♀', Mars:'♂',
  Jupiter:'♃', Saturn:'♄', Uranus:'♅', Neptune:'♆', Pluto:'♇',
  Node:'☊', Lilith:'⚸', Fortune:'⊗',
};

const ASPECTS = [
  { angle: 0,   orb: 8, color: '#66BB6A', dash: '',    w: 1.0 },
  { angle: 60,  orb: 5, color: '#42A5F5', dash: '4,3', w: 0.8 },
  { angle: 90,  orb: 7, color: '#E53935', dash: '',    w: 1.1 },
  { angle: 120, orb: 7, color: '#42A5F5', dash: '',    w: 1.1 },
  { angle: 150, orb: 3, color: '#66BB6A', dash: '3,2', w: 0.7 },
  { angle: 180, orb: 8, color: '#E53935', dash: '',    w: 1.3 },
];

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

export default function NatalWheel({ planets, natal, houseCusps, extras = [], size = 480 }) {
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

    // Ring radii (matching TimePassages proportions)
    const rOuter   = R * 0.985;
    const rElemIn  = R * 0.955;  // thin outer element strip
    const rSignIn  = R * 0.815;  // inner edge of sign band (wide band)
    const rInner   = R * 0.42;   // inner aspect circle

    const bodies = [
      ...planets.map(p => ({
        id: p.id, symbol: BSYM[p.id] || p.symbol, sign: p.sign,
        deg: p.deg, min: p.min, fullDeg: p.fullDeg,
        retrograde: p.retrograde, color: PCOL[p.id] || '#555',
        isMajor: true,
      })),
      ...(extras || []).map(e => ({
        id: e.id, symbol: BSYM[e.id] || '?', sign: e.sign,
        deg: e.deg, min: e.min, fullDeg: e.fullDeg,
        retrograde: !!e.retrograde, color: PCOL[e.id] || '#555',
        isMajor: false,
      })),
    ];

    bodies.forEach(b => { b.chartAngle = e2c(b.fullDeg, ascLon); b.displayAngle = b.chartAngle; });
    bodies.sort((a, b) => a.displayAngle - b.displayAngle);
    const minGap = 12;
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

    return { cx, cy, R, rOuter, rElemIn, rSignIn, rInner, bodies, cusps, aspects, ascLon, mcLon };
  }, [planets, natal, houseCusps, extras, size]);

  if (!chart) return null;
  const { cx, cy, R, rOuter, rElemIn, rSignIn, rInner, bodies, cusps, aspects, ascLon, mcLon } = chart;
  const f = size / 480;

  const arc = (rO, rI, eclStart, span) => {
    const a1 = e2c(eclStart, ascLon), a2 = e2c(eclStart + span, ascLon);
    const [x1,y1] = pol(cx, cy, rO, a1), [x2,y2] = pol(cx, cy, rO, a2);
    const [x3,y3] = pol(cx, cy, rI, a2), [x4,y4] = pol(cx, cy, rI, a1);
    return `M${x1},${y1} A${rO},${rO} 0 0,0 ${x2},${y2} L${x3},${y3} A${rI},${rI} 0 0,1 ${x4},${y4} Z`;
  };

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', userSelect: 'none' }}>

      {/* ── Outer background (dark, behind wheel) ── */}
      <circle cx={cx} cy={cy} r={R} fill="#1A0E2E" />

      {/* ── Thin element-colored outer ring ── */}
      {ZODIAC.map((name, i) => (
        <path key={'e'+i} d={arc(rOuter, rElemIn, i * 30, 30)}
          fill={ELEM_COL[ELEM[name]]} fillOpacity={0.7} stroke="none" />
      ))}
      <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="#8A7A9A" strokeWidth={0.6 * f} />

      {/* ── Sign band (WHITE background) ── */}
      {ZODIAC.map((_, i) => (
        <path key={'sb'+i} d={arc(rElemIn, rSignIn, i * 30, 30)}
          fill="#FDFAF4" stroke="none" />
      ))}

      {/* Sign divider lines through sign band */}
      {ZODIAC.map((_, i) => {
        const angle = e2c(i * 30, ascLon);
        const [x1,y1] = pol(cx, cy, rElemIn, angle);
        const [x2,y2] = pol(cx, cy, rSignIn, angle);
        return <line key={'sd'+i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C0B8A8" strokeWidth={0.6 * f} />;
      })}

      {/* Sign glyphs centered in band */}
      {ZODIAC.map((name, i) => {
        const mid = e2c(i * 30 + 15, ascLon);
        const [x,y] = pol(cx, cy, (rElemIn + rSignIn) / 2, mid);
        return (
          <text key={'sg'+i} x={x} y={y} textAnchor="middle" dominantBaseline="central"
            fill={ELEM_DARK[ELEM[name]]} fontSize={19 * f} fontFamily="serif">{SYM[name]}</text>
        );
      })}

      {/* Blue circle at sign band inner edge */}
      <circle cx={cx} cy={cy} r={rSignIn} fill="none" stroke="#5C6BC0" strokeWidth={1.2 * f} />
      <circle cx={cx} cy={cy} r={rElemIn} fill="none" stroke="#A09888" strokeWidth={0.5 * f} />

      {/* ── Planet zone + house area (WHITE background) ── */}
      <circle cx={cx} cy={cy} r={rSignIn - 0.8} fill="#FDFAF4" />

      {/* ── House cusp lines (SOLID, not dashed; axes thicker) ── */}
      {cusps.slice(1).map((eclCusp, i) => {
        const hNum = i + 1;
        const angle = e2c(eclCusp, ascLon);
        const isAxis = [1, 4, 7, 10].includes(hNum);
        const [x1,y1] = pol(cx, cy, rSignIn, angle);
        const [x2,y2] = pol(cx, cy, rInner, angle);
        return (
          <line key={'hl'+i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={isAxis ? '#706050' : '#C0B8A8'}
            strokeWidth={(isAxis ? 1.5 : 0.5) * f} />
        );
      })}

      {/* ── House numbers (small, positioned in inner zone) ── */}
      {cusps.slice(1).map((eclCusp, i) => {
        const hNum = i + 1;
        const nextCusp = cusps[hNum === 12 ? 1 : hNum + 1];
        const midEcl = norm(eclCusp + norm(nextCusp - eclCusp) / 2);
        const midA = e2c(midEcl, ascLon);
        const [x,y] = pol(cx, cy, rInner + (rSignIn - rInner) * 0.10, midA);
        return (
          <text key={'hn'+i} x={x} y={y} textAnchor="middle" dominantBaseline="central"
            fill="#A09888" fontSize={9 * f} fontFamily="serif">{hNum}</text>
        );
      })}

      {/* ── Inner aspect circle (light background) ── */}
      <circle cx={cx} cy={cy} r={rInner} fill="#FAF7F0" stroke="#C0B8A8" strokeWidth={0.6 * f} />

      {/* ── Aspect lines ── */}
      {aspects.map((asp, i) => {
        const [x1,y1] = pol(cx, cy, rInner - 1, asp.a.chartAngle);
        const [x2,y2] = pol(cx, cy, rInner - 1, asp.b.chartAngle);
        return (
          <line key={'al'+i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={asp.color} strokeWidth={asp.w * f} opacity={0.7}
            strokeDasharray={asp.dash || 'none'} strokeLinecap="round" />
        );
      })}

      {/* ── Planets: stacked vertically like TimePassages ── */}
      {/* Layout per planet (from outside in): tick → leader → [deg] [glyph] [sign] [min] [R] */}
      {bodies.map((b, i) => {
        const tickR1 = rSignIn;
        const tickR2 = rSignIn - 4 * f;
        const [tx1,ty1] = pol(cx, cy, tickR1, b.chartAngle);
        const [tx2,ty2] = pol(cx, cy, tickR2, b.chartAngle);

        const glyphR = rInner + (rSignIn - rInner) * 0.58;
        const [gx,gy] = pol(cx, cy, glyphR, b.displayAngle);

        const displaced = Math.abs(norm(b.displayAngle - b.chartAngle + 180) - 180) > 1.2;

        // Position stacked labels relative to glyph
        const degR  = rInner + (rSignIn - rInner) * 0.78;
        const [dx,dy] = pol(cx, cy, degR, b.displayAngle);
        const signR = rInner + (rSignIn - rInner) * 0.40;
        const [sx,sy] = pol(cx, cy, signR, b.displayAngle);
        const minR  = rInner + (rSignIn - rInner) * 0.25;
        const [mx,my] = pol(cx, cy, minR, b.displayAngle);

        return (
          <g key={'b'+i}>
            {/* Tick mark at exact position on sign ring */}
            <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke={b.color} strokeWidth={1.3 * f} />
            {/* Leader line if displaced */}
            {displaced && (() => {
              const [lx,ly] = pol(cx, cy, degR + 6 * f, b.displayAngle);
              return <line x1={tx2} y1={ty2} x2={lx} y2={ly} stroke={b.color} strokeWidth={0.5 * f} opacity={0.45} />;
            })()}
            {/* Degree number */}
            <text x={dx} y={dy} textAnchor="middle" dominantBaseline="central"
              fill="#504030" fontSize={8 * f} fontFamily="serif" fontWeight="600">{b.deg}</text>
            {/* Planet glyph */}
            <text x={gx} y={gy} textAnchor="middle" dominantBaseline="central"
              fill={b.color} fontSize={(b.isMajor ? 17 : 13) * f} fontFamily="serif">{b.symbol}</text>
            {/* Sign glyph */}
            <text x={sx} y={sy} textAnchor="middle" dominantBaseline="central"
              fill={ELEM_DARK[ELEM[b.sign]]} fontSize={10 * f} fontFamily="serif">{SYM[b.sign]}</text>
            {/* Minutes */}
            <text x={mx} y={my} textAnchor="middle" dominantBaseline="central"
              fill="#706050" fontSize={7 * f} fontFamily="serif">{String(b.min).padStart(2,'0')}</text>
            {/* Retrograde */}
            {b.retrograde && (() => {
              const retR = rInner + (rSignIn - rInner) * 0.13;
              const [rx,ry] = pol(cx, cy, retR, b.displayAngle);
              return <text x={rx} y={ry} textAnchor="middle" dominantBaseline="central"
                fill="#E53935" fontSize={7 * f} fontFamily="serif" fontWeight="700">R</text>;
            })()}
          </g>
        );
      })}

      {/* ── Cusp degree labels OUTSIDE the wheel ── */}
      {cusps.slice(1).map((eclCusp, i) => {
        const hNum = i + 1;
        const angle = e2c(eclCusp, ascLon);
        const c = fmtDeg(eclCusp);
        const labelR = rOuter + 3 * f;
        const [x,y] = pol(cx, cy, labelR, angle);

        const isAxis = [1, 4, 7, 10].includes(hNum);
        return (
          <g key={'cl'+i}>
            <text x={x} y={y - 8 * f} textAnchor="middle" dominantBaseline="central"
              fill="#D0C0B0" fontSize={7.5 * f} fontFamily="serif" fontWeight={isAxis ? '700' : '400'}>{c.d}</text>
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
              fill={ELEM_COL[ELEM[c.sign]]} fontSize={9 * f} fontFamily="serif">{c.sym}</text>
            <text x={x} y={y + 8 * f} textAnchor="middle" dominantBaseline="central"
              fill="#D0C0B0" fontSize={7 * f} fontFamily="serif">{String(c.m).padStart(2,'0')}</text>
          </g>
        );
      })}
    </svg>
  );
}
