import posthog from 'posthog-js';
import { hasAnalyticsConsent } from './consent';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

let initialized = false;

// Analytics must not start without explicit opt-in (TDDDG § 25). initPostHog is
// a no-op until consent is granted; every tracking call below additionally
// guards on `initialized`, so nothing is captured before the user agrees.
export function initPostHog() {
  if (initialized || !POSTHOG_KEY) return;
  if (!hasAnalyticsConsent()) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // we handle this manually for SPA
    capture_pageleave: false, // SPA captures pageviews manually; pageleave adds unload-time work
    autocapture: false, // we track events via trackEvent() — autocapture adds a global listener overhead
    disable_session_recording: true,
    disable_surveys: true,
    advanced_disable_decide: true, // skip the /decide POST on init (feature flags not used)
    rageclick: false,
    persistence: 'localStorage',
  });
  initialized = true;
  captureAcquisition();
}

// Capture UTM parameters + referrer as persisted super properties so every
// subsequent event (including the landing → demo → checkout → purchase funnel)
// can be segmented by acquisition source. capture_pageview is off, so PostHog
// does not parse these automatically. persistence:'localStorage' keeps the same
// distinct_id (and these props) when the demo opens in a new same-origin tab.
function captureAcquisition() {
  if (!initialized) return;
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const v = params.get(k);
      if (v) utm[k] = v;
    }
    // Initial-touch attribution (set once, never overwritten).
    posthog.register_once({
      initial_referrer: document.referrer || '$direct',
      initial_landing_path: window.location.pathname,
    });
    // Last-touch UTM (updated whenever the visitor arrives with new params).
    if (Object.keys(utm).length) posthog.register(utm);
  } catch {
    /* analytics optional */
  }
}

export function identifyUser(userId, properties = {}) {
  if (!initialized) return;
  posthog.identify(userId, properties);
}

export function resetUser() {
  if (!initialized) return;
  posthog.reset();
}

export function trackEvent(event, properties = {}) {
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function trackPageView(path) {
  if (!initialized) return;
  posthog.capture('$pageview', { $current_url: window.location.href, path });
}

export { posthog };
