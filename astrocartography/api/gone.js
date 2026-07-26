import { applySecurityHeaders } from './_security.js';

// French routes were intentionally retired. A 410 tells crawlers to remove
// legacy /fr URLs instead of treating them as temporary missing pages.
export default function handler(req, res) {
  applySecurityHeaders(res);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  return res.status(410).send('Gone');
}
