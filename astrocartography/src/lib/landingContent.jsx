// ── Landing page content in English + German ──
// The landing page is otherwise hardcoded; this module holds every visible
// string in both languages plus the language detection/persistence. EN is the
// default (and what crawlers with an English Accept-Language see). German
// visitors get German automatically on first load; a manual switch wins and is
// persisted. No redirect, same URL — SEO-neutral (the /astrokartographie guide
// cluster + hreflang remain the basis of Google's language mapping).
// Languages the landing is translated into. The landing auto-switches to the
// visitor's browser language across all of these; anything else falls back to
// English. Keep this in sync with the keys of CONTENT below.
export const LP_LANGS = ['en', 'de', 'fr', 'it', 'es', 'tr', 'ru', 'pt', 'ja', 'zh', 'ar', 'ko', 'pl', 'nl'];

// Languages rendered right-to-left.
export const RTL_LANGS = ['ar'];

function detectLandingLang() {
  try {
    const navs = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || [];
    for (const n of navs) {
      if (!n) continue;
      const base = String(n).toLowerCase().split('-')[0];
      if (LP_LANGS.includes(base)) return base;
    }
  } catch { /* navigator unavailable */ }
  return 'en';
}

export function getLandingLang() {
  try {
    const stored = localStorage.getItem('nn_landing_lang');
    if (stored && LP_LANGS.includes(stored)) return stored;
    const detected = detectLandingLang();
    try { localStorage.setItem('nn_landing_lang', detected); } catch { /* ignore */ }
    return detected;
  } catch {
    return 'en';
  }
}

export function setLandingLang(code) {
  try { localStorage.setItem('nn_landing_lang', code); } catch { /* ignore */ }
}

// Resolve content for a language, falling back to English per top-level key so
// a partially-translated language still renders (never blank).
export function landingContent(lang) {
  const base = CONTENT.en;
  const sel = CONTENT[lang];
  if (!sel || sel === base) return base;
  return new Proxy(sel, { get: (target, key) => (key in target ? target[key] : base[key]) });
}

export const CONTENT = {
  en: {
    nav: { demo: 'Live demo', features: 'Features', forYou: "Who it’s for", lines: 'Line meanings', pricing: 'Pricing', faq: 'FAQ', cta: 'Create your map' },
    badge: 'Find your best places with astrocartography',
    hero: {
      sr: 'Your birth chart is secretly a map — see where you thrive, fall in love, feel at home and grow.',
      pre: 'Your', chartChip: 'birth chart', mid: 'is secretly a', mapWord: 'map', seeWhere: 'See where you',
      cycle: [['thrive', 'mint'], ['fall in love', 'rose'], ['feel at home', 'amber'], ['grow', 'lav']],
    },
    heroCta: 'Reveal my best places',
    stageHint: 'the real app, live below',
    demo: {
      chartLabel: 'Demo chart',
      frameUrl: (name) => `natalnavigator.com · live demo — ${name}’s chart`,
      fullscreen: 'Fullscreen', themeLabel: 'Theme', dark: 'Dark', light: 'Light',
      railNote: 'The real app — drag the globe, toggle planets, click any city.',
      railCta: 'Create my map',
      posterCta: 'Play with the live demo',
      posterAlt: 'Interactive astrocartography map — 3D globe with 40 planetary lines and rated cities in the Natal Navigator app',
      iframeTitle: (name) => `Natal Navigator — interactive astrocartography map demo (${name})`,
    },
    stats: [['40', 'planetary lines'], ['10', 'planets, Sun to Pluto'], ['4', 'angles · MC IC ASC DSC'], ['345+', 'cities rated for you']],
    featuresHead: { label: 'Features — what matters most, first', h2: <>Everything an astrocartography reading needs.<br /><em>In the order it matters.</em></> },
    features: [
      { num: '01', title: <>The interactive 3D astrocartography globe</>, lead: 'The heart of Natal Navigator. Your whole natal chart, projected onto a globe you can spin — not a static map image.', points: ['All 40 planetary lines: MC, IC, ASC and DSC for every planet from Sun to Pluto', 'Drag, rotate and zoom in real time — toggle each planet on and off', 'Your birth place and every city on your lines, marked and clickable'], media: { type: 'img', src: '/landing/app-globe.webp', alt: '3D astrocartography globe with 40 planetary lines, planet toggles and rated cities' } },
      { num: '02', title: <>345+ cities, rated <em>thrive / neutral / caution</em></>, lead: 'The question behind every astrocartography map is “so where should I go?” — Natal Navigator answers it city by city.', points: ['Every city scored against your lines, with the exact line and orb behind the rating', 'Sorted lists: your strongest thrive zones and your caution zones, worldwide', 'Filter by continent, search any city, compare candidates side by side'], media: { type: 'ratings' } },
      { num: '03', title: <>A written reading for every city</>, lead: 'Lines and percentages are data. The readings turn them into something you can actually decide with.', points: ['Personal interpretations for career, home, love and growth — per city', 'Available in English and German', 'Export your complete chart and readings as a PDF'], media: { type: 'reading' } },
      { num: '04', title: <>Your full natal chart, computed properly</>, lead: 'Underneath the map sits a real birth chart — calculated from planetary ephemeris, not lookup tables.', points: ['Natal wheel plus a full chart table: signs, degrees, elements, retrogrades', 'Powered by the astronomy-engine library — sub-arcsecond precision', 'The same chart professional astrology software would draw'], media: { type: 'img', src: '/landing/app-natal.webp', alt: 'Natal chart panel with planet positions, zodiac signs, degrees and life domains' } },
      { num: '05', title: <>Globe or flat map. Dark or light. Any device.</>, lead: 'Astrocartography the way you prefer to read it.', points: ['Classic 2D world-map view for an at-a-glance look at every line crossing', 'Dark and light themes — switch any time', 'Fully responsive: phone, tablet and desktop'], media: { type: 'img', src: '/landing/app-map-light.webp', alt: '2D astrocartography world map in light mode with planetary lines and rated cities' } },
    ],
    howHead: { label: 'How it works', h2: <>Your map in <em>three steps</em></> },
    steps: [
      ['01', 'Enter your birth details', 'Date, exact time and city of birth — that is everything astrocartography needs. No credit card, no quiz, no waiting.'],
      ['02', 'We compute your chart', 'Real ephemeris calculations with the astronomy-engine library map all 40 planetary lines in seconds — to sub-arcsecond precision, the same math professional software uses.'],
      ['03', 'Explore your world', 'Spin the 3D globe, switch to the flat map, open your natal wheel and read why each of 345+ cities helps you thrive — or tests you.'],
    ],
    forYouHead: { label: "Who it’s for", h2: <>Made for one question:<br /><em>“Where should I live?”</em></>, sub: 'Astrocartography is for anyone weighing a place against a feeling. These are the people who get the most out of their map.' },
    useCases: [
      ['Nomads & expats', 'Choosing your next base abroad?', 'Compare the cities on your shortlist against your Venus, Jupiter and Sun lines before you sign a lease. Relocation astrology was made for exactly this decision.'],
      ['Career moves', 'Job offer in another city?', 'Sun MC and Jupiter MC lines mark the places where your work gets seen and opportunities compound. Check where a move supports your ambition — and where Saturn will test it.'],
      ['Love & connection', 'Wondering where you keep meeting the right people?', 'Venus and DSC lines describe your relationship geography — the places where attraction, friendship and partnership come easier.'],
      ['Finding home', 'Searching for the place that finally feels like home?', 'Moon and IC lines point to where you put down roots, rest deeply and build family life. Often it is not where you were born.'],
      ['Meaningful travel', 'Planning a sabbatical, retreat or big trip?', 'Travel along your lines on purpose: a creative residency on your Venus line, a reset on your Moon line, a bold launch on your Sun MC.'],
      ['Astro-curious & pros', 'Already reading charts?', 'Check any relocation chart in seconds on a proper 3D globe — with the math handled by a real ephemeris engine, not approximations.'],
    ],
    linesHead: { label: 'Line meanings', h2: <>What your <em>planetary lines</em> mean</>, sub: 'Each planet draws four lines around the Earth — one for each angle of your chart. Planet × angle is the whole grammar of astrocartography.' },
    angles: [
      ['MC', 'Midheaven', 'Career, visibility, public role. On an MC line the planet shapes how the world sees your work.'],
      ['IC', 'Imum Coeli', 'Home, roots, family. IC lines colour where you rest, retreat and build a private life.'],
      ['ASC', 'Ascendant', 'Identity and first impressions. ASC lines change how you show up — and how people read you.'],
      ['DSC', 'Descendant', 'Partnership and attraction. DSC lines describe who you meet and what relationships ask of you.'],
    ],
    planetLines: [
      ['Sun line', 'Vitality and recognition. Places where you feel seen, central and unmistakably yourself.'],
      ['Moon line', 'Emotion and belonging. Where life turns inward — comfort, intuition and a sense of home.'],
      ['Venus line', 'Love, beauty and ease. Classic territory for romance, friendship, art and pleasure.'],
      ['Jupiter line', 'Luck and expansion. Opportunities, mentors and growth tend to arrive faster here.'],
      ['Saturn line', 'Discipline and tests. Demanding ground — slow, structural progress for those who stay.'],
    ],
    more: <>Want the full theory? Read the <a href="/astrocartography">complete astrocartography guide</a>{' '}— also available <a href="/astrokartographie">auf Deutsch</a>.</>,
    whyHead: { label: 'Why Natal Navigator', h2: <>There are other astrocartography calculators.<br /><em>Here’s the honest difference.</em></> },
    why: [
      'Interactive live demo with example charts before you create your personal map',
      'A real 3D globe, not a static map image',
      '345+ cities rated and explained in writing — not just lines on a map',
      'Sub-arcsecond ephemeris precision (astronomy-engine)',
      '€4.99 once. Not another subscription',
      'English & German, PDF export, works on every device',
      'Your birth data stays private — never sold, deletable any time',
    ],
    pricingHead: { label: 'Pricing', h2: <>Pay once. <em>Keep it forever.</em></>, sub: 'No subscription, no hidden tiers. Try everything in the demo first.' },
    pricing: {
      explorerTier: 'Explorer', demoWord: 'Demo', explorerSub: 'The full app experience with famous example charts.',
      explorerList: ['Interactive demo globe & map', '5 celebrity charts to explore', 'City ratings & readings preview'],
      demoBtn: 'Try the live demo', flag: 'Most popular', navigatorTier: 'Navigator', price: '€4.99', oneTime: 'one-time',
      navigatorSub: 'Your personal astrocartography map, for life.', navigatorBtn: 'Get your map — €4.99',
    },
    premiumFeatures: ['Your personal 3D globe & flat map', 'All 40 planetary lines — Sun to Pluto', '345+ cities rated thrive / neutral / caution', 'Personal readings for every city', 'Full natal wheel & chart table', 'PDF export of your complete chart', 'Lifetime access — pay once, keep forever'],
    faqHead: { label: 'FAQ', h2: <>Questions, <em>answered</em></> },
    faqs: [
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
    ],
    final: { h2: <>Your stars are already aligned.<br /><em>See where.</em></>, sub: 'Two minutes from birth certificate to world map.', ctaCreate: 'Create my map', ctaDemo: 'Try the demo first' },
    meta: { title: 'Astrocartography Map & Calculator — Natal Navigator', desc: 'Turn your birth chart into a living map. Interactive astrocartography calculator with a 3D globe, 40 planetary lines and 345+ cities rated for career, love and home.' },
    mock: {
      thrive: 'Thrive', neutral: 'Neutral', caution: 'Caution',
      readingQuote: <>“Lisbon lies on your <strong>Venus MC</strong> line — one of the most graceful places for your public life. Work feels social, doors open through people who simply like you, and what you make here tends to be beautiful…”</>,
      readingCaption: '— sample city reading',
      tags: ['Career & Public Life', 'Home & Roots', 'Love & Connection', 'PDF export', 'EN · DE'],
    },
  },

  de: {
    nav: { demo: 'Live-Demo', features: 'Funktionen', forYou: 'Für wen', lines: 'Linien', pricing: 'Preis', faq: 'FAQ', cta: 'Karte erstellen' },
    badge: 'Finde deine besten Orte mit Astrokartographie',
    hero: {
      sr: 'Dein Geburtshoroskop ist insgeheim eine Landkarte — sieh, wo du aufblühst, dich verliebst, dich zuhause fühlst und wächst.',
      pre: 'Dein', chartChip: 'Geburtshoroskop', mid: 'ist insgeheim eine', mapWord: 'Landkarte', seeWhere: 'Sieh, wo du',
      cycle: [['aufblühst', 'mint'], ['dich verliebst', 'rose'], ['dich zuhause fühlst', 'amber'], ['wächst', 'lav']],
    },
    heroCta: 'Meine besten Orte zeigen',
    stageHint: 'die echte App, live unten',
    demo: {
      chartLabel: 'Demo-Horoskop',
      frameUrl: (name) => `natalnavigator.com · Live-Demo — Horoskop von ${name}`,
      fullscreen: 'Vollbild', themeLabel: 'Design', dark: 'Dunkel', light: 'Hell',
      railNote: 'Die echte App — Globus drehen, Planeten ein-/ausblenden, jede Stadt anklicken.',
      railCta: 'Meine Karte erstellen',
      posterCta: 'Live-Demo ausprobieren',
      posterAlt: 'Interaktive Astrokartographie-Karte — 3D-Globus mit 40 Planetenlinien und bewerteten Städten in der Natal-Navigator-App',
      iframeTitle: (name) => `Natal Navigator — interaktive Astrokartographie-Demo (${name})`,
    },
    stats: [['40', 'Planetenlinien'], ['10', 'Planeten, Sonne bis Pluto'], ['4', 'Achsen · MC IC ASC DSC'], ['345+', 'Städte für dich bewertet']],
    featuresHead: { label: 'Funktionen — das Wichtigste zuerst', h2: <>Alles, was eine Astrokartographie-Deutung braucht.<br /><em>In der richtigen Reihenfolge.</em></> },
    features: [
      { num: '01', title: <>Der interaktive 3D-Astrokartographie-Globus</>, lead: 'Das Herzstück von Natal Navigator. Dein ganzes Geburtshoroskop, projiziert auf einen Globus, den du drehen kannst — kein statisches Kartenbild.', points: ['Alle 40 Planetenlinien: MC, IC, ASC und DSC für jeden Planeten von Sonne bis Pluto', 'In Echtzeit ziehen, drehen und zoomen — jeden Planeten ein- und ausblenden', 'Dein Geburtsort und jede Stadt auf deinen Linien, markiert und anklickbar'], media: { type: 'img', src: '/landing/app-globe.webp', alt: '3D-Astrokartographie-Globus mit 40 Planetenlinien, Planeten-Schaltern und bewerteten Städten' } },
      { num: '02', title: <>345+ Städte, bewertet als <em>Aufblühen / Neutral / Vorsicht</em></>, lead: 'Die Frage hinter jeder Astrokartographie-Karte lautet „Wohin also?“ — Natal Navigator beantwortet sie Stadt für Stadt.', points: ['Jede Stadt anhand deiner Linien bewertet — mit der genauen Linie und dem Orbis dahinter', 'Sortierte Listen: deine stärksten Aufblüh-Zonen und deine Vorsichts-Zonen, weltweit', 'Nach Kontinent filtern, jede Stadt suchen, Kandidaten direkt vergleichen'], media: { type: 'ratings' } },
      { num: '03', title: <>Eine geschriebene Deutung für jede Stadt</>, lead: 'Linien und Prozente sind Daten. Die Deutungen machen daraus etwas, mit dem du wirklich entscheiden kannst.', points: ['Persönliche Deutungen für Karriere, Zuhause, Liebe und Wachstum — pro Stadt', 'Verfügbar auf Englisch und Deutsch', 'Exportiere dein komplettes Horoskop und die Deutungen als PDF'], media: { type: 'reading' } },
      { num: '04', title: <>Dein vollständiges Geburtshoroskop, korrekt berechnet</>, lead: 'Unter der Karte liegt ein echtes Geburtshoroskop — berechnet aus planetaren Ephemeriden, nicht aus Nachschlagetabellen.', points: ['Horoskop-Rad plus vollständige Tabelle: Zeichen, Grade, Elemente, Rückläufigkeiten', 'Angetrieben von der astronomy-engine-Bibliothek — Genauigkeit unter einer Bogensekunde', 'Dasselbe Horoskop, das professionelle Astrologie-Software zeichnen würde'], media: { type: 'img', src: '/landing/app-natal.webp', alt: 'Geburtshoroskop-Panel mit Planetenpositionen, Tierkreiszeichen, Graden und Lebensbereichen' } },
      { num: '05', title: <>Globus oder flache Karte. Dunkel oder hell. Jedes Gerät.</>, lead: 'Astrokartographie so, wie du sie am liebsten liest.', points: ['Klassische 2D-Weltkartenansicht für den schnellen Blick auf jede Linienkreuzung', 'Dunkles und helles Design — jederzeit umschaltbar', 'Voll responsiv: Smartphone, Tablet und Desktop'], media: { type: 'img', src: '/landing/app-map-light.webp', alt: '2D-Astrokartographie-Weltkarte im hellen Modus mit Planetenlinien und bewerteten Städten' } },
    ],
    howHead: { label: 'So funktioniert’s', h2: <>Deine Karte in <em>drei Schritten</em></> },
    steps: [
      ['01', 'Gib deine Geburtsdaten ein', 'Datum, genaue Uhrzeit und Geburtsstadt — mehr braucht Astrokartographie nicht. Keine Kreditkarte, kein Quiz, kein Warten.'],
      ['02', 'Wir berechnen dein Horoskop', 'Echte Ephemeriden-Berechnungen mit der astronomy-engine-Bibliothek zeichnen alle 40 Planetenlinien in Sekunden — mit Genauigkeit unter einer Bogensekunde, dieselbe Mathematik wie in Profi-Software.'],
      ['03', 'Erkunde deine Welt', 'Dreh den 3D-Globus, wechsle zur flachen Karte, öffne dein Horoskop-Rad und lies, warum jede der 345+ Städte dich aufblühen lässt — oder dich herausfordert.'],
    ],
    forYouHead: { label: 'Für wen', h2: <>Für eine Frage gemacht:<br /><em>„Wo soll ich leben?“</em></>, sub: 'Astrokartographie ist für alle, die einen Ort gegen ein Gefühl abwägen. Diese Menschen holen am meisten aus ihrer Karte heraus.' },
    useCases: [
      ['Nomaden & Auswanderer', 'Du suchst deine nächste Basis im Ausland?', 'Vergleiche die Städte deiner engeren Wahl mit deinen Venus-, Jupiter- und Sonnenlinien, bevor du einen Mietvertrag unterschreibst. Relocation-Astrologie ist genau für diese Entscheidung gemacht.'],
      ['Karriereschritte', 'Jobangebot in einer anderen Stadt?', 'Sonne-MC- und Jupiter-MC-Linien markieren die Orte, an denen deine Arbeit gesehen wird und sich Chancen häufen. Prüfe, wo ein Umzug deinen Ehrgeiz unterstützt — und wo Saturn ihn auf die Probe stellt.'],
      ['Liebe & Verbindung', 'Du fragst dich, wo du immer wieder die richtigen Menschen triffst?', 'Venus- und DSC-Linien beschreiben deine Beziehungs-Geografie — die Orte, an denen Anziehung, Freundschaft und Partnerschaft leichter entstehen.'],
      ['Ein Zuhause finden', 'Auf der Suche nach dem Ort, der sich endlich wie Zuhause anfühlt?', 'Mond- und IC-Linien zeigen, wo du Wurzeln schlägst, tief zur Ruhe kommst und Familienleben aufbaust. Oft ist das nicht dein Geburtsort.'],
      ['Bedeutsames Reisen', 'Planst du ein Sabbatical, ein Retreat oder eine große Reise?', 'Reise bewusst entlang deiner Linien: eine kreative Auszeit auf deiner Venuslinie, ein Neustart auf deiner Mondlinie, ein mutiger Aufbruch auf deiner Sonne-MC.'],
      ['Astro-Neugierige & Profis', 'Du liest bereits Horoskope?', 'Prüfe jedes Relocation-Horoskop in Sekunden auf einem echten 3D-Globus — die Mathematik übernimmt eine echte Ephemeriden-Engine, keine Näherungen.'],
    ],
    linesHead: { label: 'Bedeutung der Linien', h2: <>Was deine <em>Planetenlinien</em> bedeuten</>, sub: 'Jeder Planet zieht vier Linien um die Erde — eine für jede Achse deines Horoskops. Planet × Achse ist die ganze Grammatik der Astrokartographie.' },
    angles: [
      ['MC', 'Medium Coeli', 'Karriere, Sichtbarkeit, öffentliche Rolle. Auf einer MC-Linie prägt der Planet, wie die Welt deine Arbeit sieht.'],
      ['IC', 'Imum Coeli', 'Zuhause, Wurzeln, Familie. IC-Linien färben, wo du ruhst, dich zurückziehst und ein privates Leben aufbaust.'],
      ['ASC', 'Aszendent', 'Identität und erster Eindruck. ASC-Linien verändern, wie du auftrittst — und wie andere dich lesen.'],
      ['DSC', 'Deszendent', 'Partnerschaft und Anziehung. DSC-Linien beschreiben, wen du triffst und was Beziehungen von dir verlangen.'],
    ],
    planetLines: [
      ['Sonnenlinie', 'Vitalität und Anerkennung. Orte, an denen du dich gesehen, zentral und unverkennbar du selbst fühlst.'],
      ['Mondlinie', 'Emotion und Zugehörigkeit. Wo das Leben nach innen geht — Geborgenheit, Intuition und ein Gefühl von Zuhause.'],
      ['Venuslinie', 'Liebe, Schönheit und Leichtigkeit. Klassisches Terrain für Romantik, Freundschaft, Kunst und Genuss.'],
      ['Jupiterlinie', 'Glück und Expansion. Chancen, Mentoren und Wachstum kommen hier tendenziell schneller.'],
      ['Saturnlinie', 'Disziplin und Prüfungen. Forderndes Terrain — langsamer, struktureller Fortschritt für die, die bleiben.'],
    ],
    more: <>Willst du die ganze Theorie? Lies den <a href="/astrokartographie">vollständigen Astrokartographie-Guide</a>{' '}— auch <a href="/astrocartography">in English</a> verfügbar.</>,
    whyHead: { label: 'Warum Natal Navigator', h2: <>Es gibt andere Astrokartographie-Rechner.<br /><em>Hier ist der ehrliche Unterschied.</em></> },
    why: [
      'Interaktive Live-Demo mit Beispiel-Horoskopen, bevor du deine persönliche Karte erstellst',
      'Ein echter 3D-Globus, kein statisches Kartenbild',
      '345+ Städte bewertet und schriftlich erklärt — nicht nur Linien auf einer Karte',
      'Ephemeriden-Genauigkeit unter einer Bogensekunde (astronomy-engine)',
      '4,99 € einmalig. Kein weiteres Abo',
      'Englisch & Deutsch, PDF-Export, läuft auf jedem Gerät',
      'Deine Geburtsdaten bleiben privat — werden nie verkauft, jederzeit löschbar',
    ],
    pricingHead: { label: 'Preis', h2: <>Einmal zahlen. <em>Für immer behalten.</em></>, sub: 'Kein Abo, keine versteckten Stufen. Probiere zuerst alles in der Demo aus.' },
    pricing: {
      explorerTier: 'Explorer', demoWord: 'Demo', explorerSub: 'Das volle App-Erlebnis mit berühmten Beispiel-Horoskopen.',
      explorerList: ['Interaktiver Demo-Globus & Karte', '5 Promi-Horoskope zum Erkunden', 'Vorschau auf Städte-Bewertungen & Deutungen'],
      demoBtn: 'Live-Demo ausprobieren', flag: 'Am beliebtesten', navigatorTier: 'Navigator', price: '4,99 €', oneTime: 'einmalig',
      navigatorSub: 'Deine persönliche Astrokartographie-Karte, für immer.', navigatorBtn: 'Hol dir deine Karte — 4,99 €',
    },
    premiumFeatures: ['Dein persönlicher 3D-Globus & flache Karte', 'Alle 40 Planetenlinien — Sonne bis Pluto', '345+ Städte bewertet: Aufblühen / Neutral / Vorsicht', 'Persönliche Deutungen für jede Stadt', 'Vollständiges Horoskop-Rad & Tabelle', 'PDF-Export deines kompletten Horoskops', 'Lebenslanger Zugang — einmal zahlen, für immer behalten'],
    faqHead: { label: 'FAQ', h2: <>Fragen, <em>beantwortet</em></> },
    faqs: [
      ['Was ist Astrokartographie?', 'Astrokartographie — auch Orts- oder Relocation-Astrologie genannt — projiziert dein Geburtshoroskop auf die Weltkarte. Für jeden Planeten zeichnet sie vier Linien (MC, IC, ASC, DSC), die zeigen, wo dieser Planet bei deiner Geburt an einer Achse stand. Auf oder nahe einer Linie zu leben gilt als ein stärkeres Erleben der Themen dieses Planeten an diesem Ort.'],
      ['Was kostet Natal Navigator?', 'Du kannst zuerst die interaktive Demo mit Beispiel-Horoskopen erkunden. Deine persönliche Astrokartographie-Karte — alle 40 Planetenlinien, 345+ bewertete Städte, Horoskop-Rad und PDF-Export — kostet einmalig 4,99 €. Kein Abo, lebenslanger Zugang.'],
      ['Für wen ist Astrokartographie?', 'Für alle, die einen Ort gegen ein Gefühl abwägen: digitale Nomaden und Auswanderer bei der Wahl einer Basis, Berufstätige vor einem beruflichen Umzug, Menschen auf der Suche nach dem Ort, an dem Zuhause oder Liebe leichter fällt, und Reisende, deren Reisen etwas bedeuten sollen. Du brauchst kein Astrologie-Wissen — die Deutungen erklären alles.'],
      ['Wessen Horoskope kann ich in der Demo erkunden?', 'In der interaktiven Demo kannst du zwischen den Astrokartographie-Karten von Elon Musk, Albert Einstein, Marilyn Monroe, Steve Jobs und Frida Kahlo wechseln — alle auf Basis öffentlich dokumentierter Geburtsdaten. Es ist die volle App, nur mit einem berühmten Horoskop statt deinem.'],
      ['Wie genau sind die Berechnungen?', 'Natal Navigator nutzt die Ephemeriden-Bibliothek astronomy-engine, um echte Planetenpositionen mit einer Genauigkeit unter einer Bogensekunde zu berechnen — keine Nachschlagetabellen, keine Näherungen. Die Linienpositionen entsprechen professioneller Astrologie-Software.'],
      ['Brauche ich meine genaue Geburtszeit?', 'Ja — für eine aussagekräftige Karte. Die Achsen (MC, IC, ASC, DSC) bewegen sich etwa ein Grad alle vier Minuten, sodass selbst 15 Minuten deine Linien um Hunderte Kilometer verschieben können. Schau im Zweifel in deine Geburtsurkunde.'],
      ['Kann Astrokartographie mir sagen, wo ich leben soll?', 'Sie ist ein Werkzeug zur Reflexion, kein Urteil. Deine Karte hebt Orte hervor, deren planetare Themen Karriere (MC), Zuhause (IC), Identität (ASC) oder Beziehungen (DSC) unterstützen. Natal Navigator bewertet 345+ Städte als Aufblüh-, Neutral- oder Vorsichts-Zonen, damit du Optionen vergleichen kannst — die Entscheidung bleibt deine.'],
      ['Was ist der Unterschied zwischen Geburtshoroskop und Astrokartographie-Karte?', 'Dein Geburtshoroskop ist eine Momentaufnahme des Himmels bei deiner Geburt — es beschreibt dich. Eine Astrokartographie-Karte nimmt dasselbe Horoskop und fragt, wo auf der Erde jeder Planet aufgehen, untergehen oder kulminieren würde — sie beschreibt dich an einem Ort. Natal Navigator zeigt beides nebeneinander.'],
      ['Was ist eine Venuslinie?', 'Eine Venuslinie markiert die Orte, an denen Venus bei deiner Geburt aufging, unterging, kulminierte oder anti-kulminierte. Venuslinien gelten traditionell als die leichteste, angenehmste Geografie eines Horoskops — günstig für Liebe, Freundschaft, Schönheit und Geld.'],
      ['Bleiben meine Geburtsdaten privat?', 'Ja. Deine Geburtsdaten werden sicher gespeichert, nie verkauft und nie weitergegeben. Du kannst dein Konto — und alle Daten damit — jederzeit löschen.'],
    ],
    final: { h2: <>Deine Sterne stehen schon bereit.<br /><em>Sieh, wo.</em></>, sub: 'Zwei Minuten von der Geburtsurkunde zur Weltkarte.', ctaCreate: 'Meine Karte erstellen', ctaDemo: 'Erst die Demo testen' },
    meta: { title: 'Astrokartographie-Karte & Rechner — Natal Navigator', desc: 'Verwandle dein Geburtshoroskop in eine lebendige Karte. Interaktiver Astrokartographie-Rechner mit 3D-Globus, 40 Planetenlinien und 345+ Städten, bewertet für Karriere, Liebe und Zuhause.' },
    mock: {
      thrive: 'Aufblühen', neutral: 'Neutral', caution: 'Vorsicht',
      readingQuote: <>„Lissabon liegt auf deiner <strong>Venus-MC</strong>-Linie — einer der anmutigsten Orte für dein öffentliches Leben. Arbeit fühlt sich sozial an, Türen öffnen sich durch Menschen, die dich einfach mögen, und was du hier erschaffst, wird meist schön…“</>,
      readingCaption: '— Beispiel-Deutung für eine Stadt',
      tags: ['Karriere & Öffentlichkeit', 'Zuhause & Wurzeln', 'Liebe & Verbindung', 'PDF-Export', 'EN · DE'],
    },
  },

  fr: {
    nav: { demo: 'Démo en direct', features: 'Fonctions', forYou: 'Pour qui', lines: 'Les lignes', pricing: 'Tarif', faq: 'FAQ', cta: 'Créer ma carte' },
    badge: 'Trouvez vos meilleurs lieux grâce à l’astrocartographie',
    hero: {
      sr: 'Votre thème natal est secrètement une carte — voyez où vous vous épanouissez, tombez amoureux·se, vous sentez chez vous et grandissez.',
      pre: 'Votre', chartChip: 'thème natal', mid: 'est secrètement une', mapWord: 'carte', seeWhere: 'Voyez où vous',
      cycle: [['vous épanouissez', 'mint'], ['tombez amoureux', 'rose'], ['vous sentez chez vous', 'amber'], ['grandissez', 'lav']],
    },
    heroCta: 'Révéler mes meilleurs lieux',
    stageHint: 'la vraie application, en direct ci-dessous',
    demo: {
      chartLabel: 'Thème démo',
      frameUrl: (name) => `natalnavigator.com · démo en direct — thème de ${name}`,
      fullscreen: 'Plein écran', themeLabel: 'Thème', dark: 'Sombre', light: 'Clair',
      railNote: 'La vraie application — faites tourner le globe, activez les planètes, cliquez sur une ville.',
      railCta: 'Créer ma carte',
      posterCta: 'Essayer la démo en direct',
      posterAlt: 'Carte d’astrocartographie interactive — globe 3D avec 40 lignes planétaires et villes notées dans l’application Natal Navigator',
      iframeTitle: (name) => `Natal Navigator — démo interactive d’astrocartographie (${name})`,
    },
    stats: [['40', 'lignes planétaires'], ['10', 'planètes, du Soleil à Pluton'], ['4', 'angles · MC IC ASC DSC'], ['345+', 'villes notées pour vous']],
    featuresHead: { label: 'Fonctions — l’essentiel d’abord', h2: <>Tout ce qu’une lecture d’astrocartographie exige.<br /><em>Dans l’ordre qui compte.</em></> },
    features: [
      { num: '01', title: <>Le globe d’astrocartographie 3D interactif</>, lead: 'Le cœur de Natal Navigator. Tout votre thème natal projeté sur un globe que vous faites tourner — pas une image de carte figée.', points: ['Les 40 lignes planétaires : MC, IC, ASC et DSC pour chaque planète, du Soleil à Pluton', 'Faites glisser, tournez et zoomez en temps réel — activez chaque planète', 'Votre lieu de naissance et chaque ville sur vos lignes, marqués et cliquables'], media: { type: 'img', src: '/landing/app-globe.webp', alt: 'Globe d’astrocartographie 3D avec 40 lignes planétaires, sélecteurs de planètes et villes notées' } },
      { num: '02', title: <>345+ villes, notées <em>épanouissement / neutre / prudence</em></>, lead: 'La question derrière chaque carte d’astrocartographie est « alors, où aller ? » — Natal Navigator y répond ville par ville.', points: ['Chaque ville évaluée par rapport à vos lignes, avec la ligne exacte et l’orbe derrière la note', 'Listes triées : vos plus fortes zones d’épanouissement et vos zones de prudence, dans le monde entier', 'Filtrez par continent, cherchez n’importe quelle ville, comparez côte à côte'], media: { type: 'ratings' } },
      { num: '03', title: <>Une lecture écrite pour chaque ville</>, lead: 'Les lignes et les pourcentages sont des données. Les lectures en font quelque chose qui aide vraiment à décider.', points: ['Interprétations personnelles pour la carrière, le foyer, l’amour et la croissance — par ville', 'Disponible en anglais et en allemand', 'Exportez votre thème complet et vos lectures en PDF'], media: { type: 'reading' } },
      { num: '04', title: <>Votre thème natal complet, calculé correctement</>, lead: 'Sous la carte se trouve un vrai thème natal — calculé à partir des éphémérides planétaires, pas de tables de correspondance.', points: ['Roue natale et tableau complet : signes, degrés, éléments, rétrogradations', 'Propulsé par la bibliothèque astronomy-engine — précision inférieure à la seconde d’arc', 'Le même thème que dessinerait un logiciel d’astrologie professionnel'], media: { type: 'img', src: '/landing/app-natal.webp', alt: 'Panneau de thème natal avec positions planétaires, signes du zodiaque, degrés et domaines de vie' } },
      { num: '05', title: <>Globe ou carte plate. Sombre ou clair. Tout appareil.</>, lead: 'L’astrocartographie comme vous préférez la lire.', points: ['Vue classique en carte du monde 2D pour saisir d’un coup d’œil chaque croisement de lignes', 'Thèmes sombre et clair — changez à tout moment', 'Entièrement responsive : téléphone, tablette et ordinateur'], media: { type: 'img', src: '/landing/app-map-light.webp', alt: 'Carte du monde d’astrocartographie 2D en mode clair avec lignes planétaires et villes notées' } },
    ],
    howHead: { label: 'Comment ça marche', h2: <>Votre carte en <em>trois étapes</em></> },
    steps: [
      ['01', 'Saisissez vos données de naissance', 'Date, heure exacte et ville de naissance — c’est tout ce dont l’astrocartographie a besoin. Pas de carte bancaire, pas de quiz, pas d’attente.'],
      ['02', 'Nous calculons votre thème', 'De vrais calculs d’éphémérides avec la bibliothèque astronomy-engine tracent les 40 lignes planétaires en quelques secondes — avec une précision inférieure à la seconde d’arc, les mêmes maths que les logiciels professionnels.'],
      ['03', 'Explorez votre monde', 'Faites tourner le globe 3D, passez à la carte plate, ouvrez votre roue natale et lisez pourquoi chacune des 345+ villes vous fait grandir — ou vous met à l’épreuve.'],
    ],
    forYouHead: { label: 'Pour qui', h2: <>Conçu pour une seule question :<br /><em>« Où devrais-je vivre ? »</em></>, sub: 'L’astrocartographie est pour quiconque pèse un lieu face à un ressenti. Voici les personnes qui en tirent le plus.' },
    useCases: [
      ['Nomades & expatriés', 'Vous choisissez votre prochaine base à l’étranger ?', 'Comparez les villes de votre liste à vos lignes de Vénus, Jupiter et Soleil avant de signer un bail. L’astrologie de relocation est faite exactement pour cette décision.'],
      ['Mobilité professionnelle', 'Une offre d’emploi dans une autre ville ?', 'Les lignes Soleil MC et Jupiter MC marquent les lieux où votre travail est vu et où les opportunités s’accumulent. Voyez où un déménagement soutient votre ambition — et où Saturne la mettra à l’épreuve.'],
      ['Amour & lien', 'Vous vous demandez où vous rencontrez les bonnes personnes ?', 'Les lignes de Vénus et DSC décrivent votre géographie relationnelle — les lieux où l’attirance, l’amitié et le partenariat viennent plus facilement.'],
      ['Trouver son chez-soi', 'À la recherche du lieu qui ressemble enfin à un foyer ?', 'Les lignes de Lune et IC indiquent où vous prenez racine, vous reposez en profondeur et bâtissez une vie de famille. Souvent, ce n’est pas votre lieu de naissance.'],
      ['Voyage qui a du sens', 'Vous planifiez un congé sabbatique, une retraite ou un grand voyage ?', 'Voyagez le long de vos lignes à dessein : une résidence créative sur votre ligne de Vénus, une remise à zéro sur votre ligne de Lune, un lancement audacieux sur votre Soleil MC.'],
      ['Curieux d’astro & pros', 'Vous lisez déjà des thèmes ?', 'Vérifiez n’importe quel thème de relocation en quelques secondes sur un vrai globe 3D — les maths gérées par un vrai moteur d’éphémérides, pas des approximations.'],
    ],
    linesHead: { label: 'Les lignes', h2: <>Ce que signifient vos <em>lignes planétaires</em></>, sub: 'Chaque planète trace quatre lignes autour de la Terre — une par angle de votre thème. Planète × angle, c’est toute la grammaire de l’astrocartographie.' },
    angles: [
      ['MC', 'Milieu du Ciel', 'Carrière, visibilité, rôle public. Sur une ligne MC, la planète façonne la manière dont le monde voit votre travail.'],
      ['IC', 'Fond du Ciel', 'Foyer, racines, famille. Les lignes IC colorent là où vous vous reposez, vous retirez et bâtissez une vie privée.'],
      ['ASC', 'Ascendant', 'Identité et premières impressions. Les lignes ASC changent votre manière d’apparaître — et celle dont on vous perçoit.'],
      ['DSC', 'Descendant', 'Partenariat et attirance. Les lignes DSC décrivent qui vous rencontrez et ce que les relations exigent de vous.'],
    ],
    planetLines: [
      ['Ligne de Soleil', 'Vitalité et reconnaissance. Les lieux où vous vous sentez vu, central et indéniablement vous-même.'],
      ['Ligne de Lune', 'Émotion et appartenance. Là où la vie se tourne vers l’intérieur — réconfort, intuition et sens du foyer.'],
      ['Ligne de Vénus', 'Amour, beauté et facilité. Territoire classique de la romance, l’amitié, l’art et le plaisir.'],
      ['Ligne de Jupiter', 'Chance et expansion. Opportunités, mentors et croissance arrivent souvent plus vite ici.'],
      ['Ligne de Saturne', 'Discipline et épreuves. Terrain exigeant — un progrès lent et structurel pour qui reste.'],
    ],
    more: <>Vous voulez toute la théorie ? Lisez le <a href="/astrocartography">guide complet d’astrocartographie</a>{' '}— aussi disponible <a href="/astrokartographie">en allemand</a>.</>,
    whyHead: { label: 'Pourquoi Natal Navigator', h2: <>Il existe d’autres calculateurs d’astrocartographie.<br /><em>Voici la différence, honnêtement.</em></> },
    why: [
      'Démo interactive en direct avec des thèmes d’exemple avant de créer votre carte personnelle',
      'Un vrai globe 3D, pas une image de carte figée',
      '345+ villes notées et expliquées par écrit — pas seulement des lignes sur une carte',
      'Précision d’éphémérides inférieure à la seconde d’arc (astronomy-engine)',
      '4,99 € une fois. Pas un abonnement de plus',
      'Anglais & allemand, export PDF, fonctionne sur tout appareil',
      'Vos données de naissance restent privées — jamais vendues, supprimables à tout moment',
    ],
    pricingHead: { label: 'Tarif', h2: <>Payez une fois. <em>Gardez à vie.</em></>, sub: 'Pas d’abonnement, pas de paliers cachés. Essayez tout dans la démo d’abord.' },
    pricing: {
      explorerTier: 'Explorer', demoWord: 'Démo', explorerSub: 'L’expérience complète de l’app avec des thèmes d’exemple célèbres.',
      explorerList: ['Globe & carte de démo interactifs', '5 thèmes de célébrités à explorer', 'Aperçu des notes de villes & lectures'],
      demoBtn: 'Essayer la démo en direct', flag: 'Le plus populaire', navigatorTier: 'Navigator', price: '4,99 €', oneTime: 'paiement unique',
      navigatorSub: 'Votre carte d’astrocartographie personnelle, à vie.', navigatorBtn: 'Obtenir ma carte — 4,99 €',
    },
    premiumFeatures: ['Votre globe 3D & carte plate personnels', 'Les 40 lignes planétaires — du Soleil à Pluton', '345+ villes notées : épanouissement / neutre / prudence', 'Lectures personnelles pour chaque ville', 'Roue natale complète & tableau', 'Export PDF de votre thème complet', 'Accès à vie — payez une fois, gardez pour toujours'],
    faqHead: { label: 'FAQ', h2: <>Questions, <em>réponses</em></> },
    faqs: [
      ['Qu’est-ce que l’astrocartographie ?', 'L’astrocartographie — aussi appelée astrologie locale ou de relocation — projette votre thème natal sur la carte du monde. Pour chaque planète, elle trace quatre lignes (MC, IC, ASC, DSC) montrant où cette planète était à un angle à votre naissance. Vivre sur ou près d’une ligne se lit comme vivre plus fortement les thèmes de cette planète en ce lieu.'],
      ['Combien coûte Natal Navigator ?', 'Vous pouvez d’abord explorer la démo interactive avec des thèmes d’exemple. Votre carte d’astrocartographie personnelle — les 40 lignes planétaires, 345+ villes notées, roue natale et export PDF — coûte un paiement unique de 4,99 €. Pas d’abonnement, accès à vie.'],
      ['À qui s’adresse l’astrocartographie ?', 'À quiconque pèse un lieu face à un ressenti : nomades numériques et expatriés choisissant une base, professionnels envisageant une relocation, personnes cherchant où le foyer ou l’amour vient plus facilement, et voyageurs qui veulent que leurs voyages aient du sens. Aucune connaissance en astrologie n’est requise — les lectures expliquent tout.'],
      ['Quels thèmes puis-je explorer dans la démo ?', 'La démo interactive vous laisse passer d’une carte d’astrocartographie à l’autre parmi Elon Musk, Albert Einstein, Marilyn Monroe, Steve Jobs et Frida Kahlo — toutes basées sur des données de naissance publiquement documentées. C’est l’app complète, juste avec un thème célèbre au lieu du vôtre.'],
      ['Quelle est la précision des calculs ?', 'Natal Navigator utilise la bibliothèque d’éphémérides astronomy-engine pour calculer de vraies positions planétaires avec une précision inférieure à la seconde d’arc — sans tables ni approximations. Les positions des lignes correspondent aux logiciels d’astrologie professionnels.'],
      ['Ai-je besoin de mon heure de naissance exacte ?', 'Oui — pour une carte pertinente. Les angles (MC, IC, ASC, DSC) bougent d’environ un degré toutes les quatre minutes, donc même 15 minutes peuvent décaler vos lignes de centaines de kilomètres. Vérifiez votre acte de naissance en cas de doute.'],
      ['L’astrocartographie peut-elle me dire où vivre ?', 'C’est un outil de réflexion, pas un verdict. Votre carte met en avant les lieux dont les thèmes planétaires soutiennent la carrière (MC), le foyer (IC), l’identité (ASC) ou les relations (DSC). Natal Navigator note 345+ villes en zones d’épanouissement, neutres ou de prudence afin de comparer — la décision reste la vôtre.'],
      ['Quelle différence entre thème natal et carte d’astrocartographie ?', 'Votre thème natal est un instantané du ciel à votre naissance — il vous décrit. Une carte d’astrocartographie prend ce même thème et demande où, sur Terre, chaque planète se lèverait, se coucherait ou culminerait — elle vous décrit quelque part. Natal Navigator montre les deux, côte à côte.'],
      ['Qu’est-ce qu’une ligne de Vénus ?', 'Une ligne de Vénus marque les lieux où Vénus se levait, se couchait, culminait ou anti-culminait à votre naissance. Les lignes de Vénus se lisent traditionnellement comme la géographie la plus facile et agréable d’un thème — favorable à l’amour, l’amitié, la beauté et l’argent.'],
      ['Mes données de naissance sont-elles privées ?', 'Oui. Vos données de naissance sont stockées en sécurité, jamais vendues ni partagées. Vous pouvez supprimer votre compte — et toutes les données avec — à tout moment.'],
    ],
    final: { h2: <>Vos étoiles sont déjà alignées.<br /><em>Voyez où.</em></>, sub: 'Deux minutes, de l’acte de naissance à la carte du monde.', ctaCreate: 'Créer ma carte', ctaDemo: 'Essayer la démo d’abord' },
    meta: { title: 'Carte & calculateur d’astrocartographie — Natal Navigator', desc: 'Transformez votre thème natal en carte vivante. Calculateur d’astrocartographie interactif avec globe 3D, 40 lignes planétaires et 345+ villes notées pour la carrière, l’amour et le foyer.' },
    mock: {
      thrive: 'Épanouissement', neutral: 'Neutre', caution: 'Prudence',
      readingQuote: <>« Lisbonne se trouve sur votre ligne <strong>Vénus MC</strong> — l’un des lieux les plus gracieux pour votre vie publique. Le travail y est social, les portes s’ouvrent par des gens qui vous apprécient, et ce que vous créez ici tend à être beau… »</>,
      readingCaption: '— exemple de lecture de ville',
      tags: ['Carrière & vie publique', 'Foyer & racines', 'Amour & lien', 'Export PDF', 'EN · DE'],
    },
  },

  es: {
    nav: { demo: 'Demo en vivo', features: 'Funciones', forYou: 'Para quién', lines: 'Las líneas', pricing: 'Precio', faq: 'FAQ', cta: 'Crear mi mapa' },
    badge: 'Encuentra tus mejores lugares con la astrocartografía',
    hero: {
      sr: 'Tu carta natal es secretamente un mapa: descubre dónde prosperas, te enamoras, te sientes en casa y creces.',
      pre: 'Tu', chartChip: 'carta natal', mid: 'es secretamente un', mapWord: 'mapa', seeWhere: 'Descubre dónde',
      cycle: [['prosperas', 'mint'], ['te enamoras', 'rose'], ['te sientes en casa', 'amber'], ['creces', 'lav']],
    },
    heroCta: 'Revelar mis mejores lugares',
    stageHint: 'la app real, en vivo abajo',
    demo: {
      chartLabel: 'Carta demo',
      frameUrl: (name) => `natalnavigator.com · demo en vivo — carta de ${name}`,
      fullscreen: 'Pantalla completa', themeLabel: 'Tema', dark: 'Oscuro', light: 'Claro',
      railNote: 'La app real: gira el globo, activa los planetas, haz clic en cualquier ciudad.',
      railCta: 'Crear mi mapa',
      posterCta: 'Probar la demo en vivo',
      posterAlt: 'Mapa de astrocartografía interactivo — globo 3D con 40 líneas planetarias y ciudades valoradas en la app Natal Navigator',
      iframeTitle: (name) => `Natal Navigator — demo interactiva de astrocartografía (${name})`,
    },
    stats: [['40', 'líneas planetarias'], ['10', 'planetas, del Sol a Plutón'], ['4', 'ángulos · MC IC ASC DSC'], ['345+', 'ciudades valoradas para ti']],
    featuresHead: { label: 'Funciones — lo más importante primero', h2: <>Todo lo que necesita una lectura de astrocartografía.<br /><em>En el orden que importa.</em></> },
    features: [
      { num: '01', title: <>El globo de astrocartografía 3D interactivo</>, lead: 'El corazón de Natal Navigator. Toda tu carta natal proyectada sobre un globo que puedes girar, no una imagen de mapa estática.', points: ['Las 40 líneas planetarias: MC, IC, ASC y DSC para cada planeta, del Sol a Plutón', 'Arrastra, gira y haz zoom en tiempo real — activa cada planeta', 'Tu lugar de nacimiento y cada ciudad de tus líneas, marcados y clicables'], media: { type: 'img', src: '/landing/app-globe.webp', alt: 'Globo de astrocartografía 3D con 40 líneas planetarias, selectores de planetas y ciudades valoradas' } },
      { num: '02', title: <>345+ ciudades, valoradas <em>prosperar / neutral / precaución</em></>, lead: 'La pregunta detrás de cada mapa de astrocartografía es «¿entonces a dónde voy?» — Natal Navigator la responde ciudad por ciudad.', points: ['Cada ciudad evaluada según tus líneas, con la línea exacta y el orbe detrás de la valoración', 'Listas ordenadas: tus zonas de mayor prosperidad y tus zonas de precaución, en todo el mundo', 'Filtra por continente, busca cualquier ciudad, compara candidatas lado a lado'], media: { type: 'ratings' } },
      { num: '03', title: <>Una lectura escrita para cada ciudad</>, lead: 'Las líneas y los porcentajes son datos. Las lecturas los convierten en algo con lo que realmente puedes decidir.', points: ['Interpretaciones personales para carrera, hogar, amor y crecimiento — por ciudad', 'Disponible en inglés y alemán', 'Exporta tu carta completa y tus lecturas en PDF'], media: { type: 'reading' } },
      { num: '04', title: <>Tu carta natal completa, calculada como es debido</>, lead: 'Bajo el mapa hay una carta natal real, calculada a partir de efemérides planetarias, no de tablas de consulta.', points: ['Rueda natal y tabla completa: signos, grados, elementos, retrogradaciones', 'Impulsada por la biblioteca astronomy-engine — precisión por debajo del segundo de arco', 'La misma carta que dibujaría un software de astrología profesional'], media: { type: 'img', src: '/landing/app-natal.webp', alt: 'Panel de carta natal con posiciones planetarias, signos del zodiaco, grados y áreas de vida' } },
      { num: '05', title: <>Globo o mapa plano. Oscuro o claro. Cualquier dispositivo.</>, lead: 'La astrocartografía como prefieres leerla.', points: ['Vista clásica de mapamundi 2D para ver de un vistazo cada cruce de líneas', 'Temas oscuro y claro — cambia cuando quieras', 'Totalmente responsive: móvil, tableta y escritorio'], media: { type: 'img', src: '/landing/app-map-light.webp', alt: 'Mapamundi de astrocartografía 2D en modo claro con líneas planetarias y ciudades valoradas' } },
    ],
    howHead: { label: 'Cómo funciona', h2: <>Tu mapa en <em>tres pasos</em></> },
    steps: [
      ['01', 'Introduce tus datos de nacimiento', 'Fecha, hora exacta y ciudad de nacimiento: eso es todo lo que necesita la astrocartografía. Sin tarjeta, sin test, sin esperas.'],
      ['02', 'Calculamos tu carta', 'Cálculos de efemérides reales con la biblioteca astronomy-engine trazan las 40 líneas planetarias en segundos, con precisión por debajo del segundo de arco, las mismas matemáticas que usa el software profesional.'],
      ['03', 'Explora tu mundo', 'Gira el globo 3D, cambia al mapa plano, abre tu rueda natal y lee por qué cada una de las 345+ ciudades te ayuda a prosperar — o te pone a prueba.'],
    ],
    forYouHead: { label: 'Para quién', h2: <>Hecho para una pregunta:<br /><em>«¿Dónde debería vivir?»</em></>, sub: 'La astrocartografía es para quien sopesa un lugar frente a un sentimiento. Estas son las personas que más le sacan a su mapa.' },
    useCases: [
      ['Nómadas y expatriados', '¿Eligiendo tu próxima base en el extranjero?', 'Compara las ciudades de tu lista con tus líneas de Venus, Júpiter y Sol antes de firmar un alquiler. La astrología de relocalización se hizo justo para esta decisión.'],
      ['Movimientos de carrera', '¿Una oferta de trabajo en otra ciudad?', 'Las líneas Sol MC y Júpiter MC marcan los lugares donde tu trabajo se ve y las oportunidades se acumulan. Mira dónde una mudanza apoya tu ambición — y dónde Saturno la pondrá a prueba.'],
      ['Amor y conexión', '¿Te preguntas dónde conoces a las personas adecuadas?', 'Las líneas de Venus y DSC describen tu geografía relacional: los lugares donde la atracción, la amistad y la pareja llegan con más facilidad.'],
      ['Encontrar hogar', '¿Buscas el lugar que por fin se sienta como hogar?', 'Las líneas de Luna e IC señalan dónde echas raíces, descansas hondo y construyes vida familiar. A menudo no es donde naciste.'],
      ['Viaje con sentido', '¿Planeas un año sabático, un retiro o un gran viaje?', 'Viaja por tus líneas a propósito: una residencia creativa en tu línea de Venus, un reinicio en tu línea de Luna, un lanzamiento audaz en tu Sol MC.'],
      ['Curiosos del astro y pros', '¿Ya lees cartas?', 'Revisa cualquier carta de relocalización en segundos sobre un globo 3D de verdad — con las matemáticas en manos de un motor de efemérides real, no aproximaciones.'],
    ],
    linesHead: { label: 'Las líneas', h2: <>Qué significan tus <em>líneas planetarias</em></>, sub: 'Cada planeta traza cuatro líneas alrededor de la Tierra, una por cada ángulo de tu carta. Planeta × ángulo es toda la gramática de la astrocartografía.' },
    angles: [
      ['MC', 'Medio Cielo', 'Carrera, visibilidad, papel público. En una línea MC, el planeta moldea cómo el mundo ve tu trabajo.'],
      ['IC', 'Fondo del Cielo', 'Hogar, raíces, familia. Las líneas IC tiñen dónde descansas, te retiras y construyes una vida privada.'],
      ['ASC', 'Ascendente', 'Identidad y primeras impresiones. Las líneas ASC cambian cómo te muestras — y cómo te perciben.'],
      ['DSC', 'Descendente', 'Pareja y atracción. Las líneas DSC describen a quién conoces y qué te piden las relaciones.'],
    ],
    planetLines: [
      ['Línea de Sol', 'Vitalidad y reconocimiento. Lugares donde te sientes visto, central e inconfundiblemente tú.'],
      ['Línea de Luna', 'Emoción y pertenencia. Donde la vida se vuelve hacia dentro: consuelo, intuición y sentido de hogar.'],
      ['Línea de Venus', 'Amor, belleza y facilidad. Territorio clásico para el romance, la amistad, el arte y el placer.'],
      ['Línea de Júpiter', 'Suerte y expansión. Oportunidades, mentores y crecimiento suelen llegar más rápido aquí.'],
      ['Línea de Saturno', 'Disciplina y pruebas. Terreno exigente: progreso lento y estructural para quien se queda.'],
    ],
    more: <>¿Quieres toda la teoría? Lee la <a href="/astrocartography">guía completa de astrocartografía</a>{' '}— también disponible <a href="/astrokartographie">en alemán</a>.</>,
    whyHead: { label: 'Por qué Natal Navigator', h2: <>Hay otros calculadores de astrocartografía.<br /><em>Esta es la diferencia honesta.</em></> },
    why: [
      'Demo interactiva en vivo con cartas de ejemplo antes de crear tu mapa personal',
      'Un globo 3D de verdad, no una imagen de mapa estática',
      '345+ ciudades valoradas y explicadas por escrito, no solo líneas en un mapa',
      'Precisión de efemérides por debajo del segundo de arco (astronomy-engine)',
      '4,99 € una vez. No otra suscripción',
      'Inglés y alemán, export PDF, funciona en cualquier dispositivo',
      'Tus datos de nacimiento siguen privados: nunca se venden, borrables cuando quieras',
    ],
    pricingHead: { label: 'Precio', h2: <>Paga una vez. <em>Quédatelo para siempre.</em></>, sub: 'Sin suscripción, sin niveles ocultos. Prueba todo en la demo primero.' },
    pricing: {
      explorerTier: 'Explorer', demoWord: 'Demo', explorerSub: 'La experiencia completa de la app con cartas de ejemplo famosas.',
      explorerList: ['Globo y mapa de demo interactivos', '5 cartas de famosos para explorar', 'Vista previa de valoraciones y lecturas de ciudades'],
      demoBtn: 'Probar la demo en vivo', flag: 'Más popular', navigatorTier: 'Navigator', price: '4,99 €', oneTime: 'pago único',
      navigatorSub: 'Tu mapa de astrocartografía personal, de por vida.', navigatorBtn: 'Consigue tu mapa — 4,99 €',
    },
    premiumFeatures: ['Tu globo 3D y mapa plano personales', 'Las 40 líneas planetarias — del Sol a Plutón', '345+ ciudades valoradas: prosperar / neutral / precaución', 'Lecturas personales para cada ciudad', 'Rueda natal completa y tabla', 'Export PDF de tu carta completa', 'Acceso de por vida — paga una vez, quédatelo para siempre'],
    faqHead: { label: 'FAQ', h2: <>Preguntas, <em>respondidas</em></> },
    faqs: [
      ['¿Qué es la astrocartografía?', 'La astrocartografía —también llamada astrología local o de relocalización— proyecta tu carta natal sobre el mapamundi. Para cada planeta traza cuatro líneas (MC, IC, ASC, DSC) que muestran dónde estaba ese planeta en un ángulo al nacer. Vivir sobre o cerca de una línea se lee como vivir más intensamente los temas de ese planeta en ese lugar.'],
      ['¿Cuánto cuesta Natal Navigator?', 'Puedes explorar primero la demo interactiva con cartas de ejemplo. Tu mapa de astrocartografía personal —las 40 líneas planetarias, 345+ ciudades valoradas, rueda natal y export PDF— cuesta un pago único de 4,99 €. Sin suscripción, acceso de por vida.'],
      ['¿Para quién es la astrocartografía?', 'Para cualquiera que sopese un lugar frente a un sentimiento: nómadas digitales y expatriados eligiendo base, profesionales que valoran una relocalización, personas que buscan dónde el hogar o el amor llega más fácil, y viajeros que quieren que sus viajes signifiquen algo. No necesitas conocimientos de astrología: las lecturas lo explican todo.'],
      ['¿Qué cartas puedo explorar en la demo?', 'La demo interactiva te deja alternar entre los mapas de astrocartografía de Elon Musk, Albert Einstein, Marilyn Monroe, Steve Jobs y Frida Kahlo, todos basados en datos de nacimiento públicamente documentados. Es la app completa, solo que con una carta famosa en lugar de la tuya.'],
      ['¿Qué precisión tienen los cálculos?', 'Natal Navigator usa la biblioteca de efemérides astronomy-engine para calcular posiciones planetarias reales con precisión por debajo del segundo de arco, sin tablas ni aproximaciones. Las posiciones de las líneas coinciden con el software de astrología profesional.'],
      ['¿Necesito mi hora de nacimiento exacta?', 'Sí, para un mapa significativo. Los ángulos (MC, IC, ASC, DSC) se mueven alrededor de un grado cada cuatro minutos, así que incluso 15 minutos pueden desplazar tus líneas cientos de kilómetros. Revisa tu acta de nacimiento si tienes dudas.'],
      ['¿Puede la astrocartografía decirme dónde vivir?', 'Es una herramienta de reflexión, no un veredicto. Tu mapa resalta lugares cuyos temas planetarios apoyan la carrera (MC), el hogar (IC), la identidad (ASC) o las relaciones (DSC). Natal Navigator valora 345+ ciudades como zonas de prosperar, neutrales o de precaución para comparar — la decisión es tuya.'],
      ['¿Diferencia entre carta natal y mapa de astrocartografía?', 'Tu carta natal es una instantánea del cielo al nacer: te describe a ti. Un mapa de astrocartografía toma esa misma carta y pregunta dónde en la Tierra cada planeta saldría, se pondría o culminaría: te describe en algún lugar. Natal Navigator muestra ambos, lado a lado.'],
      ['¿Qué es una línea de Venus?', 'Una línea de Venus marca los lugares donde Venus salía, se ponía, culminaba o anti-culminaba al nacer. Las líneas de Venus se leen tradicionalmente como la geografía más fácil y agradable de una carta: favorable para el amor, la amistad, la belleza y el dinero.'],
      ['¿Mis datos de nacimiento son privados?', 'Sí. Tus datos de nacimiento se guardan de forma segura, nunca se venden ni se comparten. Puedes borrar tu cuenta —y todos los datos con ella— cuando quieras.'],
    ],
    final: { h2: <>Tus estrellas ya están alineadas.<br /><em>Mira dónde.</em></>, sub: 'Dos minutos del acta de nacimiento al mapamundi.', ctaCreate: 'Crear mi mapa', ctaDemo: 'Probar la demo primero' },
    meta: { title: 'Mapa y calculadora de astrocartografía — Natal Navigator', desc: 'Convierte tu carta natal en un mapa vivo. Calculadora de astrocartografía interactiva con globo 3D, 40 líneas planetarias y 345+ ciudades valoradas para carrera, amor y hogar.' },
    mock: {
      thrive: 'Prosperar', neutral: 'Neutral', caution: 'Precaución',
      readingQuote: <>«Lisboa está en tu línea <strong>Venus MC</strong>, uno de los lugares más gráciles para tu vida pública. El trabajo se siente social, las puertas se abren a través de gente que simplemente te aprecia, y lo que creas aquí tiende a ser bello…»</>,
      readingCaption: '— lectura de ciudad de ejemplo',
      tags: ['Carrera y vida pública', 'Hogar y raíces', 'Amor y conexión', 'Export PDF', 'EN · DE'],
    },
  },

  it: {
    nav: { demo: 'Demo dal vivo', features: 'Funzioni', forYou: 'Per chi', lines: 'Le linee', pricing: 'Prezzo', faq: 'FAQ', cta: 'Crea la mia mappa' },
    badge: 'Trova i tuoi luoghi migliori con l’astrocartografia',
    hero: {
      sr: 'Il tuo tema natale è segretamente una mappa: scopri dove prosperi, ti innamori, ti senti a casa e cresci.',
      pre: 'Il tuo', chartChip: 'tema natale', mid: 'è segretamente una', mapWord: 'mappa', seeWhere: 'Scopri dove',
      cycle: [['prosperi', 'mint'], ['ti innamori', 'rose'], ['ti senti a casa', 'amber'], ['cresci', 'lav']],
    },
    heroCta: 'Rivela i miei luoghi migliori',
    stageHint: 'l’app vera, dal vivo qui sotto',
    demo: {
      chartLabel: 'Tema demo',
      frameUrl: (name) => `natalnavigator.com · demo dal vivo — tema di ${name}`,
      fullscreen: 'Schermo intero', themeLabel: 'Tema', dark: 'Scuro', light: 'Chiaro',
      railNote: 'L’app vera: ruota il globo, attiva i pianeti, clicca su qualsiasi città.',
      railCta: 'Crea la mia mappa',
      posterCta: 'Prova la demo dal vivo',
      posterAlt: 'Mappa di astrocartografia interattiva — globo 3D con 40 linee planetarie e città valutate nell’app Natal Navigator',
      iframeTitle: (name) => `Natal Navigator — demo interattiva di astrocartografia (${name})`,
    },
    stats: [['40', 'linee planetarie'], ['10', 'pianeti, dal Sole a Plutone'], ['4', 'angoli · MC IC ASC DSC'], ['345+', 'città valutate per te']],
    featuresHead: { label: 'Funzioni — prima ciò che conta di più', h2: <>Tutto ciò che serve a una lettura di astrocartografia.<br /><em>Nell’ordine che conta.</em></> },
    features: [
      { num: '01', title: <>Il globo di astrocartografia 3D interattivo</>, lead: 'Il cuore di Natal Navigator. Tutto il tuo tema natale proiettato su un globo che puoi ruotare, non un’immagine statica.', points: ['Tutte le 40 linee planetarie: MC, IC, ASC e DSC per ogni pianeta, dal Sole a Plutone', 'Trascina, ruota e zooma in tempo reale — attiva ogni pianeta', 'Il tuo luogo di nascita e ogni città sulle tue linee, segnati e cliccabili'], media: { type: 'img', src: '/landing/app-globe.webp', alt: 'Globo di astrocartografia 3D con 40 linee planetarie, selettori di pianeti e città valutate' } },
      { num: '02', title: <>345+ città, valutate <em>prosperare / neutro / cautela</em></>, lead: 'La domanda dietro ogni mappa di astrocartografia è «e allora dove vado?» — Natal Navigator risponde città per città.', points: ['Ogni città valutata rispetto alle tue linee, con la linea esatta e l’orbita dietro il punteggio', 'Liste ordinate: le tue zone di maggiore prosperità e le tue zone di cautela, nel mondo', 'Filtra per continente, cerca qualsiasi città, confronta le candidate fianco a fianco'], media: { type: 'ratings' } },
      { num: '03', title: <>Una lettura scritta per ogni città</>, lead: 'Linee e percentuali sono dati. Le letture li trasformano in qualcosa con cui puoi davvero decidere.', points: ['Interpretazioni personali per carriera, casa, amore e crescita — per città', 'Disponibile in inglese e tedesco', 'Esporta il tuo tema completo e le letture in PDF'], media: { type: 'reading' } },
      { num: '04', title: <>Il tuo tema natale completo, calcolato come si deve</>, lead: 'Sotto la mappa c’è un vero tema natale, calcolato dalle effemeridi planetarie, non da tabelle.', points: ['Ruota natale e tabella completa: segni, gradi, elementi, retrogradazioni', 'Basato sulla libreria astronomy-engine — precisione sotto il secondo d’arco', 'Lo stesso tema che disegnerebbe un software di astrologia professionale'], media: { type: 'img', src: '/landing/app-natal.webp', alt: 'Pannello del tema natale con posizioni planetarie, segni zodiacali, gradi e ambiti di vita' } },
      { num: '05', title: <>Globo o mappa piatta. Scuro o chiaro. Ogni dispositivo.</>, lead: 'L’astrocartografia come preferisci leggerla.', points: ['Vista classica a mappamondo 2D per cogliere a colpo d’occhio ogni incrocio di linee', 'Temi scuro e chiaro — cambia quando vuoi', 'Completamente responsive: telefono, tablet e desktop'], media: { type: 'img', src: '/landing/app-map-light.webp', alt: 'Mappamondo di astrocartografia 2D in modalità chiara con linee planetarie e città valutate' } },
    ],
    howHead: { label: 'Come funziona', h2: <>La tua mappa in <em>tre passi</em></> },
    steps: [
      ['01', 'Inserisci i tuoi dati di nascita', 'Data, ora esatta e città di nascita: è tutto ciò che serve all’astrocartografia. Niente carta, niente quiz, niente attese.'],
      ['02', 'Calcoliamo il tuo tema', 'Veri calcoli di effemeridi con la libreria astronomy-engine tracciano le 40 linee planetarie in secondi, con precisione sotto il secondo d’arco, la stessa matematica dei software professionali.'],
      ['03', 'Esplora il tuo mondo', 'Ruota il globo 3D, passa alla mappa piatta, apri la ruota natale e leggi perché ognuna delle 345+ città ti fa prosperare — o ti mette alla prova.'],
    ],
    forYouHead: { label: 'Per chi', h2: <>Fatto per una domanda:<br /><em>«Dove dovrei vivere?»</em></>, sub: 'L’astrocartografia è per chiunque soppesi un luogo contro una sensazione. Ecco chi ne ricava di più.' },
    useCases: [
      ['Nomadi ed espatriati', 'Stai scegliendo la prossima base all’estero?', 'Confronta le città della tua rosa con le tue linee di Venere, Giove e Sole prima di firmare un affitto. L’astrologia di rilocazione è nata proprio per questa decisione.'],
      ['Mosse di carriera', 'Un’offerta di lavoro in un’altra città?', 'Le linee Sole MC e Giove MC segnano i luoghi dove il tuo lavoro viene visto e le occasioni si accumulano. Vedi dove un trasloco sostiene la tua ambizione — e dove Saturno la metterà alla prova.'],
      ['Amore e legami', 'Ti chiedi dove incontri le persone giuste?', 'Le linee di Venere e DSC descrivono la tua geografia relazionale: i luoghi dove attrazione, amicizia e relazioni arrivano più facilmente.'],
      ['Trovare casa', 'Cerchi il luogo che finalmente sembri casa?', 'Le linee di Luna e IC indicano dove metti radici, riposi a fondo e costruisci la vita familiare. Spesso non è dove sei nato.'],
      ['Viaggi che contano', 'Stai pianificando un’aspettativa, un ritiro o un grande viaggio?', 'Viaggia lungo le tue linee con intenzione: una residenza creativa sulla linea di Venere, un reset sulla linea di Luna, un lancio audace sul tuo Sole MC.'],
      ['Curiosi di astro e pro', 'Leggi già i temi?', 'Controlla qualsiasi tema di rilocazione in secondi su un vero globo 3D — con la matematica gestita da un vero motore di effemeridi, non da approssimazioni.'],
    ],
    linesHead: { label: 'Le linee', h2: <>Cosa significano le tue <em>linee planetarie</em></>, sub: 'Ogni pianeta traccia quattro linee attorno alla Terra, una per ogni angolo del tema. Pianeta × angolo è tutta la grammatica dell’astrocartografia.' },
    angles: [
      ['MC', 'Medio Cielo', 'Carriera, visibilità, ruolo pubblico. Su una linea MC il pianeta plasma come il mondo vede il tuo lavoro.'],
      ['IC', 'Fondo Cielo', 'Casa, radici, famiglia. Le linee IC colorano dove riposi, ti ritiri e costruisci una vita privata.'],
      ['ASC', 'Ascendente', 'Identità e prime impressioni. Le linee ASC cambiano come ti presenti — e come ti leggono.'],
      ['DSC', 'Discendente', 'Relazioni e attrazione. Le linee DSC descrivono chi incontri e cosa ti chiedono le relazioni.'],
    ],
    planetLines: [
      ['Linea del Sole', 'Vitalità e riconoscimento. Luoghi dove ti senti visto, centrale e inconfondibilmente te stesso.'],
      ['Linea della Luna', 'Emozione e appartenenza. Dove la vita si volge all’interno: conforto, intuizione e senso di casa.'],
      ['Linea di Venere', 'Amore, bellezza e leggerezza. Territorio classico per romanticismo, amicizia, arte e piacere.'],
      ['Linea di Giove', 'Fortuna ed espansione. Occasioni, mentori e crescita tendono ad arrivare più in fretta qui.'],
      ['Linea di Saturno', 'Disciplina e prove. Terreno esigente: progresso lento e strutturale per chi resta.'],
    ],
    more: <>Vuoi tutta la teoria? Leggi la <a href="/astrocartography">guida completa all’astrocartografia</a>{' '}— disponibile anche <a href="/astrokartographie">in tedesco</a>.</>,
    whyHead: { label: 'Perché Natal Navigator', h2: <>Esistono altri calcolatori di astrocartografia.<br /><em>Ecco la differenza, onestamente.</em></> },
    why: [
      'Demo interattiva dal vivo con temi di esempio prima di creare la tua mappa personale',
      'Un vero globo 3D, non un’immagine statica',
      '345+ città valutate e spiegate per iscritto, non solo linee su una mappa',
      'Precisione delle effemeridi sotto il secondo d’arco (astronomy-engine)',
      '4,99 € una volta. Non l’ennesimo abbonamento',
      'Inglese e tedesco, export PDF, funziona su ogni dispositivo',
      'I tuoi dati di nascita restano privati: mai venduti, eliminabili quando vuoi',
    ],
    pricingHead: { label: 'Prezzo', h2: <>Paghi una volta. <em>È tuo per sempre.</em></>, sub: 'Nessun abbonamento, nessun livello nascosto. Prova tutto prima nella demo.' },
    pricing: {
      explorerTier: 'Explorer', demoWord: 'Demo', explorerSub: 'L’esperienza completa dell’app con temi di esempio famosi.',
      explorerList: ['Globo e mappa demo interattivi', '5 temi di celebrità da esplorare', 'Anteprima di valutazioni e letture delle città'],
      demoBtn: 'Prova la demo dal vivo', flag: 'Più popolare', navigatorTier: 'Navigator', price: '4,99 €', oneTime: 'pagamento unico',
      navigatorSub: 'La tua mappa di astrocartografia personale, per sempre.', navigatorBtn: 'Ottieni la mappa — 4,99 €',
    },
    premiumFeatures: ['Il tuo globo 3D e mappa piatta personali', 'Tutte le 40 linee planetarie — dal Sole a Plutone', '345+ città valutate: prosperare / neutro / cautela', 'Letture personali per ogni città', 'Ruota natale completa e tabella', 'Export PDF del tuo tema completo', 'Accesso a vita — paghi una volta, è tuo per sempre'],
    faqHead: { label: 'FAQ', h2: <>Domande, <em>risposte</em></> },
    faqs: [
      ['Cos’è l’astrocartografia?', 'L’astrocartografia — detta anche astrologia locale o di rilocazione — proietta il tuo tema natale sulla mappa del mondo. Per ogni pianeta traccia quattro linee (MC, IC, ASC, DSC) che mostrano dove quel pianeta era angolare alla tua nascita. Vivere su o vicino a una linea si legge come vivere più intensamente i temi di quel pianeta in quel luogo.'],
      ['Quanto costa Natal Navigator?', 'Puoi prima esplorare la demo interattiva con temi di esempio. La tua mappa di astrocartografia personale — tutte le 40 linee planetarie, 345+ città valutate, ruota natale ed export PDF — costa un pagamento unico di 4,99 €. Nessun abbonamento, accesso a vita.'],
      ['Per chi è l’astrocartografia?', 'Per chiunque soppesi un luogo contro una sensazione: nomadi digitali ed espatriati che scelgono una base, professionisti che valutano una rilocazione, chi cerca dove casa o amore arrivino più facilmente, e viaggiatori che vogliono viaggi pieni di senso. Non serve alcuna conoscenza di astrologia: le letture spiegano tutto.'],
      ['Quali temi posso esplorare nella demo?', 'La demo interattiva ti permette di passare tra le mappe di astrocartografia di Elon Musk, Albert Einstein, Marilyn Monroe, Steve Jobs e Frida Kahlo, tutte basate su dati di nascita pubblicamente documentati. È l’app completa, solo con un tema famoso al posto del tuo.'],
      ['Quanto sono precisi i calcoli?', 'Natal Navigator usa la libreria di effemeridi astronomy-engine per calcolare posizioni planetarie reali con precisione sotto il secondo d’arco, senza tabelle né approssimazioni. Le posizioni delle linee corrispondono ai software di astrologia professionali.'],
      ['Mi serve l’ora di nascita esatta?', 'Sì, per una mappa significativa. Gli angoli (MC, IC, ASC, DSC) si muovono di circa un grado ogni quattro minuti, quindi anche 15 minuti possono spostare le tue linee di centinaia di chilometri. Controlla il certificato di nascita se hai dubbi.'],
      ['L’astrocartografia può dirmi dove vivere?', 'È uno strumento di riflessione, non un verdetto. La tua mappa evidenzia luoghi i cui temi planetari sostengono carriera (MC), casa (IC), identità (ASC) o relazioni (DSC). Natal Navigator valuta 345+ città come zone di prosperità, neutre o di cautela per confrontare — la decisione resta tua.'],
      ['Differenza tra tema natale e mappa di astrocartografia?', 'Il tuo tema natale è un’istantanea del cielo alla nascita: descrive te. Una mappa di astrocartografia prende lo stesso tema e chiede dove sulla Terra ogni pianeta sorgerebbe, tramonterebbe o culminerebbe: ti descrive da qualche parte. Natal Navigator mostra entrambi, fianco a fianco.'],
      ['Cos’è una linea di Venere?', 'Una linea di Venere segna i luoghi dove Venere sorgeva, tramontava, culminava o anti-culminava alla tua nascita. Le linee di Venere si leggono tradizionalmente come la geografia più facile e piacevole di un tema: favorevole ad amore, amicizia, bellezza e denaro.'],
      ['I miei dati di nascita sono privati?', 'Sì. I tuoi dati di nascita sono conservati in modo sicuro, mai venduti né condivisi. Puoi eliminare il tuo account — e tutti i dati con esso — quando vuoi.'],
    ],
    final: { h2: <>Le tue stelle sono già allineate.<br /><em>Scopri dove.</em></>, sub: 'Due minuti dal certificato di nascita alla mappa del mondo.', ctaCreate: 'Crea la mia mappa', ctaDemo: 'Prova prima la demo' },
    meta: { title: 'Mappa e calcolatore di astrocartografia — Natal Navigator', desc: 'Trasforma il tuo tema natale in una mappa viva. Calcolatore di astrocartografia interattivo con globo 3D, 40 linee planetarie e 345+ città valutate per carriera, amore e casa.' },
    mock: {
      thrive: 'Prosperare', neutral: 'Neutro', caution: 'Cautela',
      readingQuote: <>«Lisbona si trova sulla tua linea <strong>Venere MC</strong>, uno dei luoghi più aggraziati per la tua vita pubblica. Il lavoro è sociale, le porte si aprono grazie a persone che semplicemente ti apprezzano, e ciò che crei qui tende a essere bello…»</>,
      readingCaption: '— esempio di lettura di città',
      tags: ['Carriera e vita pubblica', 'Casa e radici', 'Amore e legami', 'Export PDF', 'EN · DE'],
    },
  },
};
