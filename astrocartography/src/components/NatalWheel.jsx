import { useMemo } from 'react';

// Zodiac order & symbols
const ZODIAC = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SYM = { Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍', Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓' };
const ELEM = { Aries:'Fire', Taurus:'Earth', Gemini:'Air', Cancer:'Water', Leo:'Fire', Virgo:'Earth', Libra:'Air', Scorpio:'Water', Sagittarius:'Fire', Capricorn:'Earth', Aquarius:'Air', Pisces:'Water' };

// Element arc colors — matching the reference image (outer ring)
const ELEM_ARC = { Fire:'#D44040', Earth:'#8BA83A', Air:'#4A90D0', Water:'#D0A030' };

// Planet colors — traditional astrology colors matching reference
const PC = {
  Sun:'#C08020', Moon:'#6A6A80', Mercury:'#2A8A8A', Venus:'#8AA030',
  Mars:'#C83030', Jupiter:'#A03050', Saturn:'#8A7040',
  Uranus:'#3070C0', Neptune:'#4060A8', Pluto:'#803050',
};

// Aspects
const ASPECTS = [
  { angle: 0,   orb: 8, color: '#A09030', dash: '' },       // Conjunction — gold
  { angle: 60,  orb: 5, color: '#4A70B0', dash: '4,3' },    // Sextile — blue dashed
  { angle: 90,  orb: 7, color: '#C04040', dash: '' },        // Square — red
  { angle: 120, orb: 8, color: '#40A040', dash: '' },        // Trine — green
  { angle: 180, orb: 8, color: '#C04040', dash: '6,3' },     // Opposition — red dashed
];

function norm(a) { return ((a % 360) + 360) % 360; }

// Ecliptic → chart angle. ASC at 9-o'clock (180°). Counter-clockwise = increasing ecliptic.
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

export default function NatalWheel({ planets, natal, size = 380 }) {
  const chart = useMemo(() => {
    if (!planets || !natal?.asc) return null;
    const ascLon = natal.asc.fullDeg;
    const mcLon = natal.mc.fullDeg;
    const R = size / 2, cx = R, cy = R;

    // Ring radii (from outside in)
    const rOuter   = R * 0.97;  // outermost edge
    const rElemIn  = R * 0.93;  // inner edge of element color ring
    const rSignOut = R * 0.93;  // outer edge of zodiac sign band
    const rSignIn  = R * 0.80;  // inner edge of zodiac sign band
    const rInner   = R * 0.38;  // inner circle (aspect area)

    // Zodiac signs
    const signs = ZODIAC.map((name, i) => ({
      name, sym: SYM[name], elem: ELEM[name], eclStart: i * 30,
    }));

    // Planets with chart angles
    const pls = planets.map(p => ({
      ...p,
      chartAngle: e2c(p.fullDeg, ascLon),
      displayAngle: e2c(p.fullDeg, ascLon),
      color: PC[p.id] || '#555',
    }));

    // Collision avoidance for planet labels
    pls.sort((a, b) => a.displayAngle - b.displayAngle);
    const gap = 16;
    for (let pass = 0; pass < 6; pass++) {
      for (let i = 0; i < pls.length; i++) {
        const j = (i + 1) % pls.length;
        let d = norm(pls[j].displayAngle - pls[i].displayAngle);
        if (d < gap && d > 0) {
          const s = (gap - d) / 2;
          pls[i].displayAngle = norm(pls[i].displayAngle - s);
          pls[j].displayAngle = norm(pls[j].displayAngle + s);
        }
      }
    }

    // House cusps
    const cusps = porphyry(ascLon, mcLon);

    // Aspects
    const aspects = [];
    for (let i = 0; i < pls.length; i++) {
      for (let j = i + 1; j < pls.length; j++) {
        const diff = Math.abs(pls[i].fullDeg - pls[j].fullDeg);
        const ang = diff > 180 ? 360 - diff : diff;
        for (const asp of ASPECTS) {
          if (Math.abs(ang - asp.angle) <= asp.orb) {
            aspects.push({ i, j, color: asp.color, dash: asp.dash });
            break;
          }
        }
      }
    }

    return { cx, cy, rOuter, rElemIn, rSignOut, rSignIn, rInner, signs, planets: pls, cusps, aspects, ascLon, mcLon };
  }, [planets, natal, size]);

  if (!chart) return null;
  const { cx, cy, rOuter, rElemIn, rSignOut, rSignIn, rInner, signs, cusps, aspects, ascLon, mcLon } = chart;
  const pls = chart.planets;

  // Arc path for sign/element segments
  function arcSeg(rO, rI, eclStart, span) {
    const a1 = e2c(eclStart, ascLon);
    const a2 = e2c(eclStart + span, ascLon);
    const p1 = pol(cx, cy, rO, a1), p2 = pol(cx, cy, rO, a2);
    const p3 = pol(cx, cy, rI, a2), p4 = pol(cx, cy, rI, a1);
    return `M${p1[0]},${p1[1]} A${rO},${rO} 0 0,0 ${p2[0]},${p2[1]} L${p3[0]},${p3[1]} A${rI},${rI} 0 0,1 ${p4[0]},${p4[1]} Z`;
  }

  const fs = size / 380; // font scale factor

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', fontFamily: 'serif', userSelect: 'none' }}>

      {/* Outer background */}
      <circle cx={cx} cy={cy} r={rOuter + 6} fill="#1A1020" />

      {/* ── Element color ring (outermost) ── */}
      {signs.map((s, i) => (
        <path key={'e' + i} d={arcSeg(rOuter, rElemIn, s.eclStart, 30)}
          fill={ELEM_ARC[s.elem]} fillOpacity="0.7" stroke={ELEM_ARC[s.elem]} strokeWidth="0.5" strokeOpacity="0.9" />
      ))}

      {/* ── Zodiac sign band (white/cream) ── */}
      {signs.map((s, i) => (
        <path key={'s' + i} d={arcSeg(rSignOut, rSignIn, s.eclStart, 30)}
          fill="#F8F4EC" stroke="#C8C0B0" strokeWidth="0.5" />
      ))}

      {/* Sign divider lines through sign band */}
      {signs.map((s, i) => {
        const angle = e2c(s.eclStart, ascLon);
        const p1 = pol(cx, cy, rOuter, angle), p2 = pol(cx, cy, rSignIn, angle);
        return <line key={'d' + i} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke="#A09880" strokeWidth="0.8" />;
      })}

      {/* Sign symbols centered in band */}
      {signs.map((s, i) => {
        const mid = e2c(s.eclStart + 15, ascLon);
        const p = pol(cx, cy, (rSignOut + rSignIn) / 2, mid);
        return (
          <text key={'sym' + i} x={p[0]} y={p[1]} textAnchor="middle" dominantBaseline="central"
            fill="#2A2020" fontSize={18 * fs} fontWeight="400">{s.sym}</text>
        );
      })}

      {/* Degree numbers at sign boundaries — degree of cusp in outer ring area */}
      {signs.map((s, i) => {
        const angle = e2c(s.eclStart, ascLon);
        const p = pol(cx, cy, (rOuter + rElemIn) / 2 + 1, angle + 3);
        return (
          <text key={'deg' + i} x={p[0]} y={p[1]} textAnchor="middle" dominantBaseline="central"
            fill="#F8F4EC" fontSize={7 * fs} fontWeight="600" fontFamily="JetBrains Mono, monospace">{i * 30 % 360}</text>
        );
      })}

      {/* ── House / planet area (white background) ── */}
      <circle cx={cx} cy={cy} r={rSignIn} fill="#F8F4EC" stroke="#C8C0B0" strokeWidth="0.5" />

      {/* ── Inner circle (dark, for aspects) ── */}
      <circle cx={cx} cy={cy} r={rInner} fill="#1A1020" stroke="#3A3050" strokeWidth="1.2" />

      {/* ── House cusp lines ── */}
      {cusps.slice(1).map((eclCusp, i) => {
        const hNum = i + 1;
        const angle = e2c(eclCusp, ascLon);
        const isAxis = hNum === 1 || hNum === 4 || hNum === 7 || hNum === 10;
        const pO = pol(cx, cy, rSignIn, angle);
        const pI = pol(cx, cy, rInner, angle);
        // House number at midpoint of house
        const nextCusp = cusps[hNum === 12 ? 1 : hNum + 1];
        const midEcl = norm(eclCusp + norm(nextCusp - eclCusp) / 2);
        const midA = e2c(midEcl, ascLon);
        const hP = pol(cx, cy, rInner + (rSignIn - rInner) * 0.15, midA);
        // Degree info at cusp
        const cuspZodiac = Math.floor(eclCusp / 30);
        const cuspDeg = Math.floor(eclCusp - cuspZodiac * 30);
        const cuspMin = Math.floor((eclCusp - cuspZodiac * 30 - cuspDeg) * 60);
        const degP = pol(cx, cy, rSignIn - 6 * fs, angle + (isAxis ? 4 : 3));
        return (
          <g key={'h' + i}>
            <line x1={pO[0]} y1={pO[1]} x2={pI[0]} y2={pI[1]}
              stroke={isAxis ? '#4A4060' : '#B0A890'} strokeWidth={isAxis ? 1.5 : 0.6} />
            {/* House number */}
            <text x={hP[0]} y={hP[1]} textAnchor="middle" dominantBaseline="central"
              fill="#8A8070" fontSize={10 * fs} fontWeight="400" fontFamily="JetBrains Mono, monospace">{hNum}</text>
            {/* Cusp degree */}
            {!isAxis && (
              <text x={degP[0]} y={degP[1]} textAnchor="middle" dominantBaseline="central"
                fill="#A09880" fontSize={6 * fs} fontFamily="JetBrains Mono, monospace">{cuspDeg}</text>
            )}
          </g>
        );
      })}

      {/* ── Axis labels (ASC, MC, DC, IC) ── */}
      {[
        { label: 'ASC', ecl: natal.asc.fullDeg, deg: natal.asc.deg, min: natal.asc.min, sign: natal.asc.sign, color: '#2A2020', bold: true },
        { label: 'DC', ecl: norm(natal.asc.fullDeg + 180), color: '#8A8070' },
        { label: 'MC', ecl: mcLon, deg: natal.mc.deg, min: natal.mc.min, sign: natal.mc.sign, color: '#2A2020', bold: true },
        { label: 'IC', ecl: norm(mcLon + 180), color: '#8A8070' },
      ].map((a, i) => {
        const angle = e2c(a.ecl, ascLon);
        // Extended axis line
        const axO = pol(cx, cy, rSignIn + 2, angle);
        const axI = pol(cx, cy, rInner, angle);
        // Label position outside zodiac ring
        const lP = pol(cx, cy, rSignIn + 14 * fs, angle);
        const dP = pol(cx, cy, rSignIn + 6 * fs, angle);
        return (
          <g key={'ax' + i}>
            <line x1={axO[0]} y1={axO[1]} x2={axI[0]} y2={axI[1]}
              stroke={a.bold ? '#4A4060' : '#B0A890'} strokeWidth={a.bold ? 1.5 : 0.6} />
            {/* Label */}
            <text x={lP[0]} y={lP[1]} textAnchor="middle" dominantBaseline="central"
              fill={a.color} fontSize={a.bold ? 11 * fs : 8 * fs} fontWeight={a.bold ? '700' : '400'}
              fontFamily="JetBrains Mono, monospace">{a.label}</text>
            {/* Degree info for ASC/MC */}
            {a.deg !== undefined && (
              <text x={dP[0]} y={dP[1]} textAnchor="middle" dominantBaseline="central"
                fill="#5A5040" fontSize={7 * fs} fontFamily="JetBrains Mono, monospace">
                {a.deg}°{String(a.min).padStart(2, '0')}'
              </text>
            )}
          </g>
        );
      })}

      {/* ── Aspect lines ── */}
      {aspects.map((a, i) => {
        const p1 = pol(cx, cy, rInner - 2, pls[a.i].chartAngle);
        const p2 = pol(cx, cy, rInner - 2, pls[a.j].chartAngle);
        return (
          <line key={'a' + i} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]}
            stroke={a.color} strokeWidth={1.2} opacity="0.7"
            strokeDasharray={a.dash || 'none'} />
        );
      })}

      {/* ── Planets ── */}
      {pls.map((p, i) => {
        // Tick at exact position on inner edge of sign band
        const exactA = p.chartAngle;
        const dispA = p.displayAngle;
        const tickO = pol(cx, cy, rSignIn, exactA);
        const tickI = pol(cx, cy, rSignIn - 4 * fs, exactA);

        // Planet symbol placement (in house area)
        const symR = rSignIn - (rSignIn - rInner) * 0.30;
        const symP = pol(cx, cy, symR, dispA);

        // Degree + sign info below/beside planet symbol
        const infoR = rSignIn - (rSignIn - rInner) * 0.50;
        const infoP = pol(cx, cy, infoR, dispA);

        // Connector from tick to planet
        const connEnd = pol(cx, cy, symR + 8 * fs, dispA);

        return (
          <g key={'p' + i}>
            {/* Tick mark on sign ring */}
            <line x1={tickO[0]} y1={tickO[1]} x2={tickI[0]} y2={tickI[1]}
              stroke={p.color} strokeWidth="1.5" />
            {/* Thin connector */}
            <line x1={tickI[0]} y1={tickI[1]} x2={connEnd[0]} y2={connEnd[1]}
              stroke={p.color} strokeWidth="0.5" opacity="0.4" />
            {/* Planet symbol */}
            <text x={symP[0]} y={symP[1]} textAnchor="middle" dominantBaseline="central"
              fill={p.color} fontSize={16 * fs} fontWeight="700">{p.symbol}</text>
            {/* Degree info: "deg° min' sign" */}
            <text x={infoP[0]} y={infoP[1]} textAnchor="middle" dominantBaseline="central"
              fill="#4A4030" fontSize={7.5 * fs} fontFamily="JetBrains Mono, monospace" fontWeight="600">
              {p.deg} {SYM[p.sign]} {String(p.min).padStart(2, '0')}
            </text>
            {/* Retrograde */}
            {p.retrograde && (
              <text x={symP[0] + 10 * fs} y={symP[1] - 6 * fs} textAnchor="start" dominantBaseline="central"
                fill="#C83030" fontSize={6 * fs} fontFamily="JetBrains Mono, monospace" fontWeight="700">Rx</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
