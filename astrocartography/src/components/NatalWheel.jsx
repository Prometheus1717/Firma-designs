import { useMemo } from 'react';

const ZODIAC = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_SYM = { Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍', Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓' };
const ELEM = { Aries:'Fire', Taurus:'Earth', Gemini:'Air', Cancer:'Water', Leo:'Fire', Virgo:'Earth', Libra:'Air', Scorpio:'Water', Sagittarius:'Fire', Capricorn:'Earth', Aquarius:'Air', Pisces:'Water' };
const ELEM_C = { Fire:'#F04060', Earth:'#00D88A', Air:'#5BA8D4', Water:'#4868B8' };
const PCOL = { Sun:'#E8A838', Moon:'#C0C0C0', Mercury:'#5BA8D4', Venus:'#D4729A', Mars:'#D45050', Jupiter:'#8068C0', Saturn:'#887058', Uranus:'#40B0A0', Neptune:'#4868B8', Pluto:'#7048A0' };

const ASPECTS = [
  { angle: 0, orb: 8, color: '#E8A838', dash: '' },
  { angle: 60, orb: 5, color: '#5BA8D4', dash: '3,2' },
  { angle: 90, orb: 7, color: '#F04060', dash: '' },
  { angle: 120, orb: 8, color: '#00D88A', dash: '' },
  { angle: 180, orb: 8, color: '#D45050', dash: '5,3' },
];

function norm(a) { return ((a % 360) + 360) % 360; }

// Ecliptic longitude → chart angle. ASC fixed at 9-o'clock (180°).
// Zodiac flows counter-clockwise (increasing ecliptic = decreasing chart angle).
function ecl2chart(eclLon, ascLon) {
  return norm(180 - (eclLon - ascLon));
}

function pol(cx, cy, r, deg) {
  const rad = deg * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
}

// Porphyry house cusps from ASC & MC
function porphyryHouses(ascLon, mcLon) {
  const dsc = norm(ascLon + 180);
  const ic = norm(mcLon + 180);
  function trisect(from, to) {
    let span = norm(to - from);
    return [norm(from + span / 3), norm(from + 2 * span / 3)];
  }
  // Quadrant 1: IC → ASC (houses 1,2,3 — cusps 2,3)
  const [c2, c3] = trisect(ic, ascLon);
  // Quadrant 2: ASC → MC (houses 10,11,12 — cusps 11,12)
  const [c11, c12] = trisect(ascLon, mcLon);
  // Quadrant 3: MC → DSC (houses 7,8,9 — cusps 8,9)
  const [c8, c9] = trisect(mcLon, dsc);
  // Quadrant 4: DSC → IC (houses 4,5,6 — cusps 5,6)
  const [c5, c6] = trisect(dsc, ic);

  // cusps array indexed by house number (1-based)
  return [null, ascLon, c2, c3, ic, c5, c6, dsc, c8, c9, mcLon, c11, c12];
}

export default function NatalWheel({ planets, natal, size = 380 }) {
  const chart = useMemo(() => {
    if (!planets || !natal?.asc) return null;
    const ascLon = natal.asc.fullDeg;
    const mcLon = natal.mc.fullDeg;

    // Radii
    const R = size / 2;
    const cx = R, cy = R;
    const r1 = R * 0.96;  // outermost edge
    const r2 = R * 0.88;  // outer sign ring boundary
    const r3 = R * 0.76;  // inner sign ring boundary (planet area starts)
    const r4 = R * 0.42;  // inner circle (aspect area)

    // Zodiac signs
    const signs = ZODIAC.map((name, i) => {
      const eclStart = i * 30;
      return { name, sym: SIGN_SYM[name], elem: ELEM[name], eclStart };
    });

    // Planet positions
    const pls = planets.map(p => ({
      ...p,
      chartAngle: ecl2chart(p.fullDeg, ascLon),
      displayAngle: ecl2chart(p.fullDeg, ascLon), // will be adjusted for collision
      color: PCOL[p.id] || '#8098B0',
    }));

    // Sort and spread overlapping planets (label collision avoidance)
    pls.sort((a, b) => a.chartAngle - b.chartAngle);
    const minGap = 14;
    for (let pass = 0; pass < 5; pass++) {
      for (let i = 0; i < pls.length; i++) {
        const j = (i + 1) % pls.length;
        let diff = norm(pls[j].displayAngle - pls[i].displayAngle);
        if (diff < minGap && diff > 0) {
          const shift = (minGap - diff) / 2;
          pls[i].displayAngle = norm(pls[i].displayAngle - shift);
          pls[j].displayAngle = norm(pls[j].displayAngle + shift);
        }
      }
    }

    // House cusps (Porphyry)
    const cusps = porphyryHouses(ascLon, mcLon);

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

    return { cx, cy, r1, r2, r3, r4, signs, planets: pls, cusps, aspects, ascLon, mcLon };
  }, [planets, natal, size]);

  if (!chart) return null;
  const { cx, cy, r1, r2, r3, r4, signs, cusps, aspects, ascLon, mcLon } = chart;
  const pls = chart.planets;

  // Helper for arc segment path (sweep is always 30° for signs, counter-clockwise in chart = clockwise in SVG)
  function signArc(rOuter, rInner, startEcl, spanDeg) {
    const a1 = ecl2chart(startEcl, ascLon);
    const a2 = ecl2chart(startEcl + spanDeg, ascLon);
    const p1 = pol(cx, cy, rOuter, a1);
    const p2 = pol(cx, cy, rOuter, a2);
    const p3 = pol(cx, cy, rInner, a2);
    const p4 = pol(cx, cy, rInner, a1);
    return `M${p1[0]},${p1[1]} A${rOuter},${rOuter} 0 0,0 ${p2[0]},${p2[1]} L${p3[0]},${p3[1]} A${rInner},${rInner} 0 0,1 ${p4[0]},${p4[1]} Z`;
  }

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', userSelect: 'none' }}>

      {/* Background */}
      <circle cx={cx} cy={cy} r={r1 + 2} fill="#0A1018" />

      {/* ── Outer element color ring ── */}
      {signs.map((s, i) => {
        const ec = ELEM_C[s.elem];
        return <path key={'er' + i} d={signArc(r1, r2, s.eclStart, 30)} fill={ec + '10'} stroke={ec} strokeWidth="1.5" strokeOpacity="0.3" />;
      })}

      {/* Outer circle borders */}
      <circle cx={cx} cy={cy} r={r1} fill="none" stroke="#2A3A50" strokeWidth="0.8" />
      <circle cx={cx} cy={cy} r={r2} fill="none" stroke="#1A2840" strokeWidth="0.6" />

      {/* ── Zodiac sign ring (between r2 and r3) ── */}
      {signs.map((s, i) => {
        const ec = ELEM_C[s.elem];
        return <path key={'sr' + i} d={signArc(r2, r3, s.eclStart, 30)} fill={ec + '06'} stroke="#1A2840" strokeWidth="0.4" />;
      })}

      {/* Sign divider lines (outer ring through sign ring) */}
      {signs.map((s, i) => {
        const angle = ecl2chart(s.eclStart, ascLon);
        const p1 = pol(cx, cy, r1, angle);
        const p2 = pol(cx, cy, r3, angle);
        return <line key={'sd' + i} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke="#1A2840" strokeWidth="0.6" />;
      })}

      {/* Sign symbols in sign ring */}
      {signs.map((s, i) => {
        const midEcl = s.eclStart + 15;
        const angle = ecl2chart(midEcl, ascLon);
        const p = pol(cx, cy, (r2 + r3) / 2, angle);
        const ec = ELEM_C[s.elem];
        return (
          <text key={'ss' + i} x={p[0]} y={p[1]} textAnchor="middle" dominantBaseline="central"
            fill={ec} fontSize={size * 0.038} fontWeight="600" opacity="0.85">{s.sym}</text>
        );
      })}

      {/* Degree numbers at sign boundaries (on outer ring) */}
      {signs.map((s, i) => {
        const angle = ecl2chart(s.eclStart, ascLon);
        const p = pol(cx, cy, (r1 + r2) / 2, angle + 2.5);
        // Degree at this boundary in the previous sign = ends at 30° of prev sign
        // Show the cusp degree for context
        return (
          <text key={'dn' + i} x={p[0]} y={p[1]} textAnchor="middle" dominantBaseline="central"
            fill="#3A5068" fontSize={size * 0.018} fontWeight="600">{i * 30 % 30 || ''}</text>
        );
      })}

      {/* Degree ticks every 5° on sign ring */}
      {Array.from({ length: 72 }, (_, i) => {
        const deg = i * 5;
        const angle = ecl2chart(deg, ascLon);
        const isMajor = deg % 10 === 0;
        const from = pol(cx, cy, r3, angle);
        const to = pol(cx, cy, r3 + (r2 - r3) * (isMajor ? 0.18 : 0.10), angle);
        return <line key={'tk' + i} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke="#1A284060" strokeWidth="0.3" />;
      })}

      {/* Inner sign ring border */}
      <circle cx={cx} cy={cy} r={r3} fill="none" stroke="#1A2840" strokeWidth="0.6" />

      {/* ── House cusp lines ── */}
      {cusps.slice(1).map((eclCusp, i) => {
        const houseNum = i + 1;
        const angle = ecl2chart(eclCusp, ascLon);
        const isAxis = houseNum === 1 || houseNum === 4 || houseNum === 7 || houseNum === 10;
        const outerP = pol(cx, cy, r3, angle);
        const innerP = pol(cx, cy, r4, angle);
        // House number label
        const nextCusp = cusps[houseNum === 12 ? 1 : houseNum + 1];
        const midHouseEcl = norm(eclCusp + norm(nextCusp - eclCusp) / 2);
        const midAngle = ecl2chart(midHouseEcl, ascLon);
        const labelP = pol(cx, cy, r4 + (r3 - r4) * 0.18, midAngle);
        return (
          <g key={'hc' + i}>
            <line x1={outerP[0]} y1={outerP[1]} x2={innerP[0]} y2={innerP[1]}
              stroke={isAxis ? '#00D88A' : '#1A2840'} strokeWidth={isAxis ? 1.2 : 0.5}
              opacity={isAxis ? 0.5 : 0.6} />
            <text x={labelP[0]} y={labelP[1]} textAnchor="middle" dominantBaseline="central"
              fill="#2A3A50" fontSize={size * 0.024} fontWeight="700">{houseNum}</text>
          </g>
        );
      })}

      {/* Inner circle */}
      <circle cx={cx} cy={cy} r={r4} fill="#0A1018" stroke="#1A2840" strokeWidth="0.8" />

      {/* ── Aspect lines inside inner circle ── */}
      {aspects.map((a, i) => {
        const p1 = pol(cx, cy, r4 - 1, pls[a.i].chartAngle);
        const p2 = pol(cx, cy, r4 - 1, pls[a.j].chartAngle);
        return (
          <line key={'asp' + i} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]}
            stroke={a.color} strokeWidth="0.7" opacity="0.4"
            strokeDasharray={a.dash || 'none'} />
        );
      })}

      {/* ── Axis labels (ASC, MC, DC, IC) ── */}
      {[
        { label: 'ASC', ecl: natal.asc.fullDeg, color: '#00D88A', deg: natal.asc.deg, min: natal.asc.min, sign: natal.asc.sign },
        { label: 'DC', ecl: norm(natal.asc.fullDeg + 180), color: '#5A7088' },
        { label: 'MC', ecl: mcLon, color: '#E8A838', deg: natal.mc.deg, min: natal.mc.min, sign: natal.mc.sign },
        { label: 'IC', ecl: norm(mcLon + 180), color: '#5A7088' },
      ].map((a, i) => {
        const angle = ecl2chart(a.ecl, natal.asc.fullDeg);
        const labelP = pol(cx, cy, r1 + size * 0.001, angle);
        // Axis line extending outside the wheel
        const lineO = pol(cx, cy, r1 + size * 0.02, angle);
        const lineI = pol(cx, cy, r4, angle);
        return (
          <g key={'ax' + i}>
            {(i === 0 || i === 2) && <line x1={lineO[0]} y1={lineO[1]} x2={lineI[0]} y2={lineI[1]}
              stroke={a.color} strokeWidth="1" opacity="0.3" />}
            {/* Label with degree info */}
            {a.deg !== undefined ? (
              <g>
                {/* Background for readability */}
                <text x={labelP[0]} y={labelP[1] - size * 0.015} textAnchor="middle" dominantBaseline="central"
                  fill={a.color} fontSize={size * 0.024} fontWeight="800" letterSpacing="1">{a.label}</text>
                <text x={labelP[0]} y={labelP[1] + size * 0.015} textAnchor="middle" dominantBaseline="central"
                  fill={a.color} fontSize={size * 0.018} fontWeight="600" opacity="0.7">
                  {SIGN_SYM[a.sign]} {a.deg}°{String(a.min).padStart(2, '0')}'
                </text>
              </g>
            ) : (
              <text x={labelP[0]} y={labelP[1]} textAnchor="middle" dominantBaseline="central"
                fill={a.color} fontSize={size * 0.02} fontWeight="700" opacity="0.5">{a.label}</text>
            )}
          </g>
        );
      })}

      {/* ── Planets ── */}
      {pls.map((p, i) => {
        // Tick mark at exact ecliptic position on sign ring inner edge
        const exactAngle = p.chartAngle;
        const tickO = pol(cx, cy, r3, exactAngle);
        const tickI = pol(cx, cy, r3 - (r3 - r4) * 0.08, exactAngle);

        // Planet info positioned using displayAngle (collision-avoided)
        const dispAngle = p.displayAngle;
        const symbolR = r3 - (r3 - r4) * 0.25;
        const infoR = r3 - (r3 - r4) * 0.48;
        const symP = pol(cx, cy, symbolR, dispAngle);
        const infoP = pol(cx, cy, infoR, dispAngle);

        // Connecting line from tick to symbol if displaced
        const connO = pol(cx, cy, r3 - 1, exactAngle);
        const connI = pol(cx, cy, symbolR + size * 0.015, dispAngle);

        return (
          <g key={'pl' + i}>
            {/* Tick on sign ring */}
            <line x1={tickO[0]} y1={tickO[1]} x2={tickI[0]} y2={tickI[1]}
              stroke={p.color} strokeWidth="1" opacity="0.6" />
            {/* Connector line */}
            <line x1={connO[0]} y1={connO[1]} x2={connI[0]} y2={connI[1]}
              stroke={p.color} strokeWidth="0.4" opacity="0.3" />
            {/* Planet symbol */}
            <text x={symP[0]} y={symP[1]} textAnchor="middle" dominantBaseline="central"
              fill={p.color} fontSize={size * 0.042} fontWeight="700">{p.symbol}</text>
            {/* Degree + sign + minute info */}
            <text x={infoP[0]} y={infoP[1]} textAnchor="middle" dominantBaseline="central"
              fill="#8098B0" fontSize={size * 0.02} fontWeight="600">
              {p.deg}°{String(p.min).padStart(2, '0')}' {SIGN_SYM[p.sign]}
            </text>
            {/* Retrograde marker */}
            {p.retrograde && (
              <text x={symP[0] + size * 0.025} y={symP[1] - size * 0.015} textAnchor="middle"
                fill="#F04060" fontSize={size * 0.016} fontWeight="800">Rx</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
