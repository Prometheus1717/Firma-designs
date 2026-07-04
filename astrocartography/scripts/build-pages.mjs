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

// ── Paper "landing" design (matches the blog posts) ───────────────────────
const PAPER_CSS = `
    :root {
      --paper:#FBF8F1; --paper2:#F4EFE3; --card:#FFFFFF;
      --ink:#181C23; --ink2:#4C5563; --ink3:#8A93A2;
      --line:#E7E0D1; --line2:#DDD5C2;
      --mint:#0E7C5B; --mint-soft:#DCF2E5; --mint-bright:#19C68B;
      --amber:#A8650F; --amber-soft:#FAEBD2;
      --lav:#5D4FB8; --lav-soft:#E9E5F9;
      --rose:#B2543F; --rose-soft:#F9E3E0;
      --r:18px; --r-lg:26px;
      --serif:'Instrument Serif', Georgia, 'Times New Roman', serif;
      --sans:'General Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --mono:'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
    }
    *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: var(--paper); color: var(--ink); font-family: var(--sans); font-size: 16px; line-height: 1.7; -webkit-font-smoothing: antialiased; }
    a { color: var(--ink); text-decoration: underline; text-decoration-color: var(--line2); text-underline-offset: 4px; text-decoration-thickness: 1px; transition: text-decoration-color .2s ease; }
    a:hover { text-decoration-color: var(--mint); }
    img, svg { display: block; max-width: 100%; height: auto; }
    .nav-wrap { position: sticky; top: 0; z-index: 50; padding: 16px clamp(12px,3vw,28px) 6px; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
    .nav { max-width: 1120px; margin: 0 auto; height: 60px; padding: 0 10px 0 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px; background: rgba(255,255,255,.6); border: 1px solid rgba(255,255,255,.7); border-radius: 999px; box-shadow: 0 10px 34px -18px rgba(40,44,90,.32), inset 0 1px 0 rgba(255,255,255,.8); }
    .logo { display: flex; align-items: center; gap: 9px; font-weight: 600; font-size: 15.5px; color: var(--ink); text-decoration: none; }
    .logo-mark { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 9px; background: var(--ink); color: #fff; flex-shrink: 0; font-family: var(--serif); font-size: 16px; font-style: italic; }
    .nav-links { display: flex; gap: clamp(12px,2vw,26px); font-size: 14.5px; font-weight: 500; color: var(--ink2); }
    .nav-links a { text-decoration: none; transition: color .2s; }
    .nav-links a:hover { color: var(--ink); }
    .nav-cta { display: inline-flex; align-items: center; gap: 9px; padding: 10px 18px; border-radius: 999px; background: var(--ink); color: var(--paper) !important; font-weight: 600; font-size: 14px; text-decoration: none !important; transition: transform .22s, box-shadow .22s; }
    .nav-cta:hover { transform: translateY(-1px); box-shadow: 0 14px 30px -10px rgba(24,28,35,.45); }
    .wrap { max-width: 760px; margin: 0 auto; padding: 0 clamp(20px,4vw,40px); }
    .hero { padding: clamp(50px,8vh,90px) 0 clamp(30px,5vh,50px); position: relative; overflow: hidden; }
    .hero-aurora { position: absolute; inset: 0; pointer-events: none; z-index: 0; background: radial-gradient(680px 380px at 15% 4%, rgba(93,79,184,.18), transparent 64%), radial-gradient(760px 440px at 86% 0%, rgba(25,198,139,.16), transparent 64%); mask-image: linear-gradient(180deg,#000 0%,#000 55%,transparent 88%); -webkit-mask-image: linear-gradient(180deg,#000 0%,#000 55%,transparent 88%); }
    .hero-inner { position: relative; z-index: 1; text-align: center; }
    .breadcrumb { font-size: 13px; color: var(--ink3); margin-bottom: 18px; }
    .breadcrumb a { color: var(--ink3); text-decoration: none; }
    .breadcrumb a:hover { color: var(--ink); }
    .badge { display: inline-flex; align-items: center; gap: 9px; padding: 8px 18px; background: rgba(255,255,255,.5); border: 1px solid rgba(255,255,255,.7); border-radius: 999px; backdrop-filter: blur(14px) saturate(150%); -webkit-backdrop-filter: blur(14px) saturate(150%); box-shadow: 0 6px 20px -12px rgba(40,44,90,.4), inset 0 1px 0 rgba(255,255,255,.8); font-family: var(--mono); font-size: 11.5px; letter-spacing: .04em; color: var(--ink2); margin-bottom: 24px; }
    .badge-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--mint-bright); box-shadow: 0 0 0 4px rgba(25,198,139,.22); flex-shrink: 0; }
    h1 { font-family: var(--serif); font-weight: 400; font-size: clamp(34px,4.6vw,58px); line-height: 1.13; letter-spacing: -.015em; color: var(--ink); max-width: 24ch; margin: 0 auto 18px; }
    h1 em { font-style: italic; color: var(--ink2); }
    .lead { font-size: clamp(17px,2vw,20px); line-height: 1.55; color: var(--ink2); max-width: 54ch; margin: 0 auto 28px; }
    .cta-row { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 9px; padding: 14px 26px; border-radius: 999px; font-weight: 600; font-size: 15.5px; letter-spacing: -.005em; transition: transform .22s, box-shadow .22s; text-decoration: none !important; cursor: pointer; }
    .btn:hover { transform: translateY(-2px); }
    .btn-ink { background: var(--ink); color: var(--paper); box-shadow: 0 1px 2px rgba(24,28,35,.2); }
    .btn-ink:hover { box-shadow: 0 14px 30px -10px rgba(24,28,35,.45); }
    .btn-ghost { background: transparent; color: var(--ink); border: 1px solid var(--line2); }
    .btn-ghost:hover { background: #fff; box-shadow: 0 10px 24px -12px rgba(24,28,35,.2); }
    .meta { font-family: var(--mono); font-size: 11.5px; letter-spacing: .08em; color: var(--ink3); text-transform: uppercase; text-align: center; margin: 40px 0 8px; }
    article { padding: 12px 0 80px; }
    article h2 { font-family: var(--serif); font-weight: 400; font-size: clamp(26px,3.2vw,36px); line-height: 1.2; letter-spacing: -.01em; color: var(--ink); margin: 52px 0 6px; max-width: 30ch; }
    article h3 { font-size: 19px; font-weight: 600; color: var(--ink); margin: 30px 0 6px; }
    article p { color: var(--ink); font-size: 17px; margin: 14px 0; }
    article ul, article ol { padding-left: 22px; margin: 16px 0; }
    article li { color: var(--ink); font-size: 16.5px; margin: 8px 0; }
    article strong { font-weight: 600; color: var(--ink); }
    article em { font-style: italic; color: var(--ink2); }
    .answer-card { background: linear-gradient(140deg, var(--mint-soft) 0%, #EFF7F1 100%); border: 1px solid var(--mint-soft); border-radius: var(--r-lg); padding: 28px 32px; margin: 32px 0; box-shadow: 0 14px 34px -22px rgba(14,124,91,.4); }
    .answer-card .label { font-family: var(--mono); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--mint); margin-bottom: 10px; }
    .answer-card .label::before { content: '✦ '; }
    .answer-card p { margin: 0; font-size: 17px; color: #06241A; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14.5px; background: var(--card); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
    th, td { text-align: left; padding: 11px 14px; border-bottom: 1px solid var(--line); }
    th { font-family: var(--mono); font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--ink2); background: var(--paper2); }
    figure { margin: 44px 0; }
    figure svg { width: 100%; height: auto; border-radius: var(--r-lg); border: 1px solid var(--line); background: var(--card); box-shadow: 0 24px 50px -28px rgba(40,44,90,.35); }
    figcaption { margin-top: 14px; font-size: 13.5px; color: var(--ink2); line-height: 1.55; text-align: center; max-width: 60ch; margin-left: auto; margin-right: auto; }
    figcaption strong { color: var(--ink); font-weight: 600; }
    .callout { background: var(--ink); color: var(--paper); border-radius: var(--r-lg); padding: 40px clamp(28px,5vw,48px); margin: 56px 0; text-align: center; }
    .callout h3 { font-family: var(--serif); font-weight: 400; font-size: 30px; color: var(--paper); margin: 0 0 12px; }
    .callout p { color: rgba(251,248,241,.78); margin: 0 0 22px; font-size: 17px; }
    .callout .cta { display: inline-flex; align-items: center; gap: 8px; background: var(--mint-bright); color: #06241A !important; padding: 14px 26px; border-radius: 999px; font-weight: 600; font-size: 15.5px; text-decoration: none !important; }
    .note { border: 1px solid var(--line2); background: var(--card); border-radius: 16px; padding: 18px 22px; margin: 28px 0; font-size: 16px; color: var(--ink2); box-shadow: 0 14px 38px -30px rgba(40,44,90,.35); }
    .note strong { color: var(--ink); }
    .related { margin-top: 76px; padding-top: 30px; border-top: 1px solid var(--line); }
    .related h2 { font-family: var(--serif); font-weight: 400; font-size: 28px; margin: 0 0 16px; border: none; padding: 0; }
    .related ul { list-style: none; padding: 0; }
    .related li { margin: 11px 0; font-size: 16px; }
    .lines-cluster { margin-top: 56px; padding-top: 28px; border-top: 1px solid var(--line); }
    .lines-cluster h2 { font-family: var(--serif); font-weight: 400; font-size: 24px; margin: 0 0 14px; border: none; padding: 0; }
    .lines-cluster ul { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px 18px; }
    .lines-cluster li { margin: 3px 0; font-size: 15px; }
    .lines-cluster .cluster-guides { font-size: 14px; color: var(--ink2); margin-top: 16px; }
    footer.site { border-top: 1px solid var(--line); padding: 40px clamp(20px,4vw,40px); text-align: center; font-size: 14px; color: var(--ink3); background: var(--paper2); }
    footer.site a { color: var(--ink2); margin: 0 12px; text-decoration: none; }
    footer.site a:hover { color: var(--ink); }
    @media (max-width: 600px) { .nav-links { display: none; } article h2 { font-size: 24px; margin-top: 44px; } .lines-cluster ul { grid-template-columns: 1fr 1fr; } }
`;

function readMins(page) {
  const text = [page.lead || '', ...(page.sections || []).map((s) => s.html || ''), ...(page.faq || []).map((f) => (f.q || '') + ' ' + (f.a || ''))].join(' ');
  const w = plain(text).split(/\s+/).filter(Boolean).length;
  return Math.max(4, Math.round(w / 200));
}

const LINE_ACCENT = { sun: '#A8650F', sonnen: '#A8650F', moon: '#5D4FB8', mond: '#5D4FB8', mercury: '#0E7C5B', merkur: '#0E7C5B', venus: '#B2543F', mars: '#B2543F', jupiter: '#0E7C5B', saturn: '#4C5563', uranus: '#5D4FB8', neptune: '#5D4FB8', neptun: '#5D4FB8', pluto: '#4C5563', mc: '#0E7C5B', ic: '#5D4FB8', asc: '#A8650F', dsc: '#B2543F' };
function accentFor(page) {
  const seg = (page.slug.split('/')[1] || '').replace(/-line$/, '').replace(/linie$/, '');
  return LINE_ACCENT[seg] || '#0E7C5B';
}

function figAngles(accent, n, isDe) {
  const cap = isDe
    ? `<strong>Abbildung ${n}.</strong> Ein Planet, vier Türen. Jeder Planet kann an jeder der vier Achsen stehen — die Achse entscheidet, <em>in welchem Lebensbereich</em> sein Thema auftaucht.`
    : `<strong>Figure ${n}.</strong> One planet, four doorways. Each planet can sit on any of the four angles at a place — the angle decides <em>which area of life</em> its theme shows up in.`;
  const L = isDe
    ? { mc: 'MC · KARRIERE', mcs: 'Beruf · Ruf · Öffentlichkeit', ic: 'IC · WURZELN', ics: 'Zuhause · Familie · Privates', asc: 'AC · AUFSTEIGEND', ascs: 'Identität · Ausstrahlung', dc: 'DC · ABSTEIGEND', dcs: 'Beziehungen' }
    : { mc: 'MC · MIDHEAVEN', mcs: 'Career · reputation · public life', ic: 'IC · IMUM COELI', ics: 'Home · roots · private life', asc: 'ASC · RISING', ascs: 'Identity · presence', dc: 'DC · SETTING', dcs: 'Relationships' };
  return `<figure>
<svg viewBox="0 0 720 360" role="img" aria-label="The four angles around a location">
  <rect width="720" height="360" fill="#FFFFFF"/>
  <g transform="translate(360,180)">
    <line x1="0" y1="-140" x2="0" y2="140" stroke="#E7E0D1" stroke-width="2"/><line x1="-150" y1="0" x2="150" y2="0" stroke="#E7E0D1" stroke-width="2"/>
    <circle r="20" fill="none" stroke="#DDD5C2" stroke-width="1"/><circle r="9" fill="${accent}"/>
    <g transform="translate(0,-150)"><rect x="-92" y="-34" width="184" height="52" rx="12" fill="#DCF2E5"/><text x="0" y="-14" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="12" fill="#0E7C5B" font-weight="700">${L.mc}</text><text x="0" y="6" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#4C5563">${L.mcs}</text></g>
    <g transform="translate(0,150)"><rect x="-92" y="-18" width="184" height="52" rx="12" fill="#E9E5F9"/><text x="0" y="2" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="12" fill="#5D4FB8" font-weight="700">${L.ic}</text><text x="0" y="22" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#4C5563">${L.ics}</text></g>
    <g transform="translate(-152,0)"><rect x="-92" y="-26" width="150" height="52" rx="12" fill="#FAEBD2"/><text x="-17" y="-6" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="12" fill="#A8650F" font-weight="700">${L.asc}</text><text x="-17" y="14" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#4C5563">${L.ascs}</text></g>
    <g transform="translate(152,0)"><rect x="-58" y="-26" width="150" height="52" rx="12" fill="#F9E3E0"/><text x="17" y="-6" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="12" fill="#B2543F" font-weight="700">${L.dc}</text><text x="17" y="14" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#4C5563">${L.dcs}</text></g>
  </g>
</svg>
<figcaption>${cap}</figcaption>
</figure>`;
}

function figBand(accent, n, isDe) {
  const cap = isDe
    ? `<strong>Abbildung ${n}.</strong> Eine Linie ist ein Band, kein Haarstrich. Am stärksten innerhalb von ~80–160 km, danach nimmt die Wirkung bis ~500 km ab.`
    : `<strong>Figure ${n}.</strong> A line is a band, not a hairline — strongest within ~80–160 km and fading out to roughly ~500 km.`;
  return `<figure>
<svg viewBox="0 0 720 220" role="img" aria-label="A planetary line as a band of influence">
  <rect width="720" height="220" fill="#FFFFFF"/>
  <defs><linearGradient id="bnd${n}" x1="0" x2="1"><stop offset="0" stop-color="${accent}" stop-opacity="0"/><stop offset="0.5" stop-color="${accent}" stop-opacity="0.22"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></linearGradient></defs>
  <rect x="60" y="70" width="600" height="80" fill="url(#bnd${n})"/>
  <line x1="360" y1="40" x2="360" y2="180" stroke="${accent}" stroke-width="3"/>
  <circle cx="360" cy="110" r="6" fill="${accent}"/>
  <text x="360" y="32" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="12" fill="${accent}" font-weight="700">${isDe ? 'AUF DER LINIE' : 'ON THE LINE'}</text>
  <text x="200" y="200" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="11" fill="#8A93A2">~160 km</text>
  <text x="520" y="200" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="11" fill="#8A93A2">~160 km</text>
  <text x="95" y="200" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="11" fill="#C2CDC8">~500 km</text>
  <text x="625" y="200" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="11" fill="#C2CDC8">~500 km</text>
</svg>
<figcaption>${cap}</figcaption>
</figure>`;
}

function figProjection(n, isDe) {
  const cap = isDe
    ? `<strong>Abbildung ${n}.</strong> Astrokartographie projiziert dein Geburtshoroskop auf die Erde — jede Planetenposition wird zu einer Linie über der Weltkarte.`
    : `<strong>Figure ${n}.</strong> Astrocartography projects your birth chart onto the planet — each planet's position becomes a line across the world map.`;
  return `<figure>
<svg viewBox="0 0 720 300" role="img" aria-label="A birth chart projected onto a world map">
  <rect width="720" height="300" fill="#FFFFFF"/>
  <g transform="translate(120,150)">
    <circle r="84" fill="#FBF8F1" stroke="#E7E0D1" stroke-width="2"/><circle r="58" fill="none" stroke="#DDD5C2" stroke-width="1"/>
    <circle cx="0" cy="-71" r="5" fill="#A8650F"/><circle cx="62" cy="-30" r="5" fill="#0E7C5B"/><circle cx="-55" cy="42" r="5" fill="#5D4FB8"/><circle cx="38" cy="60" r="5" fill="#B2543F"/>
    <text x="0" y="112" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="11" fill="#8A93A2">${isDe ? 'GEBURTSHOROSKOP' : 'YOUR BIRTH CHART'}</text>
  </g>
  <g transform="translate(228,150)"><line x1="0" y1="0" x2="44" y2="0" stroke="#19C68B" stroke-width="2.5"/><path d="M44 -6 L56 0 L44 6 Z" fill="#19C68B"/></g>
  <g transform="translate(300,46)">
    <rect width="380" height="208" rx="14" fill="#FBF8F1" stroke="#E7E0D1" stroke-width="2"/>
    <g fill="#E7E0D1"><path d="M40 60 q30 -20 70 -8 q24 8 18 36 q-8 30 -50 30 q-46 -2 -52 -28 q-4 -22 14 -30Z"/><path d="M150 100 q40 -26 92 -10 q34 12 22 52 q-16 40 -78 36 q-52 -6 -54 -42 q-2 -24 16 -36Z"/><path d="M300 56 q34 -10 50 14 q12 26 -16 40 q-34 14 -48 -10 q-10 -30 14 -44Z"/></g>
    <path d="M92 8 q-10 100 6 192" fill="none" stroke="#A8650F" stroke-width="2.5"/><path d="M188 8 q14 100 -4 192" fill="none" stroke="#0E7C5B" stroke-width="2.5"/><path d="M276 8 q-12 100 8 192" fill="none" stroke="#5D4FB8" stroke-width="2.5"/><path d="M340 8 q10 100 -6 192" fill="none" stroke="#B2543F" stroke-width="2.5"/>
    <text x="190" y="200" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="11" fill="#8A93A2">${isDe ? 'DEINE LINIEN AUF DER ERDE' : 'YOUR LINES ON EARTH'}</text>
  </g>
</svg>
<figcaption>${cap}</figcaption>
</figure>`;
}

function figuresFor(page) {
  const isDe = page.lang === 'de';
  if (isEnLine(page.slug) || isDeLine(page.slug)) {
    const accent = accentFor(page);
    return [figAngles(accent, 1, isDe), figBand(accent, 2, isDe)];
  }
  return [figProjection(1, isDe)];
}

function answerCard(page) {
  const isDe = page.lang === 'de';
  const txt = page.definedTerm?.description || plain(page.lead);
  return `      <div class="answer-card">
        <div class="label">${isDe ? 'Kurz erklärt' : 'The short answer'}</div>
        <p>${txt}</p>
      </div>`;
}

function heroButtons(page) {
  const isDe = page.lang === 'de';
    return `        <div class="cta-row">
          <a href="/create" class="btn btn-ink">${isDe ? 'Meine Karte erstellen — 9,99 €' : 'Create my map — €9.99'} &rarr;</a>
          <a href="/demo" class="btn btn-ghost">${isDe ? 'Live-Demo ansehen' : 'Try the live demo'}</a>
        </div>`;
}

function heroBadge(page) {
  const isDe = page.lang === 'de';
  let label = isDe ? 'ASTROKARTOGRAPHIE' : 'ASTROCARTOGRAPHY GUIDE';
  if (isEnLine(page.slug)) label = 'PLANETARY LINE';
  if (isDeLine(page.slug)) label = 'PLANETENLINIE';
  return `${label} &middot; ${readMins(page)} MIN READ`;
}

function metaLine(page) {
  const isDe = page.lang === 'de';
  const d = page.datePublished || page.dateModified || '2026-05-01';
  let fmt = d;
  try { fmt = new Date(d).toLocaleDateString(isDe ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { /* keep raw */ }
  return `${isDe ? 'Veröffentlicht' : 'Published'} ${fmt} &middot; Natal Navigator ${isDe ? 'Redaktion' : 'Editorial'}`;
}

// Build the article sections with figures interleaved after the 1st and 3rd h2.
function sectionsWithFigures(page) {
  const figs = figuresFor(page);
  const secs = page.sections || [];
  let out = '';
  secs.forEach((s, i) => {
    out += `      <h2>${esc(s.h2)}</h2>\n      ${s.html}\n\n`;
    if (i === 0 && figs[0]) out += figs[0] + '\n\n';
    if (i === 2 && figs[1]) out += figs[1] + '\n\n';
  });
  // If the page had fewer than 3 sections, append any remaining figures.
  if (secs.length <= 2 && figs[1]) out += figs[1] + '\n\n';
  if (!secs.length) figs.forEach((f) => { out += f + '\n\n'; });
  return out;
}

function renderPage(page) {
  const { t, crumb, faq, related } = renderBody(page);
  const linesCluster = renderLinesCluster(page);
  const sections = sectionsWithFigures(page);
  const isDe = page.lang === 'de';
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
  <meta name="theme-color" content="#FBF8F1" />

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

  <style>${PAPER_CSS}</style>
</head>
<body>
  <header class="nav-wrap">
    <nav class="nav" aria-label="Primary">
      <a href="/" class="logo"><span class="logo-mark">N</span> Natal Navigator</a>
      <div class="nav-links">
        <a href="/astrocartography">${isDe ? 'Was ist Astrokartographie?' : 'What is Astrocartography?'}</a>
        <a href="/blog">Blog</a>
        <a href="/astrocartography-calculator">${t.calc}</a>
        <a href="/${isDe ? 'astrocartography' : 'astrokartographie'}">${t.other}</a>
      </div>
      <a href="/create" class="nav-cta">${isDe ? 'Karte erstellen' : 'Create your map'} &rarr;</a>
    </nav>
  </header>

  <section class="hero">
    <div class="hero-aurora" aria-hidden="true"></div>
    <div class="hero-inner wrap">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/">${t.crumbHome}</a> &rsaquo; ${crumb}
      </nav>
      <span class="badge"><span class="badge-dot"></span> ${heroBadge(page)}</span>
      <h1>${esc(page.h1)}</h1>
      <p class="lead">${page.lead}</p>
${heroButtons(page)}
    </div>
  </section>

  <main>
    <article class="wrap">
      <p class="meta">${metaLine(page)}</p>
${answerCard(page)}
${page.note ? `\n      <div class="note">${page.note}</div>\n` : ''}

${sections}

      <div class="callout">
        <h3>${isDe ? 'Deine eigene Karte' : 'See it on your own chart'}</h3>
        <p>${
          isDe
            ? 'Probiere die interaktive Demo mit Beispiel-Charts. Deine persönliche 40-Linien-Karte mit deinen eigenen Geburtsdaten gibt es für einmalig 9,99 € — ohne Abo.'
            : 'Explore the interactive demo with example charts. Your personal 40-line map, built from your own birth data, is a one-time €9.99 / $9.99 — no subscription.'
        }</p>
        <p><a href="/create" class="cta">${isDe ? 'Meine Karte erstellen' : 'Create my map'} &rarr;</a>&ensp;<a href="/demo">${isDe ? 'Live-Demo' : 'Live demo'} &rarr;</a></p>
      </div>

${faq}

${related}
${linesCluster}
    </article>
  </main>

  <footer class="site">
    <div>
      <a href="/">${isDe ? 'Globus' : 'Globe'}</a>
      <a href="/astrocartography">Astrocartography</a>
      <a href="/astrocartography-calculator">${t.calc}</a>
      <a href="/astrokartographie">Astrokartographie</a>
      <a href="/blog">Blog</a>
    </div>
    <p class="small">&copy; 2026 Natal Navigator. ${t.footerNote}</p>
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
      <a href="/create" class="nav-cta">Create your map →</a>
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
