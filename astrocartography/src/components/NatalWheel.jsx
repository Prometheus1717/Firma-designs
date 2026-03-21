import { useMemo } from 'react';

const ZODIAC = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_SYM = { Aries:'♈︎', Taurus:'♉︎', Gemini:'♊︎', Cancer:'♋︎', Leo:'♌︎', Virgo:'♍︎', Libra:'♎︎', Scorpio:'♏︎', Sagittarius:'♐︎', Capricorn:'♑︎', Aquarius:'♒︎', Pisces:'♓︎' };
const ELEM = { Aries:'Fire', Taurus:'Earth', Gemini:'Air', Cancer:'Water', Leo:'Fire', Virgo:'Earth', Libra:'Air', Scorpio:'Water', Sagittarius:'Fire', Capricorn:'Earth', Aquarius:'Air', Pisces:'Water' };
const ELEM_C = { Fire:'#F04060', Earth:'#00D88A', Air:'#5BA8D4', Water:'#4868B8' };
const PCOL = { Sun:'#E8A838', Moon:'#C0C0C0', Mercury:'#5BA8D4', Venus:'#D4729A', Mars:'#D45050', Jupiter:'#8068C0', Saturn:'#887058', Uranus:'#40B0A0', Neptune:'#4868B8', Pluto:'#7048A0' };

// Major aspects: conjunction, sextile, square, trine, opposition
const ASPECTS = [
  { name: 'Conjunction', angle: 0, orb: 8, color: '#E8A838', dash: '' },
  { name: 'Sextile', angle: 60, orb: 6, color: '#5BA8D4', dash: '4,3' },
  { name: 'Square', angle: 90, orb: 7, color: '#F04060', dash: '' },
  { name: 'Trine', angle: 120, orb: 8, color: '#00D88A', dash: '' },
  { name: 'Opposition', angle: 180, orb: 8, color: '#D45050', dash: '6,3' },
];

function normAngle(a) { return ((a % 360) + 360) % 360; }

// Convert ecliptic longitude to chart angle (ASC on left = 180° in SVG)
function eclToChart(eclLon, ascLon) {
  return normAngle(180 - (eclLon - ascLon));
}

function polar(cx, cy, r, angleDeg) {
  const rad = angleDeg * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function arcPath(cx, cy, r, startDeg, endDeg) {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const sweep = normAngle(endDeg - startDeg);
  const large = sweep > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}

export default function NatalWheel({ planets, natal, size = 360 }) {
  const data = useMemo(() => {
    if (!planets || !natal?.asc) return null;

    const ascLon = natal.asc.fullDeg;
    const cx = size / 2, cy = size / 2;
    const outerR = size * 0.46;   // outer zodiac ring
    const signR = size * 0.38;    // inner edge of sign ring
    const planetR = size * 0.30;  // planet placement ring
    const innerR = size * 0.22;   // inner circle (aspect area)
    const tickR = size * 0.36;    // degree tick inner

    // Sign boundaries in chart coordinates
    const signs = ZODIAC.map((name, i) => {
      const eclStart = i * 30;
      const eclEnd = (i + 1) * 30;
      const chartStart = eclToChart(eclStart, ascLon);
      const chartEnd = eclToChart(eclEnd, ascLon);
      return { name, sym: SIGN_SYM[name], elem: ELEM[name], chartStart, chartEnd, eclStart };
    });

    // Planet positions in chart coordinates
    const pls = planets.map(p => {
      const chartAngle = eclToChart(p.fullDeg, ascLon);
      return { ...p, chartAngle, color: PCOL[p.id] || '#8098B0' };
    });

    // Spread overlapping planets (collision avoidance for labels)
    const sorted = [...pls].sort((a, b) => a.chartAngle - b.chartAngle);
    const minGap = 10;
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < sorted.length; i++) {
        const next = sorted[(i + 1) % sorted.length];
        let diff = normAngle(next.chartAngle - sorted[i].chartAngle);
        if (diff < minGap && diff > 0) {
          const shift = (minGap - diff) / 2;
          sorted[i].chartAngle = normAngle(sorted[i].chartAngle - shift);
          next.chartAngle = normAngle(next.chartAngle + shift);
        }
      }
    }

    // Aspects
    const aspects = [];
    for (let i = 0; i < pls.length; i++) {
      for (let j = i + 1; j < pls.length; j++) {
        const diff = Math.abs(pls[i].fullDeg - pls[j].fullDeg);
        const angle = diff > 180 ? 360 - diff : diff;
        for (const asp of ASPECTS) {
          if (Math.abs(angle - asp.angle) <= asp.orb) {
            aspects.push({ p1: pls[i], p2: pls[j], ...asp });
            break;
          }
        }
      }
    }

    // House cusps (Equal house from ASC — 12 houses of 30°)
    const houses = Array.from({ length: 12 }, (_, i) => {
      const eclCusp = normAngle(ascLon + i * 30);
      return { num: i + 1, chartAngle: eclToChart(eclCusp, ascLon) };
    });

    return { cx, cy, outerR, signR, planetR, innerR, tickR, signs, planets: sorted, aspects, houses, ascLon };
  }, [planets, natal, size]);

  if (!data) return null;
  const { cx, cy, outerR, signR, planetR, innerR, tickR, signs, aspects, houses, ascLon } = data;
  const sortedPlanets = data.planets;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace' }}>
      <defs>
        <radialGradient id="nw-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0F1C28" />
          <stop offset="100%" stopColor="#0A1018" />
        </radialGradient>
      </defs>

      {/* Background */}
      <circle cx={cx} cy={cy} r={outerR + 4} fill="url(#nw-bg)" />

      {/* Zodiac sign segments */}
      {signs.map((s, i) => {
        const ec = ELEM_C[s.elem] || '#5A7088';
        const startAngle = eclToChart(s.eclStart, ascLon);
        const endAngle = eclToChart(s.eclStart + 30, ascLon);
        // Draw arc segment from outer to sign ring
        const o1 = polar(cx, cy, outerR, startAngle);
        const o2 = polar(cx, cy, outerR, endAngle);
        const i1 = polar(cx, cy, signR, endAngle);
        const i2 = polar(cx, cy, signR, startAngle);
        const path = `M ${o1.x} ${o1.y} A ${outerR} ${outerR} 0 0 0 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${signR} ${signR} 0 0 1 ${i2.x} ${i2.y} Z`;
        const midAngle = startAngle - 15; // midpoint (going clockwise = decreasing)
        const labelPos = polar(cx, cy, (outerR + signR) / 2, midAngle);
        return (
          <g key={i}>
            <path d={path} fill={ec + '08'} stroke={ec + '30'} strokeWidth="0.5" />
            <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="central"
              fill={ec} fontSize={size * 0.035} fontWeight="600" opacity="0.8">
              {s.sym}
            </text>
          </g>
        );
      })}

      {/* Outer ring border */}
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#1A2840" strokeWidth="0.8" />
      <circle cx={cx} cy={cy} r={signR} fill="none" stroke="#1A2840" strokeWidth="0.5" />

      {/* Sign boundary lines */}
      {signs.map((s, i) => {
        const angle = eclToChart(s.eclStart, ascLon);
        const o = polar(cx, cy, outerR, angle);
        const inner = polar(cx, cy, signR, angle);
        return <line key={i} x1={o.x} y1={o.y} x2={inner.x} y2={inner.y} stroke="#1A2840" strokeWidth="0.5" />;
      })}

      {/* Degree ticks every 5° */}
      {Array.from({ length: 72 }, (_, i) => {
        const deg = i * 5;
        const angle = eclToChart(deg, ascLon);
        const o = polar(cx, cy, signR, angle);
        const t = polar(cx, cy, deg % 10 === 0 ? tickR : tickR + (signR - tickR) * 0.4, angle);
        return <line key={i} x1={o.x} y1={o.y} x2={t.x} y2={t.y} stroke="#1A284060" strokeWidth="0.3" />;
      })}

      {/* Inner circle */}
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#1A284080" strokeWidth="0.5" />

      {/* Planet ring */}
      <circle cx={cx} cy={cy} r={planetR} fill="none" stroke="#1A284030" strokeWidth="0.3" strokeDasharray="2,2" />

      {/* House cusp lines */}
      {houses.map((h, i) => {
        const o = polar(cx, cy, signR, h.chartAngle);
        const inner = polar(cx, cy, innerR, h.chartAngle);
        const isAxis = i === 0 || i === 3 || i === 6 || i === 9;
        const labelP = polar(cx, cy, innerR + (signR - innerR) * 0.12, h.chartAngle + 4);
        return (
          <g key={i}>
            <line x1={o.x} y1={o.y} x2={inner.x} y2={inner.y}
              stroke={isAxis ? '#00D88A50' : '#1A284060'} strokeWidth={isAxis ? 1 : 0.4} />
            <text x={labelP.x} y={labelP.y} fill="#3A5068" fontSize={size * 0.022} fontWeight="600"
              textAnchor="middle" dominantBaseline="central">{h.num}</text>
          </g>
        );
      })}

      {/* ASC / MC / DSC / IC labels */}
      {[
        { label: 'ASC', angle: 180, color: '#00D88A' },
        { label: 'DC', angle: 0, color: '#5A7088' },
        { label: 'MC', angle: eclToChart(natal.mc.fullDeg, ascLon), color: '#E8A838' },
        { label: 'IC', angle: normAngle(eclToChart(natal.mc.fullDeg, ascLon) + 180), color: '#5A7088' },
      ].map((a, i) => {
        const p = polar(cx, cy, outerR + (size * 0.03), a.angle);
        return (
          <text key={i} x={p.x} y={p.y} fill={a.color} fontSize={size * 0.025} fontWeight="700"
            textAnchor="middle" dominantBaseline="central" letterSpacing="1">{a.label}</text>
        );
      })}

      {/* Aspect lines */}
      {aspects.map((a, i) => {
        const p1 = polar(cx, cy, innerR - 1, a.p1.chartAngle);
        const p2 = polar(cx, cy, innerR - 1, a.p2.chartAngle);
        return (
          <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={a.color} strokeWidth="0.6" opacity="0.35"
            strokeDasharray={a.dash || 'none'} />
        );
      })}

      {/* Planets */}
      {sortedPlanets.map((p, i) => {
        const pos = polar(cx, cy, planetR, p.chartAngle);
        // Tick from sign ring to planet
        const tickO = polar(cx, cy, signR - 1, p.chartAngle);
        const tickI = polar(cx, cy, planetR + (size * 0.03), p.chartAngle);
        // Degree label position (between planet ring and inner ring)
        const degPos = polar(cx, cy, planetR - (size * 0.05), p.chartAngle);
        return (
          <g key={i}>
            {/* Tick line from ring to planet */}
            <line x1={tickO.x} y1={tickO.y} x2={tickI.x} y2={tickI.y} stroke={p.color} strokeWidth="0.4" opacity="0.4" />
            {/* Planet symbol */}
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
              fill={p.color} fontSize={size * 0.038} fontWeight="700">
              {p.symbol}
            </text>
            {/* Degree */}
            <text x={degPos.x} y={degPos.y} textAnchor="middle" dominantBaseline="central"
              fill="#5A7088" fontSize={size * 0.02} fontWeight="600">
              {p.deg}°
            </text>
            {/* Retrograde indicator */}
            {p.retrograde && (
              <text x={pos.x + size * 0.022} y={pos.y - size * 0.018} textAnchor="middle"
                fill="#F04060" fontSize={size * 0.016} fontWeight="700">R</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
