// Publicly documented demo birth data. Keep the landing-page selector and the
// embedded Dashboard on this single source so the map and Personality chart
// can never resolve to different people.
export const DEFAULT_DEMO_KEY = 'jackson';

export const DEMO_CHARTS = [
  {
    key: 'jackson',
    date: '1958-08-29',
    time: '19:33',
    // St. Mary's Mercy Hospital, 540 Tyler Street, Gary, Indiana. The chart
    // intentionally uses the hospital rather than the family home at
    // 2300 Jackson Street. tz-lookup resolves this to America/Chicago; at the
    // birth moment CDT was UTC-05:00 (1958-08-30 00:33 UTC).
    lat: 41.600908,
    lng: -87.348552,
    city: "St. Mary's Mercy Hospital, Gary, Indiana",
    home: 'Gary',
    name: 'Michael Jackson',
  },
  { key: 'musk', date: '1971-06-28', time: '07:00', lat: -25.7479, lng: 28.2293, city: 'Pretoria, South Africa', home: 'Pretoria', name: 'Elon Musk' },
  {
    key: 'diana',
    date: '1961-07-01',
    time: '19:45',
    // Park House on the Sandringham Estate, Norfolk. The supplied
    // coordinates are 52°50′ N, 0°30′ E. tz-lookup resolves them to
    // Europe/London; British Summer Time was UTC+01:00 at the birth moment
    // (1961-07-01 18:45 UTC).
    lat: 52.833333,
    lng: 0.5,
    city: 'Park House, Sandringham Estate, Norfolk, England',
    home: 'Sandringham',
    name: 'Princess Diana',
  },
  { key: 'einstein', date: '1879-03-14', time: '11:30', lat: 48.3984, lng: 9.9916, city: 'Ulm, Germany', home: 'Ulm', name: 'Albert Einstein' },
  { key: 'monroe', date: '1926-06-01', time: '09:30', lat: 34.0522, lng: -118.2437, city: 'Los Angeles, USA', home: 'Los Angeles', name: 'Marilyn Monroe' },
  { key: 'jobs', date: '1955-02-24', time: '19:15', lat: 37.7749, lng: -122.4194, city: 'San Francisco, USA', home: 'San Francisco', name: 'Steve Jobs' },
  { key: 'kahlo', date: '1907-07-06', time: '08:30', lat: 19.3434, lng: -99.1626, city: 'Coyoacán, Mexico City', home: 'Coyoacán', name: 'Frida Kahlo' },
];

export const DEMO_CHARTS_BY_KEY = Object.fromEntries(
  DEMO_CHARTS.map(({ key, ...chart }) => [key, chart])
);

export function getDemoChart(key) {
  return DEMO_CHARTS_BY_KEY[key] || DEMO_CHARTS_BY_KEY[DEFAULT_DEMO_KEY];
}
