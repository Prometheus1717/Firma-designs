import Astronomy from 'astronomy-engine';

// Planet definitions for astrocartography
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
  Sun: '#E8A838',
  Moon: '#C0C0C0',
  Mercury: '#5BA8D4',
  Venus: '#D4729A',
  Mars: '#D45050',
  Jupiter: '#8068C0',
  Saturn: '#887058',
  Uranus: '#40B0A0',
  Neptune: '#4868B8',
  Pluto: '#7048A0',
};

// Convert ecliptic longitude to zodiac sign + degree
function eclipticToZodiac(lon) {
  const sign = Math.floor(lon / 30);
  const deg = lon - sign * 30;
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return { sign: ZODIAC_SIGNS[sign], deg: d, min: m, fullDeg: lon };
}

// Calculate the Local Sidereal Time for a given UT date and longitude
function localSiderealTime(date, lngDeg) {
  const gast = Astronomy.SiderealTime(date);
  let lst = gast + lngDeg / 15.0;
  while (lst < 0) lst += 24;
  while (lst >= 24) lst -= 24;
  return lst; // in hours
}

// Calculate MC longitude (ecliptic) for a given LST and obliquity
function mcLongitude(lstHours, obliquityDeg) {
  const lstRad = (lstHours * 15) * Math.PI / 180;
  const oblRad = obliquityDeg * Math.PI / 180;
  let mc = Math.atan2(Math.sin(lstRad), Math.cos(lstRad) * Math.cos(oblRad));
  mc = mc * 180 / Math.PI;
  if (mc < 0) mc += 360;
  return mc;
}

// Calculate ASC for given LST, latitude, and obliquity
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

// For a planet at ecliptic longitude `planetLon`, find the geographic longitude
// where that planet is on the MC (Midheaven)
function findMCLine(planetLon, date, obliquity) {
  // MC = planet longitude when RAMC aligns
  // We need: LST such that mcLongitude(LST, obliquity) = planetLon
  // This means: RAMC = atan2(sin(planetLon) * cos(obliquity), cos(planetLon))
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

// IC line is 180° opposite of MC
function findICLine(planetLon, date, obliquity) {
  let icLon = findMCLine(planetLon, date, obliquity) + 180;
  if (icLon > 180) icLon -= 360;
  return icLon;
}

// For ASC/DSC lines, the longitude varies with latitude — they are curves
// We sample at different latitudes to get the line path
function findASCLine(planetLon, date, obliquity, latitudes) {
  const gast = Astronomy.SiderealTime(date);
  const points = [];

  for (const lat of latitudes) {
    // We need to find geographic longitude where ASC = planetLon at this latitude
    // Binary search / Newton's method approach
    let bestLon = null;
    let bestErr = 999;

    // Scan in 2-degree steps, then refine
    for (let testLon = -180; testLon <= 180; testLon += 2) {
      const lst = gast + testLon / 15;
      const asc = ascLongitude(lst, lat, obliquity);
      let err = Math.abs(asc - planetLon);
      if (err > 180) err = 360 - err;
      if (err < bestErr) {
        bestErr = err;
        bestLon = testLon;
      }
    }

    // Refine with smaller steps
    if (bestLon !== null && bestErr < 10) {
      for (let testLon = bestLon - 2; testLon <= bestLon + 2; testLon += 0.1) {
        const lst = gast + testLon / 15;
        const asc = ascLongitude(lst, lat, obliquity);
        let err = Math.abs(asc - planetLon);
        if (err > 180) err = 360 - err;
        if (err < bestErr) {
          bestErr = err;
          bestLon = testLon;
        }
      }
    }

    if (bestLon !== null && bestErr < 2) {
      points.push([bestLon, lat]);
    }
  }

  return points;
}

function findDSCLine(planetLon, date, obliquity, latitudes) {
  // DSC = ASC + 180
  let dscTarget = planetLon + 180;
  if (dscTarget >= 360) dscTarget -= 360;
  return findASCLine(dscTarget, date, obliquity, latitudes);
}

// Quality assessment based on planetary nature
function getQuality(planetId, angle) {
  const benefics = ['Venus', 'Jupiter', 'Sun'];
  const malefics = ['Saturn', 'Pluto', 'Neptune'];
  const neutral = ['Mars', 'Mercury', 'Moon', 'Uranus'];

  if (benefics.includes(planetId)) return 'thrive';
  if (malefics.includes(planetId)) return 'avoid';
  // Mars MC/ASC can be energizing but intense
  if (planetId === 'Mars') return angle === 'MC' ? 'thrive' : 'neutral';
  if (planetId === 'Moon') return 'thrive';
  return 'neutral';
}

// Generate description for a line
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

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { date, time } = req.body;
    const lat = parseFloat(req.body.lat);
    const lng = parseFloat(req.body.lng);
    if (!date || !time || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Missing required fields: date, time, lat, lng' });
    }

    // Parse birth datetime as UTC (simplified — in production, handle timezone from birth location)
    const birthDate = new Date(`${date}T${time}:00Z`);
    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date/time format' });
    }

    const astroDate = Astronomy.MakeTime(birthDate);

    // Get obliquity of the ecliptic
    const obliquity = 23.4393 - 0.0000004 * (astroDate.ut - 2451545.0);

    // Calculate GAST for birth time
    const gast = Astronomy.SiderealTime(astroDate);
    const lst = gast + lng / 15;

    // Calculate MC and ASC for birth location
    const natalMC = mcLongitude(lst, obliquity);
    const natalASC = ascLongitude(lst, lat, obliquity);

    // Latitude samples for ASC/DSC curves
    const latSamples = [];
    for (let l = -65; l <= 65; l += 1) latSamples.push(l);

    // Calculate each planet's position and lines
    const planetPositions = [];
    const lines = [];

    for (const planet of PLANETS) {
      // Get ecliptic longitude
      let eclLon;
      if (planet.id === 'Sun') {
        eclLon = Astronomy.SunPosition(astroDate).elon;
      } else {
        const equ = Astronomy.Ecliptic(Astronomy.GeoVector(planet.body, astroDate, true));
        eclLon = equ.elon;
      }

      const zodiac = eclipticToZodiac(eclLon);

      // Check retrograde (simplified — compare position 1 day later)
      let isRetro = false;
      if (planet.id !== 'Sun' && planet.id !== 'Moon') {
        const nextDay = Astronomy.MakeTime(new Date(birthDate.getTime() + 86400000));
        const nextEqu = Astronomy.Ecliptic(Astronomy.GeoVector(planet.body, nextDay, true));
        let diff = nextEqu.elon - eclLon;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        isRetro = diff < 0;
      }

      planetPositions.push({
        id: planet.id,
        symbol: planet.symbol,
        sign: zodiac.sign,
        deg: zodiac.deg,
        min: zodiac.min,
        fullDeg: zodiac.fullDeg,
        retrograde: isRetro,
      });

      // MC line
      const mcLon = findMCLine(eclLon, astroDate, obliquity);
      lines.push({
        n: `${planet.id} MC`,
        planet: planet.id,
        symbol: planet.symbol,
        angle: 'MC',
        lo: mcLon,
        c: LINE_COLORS[planet.id],
        quality: getQuality(planet.id, 'MC'),
        desc: getLineDescription(planet.id, 'MC', zodiac),
        type: 'meridian',
      });

      // IC line
      const icLon = findICLine(eclLon, astroDate, obliquity);
      lines.push({
        n: `${planet.id} IC`,
        planet: planet.id,
        symbol: planet.symbol,
        angle: 'IC',
        lo: icLon,
        c: LINE_COLORS[planet.id],
        quality: getQuality(planet.id, 'IC'),
        desc: getLineDescription(planet.id, 'IC', zodiac),
        type: 'meridian',
      });

      // ASC line (curve)
      const ascPoints = findASCLine(eclLon, astroDate, obliquity, latSamples);
      if (ascPoints.length > 2) {
        lines.push({
          n: `${planet.id} ASC`,
          planet: planet.id,
          symbol: planet.symbol,
          angle: 'ASC',
          points: ascPoints,
          c: LINE_COLORS[planet.id],
          quality: getQuality(planet.id, 'ASC'),
          desc: getLineDescription(planet.id, 'ASC', zodiac),
          type: 'curve',
        });
      }

      // DSC line (curve)
      const dscPoints = findDSCLine(eclLon, astroDate, obliquity, latSamples);
      if (dscPoints.length > 2) {
        lines.push({
          n: `${planet.id} DC`,
          planet: planet.id,
          symbol: planet.symbol,
          angle: 'DC',
          points: dscPoints,
          c: LINE_COLORS[planet.id],
          quality: getQuality(planet.id, 'DC'),
          desc: getLineDescription(planet.id, 'DC', zodiac),
          type: 'curve',
        });
      }
    }

    // Natal chart summary
    const natalMCZodiac = eclipticToZodiac(natalMC);
    const natalASCZodiac = eclipticToZodiac(natalASC);

    // Build planet string for ticker
    const planetString = planetPositions.map(p =>
      `${p.symbol} ${p.sign} ${p.deg}°${String(p.min).padStart(2, '0')}'${p.retrograde ? '℞' : ''}`
    ).join(' · ') + ` · ASC ${natalASCZodiac.sign} ${natalASCZodiac.deg}°${String(natalASCZodiac.min).padStart(2, '0')}' · MC ${natalMCZodiac.sign} ${natalMCZodiac.deg}°${String(natalMCZodiac.min).padStart(2, '0')}'`;

    return res.status(200).json({
      planets: planetPositions,
      lines,
      natal: {
        mc: natalMCZodiac,
        asc: natalASCZodiac,
        sun: planetPositions.find(p => p.id === 'Sun'),
        moon: planetPositions.find(p => p.id === 'Moon'),
      },
      planetString,
      birthLocation: { lat, lng },
    });

  } catch (err) {
    console.error('Chart calculation error:', err);
    return res.status(500).json({ error: 'Failed to calculate chart: ' + err.message });
  }
}
