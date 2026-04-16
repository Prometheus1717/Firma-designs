// Service Worker — cache static assets so 100k users don't all re-download
// Strategy: Cache-first for assets (immutable hashes), Network-first for HTML

const CACHE_NAME = 'nn-v20';
const ASSET_CACHE = 'nn-assets-v20';

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== ASSET_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for hashed assets, network-first for HTML/API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Cache world-atlas JSON from CDN — used for globe country borders, ~30KB
  if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('world-atlas')) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Skip other cross-origin requests (Supabase, Nominatim, Google Fonts)
  if (url.hostname !== self.location.hostname) return;

  // Hashed assets (JS/CSS chunks) — cache-first, immutable
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Static files (favicon, icons) — cache with network fallback
  if (url.pathname.match(/\.(svg|png|ico|woff2?)$/)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          const fetchPromise = fetch(event.request).then(response => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // HTML — network-first (always get latest deploy)
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }
});
