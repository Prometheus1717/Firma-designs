// Pings IndexNow (Bing, Yandex, Seznam, Naver and partners) so new or updated
// hermeswriting.de pages get picked up quickly. The key file lives at the site
// root (bcc8aba50393d2a713cec46117ee872a.txt); IndexNow verifies ownership
// against https://hermeswriting.de/<key>.txt.
//
// Usage:
//   node scripts/ping-indexnow.mjs            # submits the default URL list below
//   node scripts/ping-indexnow.mjs / /impressum  # submits only the given paths
//
// Run AFTER a deploy that changes content — the URLs must already be live when
// the engines crawl them.

const HOST = 'hermeswriting.de';
const ORIGIN = `https://${HOST}`;
const KEY = 'bcc8aba50393d2a713cec46117ee872a';
const KEY_LOCATION = `${ORIGIN}/${KEY}.txt`;

const url = (p) => (p === '/' ? ORIGIN + '/' : ORIGIN + '/' + p.replace(/^\//, ''));

// hermeswriting.de is a single-page site; extend this list when pages are added.
const DEFAULT_PATHS = ['/'];

const argPaths = process.argv.slice(2);
const urlList = (argPaths.length ? argPaths : DEFAULT_PATHS).map(url);

const body = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList };

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});

console.log(`ping-indexnow: submitted ${urlList.length} URL(s) → HTTP ${res.status} ${res.statusText}`);
if (!res.ok) {
  console.log(await res.text());
  process.exitCode = 1;
}
