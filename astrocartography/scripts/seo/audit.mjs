// audit.mjs — link graph + on-page SEO/GEO/conversion audit over the generated
// static pages in public/. Run after build-pages: node scripts/seo/audit.mjs
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const pub = join(root, 'public');
const ORIGIN = 'https://natalnavigator.com';

const pages = new Map();
(function walk(dir, url) {
  for (const e of readdirSync(dir)) {
    if (['fonts', 'landing', 'img'].includes(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, url + '/' + e);
    else if (e === 'index.html') pages.set(url || '/', p);
  }
})(pub, '');

// SPA routes that exist but aren't static files
const APP_ROUTES = new Set(['/', '/create', '/demo', '/dashboard', '/birth-data', '/sign-in', '/impressum', '/datenschutz', '/agb', '/pricing', '/refund-policy', '/privacy', '/terms', '/imprint']);

const inbound = new Map([...pages.keys()].map((k) => [k, 0]));
const broken = [], issues = [], titles = new Map(), words = [];

for (const [url, file] of pages) {
  const html = readFileSync(file, 'utf8');
  // links
  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    let h = m[1];
    if (h.match(/\.(xml|txt|pdf|svg|png|jpg|webp|css|js|ico|webmanifest|json)$/)) {
      if (!existsSync(join(pub, h.slice(1)))) broken.push(`${url} → ${h} (asset)`);
      continue;
    }
    const norm = h.endsWith('/') && h !== '/' ? h.slice(0, -1) : h;
    if (pages.has(norm)) { if (norm !== url) inbound.set(norm, inbound.get(norm) + 1); }
    else if (!APP_ROUTES.has(norm)) broken.push(`${url} → ${h}`);
  }
  // canonical: no trailing slash
  const canonical = (html.match(/rel="canonical" href="([^"]+)"/) || [])[1] || '';
  const expected = ORIGIN + (url === '/' ? '/' : url);
  if (canonical !== expected) issues.push(`${url}: canonical ${canonical || 'MISSING'} ≠ ${expected}`);
  // h1
  const h1s = (html.match(/<h1[ >]/g) || []).length;
  if (h1s !== 1) issues.push(`${url}: ${h1s} H1`);
  // meta lengths
  const decode=(x)=>x.replace(/&amp;/g,'&').replace(/&mdash;/g,'—').replace(/&ndash;/g,'–').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&rsaquo;/g,'›');
  const title = decode((html.match(/<title>([^<]*)<\/title>/) || [, ''])[1]);
  const desc = decode((html.match(/name="description" content="([^"]*)"/) || [, ''])[1]);
  if (title.length > 65) issues.push(`${url}: title ${title.length} chars`);
  if (desc.length > 170 || desc.length < 60) issues.push(`${url}: desc ${desc.length} chars`);
  titles.set(url, title);
  // JSON-LD valid + FAQ
  let hasFaq = false;
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { const j = JSON.parse(m[1]); const s = JSON.stringify(j); if (s.includes('FAQPage')) hasFaq = true; }
    catch { issues.push(`${url}: invalid JSON-LD`); }
  }
  if (!hasFaq && url !== '/blog' && !url.startsWith('/blog/') === false) {}
  const FAQ_EXEMPT = new Set(['/blog', '/blog/astrocartography-myths-debunked', '/blog/astrocartography-vs-relocation-astrology', '/blog/how-to-read-astrocartography-map']); // Index + prebuilt ohne sichtbares Q&A — kein Schema ohne Content
  if (!hasFaq && !FAQ_EXEMPT.has(url)) issues.push(`${url}: no FAQPage schema`);
  // conversion CTA
  if (!html.includes('href="/create"')) issues.push(`${url}: no /create CTA`);
  if (!html.includes('href="/demo"') && url !== '/blog') issues.push(`${url}: no /demo CTA`);
  // word count (article-ish body: strip scripts/styles/tags)
  const body = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
  const wc = body.split(/\s+/).filter(Boolean).length;
  words.push([url, wc]);
}

// title near-duplicates (same after removing planet/sign word)
const norm = (t) => t.toLowerCase().replace(/\b(sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|asc(endant)?|desc(endant)?|mc|ic|midheaven|sonnen|mond|venus|jupiter|saturn|aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)\b/g, 'X');
const groups = {};
for (const [u, t] of titles) (groups[norm(t)] ||= []).push(u);
const dupes = Object.values(groups).filter((g) => g.length > 2);

console.log('=== BROKEN LINKS ==='); console.log(broken.length ? broken.join('\n') : 'none ✓');
console.log('\n=== ISSUES ==='); console.log(issues.length ? issues.join('\n') : 'none ✓');
console.log('\n=== TEMPLATE-TITLE GROUPS (>2 near-identical) ===');
dupes.forEach((g) => console.log(`  ${g.length}× template: ${g.slice(0, 4).join(', ')}${g.length > 4 ? ' …' : ''}`));
console.log('\n=== THINNEST PAGES (words, asc) ===');
words.sort((a, b) => a[1] - b[1]).slice(0, 12).forEach(([u, w]) => console.log(`  ${String(w).padStart(5)}  ${u}`));
console.log('\n=== FEWEST INBOUND (asc) ===');
[...inbound.entries()].sort((a, b) => a[1] - b[1]).slice(0, 18).forEach(([u, n]) => console.log(`  ${String(n).padStart(3)}  ${u}`));
console.log(`\npages: ${pages.size}`);
