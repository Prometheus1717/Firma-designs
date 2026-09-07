const SIGNS = [
  ['aries', 'Aries', '♈', 'Mar 21 – Apr 19', 'Fire', 'Cardinal', 'Mars', 'Initiative, courage, the first step'],
  ['taurus', 'Taurus', '♉', 'Apr 20 – May 20', 'Earth', 'Fixed', 'Venus', 'Stability, pleasure, things that last'],
  ['gemini', 'Gemini', '♊', 'May 21 – Jun 20', 'Air', 'Mutable', 'Mercury', 'Curiosity, language, quick connections'],
  ['cancer', 'Cancer', '♋', 'Jun 21 – Jul 22', 'Water', 'Cardinal', 'Moon', 'Belonging, memory, protection'],
  ['leo', 'Leo', '♌', 'Jul 23 – Aug 22', 'Fire', 'Fixed', 'Sun', 'Visibility, warmth, creative pride'],
  ['virgo', 'Virgo', '♍', 'Aug 23 – Sep 22', 'Earth', 'Mutable', 'Mercury', 'Craft, service, systems that work'],
  ['libra', 'Libra', '♎', 'Sep 23 – Oct 22', 'Air', 'Cardinal', 'Venus', 'Balance, beauty, partnership'],
  ['scorpio', 'Scorpio', '♏', 'Oct 23 – Nov 21', 'Water', 'Fixed', 'Pluto (Mars)', 'Depth, intensity, transformation'],
  ['sagittarius', 'Sagittarius', '♐', 'Nov 22 – Dec 21', 'Fire', 'Mutable', 'Jupiter', 'Horizon, meaning, the long journey'],
  ['capricorn', 'Capricorn', '♑', 'Dec 22 – Jan 19', 'Earth', 'Cardinal', 'Saturn', 'Ambition, structure, earned authority'],
  ['aquarius', 'Aquarius', '♒', 'Jan 20 – Feb 18', 'Air', 'Fixed', 'Uranus (Saturn)', 'Originality, community, ideas ahead of time'],
  ['pisces', 'Pisces', '♓', 'Feb 19 – Mar 20', 'Water', 'Mutable', 'Neptune (Jupiter)', 'Imagination, compassion, dissolving edges'],
];

const signRows = SIGNS.map(([slug, name, glyph, dates, el, mode, ruler, theme]) =>
  `<tr><td>${glyph} <a href="/best-places-to-live/${slug}"><strong>${name}</strong></a></td><td>${dates}</td><td>${el} · ${mode}</td><td>${ruler}</td><td>${theme}</td></tr>`
).join('');

export default {
  slug: 'astrology',
  lang: 'en',
  alt: { de: 'astrologie' },
  title: 'Astrology Explained: Signs, Planets, Houses & Your Map',
  ogTitle: 'Astrology, explained as a map',
  description: 'Astrology for people who want to use it: the 12 zodiac signs, 10 planets, 12 houses and 4 angles, and how each placement becomes a line on your astrocartography map.',
  keywords: 'astrology, zodiac signs, birth chart, natal chart, planets in astrology, houses in astrology, rising sign, astrology map, astrocartography',
  articleHeadline: 'Astrology, explained as a map: signs, planets, houses and where they lead you',
  datePublished: '2026-09-07',
  dateModified: '2026-09-07',
  breadcrumb: [{ name: 'Astrology', url: '/astrology' }],
  h1: 'Astrology, explained as a map: signs, planets, houses and where they lead you',
  lead: '<strong>Astrology is a symbolic language with a small vocabulary and endless sentences.</strong> Twelve signs describe <em>how</em> something happens, ten planets describe <em>what</em> is happening, twelve houses describe <em>where in life</em> it plays out, and four angles anchor the whole picture to the moment and place of your birth. This guide teaches that vocabulary in the order you actually need it, then shows the part most astrology sites skip: how the same chart becomes a world map through astrocartography.',
  definedTerm: {
    name: 'Astrology',
    alternateName: ['natal astrology', 'birth chart astrology', 'horoscopic astrology'],
    description: 'Astrology is a symbolic system that reads the positions of the Sun, Moon and planets at the moment of birth, expressed through twelve zodiac signs, twelve houses and four angles, as a language for reflection on character, timing and place. It is interpretation, not established science.',
  },
  sections: [
    {
      h2: 'What astrology is, and what it is not',
      html: `<p>A birth chart is a snapshot of the sky at the minute you were born, drawn from the point on Earth where you were born. That part is astronomy and it is calculable to the arcminute. Everything that follows, the meaning of a Sun in Leo or a Moon in the fourth house, is interpretation handed down through roughly two thousand years of practice. Astrology has never been validated as a predictive science, and the honest way to use it is as a mirror: a structured set of questions about who you are, what you want and where you feel at home.</p><p>That framing matters because it changes how you read every page like this one. A sign description is not a verdict. It is a lens. If it shows you something true, keep it. If it does not, the chart is still yours and the lens simply did not fit. Natal Navigator builds on exactly that stance: real ephemeris data underneath, symbolic reading on top, decisions left with you. You can read our full <a href="/about">methodology and editorial standards</a>.</p>`,
    },
    {
      h2: 'The 12 zodiac signs',
      html: `<p>The zodiac is a 360-degree band divided into twelve 30-degree signs. When people say "I am a Gemini" they mean the Sun was in the Gemini section of that band on their birthday. Every other planet also sits in a sign, so a complete chart has ten sign placements, not one. Signs are grouped by <strong>element</strong> (fire, earth, air, water: the temperament) and by <strong>modality</strong> (cardinal, fixed, mutable: how it moves). Each sign also has a ruling planet that colours its whole character.</p>
<div style="overflow-x:auto;"><table><thead><tr><th>Sign</th><th>Sun dates</th><th>Element · mode</th><th>Ruler</th><th>Core theme</th></tr></thead><tbody>${signRows}</tbody></table></div>
<p>Each sign name above links to a guide on the kind of place that sign tends to flourish in, because temperament has a geography. Fire signs want momentum and an audience, earth signs want quality and continuity, air signs want conversation and options, water signs want depth and belonging. The overview lives at <a href="/where-to-live-by-zodiac-sign">where to live by zodiac sign</a>.</p>`,
    },
    {
      h2: 'The 10 planets: the cast of the chart',
      html: `<p>If signs are adjectives, planets are the nouns. Traditional astrology uses the two lights and eight planets, and each one governs a domain of life. In astrocartography every one of them also becomes four lines on the globe, which is why the planet pages on this site are the most useful place to go deeper.</p>
<ul>
<li><strong>Sun</strong>: identity, vitality, what you are here to become. On the map: <a href="/astrocartography/sun-line">Sun lines</a>, where you are seen.</li>
<li><strong>Moon</strong>: emotional needs, memory, home, the body's sense of safety. <a href="/astrocartography/moon-line">Moon lines</a> are the classic "feels like home" lines.</li>
<li><strong>Mercury</strong>: thinking, language, learning, commerce. <a href="/astrocartography/mercury-line">Mercury lines</a> sharpen communication and trade.</li>
<li><strong>Venus</strong>: love, beauty, pleasure, money as enjoyment. <a href="/astrocartography/venus-line">Venus lines</a> are the most requested lines on any map.</li>
<li><strong>Mars</strong>: drive, conflict, courage, sexuality. <a href="/astrocartography/mars-line">Mars lines</a> energise and provoke in equal measure.</li>
<li><strong>Jupiter</strong>: growth, luck, expansion, faith. <a href="/astrocartography/jupiter-line">Jupiter lines</a> open doors and widen horizons.</li>
<li><strong>Saturn</strong>: structure, limits, discipline, mastery over time. <a href="/astrocartography/saturn-line">Saturn lines</a> are demanding and, for the right person, deeply rewarding.</li>
<li><strong>Uranus</strong>: change, freedom, invention, sudden turns. <a href="/astrocartography/uranus-line">Uranus lines</a> shake routines loose.</li>
<li><strong>Neptune</strong>: imagination, spirituality, dissolution, illusion. <a href="/astrocartography/neptune-line">Neptune lines</a> are inspiring and disorienting.</li>
<li><strong>Pluto</strong>: power, depth, endings and rebirth. <a href="/astrocartography/pluto-line">Pluto lines</a> are where life gets serious.</li>
</ul>
<p>The "big three" people quote, Sun sign, Moon sign and rising sign, are simply the three placements that describe you fastest: core self, inner self, and the self other people meet first.</p>`,
    },
    {
      h2: 'The 12 houses: where in life it happens',
      html: `<p>Houses divide the chart into twelve areas of life, counted anticlockwise from the eastern horizon at your birth. Unlike signs, houses depend on birth time and place, which is why a chart without a birth time is only half a chart. A planet's sign says how it behaves; its house says which room of your life it lives in.</p>
<ol>
<li><strong>1st house</strong>: self, body, appearance, first impressions (begins at the Ascendant)</li>
<li><strong>2nd</strong>: money, possessions, self-worth</li>
<li><strong>3rd</strong>: communication, siblings, short trips, daily mind</li>
<li><strong>4th</strong>: home, family, roots, the private self (begins at the IC)</li>
<li><strong>5th</strong>: creativity, romance, children, play</li>
<li><strong>6th</strong>: work, routines, health, service</li>
<li><strong>7th</strong>: partnership, marriage, open enemies (begins at the Descendant)</li>
<li><strong>8th</strong>: shared resources, intimacy, transformation</li>
<li><strong>9th</strong>: travel, higher learning, belief, foreign places</li>
<li><strong>10th</strong>: career, reputation, public role (begins at the Midheaven)</li>
<li><strong>11th</strong>: friends, community, hopes, networks</li>
<li><strong>12th</strong>: solitude, the unconscious, endings, retreat</li>
</ol>
<p>Notice that four of the houses begin at an angle. Those four angles are the hinge between ordinary astrology and astrocartography.</p>`,
    },
    {
      h2: 'The 4 angles: where astrology becomes geography',
      html: `<p>The Ascendant, Descendant, Midheaven and IC are the four most sensitive points in any chart. They are not planets; they are the horizon and the meridian of your birthplace, projected onto the zodiac. That is why they move with location: change where you are born, or where you stand, and the angles change while the planets do not.</p>
<ul>
<li><strong>Ascendant (ASC)</strong>: the eastern horizon, the rising sign, how you come across. On the map: <a href="/astrocartography/asc-line">Ascendant lines</a>.</li>
<li><strong>Descendant (DSC)</strong>: the western horizon, partnership and the people you attract. <a href="/astrocartography/dsc-line">Descendant lines</a>.</li>
<li><strong>Midheaven (MC)</strong>: the highest point, career and public visibility. <a href="/astrocartography/mc-line">Midheaven lines</a>.</li>
<li><strong>Imum Coeli (IC)</strong>: the lowest point, home, roots and the private life. <a href="/astrocartography/ic-line">IC lines</a>.</li>
</ul>
<p>Astrocartography asks a simple question for every planet: where on Earth would this planet have been exactly on one of my four angles at the moment I was born? Each answer is a line across the globe. Ten planets times four angles gives the forty lines you see on a Natal Navigator map. Standing on your Venus Descendant line, for example, means that from that place, Venus would have been setting on the horizon at your birth. The <a href="/astrocartography">astrocartography guide</a> walks through the full method.</p>`,
    },
    {
      h2: 'From chart to map: reading your placements geographically',
      html: `<p>Here is the bridge most astrology content never builds. Take one placement, say the Moon in Cancer in the 4th house. Classic astrology reads it as a person for whom home, family and emotional safety are central. Astrocartography adds a second question: <em>where</em> does that Moon get to be angular? The Moon IC line is the strip of the planet where that need for rootedness is amplified by place. A Cancer Moon person living far from any Moon line may feel vaguely unrooted for years without knowing why; the map gives that feeling coordinates.</p>
<p>The same logic runs through every placement. A Sun in Leo wants to be seen, so the Sun MC line becomes the natural place to ask where visibility comes easily. A Saturn in Capricorn builds slowly, so the Saturn lines mark where that discipline is tested and rewarded. Your sign placements tell you what you need; your lines tell you where the world meets that need. <a href="/where-should-i-live-astrology">Where should I live?</a> applies this to the questions people actually ask, and <a href="/relocation-astrology">relocation astrology</a> explains the sister technique of recasting the whole chart for a new city.</p>`,
    },
    {
      h2: 'How to read your own chart in ten minutes',
      html: `<ol>
<li><strong>Get an accurate birth time.</strong> A birth certificate beats memory. Without a time you still have signs, but not houses or angles; see <a href="/blog/astrocartography-without-birth-time">what still works without a birth time</a>.</li>
<li><strong>Find your big three.</strong> Sun sign for identity, Moon sign for needs, rising sign for style. Read all three together, not the Sun alone.</li>
<li><strong>Look for clusters.</strong> Three or more planets in one sign or house is a theme; it will outweigh any single placement.</li>
<li><strong>Check the angles.</strong> Any planet within a few degrees of the ASC, DSC, MC or IC is loud in your life, and it will produce a strong line on your map.</li>
<li><strong>Turn it into a map.</strong> Open the <a href="/astrocartography-calculator">astrocartography calculator</a>, enter the same birth data, and watch each placement become a line. Then rate the cities you are actually considering.</li>
</ol>
<p>The demo lets you explore a famous chart before you enter your own: <a href="/demo">open the live demo</a>, or <a href="/create">create your map</a> right away.</p>`,
    },
  ],
  faq: [
    { q: 'Is astrology real?', a: 'The astronomy inside a birth chart is real and precisely calculable. The meanings assigned to signs, planets and houses are symbolic interpretation with no established scientific validation. Astrology works best as a structured language for reflection, not as prediction.' },
    { q: 'What is the difference between astrology and astrocartography?', a: 'Astrology reads your birth chart for the time you were born. Astrocartography takes the same chart and asks where on Earth each planet would have been on one of your four angles, producing forty lines across the globe. It is astrology applied to place.' },
    { q: 'Do I need my exact birth time?', a: 'For signs, no. For houses, the rising sign, the angles and every astrocartography line, yes. An error of a few minutes can shift the Ascendant by a degree and move angular lines by tens of kilometres, so use a birth certificate where possible.' },
    { q: 'What is a rising sign?', a: 'The rising sign, or Ascendant, is the zodiac sign that was rising on the eastern horizon at the place and minute of your birth. It describes how you come across and sets the entire house system of your chart.' },
    { q: 'Which planet matters most for deciding where to live?', a: 'It depends on what you want from the move. The Moon and IC lines speak to home and belonging, Sun and Midheaven lines to visibility and career, Venus to love and ease, Jupiter to growth. Most people compare two or three lines rather than chasing a single one.' },
    { q: 'Can astrology tell me where to move?', a: 'It can give you a well-structured set of questions and a map of where each theme in your chart is amplified. It cannot guarantee an outcome. Use it alongside the practical facts of a place, and treat the map as a reflection tool rather than an instruction.' },
  ],
  related: [
    { href: '/astrocartography', label: 'Astrocartography: the complete beginner guide' },
    { href: '/where-to-live-by-zodiac-sign', label: 'Where to live, by zodiac sign' },
    { href: '/astrocartography-calculator', label: 'How the calculator turns a chart into lines' },
    { href: '/where-should-i-live-astrology', label: 'Where should I live? An astrology guide' },
    { href: '/relocation-astrology', label: 'Relocation astrology vs astrocartography' },
    { href: '/blog/is-astrocartography-real', label: 'Is astrocartography real? An honest look' },
  ],
};
