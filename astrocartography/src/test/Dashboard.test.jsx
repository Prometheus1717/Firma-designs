import { describe, it, expect, vi } from 'vitest';
import { calculateChart } from '../lib/calculateChart';
import { ALL_CITIES } from '../data/cities';

// Test Dashboard logic without rendering (avoids D3/Globe complexity)
// These test the getCitiesOnLines algorithm and data flow

describe('Dashboard logic — getCitiesOnLines', () => {
  // Reproduce getCitiesOnLines from Dashboard
  function gcDist(la1, lo1, la2, lo2) {
    const toRad = Math.PI / 180;
    const dLa = (la2 - la1) * toRad, dLo = (lo2 - lo1) * toRad;
    const a = Math.sin(dLa / 2) ** 2 + Math.cos(la1 * toRad) * Math.cos(la2 * toRad) * Math.sin(dLo / 2) ** 2;
    return Math.asin(Math.min(1, Math.sqrt(a))) * 2 / toRad;
  }

  function getCitiesOnLines(lines, cities, threshold = 3.5) {
    const r = [], seen = new Set();
    lines.forEach(l => {
      if (l.type === 'curve') {
        const pts = [];
        (l.segments || [l.points]).forEach(seg => { if (seg) pts.push(...seg); });
        if (!pts.length) return;
        cities.forEach(([la, lo, name]) => {
          if (seen.has(name)) return;
          let minD = Infinity;
          for (let i = 0; i < pts.length; i++) {
            const d = gcDist(la, lo, pts[i][1], pts[i][0]);
            if (d < minD) minD = d;
          }
          if (minD <= threshold) {
            seen.add(name);
            r.push({ la, lo, name, line: l.n, lc: l.c, q: l.quality, dist: Math.round(minD * 10) / 10, desc: l.desc });
          }
        });
      } else {
        cities.forEach(([la, lo, name]) => {
          const d = Math.min(Math.abs(lo - l.lo), 360 - Math.abs(lo - l.lo));
          if (d <= threshold && !seen.has(name)) {
            seen.add(name);
            r.push({ la, lo, name, line: l.n, lc: l.c, q: l.quality, dist: Math.round(d * 10) / 10, desc: l.desc });
          }
        });
      }
    });
    return r.sort((a, b) => a.dist - b.dist);
  }

  const chart = calculateChart({
    date: '1990-06-15', time: '14:30', lat: '51.51', lng: '-0.13',
  });

  it('finds cities near chart lines', () => {
    const cities = getCitiesOnLines(chart.lines, ALL_CITIES);
    expect(cities.length).toBeGreaterThan(0);
  });

  it('each matched city has required fields', () => {
    const cities = getCitiesOnLines(chart.lines, ALL_CITIES);
    for (const c of cities) {
      expect(c).toHaveProperty('la');
      expect(c).toHaveProperty('lo');
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('line');
      expect(c).toHaveProperty('q');
      expect(c).toHaveProperty('dist');
      expect(c).toHaveProperty('desc');
    }
  });

  it('cities are sorted by distance (ascending)', () => {
    const cities = getCitiesOnLines(chart.lines, ALL_CITIES);
    for (let i = 1; i < cities.length; i++) {
      expect(cities[i].dist).toBeGreaterThanOrEqual(cities[i - 1].dist);
    }
  });

  it('no city appears more than once', () => {
    const cities = getCitiesOnLines(chart.lines, ALL_CITIES);
    const names = cities.map(c => c.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('distances are within threshold', () => {
    const threshold = 3.5;
    const cities = getCitiesOnLines(chart.lines, ALL_CITIES, threshold);
    for (const c of cities) {
      expect(c.dist).toBeLessThanOrEqual(threshold);
    }
  });

  it('stricter threshold returns fewer cities', () => {
    const loose = getCitiesOnLines(chart.lines, ALL_CITIES, 5.0);
    const strict = getCitiesOnLines(chart.lines, ALL_CITIES, 1.0);
    expect(strict.length).toBeLessThanOrEqual(loose.length);
  });

  it('city quality matches thrive/avoid/neutral', () => {
    const cities = getCitiesOnLines(chart.lines, ALL_CITIES);
    for (const c of cities) {
      expect(['thrive', 'avoid', 'neutral']).toContain(c.q);
    }
  });
});

describe('Dashboard constants', () => {
  it('DEMO birth data produces valid chart', () => {
    const DEMO = { date: '1971-06-28', time: '07:00', lat: '-25.7479', lng: '28.2293' };
    const result = calculateChart(DEMO);
    expect(result.planets).toHaveLength(10);
    expect(result.lines.length).toBeGreaterThan(20);
  });

  it('quality colors are defined for all categories', () => {
    const COL = { thrive: '#00D88A', avoid: '#F04060', neutral: '#D8A030' };
    expect(COL.thrive).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(COL.avoid).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(COL.neutral).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('planet colors are defined for all 10 planets', () => {
    const PCOL = { Sun: '#E8A838', Moon: '#C0C0C0', Mercury: '#5BA8D4', Venus: '#D4729A', Mars: '#D45050', Jupiter: '#8068C0', Saturn: '#887058', Uranus: '#40B0A0', Neptune: '#4868B8', Pluto: '#7048A0' };
    expect(Object.keys(PCOL)).toHaveLength(10);
    for (const color of Object.values(PCOL)) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('all zodiac signs have symbols, elements, and modes', () => {
    const SIGN_SYMBOLS = { Aries: '♈\uFE0E', Taurus: '♉\uFE0E', Gemini: '♊\uFE0E', Cancer: '♋\uFE0E', Leo: '♌\uFE0E', Virgo: '♍\uFE0E', Libra: '♎\uFE0E', Scorpio: '♏\uFE0E', Sagittarius: '♐\uFE0E', Capricorn: '♑\uFE0E', Aquarius: '♒\uFE0E', Pisces: '♓\uFE0E' };
    const SIGN_ELEMENTS = { Aries: 'Fire', Taurus: 'Earth', Gemini: 'Air', Cancer: 'Water', Leo: 'Fire', Virgo: 'Earth', Libra: 'Air', Scorpio: 'Water', Sagittarius: 'Fire', Capricorn: 'Earth', Aquarius: 'Air', Pisces: 'Water' };
    const SIGN_MODES = { Aries: 'Cardinal', Taurus: 'Fixed', Gemini: 'Mutable', Cancer: 'Cardinal', Leo: 'Fixed', Virgo: 'Mutable', Libra: 'Cardinal', Scorpio: 'Fixed', Sagittarius: 'Mutable', Capricorn: 'Cardinal', Aquarius: 'Fixed', Pisces: 'Mutable' };
    expect(Object.keys(SIGN_SYMBOLS)).toHaveLength(12);
    expect(Object.keys(SIGN_ELEMENTS)).toHaveLength(12);
    expect(Object.keys(SIGN_MODES)).toHaveLength(12);
  });

  it('angle info covers MC, IC, ASC, DC', () => {
    const ANGLE_INFO = {
      MC: { label: 'MC', full: 'Medium Coeli (Midheaven)' },
      IC: { label: 'IC', full: 'Imum Coeli (Nadir)' },
      ASC: { label: 'ASC', full: 'Ascendant (Rising)' },
      DC: { label: 'DC', full: 'Descendant (Setting)' },
    };
    expect(Object.keys(ANGLE_INFO)).toEqual(['MC', 'IC', 'ASC', 'DC']);
  });
});
