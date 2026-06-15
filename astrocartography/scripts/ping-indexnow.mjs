// Pings IndexNow (Bing, Yandex, Seznam, Naver and partners) so newly added or
// updated pages are picked up quickly. The key file already lives in public/
// (21915b44130d4ed9a4a65a4221aeb56b.txt); IndexNow verifies ownership against
// https://natalnavigator.com/<key>.txt.
//
// Usage:
//   node scripts/ping-indexnow.mjs            # submits every route in the sitemap
//   node scripts/ping-indexnow.mjs /a /b      # submits only the given paths
//
// Run after a deploy that changes content (not part of the build itself, since
// the URLs must already be live when the engines crawl them).

import { PAGES } from './seo/content.mjs';

const HOST = 'natalnavigator.com';
const ORIGIN = `https://${HOST}`;
const KEY = '21915b44130d4ed9a4a65a4221aeb56b';
const KEY_LOCATION = `${ORIGIN}/${KEY}.txt`;

const url = (p) => (p === '/' ? ORIGIN + '/' : ORIGIN + '/' + p.replace(/^\//, ''));

const argPaths = process.argv.slice(2);
const urlList = argPaths.length
  ? argPaths.map(url)
  : [
      url('/'),
      url('astrocartography'),
      url('astrocartography-calculator'),
      url('astrokartographie'),
      ...PAGES.map((p) => url(p.slug)),
    ];

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
