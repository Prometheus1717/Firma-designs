// Chart result cache — avoids recalculating for the same birth data
// Uses sessionStorage so returning users skip the expensive astronomy-engine computation entirely

const CACHE_KEY = 'nn_chart_cache';
const CACHE_VERSION = 5; // v5: fixed ASC formula (was returning DSC) + obliquity calculation

function cacheId({ date, time, lat, lng }) {
  return `${date}|${time}|${parseFloat(lat).toFixed(4)}|${parseFloat(lng).toFixed(4)}`;
}

export function getCachedChart(birthData) {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    if (cache.v !== CACHE_VERSION) return null;
    if (cache.id !== cacheId(birthData)) return null;
    return cache.data;
  } catch {
    return null;
  }
}

export function setCachedChart(birthData, chartData) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      v: CACHE_VERSION,
      id: cacheId(birthData),
      data: chartData,
      ts: Date.now(),
    }));
  } catch {
    // sessionStorage full or disabled — no-op
  }
}
