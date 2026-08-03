// Build-time checks for the SEO contract shared by generated HTML, sitemap and
// internal links. This intentionally uses no third-party parser so it runs in
// the same minimal environment as the static generators.

import { access, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INDEXABLE_PAGES } from './seo/content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const ORIGIN = 'https://natalnavigator.com';
const failures = [];

const expectedPaths = new Set(['/', '/blog', ...INDEXABLE_PAGES.map((page) => `/${page.slug}`)]);
const pagesByPath = new Map(INDEXABLE_PAGES.map((page) => [`/${page.slug}`, page]));
const appPaths = new Set([
  '/demo', '/auth', '/landing', '/kontakt', '/impressum', '/datenschutz', '/agb', '/widerruf',
]);

function capture(html, pattern) {
  return html.match(pattern)?.[1];
}

function expectedAlternates(path) {
  if (path === '/' || path === '/blog') {
    const href = path === '/' ? `${ORIGIN}/` : `${ORIGIN}${path}`;
    return new Map([['en', href], ['x-default', href]]);
  }
  const page = pagesByPath.get(path);
  const self = `${ORIGIN}${path}`;
  const defaultHref = page.lang === 'en' ? self : page.alt?.en ? `${ORIGIN}/${page.alt.en}` : self;
  return new Map([
    ['x-default', defaultHref],
    [page.lang, self],
    ...Object.entries(page.alt || {}).map(([lang, slug]) => [lang, `${ORIGIN}/${slug}`]),
  ]);
}

function readAlternates(markup) {
  return new Map(
    [...markup.matchAll(/<(?:link|xhtml:link)\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"\s*\/?>/gi)]
      .map((match) => [match[1], match[2]])
  );
}

const sameEntries = (left, right) => JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());

function validateHtml(path, html) {
  const expectedCanonical = path === '/' ? `${ORIGIN}/` : `${ORIGIN}${path}`;
  const canonicals = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/gi)].map((m) => m[1]);
  if (canonicals.length !== 1 || canonicals[0] !== expectedCanonical) {
    failures.push(`${path}: expected one self-canonical (${expectedCanonical}), found ${canonicals.join(', ') || 'none'}`);
  }

  const h1Count = (html.match(/<h1(?:\s[^>]*)?>/gi) || []).length;
  if (h1Count !== 1) failures.push(`${path}: expected one H1, found ${h1Count}`);

  const description = capture(html, /<meta\s+name="description"\s+content="([^"]+)"\s*\/?>/i);
  if (!description || description.length < 80 || description.length > 180) {
    failures.push(`${path}: meta description must be 80–180 characters (found ${description?.length || 0})`);
  }

  const expectedHreflang = expectedAlternates(path);
  const actualHreflang = readAlternates(html);
  if (!sameEntries(actualHreflang, expectedHreflang)) {
    failures.push(`${path}: HTML hreflang set does not match its reciprocal language cluster`);
  }

  for (const match of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      failures.push(`${path}: invalid JSON-LD (${error.message})`);
    }
  }

  for (const match of html.matchAll(/href="(\/[^"]*)"/gi)) {
    const href = match[1].split(/[?#]/)[0].replace(/\/$/, '') || '/';
    if (/\.[a-z0-9]+$/i.test(href)) continue;
    if (!expectedPaths.has(href) && !appPaths.has(href)) {
      failures.push(`${path}: internal link has no published destination (${href})`);
    }
  }
}

for (const path of expectedPaths) {
  const filename = path === '/'
    ? join(ROOT, 'index.html')
    : join(PUBLIC, path.slice(1), 'index.html');
  try {
    await access(filename);
    validateHtml(path, await readFile(filename, 'utf8'));
  } catch {
    failures.push(`${path}: missing HTML file (${filename})`);
  }
}

const sitemap = await readFile(join(PUBLIC, 'sitemap.xml'), 'utf8');
const sitemapPaths = new Set(
  [...sitemap.matchAll(/<loc>https:\/\/natalnavigator\.com(\/[^<]*)<\/loc>/g)].map((m) => m[1].replace(/\/$/, '') || '/')
);
for (const path of expectedPaths) {
  if (!sitemapPaths.has(path)) failures.push(`${path}: missing from sitemap`);
}
for (const path of sitemapPaths) {
  if (!expectedPaths.has(path)) failures.push(`${path}: sitemap URL is not an indexable page`);
}

for (const block of sitemap.split('<url>').slice(1)) {
  const path = capture(block, /<loc>https:\/\/natalnavigator\.com(\/[^<]*)<\/loc>/)?.replace(/\/$/, '') || '/';
  const lastmod = capture(block, /<lastmod>([^<]+)<\/lastmod>/);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod || '')) failures.push(`${path}: invalid or missing sitemap lastmod`);
  if (!sameEntries(readAlternates(block), expectedAlternates(path))) {
    failures.push(`${path}: sitemap hreflang set does not match page HTML`);
  }
}

if (failures.length) {
  console.error(`SEO validation failed with ${failures.length} issue(s):\n- ${[...new Set(failures)].join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`validate-seo: ${expectedPaths.size} indexable pages passed canonical, metadata, schema, sitemap and internal-link checks.`);
}
