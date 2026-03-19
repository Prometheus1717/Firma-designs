import * as Astronomy from 'astronomy-engine';

const PLANETS = [
  { id: 'Sun', symbol: '☉', body: Astronomy.Body.Sun },
  { id: 'Moon', symbol: '☽', body: Astronomy.Body.Moon },
  { id: 'Mercury', symbol: '☿', body: Astronomy.Body.Mercury },
  { id: 'Venus', symbol: '♀', body: Astronomy.Body.Venus },
  { id: 'Mars', symbol: '♂', body: Astronomy.Body.Mars },
  { id: 'Jupiter', symbol: '♃', body: Astronomy.Body.Jupiter },
  { id: 'Saturn', symbol: '♄', body: Astronomy.Body.Saturn },
  { id: 'Uranus', symbol: '♅', body: Astronomy.Body.Uranus },
  { id: 'Neptune', symbol: '♆', body: Astronomy.Body.Neptune },
  { id: 'Pluto', symbol: '♇', body: Astronomy.Body.Pluto },
];

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const LINE_COLORS = {
  Sun: '#E8A838', Moon: '#C0C0C0', Mercury: '#5BA8D4', Venus: '#D4729A',
  Mars: '#D45050', Jupiter: '#8068C0', Saturn: '#887058', Uranus: '#40B0A0',
  Neptune: '#4868B8', Pluto: '#7048A0',
};

function eclipticToZodiac(lon) {
  const sign = Math.floor(lon / 30);
  const deg = lon - sign * 30;
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return { sign: ZODIAC_SIGNS[sign], deg: d, min: m, fullDeg: lon };
}

function mcLongitude(lstHours, obliquityDeg) {
  const lstRad = (lstHours * 15) * Math.PI / 180;
  const oblRad = obliquityDeg * Math.PI / 180;
  let mc = Math.atan2(Math.sin(lstRad), Math.cos(lstRad) * Math.cos(oblRad));
  mc = mc * 180 / Math.PI;
  if (mc < 0) mc += 360;
  return mc;
}

function ascLongitude(lstHours, latDeg, obliquityDeg) {
  const lstRad = (lstHours * 15) * Math.PI / 180;
  const latRad = latDeg * Math.PI / 180;
  const oblRad = obliquityDeg * Math.PI / 180;
  const y = -Math.cos(lstRad);
  const x = Math.sin(oblRad) * Math.tan(latRad) + Math.cos(oblRad) * Math.sin(lstRad);
  let asc = Math.atan2(y, x) * 180 / Math.PI;
  if (asc < 0) asc += 360;
  return asc;
}

function findMCLine(planetLon, date, obliquity) {
  const lonRad = planetLon * Math.PI / 180;
  const oblRad = obliquity * Math.PI / 180;
  let ramc = Math.atan2(Math.sin(lonRad) * Math.cos(oblRad), Math.cos(lonRad));
  if (ramc < 0) ramc += 2 * Math.PI;
  const ramcHours = (ramc * 180 / Math.PI) / 15;
  const gast = Astronomy.SiderealTime(date);
  let geoLon = (ramcHours - gast) * 15;
  while (geoLon > 180) geoLon -= 360;
  while (geoLon < -180) geoLon += 360;
  return geoLon;
}

function findICLine(planetLon, date, obliquity) {
  let icLon = findMCLine(planetLon, date, obliquity) + 180;
  if (icLon > 180) icLon -= 360;
  return icLon;
}

// Analytical ASC line solver — replaces brute-force search.
// Solves: ascLongitude(LST, lat, obliquity) = planetLon
// This is equivalent to: cos(λp)·cos(θ) + sin(λp)·cos(ε)·sin(θ) = -sin(λp)·sin(ε)·tan(φ)
// which has the form A·cos(θ) + B·sin(θ) = C, solvable as θ = atan2(B,A) ± acos(C/R)
function findASCLine(planetLon, date, obliquity, latitudes) {
  const gast = Astronomy.SiderealTime(date);
  const D2R = Math.PI / 180;
  const R2D = 180 / Math.PI;
  const lp = planetLon * D2R;
  const ep = obliquity * D2R;
  const sinL = Math.sin(lp), cosL = Math.cos(lp);
  const sinE = Math.sin(ep), cosE = Math.cos(ep);

  const A = cosL;
  const B = sinL * cosE;
  const R = Math.sqrt(A * A + B * B);
  const delta = Math.atan2(B, A);

  const points = [];

  for (const lat of latitudes) {
    if (Math.abs(lat) >= 89) continue;
    const tanPhi = Math.tan(lat * D2R);
    const C = -sinL * sinE * tanPhi;
    const ratio = C / R;
    if (ratio < -1 || ratio > 1) continue;

    const alpha = Math.acos(Math.max(-1, Math.min(1, ratio)));

    for (const s of [1, -1]) {
      const theta = delta + s * alpha;
      const lstH = (theta * R2D) / 15;
      let lon = (lstH - gast) * 15;
      while (lon > 180) lon -= 360;
      while (lon < -180) lon += 360;

      // Verify solution (atan2 quadrant check)
      const asc = ascLongitude(gast + lon / 15, lat, obliquity);
      let err = Math.abs(asc - planetLon);
      if (err > 180) err = 360 - err;
      if (err < 1.5) points.push([lon, lat]);
    }
  }

  points.sort((a, b) => a[1] - b[1]);
  return points;
}

// Split a curve into segments at large longitude jumps (antimeridian crossing)
function splitCurveSegments(points) {
  if (points.length < 2) return [points];
  const segments = [];
  let seg = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const lonDiff = Math.abs(points[i][0] - points[i - 1][0]);
    if (lonDiff > 90) {
      // Big jump — start a new segment
      if (seg.length > 1) segments.push(seg);
      seg = [points[i]];
    } else {
      seg.push(points[i]);
    }
  }
  if (seg.length > 1) segments.push(seg);
  return segments;
}

function findDSCLine(planetLon, date, obliquity, latitudes) {
  let dscTarget = planetLon + 180;
  if (dscTarget >= 360) dscTarget -= 360;
  return findASCLine(dscTarget, date, obliquity, latitudes);
}

function getQuality(planetId, angle) {
  const benefics = ['Venus', 'Jupiter', 'Sun'];
  const malefics = ['Saturn', 'Pluto', 'Neptune'];
  if (benefics.includes(planetId)) return 'thrive';
  if (malefics.includes(planetId)) return 'avoid';
  if (planetId === 'Mars') return angle === 'MC' ? 'thrive' : 'neutral';
  if (planetId === 'Moon') return 'thrive';
  return 'neutral';
}

function getLineDescription(planetId, angle, zodiacInfo) {
  const descs = {
    'Sun-MC': `Your Sun Midheaven — the peak of career visibility. Here you are recognized as an authority. Sun in ${zodiacInfo.sign} gives you a powerful public presence.`,
    'Sun-IC': `Sun on the IC — your inner light shines at home here. Deep connection to roots and family identity. Sun in ${zodiacInfo.sign} illuminates your private world.`,
    'Sun-ASC': `Sun Ascendant — you radiate confidence and vitality here. Others see your true self. Sun in ${zodiacInfo.sign} shapes how the world perceives you.`,
    'Sun-DC': `Sun Descendant — partnerships illuminate your life here. You attract powerful allies. Sun in ${zodiacInfo.sign} brings warmth to all relationships.`,
    'Moon-MC': `Moon Midheaven — emotional fulfillment through career. The public responds to your sensitivity. Moon in ${zodiacInfo.sign} makes your work deeply personal.`,
    'Moon-IC': `Moon on the IC — this is your soul's home. Deep emotional roots, nurturing environment. Moon in ${zodiacInfo.sign} creates profound belonging.`,
    'Moon-ASC': `Moon Ascendant — your emotions are visible here. Others sense your moods and respond. Moon in ${zodiacInfo.sign} makes you magnetically empathetic.`,
    'Moon-DC': `Moon Descendant — deep emotional bonds form here. Partnerships feel fated. Moon in ${zodiacInfo.sign} attracts nurturing connections.`,
    'Mercury-MC': `Mercury Midheaven — your voice carries weight here. Communication, writing, and teaching flourish. Mercury in ${zodiacInfo.sign} makes your words resonate.`,
    'Mercury-IC': `Mercury on the IC — intellectual home base. Ideas flow freely in private. Mercury in ${zodiacInfo.sign} sharpens your inner dialogue.`,
    'Mercury-ASC': `Mercury Ascendant — quick wit and sharp mind define you here. Mercury in ${zodiacInfo.sign} makes you a natural communicator.`,
    'Mercury-DC': `Mercury Descendant — intellectual partnerships thrive. Mercury in ${zodiacInfo.sign} attracts stimulating conversations and collaborators.`,
    'Venus-MC': `Venus Midheaven — public magnetism and aesthetic recognition. You are perceived as charming and creatively compelling. Venus in ${zodiacInfo.sign} enhances your allure.`,
    'Venus-IC': `Venus on the IC — your soul feels at home. Creative nourishment, beauty in daily life. Venus in ${zodiacInfo.sign} makes this profoundly comforting.`,
    'Venus-ASC': `Venus Ascendant — beauty, charm, and grace define your presence. Venus in ${zodiacInfo.sign} makes you irresistibly attractive here.`,
    'Venus-DC': `Venus Descendant — love and partnership flourish. Venus in ${zodiacInfo.sign} attracts harmonious, beautiful relationships.`,
    'Mars-MC': `Mars Midheaven — raw ambition ignites. Career drive and competitive spirit peak. Mars in ${zodiacInfo.sign} fuels your professional fire.`,
    'Mars-IC': `Mars on the IC — intense home energy. Strong drive to build and protect your foundation. Mars in ${zodiacInfo.sign} energizes your private life.`,
    'Mars-ASC': `Mars Ascendant — physical energy and assertiveness peak. Others see your strength. Mars in ${zodiacInfo.sign} makes you a force of nature.`,
    'Mars-DC': `Mars Descendant — passionate partnerships, but potential for conflict. Mars in ${zodiacInfo.sign} attracts dynamic, challenging relationships.`,
    'Jupiter-MC': `Jupiter Midheaven — expansion, luck, and recognition in career. Jupiter in ${zodiacInfo.sign} opens doors to abundant opportunity.`,
    'Jupiter-IC': `Jupiter on the IC — abundant home life, generosity of spirit. Jupiter in ${zodiacInfo.sign} creates a feeling of inner wealth.`,
    'Jupiter-ASC': `Jupiter Ascendant — optimism and growth define you here. Jupiter in ${zodiacInfo.sign} makes you larger than life.`,
    'Jupiter-DC': `Jupiter Descendant — partnerships expand abundantly. Mentors and benefactors appear. Jupiter in ${zodiacInfo.sign} favors generous alliances.`,
    'Saturn-MC': `Saturn Midheaven — serious career responsibility. Hard work pays off slowly. Saturn in ${zodiacInfo.sign} demands discipline for lasting achievement.`,
    'Saturn-IC': `Saturn on the IC — heavy foundations. Responsibility toward family and roots. Saturn in ${zodiacInfo.sign} builds enduring but demanding structures.`,
    'Saturn-ASC': `Saturn Ascendant — heaviness settles on your identity. You feel older, more restricted. Saturn in ${zodiacInfo.sign} suppresses spontaneity. Best avoided for long stays.`,
    'Saturn-DC': `Saturn Descendant — serious, committed partnerships but with restriction. Saturn in ${zodiacInfo.sign} attracts relationships that demand maturity.`,
    'Uranus-MC': `Uranus Midheaven — sudden career changes and breakthroughs. Uranus in ${zodiacInfo.sign} brings innovative, unconventional professional paths.`,
    'Uranus-IC': `Uranus on the IC — restless home life, sudden moves. Uranus in ${zodiacInfo.sign} disrupts domestic stability but sparks freedom.`,
    'Uranus-ASC': `Uranus Ascendant — radical self-expression. Others see you as unique and unpredictable. Uranus in ${zodiacInfo.sign} makes you a revolutionary.`,
    'Uranus-DC': `Uranus Descendant — exciting but unstable partnerships. Uranus in ${zodiacInfo.sign} attracts unconventional, electric connections.`,
    'Neptune-MC': `Neptune Midheaven — creative, spiritual career potential but potential for confusion. Neptune in ${zodiacInfo.sign} inspires artistic vision.`,
    'Neptune-IC': `Neptune on the IC — your sense of home dissolves. Confusion about roots, boundaries blur. Neptune in ${zodiacInfo.sign} undermines structures.`,
    'Neptune-ASC': `Neptune Ascendant — dreamy, ethereal presence but identity confusion. Neptune in ${zodiacInfo.sign} makes you seem mysterious and elusive.`,
    'Neptune-DC': `Neptune Descendant — idealized but potentially deceptive partnerships. Neptune in ${zodiacInfo.sign} creates romantic illusions.`,
    'Pluto-MC': `Pluto Midheaven — transformative career power. Intense public presence. Pluto in ${zodiacInfo.sign} brings deep, lasting professional change.`,
    'Pluto-IC': `Pluto on the IC — deep psychological transformation at home. Pluto in ${zodiacInfo.sign} unearths buried family dynamics.`,
    'Pluto-ASC': `Pluto Ascendant — identity-level intensity. Power struggles, forced transformation. Pluto in ${zodiacInfo.sign} challenges your core being.`,
    'Pluto-DC': `Pluto Descendant — intense, transformative relationships. Power dynamics in partnerships. Pluto in ${zodiacInfo.sign} attracts fateful bonds.`,
  };
  return descs[`${planetId}-${angle}`] || `${planetId} ${angle} line — ${zodiacInfo.sign} ${zodiacInfo.deg}°${zodiacInfo.min}'`;
}

export function calculateChart({ date, time, lat, lng }) {
  // Normalize time — Supabase may return HH:MM:SS, we need HH:MM:SS for ISO
  const normalizedTime = time.length === 5 ? `${time}:00` : time; // HH:MM → HH:MM:00
  const birthDate = new Date(`${date}T${normalizedTime}Z`);
  if (isNaN(birthDate.getTime())) throw new Error(`Invalid date/time: ${date} ${time}`);

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  if (isNaN(parsedLat) || isNaN(parsedLng)) throw new Error('Invalid coordinates');

  const astroDate = Astronomy.MakeTime(birthDate);
  const obliquity = 23.4393 - 0.0000004 * (astroDate.ut - 2451545.0);
  const gast = Astronomy.SiderealTime(astroDate);
  const lst = gast + parsedLng / 15;
  const natalMC = mcLongitude(lst, obliquity);
  const natalASC = ascLongitude(lst, parsedLat, obliquity);

  const latSamples = [];
  for (let l = -80; l <= 80; l += 1) latSamples.push(l);

  const planetPositions = [];
  const lines = [];

  for (const planet of PLANETS) {
    let eclLon;
    if (planet.id === 'Sun') {
      eclLon = Astronomy.SunPosition(astroDate).elon;
    } else {
      eclLon = Astronomy.Ecliptic(Astronomy.GeoVector(planet.body, astroDate, true)).elon;
    }

    const zodiac = eclipticToZodiac(eclLon);

    let isRetro = false;
    if (planet.id !== 'Sun' && planet.id !== 'Moon') {
      const nextDay = Astronomy.MakeTime(new Date(birthDate.getTime() + 86400000));
      const nextElon = Astronomy.Ecliptic(Astronomy.GeoVector(planet.body, nextDay, true)).elon;
      let diff = nextElon - eclLon;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      isRetro = diff < 0;
    }

    planetPositions.push({
      id: planet.id, symbol: planet.symbol, sign: zodiac.sign,
      deg: zodiac.deg, min: zodiac.min, fullDeg: zodiac.fullDeg, retrograde: isRetro,
    });

    const mcLon = findMCLine(eclLon, astroDate, obliquity);
    lines.push({ n: `${planet.id} MC`, planet: planet.id, symbol: planet.symbol, angle: 'MC', lo: mcLon, c: LINE_COLORS[planet.id], quality: getQuality(planet.id, 'MC'), desc: getLineDescription(planet.id, 'MC', zodiac), type: 'meridian' });

    const icLon = findICLine(eclLon, astroDate, obliquity);
    lines.push({ n: `${planet.id} IC`, planet: planet.id, symbol: planet.symbol, angle: 'IC', lo: icLon, c: LINE_COLORS[planet.id], quality: getQuality(planet.id, 'IC'), desc: getLineDescription(planet.id, 'IC', zodiac), type: 'meridian' });

    const ascPoints = findASCLine(eclLon, astroDate, obliquity, latSamples);
    if (ascPoints.length > 2) {
      const ascSegments = splitCurveSegments(ascPoints);
      lines.push({ n: `${planet.id} ASC`, planet: planet.id, symbol: planet.symbol, angle: 'ASC', points: ascPoints, segments: ascSegments, c: LINE_COLORS[planet.id], quality: getQuality(planet.id, 'ASC'), desc: getLineDescription(planet.id, 'ASC', zodiac), type: 'curve' });
    }

    const dscPoints = findDSCLine(eclLon, astroDate, obliquity, latSamples);
    if (dscPoints.length > 2) {
      const dscSegments = splitCurveSegments(dscPoints);
      lines.push({ n: `${planet.id} DC`, planet: planet.id, symbol: planet.symbol, angle: 'DC', points: dscPoints, segments: dscSegments, c: LINE_COLORS[planet.id], quality: getQuality(planet.id, 'DC'), desc: getLineDescription(planet.id, 'DC', zodiac), type: 'curve' });
    }
  }

  const natalMCZodiac = eclipticToZodiac(natalMC);
  const natalASCZodiac = eclipticToZodiac(natalASC);

  const planetString = planetPositions.map(p =>
    `${p.symbol} ${p.sign} ${p.deg}°${String(p.min).padStart(2, '0')}'${p.retrograde ? '℞' : ''}`
  ).join(' · ') + ` · ASC ${natalASCZodiac.sign} ${natalASCZodiac.deg}°${String(natalASCZodiac.min).padStart(2, '0')}' · MC ${natalMCZodiac.sign} ${natalMCZodiac.deg}°${String(natalMCZodiac.min).padStart(2, '0')}'`;

  return {
    planets: planetPositions,
    lines,
    natal: {
      mc: natalMCZodiac, asc: natalASCZodiac,
      sun: planetPositions.find(p => p.id === 'Sun'),
      moon: planetPositions.find(p => p.id === 'Moon'),
    },
    planetString,
    birthLocation: { lat: parsedLat, lng: parsedLng },
  };
}
