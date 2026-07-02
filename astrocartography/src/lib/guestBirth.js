// Anonymous (pre-account) birth data for the data-first funnel.
//
// The funnel lets a visitor enter their birth details and see a personalised
// teaser BEFORE creating an account or paying. We hold that input client-side
// until it is either (a) attached to a guest checkout and provisioned onto a
// real profile by the Stripe webhook, or (b) saved to a profile after a normal
// sign-up. localStorage (not sessionStorage) so it survives the Stripe redirect
// round-trip and a returning visit on the same device.

const GUEST_KEY = 'nn_guest_birth';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// data shape: { name?, date: 'YYYY-MM-DD', time: 'HH:MM', city: string, lat, lng }
export function saveGuestBirth(data) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // storage full/disabled — the funnel still works within this page load via
    // the in-memory chart cache; only cross-navigation persistence is lost.
  }
}

export function readGuestBirth() {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || Date.now() - parsed.ts > MAX_AGE_MS) return null;
    const d = parsed.data;
    // Only return a fully-usable record — a partial one can't compute a chart.
    if (!d || !d.date || !d.time || d.lat == null || d.lng == null) return null;
    return d;
  } catch {
    return null;
  }
}

export function clearGuestBirth() {
  try { localStorage.removeItem(GUEST_KEY); } catch { /* no-op */ }
}
