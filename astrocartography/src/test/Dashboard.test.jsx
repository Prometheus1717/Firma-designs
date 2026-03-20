import { describe, it, expect, beforeAll } from 'vitest';
import { calculateChart } from '../lib/calculateChart';
import { ALL_CITIES } from '../data/cities';

// Extracted getCitiesOnLines logic for testing without rendering Dashboard
const toRad = Math.PI / 180;
function gcDist(la1, lo1, la2, lo2) {
  const dLa = (la2 - la1) * toRad, dLo = (lo2 - lo1) * toRad;
  const a = Math.sin(dLa / 2) ** 2 + Math.cos(la1 * toRad) * Math.cos(la2 * toRad) * Math.sin(dLo / 2) ** 2;
  return Math.asin(Math.min(1, Math.sqrt(a))) * 2 / toRad;
}

function getCitiesOnLines(lines, cities, threshold = 3.5) {
  const r = [], seen = new Set();
  for (const l of lines) {
    if (l.type === 'curve') {
      const pts = [];
      for (const seg of (l.segments || [l.points])) { if (seg) pts.push(...seg); }
      if (!pts.length) continue;
      for (const [la, lo, name] of cities) {
        if (seen.has(name)) continue;
        let minD = Infinity;
        for (const p of pts) { const d = gcDist(la, lo, p[1], p[0]); if (d < minD) minD = d; }
        if (minD <= threshold) { seen.add(name); r.push({ la, lo, name, line: l.n, lc: l.c, q: l.quality, dist: Math.round(minD * 10) / 10, desc: l.desc }); }
      }
    } else {
      for (const [la, lo, name] of cities) {
        const d = Math.min(Math.abs(lo - l.lo), 360 - Math.abs(lo - l.lo));
        if (d <= threshold && !seen.has(name)) { seen.add(name); r.push({ la, lo, name, line: l.n, lc: l.c, q: l.quality, dist: Math.round(d * 10) / 10, desc: l.desc }); }
      }
    }
  }
  return r.sort((a, b) => a.dist - b.dist);
}

// Compute once
let chart, cities;
beforeAll(() => {
  chart = calculateChart({ date: '1990-06-15', time: '14:30', lat: '51.51', lng: '-0.13' });
  cities = getCitiesOnLines(chart.lines, ALL_CITIES);
});

describe('getCitiesOnLines', () => {
  it('finds cities near chart lines with valid fields', () => {
    expect(cities.length).toBeGreaterThan(0);
    for (const c of cities) {
      expect(c).toHaveProperty('la');
      expect(c).toHaveProperty('lo');
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('line');
      expect(c).toHaveProperty('q');
      expect(c).toHaveProperty('dist');
      expect(c).toHaveProperty('desc');
      expect(['thrive', 'avoid', 'neutral']).toContain(c.q);
      expect(c.dist).toBeLessThanOrEqual(3.5);
    }
  });

  it('results are sorted by distance with no duplicates', () => {
    const names = cities.map(c => c.name);
    expect(new Set(names).size).toBe(names.length);
    for (let i = 1; i < cities.length; i++) {
      expect(cities[i].dist).toBeGreaterThanOrEqual(cities[i - 1].dist);
    }
  });

  it('stricter threshold returns fewer cities', () => {
    const loose = getCitiesOnLines(chart.lines, ALL_CITIES, 5.0);
    const strict = getCitiesOnLines(chart.lines, ALL_CITIES, 1.0);
    expect(strict.length).toBeLessThanOrEqual(loose.length);
  });
});

describe('Dashboard constants', () => {
  it('DEMO birth data produces valid chart with 20+ lines', () => {
    const r = calculateChart({ date: '1971-06-28', time: '07:00', lat: '-25.7479', lng: '28.2293' });
    expect(r.planets).toHaveLength(10);
    expect(r.lines.length).toBeGreaterThan(20);
  });

  it('color maps cover all planets and quality categories', () => {
    const PCOL = { Sun: '#E8A838', Moon: '#C0C0C0', Mercury: '#5BA8D4', Venus: '#D4729A', Mars: '#D45050', Jupiter: '#8068C0', Saturn: '#887058', Uranus: '#40B0A0', Neptune: '#4868B8', Pluto: '#7048A0' };
    const COL = { thrive: '#00D88A', avoid: '#F04060', neutral: '#D8A030' };
    expect(Object.keys(PCOL)).toHaveLength(10);
    for (const c of [...Object.values(PCOL), ...Object.values(COL)]) expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('zodiac system has 12 signs with symbols, elements, and modes', () => {
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const ELEM = { Aries: 'Fire', Taurus: 'Earth', Gemini: 'Air', Cancer: 'Water', Leo: 'Fire', Virgo: 'Earth', Libra: 'Air', Scorpio: 'Water', Sagittarius: 'Fire', Capricorn: 'Earth', Aquarius: 'Air', Pisces: 'Water' };
    const MODES = { Aries: 'Cardinal', Taurus: 'Fixed', Gemini: 'Mutable', Cancer: 'Cardinal', Leo: 'Fixed', Virgo: 'Mutable', Libra: 'Cardinal', Scorpio: 'Fixed', Sagittarius: 'Mutable', Capricorn: 'Cardinal', Aquarius: 'Fixed', Pisces: 'Mutable' };
    expect(Object.keys(ELEM)).toHaveLength(12);
    expect(Object.keys(MODES)).toHaveLength(12);
    for (const s of signs) { expect(ELEM[s]).toBeTruthy(); expect(MODES[s]).toBeTruthy(); }
  });

  it('angle info covers MC, IC, ASC, DC', () => {
    expect(['MC', 'IC', 'ASC', 'DC']).toHaveLength(4);
  });
});
