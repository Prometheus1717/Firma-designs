// Generates public/sitemap.xml from the product routes that should be indexed.
//
// Run as part of `npm run build` (before `vite build`).

import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://natalnavigator.com';
const TODAY = new Date().toISOString().slice(0, 10);

const url = (path) => (path === '/' ? ORIGIN + '/' : ORIGIN + '/' + path.replace(/^\//, ''));

const STATIC_ROUTES = [
  { loc: '/', priority: '1.0', changefreq: 'weekly', alt: { en: '/', 'x-default': '/' } },
  { loc: 'auth', priority: '0.1', changefreq: 'yearly' },
  { loc: 'impressum', priority: '0.1', changefreq: 'yearly' },
  { loc: 'datenschutz', priority: '0.1', changefreq: 'yearly' },
  { loc: 'agb', priority: '0.1', changefreq: 'yearly' },
  { loc: 'widerruf', priority: '0.1', changefreq: 'yearly' },
  { loc: 'kontakt', priority: '0.1', changefreq: 'yearly' },
];

const routes = STATIC_ROUTES;

const entries = routes
  .map((r) => {
    const alts = Object.entries(r.alt || {})
      .map(([lang, slug]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${url(slug)}" />`)
      .join('\n');
    return `  <url>
    <loc>${url(r.loc)}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
${alts}
  </url>`;
  })
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>
`;

await writeFile(join(ROOT, 'public', 'sitemap.xml'), xml, 'utf8');
console.log(`build-sitemap: wrote ${routes.length} URLs (lastmod ${TODAY}).`);
