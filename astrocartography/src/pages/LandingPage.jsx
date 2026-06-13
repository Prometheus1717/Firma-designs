import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// ════════════════════════════════════════════════════════════════
//  Natal Navigator — landing page
//  "Celestial editorial": warm paper, ink serif headlines, the dark
//  app framed like an artifact. All CSS scoped under .lp- so it
//  can't leak into the app.
// ════════════════════════════════════════════════════════════════

// ─── Inline icons ───
const I = {
  arrow: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8h10m-4-4 4 4-4 4"/></svg>,
  globe: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a14 14 0 0 1 3.6 9A14 14 0 0 1 12 21a14 14 0 0 1-3.6-9A14 14 0 0 1 12 3z"/><path d="M3.5 12h17"/></svg>,
  wheel: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3v5.5M12 15.5V21M3 12h5.5M15.5 12H21"/></svg>,
  play: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5-11-6.5z"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 12.5l5 5 10-11"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.4 6.8 7.1.2-5.6 4.4 2 6.9-5.9-4.1-5.9 4.1 2-6.9L2.5 9.5l7.1-.2L12 2.5z"/></svg>,
  open: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6.5 3.5H3v9.5h9.5V9.5M9.5 2.5H13.5V6.5M13 3 7.5 8.5"/></svg>,
  moon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>,
  sun: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg>,
};

// ─── Content data ───
// Hero word-cycler options: [word, colour tone]
const CYCLE_WORDS = [
  ['thrive', 'mint'],
  ['fall in love', 'rose'],
  ['feel at home', 'amber'],
  ['grow', 'lav'],
];

const STARS = [
  ['musk', 'Elon Musk'],
  ['einstein', 'Albert Einstein'],
  ['monroe', 'Marilyn Monroe'],
  ['jobs', 'Steve Jobs'],
  ['kahlo', 'Frida Kahlo'],
];

const STATS = [
  ['40', 'planetary lines'],
  ['10', 'planets, Sun to Pluto'],
  ['4', 'angles · MC IC ASC DSC'],
  ['345+', 'cities rated for you'],
];

// Features, in order of importance — each explained properly.
const FEATURES = [
  {
    num: '01',
    title: <>The interactive 3D astrocartography globe</>,
    lead: 'The heart of Natal Navigator. Your whole natal chart, projected onto a globe you can spin — not a static map image.',
    points: [
      'All 40 planetary lines: MC, IC, ASC and DSC for every planet from Sun to Pluto',
      'Drag, rotate and zoom in real time — toggle each planet on and off',
      'Your birth place and every city on your lines, marked and clickable',
    ],
    media: { type: 'img', src: '/landing/app-globe.webp', alt: '3D astrocartography globe with 40 planetary lines, planet toggles and rated cities' },
  },
  {
    num: '02',
    title: <>345+ cities, rated <em>thrive / neutral / caution</em></>,
    lead: 'The question behind every astrocartography map is “so where should I go?” — Natal Navigator answers it city by city.',
    points: [
      'Every city scored against your lines, with the exact line and orb behind the rating',
      'Sorted lists: your strongest thrive zones and your caution zones, worldwide',
      'Filter by continent, search any city, compare candidates side by side',
    ],
    media: { type: 'ratings' },
  },
  {
    num: '03',
    title: <>A written reading for every city</>,
    lead: 'Lines and percentages are data. The readings turn them into something you can actually decide with.',
    points: [
      'Personal interpretations for career, home, love and growth — per city',
      'Available in English and German',
      'Export your complete chart and readings as a PDF',
    ],
    media: { type: 'reading' },
  },
  {
    num: '04',
    title: <>Your full natal chart, computed properly</>,
    lead: 'Underneath the map sits a real birth chart — calculated from planetary ephemeris, not lookup tables.',
    points: [
      'Natal wheel plus a full chart table: signs, degrees, elements, retrogrades',
      'Powered by the astronomy-engine library — sub-arcsecond precision',
      'The same chart professional astrology software would draw',
    ],
    media: { type: 'img', src: '/landing/app-natal.webp', alt: 'Natal chart panel with planet positions, zodiac signs, degrees and life domains' },
  },
  {
    num: '05',
    title: <>Globe or flat map. Dark or light. Any device.</>,
    lead: 'Astrocartography the way you prefer to read it.',
    points: [
      'Classic 2D world-map view for an at-a-glance look at every line crossing',
      'Dark and light themes — switch any time',
      'Fully responsive: phone, tablet and desktop',
    ],
    media: { type: 'img', src: '/landing/app-map-light.webp', alt: '2D astrocartography world map in light mode with planetary lines and rated cities' },
  },
];

const STEPS = [
  ['01', 'Enter your birth details', 'Date, exact time and city of birth — that is everything astrocartography needs. No credit card, no quiz, no waiting.'],
  ['02', 'We compute your chart', 'Real ephemeris calculations with the astronomy-engine library map all 40 planetary lines in seconds — to sub-arcsecond precision, the same math professional software uses.'],
  ['03', 'Explore your world', 'Spin the 3D globe, switch to the flat map, open your natal wheel and read why each of 345+ cities helps you thrive — or tests you.'],
];

const USE_CASES = [
  ['Nomads & expats', 'Choosing your next base abroad?', 'Compare the cities on your shortlist against your Venus, Jupiter and Sun lines before you sign a lease. Relocation astrology was made for exactly this decision.'],
  ['Career moves', 'Job offer in another city?', 'Sun MC and Jupiter MC lines mark the places where your work gets seen and opportunities compound. Check where a move supports your ambition — and where Saturn will test it.'],
  ['Love & connection', 'Wondering where you keep meeting the right people?', 'Venus and DSC lines describe your relationship geography — the places where attraction, friendship and partnership come easier.'],
  ['Finding home', 'Searching for the place that finally feels like home?', 'Moon and IC lines point to where you put down roots, rest deeply and build family life. Often it is not where you were born.'],
  ['Meaningful travel', 'Planning a sabbatical, retreat or big trip?', 'Travel along your lines on purpose: a creative residency on your Venus line, a reset on your Moon line, a bold launch on your Sun MC.'],
  ['Astro-curious & pros', 'Already reading charts?', 'Check any relocation chart in seconds on a proper 3D globe — with the math handled by a real ephemeris engine, not approximations.'],
];

const WHY = [
  'Interactive live demo with example charts before you create your personal map',
  'A real 3D globe, not a static map image',
  '345+ cities rated and explained in writing — not just lines on a map',
  'Sub-arcsecond ephemeris precision (astronomy-engine)',
  '€4.99 once. Not another subscription',
  'English & German, PDF export, works on every device',
  'Your birth data stays private — never sold, deletable any time',
];

const ANGLES = [
  ['MC', 'Midheaven', 'Career, visibility, public role. On an MC line the planet shapes how the world sees your work.'],
  ['IC', 'Imum Coeli', 'Home, roots, family. IC lines colour where you rest, retreat and build a private life.'],
  ['ASC', 'Ascendant', 'Identity and first impressions. ASC lines change how you show up — and how people read you.'],
  ['DSC', 'Descendant', 'Partnership and attraction. DSC lines describe who you meet and what relationships ask of you.'],
];

const PLANET_LINES = [
  ['Sun line', 'Vitality and recognition. Places where you feel seen, central and unmistakably yourself.'],
  ['Moon line', 'Emotion and belonging. Where life turns inward — comfort, intuition and a sense of home.'],
  ['Venus line', 'Love, beauty and ease. Classic territory for romance, friendship, art and pleasure.'],
  ['Jupiter line', 'Luck and expansion. Opportunities, mentors and growth tend to arrive faster here.'],
  ['Saturn line', 'Discipline and tests. Demanding ground — slow, structural progress for those who stay.'],
];

const FAQS = [
  ['What is astrocartography?', 'Astrocartography — also called locational or relocation astrology — projects your natal chart onto the world map. For each planet it draws four lines (MC, IC, ASC, DSC) showing where that planet was angular at your birth. Living on or near a line is read as experiencing that planet’s themes more strongly in that place.'],
  ['What does Natal Navigator cost?', 'You can explore the interactive demo with example charts first. Your personal astrocartography map — all 40 planetary lines, 345+ rated cities, natal wheel and PDF export — is a one-time payment of €4.99. No subscription, lifetime access.'],
  ['Who is astrocartography for?', 'Anyone weighing a place against a feeling: digital nomads and expats choosing a base, professionals considering a relocation for work, people searching for where home or love comes easier, and travellers who want their trips to mean something. You don’t need any astrology knowledge — the readings explain everything.'],
  ['Whose charts can I explore in the demo?', 'The interactive demo lets you switch between the astrocartography maps of Elon Musk, Albert Einstein, Marilyn Monroe, Steve Jobs and Frida Kahlo — all based on publicly documented birth data. It’s the full app, just with a famous chart instead of yours.'],
  ['How accurate are the calculations?', 'Natal Navigator uses the astronomy-engine ephemeris library to compute real planetary positions to sub-arcsecond precision — no lookup tables or approximations. Line positions match professional astrology software.'],
  ['Do I need my exact birth time?', 'Yes — for a meaningful map. The angles (MC, IC, ASC, DSC) move roughly one degree every four minutes, so even 15 minutes can shift your lines by hundreds of kilometres. Check your birth certificate if you are unsure.'],
  ['Can astrocartography tell me where to live?', 'It is a reflection tool, not a verdict. Your map highlights places whose planetary themes support career (MC), home (IC), identity (ASC) or relationships (DSC). Natal Navigator rates 345+ cities as thrive, neutral or caution zones so you can compare options — the decision stays yours.'],
  ['What is the difference between a natal chart and an astrocartography map?', 'Your natal chart is a snapshot of the sky at your birth — it describes you. An astrocartography map takes that same chart and asks where on Earth each planet would rise, set or culminate — it describes you somewhere. Natal Navigator shows both, side by side.'],
  ['What is a Venus line?', 'A Venus line marks the places where Venus was rising, setting, culminating or anti-culminating at your birth. Venus lines are traditionally read as the easiest, most pleasant geography in a chart — favourable for love, friendship, beauty and money.'],
  ['Is my birth data private?', 'Yes. Your birth data is stored securely, never sold and never shared. You can delete your account — and all data with it — at any time.'],
];

const PREMIUM_FEATURES = [
  'Your personal 3D globe & flat map',
  'All 40 planetary lines — Sun to Pluto',
  '345+ cities rated thrive / neutral / caution',
  'Personal readings for every city',
  'Full natal wheel & chart table',
  'PDF export of your complete chart',
  'Lifetime access — pay once, keep forever',
];

// FAQPage JSON-LD lives statically in index.html (same questions/answers),
// where crawlers that don't execute JS can still read it.
const FONT_LINKS = [
  ['lp-font-gf', 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap'],
  ['lp-font-fs', 'https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&display=swap'],
];

// ─── Small building blocks ───
function Label({ children, center }) {
  return <div className="lp-label" style={center ? { justifyContent: 'center' } : undefined}><span aria-hidden="true">✦</span>{children}</div>;
}

function RatingRow({ city, line, pct, tone }) {
  return (
    <div className="lp-rate-row">
      <span className="lp-rate-city">{city}</span>
      <span className="lp-rate-line">{line}</span>
      <span className="lp-rate-bar"><span style={{ width: `${pct}%` }} className={`lp-rate-fill lp-rate-${tone}`} /></span>
      <span className={`lp-rate-pct lp-rate-txt-${tone}`}>{pct}%</span>
    </div>
  );
}

function RatingsMock() {
  return (
    <div className="lp-rate-box" aria-hidden="true">
      <div className="lp-rate-tabs">
        <span className="lp-rate-tab lp-on">▲ Thrive 127</span>
        <span className="lp-rate-tab">Neutral 79</span>
        <span className="lp-rate-tab">▼ Caution 139</span>
      </div>
      <RatingRow city="Hanoi" line="Sun MC" pct={97} tone="mint" />
      <RatingRow city="Lisbon" line="Venus MC" pct={96} tone="mint" />
      <RatingRow city="New York" line="Sun IC" pct={94} tone="mint" />
      <RatingRow city="Bogotá" line="Sun IC" pct={94} tone="mint" />
      <RatingRow city="Phoenix" line="Saturn ASC" pct={38} tone="amber" />
      <RatingRow city="Stockholm" line="Saturn MC" pct={31} tone="amber" />
    </div>
  );
}

function ReadingMock() {
  return (
    <blockquote className="lp-reading">
      <p>“Lisbon lies on your <strong>Venus MC</strong> line — one of the most graceful places for your public life. Work feels social, doors open through people who simply like you, and what you make here tends to be beautiful…”</p>
      <footer>— sample city reading</footer>
      <div className="lp-tag-row">
        <span className="lp-tag">Career & Public Life</span>
        <span className="lp-tag">Home & Roots</span>
        <span className="lp-tag">Love & Connection</span>
        <span className="lp-tag">PDF export</span>
        <span className="lp-tag">EN · DE</span>
      </div>
    </blockquote>
  );
}

function FeatureMedia({ media }) {
  if (media.type === 'img') {
    return <div className="lp-shot"><img src={media.src} alt={media.alt} loading="lazy" width="2000" height="1214" /></div>;
  }
  if (media.type === 'ratings') return <RatingsMock />;
  return <ReadingMock />;
}

export default function LandingPage() {
  const rootRef = useRef(null);
  const navRef = useRef(null);
  const [demoOn, setDemoOn] = useState(false);
  const [star, setStar] = useState('musk');
  const [demoTheme, setDemoTheme] = useState('dark');

  // Hero word-cycler: advance the word, and morph the slot width to the active
  // word so "See where you ___" reads as one naturally-spaced, centred phrase.
  const [wi, setWi] = useState(0);
  const [cycleW, setCycleW] = useState(null);
  const wordRefs = useRef([]);
  const wiRef = useRef(0);
  useEffect(() => { wiRef.current = wi; }, [wi]);
  useEffect(() => {
    const id = setInterval(() => setWi(i => (i + 1) % CYCLE_WORDS.length), 2600);
    return () => clearInterval(id);
  }, []);
  // Measure the active word before paint on each change…
  useLayoutEffect(() => {
    const el = wordRefs.current[wi];
    if (el) setCycleW(el.offsetWidth);
  }, [wi]);
  // …and re-measure whenever a word's rendered width changes (web-font swap,
  // resize), so the slot can never end up too narrow for the word.
  useEffect(() => {
    if (!window.ResizeObserver) return;
    const ro = new ResizeObserver(() => {
      const el = wordRefs.current[wiRef.current];
      if (el) setCycleW(el.offsetWidth);
    });
    wordRefs.current.forEach(el => el && ro.observe(el));
    return () => ro.disconnect();
  }, []);

  // Title + meta description for the homepage
  useEffect(() => {
    const prevTitle = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute('content');
    document.title = 'Astrocartography Map & Calculator — Natal Navigator';
    meta?.setAttribute('content', 'Turn your birth chart into a living map. Interactive astrocartography calculator with a 3D globe, 40 planetary lines and 345+ cities rated for career, love and home.');
    return () => {
      document.title = prevTitle;
      if (prevDesc) meta?.setAttribute('content', prevDesc);
    };
  }, []);

  // Display fonts, loaded only when the landing page mounts
  useEffect(() => {
    FONT_LINKS.forEach(([id, href]) => {
      if (document.getElementById(id)) return;
      const l = document.createElement('link');
      l.id = id; l.rel = 'stylesheet'; l.href = href;
      document.head.appendChild(l);
    });
  }, []);

  // Auto-load the embedded live app shortly after first paint, so the hero
  // shows the real, clickable demo (poster first for a fast LCP, then swap).
  useEffect(() => {
    const t = setTimeout(() => setDemoOn(true), 650);
    return () => clearTimeout(t);
  }, []);

  // Scroll-triggered reveals + nav shadow
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('lp-in'); io.unobserve(e.target); } });
    }, { root, rootMargin: '0px 0px -8% 0px' });
    root.querySelectorAll('.lp-reveal').forEach(el => io.observe(el));
    const onScroll = () => navRef.current?.classList.toggle('lp-scrolled', root.scrollTop > 24);
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => { io.disconnect(); root.removeEventListener('scroll', onScroll); };
  }, []);

  const goAuth = () => {
    window.location.href = 'https://natalnavigator.com/auth';
  };
  // Query the scroll container at click time (not via ref) so the handler
  // factory can safely run during render — see react-hooks/refs.
  const scrollTo = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    const root = document.querySelector('.lp-root');
    if (el && root) root.scrollTo({ top: el.offsetTop - 84, behavior: 'smooth' });
  };

  const pickStar = (key) => { setStar(key); setDemoOn(true); };
  const pickTheme = (t) => { setDemoTheme(t); setDemoOn(true); };
  const demoSrc = `/demo?embed=1&tutorial=0&star=${star}&theme=${demoTheme}`;
  const starName = STARS.find(([k]) => k === star)?.[1] || 'Elon Musk';

  return (
    <div className="lp-root" ref={rootRef}>
      <style>{CSS}</style>

      {/* ═══ NAV ═══ */}
      <header className="lp-nav-wrap">
        <nav className="lp-nav" ref={navRef} aria-label="Main">
          <a href="/" className="lp-logo" onClick={(e) => { e.preventDefault(); document.querySelector('.lp-root')?.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <span className="lp-logo-mark">{I.globe}</span>
            Natal&nbsp;Navigator
          </a>
          <div className="lp-nav-links">
            <a href="#demo" onClick={scrollTo('demo')}>Live demo</a>
            <a href="#features" onClick={scrollTo('features')}>Features</a>
            <a href="#for-you" onClick={scrollTo('for-you')}>Who it’s for</a>
            <a href="#lines" onClick={scrollTo('lines')}>Line meanings</a>
            <a href="#pricing" onClick={scrollTo('pricing')}>Pricing</a>
            <a href="#faq" onClick={scrollTo('faq')}>FAQ</a>
          </div>
          <button className="lp-btn lp-btn-ink lp-btn-sm" onClick={goAuth}>Create your map <span className="lp-btn-ic">{I.arrow}</span></button>
        </nav>
      </header>

      {/* ═══ HERO + LIVE DEMO STAGE (cosmic glass) ═══ */}
      <section className="lp-stage" id="demo">
        <div className="lp-stage-sky" aria-hidden="true" />
        <div className="lp-stage-aurora" aria-hidden="true" />
        <div className="lp-stage-stars" aria-hidden="true" />
        <i className="lp-shoot lp-shoot-1" aria-hidden="true" />
        <i className="lp-shoot lp-shoot-2" aria-hidden="true" />

        {/* hero copy — short, so the live app is visible above the fold */}
        <div className="lp-wrap lp-stage-copy">
          <div className="lp-badge lp-h-an" style={{ '--d': '0ms' }}>
            <span className="lp-badge-dot" /> Find your best places with astrocartography
          </div>
          <h1 className="lp-h1 lp-h-an" style={{ '--d': '90ms' }}>
            <span className="lp-sr">Your birth chart is secretly a map — see where you thrive, fall in love, feel at home and grow.</span>
            <span aria-hidden="true">
              <span className="lp-h1-row">
                Your{' '}
                <span className="lp-chip lp-chip-lav lp-float"><span className="lp-chip-ic">{I.wheel}</span><em>birth chart</em></span>{' '}
                is secretly a{' '}
                <span className="lp-orbit">map<i className="lp-orbit-sys"><i className="lp-orbit-ring" /><i className="lp-orbit-spin"><i className="lp-orbit-dot" /></i></i></span>
              </span>
              <span className="lp-h1-row lp-h1-it">
                <em>See where you</em>{' '}
                <span className="lp-cycle" style={cycleW != null ? { width: cycleW } : undefined}>
                  {CYCLE_WORDS.map(([word, tone], i) => (
                    <span
                      key={word}
                      ref={el => { wordRefs.current[i] = el; }}
                      className={`lp-cw lp-cw-${tone}${i === wi ? ' lp-cw-on' : ''}`}
                    >{word}</span>
                  ))}
                </span>
              </span>
            </span>
          </h1>
          <div className="lp-hero-cta lp-h-an" style={{ '--d': '200ms' }}>
            <a className="lp-btn lp-btn-glass" href={demoSrc.replace('embed=1&', '')} target="_blank" rel="noopener">Reveal my best places <span className="lp-btn-ic">{I.arrow}</span></a>
          </div>
          <div className="lp-stage-hint lp-h-an" style={{ '--d': '290ms' }}>the real app, live below <span className="lp-hint-arrow">↓</span></div>
        </div>

        {/* pinned live demo with flanking glass control rails */}
        <div className="lp-stage-pin">
          <div className="lp-demo-stage lp-h-an" style={{ '--d': '360ms' }}>

            {/* LEFT rail — switch chart */}
            <aside className="lp-rail lp-rail-l" role="group" aria-label="Choose a demo chart">
              <span className="lp-rail-label">Demo chart</span>
              {STARS.map(([key, name]) => (
                <button
                  key={key}
                  className={`lp-star-pill${star === key ? ' lp-on' : ''}`}
                  onClick={() => pickStar(key)}
                  aria-pressed={star === key}
                >{star === key && <span className="lp-star-ic">{I.star}</span>}{name}</button>
              ))}
            </aside>

            {/* glass-framed live app */}
            <figure className="lp-glass">
              <div className="lp-frame">
                <div className="lp-frame-bar">
                  <span className="lp-frame-dots" aria-hidden="true"><i /><i /><i /></span>
                  <span className="lp-frame-url">natalnavigator.com · live demo — {starName}’s chart</span>
                  <a className="lp-frame-open" href={demoSrc.replace('embed=1&', '')} target="_blank" rel="noopener">Fullscreen {I.open}</a>
                </div>
                <div className="lp-frame-body">
                  {demoOn ? (
                    <iframe
                      key={demoSrc}
                      src={demoSrc}
                      title={`Natal Navigator — interactive astrocartography map demo (${starName})`}
                      allow="fullscreen"
                    />
                  ) : (
                    <button className="lp-poster" onClick={() => setDemoOn(true)} aria-label="Start the interactive astrocartography demo">
                      <img src="/landing/app-globe.webp" alt="Interactive astrocartography map — 3D globe with 40 planetary lines and rated cities in the Natal Navigator app" width="2000" height="1214" fetchPriority="high" />
                      <span className="lp-poster-cta"><span className="lp-poster-play">{I.play}</span> Play with the live demo</span>
                    </button>
                  )}
                </div>
              </div>
            </figure>

            {/* RIGHT rail — theme + hint */}
            <aside className="lp-rail lp-rail-r" role="group" aria-label="Demo theme">
              <span className="lp-rail-label">Theme</span>
              <div className="lp-mode lp-mode-col">
                <button className={demoTheme === 'dark' ? 'lp-on' : ''} onClick={() => pickTheme('dark')} aria-pressed={demoTheme === 'dark'}>{I.moon} Dark</button>
                <button className={demoTheme === 'light' ? 'lp-on' : ''} onClick={() => pickTheme('light')} aria-pressed={demoTheme === 'light'}>{I.sun} Light</button>
              </div>
              <p className="lp-rail-note">The real app — drag the globe, toggle planets, click any city.</p>
              <button className="lp-btn lp-btn-mint lp-rail-cta" onClick={goAuth}>Create my map <span className="lp-btn-ic">{I.arrow}</span></button>
            </aside>
          </div>
        </div>

        <div className="lp-stage-spacer" aria-hidden="true" />
      </section>

      {/* ═══ STATS ═══ */}
      <section className="lp-stats" aria-label="Key numbers">
        <div className="lp-wrap lp-stats-grid">
          {STATS.map(([n, l], i) => (
            <div className="lp-stat lp-reveal" style={{ '--d': `${i * 70}ms` }} key={l}>
              <span className="lp-stat-n">{n}</span>
              <span className="lp-stat-l">{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES — by importance ═══ */}
      <section className="lp-section" id="features">
        <div className="lp-wrap">
          <div className="lp-sec-head lp-reveal">
            <Label center>Features — what matters most, first</Label>
            <h2 className="lp-h2">Everything an astrocartography reading needs.<br /><em>In the order it matters.</em></h2>
          </div>
          <div className="lp-feats">
            {FEATURES.map((f, i) => (
              <article className={`lp-feat lp-reveal${i % 2 ? ' lp-feat-rev' : ''}`} key={f.num}>
                <div className="lp-feat-text">
                  <span className="lp-feat-num">{f.num}</span>
                  <h3>{f.title}</h3>
                  <p className="lp-feat-lead">{f.lead}</p>
                  <ul className="lp-feat-points">
                    {f.points.map(p => <li key={p}>{I.check} {p}</li>)}
                  </ul>
                </div>
                <div className="lp-feat-media">
                  <FeatureMedia media={f.media} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="lp-section lp-section-alt" id="how">
        <div className="lp-wrap">
          <div className="lp-sec-head lp-reveal">
            <Label center>How it works</Label>
            <h2 className="lp-h2">Your map in <em>three steps</em></h2>
          </div>
          <div className="lp-steps">
            {STEPS.map(([n, t, d], i) => (
              <div className="lp-step lp-reveal" style={{ '--d': `${i * 90}ms` }} key={n}>
                <span className="lp-step-n">{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHO IT'S FOR ═══ */}
      <section className="lp-section" id="for-you">
        <div className="lp-wrap">
          <div className="lp-sec-head lp-reveal">
            <Label center>Who it’s for</Label>
            <h2 className="lp-h2">Made for one question:<br /><em>“Where should I live?”</em></h2>
            <p className="lp-sec-sub">Astrocartography is for anyone weighing a place against a feeling. These are the people who get the most out of their map.</p>
          </div>
          <div className="lp-uses">
            {USE_CASES.map(([tag, q, d], i) => (
              <article className="lp-use lp-reveal" style={{ '--d': `${(i % 3) * 80}ms` }} key={tag}>
                <span className="lp-use-tag">{tag}</span>
                <h3>{q}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ LINE MEANINGS ═══ */}
      <section className="lp-section lp-section-alt" id="lines">
        <div className="lp-wrap">
          <div className="lp-sec-head lp-reveal">
            <Label center>Line meanings</Label>
            <h2 className="lp-h2">What your <em>planetary lines</em> mean</h2>
            <p className="lp-sec-sub">Each planet draws four lines around the Earth — one for each angle of your chart. Planet × angle is the whole grammar of astrocartography.</p>
          </div>
          <div className="lp-angles">
            {ANGLES.map(([abbr, name, d], i) => (
              <div className="lp-angle lp-reveal" style={{ '--d': `${i * 70}ms` }} key={abbr}>
                <span className="lp-angle-abbr">{abbr}</span>
                <h3>{name}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
          <dl className="lp-planets lp-reveal">
            {PLANET_LINES.map(([t, d]) => (
              <div className="lp-planet" key={t}>
                <dt>{t}</dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
          <p className="lp-more lp-reveal">
            Want the full theory? Read the <a href="/astrocartography">complete astrocartography guide</a>
            {' '}— also available <a href="/astrokartographie">auf Deutsch</a>.
          </p>
        </div>
      </section>

      {/* ═══ WHY NATAL NAVIGATOR ═══ */}
      <section className="lp-section" id="why">
        <div className="lp-wrap lp-wrap-narrow">
          <div className="lp-why lp-reveal">
            <div className="lp-sec-head" style={{ marginBottom: 28 }}>
              <Label center>Why Natal Navigator</Label>
              <h2 className="lp-h2">There are other astrocartography calculators.<br /><em>Here’s the honest difference.</em></h2>
            </div>
            <ul className="lp-why-list">
              {WHY.map(w => <li key={w}>{I.check} {w}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="lp-section lp-section-alt" id="pricing">
        <div className="lp-wrap">
          <div className="lp-sec-head lp-reveal">
            <Label center>Pricing</Label>
            <h2 className="lp-h2">Pay once. <em>Keep it forever.</em></h2>
            <p className="lp-sec-sub">No subscription, no hidden tiers. Try everything in the demo first.</p>
          </div>
          <div className="lp-pricing">
            <article className="lp-price-card lp-reveal">
              <h3 className="lp-price-tier">Explorer</h3>
              <div className="lp-price-n">Demo</div>
              <p className="lp-price-sub">The full app experience with famous example charts.</p>
              <ul className="lp-price-list">
                <li>{I.check} Interactive demo globe & map</li>
                <li>{I.check} 5 celebrity charts to explore</li>
                <li>{I.check} City ratings & readings preview</li>
              </ul>
              <a className="lp-btn lp-btn-ghost lp-btn-full" href="/demo">Try the live demo</a>
            </article>
            <article className="lp-price-card lp-price-featured lp-reveal" style={{ '--d': '100ms' }}>
              <span className="lp-price-flag">{I.star} Most popular</span>
              <h3 className="lp-price-tier">Navigator</h3>
              <div className="lp-price-n">€4.99 <span>one-time</span></div>
              <p className="lp-price-sub">Your personal astrocartography map, for life.</p>
              <ul className="lp-price-list">
                {PREMIUM_FEATURES.map(f => <li key={f}>{I.check} {f}</li>)}
              </ul>
              <button className="lp-btn lp-btn-mint lp-btn-full" onClick={goAuth}>Get your map — €4.99 <span className="lp-btn-ic">{I.arrow}</span></button>
            </article>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="lp-section" id="faq">
        <div className="lp-wrap lp-wrap-narrow">
          <div className="lp-sec-head lp-reveal">
            <Label center>FAQ</Label>
            <h2 className="lp-h2">Questions, <em>answered</em></h2>
          </div>
          <div className="lp-faq lp-reveal">
            {FAQS.map(([q, a]) => (
              <details className="lp-faq-item" key={q}>
                <summary>{q}<span className="lp-faq-x" aria-hidden="true">+</span></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="lp-section" style={{ paddingTop: 0 }}>
        <div className="lp-wrap">
          <div className="lp-final lp-reveal">
            <div className="lp-final-stars" aria-hidden="true" />
            <h2 className="lp-h2 lp-final-h">Your stars are already aligned.<br /><em>See where.</em></h2>
            <p>Two minutes from birth certificate to world map.</p>
            <div className="lp-hero-cta" style={{ justifyContent: 'center' }}>
              <button className="lp-btn lp-btn-mint" onClick={goAuth}>Create my map <span className="lp-btn-ic">{I.arrow}</span></button>
              <a className="lp-btn lp-btn-night" href="/demo">Try the demo first</a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-grid">
          <div className="lp-footer-brand">
            <a href="/" className="lp-logo"><span className="lp-logo-mark">{I.globe}</span>Natal&nbsp;Navigator</a>
            <p>Astrocartography & relocation astrology on an interactive 3D globe. A reflection tool — the decisions stay yours.</p>
          </div>
          <nav aria-label="Product">
            <h4>Product</h4>
            <a href="/demo">Live demo</a>
            <a href="#pricing" onClick={scrollTo('pricing')}>Pricing</a>
            <a href="/auth">Create account</a>
          </nav>
          <nav aria-label="Learn">
            <h4>Learn</h4>
            <a href="/astrocartography">Astrocartography guide</a>
            <a href="/astrocartography-calculator">Astrocartography calculator</a>
            <a href="/astrokartographie">Astrokartographie (DE)</a>
          </nav>
          <nav aria-label="Contact">
            <h4>Contact</h4>
            <a href="mailto:info@natalnavigator.com">info@natalnavigator.com</a>
          </nav>
          <nav aria-label="Legal">
            <h4>Legal</h4>
            <a href="/impressum">Impressum</a>
            <a href="/datenschutz">Datenschutz</a>
            <a href="/agb">AGB</a>
            <a href="/widerruf">Widerruf</a>
          </nav>
        </div>
        <div className="lp-wrap lp-footer-base">
          <span>© 2026 Natal Navigator. All rights reserved.</span>
          <span>Made with real ephemeris data — astrology is reflection, not prediction.</span>
        </div>
      </footer>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  Styles — scoped under .lp-
// ════════════════════════════════════════════════════════════════
const CSS = `
.lp-root{
  --paper:#FBF8F1; --paper2:#F4EFE3; --card:#FFFFFF;
  --ink:#181C23; --ink2:#4C5563; --ink3:#8A93A2;
  --line:#E7E0D1; --line2:#DDD5C2;
  --mint:#0E7C5B; --mint-soft:#DCF2E5; --mint-bright:#19C68B;
  --amber:#A8650F; --amber-soft:#FAEBD2;
  --lav:#5D4FB8; --lav-soft:#E9E5F9;
  --night:#0B1118; --night2:#101826;
  --r:18px; --r-lg:26px;
  --serif:'Instrument Serif', Georgia, 'Times New Roman', serif;
  --sans:'General Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --mono:'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
  position:fixed; inset:0; z-index:9999; overflow-y:auto; overflow-x:hidden;
  background:var(--paper); color:var(--ink);
  font-family:var(--sans); font-size:16px; line-height:1.6;
  -webkit-font-smoothing:antialiased;
}
.lp-root *,.lp-root *::before,.lp-root *::after{ box-sizing:border-box; margin:0; padding:0; }
.lp-root a{ color:inherit; text-decoration:none; }
.lp-root img{ display:block; max-width:100%; height:auto; }
.lp-root button{ font:inherit; color:inherit; background:none; border:0; cursor:pointer; }
.lp-wrap{ max-width:1180px; margin:0 auto; padding-left:clamp(20px,4vw,40px); padding-right:clamp(20px,4vw,40px); }
.lp-wrap-narrow{ max-width:820px; }
.lp-wrap-wide{ max-width:1640px; margin:0 auto; padding-left:clamp(12px,2vw,28px); padding-right:clamp(12px,2vw,28px); }

/* ── entrance animations ── */
@media (prefers-reduced-motion: no-preference){
  .lp-h-an{ opacity:0; transform:translateY(16px); animation:lpUp .8s cubic-bezier(.2,.65,.25,1) forwards; animation-delay:var(--d,0ms); }
  .lp-reveal{ opacity:0; transform:translateY(18px); transition:opacity .7s cubic-bezier(.2,.65,.25,1) var(--d,0ms), transform .7s cubic-bezier(.2,.65,.25,1) var(--d,0ms); }
  .lp-reveal.lp-in{ opacity:1; transform:none; }
}
@keyframes lpUp{ to{ opacity:1; transform:none; } }

/* ── nav (frosted glass) ── */
.lp-nav-wrap{ position:sticky; top:0; z-index:50; padding:16px clamp(12px,3vw,28px) 6px; }
.lp-nav{
  max-width:1120px; margin:0 auto; height:60px; padding:0 10px 0 22px;
  display:flex; align-items:center; justify-content:space-between; gap:16px;
  background:rgba(255,255,255,.42);
  backdrop-filter:blur(24px) saturate(180%); -webkit-backdrop-filter:blur(24px) saturate(180%);
  border:1px solid rgba(255,255,255,.65); border-radius:999px;
  box-shadow:0 10px 34px -18px rgba(40,44,90,.32), inset 0 1px 0 rgba(255,255,255,.8);
  transition:box-shadow .3s ease, background .3s ease;
}
.lp-nav.lp-scrolled{ background:rgba(255,255,255,.62); box-shadow:0 14px 38px -16px rgba(40,44,90,.4), inset 0 1px 0 rgba(255,255,255,.9); }
.lp-logo{ display:flex; align-items:center; gap:9px; font-weight:600; font-size:15.5px; letter-spacing:-.01em; white-space:nowrap; }
.lp-logo-mark{ display:grid; place-items:center; width:30px; height:30px; border-radius:9px; background:var(--ink); color:#fff; flex-shrink:0; }
.lp-logo-mark svg{ width:17px; height:17px; }
.lp-nav-links{ display:flex; gap:clamp(12px,2vw,26px); font-size:14.5px; font-weight:500; color:var(--ink2); }
.lp-nav-links a{ transition:color .2s; white-space:nowrap; }
.lp-nav-links a:hover{ color:var(--ink); }

/* ── buttons ── */
.lp-btn{
  display:inline-flex; align-items:center; justify-content:center; gap:9px;
  padding:14px 26px; border-radius:999px; font-weight:600; font-size:15.5px;
  letter-spacing:-.005em; white-space:nowrap;
  transition:transform .22s cubic-bezier(.2,.65,.25,1), box-shadow .22s, background .22s, color .22s;
}
.lp-btn:hover{ transform:translateY(-2px); }
.lp-btn:active{ transform:translateY(0); }
.lp-btn-ic{ display:inline-grid; place-items:center; }
.lp-btn-ic svg{ width:15px; height:15px; }
.lp-btn-ink{ background:var(--ink); color:#FBF8F1; box-shadow:0 1px 2px rgba(24,28,35,.2); }
.lp-btn-ink:hover{ box-shadow:0 14px 30px -10px rgba(24,28,35,.45); }
.lp-btn-ghost{ background:transparent; color:var(--ink); border:1px solid var(--line2); }
.lp-btn-ghost:hover{ background:#fff; box-shadow:0 10px 24px -12px rgba(24,28,35,.2); }
.lp-btn-mint{ background:var(--mint-bright); color:#06241A; box-shadow:0 1px 2px rgba(14,124,91,.3); }
.lp-btn-mint:hover{ box-shadow:0 16px 34px -10px rgba(25,198,139,.55); }
.lp-btn-night{ background:rgba(255,255,255,.08); color:#EAF2EE; border:1px solid rgba(255,255,255,.18); }
.lp-btn-night:hover{ background:rgba(255,255,255,.14); }
.lp-btn-glass{
  background:rgba(255,255,255,.45); color:var(--ink); border:1px solid rgba(255,255,255,.7);
  backdrop-filter:blur(14px) saturate(160%); -webkit-backdrop-filter:blur(14px) saturate(160%);
  box-shadow:0 8px 24px -14px rgba(40,44,90,.4), inset 0 1px 0 rgba(255,255,255,.8);
}
.lp-btn-glass:hover{ background:rgba(255,255,255,.7); box-shadow:0 14px 32px -14px rgba(40,44,90,.5); }
.lp-btn-sm{ padding:10px 18px; font-size:14px; }
.lp-btn-full{ width:100%; }

/* ── hero + demo stage (cosmic glass) ── */
.lp-stage{ position:relative; padding-top:clamp(22px,3.5vh,46px); isolation:isolate; }
.lp-stage-sky{
  position:absolute; inset:0; z-index:0; pointer-events:none;
  background:linear-gradient(180deg,
    #C7D7FF 0%, #D4D1F6 24%, #E4DCEE 48%, #F1E8DD 72%, var(--paper) 100%);
}
.lp-stage-aurora{
  position:absolute; inset:0; z-index:0; pointer-events:none;
  background:
    radial-gradient(680px 380px at 15% 4%, rgba(93,79,184,.34), transparent 64%),
    radial-gradient(760px 440px at 86% 0%, rgba(25,198,139,.28), transparent 64%),
    radial-gradient(1000px 560px at 50% 34%, rgba(120,150,235,.20), transparent 70%);
  filter:saturate(125%);
  mask-image:linear-gradient(180deg,#000 0%,#000 55%,transparent 88%);
  -webkit-mask-image:linear-gradient(180deg,#000 0%,#000 55%,transparent 88%);
}
.lp-stage-stars{
  position:absolute; inset:0; z-index:0; pointer-events:none; opacity:.55;
  background-image:
    radial-gradient(1.5px 1.5px at 12% 16%, #fff, transparent),
    radial-gradient(1.2px 1.2px at 26% 40%, #fff, transparent),
    radial-gradient(1.7px 1.7px at 45% 10%, #fff, transparent),
    radial-gradient(1.2px 1.2px at 64% 28%, #fff, transparent),
    radial-gradient(1.5px 1.5px at 81% 14%, #fff, transparent),
    radial-gradient(1px 1px at 7% 56%, #fff, transparent),
    radial-gradient(1px 1px at 93% 46%, #fff, transparent),
    radial-gradient(1px 1px at 37% 60%, #fff, transparent),
    radial-gradient(1.3px 1.3px at 73% 54%, #fff, transparent),
    radial-gradient(1px 1px at 55% 8%, #fff, transparent);
  mask-image:linear-gradient(180deg,#000 0%,#000 38%,transparent 74%);
  -webkit-mask-image:linear-gradient(180deg,#000 0%,#000 38%,transparent 74%);
}
.lp-stage-copy{ position:relative; z-index:2; text-align:center; }
.lp-badge{
  display:inline-flex; align-items:center; gap:9px; padding:8px 18px;
  background:rgba(255,255,255,.5); border:1px solid rgba(255,255,255,.7); border-radius:999px;
  backdrop-filter:blur(14px) saturate(150%); -webkit-backdrop-filter:blur(14px) saturate(150%);
  box-shadow:0 6px 20px -12px rgba(40,44,90,.4), inset 0 1px 0 rgba(255,255,255,.8);
  font-family:var(--mono); font-size:11.5px; letter-spacing:.04em; color:var(--ink2);
}
.lp-badge-dot{ width:7px; height:7px; border-radius:50%; background:var(--mint-bright); box-shadow:0 0 0 4px rgba(25,198,139,.22); flex-shrink:0; }
.lp-h1{
  font-family:var(--serif); font-weight:400; font-size:clamp(34px,4.6vw,62px);
  line-height:1.13; letter-spacing:-.015em; margin:clamp(24px,3.4vh,34px) auto 0; max-width:34ch;
}
.lp-h1 em, .lp-h2 em{ font-style:italic; }
.lp-sr{ position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }
.lp-h1-row{ display:block; }
.lp-h1-row + .lp-h1-row{ margin-top:.18em; }
/* "See where you ___" — center the *changing word* dead-centre under the
   title (not the whole line), so every option lands on the same axis as the
   heading. The cycle is centred by text-align; the lead-in is absolutely
   positioned just left of it, so its width can't shove the word off-centre.
   (half cycle width 6.9em/2 = 3.45em, + gap) */
/* "See where you ___" — one naturally-spaced, centred phrase. The cycle slot
   morphs its width (set in JS) to the active word, so the lead-in always sits a
   single space before the word and the whole phrase stays centred — no fixed
   slot, no gap. Wraps cleanly on narrow screens. */
.lp-h1-it{ display:flex; align-items:center; justify-content:center; gap:.26em; flex-wrap:wrap; }
.lp-h1-it > em{ font-style:italic; color:var(--ink2); }

/* Width snaps instantly (no smooth transition) so the centred line never
   slides — a sliding line leaves GPU ghost-trails of the text. The word swap
   is a pure opacity crossfade; nothing moves continuously, so no traces. */
.lp-cycle{
  position:relative; display:inline-flex; align-items:center; height:1.16em;
}
.lp-cw{
  position:absolute; left:0; top:50%; transform:translateY(-50%);
  display:flex; align-items:center; justify-content:flex-start; height:1.16em;
  padding:0 .34em .06em; border-radius:.24em; font-style:italic; white-space:nowrap;
  line-height:1.05; box-sizing:border-box;
  opacity:0; transition:opacity .4s ease;
}
.lp-cw-on{ opacity:1; }
.lp-cw-mint{ background:rgba(220,242,229,.9); color:var(--mint); }
.lp-cw-rose{ background:rgba(249,227,224,.9); color:#B2543F; }
.lp-cw-amber{ background:rgba(250,235,210,.9); color:var(--amber); }
.lp-cw-lav{ background:rgba(233,229,249,.9); color:var(--lav); }

/* tiny planet orbiting the word "map" */
.lp-orbit{ position:relative; display:inline-block; }
.lp-orbit-sys{ position:absolute; inset:-.3em -.36em; transform:rotate(-12deg) scaleY(.52); pointer-events:none; }
.lp-orbit-ring{ position:absolute; inset:0; border:1.5px solid rgba(93,79,184,.45); border-radius:50%; display:block; }
.lp-orbit-spin{ position:absolute; inset:0; display:block; }
.lp-orbit-dot{
  position:absolute; top:-4px; left:50%; width:8px; height:8px; margin-left:-4px;
  border-radius:50%; background:var(--lav); display:block;
  box-shadow:0 0 10px 3px rgba(93,79,184,.5);
}

/* shooting stars */
.lp-shoot{
  position:absolute; z-index:0; pointer-events:none; opacity:0;
  width:130px; height:1.6px; border-radius:99px;
  background:linear-gradient(90deg, transparent, rgba(255,255,255,.95));
}
.lp-shoot-1{ top:10%; left:-6%; }
.lp-shoot-2{ top:24%; left:34%; }

/* hint under the single CTA */
.lp-stage-hint{
  margin-top:clamp(16px,2.2vh,22px); font-family:var(--mono); font-size:11.5px; letter-spacing:.08em;
  color:var(--ink2);
}
.lp-hint-arrow{ display:inline-block; margin-left:2px; }

/* small, slow signature animations — always on (orbit, hint).
   The word cycler is JS-driven (width morph + crossfade), see .lp-cw above. */
.lp-orbit-spin{ animation:lpSpin 8s linear infinite; }
.lp-hint-arrow{ animation:lpBob 1.8s ease-in-out infinite; }
/* larger ambient motion only when the user allows it */
@media (prefers-reduced-motion: no-preference){
  .lp-float{ animation:lpFloat 5.5s ease-in-out infinite alternate; }
  .lp-shoot-1{ animation:lpShoot 9s ease-in 2.5s infinite; }
  .lp-shoot-2{ animation:lpShoot 12s ease-in 7s infinite; }
  .lp-stage-aurora{ animation:lpAurora 26s ease-in-out infinite alternate; }
}
@keyframes lpSpin{ to{ transform:rotate(360deg); } }
@keyframes lpFloat{ from{ transform:translateY(0) rotate(0); } to{ transform:translateY(-4px) rotate(-1.4deg); } }
@keyframes lpShoot{
  0%{ transform:translate3d(0,0,0) rotate(15deg); opacity:0; }
  2%{ opacity:.9; }
  8%{ transform:translate3d(46vw,13vw,0) rotate(15deg); opacity:0; }
  100%{ opacity:0; }
}
@keyframes lpBob{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(4px); } }
@keyframes lpAurora{ from{ transform:translate3d(-1.5%,0,0) scale(1); } to{ transform:translate3d(1.5%,1%,0) scale(1.05); } }
.lp-chip{
  display:inline-flex; align-items:center; gap:.3em; vertical-align:baseline;
  padding:.04em .36em .1em .14em; border-radius:.3em; line-height:1;
}
.lp-chip em{ font-style:italic; }
.lp-chip-ic{
  display:inline-grid; place-items:center; width:.72em; height:.72em; border-radius:.2em;
  transform:rotate(-6deg);
}
.lp-chip-ic svg{ width:62%; height:62%; }
.lp-chip-lav{ background:rgba(233,229,249,.85); color:var(--lav); }
.lp-chip-lav .lp-chip-ic{ background:var(--lav); color:#fff; }
.lp-chip-mint{ background:rgba(220,242,229,.85); color:var(--mint); }
.lp-chip-mint .lp-chip-ic{ background:var(--mint); color:#fff; }
.lp-hero-sub{ max-width:600px; margin:24px auto 0; font-size:clamp(16px,1.6vw,18px); color:var(--ink2); line-height:1.6; }
.lp-hero-cta{ display:flex; flex-wrap:wrap; gap:14px; justify-content:center; margin-top:clamp(28px,4vh,42px); }

/* pinned demo + spacer give the live app a sticky "stays as you scroll" feel */
.lp-stage-pin{ position:sticky; top:74px; z-index:2; margin-top:clamp(14px,2.2vh,28px); }
.lp-stage-spacer{ position:relative; z-index:0; height:clamp(90px,22vh,260px); }

.lp-demo-stage{
  display:grid; grid-template-columns:176px minmax(0,1fr) 200px;
  gap:clamp(12px,1.4vw,24px); align-items:stretch;
  max-width:1520px; margin:0 auto; padding:0 clamp(12px,2vw,28px);
}

/* glass control rails flanking the app */
.lp-rail{
  display:flex; flex-direction:column; gap:8px; align-self:center;
  padding:16px 13px; border-radius:22px;
  background:rgba(255,255,255,.38); border:1px solid rgba(255,255,255,.66);
  backdrop-filter:blur(22px) saturate(165%); -webkit-backdrop-filter:blur(22px) saturate(165%);
  box-shadow:0 24px 56px -28px rgba(40,44,90,.5), inset 0 1px 0 rgba(255,255,255,.82);
}
.lp-rail-label{ font-family:var(--mono); font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--ink3); padding:0 4px 5px; }
.lp-rail-r{ gap:12px; }
.lp-rail-note{ font-size:12px; color:var(--ink2); line-height:1.55; padding:2px 4px; }
.lp-rail-cta{ margin-top:auto; width:100%; padding:11px 14px; font-size:13.5px; }

.lp-star-pill{
  display:flex; align-items:center; gap:7px; width:100%; text-align:left;
  padding:9px 13px; border-radius:13px; background:rgba(255,255,255,.5); border:1px solid rgba(255,255,255,.6);
  font-size:13px; font-weight:600; color:var(--ink2);
  transition:all .2s cubic-bezier(.2,.65,.25,1);
}
.lp-star-pill:hover{ background:rgba(255,255,255,.8); color:var(--ink); }
.lp-star-pill.lp-on{ background:var(--ink); border-color:var(--ink); color:#FBF8F1; box-shadow:0 10px 24px -12px rgba(24,28,35,.5); }
.lp-star-ic{ display:inline-grid; place-items:center; color:var(--mint-bright); flex-shrink:0; }
.lp-star-ic svg{ width:11px; height:11px; }
.lp-mode{ display:inline-flex; background:rgba(255,255,255,.5); border:1px solid rgba(255,255,255,.6); border-radius:999px; padding:3px; }
.lp-mode-col{ display:flex; }
.lp-mode button{
  display:inline-flex; align-items:center; justify-content:center; gap:7px; flex:1;
  padding:8px 14px; border-radius:999px; font-size:13px; font-weight:600; color:var(--ink3); transition:all .22s;
}
.lp-mode button svg{ width:13px; height:13px; }
.lp-mode button.lp-on{ background:var(--ink); color:#FBF8F1; }

/* frozen-glass bezel around the live app */
.lp-glass{
  padding:clamp(8px,.9vw,15px); border-radius:30px;
  background:rgba(255,255,255,.32); border:1px solid rgba(255,255,255,.72);
  backdrop-filter:blur(30px) saturate(150%); -webkit-backdrop-filter:blur(30px) saturate(150%);
  box-shadow:0 60px 140px -46px rgba(38,40,92,.6), inset 0 1px 0 rgba(255,255,255,.85);
}
.lp-frame{
  background:#fff; border:1px solid rgba(255,255,255,.7); border-radius:18px;
  box-shadow:0 20px 54px -26px rgba(24,28,35,.5); overflow:hidden;
}
.lp-frame-bar{
  display:flex; align-items:center; gap:14px; padding:11px 16px;
  border-bottom:1px solid rgba(24,28,35,.07);
}
.lp-frame-dots{ display:flex; gap:6px; }
.lp-frame-dots i{ width:10px; height:10px; border-radius:50%; }
.lp-frame-dots i:first-child{ background:#F4A9A0; }
.lp-frame-dots i:nth-child(2){ background:#F2D49B; }
.lp-frame-dots i:last-child{ background:#A8DDBA; }
.lp-frame-url{
  flex:1; text-align:center; font-family:var(--mono); font-size:11.5px; color:var(--ink3);
  letter-spacing:.03em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.lp-frame-open{
  display:inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:var(--ink2);
  padding:6px 12px; border-radius:999px; border:1px solid var(--line); transition:all .2s; white-space:nowrap;
}
.lp-frame-open:hover{ color:var(--ink); background:var(--paper); }
.lp-frame-open svg{ width:12px; height:12px; }
.lp-frame-body{ position:relative; height:clamp(440px, 70vh, 820px); background:var(--night); }
.lp-frame-body iframe{ position:absolute; inset:0; width:100%; height:100%; border:0; }
.lp-poster{ position:absolute; inset:0; width:100%; display:block; }
.lp-poster img{ width:100%; height:100%; object-fit:cover; object-position:center top; }
.lp-poster::after{ content:''; position:absolute; inset:0; background:rgba(8,12,18,.18); transition:background .3s; }
.lp-poster:hover::after{ background:rgba(8,12,18,.05); }
.lp-poster-cta{
  position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); z-index:2;
  display:flex; align-items:center; gap:12px; padding:14px 28px 14px 16px;
  background:rgba(255,255,255,.96); border-radius:999px; color:var(--ink);
  font-weight:600; font-size:clamp(14px,1.6vw,16.5px); white-space:nowrap;
  box-shadow:0 24px 60px -12px rgba(8,12,18,.55);
  transition:transform .25s cubic-bezier(.2,.65,.25,1);
}
.lp-poster:hover .lp-poster-cta{ transform:translate(-50%,-50%) scale(1.04); }
.lp-poster-play{
  display:grid; place-items:center; width:40px; height:40px; border-radius:50%;
  background:var(--mint-bright); color:#06241A; flex-shrink:0;
}
.lp-poster-play svg{ width:18px; height:18px; margin-left:2px; }

/* ── stats ── */
.lp-stats{ border-top:1px solid var(--line); border-bottom:1px solid var(--line); background:#fff; margin-top:clamp(56px,8vh,96px); }
.lp-stats-grid{ display:grid; grid-template-columns:repeat(4,1fr); }
.lp-stat{ padding:30px 18px; text-align:center; }
.lp-stat + .lp-stat{ border-left:1px solid var(--line); }
.lp-stat-n{ display:block; font-family:var(--serif); font-size:clamp(30px,3.4vw,44px); line-height:1.1; }
.lp-stat-l{ display:block; margin-top:4px; font-family:var(--mono); font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink3); }

/* ── sections ── */
.lp-section{ padding:clamp(72px,11vh,130px) 0; }
.lp-section-alt{ background:var(--paper2); border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
.lp-label{
  display:flex; align-items:center; gap:8px; font-family:var(--mono); font-size:11.5px;
  letter-spacing:.16em; text-transform:uppercase; color:var(--amber); font-weight:500;
}
.lp-sec-head{ text-align:center; max-width:760px; margin:0 auto clamp(40px,6vh,64px); }
.lp-h2{ font-family:var(--serif); font-weight:400; font-size:clamp(32px,4.4vw,54px); line-height:1.08; letter-spacing:-.01em; margin-top:18px; }
.lp-sec-sub{ margin:18px auto 0; max-width:600px; color:var(--ink2); font-size:16.5px; }

/* ── features by importance ── */
.lp-feats{ display:flex; flex-direction:column; gap:clamp(56px,9vh,104px); }
.lp-feat{
  display:grid; grid-template-columns:5fr 7fr; gap:clamp(28px,4.5vw,72px); align-items:center;
}
.lp-feat-rev .lp-feat-text{ order:2; }
.lp-feat-rev .lp-feat-media{ order:1; }
.lp-feat-num{ font-family:var(--serif); font-style:italic; font-size:clamp(34px,3vw,46px); color:var(--amber); line-height:1; display:block; }
.lp-feat-text h3{
  font-family:var(--serif); font-weight:400; font-size:clamp(26px,2.6vw,36px);
  line-height:1.15; letter-spacing:-.01em; margin-top:14px;
}
.lp-feat-text h3 em{ font-style:italic; }
.lp-feat-lead{ margin-top:14px; font-size:16px; color:var(--ink2); line-height:1.65; }
.lp-feat-points{ list-style:none; margin-top:18px; display:flex; flex-direction:column; gap:11px; }
.lp-feat-points li{ display:flex; align-items:flex-start; gap:10px; font-size:14.5px; color:var(--ink2); }
.lp-feat-points svg{ width:16px; height:16px; flex-shrink:0; margin-top:3px; color:var(--mint); }
.lp-feat-media .lp-shot{
  border:1px solid var(--line); border-radius:var(--r); overflow:hidden;
  box-shadow:0 30px 70px -30px rgba(24,28,35,.35);
  background:var(--night);
}
.lp-feat-media .lp-shot img{ width:100%; display:block; transition:transform .6s cubic-bezier(.2,.65,.25,1); }
.lp-feat:hover .lp-shot img{ transform:scale(1.02); }

/* ratings + reading mocks */
.lp-rate-box{
  background:#fff; border:1px solid var(--line); border-radius:var(--r);
  padding:22px 26px; box-shadow:0 30px 70px -30px rgba(24,28,35,.25);
}
.lp-rate-tabs{ display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
.lp-rate-tab{
  font-family:var(--mono); font-size:10.5px; letter-spacing:.04em; padding:6px 11px;
  border-radius:999px; border:1px solid var(--line); color:var(--ink3); white-space:nowrap;
}
.lp-rate-tab.lp-on{ background:var(--mint-soft); border-color:transparent; color:var(--mint); font-weight:600; }
.lp-rate-row{ display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid var(--line); }
.lp-rate-row:last-child{ border-bottom:0; }
.lp-rate-city{ font-weight:600; font-size:14px; width:92px; flex-shrink:0; }
.lp-rate-line{ font-family:var(--mono); font-size:10.5px; color:var(--ink3); width:86px; flex-shrink:0; }
.lp-rate-bar{ flex:1; height:5px; border-radius:99px; background:var(--line); overflow:hidden; }
.lp-rate-fill{ display:block; height:100%; border-radius:99px; }
.lp-rate-mint{ background:var(--mint-bright); }
.lp-rate-amber{ background:#E2A23B; }
.lp-rate-pct{ font-family:var(--mono); font-size:11px; width:36px; text-align:right; }
.lp-rate-txt-mint{ color:var(--mint); } .lp-rate-txt-amber{ color:var(--amber); }
.lp-reading{
  background:#fff; border:1px solid var(--line);
  border-radius:var(--r); padding:30px 32px; box-shadow:0 30px 70px -30px rgba(24,28,35,.25);
}
.lp-reading p{ font-family:var(--serif); font-size:clamp(19px,2vw,24px); line-height:1.45; font-style:italic; color:var(--ink); }
.lp-reading strong{ color:var(--mint); font-style:normal; font-weight:400; }
.lp-reading footer{ margin-top:14px; font-family:var(--mono); font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--ink3); }
.lp-tag-row{ display:flex; flex-wrap:wrap; gap:8px; margin-top:18px; }
.lp-tag{
  font-family:var(--mono); font-size:10.5px; letter-spacing:.06em; text-transform:uppercase;
  padding:6px 11px; border-radius:999px; background:var(--paper); border:1px solid var(--line); color:var(--ink2);
}

/* ── steps ── */
.lp-steps{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
.lp-step{
  background:var(--card); border:1px solid var(--line); border-radius:var(--r-lg); padding:34px 30px;
}
.lp-step-n{ font-family:var(--serif); font-style:italic; font-size:44px; color:var(--amber); line-height:1; }
.lp-step h3{ margin-top:18px; font-size:18px; font-weight:600; letter-spacing:-.01em; }
.lp-step p{ margin-top:10px; font-size:14.5px; color:var(--ink2); line-height:1.7; }

/* ── who it's for ── */
.lp-uses{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
.lp-use{
  background:var(--card); border:1px solid var(--line); border-radius:var(--r-lg); padding:30px 28px;
  transition:box-shadow .35s ease, transform .35s ease;
}
.lp-use:hover{ box-shadow:0 24px 50px -24px rgba(24,28,35,.22); transform:translateY(-3px); }
.lp-use-tag{
  display:inline-block; font-family:var(--mono); font-size:10.5px; font-weight:600; letter-spacing:.1em;
  text-transform:uppercase; padding:6px 12px; border-radius:999px; background:var(--mint-soft); color:var(--mint);
}
.lp-use:nth-child(2) .lp-use-tag{ background:var(--amber-soft); color:var(--amber); }
.lp-use:nth-child(3) .lp-use-tag{ background:#F9E3E0; color:#B2543F; }
.lp-use:nth-child(4) .lp-use-tag{ background:var(--lav-soft); color:var(--lav); }
.lp-use:nth-child(5) .lp-use-tag{ background:#E0EEF9; color:#2E6E9E; }
.lp-use:nth-child(6) .lp-use-tag{ background:#EFEAE0; color:#7A6A45; }
.lp-use h3{ margin-top:16px; font-family:var(--serif); font-weight:400; font-size:22px; line-height:1.25; }
.lp-use p{ margin-top:10px; font-size:14px; color:var(--ink2); line-height:1.7; }

/* ── line meanings ── */
.lp-angles{ display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
.lp-angle{ background:var(--card); border:1px solid var(--line); border-radius:var(--r); padding:26px 24px; }
.lp-angle-abbr{
  display:inline-block; font-family:var(--mono); font-size:12px; font-weight:600; letter-spacing:.08em;
  padding:5px 11px; border-radius:8px; background:var(--lav-soft); color:var(--lav);
}
.lp-angle:nth-child(2) .lp-angle-abbr{ background:var(--amber-soft); color:var(--amber); }
.lp-angle:nth-child(3) .lp-angle-abbr{ background:var(--mint-soft); color:var(--mint); }
.lp-angle:nth-child(4) .lp-angle-abbr{ background:#F9E3E0; color:#B2543F; }
.lp-angle h3{ margin-top:14px; font-size:16.5px; font-weight:600; }
.lp-angle p{ margin-top:8px; font-size:13.5px; color:var(--ink2); line-height:1.65; }
.lp-planets{ margin-top:20px; background:var(--card); border:1px solid var(--line); border-radius:var(--r-lg); overflow:hidden; }
.lp-planet{ display:grid; grid-template-columns:180px 1fr; gap:20px; padding:20px 28px; border-bottom:1px solid var(--line); }
.lp-planet:last-child{ border-bottom:0; }
.lp-planet dt{ font-family:var(--serif); font-style:italic; font-size:20px; }
.lp-planet dd{ color:var(--ink2); font-size:14.5px; align-self:center; }
.lp-more{ text-align:center; margin-top:28px; font-size:14.5px; color:var(--ink2); }
.lp-more a{ color:var(--mint); font-weight:600; border-bottom:1px solid currentColor; }

/* ── why ── */
.lp-why{
  background:var(--card); border:1px solid var(--line); border-radius:var(--r-lg);
  padding:clamp(32px,5vw,56px);
}
.lp-why-list{ list-style:none; display:grid; grid-template-columns:1fr 1fr; gap:14px 28px; }
.lp-why-list li{ display:flex; align-items:flex-start; gap:10px; font-size:15px; color:var(--ink2); }
.lp-why-list svg{ width:17px; height:17px; flex-shrink:0; margin-top:3px; color:var(--mint); }

/* ── pricing ── */
.lp-pricing{ display:grid; grid-template-columns:1fr 1.15fr; gap:20px; max-width:880px; margin:0 auto; align-items:start; }
.lp-price-card{
  background:var(--card); border:1px solid var(--line); border-radius:var(--r-lg); padding:36px 32px;
  display:flex; flex-direction:column;
}
.lp-price-tier{ font-family:var(--mono); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--ink3); font-weight:500; }
.lp-price-n{ font-family:var(--serif); font-size:clamp(38px,4vw,52px); margin-top:14px; line-height:1; }
.lp-price-n span{ font-size:16px; font-family:var(--mono); color:var(--ink3); letter-spacing:.02em; }
.lp-price-sub{ margin-top:12px; font-size:14.5px; color:var(--ink2); }
.lp-price-list{ list-style:none; margin:24px 0 28px; display:flex; flex-direction:column; gap:11px; }
.lp-price-list li{ display:flex; align-items:flex-start; gap:10px; font-size:14.5px; }
.lp-price-list svg{ width:16px; height:16px; flex-shrink:0; margin-top:3px; color:var(--mint); }
.lp-price-featured{
  background:var(--night); color:#EDF3EF; border-color:var(--night);
  box-shadow:0 36px 80px -30px rgba(11,17,24,.5); position:relative;
}
.lp-price-featured .lp-price-tier{ color:rgba(237,243,239,.55); }
.lp-price-featured .lp-price-sub{ color:rgba(237,243,239,.7); }
.lp-price-featured .lp-price-n span{ color:rgba(237,243,239,.5); }
.lp-price-featured .lp-price-list svg{ color:var(--mint-bright); }
.lp-price-flag{
  position:absolute; top:-13px; left:32px; display:inline-flex; align-items:center; gap:6px;
  background:var(--mint-bright); color:#06241A; font-size:11.5px; font-weight:700;
  letter-spacing:.04em; text-transform:uppercase; padding:6px 13px; border-radius:999px;
}
.lp-price-flag svg{ width:11px; height:11px; }

/* ── faq ── */
.lp-faq{ display:flex; flex-direction:column; gap:12px; }
.lp-faq-item{ background:var(--card); border:1px solid var(--line); border-radius:var(--r); padding:0 24px; }
.lp-faq-item summary{
  list-style:none; cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:16px;
  padding:19px 0; font-weight:600; font-size:15.5px; letter-spacing:-.005em;
}
.lp-faq-item summary::-webkit-details-marker{ display:none; }
.lp-faq-x{ font-family:var(--serif); font-size:24px; line-height:1; color:var(--ink3); transition:transform .3s; flex-shrink:0; }
.lp-faq-item[open] .lp-faq-x{ transform:rotate(45deg); color:var(--mint); }
.lp-faq-item p{ padding:0 0 20px; color:var(--ink2); font-size:14.5px; line-height:1.7; max-width:64ch; }

/* ── final cta ── */
.lp-final{
  position:relative; overflow:hidden; text-align:center; color:#EDF3EF;
  background:linear-gradient(160deg, var(--night2), var(--night) 60%);
  border-radius:32px; padding:clamp(64px,9vh,100px) clamp(24px,5vw,80px);
}
.lp-final-stars{
  position:absolute; inset:0; pointer-events:none; opacity:.7;
  background-image:
    radial-gradient(1.2px 1.2px at 12% 22%, #fff 100%, transparent),
    radial-gradient(1px 1px at 28% 68%, #C8D8EA 100%, transparent),
    radial-gradient(1.4px 1.4px at 46% 14%, #fff 100%, transparent),
    radial-gradient(1px 1px at 64% 54%, #fff 100%, transparent),
    radial-gradient(1.2px 1.2px at 78% 26%, #C8D8EA 100%, transparent),
    radial-gradient(1px 1px at 88% 72%, #fff 100%, transparent),
    radial-gradient(1px 1px at 8% 82%, #fff 100%, transparent),
    radial-gradient(.8px .8px at 38% 42%, #fff 100%, transparent),
    radial-gradient(.8px .8px at 56% 86%, #C8D8EA 100%, transparent),
    radial-gradient(.8px .8px at 94% 12%, #fff 100%, transparent);
}
.lp-final-h{ position:relative; }
.lp-final p{ position:relative; margin:16px auto 30px; color:rgba(237,243,239,.65); }
.lp-final .lp-hero-cta{ position:relative; margin-top:0; }

/* ── footer ── */
.lp-footer{ border-top:1px solid var(--line); background:#fff; padding:56px 0 0; }
.lp-footer-grid{ display:grid; grid-template-columns:1.6fr 1fr 1fr 1fr 1fr; gap:36px; padding-bottom:44px; }
.lp-footer-brand p{ margin-top:16px; font-size:13.5px; color:var(--ink2); max-width:34ch; line-height:1.65; }
.lp-footer nav{ display:flex; flex-direction:column; gap:10px; }
.lp-footer nav h4{ font-family:var(--mono); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--ink3); margin-bottom:4px; }
.lp-footer nav a{ font-size:14px; color:var(--ink2); transition:color .2s; }
.lp-footer nav a:hover{ color:var(--ink); }
.lp-footer-base{
  display:flex; flex-wrap:wrap; gap:10px; justify-content:space-between;
  border-top:1px solid var(--line); padding-top:20px; padding-bottom:24px;
  font-size:12.5px; color:var(--ink3);
}

/* ── responsive ── */
@media (max-width: 1020px){
  .lp-feat{ grid-template-columns:1fr; gap:26px; }
  .lp-feat-rev .lp-feat-text{ order:1; }
  .lp-feat-rev .lp-feat-media{ order:2; }
  .lp-uses{ grid-template-columns:repeat(2,1fr); }
  .lp-angles{ grid-template-columns:repeat(2,1fr); }
  .lp-footer-grid{ grid-template-columns:1fr 1fr; }
  /* demo: drop sticky, stack rails around the app */
  .lp-stage-pin{ position:static; margin-top:clamp(22px,3.5vh,40px); }
  .lp-stage-spacer{ display:none; }
  .lp-demo-stage{ grid-template-columns:1fr; gap:16px; max-width:840px; }
  .lp-glass{ order:1; }
  .lp-rail-l{ order:2; }
  .lp-rail-r{ order:3; }
  .lp-rail{ flex-direction:row; flex-wrap:wrap; align-items:center; justify-content:center; gap:8px 10px; padding:14px 16px; }
  .lp-rail-label{ width:100%; text-align:center; padding-bottom:2px; }
  .lp-rail .lp-star-pill{ width:auto; }
  .lp-rail-note{ width:100%; text-align:center; order:5; }
  .lp-rail-cta{ width:auto; margin-top:0; }
  .lp-mode-col{ flex:0 0 auto; }
  .lp-frame-body{ height:min(74vh, 720px); }
}
@media (max-width: 860px){
  .lp-nav-links{ display:none; }
  .lp-steps{ grid-template-columns:1fr; }
  .lp-pricing{ grid-template-columns:1fr; }
  .lp-stats-grid{ grid-template-columns:repeat(2,1fr); }
  .lp-stat:nth-child(3){ border-left:0; }
  .lp-stat:nth-child(n+3){ border-top:1px solid var(--line); }
  .lp-planet{ grid-template-columns:1fr; gap:6px; padding:18px 22px; }
  .lp-why-list{ grid-template-columns:1fr; }
  .lp-frame-body{ height:min(66vh, 600px); }
}
@media (max-width: 560px){
  .lp-angles{ grid-template-columns:1fr; }
  .lp-uses{ grid-template-columns:1fr; }
  .lp-hero-cta .lp-btn{ width:100%; }
  .lp-rate-line{ display:none; }
  .lp-footer-grid{ grid-template-columns:1fr; }
  .lp-nav{ padding:0 8px 0 14px; height:54px; }
  .lp-nav .lp-btn-sm{ padding:9px 14px; font-size:13px; }
  .lp-nav .lp-btn-sm .lp-btn-ic{ display:none; }
  .lp-logo{ font-size:14.5px; }
  .lp-frame-url{ display:none; }
  .lp-frame-body{ height:min(64vh, 520px); }
}
`;
