const PLANETS = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
];

const SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

const HOUSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const ORDINALS = {
  1: 'First',
  2: 'Second',
  3: 'Third',
  4: 'Fourth',
  5: 'Fifth',
  6: 'Sixth',
  7: 'Seventh',
  8: 'Eighth',
  9: 'Ninth',
  10: 'Tenth',
  11: 'Eleventh',
  12: 'Twelfth',
};

const SIGN_DATA = {
  Aries: {
    element: 'Fire',
    modality: 'Cardinal',
    ruler: 'Mars',
    style: 'direct, courageous, and self-starting',
    behavior: 'act quickly, trust your instincts, and prefer honesty over hesitation',
    strength: 'initiative, boldness, and the willingness to go first',
    challenge: 'impatience, impulsiveness, or unnecessary conflict when reflection would help',
  },
  Taurus: {
    element: 'Earth',
    modality: 'Fixed',
    ruler: 'Venus',
    style: 'steady, sensual, and grounded',
    behavior: 'move at your own pace, value consistency, and build slowly but securely',
    strength: 'stability, loyalty, and enduring strength',
    challenge: 'stubbornness, inertia, or clinging to what is familiar long after growth asks for change',
  },
  Gemini: {
    element: 'Air',
    modality: 'Mutable',
    ruler: 'Mercury',
    style: 'curious, adaptable, and mentally quick',
    behavior: 'process life through language, comparison, and constant movement between ideas',
    strength: 'versatility, wit, and the ability to make connections quickly',
    challenge: 'restlessness, inconsistency, or staying on the surface when more depth is needed',
  },
  Cancer: {
    element: 'Water',
    modality: 'Cardinal',
    ruler: 'Moon',
    style: 'sensitive, protective, and emotionally responsive',
    behavior: 'take things personally, remember deeply, and seek emotional safety before opening fully',
    strength: 'empathy, loyalty, and the instinct to care for what matters',
    challenge: 'defensiveness, moodiness, or retreating into self-protection when you feel exposed',
  },
  Leo: {
    element: 'Fire',
    modality: 'Fixed',
    ruler: 'Sun',
    style: 'warm, expressive, and heart-centered',
    behavior: 'need to create, radiate, and live with dignity and personal meaning',
    strength: 'confidence, generosity, and the ability to energize others',
    challenge: 'pride, stubbornness, or over-identifying with recognition and approval',
  },
  Virgo: {
    element: 'Earth',
    modality: 'Mutable',
    ruler: 'Mercury',
    style: 'observant, discerning, and practical',
    behavior: 'notice details, refine systems, and look for useful ways to improve life',
    strength: 'precision, skill, and grounded intelligence',
    challenge: 'worry, perfectionism, or excessive self-criticism when reality feels untidy',
  },
  Libra: {
    element: 'Air',
    modality: 'Cardinal',
    ruler: 'Venus',
    style: 'balanced, relational, and socially aware',
    behavior: 'seek fairness, weigh perspectives, and understand yourself through interaction',
    strength: 'diplomacy, grace, and the ability to create cooperation',
    challenge: 'indecision, people-pleasing, or avoiding conflict at the cost of honesty',
  },
  Scorpio: {
    element: 'Water',
    modality: 'Fixed',
    ruler: 'Pluto + Mars',
    style: 'intense, private, and transformative',
    behavior: 'feel deeply, read beneath the surface, and move through life with emotional depth',
    strength: 'resilience, insight, and the power to regenerate',
    challenge: 'control, suspicion, or holding on too tightly when vulnerability feels risky',
  },
  Sagittarius: {
    element: 'Fire',
    modality: 'Mutable',
    ruler: 'Jupiter',
    style: 'expansive, adventurous, and meaning-seeking',
    behavior: 'look for the larger truth, value freedom, and learn through direct experience',
    strength: 'optimism, candor, and a broad, inspiring perspective',
    challenge: 'carelessness, overstatement, or escaping limits before learning from them',
  },
  Capricorn: {
    element: 'Earth',
    modality: 'Cardinal',
    ruler: 'Saturn',
    style: 'disciplined, strategic, and reality-based',
    behavior: 'measure progress carefully, take responsibility seriously, and respect time and structure',
    strength: 'endurance, maturity, and the ability to build something lasting',
    challenge: 'rigidity, pessimism, or becoming overly defined by duty and achievement',
  },
  Aquarius: {
    element: 'Air',
    modality: 'Fixed',
    ruler: 'Uranus + Saturn',
    style: 'independent, original, and future-oriented',
    behavior: 'think outside convention, value freedom, and care about principles as much as people',
    strength: 'innovation, objectivity, and courage to challenge old patterns',
    challenge: 'detachment, contrariness, or valuing distance so much that intimacy becomes harder',
  },
  Pisces: {
    element: 'Water',
    modality: 'Mutable',
    ruler: 'Neptune + Jupiter',
    style: 'intuitive, compassionate, and porous',
    behavior: 'absorb atmosphere easily, live close to imagination, and respond to subtle undercurrents',
    strength: 'empathy, imagination, and spiritual receptivity',
    challenge: 'confusion, escapism, or blurred boundaries when life becomes overwhelming',
  },
};

const HOUSE_DATA = {
  1: {
    title: 'First House',
    keyword: 'Self & Identity',
    long: 'your identity, body, style, and the way you meet life directly',
    short: 'how you present yourself and initiate experience',
  },
  2: {
    title: 'Second House',
    keyword: 'Resources & Values',
    long: 'your money, possessions, talents, and personal values',
    short: 'what helps you feel secure and materially grounded',
  },
  3: {
    title: 'Third House',
    keyword: 'Communication & Learning',
    long: 'communication, learning, siblings, and everyday movement',
    short: 'how you think on your feet and exchange information',
  },
  4: {
    title: 'Fourth House',
    keyword: 'Home & Roots',
    long: 'home, family, ancestry, and emotional foundations',
    short: 'your private life and what gives you inner belonging',
  },
  5: {
    title: 'Fifth House',
    keyword: 'Creativity & Pleasure',
    long: 'creativity, romance, joy, children, and self-expression',
    short: 'how you play, create, and reveal your heart',
  },
  6: {
    title: 'Sixth House',
    keyword: 'Work & Health',
    long: 'work, health, routine, service, and daily maintenance',
    short: 'how you handle practical obligations and refine your habits',
  },
  7: {
    title: 'Seventh House',
    keyword: 'Partnerships & Marriage',
    long: 'partnerships, marriage, contracts, and important one-to-one bonds',
    short: 'how you relate to equals and learn through connection',
  },
  8: {
    title: 'Eighth House',
    keyword: 'Transformation & Shared Resources',
    long: 'intimacy, shared resources, crisis, loss, and transformation',
    short: 'where you merge, confront depth, and undergo inner change',
  },
  9: {
    title: 'Ninth House',
    keyword: 'Philosophy & Travel',
    long: 'philosophy, travel, higher learning, and the search for truth',
    short: 'how you expand your worldview beyond the familiar',
  },
  10: {
    title: 'Tenth House',
    keyword: 'Career & Public Image',
    long: 'career, reputation, achievement, and public standing',
    short: 'how you contribute visibly and define your path in the world',
  },
  11: {
    title: 'Eleventh House',
    keyword: 'Community & Ideals',
    long: 'friends, groups, causes, and future hopes',
    short: 'how you participate in communities and imagine the future',
  },
  12: {
    title: 'Twelfth House',
    keyword: 'Unconscious & Transcendence',
    long: 'the unconscious, retreat, endings, spirituality, and hidden patterns',
    short: 'what operates behind the scenes and asks for surrender or compassion',
  },
};

const PLANET_ROLE = {
  Sun: {
    rep: 'your core identity, vitality, and conscious purpose',
    strength: 'confidence and creative self-definition',
    challenge: 'ego rigidity or measuring your worth through recognition alone',
  },
  Moon: {
    rep: 'your emotional nature, instincts, and need for security',
    strength: 'emotional intelligence and instinctive responsiveness',
    challenge: 'mood-driven reactions or difficulty naming what you need',
  },
  Mercury: {
    rep: 'your mind, communication style, and way of learning',
    strength: 'clarity, adaptability, and mental agility',
    challenge: 'overthinking, miscommunication, or scattering your attention',
  },
  Venus: {
    rep: 'love, values, attraction, pleasure, and relationship style',
    strength: 'social grace, aesthetic instinct, and capacity for warmth',
    challenge: 'avoidance, dependency, or confusing comfort with true compatibility',
  },
  Mars: {
    rep: 'drive, assertion, anger, courage, and sexual energy',
    strength: 'initiative, bravery, and decisive action',
    challenge: 'impatience, conflict, or using force where strategy would serve you better',
  },
  Jupiter: {
    rep: 'growth, faith, opportunity, wisdom, and expansion',
    strength: 'optimism, generosity, and broad perspective',
    challenge: 'excess, overconfidence, or promising more than life can sustain',
  },
  Saturn: {
    rep: 'structure, discipline, responsibility, and the reality principle',
    strength: 'endurance, integrity, and practical wisdom',
    challenge: 'fear, rigidity, or carrying burdens so tightly that life loses warmth',
  },
  Uranus: {
    rep: 'freedom, originality, disruption, and awakening',
    strength: 'innovation, courage to change, and independent vision',
    challenge: 'instability, rebellion for its own sake, or resistance to emotional continuity',
  },
  Neptune: {
    rep: 'imagination, spirituality, ideals, compassion, and dissolution',
    strength: 'sensitivity, inspiration, and spiritual imagination',
    challenge: 'confusion, escapism, or idealizing what needs clearer boundaries',
  },
  Pluto: {
    rep: 'transformation, power, depth, compulsion, and regeneration',
    strength: 'resilience, psychological insight, and power to renew yourself',
    challenge: 'control, obsession, or forcing change before trust is ready',
  },
};

const HOUSE_EFFECT = {
  Sun: 'You usually want to be seen doing something that feels personally meaningful here, and your confidence tends to grow when you are actively shaping this part of life.',
  Moon: 'Your moods are often strongly tied to what happens here, so daily life in this area can affect your sense of safety more than you first realize.',
  Mercury: 'You tend to think, speak, plan, and process constantly around these themes, so this area of life rarely feels mentally quiet or passive.',
  Venus: 'You look for pleasure, ease, beauty, or mutuality here, and you often try to improve this part of life through tact, taste, or relationship skill.',
  Mars: 'You tend to act decisively here, and this is often where frustration, courage, and competitive drive become visible in everyday life.',
  Jupiter: 'This area of life often feels like a place of growth, opportunity, and confidence, though it can also tempt you toward excess or inflated expectations.',
  Saturn: 'You often experience this area as serious, demanding, or slow to develop, yet it is also where maturity and long-term strength can quietly accumulate.',
  Uranus: 'This part of life tends to develop through sudden shifts, unconventional choices, or a strong need to do things your own way.',
  Neptune: 'This area can feel inspired, porous, idealized, or unclear, so both imagination and discernment are essential here.',
  Pluto: 'Experiences here are rarely superficial, and this part of life often becomes a site of deep change, power dynamics, or profound inner work.',
};

const ASC_DATA = {
  Aries: {
    outer: 'active, direct, and alert',
    first: 'straightforward, courageous, and quick to act',
    persona: 'move first and explain later',
    challenge: 'impatient or overly sharp when life slows down',
  },
  Taurus: {
    outer: 'calm, grounded, and composed',
    first: 'steady, reliable, and hard to rush',
    persona: 'prefer a measured pace and clear sensory reality',
    challenge: 'stubborn or resistant when pushed too quickly',
  },
  Gemini: {
    outer: 'quick, curious, and animated',
    first: 'bright, talkative, and mentally agile',
    persona: 'adapt rapidly and take in many impressions at once',
    challenge: 'scattered or overly cerebral under pressure',
  },
  Cancer: {
    outer: 'gentle, watchful, and emotionally receptive',
    first: 'caring, private, and protective',
    persona: 'scan for safety before fully opening',
    challenge: 'guarded or moody when you feel exposed',
  },
  Leo: {
    outer: 'warm, noticeable, and self-possessed',
    first: 'confident, expressive, and memorable',
    persona: 'bring heart, style, and personal drama into the room',
    challenge: 'proud or overly performative when insecure',
  },
  Virgo: {
    outer: 'neat, observant, and modest',
    first: 'competent, thoughtful, and discerning',
    persona: 'notice details quickly and prefer a composed presentation',
    challenge: 'self-conscious or overly critical of yourself',
  },
  Libra: {
    outer: 'gracious, balanced, and socially aware',
    first: 'pleasant, refined, and cooperative',
    persona: 'pay attention to tone, fairness, and aesthetic harmony',
    challenge: 'indecisive or too accommodating for the sake of peace',
  },
  Scorpio: {
    outer: 'intense, contained, and magnetic',
    first: 'private, perceptive, and hard to read',
    persona: 'hold energy close and observe carefully before trusting',
    challenge: 'suspicious or overly controlled when vulnerable',
  },
  Sagittarius: {
    outer: 'open, lively, and forward-moving',
    first: 'candid, enthusiastic, and adventurous',
    persona: 'meet life as something to explore and expand',
    challenge: 'restless or tactless when confined',
  },
  Capricorn: {
    outer: 'reserved, self-controlled, and capable',
    first: 'serious, reliable, and composed',
    persona: 'prefer competence and clear structure over display',
    challenge: 'overly guarded or severe when stressed',
  },
  Aquarius: {
    outer: 'unconventional, detached, and mentally alert',
    first: 'independent, interesting, and somewhat unpredictable',
    persona: 'want room to be yourself without too much social pressure',
    challenge: 'distant or contrarian when closeness feels restrictive',
  },
  Pisces: {
    outer: 'soft, receptive, and elusive',
    first: 'gentle, imaginative, and empathic',
    persona: 'pick up atmosphere quickly and blur hard edges naturally',
    challenge: 'diffuse or hard to define when strong boundaries are needed',
  },
};

const MC_DATA = {
  Aries: {
    fields: 'initiative, leadership, entrepreneurship, and pioneering work',
    image: 'bold, independent, and willing to take risks',
    challenge: 'impatience or conflict with authority',
  },
  Taurus: {
    fields: 'stability, craftsmanship, finance, design, beauty, or any work built slowly and well',
    image: 'reliable, steady, and grounded',
    challenge: 'stagnation or overattachment to security',
  },
  Gemini: {
    fields: 'communication, writing, teaching, media, sales, translation, or multi-track careers',
    image: 'quick-minded, adaptable, and informed',
    challenge: 'scattered ambition or difficulty committing to one direction',
  },
  Cancer: {
    fields: 'care, hospitality, education, healing, family-oriented work, or roles that protect and nurture',
    image: 'supportive, intuitive, and trustworthy',
    challenge: 'taking professional matters too personally',
  },
  Leo: {
    fields: 'creative leadership, performance, visibility, management, branding, or work that requires strong personal presence',
    image: 'confident, expressive, and charismatic',
    challenge: 'pride or dependence on recognition',
  },
  Virgo: {
    fields: 'service, analysis, editing, health, research, craft, systems, or improvement-oriented professions',
    image: 'competent, precise, and helpful',
    challenge: 'perfectionism or undervaluing your own authority',
  },
  Libra: {
    fields: 'diplomacy, law, design, art, mediation, consulting, partnership work, or refined public roles',
    image: 'fair, polished, and relationally skilled',
    challenge: 'indecision or excessive image management',
  },
  Scorpio: {
    fields: 'psychology, finance, research, investigation, strategy, healing, crisis management, or transformative work',
    image: 'intense, powerful, and self-possessed',
    challenge: 'control struggles or secrecy',
  },
  Sagittarius: {
    fields: 'teaching, publishing, travel, law, philosophy, coaching, international work, or roles tied to vision',
    image: 'optimistic, broad-minded, and inspiring',
    challenge: 'overpromising or resisting necessary limits',
  },
  Capricorn: {
    fields: 'administration, management, governance, long-term leadership, business, or any path requiring endurance',
    image: 'authoritative, disciplined, and credible',
    challenge: 'overwork or defining yourself only through achievement',
  },
  Aquarius: {
    fields: 'technology, reform, science, social systems, networks, innovation, or unconventional professional paths',
    image: 'original, progressive, and principled',
    challenge: 'alienation or resistance to ordinary structures',
  },
  Pisces: {
    fields: 'art, film, music, healing, spiritual service, charity, imagination-led work, or fluid callings',
    image: 'compassionate, inspired, and elusive',
    challenge: 'confusion, drift, or weak professional boundaries',
  },
};

export const PLANET_INFO = {
  Sun: { glyph: '☉', name: 'Sun', keyword: 'Identity & Purpose', rules: 'Leo', description: 'The Sun describes your core identity, vitality, and conscious sense of purpose. It shows how you seek to shine, create meaning, and become fully yourself.' },
  Moon: { glyph: '☽', name: 'Moon', keyword: 'Emotions & Instinct', rules: 'Cancer', description: 'The Moon reflects your emotional nature, instincts, and need for safety and belonging. It reveals how you react, remember, and seek comfort beneath the surface.' },
  Mercury: { glyph: '☿', name: 'Mercury', keyword: 'Mind & Communication', rules: 'Gemini / Virgo', description: 'Mercury describes how you think, learn, speak, and make connections. It shows the style of your mind and the way you exchange information with the world.' },
  Venus: { glyph: '♀', name: 'Venus', keyword: 'Love & Values', rules: 'Taurus / Libra', description: 'Venus describes love, attraction, values, pleasure, and aesthetic taste. It reveals how you relate, what you appreciate, and what helps life feel harmonious.' },
  Mars: { glyph: '♂', name: 'Mars', keyword: 'Drive & Assertion', rules: 'Aries / Scorpio', description: 'Mars describes drive, assertion, anger, sexuality, and the urge to act. It shows how you pursue desire, defend yourself, and meet challenge head on.' },
  Jupiter: { glyph: '♃', name: 'Jupiter', keyword: 'Growth & Wisdom', rules: 'Sagittarius / Pisces', description: 'Jupiter describes growth, faith, wisdom, opportunity, and the impulse to expand. It shows how you seek meaning, trust life, and develop confidence through experience.' },
  Saturn: { glyph: '♄', name: 'Saturn', keyword: 'Structure & Discipline', rules: 'Capricorn / Aquarius', description: 'Saturn describes structure, duty, limits, and the discipline required for mastery. It reveals where life asks for patience, realism, and mature responsibility.' },
  Uranus: { glyph: '♅', name: 'Uranus', keyword: 'Revolution & Freedom', rules: 'Aquarius', description: 'Uranus describes freedom, rebellion, originality, and sudden awakening. It shows where you resist stagnation and seek a more authentic, liberated way of living.' },
  Neptune: { glyph: '♆', name: 'Neptune', keyword: 'Transcendence & Illusion', rules: 'Pisces', description: 'Neptune describes imagination, spirituality, ideals, and the dissolution of ordinary boundaries. It reveals how you dream, empathize, idealize, and search for transcendence.' },
  Pluto: { glyph: '♇', name: 'Pluto', keyword: 'Transformation & Power', rules: 'Scorpio', description: 'Pluto describes transformation, power, compulsion, and deep regeneration. It shows where life strips away what is superficial so something stronger and more truthful can emerge.' },
};

export const HOUSE_INFO = {
  1: { name: 'First House', keyword: 'Self & Identity', description: 'The First House governs your self presentation, physical presence, and the way you begin things. It describes how you meet life directly and how others first experience you.' },
  2: { name: 'Second House', keyword: 'Resources & Values', description: 'The Second House governs money, possessions, talents, and personal values. It describes what helps you feel secure and how you build material and inner stability.' },
  3: { name: 'Third House', keyword: 'Communication & Learning', description: 'The Third House governs communication, learning, siblings, and the local environment. It describes how you exchange ideas, gather information, and move through everyday life.' },
  4: { name: 'Fourth House', keyword: 'Home & Roots', description: 'The Fourth House governs home, family, ancestry, and emotional foundations. It describes your private life, your roots, and the place you return to for belonging.' },
  5: { name: 'Fifth House', keyword: 'Creativity & Pleasure', description: 'The Fifth House governs creativity, romance, pleasure, performance, and children. It describes how you express joy, take risks, and bring something personal into the world.' },
  6: { name: 'Sixth House', keyword: 'Work & Health', description: 'The Sixth House governs work, routines, health, service, and daily responsibilities. It describes how you manage practical life and maintain order in body and schedule.' },
  7: { name: 'Seventh House', keyword: 'Partnerships & Marriage', description: 'The Seventh House governs partnerships, marriage, contracts, and significant one to one bonds. It describes what you seek in others and how you learn through relationship.' },
  8: { name: 'Eighth House', keyword: 'Transformation & Shared Resources', description: 'The Eighth House governs intimacy, shared resources, loss, regeneration, and deep psychological change. It describes the processes that transform you through surrender, trust, and crisis.' },
  9: { name: 'Ninth House', keyword: 'Philosophy & Travel', description: 'The Ninth House governs philosophy, higher education, long distance travel, and the search for truth. It describes how you expand your worldview and pursue meaning beyond the familiar.' },
  10: { name: 'Tenth House', keyword: 'Career & Public Image', description: 'The Tenth House governs career, reputation, achievement, and public standing. It describes how you seek to contribute visibly and what you are known for in the wider world.' },
  11: { name: 'Eleventh House', keyword: 'Community & Ideals', description: 'The Eleventh House governs friends, groups, collective causes, and future aspirations. It describes the communities you join and the ideals you hope to build with others.' },
  12: { name: 'Twelfth House', keyword: 'Unconscious & Transcendence', description: 'The Twelfth House governs the unconscious, retreat, endings, spirituality, and hidden patterns. It describes what operates behind the scenes and how you dissolve into something larger than the ego.' },
};

function planetSignLine1(planet, sign, style, rep) {
  if (planet === 'Sun') return 'Your Sun describes ' + rep + ', and in ' + sign + ' it becomes ' + style + '.';
  if (planet === 'Moon') return 'Your Moon describes ' + rep + ', and in ' + sign + ' your inner life becomes ' + style + '.';
  if (planet === 'Mercury') return 'Your Mercury describes ' + rep + ', and in ' + sign + ' your mind becomes ' + style + '.';
  if (planet === 'Venus') return 'Your Venus describes ' + rep + ', and in ' + sign + ' your way of loving becomes ' + style + '.';
  if (planet === 'Mars') return 'Your Mars describes ' + rep + ', and in ' + sign + ' your drive becomes ' + style + '.';
  if (planet === 'Jupiter') return 'Your Jupiter describes ' + rep + ', and in ' + sign + ' your growth instinct becomes ' + style + '.';
  if (planet === 'Saturn') return 'Your Saturn describes ' + rep + ', and in ' + sign + ' your disciplined side becomes ' + style + '.';
  if (planet === 'Uranus') return 'Your Uranus describes ' + rep + ', and in ' + sign + ' your urge for freedom becomes ' + style + '.';
  if (planet === 'Neptune') return 'Your Neptune describes ' + rep + ', and in ' + sign + ' your imagination becomes ' + style + '.';
  return 'Your Pluto describes ' + rep + ', and in ' + sign + ' your transformative power becomes ' + style + '.';
}

function planetSignLine2(planet, behavior) {
  if (planet === 'Sun') return 'You usually ' + behavior + ', and this is obvious in the way you shape identity and purpose.';
  if (planet === 'Moon') return 'You usually ' + behavior + ', and this strongly shapes what helps you feel safe and how you recover from stress.';
  if (planet === 'Mercury') return 'You usually ' + behavior + ', and this influences how you speak, learn, and decide what matters.';
  if (planet === 'Venus') return 'You usually ' + behavior + ', and this colors attraction, affection, taste, and relationship patterns.';
  if (planet === 'Mars') return 'You usually ' + behavior + ', and this affects how you pursue desire, take initiative, and handle conflict.';
  if (planet === 'Jupiter') return 'You usually ' + behavior + ', and this influences what encourages you and how you pursue larger horizons.';
  if (planet === 'Saturn') return 'You usually ' + behavior + ', and this affects how you handle effort, boundaries, and long-term responsibility.';
  if (planet === 'Uranus') return 'You usually ' + behavior + ', and this shapes how you break patterns and insist on authenticity.';
  if (planet === 'Neptune') return 'You usually ' + behavior + ', and this colors your ideals, intuition, and sensitivity to subtle atmosphere.';
  return 'You usually ' + behavior + ', and this shapes how you confront truth, intensity, and the need for renewal.';
}

function planetSignLine5(planet) {
  if (planet === 'Sun') return 'You notice this influence clearly in real situations. You develop best when confidence includes self-awareness and not only force of will.';
  if (planet === 'Moon') return 'You notice this influence clearly in real situations. You grow emotionally when sensitivity is paired with steadiness and clear self-knowledge.';
  if (planet === 'Mercury') return 'You notice this influence clearly in real situations. You think at your best when curiosity is matched by reflection and consequence.';
  if (planet === 'Venus') return 'You notice this influence clearly in real situations. You love best when pleasure stays connected to honesty, reciprocity, and emotional reality.';
  if (planet === 'Mars') return 'You notice this influence clearly in real situations. You use this placement best when courage stays connected to timing and strategy.';
  if (planet === 'Jupiter') return 'You notice this influence clearly in real situations. You benefit most when enthusiasm is grounded by judgment and lived wisdom.';
  if (planet === 'Saturn') return 'You notice this influence clearly in real situations. You mature most fully when discipline supports life instead of hardening it.';
  if (planet === 'Uranus') return 'You notice this influence clearly in real situations. You use this placement best when freedom serves awakening rather than chaos.';
  if (planet === 'Neptune') return 'You notice this influence clearly in real situations. You thrive when inspiration is protected by discernment and healthy boundaries.';
  return 'You notice this influence clearly in real situations. You use this placement best when power becomes conscious, ethical, and regenerative.';
}

function planetGenerationalLine(planet) {
  if (planet === 'Uranus') return ' Because Uranus moves slowly, this also describes a generational style of questioning old rules and seeking new freedom.';
  if (planet === 'Neptune') return ' Because Neptune moves slowly, this also speaks to a generational dream, ideal, or illusion shared by your age group.';
  if (planet === 'Pluto') return ' Because Pluto moves slowly, this also marks a generational process of deep change around power, crisis, and renewal.';
  return '';
}

function buildPlanetInSign(planet, sign) {
  const role = PLANET_ROLE[planet];
  const signInfo = SIGN_DATA[sign];
  return (
    planetSignLine1(planet, sign, signInfo.style, role.rep) +
    ' ' +
    planetSignLine2(planet, signInfo.behavior) +
    ' ' +
    'One of your strengths here is ' + role.strength + ', supported by ' + signInfo.strength + '.' +
    ' ' +
    'One challenge is ' + role.challenge + ', especially through ' + signInfo.challenge + '.' +
    ' ' +
    planetSignLine5(planet) +
    planetGenerationalLine(planet)
  );
}

function buildPlanetInHouse(planet, house) {
  const role = PLANET_ROLE[planet];
  const houseInfo = HOUSE_DATA[house];
  let end = '';
  if (planet === 'Sun') end = 'You may feel most alive when you can take ownership of this area and shape it according to your values and purpose.';
  if (planet === 'Moon') end = 'You may instinctively protect this area, fluctuate strongly with it, and need greater emotional awareness around it than other people seem to require.';
  if (planet === 'Mercury') end = 'You may talk about this area often, analyze it constantly, and become especially skillful wherever information or coordination is required.';
  if (planet === 'Venus') end = 'You may attract ease here, care deeply about harmony in this domain, and often make choices based on what feels graceful or relationally right.';
  if (planet === 'Mars') end = 'You may become especially proactive here, sometimes productive and courageous, sometimes reactive when blocked or challenged.';
  if (planet === 'Jupiter') end = 'You may naturally expect more from this area, seek opportunities through it, and grow by trusting its possibilities while keeping perspective.';
  if (planet === 'Saturn') end = 'You may meet delays or pressure here, yet with time this can become one of the strongest and most reliable parts of your life.';
  if (planet === 'Uranus') end = 'You may behave unpredictably here, crave autonomy, and resist anyone who tries to force this area into lifeless routines.';
  if (planet === 'Neptune') end = 'You may bring compassion and imagination here, but you may also need to check facts, limits, and assumptions more carefully.';
  if (planet === 'Pluto') end = 'You may be changed deeply by what happens here, and control issues or profound healing work can surface through this life domain.';
  return (
    'With ' + planet + ' in the ' + houseInfo.title + ', ' + houseInfo.short + ' becomes a major channel for ' + role.rep + '.' +
    ' ' +
    'You are likely to experience this planet most directly through ' + houseInfo.long + ', and your everyday behavior often reflects it in practical ways.' +
    ' ' +
    HOUSE_EFFECT[planet] +
    ' ' +
    end
  );
}

function buildAsc(sign) {
  const signInfo = SIGN_DATA[sign];
  const asc = ASC_DATA[sign];
  return (
    'Your Ascendant describes your outer style, first impression, and the way you instinctively approach new situations, and in ' + sign + ' it gives you a presentation that feels ' + asc.outer + '.' +
    ' ' +
    'Other people often read you as ' + asc.first + ', even before they know your deeper nature, because this rising sign shapes your posture, pacing, tone, and social signal.' +
    ' ' +
    'You tend to ' + asc.persona + ', which means your persona is often built around the ' + signInfo.element.toLowerCase() + ' and ' + signInfo.modality.toLowerCase() + ' qualities of ' + sign + '.' +
    ' ' +
    'At your best, this gives you ' + signInfo.strength + ' in how you meet the world. One challenge is appearing ' + asc.challenge + '.' +
    ' ' +
    'You use this Ascendant well when your surface style becomes an honest gateway to the deeper person behind it, rather than a mask that does all the talking for you.'
  );
}

function buildMc(sign) {
  const signInfo = SIGN_DATA[sign];
  const mc = MC_DATA[sign];
  return (
    'Your Midheaven describes career direction, public image, visible achievement, and the kind of life purpose you want to grow into, and in ' + sign + ' it points toward work shaped by ' + mc.fields + '.' +
    ' ' +
    'You are often seen publicly as ' + mc.image + ', because this sign colors the way ambition and responsibility are expressed.' +
    ' ' +
    'There is usually a need to build a vocation that feels ' + signInfo.style + ', so your path works best when it reflects your natural way of contributing.' +
    ' ' +
    'One challenge can be ' + mc.challenge + '. Your fulfillment grows when professional life becomes a genuine expression of character and long-term meaning.'
  );
}

export const PLANET_IN_SIGN = {};
for (const planet of PLANETS) {
  for (const sign of SIGNS) {
    PLANET_IN_SIGN[planet + '-' + sign] = {
      title: planet + ' in ' + sign,
      text: buildPlanetInSign(planet, sign),
    };
  }
}

export const PLANET_IN_HOUSE = {};
for (const planet of PLANETS) {
  for (const house of HOUSES) {
    PLANET_IN_HOUSE[planet + '-' + String(house)] = {
      title: planet + ' in the ' + ORDINALS[house] + ' House',
      text: buildPlanetInHouse(planet, house),
    };
  }
}

export const ASC_IN_SIGN = {};
for (const sign of SIGNS) {
  ASC_IN_SIGN[sign] = {
    title: 'Ascendant in ' + sign,
    text: buildAsc(sign),
  };
}

export const MC_IN_SIGN = {};
for (const sign of SIGNS) {
  MC_IN_SIGN[sign] = {
    title: 'Midheaven in ' + sign,
    text: buildMc(sign),
  };
}
