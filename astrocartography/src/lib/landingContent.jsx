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
};
