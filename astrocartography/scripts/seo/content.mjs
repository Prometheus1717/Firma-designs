// ─────────────────────────────────────────────────────────────────────────
// Aggregates every static SEO guide / intent page. Each page is a module
// under ./pages/<slug>.mjs with a default export (a page object, or an array
// of them). They are auto-discovered here and rendered by build-pages.mjs /
// listed by build-sitemap.mjs.
//
// Content rules (Guardrails, SEO-GEO-STRATEGY.md §9):
//  - Unique, hand-written prose per page — no templated filler.
//  - Astrology framed as a reflective / interpretive tool, never as
//    prediction or hard science. No invented statistics or ratings.
//  - `lead` is the citable definition paragraph (entity + plain definition).
//  - `faq` doubles as visible Q&A and FAQPage schema.
//
// Page object schema (see ./pages/venus-line.mjs for a worked example):
//   slug, lang, title, ogTitle?, description, keywords, articleHeadline?,
//   datePublished?, dateModified?, breadcrumb:[{name,url}], h1, lead (HTML),
//   sections:[{h2, html}], faq:[{q,a}], related:[{href,label}],
//   alt?:{ <lang>: slug }, definedTerm?:{ name, alternateName:[], description }
// ─────────────────────────────────────────────────────────────────────────

import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const pagesDir = join(dirname(fileURLToPath(import.meta.url)), 'pages');
const files = readdirSync(pagesDir)
  .filter((f) => f.endsWith('.mjs'))
  .sort();

const modules = await Promise.all(files.map((f) => import(join(pagesDir, f))));
export const PAGES = modules.flatMap((m) => m.default);

// Fail loudly on duplicate slugs — a copy/paste mistake would otherwise have
// one page silently overwrite another's output directory.
const seen = new Set();
for (const p of PAGES) {
  if (seen.has(p.slug)) throw new Error(`Duplicate page slug: ${p.slug}`);
  seen.add(p.slug);
}
