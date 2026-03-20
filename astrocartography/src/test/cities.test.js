import { describe, it, expect, beforeAll } from 'vitest';
import CITIES, { ALL_CITIES, CITIES_T1, CITIES_T2, CITIES_T3 } from '../data/cities';

const names = CITIES.map(c => c[2]);

describe('Cities database', () => {
  it('has 300+ cities with valid [lat, lng, name, tier] format', () => {
    expect(CITIES.length).toBeGreaterThan(300);
    for (const city of CITIES) {
      expect(city).toHaveLength(4);
      expect(typeof city[0]).toBe('number');
      expect(typeof city[1]).toBe('number');
      expect(typeof city[2]).toBe('string');
      expect([1, 2, 3]).toContain(city[3]);
    }
  });

  it('all coordinates are in valid ranges', () => {
    for (const [lat, lng, name] of CITIES) {
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
      expect(lng).toBeGreaterThanOrEqual(-180);
      expect(lng).toBeLessThanOrEqual(180);
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it('tiered exports have correct sizes', () => {
    expect(ALL_CITIES.length).toBe(CITIES.length);
    expect(ALL_CITIES[0]).toHaveLength(3); // no tier
    const t1 = CITIES.filter(c => c[3] === 1).length;
    const t12 = CITIES.filter(c => c[3] <= 2).length;
    expect(CITIES_T1).toHaveLength(t1);
    expect(CITIES_T1.length).toBeGreaterThan(50);
    expect(CITIES_T2).toHaveLength(t12);
    expect(CITIES_T2.length).toBeGreaterThan(CITIES_T1.length);
    expect(CITIES_T3).toHaveLength(CITIES.length);
  });

  it('includes major tier-1 cities across all continents', () => {
    const tier1 = CITIES.filter(c => c[3] === 1).map(c => c[2]);
    for (const city of ['London', 'New York', 'Tokyo', 'Paris', 'Berlin', 'Sydney', 'Cairo', 'São Paulo', 'Mumbai', 'Beijing', 'Lagos']) {
      expect(tier1).toContain(city);
    }
  });
});
