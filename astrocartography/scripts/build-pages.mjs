// Build-time generator for the static SEO guide/intent pages (Phase 2 content
// cluster). Single source of truth is scripts/seo/content.mjs; this script
// renders each page object into a self-contained static HTML file under
// public/<slug>/index.html, matching the markup/CSS of the original guides.
//
// Deliberately NO analytics snippet: the consent system (TDDDG §25) lives in
// the React app; these standalone pages must not drop analytics storage
// without consent.
//
// Run as part of `npm run build` (before `vite build`, so the output lands in
// public/ and is copied into dist/).

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from './seo/content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const ORIGIN = 'https://natalnavigator.com';

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// JSON-LD text fields must be plain text — strip any inline HTML the prose uses.
const plain = (s) =>
  String(s)
    .replace(/<[^>]+>/g, '')
    .replace(/&mdash;/g, '—')
    .replace(/&rsquo;/g, '’')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const abs = (path) => (path.startsWith('http') ? path : ORIGIN + (path.startsWith('/') ? path : '/' + path));

function renderHreflang(page) {
  const self = abs('/' + page.slug);
  const links = [
    `<link rel="canonical" href="${self}" />`,
    `<link rel="alternate" hreflang="x-default" href="${self}" />`,
    `<link rel="alternate" hreflang="${page.lang}" href="${self}" />`,
  ];
  if (page.alt) {
    for (const [lang, slug] of Object.entries(page.alt)) {
      links.push(`<link rel="alternate" hreflang="${lang}" href="${abs('/' + slug)}" />`);
    }
  }
  return links.join('\n  ');
}

function renderSchema(page) {
  const self = abs('/' + page.slug);
  const graph = [];

  graph.push({
    '@type': 'Article',
    headline: page.articleHeadline || page.h1,
    description: plain(page.description),
    author: { '@type': 'Organization', name: 'Natal Navigator', url: ORIGIN },
    publisher: {
      '@type': 'Organization',
      name: 'Natal Navigator',
      logo: { '@type': 'ImageObject', url: `${ORIGIN}/favicon.svg` },
    },
    datePublished: page.datePublished || '2026-06-15',
    dateModified: page.dateModified || page.datePublished || '2026-06-15',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': self,
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['article h1', 'p.lead', 'article h2'] },
    },
    image: `${ORIGIN}/og-image.png`,
    inLanguage: page.lang,
    ...(page.definedTerm ? { about: { '@type': 'DefinedTerm', '@id': self + '#term' } } : {}),
  });

  graph.push({
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN + '/' },
      ...page.breadcrumb.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: b.name,
        item: abs(b.url),
      })),
    ],
  });

  if (page.faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: page.faq.map((f) => ({
        '@type': 'Question',
        name: plain(f.q),
        acceptedAnswer: { '@type': 'Answer', text: plain(f.a) },
      })),
    });
  }

  if (page.definedTerm) {
    graph.push({
      '@type': 'DefinedTerm',
      '@id': self + '#term',
      name: page.definedTerm.name,
      alternateName: page.definedTerm.alternateName || [],
      description: plain(page.definedTerm.description),
      inDefinedTermSet: {
        '@type': 'DefinedTermSet',
        name: 'Astrocartography Glossary',
        url: abs('/astrocartography'),
      },
    });
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
}

function renderTable(t) {
  if (!t) return '';
  const head = `<thead><tr>${t.headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>`;
  const body = `<tbody>${t.rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('')}</tbody>`;
  return `<table>${t.caption ? `<caption class="sr-only">${esc(t.caption)}</caption>` : ''}${head}${body}</table>`;
}

function renderBody(page) {
  const isDe = page.lang === 'de';
  const t = {
    home: isDe ? 'Globus' : 'Globe',
    calc: isDe ? 'Rechner' : 'Calculator',
    other: isDe ? 'EN' : 'DE',
    crumbHome: 'Home',
    faqHeading: isDe ? 'Häufige Fragen' : 'Frequently asked questions',
    relatedHeading: isDe ? 'Weiterlesen' : 'Keep exploring',
    footerNote: isDe
      ? 'Astrokartographie zu Bildungs- und Reflexionszwecken.'
      : 'Astrocartography for educational and reflective purposes.',
  };

  const crumb = page.breadcrumb
    .map((b, i) =>
      i === page.breadcrumb.length - 1
        ? esc(b.name)
        : `<a href="${b.url}">${esc(b.name)}</a> &rsaquo; `
    )
    .join('');

  const sections = page.sections
    .map((s) => `      <h2>${esc(s.h2)}</h2>\n      ${s.html}`)
    .join('\n\n');

  const faq = page.faq?.length
    ? `      <h2>${t.faqHeading}</h2>\n` +
      page.faq.map((f) => `      <h3>${esc(f.q)}</h3>\n      <p>${f.a}</p>`).join('\n\n')
    : '';

  const related = page.related?.length
    ? `      <section class="related">\n        <h2>${t.relatedHeading}</h2>\n        <ul>\n${page.related
        .map((r) => `          <li><a href="${r.href}">${esc(r.label)}</a></li>`)
        .join('\n')}\n        </ul>\n      </section>`
    : '';

  return { t, crumb, sections, faq, related };
}

const CSS = `:root { --bg:#0A1018; --ink:#C8D8E8; --dim:#8A9BB0; --accent:#00D88A; --blue:#7EB8FF; --yellow:#FACC15; --red:#F04060; --line:#1A2840; }
    *,*::before,*::after { box-sizing: border-box; }
    html,body { margin:0; padding:0; background:var(--bg); color:var(--ink); font-family:'Instrument Sans',system-ui,-apple-system,sans-serif; line-height:1.7; -webkit-font-smoothing:antialiased; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); border:0; }
    header.top { padding: 16px 24px; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; }
    header.top .brand { font-family:'JetBrains Mono',monospace; font-weight:700; letter-spacing:3px; font-size:14px; color:var(--accent); }
    header.top nav a { margin-left: 20px; font-size: 13px; color: var(--dim); letter-spacing: 1px; text-transform: uppercase; }
    header.top nav a:hover { color: var(--ink); }
    main.page { max-width: 820px; margin: 0 auto; padding: 32px 24px 80px; }
    nav.breadcrumb { font-size: 13px; color: var(--dim); margin-bottom: 24px; }
    nav.breadcrumb a { color: var(--dim); }
    h1 { font-family:'JetBrains Mono',monospace; font-size: 34px; line-height: 1.2; letter-spacing: 1px; color: var(--accent); margin: 0 0 12px; }
    h2 { font-family:'JetBrains Mono',monospace; font-size: 22px; color: var(--accent); margin: 48px 0 12px; letter-spacing: 1px; padding-bottom: 8px; border-bottom: 1px solid var(--line); }
    h3 { font-size: 18px; color: var(--blue); margin: 28px 0 8px; font-weight: 600; }
    p { color: var(--ink); font-size: 16px; margin: 12px 0; }
    p.lead { font-size: 18px; color: var(--ink); }
    ul, ol { padding-left: 22px; color: var(--ink); }
    li { margin: 8px 0; font-size: 16px; }
    strong { color: #E8F0FA; }
    .cta { display: inline-block; background: var(--accent); color: #06131C; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; letter-spacing: 1px; text-transform: uppercase; margin: 20px 0; font-family:'JetBrains Mono',monospace; }
    .cta:hover { background: #4FE8B0; text-decoration: none; }
    .callout { border: 1px solid var(--line); background: rgba(26,40,64,0.4); border-left: 3px solid var(--accent); padding: 16px 20px; border-radius: 6px; margin: 24px 0; }
    .callout h3 { margin-top: 0; color: var(--accent); }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--line); }
    th { color: var(--accent); font-family:'JetBrains Mono',monospace; font-weight: 700; letter-spacing: 1px; font-size: 12px; text-transform: uppercase; }
    td { color: var(--ink); }
    .related { margin-top: 60px; padding-top: 24px; border-top: 1px solid var(--line); }
    .related h2 { border: none; padding: 0; margin-top: 0; }
    .related ul { list-style: none; padding: 0; }
    .related li { margin: 10px 0; }
    footer.site { border-top: 1px solid var(--line); padding: 32px 24px; text-align: center; font-size: 13px; color: var(--dim); }
    footer.site a { color: var(--dim); margin: 0 10px; }
    @media (max-width: 600px) {
      h1 { font-size: 26px; }
      h2 { font-size: 19px; }
      header.top nav a { margin-left: 10px; font-size: 11px; }
    }`;

function renderPage(page) {
  const { t, crumb, sections, faq, related } = renderBody(page);
  const ogLocale = page.lang === 'de' ? 'de_DE' : 'en_US';
  return `<!doctype html>
<html lang="${page.lang}" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>${esc(page.title)}</title>
  <meta name="description" content="${esc(plain(page.description))}" />
  <meta name="keywords" content="${esc(page.keywords)}" />
  <meta name="author" content="Natal Navigator" />
  ${renderHreflang(page)}

  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <meta name="theme-color" content="#00D88A" />

  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Natal Navigator" />
  <meta property="og:title" content="${esc(page.ogTitle || page.h1)}" />
  <meta property="og:description" content="${esc(plain(page.description))}" />
  <meta property="og:url" content="${abs('/' + page.slug)}" />
  <meta property="og:image" content="${ORIGIN}/og-image.png" />
  <meta property="og:locale" content="${ogLocale}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(page.ogTitle || page.h1)}" />
  <meta name="twitter:description" content="${esc(plain(page.description))}" />
  <meta name="twitter:image" content="${ORIGIN}/og-image.png" />

  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />

  <script type="application/ld+json">
${renderSchema(page)}
  </script>

  <link rel="stylesheet" href="/fonts/fonts.css" />

  <style>
    ${CSS}
  </style>
</head>
<body>
  <header class="top">
    <a href="/" class="brand" aria-label="Natal Navigator Home">NATAL NAVIGATOR</a>
    <nav aria-label="Primary">
      <a href="/">${t.home}</a>
      <a href="/astrocartography-calculator">${t.calc}</a>
      <a href="/${page.lang === 'de' ? 'astrocartography' : 'astrokartographie'}">${t.other}</a>
    </nav>
  </header>

  <main class="page">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">${t.crumbHome}</a> &rsaquo; ${crumb}
    </nav>

    <article>
      <h1>${esc(page.h1)}</h1>
      <p class="lead">${page.lead}</p>

      <p><a href="/demo" class="cta">${page.lang === 'de' ? 'Live-Demo öffnen' : 'Open the live demo'} &rarr;</a></p>

${sections}

      <div class="callout">
        <h3>${page.lang === 'de' ? 'Deine eigene Karte' : 'See it on your own chart'}</h3>
        <p>${
          page.lang === 'de'
            ? 'Probiere die interaktive Demo mit Beispiel-Charts. Deine persönliche 40-Linien-Karte mit deinen eigenen Geburtsdaten gibt es für einmalig 9,99 € — ohne Abo.'
            : 'Explore the interactive demo with example charts. Your personal 40-line map, built from your own birth data, is a one-time €9.99 / $9.99 — no subscription.'
        }</p>
        <p><a href="/demo" class="cta">${page.lang === 'de' ? 'Globus starten' : 'Launch the globe'} &rarr;</a></p>
      </div>

${faq}

${related}
    </article>
  </main>

  <footer class="site">
    <div>
      <a href="/">${t.home}</a> &middot;
      <a href="/astrocartography">Astrocartography</a> &middot;
      <a href="/astrocartography-calculator">${t.calc}</a> &middot;
      <a href="/astrokartographie">Astrokartographie</a>
    </div>
    <p>&copy; 2026 Natal Navigator. ${t.footerNote}</p>
  </footer>
</body>
</html>
`;
}

let count = 0;
for (const page of PAGES) {
  const outDir = join(PUBLIC, page.slug);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'index.html'), renderPage(page), 'utf8');
  count++;
}
console.log(`build-pages: wrote ${count} static page(s).`);
