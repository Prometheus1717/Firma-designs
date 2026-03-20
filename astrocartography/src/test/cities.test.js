import { describe, it, expect } from 'vitest';
import CITIES, { ALL_CITIES, CITIES_T1, CITIES_T2, CITIES_T3 } from '../data/cities';

describe('Cities database', () => {
  it('has a substantial number of cities', () => {
    expect(CITIES.length).toBeGreaterThan(300);
  });

  it('each city has [lat, lng, name, tier] format', () => {
    for (const city of CITIES) {
      expect(city).toHaveLength(4);
      expect(typeof city[0]).toBe('number'); // lat
      expect(typeof city[1]).toBe('number'); // lng
      expect(typeof city[2]).toBe('string'); // name
      expect([1, 2, 3]).toContain(city[3]); // tier
    }
  });

  it('latitudes are in valid range (-90 to 90)', () => {
    for (const city of CITIES) {
      expect(city[0]).toBeGreaterThanOrEqual(-90);
      expect(city[0]).toBeLessThanOrEqual(90);
    }
  });

  it('longitudes are in valid range (-180 to 180)', () => {
    for (const city of CITIES) {
      expect(city[1]).toBeGreaterThanOrEqual(-180);
      expect(city[1]).toBeLessThanOrEqual(180);
    }
  });

  it('city names are non-empty strings', () => {
    for (const city of CITIES) {
      expect(city[2].length).toBeGreaterThan(0);
    }
  });

  it('ALL_CITIES exports [lat, lng, name] without tier', () => {
    expect(ALL_CITIES.length).toBe(CITIES.length);
    for (const city of ALL_CITIES) {
      expect(city).toHaveLength(3);
    }
  });

  it('CITIES_T1 contains only tier 1 cities', () => {
    const tier1Count = CITIES.filter(c => c[3] === 1).length;
    expect(CITIES_T1).toHaveLength(tier1Count);
    expect(CITIES_T1.length).toBeGreaterThan(50);
  });

  it('CITIES_T2 contains tier 1 and 2 cities', () => {
    const tier12Count = CITIES.filter(c => c[3] <= 2).length;
    expect(CITIES_T2).toHaveLength(tier12Count);
    expect(CITIES_T2.length).toBeGreaterThan(CITIES_T1.length);
  });

  it('CITIES_T3 contains all cities', () => {
    expect(CITIES_T3).toHaveLength(CITIES.length);
  });

  it('includes major world cities', () => {
    const names = CITIES.map(c => c[2]);
    const majorCities = ['London', 'New York', 'Tokyo', 'Sydney', 'Cairo', 'São Paulo', 'Mumbai', 'Beijing'];
    for (const city of majorCities) {
      expect(names).toContain(city);
    }
  });

  it('major cities are tier 1', () => {
    const tier1Names = CITIES.filter(c => c[3] === 1).map(c => c[2]);
    const expectedTier1 = ['London', 'New York', 'Tokyo', 'Paris', 'Berlin'];
    for (const city of expectedTier1) {
      expect(tier1Names).toContain(city);
    }
  });

  it('covers all continents', () => {
    // Check representative cities from each continent
    const names = CITIES.map(c => c[2]);
    expect(names).toContain('London');       // Europe
    expect(names).toContain('New York');     // North America
    expect(names).toContain('São Paulo');    // South America
    expect(names).toContain('Lagos');        // Africa
    expect(names).toContain('Tokyo');        // Asia
    expect(names).toContain('Sydney');       // Oceania
  });
});
