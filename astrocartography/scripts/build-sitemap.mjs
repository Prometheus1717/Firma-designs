// Generates public/sitemap.xml from a central route list so it can never go
// stale again. Combines the hand-built routes (homepage + original guides)
// with every generated page from scripts/seo/content.mjs, and emits correct
// hreflang alternate links for EN/DE pairs.
//
// Run as part of `npm run build` (before `vite build`).

import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from './seo/content.mjs';
import { allRoutes } from './seo/static-routes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://natalnavigator.com';
const url = (path) => (path === '/' ? ORIGIN + '/' : ORIGIN + '/' + path.replace(/^\//, ''));

const routes = allRoutes(PAGES);

const entries = routes
  .map((r) => {
    const alts = Object.entries(r.alt || {})
      .map(([lang, slug]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${url(slug)}" />`)
      .join('\n');
    return `  <url>
    <loc>${url(r.loc)}</loc>
    <lastmod>${r.lastmod}</lastmod>
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
console.log(`build-sitemap: wrote ${routes.length} URLs with per-page lastmod values.`);
