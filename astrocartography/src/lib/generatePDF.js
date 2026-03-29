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

const PLANET_GLYPHS = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇' };

// ── Helpers ──
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function setColor(doc, hex) {
  const [r, g, b] = hexToRgb(hex);
  doc.setTextColor(r, g, b);
}

function fillRect(doc, x, y, w, h, hex) {
  const [r, g, b] = hexToRgb(hex);
  doc.setFillColor(r, g, b);
  doc.rect(x, y, w, h, 'F');
}

function drawLine(doc, x1, y1, x2, y2, hex, width = 0.3) {
  const [r, g, b] = hexToRgb(hex);
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(width);
  doc.line(x1, y1, x2, y2);
}

// Wrap text and return lines
function wrapText(doc, text, maxWidth) {
  return doc.splitTextToSize(text, maxWidth);
}

// Check if we need a new page, add one with background if so
function checkPage(doc, y, needed, pageW, pageH) {
  if (y + needed > pageH - 20) {
    doc.addPage();
    fillRect(doc, 0, 0, pageW, pageH, C.bg);
    return 32;
  }
  return y;
}

// ── Section header ──
function sectionHeader(doc, y, title, pageW, pageH) {
  y = checkPage(doc, y, 18, pageW, pageH);
  y += 6;
  fillRect(doc, 16, y, pageW - 32, 0.5, C.accent);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setColor(doc, C.accent);
  doc.text(title, 16, y);
  y += 8;
  return y;
}

// ── Sub header ──
function subHeader(doc, y, title, color, pageW, pageH) {
  y = checkPage(doc, y, 12, pageW, pageH);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setColor(doc, color || C.textDim);
  doc.text(title, 18, y);
  y += 5;
  return y;
}

// ── Body text block ──
function bodyText(doc, y, text, pageW, pageH, indent = 18) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setColor(doc, C.textMid);
  const lines = wrapText(doc, text, pageW - indent - 18);
  for (const line of lines) {
    y = checkPage(doc, y, 5, pageW, pageH);
    doc.text(line, indent, y);
    y += 3.8;
  }
  return y + 1;
}

// ── Load logo as base64 data URL ──
async function loadLogo() {
  try {
    const resp = await fetch('/favicon-512x512.png');
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════
export async function generateNatalPDF({ displayName, chartData, thriveC, avoidC, neutralC, cityReadingFn, natalReadings }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth(); // 210
  const pageH = doc.internal.pageSize.getHeight(); // 297

  // Background
  fillRect(doc, 0, 0, pageW, pageH, C.bg);

  // ── COVER PAGE ──
  let y = 30;

  // Logo
  const logoData = await loadLogo();
  if (logoData) {
    doc.addImage(logoData, 'PNG', (pageW - 36) / 2, y, 36, 36);
    y += 42;
  }

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  setColor(doc, C.white);
  doc.text('NATAL NAVIGATOR', pageW / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(11);
  setColor(doc, C.accent);
  doc.text('Your Personal Astrocartography Report', pageW / 2, y, { align: 'center' });
  y += 14;

  // User info box
  fillRect(doc, 30, y, pageW - 60, 32, C.bgLight);
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  setColor(doc, C.text);
  doc.text(displayName, pageW / 2, y, { align: 'center' });
  y += 8;

  // Birth data
  if (chartData?.natal) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor(doc, C.textDim);
    const asc = chartData.natal.asc;
    const mc = chartData.natal.mc;
    const infoLine = `ASC ${asc?.sign} ${asc?.deg}°  ·  MC ${mc?.sign} ${mc?.deg}°`;
    doc.text(infoLine, pageW / 2, y, { align: 'center' });
    y += 6;
    const sunPlanet = chartData.planets?.find(p => p.id === 'Sun');
    const moonPlanet = chartData.planets?.find(p => p.id === 'Moon');
    if (sunPlanet && moonPlanet) {
      const line2 = `☉ Sun in ${sunPlanet.sign}  ·  ☽ Moon in ${moonPlanet.sign}`;
      doc.text(line2, pageW / 2, y, { align: 'center' });
    }
  }
  y += 18;

  // Decorative line
  fillRect(doc, 40, y, pageW - 80, 0.3, C.border);
  y += 10;

  // Report date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setColor(doc, C.textDim);
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageW / 2, y, { align: 'center' });
  y += 4;
  doc.text('natalnavigator.com', pageW / 2, y, { align: 'center' });

  // ════════════════════════════════════════
  // PAGE 2+: NATAL CHART OVERVIEW
  // ════════════════════════════════════════
  doc.addPage();
  fillRect(doc, 0, 0, pageW, pageH, C.bg);
  y = 20;

  y = sectionHeader(doc, y, 'YOUR NATAL CHART', pageW, pageH);

  // Planet table header
  fillRect(doc, 16, y, pageW - 32, 7, C.panel);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  setColor(doc, C.textDim);
  doc.text('PLANET', 20, y + 5);
  doc.text('SIGN', 60, y + 5);
  doc.text('DEGREE', 100, y + 5);
  doc.text('HOUSE', 130, y + 5);
  doc.text('ELEMENT', 158, y + 5);
  y += 9;

  const SIGN_ELEMENTS = { Aries: 'Fire', Taurus: 'Earth', Gemini: 'Air', Cancer: 'Water', Leo: 'Fire', Virgo: 'Earth', Libra: 'Air', Scorpio: 'Water', Sagittarius: 'Fire', Capricorn: 'Earth', Aquarius: 'Air', Pisces: 'Water' };
  const ELEM_COL = { Fire: '#F04060', Earth: '#00D88A', Air: '#5BA8D4', Water: '#4868B8' };

  if (chartData?.planets) {
    for (const p of chartData.planets) {
      y = checkPage(doc, y, 7, pageW, pageH);
      const elem = SIGN_ELEMENTS[p.sign] || '';
      const rowBg = chartData.planets.indexOf(p) % 2 === 0 ? C.bg : C.bgLight;
      fillRect(doc, 16, y - 4, pageW - 32, 7, rowBg);

      // Planet name with color
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      setColor(doc, PCOL[p.id] || C.text);
      doc.text(`${PLANET_GLYPHS[p.id] || ''} ${p.id}`, 20, y);

      // Sign
      doc.setFont('helvetica', 'normal');
      setColor(doc, C.text);
      doc.text(p.sign, 60, y);

      // Degree
      doc.setFontSize(8);
      setColor(doc, C.textDim);
      doc.text(`${p.deg}° ${String(p.min).padStart(2, '0')}'${p.retrograde ? ' ℞' : ''}`, 100, y);

      // House
      setColor(doc, C.textMid);
      doc.text(p.house ? `${p.house}` : '–', 135, y);

      // Element
      setColor(doc, ELEM_COL[elem] || C.textDim);
      doc.text(elem, 158, y);

      y += 7;
    }
  }

  // Angles
  if (chartData?.natal) {
    y += 3;
    drawLine(doc, 16, y, pageW - 16, y, C.border);
    y += 5;
    for (const [label, data] of [['Ascendant', chartData.natal.asc], ['Midheaven', chartData.natal.mc]]) {
      if (!data) continue;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      setColor(doc, '#E8A838');
      doc.text(label, 20, y);
      doc.setFont('helvetica', 'normal');
      setColor(doc, C.text);
      doc.text(`${data.sign} ${data.deg}° ${String(data.min).padStart(2, '0')}'`, 60, y);
      y += 7;
    }
  }

  // ════════════════════════════════════════
  // NATAL READINGS — Planet in Sign + House
  // ════════════════════════════════════════
  y += 4;
  y = sectionHeader(doc, y, 'YOUR PLANETARY READINGS', pageW, pageH);

  if (chartData?.planets && natalReadings) {
    for (const p of chartData.planets) {
      const signReading = natalReadings.PLANET_IN_SIGN?.[`${p.id}-${p.sign}`];
      const houseReading = p.house ? natalReadings.PLANET_IN_HOUSE?.[`${p.id}-${p.house}`] : null;
      const planetInfo = natalReadings.PLANET_INFO?.[p.id];

      // Planet title
      y = checkPage(doc, y, 20, pageW, pageH);
      fillRect(doc, 16, y - 1, pageW - 32, 9, C.panel);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      setColor(doc, PCOL[p.id] || C.text);
      const title = `${PLANET_GLYPHS[p.id] || ''} ${p.id} in ${p.sign}`;
      doc.text(title, 20, y + 5);
      if (p.house) {
        doc.setFontSize(8);
        setColor(doc, C.textDim);
        const ORDINALS = ['','First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth','Eleventh','Twelfth'];
        doc.text(`${ORDINALS[p.house]} House`, pageW - 20, y + 5, { align: 'right' });
      }
      y += 12;

      // Planet description
      if (planetInfo) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        setColor(doc, C.textDim);
        const descLines = wrapText(doc, planetInfo.description, pageW - 40);
        for (const line of descLines) {
          y = checkPage(doc, y, 4, pageW, pageH);
          doc.text(line, 20, y);
          y += 3.5;
        }
        y += 2;
      }

      // Sign reading
      if (signReading) {
        y = subHeader(doc, y, `${p.id.toUpperCase()} IN ${p.sign.toUpperCase()}`, PCOL[p.id], pageW, pageH);
        y = bodyText(doc, y, signReading.text, pageW, pageH);
        y += 1;
      }

      // House reading
      if (houseReading) {
        const ORDINALS = ['','FIRST','SECOND','THIRD','FOURTH','FIFTH','SIXTH','SEVENTH','EIGHTH','NINTH','TENTH','ELEVENTH','TWELFTH'];
        y = subHeader(doc, y, `${p.id.toUpperCase()} IN THE ${ORDINALS[p.house]} HOUSE`, PCOL[p.id], pageW, pageH);
        y = bodyText(doc, y, houseReading.text, pageW, pageH);
      }

      y += 4;
    }
  }

  // ── Ascendant Reading ──
  if (chartData?.natal?.asc && natalReadings?.ASC_IN_SIGN) {
    const sign = chartData.natal.asc.sign;
    const reading = natalReadings.ASC_IN_SIGN[sign];
    if (reading) {
      y = checkPage(doc, y, 20, pageW, pageH);
      fillRect(doc, 16, y - 1, pageW - 32, 9, C.panel);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      setColor(doc, '#E8A838');
      doc.text(`△ Ascendant in ${sign}`, 20, y + 5);
      y += 12;
      y = bodyText(doc, y, reading.text, pageW, pageH);
      y += 4;
    }
  }

  // ── Midheaven Reading ──
  if (chartData?.natal?.mc && natalReadings?.MC_IN_SIGN) {
    const sign = chartData.natal.mc.sign;
    const reading = natalReadings.MC_IN_SIGN[sign];
    if (reading) {
      y = checkPage(doc, y, 20, pageW, pageH);
      fillRect(doc, 16, y - 1, pageW - 32, 9, C.panel);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      setColor(doc, '#E8A838');
      doc.text(`▽ Midheaven in ${sign}`, 20, y + 5);
      y += 12;
      y = bodyText(doc, y, reading.text, pageW, pageH);
      y += 4;
    }
  }

  // ════════════════════════════════════════
  // ASTROCARTOGRAPHY — THRIVE CITIES
  // ════════════════════════════════════════
  y = sectionHeader(doc, y, 'THRIVE ZONES — YOUR BEST CITIES', pageW, pageH);
  y = citySection(doc, y, thriveC, C.thrive, cityReadingFn, pageW, pageH, 20);

  // ════════════════════════════════════════
  // CAUTION CITIES
  // ════════════════════════════════════════
  y = sectionHeader(doc, y, 'CAUTION ZONES — CITIES TO APPROACH WITH CARE', pageW, pageH);
  y = citySection(doc, y, avoidC, C.avoid, cityReadingFn, pageW, pageH, 15);

  // ════════════════════════════════════════
  // NEUTRAL CITIES
  // ════════════════════════════════════════
  y = sectionHeader(doc, y, 'NEUTRAL ZONES — SUBTLE INFLUENCES', pageW, pageH);
  y = citySection(doc, y, neutralC, C.neutral, cityReadingFn, pageW, pageH, 10);

  // ════════════════════════════════════════
  // FOOTER PAGE
  // ════════════════════════════════════════
  doc.addPage();
  fillRect(doc, 0, 0, pageW, pageH, C.bg);
  y = pageH / 2 - 30;

  if (logoData) {
    doc.addImage(logoData, 'PNG', (pageW - 24) / 2, y, 24, 24);
    y += 30;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  setColor(doc, C.white);
  doc.text('NATAL NAVIGATOR', pageW / 2, y, { align: 'center' });
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setColor(doc, C.textDim);
  doc.text('Find Where Your Stars Align', pageW / 2, y, { align: 'center' });
  y += 12;

  doc.setFontSize(8);
  setColor(doc, C.accent);
  doc.text('natalnavigator.com', pageW / 2, y, { align: 'center' });
  y += 8;

  setColor(doc, C.textDim);
  doc.setFontSize(7);
  doc.text('This report was generated based on your unique birth chart.', pageW / 2, y, { align: 'center' });
  y += 4;
  doc.text('Planetary positions calculated using the astronomy-engine library.', pageW / 2, y, { align: 'center' });

  // Add page numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setColor(doc, C.textDim);
    doc.text(`${i} / ${totalPages}`, pageW / 2, pageH - 8, { align: 'center' });
    if (i > 1) {
      setColor(doc, C.border);
      doc.text('NATAL NAVIGATOR', pageW - 16, pageH - 8, { align: 'right' });
    }
  }

  // Save
  const safeName = displayName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`NatalNavigator_${safeName}.pdf`);
}

// ── City section renderer ──
function citySection(doc, y, cities, color, readingFn, pageW, pageH, maxCities) {
  const list = cities.slice(0, maxCities);

  if (list.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    setColor(doc, C.textDim);
    y = checkPage(doc, y, 6, pageW, pageH);
    doc.text('No cities found in this zone.', 20, y);
    y += 8;
    return y;
  }

  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    const reading = readingFn ? readingFn(c) : '';

    // City header row
    y = checkPage(doc, y, 18, pageW, pageH);
    fillRect(doc, 16, y - 2, pageW - 32, 8, i % 2 === 0 ? C.bgLight : C.bg);

    // Rank
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setColor(doc, color);
    doc.text(`${i + 1}.`, 20, y + 3);

    // City name
    doc.setFontSize(9);
    setColor(doc, C.text);
    doc.text(c.name, 30, y + 3);

    // Line info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setColor(doc, C.textDim);
    doc.text(`${c.line}  ·  ${c.dist.toFixed(1)}° orb`, pageW - 20, y + 3, { align: 'right' });

    y += 9;

    // Reading text
    if (reading) {
      y = bodyText(doc, y, reading, pageW, pageH, 20);
      y += 1;
    }
  }

  y += 3;
  return y;
}
