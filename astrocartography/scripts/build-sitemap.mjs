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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://natalnavigator.com';
const TODAY = new Date().toISOString().slice(0, 10);

const url = (path) => (path === '/' ? ORIGIN + '/' : ORIGIN + '/' + path.replace(/^\//, ''));

// Hand-built routes that are not generated from content.mjs.
const STATIC_ROUTES = [
  { loc: '/', priority: '1.0', changefreq: 'weekly', alt: { en: '/', 'x-default': '/' } },
  { loc: 'blog', priority: '0.7', changefreq: 'weekly', alt: { en: 'blog', 'x-default': 'blog' } },
  {
    loc: 'astrocartography',
    priority: '0.9',
    changefreq: 'monthly',
    alt: { en: 'astrocartography', de: 'astrokartographie', es: 'es/astrocartografia', pt: 'pt/astrocartografia', 'x-default': 'astrocartography' },
  },
  { loc: 'astrocartography-calculator', priority: '0.8', changefreq: 'monthly', alt: { en: 'astrocartography-calculator', es: 'es/calculadora-de-astrocartografia', pt: 'pt/calculadora-de-astrocartografia', 'x-default': 'astrocartography-calculator' } },
  {
    loc: 'astrokartographie',
    priority: '0.8',
    changefreq: 'monthly',
    alt: { en: 'astrocartography', de: 'astrokartographie', es: 'es/astrocartografia', pt: 'pt/astrocartografia', 'x-default': 'astrocartography' },
  },
  // Downloadable lead magnet (PDF) — listed so Google can discover and index it
  // without waiting for a manual request or for the linking blog posts to be crawled.
  { loc: 'astrocartography-line-cheat-sheet.pdf', priority: '0.5', changefreq: 'yearly' },
];

function pageToRoute(p) {
  // x-default = the EN member of the hreflang cluster (self only for EN pages).
  const xDefault = p.lang === 'en' ? p.slug : (p.alt?.en || p.slug);
  const alt = { 'x-default': xDefault, [p.lang]: p.slug };
  if (p.alt) for (const [lang, slug] of Object.entries(p.alt)) alt[lang] = slug;
  return { loc: p.slug, priority: '0.7', changefreq: 'monthly', alt };
}

const routes = [...STATIC_ROUTES, ...PAGES.map(pageToRoute)];

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
