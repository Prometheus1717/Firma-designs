import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

let initialized = false;

export function initPostHog() {
  if (initialized || !POSTHOG_KEY) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // we handle this manually for SPA
    capture_pageleave: true,
    autocapture: true,
    persistence: 'localStorage+cookie',
  });
  initialized = true;
}

export function identifyUser(userId, properties = {}) {
  if (!POSTHOG_KEY) return;
  posthog.identify(userId, properties);
}

export function resetUser() {
  if (!POSTHOG_KEY) return;
  posthog.reset();
}

export function trackEvent(event, properties = {}) {
  if (!POSTHOG_KEY) return;
  posthog.capture(event, properties);
}

export function trackPageView(path) {
  if (!POSTHOG_KEY) return;
  posthog.capture('$pageview', { $current_url: window.location.href, path });
}

export { posthog };
