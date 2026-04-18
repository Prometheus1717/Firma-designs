// Render natal wheel preview to PNG. Pure-JS template-string SVG (no JSX, so
// Node can run it directly). Mirrors the geometry of src/components/NatalWheel.jsx.
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import * as Astronomy from 'astronomy-engine';
import { calculateChart } from '../src/lib/calculateChart.js';

const ZODIAC = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SYM = { Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍', Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓' };
const ELEM = { Aries:'Fire', Taurus:'Earth', Gemini:'Air', Cancer:'Water', Leo:'Fire', Virgo:'Earth', Libra:'Air', Scorpio:'Water', Sagittarius:'Fire', Capricorn:'Earth', Aquarius:'Air', Pisces:'Water' };

const ELEM_ARC = { Fire:'#C84A3A', Earth:'#7A9B45', Air:'#3A7BB8', Water:'#C8913A' };
const ELEM_SYM = { Fire:'#B43020', Earth:'#5A7820', Air:'#205598', Water:'#A0701A' };

const PC = {
  Sun:'#C86A20', Moon:'#3AA0B8', Mercury:'#9A9020', Venus:'#5A9830',
  Mars:'#C82020', Jupiter:'#3A5098', Saturn:'#5A5848',
  Uranus:'#B85020', Neptune:'#4A3890', Pluto:'#3A4060',
  Node:'#3A8090', Fortune:'#303030',
};
const EXTRA_SYM = { Node:'☊', Fortune:'⊗' };
const PLANET_SYM = { Sun:'☉', Moon:'☽', Mercury:'☿', Venus:'♀', Mars:'♂', Jupiter:'♃', Saturn:'♄', Uranus:'♅', Neptune:'♆', Pluto:'♇' };

const ASPECTS = [
  { angle: 0,   orb: 8, color: '#A07820', dash: '' },
  { angle: 60,  orb: 5, color: '#4A78C0', dash: '4,3' },
  { angle: 90,  orb: 7, color: '#C03838', dash: '' },
  { angle: 120, orb: 8, color: '#3A9840', dash: '' },
  { angle: 180, orb: 8, color: '#C03838', dash: '6,3' },
];

function norm(a) { return ((a % 360) + 360) % 360; }
function e2c(ecl, asc) { return norm(180 - (ecl - asc)); }
function pol(cx, cy, r, deg) {
  const rad = deg * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
}
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
  const n = norm(lon);
  const signIdx = Math.floor(n / 30) % 12;
  const within = n - signIdx * 30;
  const d = Math.floor(within);
  const m = Math.floor((within - d) * 60);
  return { sign: ZODIAC[signIdx], deg: d, min: m, fullDeg: n };
}

function renderWheel({ planets, natal, extras = [], size = 1400 }) {
  const ascLon = natal.asc.fullDeg;
  const mcLon = natal.mc.fullDeg;
  const R = size / 2, cx = R, cy = R;
  const fs = size / 600;

  const rOuter   = R * 0.97;
  const rElemIn  = R * 0.93;
  const rSignOut = R * 0.93;
  const rSignIn  = R * 0.82;
  const rHouseIn = R * 0.56;

  const signs = ZODIAC.map((name, i) => ({ name, sym: SYM[name], elem: ELEM[name], eclStart: i * 30 }));

  // All bodies
  const bodies = planets.map(p => ({
    id: p.id, symbol: PLANET_SYM[p.id] || p.symbol, sign: p.sign, deg: p.deg, min: p.min,
    fullDeg: p.fullDeg, retrograde: p.retrograde, color: PC[p.id] || '#555',
  }));
  for (const ex of extras) {
    const z = degMin(ex.fullDeg);
    bodies.push({
      id: ex.id, symbol: EXTRA_SYM[ex.id] || '?', sign: z.sign, deg: z.deg, min: z.min,
      fullDeg: ex.fullDeg, retrograde: !!ex.retrograde, color: PC[ex.id] || '#555',
    });
  }

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

  const classical = bodies.filter(b => PC[b.id] && !['Node','Fortune'].includes(b.id));
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

  function arcSeg(rO, rI, eclStart, span) {
    const a1 = e2c(eclStart, ascLon);
    const a2 = e2c(eclStart + span, ascLon);
    const p1 = pol(cx, cy, rO, a1), p2 = pol(cx, cy, rO, a2);
    const p3 = pol(cx, cy, rI, a2), p4 = pol(cx, cy, rI, a1);
    return `M${p1[0]},${p1[1]} A${rO},${rO} 0 0,0 ${p2[0]},${p2[1]} L${p3[0]},${p3[1]} A${rI},${rI} 0 0,1 ${p4[0]},${p4[1]} Z`;
  }

  const out = [];
  out.push(`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" font-family="Georgia, serif">`);
  out.push(`<circle cx="${cx}" cy="${cy}" r="${rOuter}" fill="none" stroke="#000" stroke-width="${1.2*fs}"/>`);

  // Element arcs
  for (const s of signs) {
    out.push(`<path d="${arcSeg(rOuter, rElemIn, s.eclStart, 30)}" fill="${ELEM_ARC[s.elem]}" fill-opacity="0.85" stroke="${ELEM_ARC[s.elem]}" stroke-width="0.5"/>`);
  }
  // Sign band bg
  for (const s of signs) {
    out.push(`<path d="${arcSeg(rSignOut, rSignIn, s.eclStart, 30)}" fill="#F6F2EA"/>`);
  }
  out.push(`<circle cx="${cx}" cy="${cy}" r="${rSignOut}" fill="none" stroke="#000" stroke-width="${0.8*fs}"/>`);
  out.push(`<circle cx="${cx}" cy="${cy}" r="${rSignIn}" fill="none" stroke="#000" stroke-width="${0.8*fs}"/>`);

  // Sign divider lines
  for (const s of signs) {
    const angle = e2c(s.eclStart, ascLon);
    const [x1, y1] = pol(cx, cy, rSignOut, angle);
    const [x2, y2] = pol(cx, cy, rSignIn, angle);
    out.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="${0.6*fs}"/>`);
  }
  // Sign glyphs
  for (const s of signs) {
    const mid = e2c(s.eclStart + 15, ascLon);
    const [x, y] = pol(cx, cy, (rSignOut + rSignIn) / 2, mid);
    out.push(`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="${ELEM_SYM[s.elem]}" font-size="${22*fs}">${s.sym}</text>`);
  }

  // House area bg (cream, covers everything inside sign ring)
  out.push(`<circle cx="${cx}" cy="${cy}" r="${rSignIn-0.5}" fill="#FBF8F2"/>`);

  // House cusp lines
  for (let i = 0; i < 12; i++) {
    const hNum = i + 1;
    const eclCusp = cusps[hNum];
    const angle = e2c(eclCusp, ascLon);
    const isAxis = hNum === 1 || hNum === 4 || hNum === 7 || hNum === 10;
    const [x1, y1] = pol(cx, cy, rSignIn, angle);
    const [x2, y2] = pol(cx, cy, rHouseIn, angle);
    out.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${isAxis ? '#202020' : '#6A6A6A'}" stroke-width="${isAxis ? 1.2*fs : 0.6*fs}"${isAxis ? '' : ' stroke-dasharray="2,2"'}/>`);
  }

  // House cusp degree labels on outer element ring
  for (let i = 0; i < 12; i++) {
    const hNum = i + 1;
    const eclCusp = cusps[hNum];
    const angle = e2c(eclCusp, ascLon);
    const rLabel = rOuter + 18 * fs;
    const isAxis = hNum === 1 || hNum === 4 || hNum === 7 || hNum === 10;
    const z = degMin(eclCusp);
    const [xDeg, yDeg] = pol(cx, cy, rLabel, angle + (isAxis ? 0 : 2.5));
    const [xSign, ySign] = pol(cx, cy, rLabel, angle);
    const [xMin, yMin] = pol(cx, cy, rLabel, angle - (isAxis ? 0 : 2.5));
    out.push(`<text x="${xDeg}" y="${yDeg - 14*fs}" text-anchor="middle" dominant-baseline="central" fill="#F6F2EA" font-size="${11*fs}" font-weight="700">${z.deg}</text>`);
    out.push(`<text x="${xSign}" y="${ySign}" text-anchor="middle" dominant-baseline="central" fill="#F6F2EA" font-size="${13*fs}">${SYM[z.sign]}</text>`);
    out.push(`<text x="${xMin}" y="${yMin + 14*fs}" text-anchor="middle" dominant-baseline="central" fill="#F6F2EA" font-size="${10*fs}">${String(z.min).padStart(2, '0')}</text>`);
  }

  // House numbers
  for (let i = 0; i < 12; i++) {
    const hNum = i + 1;
    const eclCusp = cusps[hNum];
    const nextCusp = cusps[hNum === 12 ? 1 : hNum + 1];
    const midEcl = norm(eclCusp + norm(nextCusp - eclCusp) / 2);
    const midA = e2c(midEcl, ascLon);
    const rh = rHouseIn + (rSignIn - rHouseIn) * 0.08;
    const [x, y] = pol(cx, cy, rh, midA);
    out.push(`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="#5A5040" font-size="${14*fs}">${hNum}</text>`);
  }

  // Axis lines (across the whole inside)
  for (const a of [ascLon, norm(ascLon + 180), mcLon, norm(mcLon + 180)]) {
    const angle = e2c(a, ascLon);
    const [x1, y1] = pol(cx, cy, rSignIn, angle);
    const [x2, y2] = pol(cx, cy, rHouseIn, angle);
    out.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#202020" stroke-width="${1.2*fs}"/>`);
  }

  // Inner aspect circle
  out.push(`<circle cx="${cx}" cy="${cy}" r="${rHouseIn}" fill="#FBF8F2" stroke="#000" stroke-width="${0.8*fs}"/>`);

  // Aspects
  for (const asp of aspects) {
    const [x1, y1] = pol(cx, cy, rHouseIn - 1, asp.a.chartAngle);
    const [x2, y2] = pol(cx, cy, rHouseIn - 1, asp.b.chartAngle);
    out.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${asp.color}" stroke-width="${1.3*fs}" opacity="0.75"${asp.dash ? ` stroke-dasharray="${asp.dash}"` : ''}/>`);
  }

  // Bodies
  for (const b of bodies) {
    const tickO = pol(cx, cy, rSignIn, b.chartAngle);
    const tickI = pol(cx, cy, rSignIn - 5*fs, b.chartAngle);
    const symR = rSignIn - (rSignIn - rHouseIn) * 0.30;
    const [xS, yS] = pol(cx, cy, symR, b.displayAngle);
    const infoR = rSignIn - (rSignIn - rHouseIn) * 0.58;
    const [xI, yI] = pol(cx, cy, infoR, b.displayAngle);
    out.push(`<line x1="${tickO[0]}" y1="${tickO[1]}" x2="${tickI[0]}" y2="${tickI[1]}" stroke="${b.color}" stroke-width="${1.4*fs}"/>`);
    if (Math.abs(norm(b.displayAngle - b.chartAngle)) > 0.5) {
      const [xC, yC] = pol(cx, cy, symR + 10*fs, b.displayAngle);
      out.push(`<line x1="${tickI[0]}" y1="${tickI[1]}" x2="${xC}" y2="${yC}" stroke="${b.color}" stroke-width="${0.5*fs}" opacity="0.4"/>`);
    }
    out.push(`<text x="${xS}" y="${yS}" text-anchor="middle" dominant-baseline="central" fill="${b.color}" font-size="${20*fs}">${b.symbol}</text>`);
    out.push(`<text x="${xI}" y="${yI - 9*fs}" text-anchor="middle" dominant-baseline="central" fill="#3A3020" font-size="${11*fs}" font-weight="700">${b.deg}</text>`);
    out.push(`<text x="${xI}" y="${yI + 2*fs}" text-anchor="middle" dominant-baseline="central" fill="${ELEM_SYM[ELEM[b.sign]] || '#3A3020'}" font-size="${12*fs}">${SYM[b.sign]}</text>`);
    out.push(`<text x="${xI}" y="${yI + 14*fs}" text-anchor="middle" dominant-baseline="central" fill="#5A5040" font-size="${9*fs}">${String(b.min).padStart(2, '0')}</text>`);
    if (b.retrograde) {
      out.push(`<text x="${xI}" y="${yI + 26*fs}" text-anchor="middle" dominant-baseline="central" fill="#C03838" font-size="${9*fs}" font-weight="700" font-style="italic">Rx</text>`);
    }
  }

  // ASC / MC labels
  for (const a of [{ label:'ASC', ecl:ascLon }, { label:'MC', ecl:mcLon }]) {
    const angle = e2c(a.ecl, ascLon);
    const [x, y] = pol(cx, cy, rSignOut + 38 * fs, angle);
    out.push(`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="#F6F2EA" font-size="${14*fs}" font-weight="700" letter-spacing="2">${a.label}</text>`);
  }

  out.push(`</svg>`);
  return out.join('');
}

// Mean lunar node (Meeus)
function meanNodeLon(date) {
  const ut = Astronomy.MakeTime(date).ut;
  const jd = ut + 2451545.0;
  const T = (jd - 2451545.0) / 36525;
  const Omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;
  return norm(Omega);
}
function partOfFortune(ascLon, sunLon, moonLon) {
  return norm(ascLon + moonLon - sunLon);
}

// ── Sercan's chart ──
const chart = calculateChart({ date:'1997-06-27', time:'19:12', lat:50.9833, lng:7.1333 });

const sunLon = chart.natal.sun.fullDeg;
const moonLon = chart.natal.moon.fullDeg;
const ascLon = chart.natal.asc.fullDeg;
const birthDate = new Date(Date.UTC(1997, 5, 27, 17, 12, 0));
const nodeLon = meanNodeLon(birthDate);
const fortuneLon = partOfFortune(ascLon, sunLon, moonLon);

const extras = [
  { id: 'Node', fullDeg: nodeLon },
  { id: 'Fortune', fullDeg: fortuneLon },
];

console.log('\nSercan natal positions:');
for (const p of chart.planets) {
  console.log(`  ${p.id.padEnd(8)} ${p.sign.padEnd(12)} ${String(p.deg).padStart(2)}°${String(p.min).padStart(2,'0')}'${p.retrograde ? ' Rx' : ''}`);
}
console.log(`  ASC      ${chart.natal.asc.sign.padEnd(12)} ${String(chart.natal.asc.deg).padStart(2)}°${String(chart.natal.asc.min).padStart(2,'0')}'`);
console.log(`  MC       ${chart.natal.mc.sign.padEnd(12)} ${String(chart.natal.mc.deg).padStart(2)}°${String(chart.natal.mc.min).padStart(2,'0')}'`);
const nodeZ = degMin(nodeLon), fortuneZ = degMin(fortuneLon);
console.log(`  Node     ${nodeZ.sign.padEnd(12)} ${String(nodeZ.deg).padStart(2)}°${String(nodeZ.min).padStart(2,'0')}'`);
console.log(`  Fortune  ${fortuneZ.sign.padEnd(12)} ${String(fortuneZ.deg).padStart(2)}°${String(fortuneZ.min).padStart(2,'0')}'`);

const SIZE = 1400;
const wheelSvg = renderWheel({ planets: chart.planets, natal: chart.natal, extras, size: SIZE });

// Strip outer <svg> tag so we can nest it
const inner = wheelSvg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

const OUTER_W = 1800, OUTER_H = 2040;
const wheelX = (OUTER_W - SIZE) / 2, wheelY = 260;

const fullSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${OUTER_W}" height="${OUTER_H}" viewBox="0 0 ${OUTER_W} ${OUTER_H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3B1558"/>
      <stop offset="100%" stop-color="#1E0A33"/>
    </linearGradient>
  </defs>
  <rect width="${OUTER_W}" height="${OUTER_H}" fill="url(#bg)"/>
  <text x="${OUTER_W/2}" y="90" text-anchor="middle" font-family="Georgia, serif" font-size="48" letter-spacing="8" fill="#F6F2EA">SERCAN</text>
  <text x="${OUTER_W/2 - 110}" y="150" text-anchor="middle" font-family="Georgia, serif" font-size="18" letter-spacing="5" fill="#F6F2EA" font-weight="600">CHART</text>
  <text x="${OUTER_W/2}" y="150" text-anchor="middle" font-family="Georgia, serif" font-size="18" letter-spacing="5" fill="#8A7498">PLANETS</text>
  <text x="${OUTER_W/2 + 130}" y="150" text-anchor="middle" font-family="Georgia, serif" font-size="18" letter-spacing="5" fill="#8A7498">ASPECTS</text>
  <svg x="${wheelX}" y="${wheelY}" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${inner}</svg>
  <text x="${OUTER_W/2}" y="${OUTER_H - 100}" text-anchor="middle" font-family="Georgia, serif" font-size="32" letter-spacing="6" fill="#F6F2EA">NATAL CHART</text>
  <text x="${OUTER_W/2}" y="${OUTER_H - 55}" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#F6F2EA">June 27, 1997   7:12 PM CEDT</text>
  <text x="${OUTER_W/2}" y="${OUTER_H - 22}" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#F6F2EA">Bergisch Gladbach, Germany   (50N59, 7E07)</text>
</svg>`;

await writeFile('public/sercan-chart-preview.svg', fullSvg);
const png = await sharp(Buffer.from(fullSvg)).png().toBuffer();
await writeFile('public/sercan-chart-preview.png', png);
console.log(`\nWrote public/sercan-chart-preview.png (${png.length} bytes)`);
