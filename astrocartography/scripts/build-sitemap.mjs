// Generate the sitemap only from pages that the production build actually
// serves. Content dates are stable: a deploy does not pretend every page was
// substantively updated that day.

import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INDEXABLE_PAGES } from './seo/content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://natalnavigator.com';

const url = (path) => (path === '/' ? `${ORIGIN}/` : `${ORIGIN}/${path.replace(/^\//, '')}`);

const STATIC_ROUTES = [
  {
    loc: '/',
    lastmod: '2026-08-03',
    priority: '1.0',
    changefreq: 'weekly',
    alt: { en: '/', 'x-default': '/' },
  },
  {
    loc: 'blog',
    lastmod: '2026-08-03',
    priority: '0.7',
    changefreq: 'weekly',
    alt: { en: 'blog', 'x-default': 'blog' },
  },
];

function pageToRoute(page) {
  const defaultSlug = page.lang === 'en' ? page.slug : page.alt?.en || page.slug;
  return {
    loc: page.slug,
    lastmod: page.dateModified || page.datePublished,
    priority: ['astrocartography', 'astrokartographie', 'astrocartography-calculator'].includes(page.slug)
      ? '0.9'
      : '0.7',
    changefreq: 'monthly',
    alt: { 'x-default': defaultSlug, [page.lang]: page.slug, ...(page.alt || {}) },
  };
}

const routes = [...STATIC_ROUTES, ...INDEXABLE_PAGES.map(pageToRoute)];

const entries = routes
  .map((route) => {
    const alternates = Object.entries(route.alt || {})
      .map(([lang, slug]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${url(slug)}" />`)
      .join('\n');
    return `  <url>
    <loc>${url(route.loc)}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
${alternates}
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
console.log(`build-sitemap: wrote ${routes.length} indexable URLs with stable lastmod dates.`);
