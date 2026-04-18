import { useMemo } from 'react';

const ZODIAC = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SYM = { Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍', Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓' };
const ELEM = { Aries:'Fire', Taurus:'Earth', Gemini:'Air', Cancer:'Water', Leo:'Fire', Virgo:'Earth', Libra:'Air', Scorpio:'Water', Sagittarius:'Fire', Capricorn:'Earth', Aquarius:'Air', Pisces:'Water' };

const ELEM_COL = { Fire:'#E05050', Earth:'#4CAF50', Air:'#42A5F5', Water:'#FFB74D' };
const ELEM_BG  = { Fire:'#3A1818', Earth:'#1A2A1A', Air:'#18203A', Water:'#2A2210' };

const PCOL = {
  Sun:'#FFB300', Moon:'#B0D4F1', Mercury:'#CE93D8', Venus:'#81C784',
  Mars:'#EF5350', Jupiter:'#7986CB', Saturn:'#A1887F',
  Uranus:'#4DD0E1', Neptune:'#9575CD', Pluto:'#90A4AE',
};

const ASPECTS = [
  { angle: 0,   orb: 8, color: '#FFB300', dash: '' },
  { angle: 60,  orb: 5, color: '#42A5F5', dash: '3,2' },
  { angle: 90,  orb: 7, color: '#EF5350', dash: '' },
  { angle: 120, orb: 8, color: '#4CAF50', dash: '' },
  { angle: 180, orb: 8, color: '#EF5350', dash: '5,3' },
];

function norm(a) { return ((a % 360) + 360) % 360; }
function e2c(ecl, asc) { return norm(180 - (ecl - asc)); }
function pol(cx, cy, r, deg) {
  const rad = deg * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
}

function porphyry(ascLon, mcLon) {
  const dsc = norm(ascLon + 180), ic = norm(mcLon + 180);
  const tri = (a, b) => { const s = norm(b - a); return [norm(a + s / 3), norm(a + 2 * s / 3)]; };
  const [c2, c3] = tri(ic, ascLon);
  const [c11, c12] = tri(ascLon, mcLon);
  const [c8, c9] = tri(mcLon, dsc);
  const [c5, c6] = tri(dsc, ic);
  return [null, ascLon, c2, c3, ic, c5, c6, dsc, c8, c9, mcLon, c11, c12];
}

export default function NatalWheel({ planets, natal, houseCusps, size = 440 }) {
  const chart = useMemo(() => {
    if (!planets || !natal?.asc) return null;
    const ascLon = natal.asc.fullDeg;
    const mcLon  = natal.mc.fullDeg;
    const R = size / 2, cx = R, cy = R;

    let cusps;
    if (houseCusps?.length) {
      cusps = [null, ...houseCusps.map(h => h.fullDeg)];
    } else {
      cusps = porphyry(ascLon, mcLon);
    }

    const rOuter  = R * 0.97;
    const rElemIn = R * 0.93;
    const rSignIn = R * 0.78;
    const rInner  = R * 0.46;

    const bodies = planets.map(p => ({
      id: p.id, symbol: p.symbol, sign: p.sign,
      deg: p.deg, min: p.min, fullDeg: p.fullDeg,
      retrograde: p.retrograde,
      color: PCOL[p.id] || '#AAA',
      chartAngle: e2c(p.fullDeg, ascLon),
    }));

    bodies.forEach(b => { b.displayAngle = b.chartAngle; });
    bodies.sort((a, b) => a.displayAngle - b.displayAngle);
    const gap = 14;
    for (let pass = 0; pass < 12; pass++) {
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

    const aspects = [];
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const diff = Math.abs(bodies[i].fullDeg - bodies[j].fullDeg);
        const ang = diff > 180 ? 360 - diff : diff;
        for (const asp of ASPECTS) {
          if (Math.abs(ang - asp.angle) <= asp.orb) {
            aspects.push({ a: bodies[i], b: bodies[j], color: asp.color, dash: asp.dash });
            break;
          }
        }
      }
    }

    return { cx, cy, R, rOuter, rElemIn, rSignIn, rInner, bodies, cusps, aspects, ascLon, mcLon };
  }, [planets, natal, houseCusps, size]);

  if (!chart) return null;
  const { cx, cy, R, rOuter, rElemIn, rSignIn, rInner, bodies, cusps, aspects, ascLon } = chart;
  const s = size / 440;

  function arc(rO, rI, eclStart, span) {
    const a1 = e2c(eclStart, ascLon);
    const a2 = e2c(eclStart + span, ascLon);
    const [x1, y1] = pol(cx, cy, rO, a1);
    const [x2, y2] = pol(cx, cy, rO, a2);
    const [x3, y3] = pol(cx, cy, rI, a2);
    const [x4, y4] = pol(cx, cy, rI, a1);
    return `M${x1},${y1} A${rO},${rO} 0 0,0 ${x2},${y2} L${x3},${y3} A${rI},${rI} 0 0,1 ${x4},${y4} Z`;
  }

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', userSelect: 'none' }}>

      {/* Element color ring */}
      {ZODIAC.map((name, i) => (
        <path key={'e'+i} d={arc(rOuter, rElemIn, i * 30, 30)}
          fill={ELEM_COL[ELEM[name]]} fillOpacity={0.65} stroke="none" />
      ))}
      <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="#666" strokeWidth={0.7 * s} />
      <circle cx={cx} cy={cy} r={rElemIn} fill="none" stroke="#444" strokeWidth={0.5 * s} />

      {/* Zodiac sign band */}
      {ZODIAC.map((name, i) => (
        <path key={'s'+i} d={arc(rElemIn, rSignIn, i * 30, 30)}
          fill={ELEM_BG[ELEM[name]]} stroke="none" />
      ))}
      <circle cx={cx} cy={cy} r={rSignIn} fill="none" stroke="#555" strokeWidth={0.7 * s} />

      {/* Sign divider lines */}
      {ZODIAC.map((_, i) => {
        const angle = e2c(i * 30, ascLon);
        const [x1, y1] = pol(cx, cy, rOuter, angle);
        const [x2, y2] = pol(cx, cy, rSignIn, angle);
        return <line key={'d'+i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#555" strokeWidth={0.5 * s} />;
      })}

      {/* Sign glyphs */}
      {ZODIAC.map((name, i) => {
        const mid = e2c(i * 30 + 15, ascLon);
        const [x, y] = pol(cx, cy, (rElemIn + rSignIn) / 2, mid);
        return (
          <text key={'sym'+i} x={x} y={y} textAnchor="middle" dominantBaseline="central"
            fill={ELEM_COL[ELEM[name]]} fontSize={17 * s} fontFamily="serif">{SYM[name]}</text>
        );
      })}

      {/* House area */}
      <circle cx={cx} cy={cy} r={rSignIn - 0.5} fill="#0D0620" />

      {/* House cusp lines */}
      {cusps.slice(1).map((eclCusp, i) => {
        const hNum = i + 1;
        const angle = e2c(eclCusp, ascLon);
        const isAxis = [1, 4, 7, 10].includes(hNum);
        const [x1, y1] = pol(cx, cy, rSignIn, angle);
        const [x2, y2] = pol(cx, cy, rInner, angle);
        return (
          <line key={'hl'+i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={isAxis ? '#776' : '#333'} strokeWidth={(isAxis ? 1.4 : 0.5) * s}
            strokeDasharray={isAxis ? 'none' : '2,2'} />
        );
      })}

      {/* House numbers */}
      {cusps.slice(1).map((eclCusp, i) => {
        const hNum = i + 1;
        const nextCusp = cusps[hNum === 12 ? 1 : hNum + 1];
        const midEcl = norm(eclCusp + norm(nextCusp - eclCusp) / 2);
        const midA = e2c(midEcl, ascLon);
        const [x, y] = pol(cx, cy, rInner + (rSignIn - rInner) * 0.13, midA);
        return (
          <text key={'hn'+i} x={x} y={y} textAnchor="middle" dominantBaseline="central"
            fill="#665" fontSize={9 * s} fontFamily="sans-serif" opacity={0.7}>{hNum}</text>
        );
      })}

      {/* Inner aspect circle */}
      <circle cx={cx} cy={cy} r={rInner} fill="#080415" stroke="#444" strokeWidth={0.5 * s} />

      {/* Aspect lines */}
      {aspects.map((asp, i) => {
        const [x1, y1] = pol(cx, cy, rInner - 1, asp.a.chartAngle);
        const [x2, y2] = pol(cx, cy, rInner - 1, asp.b.chartAngle);
        return (
          <line key={'al'+i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={asp.color} strokeWidth={0.9 * s} opacity={0.45}
            strokeDasharray={asp.dash || 'none'} />
        );
      })}

      {/* Planet glyphs + degree labels */}
      {bodies.map((b, i) => {
        const glyphR = rSignIn - (rSignIn - rInner) * 0.30;
        const [gx, gy] = pol(cx, cy, glyphR, b.displayAngle);
        const labelR = rSignIn - (rSignIn - rInner) * 0.55;
        const [lx, ly] = pol(cx, cy, labelR, b.displayAngle);

        const [tx1, ty1] = pol(cx, cy, rSignIn, b.chartAngle);
        const [tx2, ty2] = pol(cx, cy, rSignIn - 5 * s, b.chartAngle);

        const displaced = Math.abs(norm(b.displayAngle - b.chartAngle)) > 1.5;

        return (
          <g key={'p'+i}>
            <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke={b.color} strokeWidth={1.2 * s} />
            {displaced && (() => {
              const [cx2, cy2] = pol(cx, cy, glyphR + 12 * s, b.displayAngle);
              return <line x1={tx2} y1={ty2} x2={cx2} y2={cy2} stroke={b.color} strokeWidth={0.4 * s} opacity={0.35} />;
            })()}
            <text x={gx} y={gy} textAnchor="middle" dominantBaseline="central"
              fill={b.color} fontSize={17 * s} fontFamily="serif">{b.symbol}</text>
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
              fill="#999" fontSize={7 * s} fontFamily="sans-serif">
              {b.deg}°{String(b.min).padStart(2,'0')}'{b.retrograde ? ' R' : ''}
            </text>
          </g>
        );
      })}

      {/* ASC / MC axis labels */}
      {[
        { label: 'ASC', ecl: natal.asc.fullDeg },
        { label: 'MC',  ecl: natal.mc.fullDeg },
      ].map((a, i) => {
        const angle = e2c(a.ecl, ascLon);
        const [x, y] = pol(cx, cy, rOuter + 12 * s, angle);
        return (
          <text key={'axl'+i} x={x} y={y} textAnchor="middle" dominantBaseline="central"
            fill="#D4C090" fontSize={9 * s} fontWeight="700" fontFamily="sans-serif" letterSpacing={1}>{a.label}</text>
        );
      })}
    </svg>
  );
}
