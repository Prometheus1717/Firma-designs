// Vercel Edge Middleware — soft EN→DE language hint for the static SEO pages
// (SEO-GEO-STRATEGY.md P1-5).
//
// Design constraints (deliberately conservative — see strategy §9.8 guardrail):
//  - Runs ONLY on the handful of English guide pages that have a German twin
//    (see `config.matcher` + MAP). It never touches '/', '/demo', '/auth',
//    '/dashboard', the API, assets, or any noindexed route.
//  - Bots (Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot, …) are exempt
//    and always get the URL they requested — so hreflang/indexing of both
//    language versions is never affected (Google must crawl EN from the US).
//  - Only redirects on EXTERNAL arrivals (search/direct). Internal clicks
//    (same-origin referrer) are never redirected, so following an English link
//    never bounces you to German.
//  - One-time: sets a year-long cookie on the redirect, and honours `?nolang`,
//    so a manual choice is respected from then on.
//  - It is a soft 302, not a permanent redirect, and sets Vary/no-store so the
//    decision is never cached for other visitors.

export const config = {
  matcher: [
    '/astrocartography',
    '/astrocartography/venus-line',
    '/astrocartography/sun-line',
    '/astrocartography/moon-line',
    '/astrocartography/jupiter-line',
    '/astrocartography/saturn-line',
    '/where-should-i-live-astrology',
  ],
};

// English path → German equivalent.
const MAP = {
  '/astrocartography': '/astrokartographie',
  '/astrocartography/venus-line': '/astrokartographie/venuslinie',
  '/astrocartography/sun-line': '/astrokartographie/sonnenlinie',
  '/astrocartography/moon-line': '/astrokartographie/mondlinie',
  '/astrocartography/jupiter-line': '/astrokartographie/jupiterlinie',
  '/astrocartography/saturn-line': '/astrokartographie/saturnlinie',
  '/where-should-i-live-astrology': '/astrokartographie/wo-soll-ich-leben-astrologie',
};

const BOT = /bot|crawl|spider|slurp|mediapartners|gptbot|claudebot|claude-web|anthropic|perplexitybot|bingbot|googlebot|google-extended|duckduck|baiduspider|yandex|applebot|facebookexternalhit|embedly|quora|slackbot|twitterbot|whatsapp|telegram|discordbot|linkedinbot|petalbot|amazonbot|ccbot|bytespider/i;

export default function middleware(request) {
  const url = new URL(request.url);
  const target = MAP[url.pathname];
  if (!target) return; // not a mapped page → continue normally

  // Manual override / one-time guard.
  const cookie = request.headers.get('cookie') || '';
  if (url.searchParams.has('nolang') || /\bnn_lr=1\b/.test(cookie)) return;

  // Bots always get the requested URL (keeps EN/DE both indexable).
  const ua = request.headers.get('user-agent') || '';
  if (BOT.test(ua)) return;

  // Never redirect on internal navigation — only on external/direct arrivals.
  const referer = request.headers.get('referer') || '';
  if (referer && referer.startsWith(url.origin)) return;

  // Only redirect visitors whose browser prefers German.
  const al = request.headers.get('accept-language') || '';
  const first = (al.split(',')[0] || '').trim().toLowerCase();
  if (!/^de\b/.test(first)) return;

  const dest = new URL(target, url.origin);
  dest.search = url.search;
  return new Response(null, {
    status: 302,
    headers: {
      Location: dest.toString(),
      'Set-Cookie': 'nn_lr=1; Path=/; Max-Age=31536000; SameSite=Lax',
      Vary: 'Accept-Language',
      'Cache-Control': 'no-store',
    },
  });
}
