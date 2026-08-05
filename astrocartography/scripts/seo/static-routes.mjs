// The hand-built routes that are NOT generated from content.mjs: the homepage,
// the blog index and the three original pillar guides, plus the downloadable
// cheat sheet. Their HTML is maintained by hand under public/, so nothing
// regenerates them if this list and the files drift apart.
//
// Kept in its own module because both build-sitemap.mjs (which writes the
// sitemap) and validate-seo.mjs (which checks it) need the list. Importing it
// from build-sitemap.mjs would make the validator rewrite the sitemap as a
// side effect of reading its own source of truth.

export const STATIC_ROUTES = [
  { loc: '/', priority: '1.0', changefreq: 'weekly', alt: { en: '/', 'x-default': '/' } },
  { loc: 'blog', priority: '0.7', changefreq: 'weekly', alt: { en: 'blog', 'x-default': 'blog' } },
  {
    loc: 'astrocartography',
    priority: '0.9',
    changefreq: 'monthly',
    alt: { en: 'astrocartography', de: 'astrokartographie', es: 'es/astrocartografia', pt: 'pt/astrocartografia', 'x-default': 'astrocartography' },
  },
  // de = the German *calculator* (astrokartographie/rechner), not the German
  // pillar guide. de-rechner.mjs already points its `en` alternate here, so
  // without this entry the pair was one-way and Google ignored both halves.
  { loc: 'astrocartography-calculator', priority: '0.8', changefreq: 'monthly', alt: { en: 'astrocartography-calculator', de: 'astrokartographie/rechner', es: 'es/calculadora-de-astrocartografia', pt: 'pt/calculadora-de-astrocartografia', 'x-default': 'astrocartography-calculator' } },
  {
    loc: 'astrokartographie',
    priority: '0.8',
    changefreq: 'monthly',
    alt: { en: 'astrocartography', de: 'astrokartographie', es: 'es/astrocartografia', pt: 'pt/astrocartografia', 'x-default': 'astrocartography' },
  },
  // Downloadable lead magnet (PDF), listed so Google can discover and index it
  // without waiting for a manual request or for the linking blog posts to be
  // crawled. It has no HTML, so page-level checks skip it.
  { loc: 'astrocartography-line-cheat-sheet.pdf', priority: '0.5', changefreq: 'yearly' },
];

// A generated page from content.mjs, expressed as a sitemap route.
// x-default = the EN member of the hreflang cluster (self only for EN pages).
export function pageToRoute(p) {
  const xDefault = p.lang === 'en' ? p.slug : (p.alt?.en || p.slug);
  const alt = { 'x-default': xDefault, [p.lang]: p.slug };
  if (p.alt) for (const [lang, slug] of Object.entries(p.alt)) alt[lang] = slug;
  return { loc: p.slug, priority: '0.7', changefreq: 'monthly', alt };
}

// The complete published route list: what the sitemap emits and what
// validate-seo.mjs expects to find on disk.
export const allRoutes = (pages) => [...STATIC_ROUTES, ...pages.map(pageToRoute)];
