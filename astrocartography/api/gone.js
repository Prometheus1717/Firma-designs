import { applySecurityHeaders } from './_security.js';

// Retired language prefixes (fr since 2026-08-21; ar, it, ja, ko, nl, pl, ru,
// tr, zh since 2026-09-07). A 410 tells crawlers to drop these URLs instead of
// treating them as temporarily missing pages.
export default function handler(req, res) {
  applySecurityHeaders(res);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  return res.status(410).send('Gone');
}
