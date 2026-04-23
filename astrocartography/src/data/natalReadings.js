// ── Multilingual Natal Readings ──
// Smart synthesizer that produces astrologically rigorous, non-repetitive
// personality paragraphs for the natal chart detail view.
//
// Architecture
// ────────────
//   1. Lexicon (natalLexicon.js) — sign / planet / house data with multiple
//      independent variants per slot (NOT synonym lists).
//   2. Marquee overrides — 24 hand-tuned paragraphs for the most-judged
//      placements (personal planets in domicile / detriment, plus Saturn
//      and Jupiter dignities). Composer checks this map first.
//   3. Composer — picks variants by stable hash, applies a dignity-aware
//      modifier (domicile / exaltation / detriment / fall), modulates tone
//      by house section (angular / succedent / cadent), and runs an
//      anti-repetition guard that rejects combinations whose content words
//      collide.
//   4. Forbidden-phrase filter — any output containing the old filler
//      ("you notice this influence...", "this is obvious in the way...",
//      etc.) is regenerated from the next variant ring.
//
// Export shape preserved exactly:
//   getNatalReadings(lang) -> {
//     PLANET_IN_SIGN: { 'Sun-Aries': { title, text }, ... },
//     PLANET_IN_HOUSE:{ 'Sun-1':     { title, text }, ... },
//     ASC_IN_SIGN:    { 'Aries':     { title, text }, ... },
//     MC_IN_SIGN:     { 'Aries':     { title, text }, ... },
//     PLANET_INFO, HOUSE_INFO,
//   }
//
// Non-English languages: fall back to the legacy i18n composer for now.
// Phase 3 will regenerate translations against this new lexicon.

import {
  SIGNS, PLANETS, HOUSES, ORDINALS,
  ASC_NOTES, MC_NOTES,
  MARQUEE_PLANET_SIGN,
  PLANET_GLYPHS, PLANET_RULES, PLANET_KEYWORDS, PLANET_DESCRIPTIONS,
  HOUSE_KEYWORDS, HOUSE_DESCRIPTIONS,
} from './natalLexicon.js';

import { NATAL_I18N } from './natalReadingsI18n.js';
import { NATAL_I18N_2 } from './natalReadingsI18n2.js';

const ALL_I18N = { ...(NATAL_I18N || {}), ...(NATAL_I18N_2 || {}) };

const PLANET_LIST = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const SIGN_LIST   = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const HOUSE_LIST  = [1,2,3,4,5,6,7,8,9,10,11,12];

// ─────────────────────────────────────────────────────────────────────
// Hashing — stable, spread variant rotation across neighboring combos
// ─────────────────────────────────────────────────────────────────────

function hash32(str) {
  // FNV-1a — small, deterministic, no deps
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pick(arr, key, salt) {
  if (!arr || !arr.length) return '';
  const idx = hash32(key + '|' + salt) % arr.length;
  return arr[idx];
}

// Round-robin a list of N candidate picks, deterministic per key.
function pickRotation(arr, key, salt, max) {
  const out = [];
  if (!arr || !arr.length) return out;
  const start = hash32(key + '|' + salt) % arr.length;
  const cap = Math.min(max ?? arr.length, arr.length);
  for (let i = 0; i < cap; i++) out.push(arr[(start + i) % arr.length]);
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Anti-repetition — tokenize and reject paragraphs whose content words
// collide. We compare CONTENT words (>4 chars, not stop-words).
// ─────────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  // articles, pronouns, common verbs/adverbs
  'about','above','again','against','almost','already','also','always','among','another','around','because',
  'become','becomes','before','being','below','between','beyond','built','cannot','clearly','could','course',
  'doing','during','either','enough','every','except','feels','fully','genuine','given','goods','great','having',
  'hence','include','includes','inside','instead','into','itself','keeps','later','least','leave','leaves','letting',
  'lives','lived','lives','looks','makes','making','making','many','matter','matters','means','might','more','most',
  'much','must','myself','natural','naturally','needs','never','nothing','offer','offers','often','only','onto',
  'other','others','ought','ourselves','outside','over','others','perhaps','place','places','please','plenty','quite',
  'rather','really','same','seems','seems','share','shares','should','since','some','someone','something','sometimes',
  'still','such','take','takes','than','that','their','them','themselves','then','there','these','they','thing',
  'things','this','those','though','through','toward','towards','under','until','very','want','wants','wanted',
  'were','what','whatever','when','where','which','while','whose','will','with','within','without','would',
  'your','yours','yourself','yourselves','itself','heavily','from','here','have','here','this','that','around',
  'much','well','room','rooms','came','come','comes','will','have','your',
  // astrologically generic — common across many lexicon entries; safe to stop
  'planet','planets','sign','signs','house','houses','here','there',
]);

function contentTokens(s) {
  if (!s) return [];
  const lc = s.toLowerCase();
  // strip punctuation, keep apostrophes inside words
  const cleaned = lc.replace(/[^a-z\u00c0-\u017f' \-]/g, ' ');
  const words = cleaned.split(/\s+/).filter(Boolean);
  const out = [];
  for (const w of words) {
    if (w.length <= 4) continue;
    if (STOP_WORDS.has(w)) continue;
    // strip a trailing 's'/'ing'/'ed' for crude stem matching
    let stem = w;
    if (stem.endsWith("'s")) stem = stem.slice(0, -2);
    if (stem.length > 6 && stem.endsWith('ing')) stem = stem.slice(0, -3);
    else if (stem.length > 6 && stem.endsWith('ed')) stem = stem.slice(0, -2);
    else if (stem.length > 5 && stem.endsWith('s'))  stem = stem.slice(0, -1);
    out.push(stem);
  }
  return out;
}

function hasCollision(...fragments) {
  const seen = new Set();
  for (const frag of fragments) {
    const tokens = contentTokens(frag);
    for (const tk of tokens) {
      if (seen.has(tk)) return tk;
      seen.add(tk);
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// Forbidden-phrase guard — kills the legacy filler if it ever resurfaces
// ─────────────────────────────────────────────────────────────────────

const FORBIDDEN = [
  /you notice this influence clearly/i,
  /this is obvious in the way/i,
  /and this is something you can/i,
  /you may experience this in your daily life/i,
  /supported by\s+\w+,?\s*\w*,?\s*and the/i, // the original "X, supported by X" shape
];

function passesForbidden(text) {
  for (const re of FORBIDDEN) if (re.test(text)) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────────
// Dignity — Western canonical
// ─────────────────────────────────────────────────────────────────────

function dignityOf(planet, sign) {
  const p = PLANETS[planet];
  if (!p || !p.dignity) return 'neutral';
  const d = p.dignity;
  if (d.domicile?.includes(sign))   return 'domicile';
  if (d.exaltation?.includes(sign)) return 'exaltation';
  if (d.detriment?.includes(sign))  return 'detriment';
  if (d.fall?.includes(sign))       return 'fall';
  return 'neutral';
}

// Dignity-modifier sentence stems. Picked by hash so neighboring combos vary.
const DIGNITY_LINES = {
  domicile: [
    'and here this works with the natural ease of a planet at its own address',
    'and the placement reads as fluent — there is little translation cost in this combination',
    'and the expression is unforced, as if the sign and planet were already speaking the same dialect',
    'and the result is a rare alignment: planet and sign want the same thing without negotiation',
  ],
  exaltation: [
    'and here the planet is amplified, almost showy in its preferred form',
    'and the expression arrives raised — clearer, brighter, harder to miss than usual',
    'and the placement performs above its baseline; the sign lifts what the planet already knows how to do',
    'and there is an exalted edge to it, a quality of the planet at slightly more than its ordinary register',
  ],
  detriment: [
    'and here the expression goes against the grain — the planet has to work in a sign that pulls in the other direction',
    'and the combination produces real friction; the planet is asked to operate through values it does not naturally share',
    'and there is grit in this placement: the gift is real but it has to be earned against the tilt of the sign',
    'and the planet lives here in exile, which often becomes its own kind of strength once the friction is owned',
  ],
  fall: [
    'and the planet sits subtly here, often deferring to the sign rather than asserting through it',
    'and the expression tends to whisper rather than declare — the placement is in fall, so the gift moves quietly',
    'and the planet operates at a gentler register here, easier to underestimate, slower to claim its own ground',
    'and there is a humbling in this placement; the planet learns by serving rather than by leading',
  ],
  neutral: [
    'and the placement reads as workable — neither at home nor in exile, but capable of becoming either depending on use',
    'and the combination has its own particular flavor, neither flattered nor afflicted, just specifically itself',
    'and the placement is a fair partnership: the planet adapts to the sign, and the sign returns the favor',
    'and the expression is neither amplified nor opposed — what you do with it matters more than what it does to you',
  ],
};

// ─────────────────────────────────────────────────────────────────────
// Sentence-template rotation for Planet-in-Sign
// Each template uses field substitution. Picked by hash so neighboring
// combos read structurally distinct.
// ─────────────────────────────────────────────────────────────────────

const PIS_TEMPLATES = [
  // 0 — "X in Y is..." opener, dignity-integrated, exemplar-style
  ({pl, sg, plRep, sgExpr, sgStr, sgChl, plChl, dignityLine, growth}) =>
    `${pl} in ${sg} carries ${plRep}, in a sign that runs on being ${sgExpr}${dignityLine ? '. ' + cap(dignityLine) : ''}. ` +
    `The strength is ${sgStr}. ` +
    `The trap is ${sgChl} — and in this combination it tends to surface as ${plChl}. ` +
    `This placement matures ${growth}.`,

  // 1 — opens with the sign's archetype
  ({pl, sg, plRep, sgArche, sgExpr, sgStr, plChl, dignityLine, growth}) =>
    `With ${pl} in ${sg}, ${plRep} expresses through ${sgArche} — ${sgExpr}${dignityLine ? ', ' + dignityLine : ''}. ` +
    `One strength is ${sgStr}. ` +
    `The work is to keep this from sliding into ${plChl}. ` +
    `The placement comes into its own ${growth}.`,

  // 2 — opens with the planet's domain
  ({pl, sg, plDomain, sgExpr, plStr, sgChl, dignityLine, growth}) =>
    `${pl} colors ${plDomain}, and in ${sg} that influence becomes ${sgExpr}${dignityLine ? '. ' + cap(dignityLine) : ''}. ` +
    `At its best, this gives you ${plStr}. ` +
    `The risk is ${sgChl}. ` +
    `It earns its full register ${growth}.`,

  // 3 — opens with the felt experience
  ({pl, sg, plRep, sgStr, plChl, dignityLine, growth}) =>
    `Your ${pl} placement in ${sg} shapes ${plRep} into a specifically ${SIGNS[sg]?.element?.toLowerCase() || 'distinct'}, ${SIGNS[sg]?.modality?.toLowerCase() || 'particular'} register${dignityLine ? ' — ' + dignityLine : ''}. ` +
    `The gift here is ${sgStr}. ` +
    `The shadow side runs through ${plChl}. ` +
    `Maturity here arrives ${growth}.`,

  // 4 — opens with a contrast structure
  ({pl, sg, sgArche, sgExpr, plStr, sgChl, dignityLine, growth}) =>
    `${pl} in ${sg} is the planet of action and intention meeting ${sgArche}, which produces a presence that is ${sgExpr}${dignityLine ? '. ' + cap(dignityLine) : ''}. ` +
    `The strength is ${plStr}. ` +
    `The pitfall is ${sgChl}. ` +
    `This combination ripens ${growth}.`,

  // 5 — direct, exemplar-style (closest to the Mars-Aries template)
  ({pl, sg, plRep, sgExpr, sgStr, sgChl, dignityLine, growth}) =>
    `${pl} in ${sg} brings ${plRep} into a register that is ${sgExpr}${dignityLine ? ' — ' + dignityLine : ''}. ` +
    `What this gives you is ${sgStr}. ` +
    `What it asks you to watch is ${sgChl}. ` +
    `The placement is at its best ${growth}.`,
];

// ─────────────────────────────────────────────────────────────────────
// Sentence-template rotation for Planet-in-House
// ─────────────────────────────────────────────────────────────────────

const SECTION_FLAVOR = {
  angular: [
    'placed angularly, this lives front and center — the influence is one of the first things the chart actually does',
    'in an angular house, the planet is loud rather than quiet, asserting itself through the visible hours of life',
    'as an angular placement, this is structural — it shapes the chart from one of the four cardinal turning points',
  ],
  succedent: [
    'in a succedent house, the planet stabilizes rather than initiates — its work is to hold and consolidate',
    'placed succedently, this builds slowly and accumulates — the influence is a long compound rather than a single strike',
    'in a succedent position, the planet operates as a steadying force, securing what an angular placement begins',
  ],
  cadent: [
    'in a cadent house, the planet processes in the background — much of its work happens before it shows',
    'placed cadently, this lives in the integrating layer — learning, adapting, distilling rather than declaring',
    'as a cadent placement, the influence is interior — it shapes the chart through how it digests experience, not how it announces it',
  ],
};

const PIH_TEMPLATES = [
  // 0
  ({pl, hsTitle, hsExpr, plDomain, sectionLine}) =>
    `With ${pl} in the ${hsTitle}, ${plDomain} ${hsExpr}. ` +
    `${cap(sectionLine)}.`,
  // 1
  ({pl, hsTitle, hsExpr, plDomain, sectionLine}) =>
    `${pl} in the ${hsTitle} means ${plDomain} ${hsExpr}, which gives this whole area of life a particular signature. ` +
    `${cap(sectionLine)}.`,
  // 2
  ({pl, hsTitle, hsExpr, plDomain, sectionLine}) =>
    `Your ${pl} occupies the ${hsTitle}, so ${plDomain} ${hsExpr}. ` +
    `${cap(sectionLine)}.`,
  // 3
  ({pl, hsTitle, hsExpr, plDomain, sectionLine}) =>
    `Because ${pl} sits in the ${hsTitle}, ${plDomain} ${hsExpr} — and that becomes one of the more recognizable through-lines of the chart. ` +
    `${cap(sectionLine)}.`,
];

// Closer sentences for planet-in-house. Two-sentence variants by planet,
// rotated by hash. Each is specific to the planet and avoids generic filler.
const PIH_CLOSERS = {
  Sun: [
    'You tend to come most alive when this part of life is being shaped on your own terms.',
    'Recognition tends to follow the work you do here, even when recognition was not the point.',
    'The vitality is real here — the area becomes a place you grow more fully into yourself.',
  ],
  Moon: [
    'Your sense of safety rises and falls with this area more than most people realize from outside.',
    'You read the emotional weather of this domain quickly, and you tend to take its temperature personally.',
    'This is one of the places your inner life keeps house — protect it, and it protects the rest of you.',
  ],
  Mercury: [
    'You are usually thinking, naming, or rearranging this area in language, even when you are not actively working on it.',
    'Conversation, study, and quick coordination tend to gather around this domain naturally.',
    'You become genuinely skillful here whenever the work involves moving information well.',
  ],
  Venus: [
    'You instinctively try to bring beauty, ease, or fairness into this part of life.',
    'Bonds and pleasures attached to this domain matter to you in a way that shapes long-term choices.',
    'You tend to attract grace here when you let yourself actually receive it instead of arranging it.',
  ],
  Mars: [
    'You take initiative here readily, and the same area can be where frustration shows up the loudest when blocked.',
    'When you push, you push from here — it is one of the engine rooms of the chart.',
    'Conflict and courage both surface in this domain; learning the difference matters.',
  ],
  Jupiter: [
    'This area tends to expand whenever you give it your trust, sometimes in ways larger than you planned.',
    'You meet opportunity here more often than statistics would predict — keep the optimism honest.',
    'Wisdom about this domain compounds across the years; you eventually have something teachable to offer in it.',
  ],
  Saturn: [
    'This area asks for time, and it rewards endurance — what is built here is built to last once it is built at all.',
    'You may feel slowed or tested in this domain early on, then quietly authoritative in it later.',
    'Mastery here tends to arrive after the moment you almost gave up on it.',
  ],
  Uranus: [
    'You insist on doing this part of life your own way, and any structure that demands otherwise tends to break here.',
    'Sudden shifts cluster around this domain; the chart asks you to stay flexible rather than fight them.',
    'Originality is the asset here — predictability is the cost you pay for it.',
  ],
  Neptune: [
    'Imagination, idealism, and confusion all show up here — discernment is the quiet skill the placement asks you to develop.',
    'You see this area through a softer lens than others do; check the facts before you commit to the picture.',
    'Compassion lives in this domain easily; clear edges are the discipline it takes longer to build.',
  ],
  Pluto: [
    'Whatever happens here tends to change you more than it changes the surface of your life.',
    'Power dynamics surface around this area; the work is to own your own power rather than manage someone else’s.',
    'This is one of the places where real transformation tends to keep finding you whether you invited it or not.',
  ],
};

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function cap(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function wordCount(s) {
  return (s || '').trim().split(/\s+/).filter(Boolean).length;
}

// Pick variants from a slot list with anti-repetition against an exclusion set.
// Returns the first variant whose tokens do not collide with exclusion.
function pickNonColliding(arr, key, salt, exclusionFragments) {
  if (!arr || !arr.length) return '';
  const start = hash32(key + '|' + salt) % arr.length;
  for (let i = 0; i < arr.length; i++) {
    const cand = arr[(start + i) % arr.length];
    if (!hasCollision(...exclusionFragments, cand)) return cand;
  }
  // Last resort: return the first option even if it collides
  return arr[start];
}

// ─────────────────────────────────────────────────────────────────────
// Composer — Planet in Sign
// ─────────────────────────────────────────────────────────────────────

function buildPlanetInSign(planet, sign) {
  // 1. Marquee override
  const marqueeKey = planet + '-' + sign;
  if (MARQUEE_PLANET_SIGN[marqueeKey]) return MARQUEE_PLANET_SIGN[marqueeKey];

  const sg = SIGNS[sign];
  const pl = PLANETS[planet];
  if (!sg || !pl) return '';

  const dignity = dignityOf(planet, sign);
  const key = planet + '@' + sign;

  // 2. Pick template (rotates by hash)
  const tplIdx = hash32(key + '|tpl') % PIS_TEMPLATES.length;
  const tplFn = PIS_TEMPLATES[tplIdx];

  // 3. Pick a dignity line (only included for non-neutral, OR with low probability for neutral
  //    to keep the dignity language from feeling forced on every paragraph)
  let dignityLine = '';
  if (dignity !== 'neutral') {
    dignityLine = pick(DIGNITY_LINES[dignity], key, 'dig');
  } else if ((hash32(key + '|dig?') & 1) === 0) {
    dignityLine = pick(DIGNITY_LINES.neutral, key, 'dig');
  }

  // 4. Pick lexicon variants. We chain anti-repetition so each new fragment
  //    avoids content-word overlap with the ones already chosen.
  const sgExpr = pickNonColliding(sg.expressions, key, 'sgExpr', [dignityLine]);
  const sgStr  = pickNonColliding(sg.strengths,   key, 'sgStr',  [dignityLine, sgExpr]);
  const sgChl  = pickNonColliding(sg.challenges,  key, 'sgChl',  [dignityLine, sgExpr, sgStr]);
  const plStr  = pickNonColliding(pl.strengths,   key, 'plStr',  [dignityLine, sgExpr, sgStr, sgChl]);
  const plChl  = pickNonColliding(pl.challenges,  key, 'plChl',  [dignityLine, sgExpr, sgStr, sgChl, plStr]);
  const growth = pick(sg.growth, key, 'gr');

  const fields = {
    pl: planet,
    sg: sign,
    sgArche: sg.archetype,
    sgExpr,
    sgStr,
    sgChl,
    plRep: pl.rep,
    plDomain: pl.domain.join(', '),
    plStr,
    plChl,
    dignityLine,
    growth,
  };

  let out = tplFn(fields);

  // 5. Final guards — forbidden phrase + length envelope
  if (!passesForbidden(out)) {
    // Try the next template in rotation
    const altFn = PIS_TEMPLATES[(tplIdx + 1) % PIS_TEMPLATES.length];
    out = altFn(fields);
  }

  // If a paragraph still falls below our target floor, append a coda that
  // names the actual planetary domain rather than repeating the old filler.
  if (wordCount(out) < 80) {
    const codaDomain = pl.domain[2] || pl.domain[0];
    out += ` The throughline is ${codaDomain} — a register this combination keeps coming back to whether you plan it or not.`;
  }

  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Composer — Planet in House
// ─────────────────────────────────────────────────────────────────────

function buildPlanetInHouse(planet, house) {
  const hs = HOUSES[house];
  const pl = PLANETS[planet];
  if (!hs || !pl) return '';

  const key = planet + '@H' + house;

  const tplIdx = hash32(key + '|tpl') % PIH_TEMPLATES.length;
  const tplFn = PIH_TEMPLATES[tplIdx];

  const hsExpr      = pick(hs.expressions, key, 'hsExpr');
  const sectionLine = pickNonColliding(SECTION_FLAVOR[hs.section] || SECTION_FLAVOR.angular, key, 'sec', [hsExpr]);
  const closer      = pickNonColliding(PIH_CLOSERS[planet] || [], key, 'cl', [hsExpr, sectionLine]);

  const fields = {
    pl: planet,
    hsTitle: hs.title,
    hsExpr,
    plDomain: pl.domain[0] + ' and ' + pl.domain[1],
    sectionLine,
  };

  let core = tplFn(fields);
  let out = core + ' ' + closer;

  if (!passesForbidden(out)) {
    const altFn = PIH_TEMPLATES[(tplIdx + 1) % PIH_TEMPLATES.length];
    out = altFn(fields) + ' ' + closer;
  }

  // If we landed short, add a second planet-specific closer (rotated) to
  // round out the paragraph.
  if (wordCount(out) < 60) {
    const closers = PIH_CLOSERS[planet] || [];
    if (closers.length > 1) {
      const altCloser = closers[(hash32(key + '|cl2') >>> 0) % closers.length];
      if (altCloser && altCloser !== closer) out += ' ' + altCloser;
    }
  }

  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Composer — Ascendant in Sign
// ─────────────────────────────────────────────────────────────────────

function buildAsc(sign) {
  const sg = SIGNS[sign];
  const note = ASC_NOTES[sign];
  if (!sg || !note) return '';

  const key = 'ASC@' + sign;
  const sgStr = pick(sg.strengths, key, 'sgStr');

  // 3-4 sentences, focused on first impression and embodiment.
  const out =
    `Your Ascendant in ${sign} gives you a first-impression read that is ${note.firstRead}, and a presence that is ${note.presence}. ` +
    `People tend to register ${note.body} before they register anything else about you. ` +
    `At its best, this rising sign gives you ${sgStr} in how you actually meet the world. ` +
    `The pitfall is ${note.pitfall} — the surface is doing more talking than it knows.`;

  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Composer — Midheaven in Sign
// ─────────────────────────────────────────────────────────────────────

function buildMc(sign) {
  const sg = SIGNS[sign];
  const note = MC_NOTES[sign];
  if (!sg || !note) return '';

  const key = 'MC@' + sign;
  const sgStr = pick(sg.strengths, key, 'sgStr');

  const out =
    `Your Midheaven in ${sign} points your vocational signature toward ${note.callingShape}. ` +
    `Publicly you tend to read as ${note.publicImage}, because this sign colors how ambition is actually expressed in the world. ` +
    `The strength you bring to a calling is ${sgStr}. ` +
    `The professional trap is ${note.trap}; the placement comes into its peak ${note.peak}.`;

  return out;
}

// ─────────────────────────────────────────────────────────────────────
// PLANET_INFO + HOUSE_INFO — small metadata blocks consumed by Dashboard
// ─────────────────────────────────────────────────────────────────────

function buildPlanetInfo() {
  const out = {};
  for (const p of PLANET_LIST) {
    out[p] = {
      glyph: PLANET_GLYPHS[p],
      name: p,
      keyword: PLANET_KEYWORDS[p],
      rules: PLANET_RULES[p],
      description: PLANET_DESCRIPTIONS[p],
    };
  }
  return out;
}

function buildHouseInfo() {
  const out = {};
  for (const h of HOUSE_LIST) {
    out[h] = {
      name: ORDINALS[h] + ' House',
      keyword: HOUSE_KEYWORDS[h],
      description: HOUSE_DESCRIPTIONS[h],
    };
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Legacy non-English path — preserved verbatim for the 13 other locales
// until Phase 3 regenerates them against the new lexicon.
// ─────────────────────────────────────────────────────────────────────

const ELEMENT_I18N = {
  en: { Fire:'fire', Earth:'earth', Air:'air', Water:'water' },
  de: { Fire:'Feuer', Earth:'Erde', Air:'Luft', Water:'Wasser' },
  fr: { Fire:'feu', Earth:'terre', Air:'air', Water:'eau' },
  es: { Fire:'fuego', Earth:'tierra', Air:'aire', Water:'agua' },
  it: { Fire:'fuoco', Earth:'terra', Air:'aria', Water:'acqua' },
  pt: { Fire:'fogo', Earth:'terra', Air:'ar', Water:'água' },
  tr: { Fire:'ateş', Earth:'toprak', Air:'hava', Water:'su' },
  ru: { Fire:'огонь', Earth:'земля', Air:'воздух', Water:'вода' },
  ja: { Fire:'火', Earth:'地', Air:'風', Water:'水' },
  zh: { Fire:'火', Earth:'土', Air:'风', Water:'水' },
  ar: { Fire:'نار', Earth:'تراب', Air:'هواء', Water:'ماء' },
  ko: { Fire:'불', Earth:'땅', Air:'공기', Water:'물' },
  pl: { Fire:'ogień', Earth:'ziemia', Air:'powietrze', Water:'woda' },
  nl: { Fire:'vuur', Earth:'aarde', Air:'lucht', Water:'water' },
};
const MODALITY_I18N = {
  en: { Cardinal:'cardinal', Fixed:'fixed', Mutable:'mutable' },
  de: { Cardinal:'kardinal', Fixed:'fix', Mutable:'veränderlich' },
  fr: { Cardinal:'cardinal', Fixed:'fixe', Mutable:'mutable' },
  es: { Cardinal:'cardinal', Fixed:'fijo', Mutable:'mutable' },
  it: { Cardinal:'cardinale', Fixed:'fisso', Mutable:'mobile' },
  pt: { Cardinal:'cardeal', Fixed:'fixo', Mutable:'mutável' },
  tr: { Cardinal:'öncü', Fixed:'sabit', Mutable:'değişken' },
  ru: { Cardinal:'кардинальный', Fixed:'фиксированный', Mutable:'мутабельный' },
  ja: { Cardinal:'活動', Fixed:'不動', Mutable:'柔軟' },
  zh: { Cardinal:'基本', Fixed:'固定', Mutable:'变动' },
  ar: { Cardinal:'أصلي', Fixed:'ثابت', Mutable:'متحول' },
  ko: { Cardinal:'활동', Fixed:'고정', Mutable:'변통' },
  pl: { Cardinal:'kardynalne', Fixed:'stałe', Mutable:'zmienne' },
  nl: { Cardinal:'hoofdteken', Fixed:'vast', Mutable:'beweeglijk' },
};

function tpl(template, vars) {
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), v);
  }
  return s;
}

function legacyBuildForLang(lang) {
  // Faithful port of the previous composer for non-English locales.
  // The intentional change: we strip the "You notice this influence
  // clearly in real situations." filler from line 5 even on legacy paths.
  const i = ALL_I18N[lang];
  if (!i) return null;

  const TPL = i.TEMPLATES;
  const SIGN_DATA = i.SIGN_DATA;
  const PLANET_ROLE = i.PLANET_ROLE;
  const HOUSE_DATA = i.HOUSE_DATA;
  const HOUSE_EFFECT = i.HOUSE_EFFECT;
  const ASC_DATA = i.ASC_DATA;
  const MC_DATA = i.MC_DATA;
  const ORD = i.ORDINALS || ORDINALS;
  const PI = i.PLANET_INFO;
  const HI = i.HOUSE_INFO;
  if (!TPL || !SIGN_DATA || !PLANET_ROLE) return null;

  const PIS = {};
  for (const planet of PLANET_LIST) {
    for (const sign of SIGN_LIST) {
      const role = PLANET_ROLE[planet] || {};
      const sd = SIGN_DATA[sign] || {};
      const line1 = tpl(TPL.planetSignLine1?.[planet] || '', { rep: role.rep, sign, style: sd.style });
      const line2 = tpl(TPL.planetSignLine2?.[planet] || '', { behavior: sd.behavior });
      const sc = tpl(TPL.strengthChallenge || '', {
        planetStrength: role.strength, signStrength: sd.strength,
        planetChallenge: role.challenge, signChallenge: sd.challenge,
      });
      // strip the legacy filler closer; keep only the second half if present
      let line5 = TPL.planetSignLine5?.[planet] || '';
      // Try to drop a leading filler sentence if it exists.
      line5 = line5.replace(/^[^.]*\.\s*/, '');
      const text = [line1, line2, sc, line5].filter(Boolean).join(' ').trim();
      PIS[planet + '-' + sign] = { title: planet + ' in ' + sign, text };
    }
  }

  const PIH = {};
  for (const planet of PLANET_LIST) {
    for (const h of HOUSE_LIST) {
      const role = PLANET_ROLE[planet] || {};
      const hd = HOUSE_DATA?.[h] || {};
      const opening = tpl(TPL.planetInHouse?.opening || '', { planet, houseTitle: hd.title, houseShort: hd.short, rep: role.rep });
      const middle  = tpl(TPL.planetInHouse?.middle  || '', { houseLong: hd.long });
      const effect  = (HOUSE_EFFECT || {})[planet] || '';
      const ending  = TPL.planetInHouse?.endings?.[planet] || '';
      const text = [opening, middle, effect, ending].filter(Boolean).join(' ').trim();
      PIH[planet + '-' + String(h)] = { title: planet + ' in the ' + (ORD[h] || ORDINALS[h]) + ' House', text };
    }
  }

  const ASC = {};
  for (const sign of SIGN_LIST) {
    const sd = SIGN_DATA[sign] || {};
    const a = ASC_DATA?.[sign] || {};
    const t = TPL.asc || {};
    const elementLoc = (ELEMENT_I18N[lang] || ELEMENT_I18N.en)[sd.element] || sd.element;
    const modalityLoc = (MODALITY_I18N[lang] || MODALITY_I18N.en)[sd.modality] || sd.modality;
    const text = [
      tpl(t.line1 || '', { sign, outer: a.outer }),
      tpl(t.line2 || '', { first: a.first }),
      tpl(t.line3 || '', { persona: a.persona, element: elementLoc, modality: modalityLoc, sign }),
      tpl(t.line4 || '', { signStrength: sd.strength, ascChallenge: a.challenge }),
      t.line5 || '',
    ].filter(Boolean).join(' ').trim();
    ASC[sign] = { title: 'Ascendant in ' + sign, text };
  }

  const MC = {};
  for (const sign of SIGN_LIST) {
    const sd = SIGN_DATA[sign] || {};
    const m = MC_DATA?.[sign] || {};
    const t = TPL.mc || {};
    const text = [
      tpl(t.line1 || '', { sign, fields: m.fields }),
      tpl(t.line2 || '', { image: m.image }),
      tpl(t.line3 || '', { style: sd.style }),
      tpl(t.line4 || '', { mcChallenge: m.challenge }),
    ].filter(Boolean).join(' ').trim();
    MC[sign] = { title: 'Midheaven in ' + sign, text };
  }

  // Planet/House info — translated where available, English description fallback.
  const PINFO = {};
  for (const p of PLANET_LIST) {
    PINFO[p] = {
      glyph: PLANET_GLYPHS[p],
      name: p,
      keyword: PI?.[p]?.keyword || PLANET_KEYWORDS[p],
      rules: PLANET_RULES[p],
      description: PI?.[p]?.description || PLANET_DESCRIPTIONS[p],
    };
  }
  const HINFO = {};
  for (const h of HOUSE_LIST) {
    HINFO[h] = {
      name: (ORD[h] || ORDINALS[h]) + ' House',
      keyword: HI?.[h]?.keyword || HOUSE_KEYWORDS[h],
      description: HI?.[h]?.description || HOUSE_DESCRIPTIONS[h],
    };
  }

  return { PLANET_IN_SIGN: PIS, PLANET_IN_HOUSE: PIH, ASC_IN_SIGN: ASC, MC_IN_SIGN: MC, PLANET_INFO: PINFO, HOUSE_INFO: HINFO };
}

// ─────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────

const _cache = {};

function buildEnglish() {
  const PLANET_IN_SIGN = {};
  for (const planet of PLANET_LIST) {
    for (const sign of SIGN_LIST) {
      PLANET_IN_SIGN[planet + '-' + sign] = {
        title: planet + ' in ' + sign,
        text: buildPlanetInSign(planet, sign),
      };
    }
  }

  const PLANET_IN_HOUSE = {};
  for (const planet of PLANET_LIST) {
    for (const house of HOUSE_LIST) {
      PLANET_IN_HOUSE[planet + '-' + String(house)] = {
        title: planet + ' in the ' + ORDINALS[house] + ' House',
        text: buildPlanetInHouse(planet, house),
      };
    }
  }

  const ASC_IN_SIGN = {};
  for (const sign of SIGN_LIST) {
    ASC_IN_SIGN[sign] = {
      title: 'Ascendant in ' + sign,
      text: buildAsc(sign),
    };
  }

  const MC_IN_SIGN = {};
  for (const sign of SIGN_LIST) {
    MC_IN_SIGN[sign] = {
      title: 'Midheaven in ' + sign,
      text: buildMc(sign),
    };
  }

  return {
    PLANET_IN_SIGN,
    PLANET_IN_HOUSE,
    ASC_IN_SIGN,
    MC_IN_SIGN,
    PLANET_INFO: buildPlanetInfo(),
    HOUSE_INFO: buildHouseInfo(),
  };
}

function getEnglishReading() {
  if (!_cache.en) _cache.en = buildEnglish();
  return _cache.en;
}

/**
 * Get all natal readings for a specific language.
 * Returns { PLANET_IN_SIGN, PLANET_IN_HOUSE, ASC_IN_SIGN, MC_IN_SIGN, PLANET_INFO, HOUSE_INFO }.
 * Non-English locales fall back to legacy translations until Phase 3 regenerates them.
 */
export function getNatalReadings(lang) {
  const l = lang || 'en';
  if (_cache[l]) return _cache[l];

  if (l === 'en') return getEnglishReading();

  const legacy = legacyBuildForLang(l);
  if (legacy) {
    _cache[l] = legacy;
    return legacy;
  }
  // Final fallback — English
  return getEnglishReading();
}
