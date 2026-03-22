import { describe, it, expect, beforeAll } from 'vitest';
import { calculateChart } from '../lib/calculateChart';

const birthData = { date: '1990-06-15', time: '14:30', lat: '51.51', lng: '-0.13' };
const VALID_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

// Compute once — calculateChart is pure and deterministic
let result;
beforeAll(() => { result = calculateChart(birthData); });

describe('calculateChart — structure', () => {
  it('returns planets, lines, natal, planetString, birthLocation', () => {
    expect(result).toHaveProperty('planets');
    expect(result).toHaveProperty('lines');
    expect(result).toHaveProperty('natal');
    expect(result).toHaveProperty('planetString');
    expect(result).toHaveProperty('birthLocation');
  });

  it('birth location matches input', () => {
    expect(result.birthLocation.lat).toBeCloseTo(51.51);
    expect(result.birthLocation.lng).toBeCloseTo(-0.13);
  });
});

describe('calculateChart — planets', () => {
  it('calculates all 10 planets with correct IDs', () => {
    expect(result.planets).toHaveLength(10);
    expect(result.planets.map(p => p.id)).toEqual([
      'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
      'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
    ]);
  });

  it('each planet has valid fields, degrees, and zodiac sign', () => {
    for (const p of result.planets) {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('symbol');
      expect(VALID_SIGNS).toContain(p.sign);
      expect(p.deg).toBeGreaterThanOrEqual(0);
      expect(p.deg).toBeLessThan(30);
      expect(p.min).toBeGreaterThanOrEqual(0);
      expect(p.min).toBeLessThan(60);
      expect(typeof p.retrograde).toBe('boolean');
    }
  });

  it('Sun and Moon are never retrograde', () => {
    expect(result.planets.find(p => p.id === 'Sun').retrograde).toBe(false);
    expect(result.planets.find(p => p.id === 'Moon').retrograde).toBe(false);
  });

  it('planet string contains all symbols plus ASC and MC', () => {
    for (const sym of ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '♅', '♆', '♇', 'ASC', 'MC']) {
      expect(result.planetString).toContain(sym);
    }
  });
});

describe('calculateChart — lines', () => {
  it('generates MC and IC meridian lines for all 10 planets', () => {
    expect(result.lines.filter(l => l.angle === 'MC' && l.type === 'meridian')).toHaveLength(10);
    expect(result.lines.filter(l => l.angle === 'IC' && l.type === 'meridian')).toHaveLength(10);
  });

  it('meridian lines have valid longitude (-180 to 180)', () => {
    for (const l of result.lines.filter(l => l.type === 'meridian')) {
      expect(l.lo).toBeGreaterThanOrEqual(-180);
      expect(l.lo).toBeLessThanOrEqual(180);
    }
  });

  it('generates ASC and DC curve lines with points and segments', () => {
    for (const l of result.lines.filter(l => l.angle === 'ASC' || l.angle === 'DC')) {
      expect(l.type).toBe('curve');
      expect(l.points.length).toBeGreaterThan(2);
      expect(l.segments).toBeDefined();
    }
  });

  it('every line has valid quality, color, description, planet, angle', () => {
    for (const l of result.lines) {
      expect(['thrive', 'avoid', 'neutral']).toContain(l.quality);
      expect(l.c).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(l.desc).toBeTruthy();
      expect(l.planet).toBeTruthy();
      expect(l.symbol).toBeTruthy();
      expect(['MC', 'IC', 'ASC', 'DC']).toContain(l.angle);
    }
  });

  it('Venus is always thrive, Saturn varies by angle', () => {
    for (const l of result.lines.filter(l => l.planet === 'Venus')) expect(l.quality).toBe('thrive');
    const saturnLines = result.lines.filter(l => l.planet === 'Saturn');
    for (const l of saturnLines) {
      if (l.angle === 'IC' || l.angle === 'ASC') expect(l.quality).toBe('avoid');
      else expect(l.quality).toBe('neutral');
    }
  });
});

describe('calculateChart — natal', () => {
  it('includes MC, ASC, sun, and moon', () => {
    expect(result.natal.mc).toBeDefined();
    expect(result.natal.asc).toBeDefined();
    expect(result.natal.sun.id).toBe('Sun');
    expect(result.natal.moon.id).toBe('Moon');
  });
});

describe('calculateChart — edge cases', () => {
  it('handles HH:MM:SS time format', () => {
    expect(calculateChart({ ...birthData, time: '14:30:00' }).planets).toHaveLength(10);
  });

  it('throws on invalid date', () => {
    expect(() => calculateChart({ ...birthData, date: 'invalid' })).toThrow('Invalid date/time');
  });

  it('throws on invalid coordinates', () => {
    expect(() => calculateChart({ ...birthData, lat: 'abc', lng: 'def' })).toThrow('Invalid coordinates');
  });

  it('is deterministic', () => {
    const r2 = calculateChart(birthData);
    expect(result.planets).toEqual(r2.planets);
    expect(result.planetString).toBe(r2.planetString);
  });

  it('different dates produce different charts', () => {
    expect(result.planetString).not.toBe(
      calculateChart({ ...birthData, date: '2000-01-01' }).planetString
    );
  });

  it('handles southern hemisphere', () => {
    const r = calculateChart({ date: '1990-01-01', time: '12:00', lat: '-33.87', lng: '151.21' });
    expect(r.planets).toHaveLength(10);
    expect(r.lines.length).toBeGreaterThan(0);
  });

  it('handles midnight and late-night times', () => {
    expect(calculateChart({ ...birthData, time: '00:00' }).planets).toHaveLength(10);
    expect(calculateChart({ ...birthData, time: '23:59' }).planets).toHaveLength(10);
  });
});
