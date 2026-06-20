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

// ── Planetary-line cross-link cluster ──────────────────────────────────────
// Line pages (astrocartography/<x>-line, astrokartographie/<x>linie) previously
// cross-linked only via hand-picked `related` pairs, leaving several lines
// reachable from the pillar alone (moon-line, mercury-line had a single inbound
// link). This renders a full-mesh cluster — every line links to all its
// siblings — plus a bridge to the evergreen blog guides for the EN set.
const isEnLine = (slug) => /^astrocartography\/[a-z]+-line$/.test(slug);
const isDeLine = (slug) => /^astrokartographie\/[a-z]+linie$/.test(slug);
const LINE_PAGES = {
  en: PAGES.filter((p) => isEnLine(p.slug)).map((p) => p.slug).sort(),
  de: PAGES.filter((p) => isDeLine(p.slug)).map((p) => p.slug).sort(),
};
const lineLabel = (slug) => {
  const seg = slug.split('/')[1];
  return isEnLine(slug)
    ? seg.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
    : seg[0].toUpperCase() + seg.slice(1);
};
function renderLinesCluster(page) {
  const de = isDeLine(page.slug);
  if (!de && !isEnLine(page.slug)) return '';
  const siblings = (de ? LINE_PAGES.de : LINE_PAGES.en).filter((s) => s !== page.slug);
  if (!siblings.length) return '';
  const heading = de ? 'Alle Planetenlinien' : 'All planetary lines';
  const items = siblings
    .map((s) => `          <li><a href="/${s}">${lineLabel(s)}</a></li>`)
    .join('\n');
  const guides = de
    ? ''
    : `\n        <p class="cluster-guides">Guides: <a href="/blog/astrocartography-lines-explained">Lines explained</a> &middot; <a href="/blog/how-to-read-astrocartography-map">How to read your map</a> &middot; <a href="/blog/strongest-astrocartography-line">Strongest line</a></p>`;
  return `      <nav class="lines-cluster" aria-label="${heading}">\n        <h2>${heading}</h2>\n        <ul>\n${items}\n        </ul>${guides}\n      </nav>`;
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
    .note { border: 1px solid var(--accent); background: rgba(0,216,138,0.08); border-left: 4px solid var(--accent); padding: 16px 20px; border-radius: 6px; margin: 24px 0; font-size: 16px; color: #E8F0FA; }
    .note strong { color: var(--accent); }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--line); }
    th { color: var(--accent); font-family:'JetBrains Mono',monospace; font-weight: 700; letter-spacing: 1px; font-size: 12px; text-transform: uppercase; }
    td { color: var(--ink); }
    .related { margin-top: 60px; padding-top: 24px; border-top: 1px solid var(--line); }
    .related h2 { border: none; padding: 0; margin-top: 0; }
    .related ul { list-style: none; padding: 0; }
    .related li { margin: 10px 0; }
    .lines-cluster { margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--line); }
    .lines-cluster h2 { border: none; padding: 0; margin: 0 0 14px; font-size: 18px; }
    .lines-cluster ul { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 4px 18px; }
    .lines-cluster li { margin: 4px 0; font-size: 15px; }
    .lines-cluster .cluster-guides { font-size: 14px; color: var(--dim); margin-top: 16px; }
    footer.site { border-top: 1px solid var(--line); padding: 32px 24px; text-align: center; font-size: 13px; color: var(--dim); }
    footer.site a { color: var(--dim); margin: 0 10px; }
    @media (max-width: 600px) {
      h1 { font-size: 26px; }
      h2 { font-size: 19px; }
      header.top nav a { margin-left: 10px; font-size: 11px; }
    }`;

function renderPage(page) {
  const { t, crumb, sections, faq, related } = renderBody(page);
  const linesCluster = renderLinesCluster(page);
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
      <a href="/blog">Blog</a>
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
${page.note ? `\n      <div class="note">${page.note}</div>\n` : ''}
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
${linesCluster}
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

// ── Blog index (/blog) — hub listing every blog post ──
// Rendered in the warm "landing" design (paper + Instrument Serif), matching
// the individual landing-styled posts — NOT the dark webapp template.
const BLOG_CSS = `:root {
      --paper:#FBF8F1; --paper2:#F4EFE3; --card:#FFFFFF;
      --ink:#181C23; --ink2:#4C5563; --ink3:#8A93A2;
      --line:#E7E0D1; --line2:#DDD5C2;
      --mint:#0E7C5B; --mint-soft:#DCF2E5; --mint-bright:#19C68B;
      --r-lg:26px;
      --serif:'Instrument Serif', Georgia, 'Times New Roman', serif;
      --sans:'General Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --mono:'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
    }
    *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: var(--paper); color: var(--ink); font-family: var(--sans); font-size: 16px; line-height: 1.7; -webkit-font-smoothing: antialiased; }
    a { color: var(--ink); text-decoration: none; }
    .nav-wrap { position: sticky; top: 0; z-index: 50; padding: 16px clamp(12px,3vw,28px) 6px; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
    .nav { max-width: 1120px; margin: 0 auto; height: 60px; padding: 0 10px 0 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px; background: rgba(255,255,255,.6); border: 1px solid rgba(255,255,255,.7); border-radius: 999px; box-shadow: 0 10px 34px -18px rgba(40,44,90,.32), inset 0 1px 0 rgba(255,255,255,.8); }
    .logo { display: flex; align-items: center; gap: 9px; font-weight: 600; font-size: 15.5px; color: var(--ink); }
    .logo-mark { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 9px; background: var(--ink); color: #fff; font-family: var(--serif); font-size: 16px; font-style: italic; }
    .nav-links { display: flex; gap: clamp(12px,2vw,26px); font-size: 14.5px; font-weight: 500; color: var(--ink2); }
    .nav-links a:hover { color: var(--ink); }
    .nav-cta { display: inline-flex; align-items: center; gap: 9px; padding: 10px 18px; border-radius: 999px; background: var(--ink); color: var(--paper) !important; font-weight: 600; font-size: 14px; transition: transform .22s, box-shadow .22s; }
    .nav-cta:hover { transform: translateY(-1px); box-shadow: 0 14px 30px -10px rgba(24,28,35,.45); }
    .wrap { max-width: 1080px; margin: 0 auto; padding: 0 clamp(20px,4vw,40px); }
    .hero { padding: clamp(46px,7vh,84px) 0 clamp(20px,4vh,38px); position: relative; overflow: hidden; text-align: center; }
    .hero-aurora { position: absolute; inset: 0; pointer-events: none; z-index: 0; background: radial-gradient(680px 380px at 15% 4%, rgba(93,79,184,.18), transparent 64%), radial-gradient(760px 440px at 86% 0%, rgba(25,198,139,.16), transparent 64%); mask-image: linear-gradient(180deg,#000 0%,#000 55%,transparent 88%); -webkit-mask-image: linear-gradient(180deg,#000 0%,#000 55%,transparent 88%); }
    .hero-inner { position: relative; z-index: 1; }
    .breadcrumb { font-size: 13px; color: var(--ink3); margin-bottom: 22px; }
    .breadcrumb a { color: var(--ink3); }
    .breadcrumb a:hover { color: var(--ink); }
    .badge { display: inline-flex; align-items: center; gap: 9px; padding: 8px 18px; background: rgba(255,255,255,.5); border: 1px solid rgba(255,255,255,.7); border-radius: 999px; box-shadow: 0 6px 20px -12px rgba(40,44,90,.4), inset 0 1px 0 rgba(255,255,255,.8); font-family: var(--mono); font-size: 11.5px; letter-spacing: .04em; color: var(--ink2); margin-bottom: 22px; }
    .badge-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--mint-bright); box-shadow: 0 0 0 4px rgba(25,198,139,.22); }
    h1 { font-family: var(--serif); font-weight: 400; font-size: clamp(38px,5.4vw,68px); line-height: 1.08; letter-spacing: -.015em; color: var(--ink); margin: 0 auto 16px; }
    .lead { font-size: clamp(17px,2vw,20px); line-height: 1.55; color: var(--ink2); max-width: 58ch; margin: 0 auto; }
    .blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px,1fr)); gap: 22px; margin: 44px 0 70px; }
    .blog-card { display: flex; flex-direction: column; background: var(--card); border: 1px solid var(--line); border-radius: var(--r-lg); padding: 30px 28px; box-shadow: 0 14px 38px -28px rgba(40,44,90,.25); transition: transform .2s ease, box-shadow .2s ease; }
    .blog-card:hover { transform: translateY(-3px); box-shadow: 0 22px 46px -24px rgba(40,44,90,.34); }
    .blog-card .date { font-family: var(--mono); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--ink3); }
    .blog-card h2 { font-family: var(--serif); font-weight: 400; font-size: 25px; line-height: 1.18; color: var(--ink); margin: 9px 0 10px; }
    .blog-card p { font-size: 15px; color: var(--ink2); margin: 0 0 16px; flex: 1; }
    .blog-card .more { font-family: var(--mono); font-size: 12px; letter-spacing: .04em; color: var(--mint); }
    footer.site { border-top: 1px solid var(--line); padding: 40px clamp(20px,4vw,40px); text-align: center; font-size: 14px; color: var(--ink3); background: var(--paper2); }
    footer.site a { color: var(--ink2); margin: 0 12px; }
    footer.site a:hover { color: var(--ink); }
    footer.site .small { margin-top: 14px; font-size: 12.5px; }
    @media (max-width: 600px) { .nav-links { display: none; } .blog-grid { grid-template-columns: 1fr; } }`;

function renderBlogIndex(posts) {
  const ordered = [...posts].sort((a, b) =>
    (b.datePublished || '').localeCompare(a.datePublished || '')
  );
  const items = ordered
    .map(
      (p) => `        <a class="blog-card" href="/${p.slug}">
          <span class="date">${p.datePublished || ''}${p.lang === 'de' ? ' · DE' : ''}</span>
          <h2>${esc(p.h1)}</h2>
          <p>${esc(plain(p.description))}</p>
          <span class="more">${p.lang === 'de' ? 'Weiterlesen' : 'Read more'} &rarr;</span>
        </a>`
    )
    .join('\n');

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': ORIGIN + '/blog#blog',
    name: 'Natal Navigator — Astrocartography Blog',
    url: ORIGIN + '/blog',
    publisher: { '@type': 'Organization', name: 'Natal Navigator', url: ORIGIN },
    blogPost: ordered.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.h1,
      url: abs('/' + p.slug),
      datePublished: p.datePublished,
      inLanguage: p.lang,
    })),
  };

  return `<!doctype html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Astrocartography Blog — Where to Live, Love &amp; Thrive | Natal Navigator</title>
  <meta name="description" content="Honest, practical guides to astrocartography and relocation astrology: where to live, where to find love, starting over, and reading your planetary lines." />
  <meta name="author" content="Natal Navigator" />
  <link rel="canonical" href="${ORIGIN}/blog" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <meta name="theme-color" content="#FBF8F1" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Natal Navigator" />
  <meta property="og:title" content="Astrocartography Blog — Natal Navigator" />
  <meta property="og:description" content="Honest, practical guides to astrocartography and relocation astrology." />
  <meta property="og:url" content="${ORIGIN}/blog" />
  <meta property="og:image" content="${ORIGIN}/og-image.png" />
  <meta property="og:locale" content="en_US" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Astrocartography Blog — Natal Navigator" />
  <meta name="twitter:image" content="${ORIGIN}/og-image.png" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <script type="application/ld+json">
${JSON.stringify(itemListSchema, null, 2)}
  </script>
  <link rel="stylesheet" href="/fonts/fonts.css" />
  <style>
${BLOG_CSS}
  </style>
</head>
<body>
  <header class="nav-wrap">
    <nav class="nav" aria-label="Main">
      <a href="/" class="logo"><span class="logo-mark">N</span><span>Natal Navigator</span></a>
      <div class="nav-links">
        <a href="/astrocartography">What is Astrocartography?</a>
        <a href="/blog">Blog</a>
        <a href="/landing">About</a>
      </div>
      <a href="/" class="nav-cta">Open the Globe →</a>
    </nav>
  </header>

  <main>
    <section class="hero">
      <div class="hero-aurora" aria-hidden="true"></div>
      <div class="hero-inner wrap">
        <p class="breadcrumb"><a href="/">Home</a> &rsaquo; Blog</p>
        <div style="margin-bottom: 4px;"><span class="badge"><span class="badge-dot"></span>ASTROCARTOGRAPHY GUIDES</span></div>
        <h1>Astrocartography Blog</h1>
        <p class="lead">Where to live, where to find love, where to start over — practical, honest guides to reading your planetary lines and choosing places with a little more self-knowledge.</p>
      </div>
    </section>

    <div class="wrap">
      <div class="blog-grid">
${items}
      </div>
    </div>
  </main>

  <footer class="site">
    <p>
      <a href="/">Globe</a> ·
      <a href="/astrocartography">Astrocartography</a> ·
      <a href="/astrocartography-calculator">Calculator</a> ·
      <a href="/astrokartographie">Deutsch</a> ·
      <a href="/blog">Blog</a>
    </p>
    <p class="small">© 2026 Natal Navigator — An interactive astrocartography globe</p>
  </footer>
</body>
</html>
`;
}

let count = 0;
for (const page of PAGES) {
  // Prebuilt pages ship their own hand-authored index.html (e.g. the
  // landing-styled astrocartography blog posts). We still want them listed in
  // the /blog hub and the sitemap (so they stay in PAGES), but must NOT
  // overwrite their HTML with the generic dark template here.
  if (page.prebuilt) continue;
  const outDir = join(PUBLIC, page.slug);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'index.html'), renderPage(page), 'utf8');
  count++;
}

const blogPosts = PAGES.filter((p) => p.slug.startsWith('blog/'));
if (blogPosts.length) {
  await mkdir(join(PUBLIC, 'blog'), { recursive: true });
  await writeFile(join(PUBLIC, 'blog', 'index.html'), renderBlogIndex(blogPosts), 'utf8');
  console.log(`build-pages: wrote ${count} static page(s) + /blog index (${blogPosts.length} posts).`);
} else {
  console.log(`build-pages: wrote ${count} static page(s).`);
}
