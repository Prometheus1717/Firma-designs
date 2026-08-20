import { describe, expect, it } from 'vitest';
import { calculateChart } from '../lib/calculateChart';
import { DEFAULT_DEMO_KEY, DEMO_CHARTS, getDemoChart } from '../data/demoCharts';

describe('celebrity demo charts', () => {
  it('uses Michael Jackson as the first and default landing-page chart', () => {
    expect(DEFAULT_DEMO_KEY).toBe('jackson');
    expect(DEMO_CHARTS[0]).toMatchObject({
      key: 'jackson',
      name: 'Michael Jackson',
      date: '1958-08-29',
      time: '19:33',
      city: "St. Mary's Mercy Hospital, Gary, Indiana",
    });
    expect(getDemoChart('missing-profile')).toEqual(getDemoChart('jackson'));
  });

  it('calculates Michael Jackson consistently for the map and Personality chart', () => {
    const michael = getDemoChart('jackson');
    const chart = calculateChart(michael);

    expect(chart.lines).toHaveLength(40);
    expect(chart.natal.sun).toMatchObject({ sign: 'Virgo', deg: 6, min: 8, house: 6 });
    expect(chart.natal.moon).toMatchObject({ sign: 'Pisces', deg: 14, min: 54, house: 1 });
    expect(chart.natal.asc).toMatchObject({ sign: 'Pisces', deg: 10, min: 6 });
    expect(chart.natal.mc).toMatchObject({ sign: 'Sagittarius', deg: 19, min: 31 });
    expect(chart.planets.find((planet) => planet.id === 'Mercury')).toMatchObject({
      sign: 'Leo',
      deg: 25,
      min: 24,
      retrograde: true,
    });
    expect(chart.lines.find((line) => line.n === 'Sun MC')?.lo).toBeCloseTo(171.9637, 3);
  });

  it('places Princess Diana between Elon Musk and Albert Einstein without changing the default', () => {
    expect(DEMO_CHARTS.map(({ key }) => key).slice(0, 4)).toEqual([
      'jackson',
      'musk',
      'diana',
      'einstein',
    ]);
    expect(DEFAULT_DEMO_KEY).toBe('jackson');
    expect(getDemoChart('diana')).toMatchObject({
      name: 'Princess Diana',
      date: '1961-07-01',
      time: '19:45',
      lat: 52.833333,
      lng: 0.5,
      city: 'Park House, Sandringham Estate, Norfolk, England',
    });

    const chart = calculateChart(getDemoChart('diana'));
    expect(chart.lines).toHaveLength(40);
    expect(chart.natal.sun).toMatchObject({ sign: 'Cancer', deg: 9, min: 39, house: 7 });
    expect(chart.natal.moon).toMatchObject({ sign: 'Aquarius', deg: 25, min: 2, house: 2 });
    expect(chart.natal.asc).toMatchObject({ sign: 'Sagittarius', deg: 18, min: 24 });
    expect(chart.natal.mc).toMatchObject({ sign: 'Libra', deg: 23, min: 3 });
    expect(chart.planets.find((planet) => planet.id === 'Mercury')).toMatchObject({
      sign: 'Cancer',
      deg: 3,
      min: 12,
      retrograde: true,
    });
    expect(chart.lines.find((line) => line.n === 'Sun MC')?.lo).toBeCloseTo(-100.3129, 3);
  });
});
