// ── Analytics consent (TDDDG § 25 / DSGVO Art. 6(1)(a)) ──
// PostHog analytics must not run until the visitor actively opts in. Consent
// state is stored locally; withdrawal is as easy as granting (resetConsent +
// the banner reappears). Strictly necessary storage (auth, language, theme)
// does not depend on this.
const KEY = 'nn_consent';

export function getConsent() {
  try { return localStorage.getItem(KEY); } catch { return null; } // 'granted' | 'denied' | null
}

export function hasAnalyticsConsent() {
  return getConsent() === 'granted';
}

export function setConsent(granted) {
  try { localStorage.setItem(KEY, granted ? 'granted' : 'denied'); } catch { /* storage unavailable */ }
}

export function resetConsent() {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}
