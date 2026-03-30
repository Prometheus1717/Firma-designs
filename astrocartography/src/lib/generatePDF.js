import jsPDF from 'jspdf';

// ── Colors ──
const C = {
  bg: '#0A1018',
  bgLight: '#0D1520',
  panel: '#101C28',
  border: '#1A2840',
  text: '#D0DDE8',
  textMid: '#8098B0',
  textDim: '#5A7088',
  accent: '#00D88A',
  thrive: '#00D88A',
  avoid: '#F04060',
  neutral: '#D8A030',
  white: '#FFFFFF',
};

const PCOL = { Sun: '#E8A838', Moon: '#C0C0C0', Mercury: '#5BA8D4', Venus: '#D4729A', Mars: '#D45050', Jupiter: '#8068C0', Saturn: '#887058', Uranus: '#40B0A0', Neptune: '#4868B8', Pluto: '#7048A0' };
const PLANET_GLYPHS = { Sun: '\u2609', Moon: '\u263D', Mercury: '\u263F', Venus: '\u2640', Mars: '\u2642', Jupiter: '\u2643', Saturn: '\u2644', Uranus: '\u2645', Neptune: '\u2646', Pluto: '\u2647' };
const SIGN_ELEMENTS = { Aries: 'Fire', Taurus: 'Earth', Gemini: 'Air', Cancer: 'Water', Leo: 'Fire', Virgo: 'Earth', Libra: 'Air', Scorpio: 'Water', Sagittarius: 'Fire', Capricorn: 'Earth', Aquarius: 'Air', Pisces: 'Water' };
const ELEM_COL = { Fire: '#F04060', Earth: '#00D88A', Air: '#5BA8D4', Water: '#4868B8' };
const ORDINALS = ['','First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth','Eleventh','Twelfth'];

// ── Helpers ──
function hex(h) { return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]; }
function sc(d, h) { d.setTextColor(...hex(h)); }
function fr(d, x, y, w, h2, c) { d.setFillColor(...hex(c)); d.rect(x, y, w, h2, 'F'); }

function cp(d, y, need, pw, ph) {
  if (y + need > ph - 20) { d.addPage(); fr(d, 0, 0, pw, ph, C.bg); return 32; }
  return y;
}

function sh(d, y, title, pw, ph) {
  y = cp(d, y, 18, pw, ph);
  y += 6;
  fr(d, 16, y, pw - 32, 0.5, C.accent);
  y += 6;
  d.setFont('helvetica', 'bold');
  d.setFontSize(13);
  sc(d, C.accent);
  d.text(title, 16, y);
  y += 8;
  return y;
}

function sub(d, y, title, color, pw, ph) {
  y = cp(d, y, 12, pw, ph);
  y += 4;
  d.setFont('helvetica', 'bold');
  d.setFontSize(9);
  sc(d, color || C.textDim);
  d.text(title, 18, y);
  y += 5;
  return y;
}

function bt(d, y, text, pw, ph, indent, bullet) {
  indent = indent || 18;
  d.setFont('helvetica', 'normal');
  d.setFontSize(8.5);
  sc(d, C.textMid);
  const textW = pw - indent - 18 - (bullet ? 6 : 0);
  const textX = indent + (bullet ? 6 : 0);
  const lines = d.splitTextToSize(text, textW);
  for (let i = 0; i < lines.length; i++) {
    y = cp(d, y, 5, pw, ph);
    if (bullet && i === 0) {
      sc(d, C.accent);
      d.text('\u2022', indent, y);
      sc(d, C.textMid);
    }
    d.text(lines[i], textX, y);
    y += 3.8;
  }
  return y + 1;
}

async function loadLogo() {
  try {
    const r = await fetch('/favicon-512x512.png');
    const b = await r.blob();
    return new Promise(res => {
      const rd = new FileReader();
      rd.onload = () => res(rd.result);
      rd.onerror = () => res(null);
      rd.readAsDataURL(b);
    });
  } catch { return null; }
}

function cityBlock(d, y, cities, color, readingFn, pw, ph, max) {
  const list = cities.slice(0, max);
  if (!list.length) {
    d.setFont('helvetica', 'italic'); d.setFontSize(8); sc(d, C.textDim);
    y = cp(d, y, 6, pw, ph);
    d.text('No cities found in this zone.', 20, y);
    return y + 8;
  }
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    const reading = readingFn ? readingFn(c) : '';
    y = cp(d, y, 18, pw, ph);
    fr(d, 16, y - 2, pw - 32, 8, i % 2 === 0 ? C.bgLight : C.bg);
    d.setFont('helvetica', 'bold'); d.setFontSize(8); sc(d, color);
    d.text(`${i + 1}.`, 20, y + 3);
    d.setFontSize(9); sc(d, C.text);
    d.text(c.name, 30, y + 3);
    d.setFont('helvetica', 'normal'); d.setFontSize(7.5); sc(d, C.textDim);
    d.text(`${c.line}  \u00B7  ${c.dist.toFixed(1)}\u00B0 orb`, pw - 20, y + 3, { align: 'right' });
    y += 9;
    if (reading) { y = bt(d, y, reading, pw, ph, 20, true); y += 1; }
  }
  return y + 3;
}

// ══════════════════════════════════════════
export async function generateNatalPDF({ displayName, chartData, thriveC, avoidC, neutralC, cityReadingFn, natalReadings }) {
  const d = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = d.internal.pageSize.getWidth();
  const ph = d.internal.pageSize.getHeight();

  fr(d, 0, 0, pw, ph, C.bg);
  let y = 30;

  // Logo
  const logo = await loadLogo();
  if (logo) { d.addImage(logo, 'PNG', (pw - 36) / 2, y, 36, 36); y += 42; }

  // Title
  d.setFont('helvetica', 'bold'); d.setFontSize(26); sc(d, C.white);
  d.text('NATAL NAVIGATOR', pw / 2, y, { align: 'center' });
  y += 10;
  d.setFontSize(11); sc(d, C.accent);
  d.text('Your Personal Astrocartography Report', pw / 2, y, { align: 'center' });
  y += 14;

  // User box
  fr(d, 30, y, pw - 60, 32, C.bgLight);
  y += 10;
  d.setFont('helvetica', 'bold'); d.setFontSize(16); sc(d, C.text);
  d.text(displayName, pw / 2, y, { align: 'center' });
  y += 8;

  if (chartData?.natal) {
    d.setFont('helvetica', 'normal'); d.setFontSize(9); sc(d, C.textDim);
    const a = chartData.natal.asc, m = chartData.natal.mc;
    d.text(`ASC ${a?.sign} ${a?.deg}\u00B0  \u00B7  MC ${m?.sign} ${m?.deg}\u00B0`, pw / 2, y, { align: 'center' });
    y += 6;
    const sun = chartData.planets?.find(p => p.id === 'Sun');
    const moon = chartData.planets?.find(p => p.id === 'Moon');
    if (sun && moon) d.text(`\u2609 Sun in ${sun.sign}  \u00B7  \u263D Moon in ${moon.sign}`, pw / 2, y, { align: 'center' });
  }
  y += 18;
  fr(d, 40, y, pw - 80, 0.3, C.border);
  y += 10;
  d.setFont('helvetica', 'normal'); d.setFontSize(8); sc(d, C.textDim);
  d.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pw / 2, y, { align: 'center' });
  y += 4;
  d.text('natalnavigator.com', pw / 2, y, { align: 'center' });

  // ── NATAL CHART TABLE ──
  d.addPage(); fr(d, 0, 0, pw, ph, C.bg); y = 20;
  y = sh(d, y, 'YOUR NATAL CHART', pw, ph);

  fr(d, 16, y, pw - 32, 7, C.panel);
  d.setFont('helvetica', 'bold'); d.setFontSize(7); sc(d, C.textDim);
  d.text('PLANET', 20, y + 5); d.text('SIGN', 60, y + 5); d.text('DEGREE', 100, y + 5);
  d.text('HOUSE', 130, y + 5); d.text('ELEMENT', 158, y + 5);
  y += 9;

  if (chartData?.planets) {
    for (let i = 0; i < chartData.planets.length; i++) {
      const p = chartData.planets[i];
      y = cp(d, y, 7, pw, ph);
      fr(d, 16, y - 4, pw - 32, 7, i % 2 === 0 ? C.bg : C.bgLight);
      d.setFont('helvetica', 'bold'); d.setFontSize(8.5); sc(d, PCOL[p.id] || C.text);
      d.text(`${p.id}`, 20, y);
      d.setFont('helvetica', 'normal'); sc(d, C.text);
      d.text(p.sign, 60, y);
      d.setFontSize(8); sc(d, C.textDim);
      d.text(`${p.deg}\u00B0 ${String(p.min).padStart(2,'0')}'${p.retrograde ? ' \u211E' : ''}`, 100, y);
      sc(d, C.textMid); d.text(p.house ? `${p.house}` : '\u2013', 135, y);
      const elem = SIGN_ELEMENTS[p.sign] || '';
      sc(d, ELEM_COL[elem] || C.textDim); d.text(elem, 158, y);
      y += 7;
    }
  }

  if (chartData?.natal) {
    y += 3;
    d.setDrawColor(...hex(C.border)); d.setLineWidth(0.3); d.line(16, y, pw - 16, y);
    y += 5;
    for (const [label, data] of [['Ascendant', chartData.natal.asc], ['Midheaven', chartData.natal.mc]]) {
      if (!data) continue;
      d.setFont('helvetica', 'bold'); d.setFontSize(8.5); sc(d, '#E8A838');
      d.text(label, 20, y);
      d.setFont('helvetica', 'normal'); sc(d, C.text);
      d.text(`${data.sign} ${data.deg}\u00B0 ${String(data.min).padStart(2,'0')}'`, 60, y);
      y += 7;
    }
  }

  // ── PLANETARY READINGS ──
  y += 4;
  y = sh(d, y, 'YOUR PLANETARY READINGS', pw, ph);

  if (chartData?.planets && natalReadings) {
    for (const p of chartData.planets) {
      const sr = natalReadings.PLANET_IN_SIGN?.[`${p.id}-${p.sign}`];
      const hr = p.house ? natalReadings.PLANET_IN_HOUSE?.[`${p.id}-${p.house}`] : null;
      const pi = natalReadings.PLANET_INFO?.[p.id];

      y = cp(d, y, 20, pw, ph);
      fr(d, 16, y - 1, pw - 32, 9, C.panel);
      d.setFont('helvetica', 'bold'); d.setFontSize(10); sc(d, PCOL[p.id] || C.text);
      d.text(`${p.id} in ${p.sign}`, 20, y + 5);
      if (p.house) {
        d.setFontSize(8); sc(d, C.textDim);
        d.text(`${ORDINALS[p.house]} House`, pw - 20, y + 5, { align: 'right' });
      }
      y += 12;

      if (pi) {
        d.setFont('helvetica', 'italic'); d.setFontSize(7.5); sc(d, C.textDim);
        const dl = d.splitTextToSize(pi.description, pw - 40);
        for (const line of dl) { y = cp(d, y, 4, pw, ph); d.text(line, 20, y); y += 3.5; }
        y += 2;
      }
      if (sr) { y = sub(d, y, `${p.id.toUpperCase()} IN ${p.sign.toUpperCase()}`, PCOL[p.id], pw, ph); y = bt(d, y, sr.text, pw, ph, 18, true); y += 1; }
      if (hr) { y = sub(d, y, `${p.id.toUpperCase()} IN THE ${ORDINALS[p.house].toUpperCase()} HOUSE`, PCOL[p.id], pw, ph); y = bt(d, y, hr.text, pw, ph, 18, true); }
      y += 4;
    }
  }

  // ── ASC ──
  if (chartData?.natal?.asc && natalReadings?.ASC_IN_SIGN) {
    const r = natalReadings.ASC_IN_SIGN[chartData.natal.asc.sign];
    if (r) {
      y = cp(d, y, 20, pw, ph);
      fr(d, 16, y - 1, pw - 32, 9, C.panel);
      d.setFont('helvetica', 'bold'); d.setFontSize(10); sc(d, '#E8A838');
      d.text(`Ascendant in ${chartData.natal.asc.sign}`, 20, y + 5);
      y += 12; y = bt(d, y, r.text, pw, ph, 18, true); y += 4;
    }
  }

  // ── MC ──
  if (chartData?.natal?.mc && natalReadings?.MC_IN_SIGN) {
    const r = natalReadings.MC_IN_SIGN[chartData.natal.mc.sign];
    if (r) {
      y = cp(d, y, 20, pw, ph);
      fr(d, 16, y - 1, pw - 32, 9, C.panel);
      d.setFont('helvetica', 'bold'); d.setFontSize(10); sc(d, '#E8A838');
      d.text(`Midheaven in ${chartData.natal.mc.sign}`, 20, y + 5);
      y += 12; y = bt(d, y, r.text, pw, ph, 18, true); y += 4;
    }
  }

  // ── CITIES ──
  y = sh(d, y, 'THRIVE ZONES \u2014 YOUR BEST CITIES', pw, ph);
  y = cityBlock(d, y, thriveC, C.thrive, cityReadingFn, pw, ph, 20);
  y = sh(d, y, 'CAUTION ZONES \u2014 CITIES TO APPROACH WITH CARE', pw, ph);
  y = cityBlock(d, y, avoidC, C.avoid, cityReadingFn, pw, ph, 15);
  y = sh(d, y, 'NEUTRAL ZONES \u2014 SUBTLE INFLUENCES', pw, ph);
  y = cityBlock(d, y, neutralC, C.neutral, cityReadingFn, pw, ph, 10);

  // ── FOOTER ──
  d.addPage(); fr(d, 0, 0, pw, ph, C.bg);
  y = ph / 2 - 30;
  if (logo) { d.addImage(logo, 'PNG', (pw - 24) / 2, y, 24, 24); y += 30; }
  d.setFont('helvetica', 'bold'); d.setFontSize(14); sc(d, C.white);
  d.text('NATAL NAVIGATOR', pw / 2, y, { align: 'center' });
  y += 8;
  d.setFont('helvetica', 'normal'); d.setFontSize(9); sc(d, C.textDim);
  d.text('Find Where Your Stars Align', pw / 2, y, { align: 'center' });
  y += 12;
  d.setFontSize(8); sc(d, C.accent);
  d.text('natalnavigator.com', pw / 2, y, { align: 'center' });

  // Page numbers
  const tp = d.internal.getNumberOfPages();
  for (let i = 1; i <= tp; i++) {
    d.setPage(i);
    d.setFont('helvetica', 'normal'); d.setFontSize(7); sc(d, C.textDim);
    d.text(`${i} / ${tp}`, pw / 2, ph - 8, { align: 'center' });
    if (i > 1) { sc(d, C.border); d.text('NATAL NAVIGATOR', pw - 16, ph - 8, { align: 'right' }); }
  }

  d.save(`NatalNavigator_${displayName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
