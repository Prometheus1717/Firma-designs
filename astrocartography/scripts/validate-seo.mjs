// Build-time gate for the SEO contract that spans three artefacts which can
// silently drift apart: the page HTML (generated for content.mjs pages, hand
// maintained for the pillars and the older blog posts), public/sitemap.xml,
// and the internal links between them.
//
// scripts/seo/audit.mjs reports on content quality and is meant to be read by
// a human. This is the opposite: a small set of checks that either pass or
// fail the build, so a broken canonical or a link to a page that no longer
// exists cannot reach production unnoticed.
//
// Deliberately parser-free, like the generators it guards, so it runs on a
// bare node with no install step.
//
// Run by `npm run prebuild`; `npm run test:seo` regenerates and checks in one go.

import { access, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from './seo/content.mjs';
import { allRoutes } from './seo/static-routes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const ORIGIN = 'https://natalnavigator.com';

// Meta descriptions were normalised to <=170 characters in the July audit; the
// lower bound catches a stub that was never written rather than enforcing a
// style. Titles are checked against the same audit's <=65.
const DESC_MIN = 50;
const DESC_MAX = 170;
const TITLE_MAX = 65;

const failures = [];
const fail = (path, message) => failures.push(`${path}: ${message}`);

// ── The published route list, straight from the sitemap's own source ────────
const routes = allRoutes(PAGES);
const isHtmlRoute = (r) => !/\.[a-z0-9]+$/i.test(r.loc);
const toPath = (loc) => (loc === '/' ? '/' : `/${loc.replace(/^\//, '')}`);

const htmlRoutes = routes.filter(isHtmlRoute);
const expectedPaths = new Set(routes.map((r) => toPath(r.loc)));

// Routes that exist in the SPA but are intentionally not indexable. They are
// legitimate internal link targets even though they never appear in the
// sitemap; all of them carry X-Robots-Tag: noindex in vercel.json.
const appPaths = new Set([
  '/demo', '/auth', '/create', '/result', '/landing', '/dashboard', '/birth-data',
  '/kontakt', '/impressum', '/datenschutz', '/agb', '/widerruf',
]);

const FORBIDDEN_PRECISION = /sub[- ]?arc(?:second|sec)|unter (?:einer|der) Bogensekunde|por debajo del segundo de arco|sotto il secondo d[’']arco|abaixo do segundo de arco|onder de boogseconde/i;

const fileFor = (path) =>
  path === '/' ? join(ROOT, 'index.html') : join(PUBLIC, path.slice(1), 'index.html');

// ── Small helpers ───────────────────────────────────────────────────────────
const capture = (html, pattern) => html.match(pattern)?.[1];

// Length limits apply to what a user and a SERP see, not to the source. A
// title carrying `&mdash;` is one character on screen and seven in the file;
// measuring the raw markup would flag correct titles as too long.
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', shy: '' };
const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);

const readAlternates = (markup) =>
  new Map(
    [...markup.matchAll(/<(?:link|xhtml:link)\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"\s*\/?>/gi)]
      .map((m) => [m[1], m[2]])
  );

const url = (slug) => (slug === '/' ? `${ORIGIN}/` : `${ORIGIN}/${slug.replace(/^\//, '')}`);

const expectedAlternates = (route) =>
  new Map(Object.entries(route.alt || {}).map(([lang, slug]) => [lang, url(slug)]));

const sameEntries = (left, right) =>
  JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());

const describeDiff = (actual, expected) => {
  const missing = [...expected].filter(([l, h]) => actual.get(l) !== h).map(([l]) => l);
  const extra = [...actual].filter(([l]) => !expected.has(l)).map(([l]) => l);
  return [missing.length ? `wrong/missing: ${missing.join(', ')}` : '', extra.length ? `unexpected: ${extra.join(', ')}` : '']
    .filter(Boolean).join('; ');
};

// ── Per-page HTML checks ────────────────────────────────────────────────────
function validateHtml(path, html) {
  const expectedCanonical = url(path === '/' ? '/' : path);
  const canonicals = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/gi)].map((m) => m[1]);
  if (canonicals.length !== 1 || canonicals[0] !== expectedCanonical) {
    fail(path, `expected exactly one self-canonical (${expectedCanonical}), found ${canonicals.join(', ') || 'none'}`);
  }

  const h1s = (html.match(/<h1(?:\s[^>]*)?>/gi) || []).length;
  if (h1s !== 1) fail(path, `expected exactly one H1, found ${h1s}`);

  const title = capture(html, /<title>([^<]*)<\/title>/i);
  if (!title) fail(path, 'missing <title>');
  else if (decode(title).length > TITLE_MAX) fail(path, `title is ${decode(title).length} chars (max ${TITLE_MAX})`);

  const desc = capture(html, /<meta\s+name="description"\s+content="([^"]*)"\s*\/?>/i);
  if (!desc) fail(path, 'missing meta description');
  else if (decode(desc).length < DESC_MIN || decode(desc).length > DESC_MAX) {
    fail(path, `meta description is ${decode(desc).length} chars (expected ${DESC_MIN}-${DESC_MAX})`);
  }

  for (const m of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(m[1]);
    } catch (error) {
      fail(path, `invalid JSON-LD (${error.message})`);
    }
  }

  if (FORBIDDEN_PRECISION.test(html)) fail(path, 'unsupported sub-arcsecond precision claim');
  if (path !== '/' && !html.includes('data-natal-observability')) {
    fail(path, 'static page lacks Vercel Web Analytics / Speed Insights instrumentation');
  }

  // Every internal link must point at something we actually publish. This is
  // the check that catches a renamed slug or a page removed from content.mjs
  // while other pages still link to it.
  for (const m of html.matchAll(/href="(\/[^"]*)"/gi)) {
    const href = m[1].split(/[?#]/)[0].replace(/\/$/, '') || '/';
    if (/\.[a-z0-9]+$/i.test(href)) continue; // assets and the cheat-sheet PDF
    if (!expectedPaths.has(href) && !appPaths.has(href)) {
      fail(path, `internal link has no published destination (${href})`);
    }
  }
}

for (const route of htmlRoutes) {
  const path = toPath(route.loc);
  const filename = fileFor(path);
  try {
    await access(filename);
  } catch {
    fail(path, `missing HTML file (${filename.replace(ROOT, '.')})`);
    continue;
  }
  const html = await readFile(filename, 'utf8');
  validateHtml(path, html);

  const actual = readAlternates(html);
  const expected = expectedAlternates(route);
  // Only pages that genuinely have a translation need hreflang in the HTML.
  // For a single-language page the sitemap still emits a self-referencing
  // en + x-default pair, which is valid but carries no information, so its
  // absence from the markup is not a defect.
  const translated = new Set(expected.values()).size > 1;
  if (translated && !sameEntries(actual, expected)) {
    fail(path, `HTML hreflang does not match its language cluster (${describeDiff(actual, expected)})`);
  }
}

// ── Sitemap checks ──────────────────────────────────────────────────────────
const sitemap = await readFile(join(PUBLIC, 'sitemap.xml'), 'utf8');
const blocks = sitemap.split('<url>').slice(1);
const sitemapPaths = new Set();

for (const block of blocks) {
  const loc = capture(block, /<loc>https:\/\/natalnavigator\.com(\/[^<]*)<\/loc>/);
  if (!loc) {
    fail('sitemap', 'entry without a natalnavigator.com <loc>');
    continue;
  }
  const path = loc.replace(/\/$/, '') || '/';
  if (sitemapPaths.has(path)) fail(path, 'listed more than once in the sitemap');
  sitemapPaths.add(path);

  const lastmod = capture(block, /<lastmod>([^<]+)<\/lastmod>/);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod || '')) fail(path, `invalid or missing sitemap lastmod (${lastmod || 'none'})`);

  const route = routes.find((r) => toPath(r.loc) === path);
  if (route) {
    const expected = expectedAlternates(route);
    const actual = readAlternates(block);
    if (!sameEntries(actual, expected)) {
      fail(path, `sitemap hreflang does not match its language cluster (${describeDiff(actual, expected)})`);
    }
  }
}

for (const path of expectedPaths) {
  if (!sitemapPaths.has(path)) fail(path, 'published route is missing from the sitemap');
}
for (const path of sitemapPaths) {
  if (!expectedPaths.has(path)) fail(path, 'sitemap lists a URL that is not a published route');
}

const uniqueLastmods = new Set([...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1]));
if (uniqueLastmods.size < 5) fail('sitemap', `only ${uniqueLastmods.size} distinct lastmod values; per-page dates expected`);

const homeSource = await readFile(join(ROOT, 'index.html'), 'utf8');
if (/#root:not\(:empty\)\s*~\s*#seo-content/.test(homeSource)) {
  fail('/', 'SEO content is hidden as a sibling after hydration instead of being the React fallback');
}
if (FORBIDDEN_PRECISION.test(await readFile(join(ROOT, 'src', 'lib', 'landingContent.jsx'), 'utf8'))) {
  fail('landingContent.jsx', 'unsupported sub-arcsecond precision claim');
}

// ── Result ──────────────────────────────────────────────────────────────────
if (failures.length) {
  const unique = [...new Set(failures)];
  console.error(`validate-seo: ${unique.length} issue(s)\n- ${unique.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`validate-seo: ${htmlRoutes.length} pages passed canonical, title, description, schema, hreflang, sitemap and internal-link checks.`);
}
