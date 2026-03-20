import { describe, it, expect } from 'vitest';
import { calculateChart } from '../lib/calculateChart';

describe('calculateChart', () => {
  const birthData = {
    date: '1990-06-15',
    time: '14:30',
    lat: '51.51',
    lng: '-0.13',
  };

  it('returns planets, lines, natal data, and birth location', () => {
    const result = calculateChart(birthData);
    expect(result).toHaveProperty('planets');
    expect(result).toHaveProperty('lines');
    expect(result).toHaveProperty('natal');
    expect(result).toHaveProperty('planetString');
    expect(result).toHaveProperty('birthLocation');
  });

  it('calculates all 10 planet positions', () => {
    const result = calculateChart(birthData);
    expect(result.planets).toHaveLength(10);
    const planetIds = result.planets.map(p => p.id);
    expect(planetIds).toEqual([
      'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
      'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
    ]);
  });

  it('each planet has required fields', () => {
    const result = calculateChart(birthData);
    for (const planet of result.planets) {
      expect(planet).toHaveProperty('id');
      expect(planet).toHaveProperty('symbol');
      expect(planet).toHaveProperty('sign');
      expect(planet).toHaveProperty('deg');
      expect(planet).toHaveProperty('min');
      expect(planet).toHaveProperty('fullDeg');
      expect(planet).toHaveProperty('retrograde');
      expect(typeof planet.deg).toBe('number');
      expect(planet.deg).toBeGreaterThanOrEqual(0);
      expect(planet.deg).toBeLessThan(30);
      expect(planet.min).toBeGreaterThanOrEqual(0);
      expect(planet.min).toBeLessThan(60);
    }
  });

  it('planet signs are valid zodiac signs', () => {
    const validSigns = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
    ];
    const result = calculateChart(birthData);
    for (const planet of result.planets) {
      expect(validSigns).toContain(planet.sign);
    }
  });

  it('generates MC and IC lines for all 10 planets (meridian type)', () => {
    const result = calculateChart(birthData);
    const mcLines = result.lines.filter(l => l.angle === 'MC' && l.type === 'meridian');
    const icLines = result.lines.filter(l => l.angle === 'IC' && l.type === 'meridian');
    expect(mcLines).toHaveLength(10);
    expect(icLines).toHaveLength(10);
  });

  it('MC and IC lines have valid longitude (-180 to 180)', () => {
    const result = calculateChart(birthData);
    const meridianLines = result.lines.filter(l => l.type === 'meridian');
    for (const line of meridianLines) {
      expect(line.lo).toBeGreaterThanOrEqual(-180);
      expect(line.lo).toBeLessThanOrEqual(180);
    }
  });

  it('generates ASC and DC curve lines with point arrays', () => {
    const result = calculateChart(birthData);
    const ascLines = result.lines.filter(l => l.angle === 'ASC');
    const dcLines = result.lines.filter(l => l.angle === 'DC');
    expect(ascLines.length).toBeGreaterThan(0);
    expect(dcLines.length).toBeGreaterThan(0);
    for (const line of [...ascLines, ...dcLines]) {
      expect(line.type).toBe('curve');
      expect(line.points.length).toBeGreaterThan(2);
      expect(line.segments).toBeDefined();
    }
  });

  it('each line has quality: thrive, avoid, or neutral', () => {
    const result = calculateChart(birthData);
    for (const line of result.lines) {
      expect(['thrive', 'avoid', 'neutral']).toContain(line.quality);
    }
  });

  it('each line has color, description, planet info', () => {
    const result = calculateChart(birthData);
    for (const line of result.lines) {
      expect(line.c).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(line.desc).toBeTruthy();
      expect(line.planet).toBeTruthy();
      expect(line.symbol).toBeTruthy();
      expect(['MC', 'IC', 'ASC', 'DC']).toContain(line.angle);
    }
  });

  it('natal data includes MC, ASC, sun, and moon', () => {
    const result = calculateChart(birthData);
    expect(result.natal.mc).toBeDefined();
    expect(result.natal.asc).toBeDefined();
    expect(result.natal.sun).toBeDefined();
    expect(result.natal.moon).toBeDefined();
    expect(result.natal.sun.id).toBe('Sun');
    expect(result.natal.moon.id).toBe('Moon');
  });

  it('planet string contains all planet symbols', () => {
    const result = calculateChart(birthData);
    const symbols = ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '♅', '♆', '♇'];
    for (const sym of symbols) {
      expect(result.planetString).toContain(sym);
    }
    expect(result.planetString).toContain('ASC');
    expect(result.planetString).toContain('MC');
  });

  it('birth location matches input', () => {
    const result = calculateChart(birthData);
    expect(result.birthLocation.lat).toBeCloseTo(51.51);
    expect(result.birthLocation.lng).toBeCloseTo(-0.13);
  });

  it('handles HH:MM:SS time format', () => {
    const result = calculateChart({ ...birthData, time: '14:30:00' });
    expect(result.planets).toHaveLength(10);
  });

  it('throws on invalid date', () => {
    expect(() => calculateChart({ ...birthData, date: 'invalid' })).toThrow('Invalid date/time');
  });

  it('throws on invalid coordinates', () => {
    expect(() => calculateChart({ ...birthData, lat: 'abc', lng: 'def' })).toThrow('Invalid coordinates');
  });

  it('produces consistent results for same input', () => {
    const r1 = calculateChart(birthData);
    const r2 = calculateChart(birthData);
    expect(r1.planets).toEqual(r2.planets);
    expect(r1.lines.length).toBe(r2.lines.length);
    expect(r1.planetString).toBe(r2.planetString);
  });

  it('different birth dates produce different charts', () => {
    const r1 = calculateChart(birthData);
    const r2 = calculateChart({ ...birthData, date: '2000-01-01' });
    expect(r1.planetString).not.toBe(r2.planetString);
  });

  it('Venus quality is thrive, Saturn quality is avoid', () => {
    const result = calculateChart(birthData);
    const venusLines = result.lines.filter(l => l.planet === 'Venus');
    const saturnLines = result.lines.filter(l => l.planet === 'Saturn');
    for (const l of venusLines) expect(l.quality).toBe('thrive');
    for (const l of saturnLines) expect(l.quality).toBe('avoid');
  });

  it('retrograde is boolean for all planets', () => {
    const result = calculateChart(birthData);
    for (const p of result.planets) {
      expect(typeof p.retrograde).toBe('boolean');
    }
  });

  it('Sun and Moon are never retrograde', () => {
    const result = calculateChart(birthData);
    const sun = result.planets.find(p => p.id === 'Sun');
    const moon = result.planets.find(p => p.id === 'Moon');
    expect(sun.retrograde).toBe(false);
    expect(moon.retrograde).toBe(false);
  });

  it('handles southern hemisphere birth location', () => {
    const result = calculateChart({ date: '1990-01-01', time: '12:00', lat: '-33.87', lng: '151.21' });
    expect(result.planets).toHaveLength(10);
    expect(result.lines.length).toBeGreaterThan(0);
  });

  it('handles midnight birth time', () => {
    const result = calculateChart({ ...birthData, time: '00:00' });
    expect(result.planets).toHaveLength(10);
  });

  it('handles late night birth time', () => {
    const result = calculateChart({ ...birthData, time: '23:59' });
    expect(result.planets).toHaveLength(10);
  });
});
