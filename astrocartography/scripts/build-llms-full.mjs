// Generates public/llms-full.txt — a single Markdown corpus of every static
// guide so AI assistants can ingest the whole content cluster in one fetch.
// Built from the same source as the HTML pages (scripts/seo/content.mjs), so
// it never drifts from what's published. Wired into prebuild.

import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from './seo/content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://natalnavigator.com';

// HTML → plain text, preserving paragraph/heading/list breaks for readability.
function toText(html) {
  return String(html)
    .replace(/<h3[^>]*>/gi, '\n### ')
    .replace(/<\/h3>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/(p|li|ul|ol|tr|table|h3)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, '’')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/^[ \t]+/gm, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Prebuilt pages (landing-styled blog posts) ship their own HTML and carry no
// `sections` body here, so they can't be flattened into llms-full text — skip them.
const enFirst = [...PAGES]
  .filter((p) => !p.prebuilt)
  .sort((a, b) => (a.lang === b.lang ? 0 : a.lang === 'en' ? -1 : 1));

const latestUpdate = [...enFirst]
  .map((p) => p.dateModified || p.datePublished || '2026-06-15')
  .sort()
  .at(-1);

const header = `# Natal Navigator — Full Guide Corpus

This file concatenates the full text of every astrocartography guide on
natalnavigator.com for machine reading. Astrocartography is presented as a
reflective, interpretive astrology tool, not as scientific prediction.
Canonical site: ${ORIGIN}/  ·  Summary: ${ORIGIN}/llms.txt
Generated from canonical guide sources · Latest material update: ${latestUpdate}
Methodology and corrections: ${ORIGIN}/about

`;

const body = enFirst
  .map((p) => {
    const lines = [];
    lines.push(`\n---\n`);
    lines.push(`## ${p.h1}`);
    lines.push(`URL: ${ORIGIN}/${p.slug}  ·  Language: ${p.lang}`);
    lines.push('');
    lines.push(toText(p.lead));
    for (const s of p.sections) {
      lines.push(`\n### ${s.h2}`);
      lines.push(toText(s.html));
    }
    if (p.faq?.length) {
      lines.push(`\n### FAQ`);
      for (const f of p.faq) lines.push(`\n**${toText(f.q)}**\n${toText(f.a)}`);
    }
    return lines.join('\n');
  })
  .join('\n');

await writeFile(join(ROOT, 'public', 'llms-full.txt'), header + body + '\n', 'utf8');
console.log(`build-llms-full: wrote corpus for ${PAGES.length} pages.`);
