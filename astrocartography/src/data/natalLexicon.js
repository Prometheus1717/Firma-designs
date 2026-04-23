// ── Natal Lexicon (English source of truth) ──
// Deep, non-redundant variants for the personality-text synthesizer.
// Every slot holds multiple independent phrasings — NOT synonym lists —
// so the composer can pick different topics, not just rephrase the same idea.
//
// Canonical zodiac + planetary reference used by natalReadings.js composer:
//   - Domicile / Exaltation / Detriment / Fall dignities
//   - Angular / Succedent / Cadent house sections
//   - Element + modality for tone modulation
//
// Keys use TitleCase to match chart-data ids (e.g. 'Sun', 'Aries', 'Mars').

// ─────────────────────────────────────────────────────────────────────
// SIGNS
// ─────────────────────────────────────────────────────────────────────

export const SIGNS = {
  Aries: {
    element: 'Fire', modality: 'Cardinal', ruler: 'Mars', polarity: 'Libra',
    archetype: 'the initiator',
    keyword: 'I am',
    bodyAssociation: 'head, face, upper skull',
    expressions: [
      'direct, courageous, and decisive',
      'instinct-led, frank, and quick to act',
      'pioneering, willing to break new ground',
      'forward-leaning, unafraid of friction',
      'spontaneous, alive in the moment of choice',
      'sharp, action-oriented, restless with delay',
    ],
    strengths: [
      'the willingness to start before conditions feel safe',
      'a clean signal between intention and action',
      'courage that energizes the people around you',
      'an intolerance for stagnation that gets things moving',
      'the gift of acting on instinct when others overthink',
      'the ability to rally a group toward a clear goal',
    ],
    challenges: [
      'mistaking speed for strategy',
      'burning the people who cannot keep up with your pace',
      'starting more than you finish',
      'reading patience as weakness in others',
      'reacting before the picture is fully visible',
      'leading from heat rather than judgment',
    ],
    growth: [
      'when courage is paired with patience, not replaced by it',
      'when speed is reserved for moments that actually call for it',
    ],
  },

  Taurus: {
    element: 'Earth', modality: 'Fixed', ruler: 'Venus', polarity: 'Scorpio',
    archetype: 'the builder',
    keyword: 'I have',
    bodyAssociation: 'throat, neck, thyroid',
    expressions: [
      'steady, sensual, and grounded in the body',
      'unhurried, tactile, and quietly deliberate',
      'patient in a way that outlasts other people',
      'committed to what is real, edible, touchable',
      'averse to drama and loyal to the familiar',
      'slow to move but almost impossible to dislodge',
    ],
    strengths: [
      'a gift for building things that hold up over years',
      'a nervous system that calms the room',
      'reliability that partners quietly organize their lives around',
      'an instinct for quality and for what will age well',
      'the stamina to finish what others abandon',
      'sensual presence — being genuinely here, not somewhere else',
    ],
    challenges: [
      'treating comfort as evidence that nothing needs to change',
      'mistaking stubbornness for integrity',
      'resisting a necessary move until the cost becomes heavy',
      'over-indulging the senses when emotions go unspoken',
      'staying in arrangements past their usefulness',
      'confusing material security with emotional safety',
    ],
    growth: [
      'when steadiness learns to accept change as its ally, not its enemy',
      'when loyalty is offered to your own growth, not just to the familiar',
    ],
  },

  Gemini: {
    element: 'Air', modality: 'Mutable', ruler: 'Mercury', polarity: 'Sagittarius',
    archetype: 'the messenger',
    keyword: 'I think',
    bodyAssociation: 'lungs, hands, shoulders, nervous system',
    expressions: [
      'curious, adaptable, and mentally quick',
      'plural in interest, restless in attention',
      'articulate in the space between ideas',
      'playful, verbal, drawn to pattern-finding',
      'alert to nuance, allergic to monotony',
      'fluent at reframing, quick to pivot',
    ],
    strengths: [
      'the ability to translate between worlds that rarely speak',
      'a mind that keeps learning long after others stop',
      'wit that lightens conversations without cheapening them',
      'the gift of seeing several options where others see only one',
      'skill at asking the question no one else thought to ask',
      'lateral thinking that solves problems by going sideways',
    ],
    challenges: [
      'collecting information instead of digesting it',
      'reaching for the clever answer over the honest one',
      'leaving depth on the table because breadth is more entertaining',
      'changing your mind often enough that commitments blur',
      'staying in the head when the body and heart need a turn',
      'scattering attention until nothing gets completed',
    ],
    growth: [
      'when curiosity deepens into genuine mastery of one thing',
      'when the mind learns to stay long enough for real understanding',
    ],
  },

  Cancer: {
    element: 'Water', modality: 'Cardinal', ruler: 'Moon', polarity: 'Capricorn',
    archetype: 'the caretaker',
    keyword: 'I feel',
    bodyAssociation: 'stomach, chest, breasts',
    expressions: [
      'sensitive, protective, and emotionally responsive',
      'receptive to atmosphere long before it is named',
      'loyal to people, places, and the memory of both',
      'watchful at first, warm once trust is earned',
      'moved by the small tides others overlook',
      'nurturing in a way that reads the room first',
    ],
    strengths: [
      'emotional intelligence that names what a room is actually feeling',
      'memory that keeps your people held even when they are absent',
      'the ability to create a place others return to for rest',
      'loyalty that stays through seasons most relationships do not survive',
      'an instinct for when someone needs protecting and when they need space',
      'a gift for building belonging out of small, repeated kindnesses',
    ],
    challenges: [
      'retreating into the shell before checking whether the threat is real',
      'taking personally what was never meant for you',
      'holding past hurts closer than present relationships',
      'caring for others as a way to avoid tending to yourself',
      'mood becoming weather the whole household lives under',
      'confusing closeness with the absence of boundaries',
    ],
    growth: [
      'when protectiveness learns the difference between caution and hiding',
      'when nurture flows toward yourself as fluently as it flows outward',
    ],
  },

  Leo: {
    element: 'Fire', modality: 'Fixed', ruler: 'Sun', polarity: 'Aquarius',
    archetype: 'the sovereign',
    keyword: 'I will',
    bodyAssociation: 'heart, upper back, spine',
    expressions: [
      'warm, expressive, and heart-centered',
      'dignified, theatrical in the best sense, alive to beauty',
      'generous in presence, unembarrassed by feeling',
      'self-possessed, naturally taking center stage',
      'playful, creative, willing to be seen',
      'radiant in a way that invites others to be larger too',
    ],
    strengths: [
      'a warmth that makes other people feel more themselves',
      'creative courage — the willingness to actually show the work',
      'loyalty that is public, not hidden or conditional',
      'leadership that lifts rather than pressures',
      'an inner dignity that does not need external permission',
      'the ability to make ordinary moments feel significant',
    ],
    challenges: [
      'over-identifying with the role you play in public',
      'mistaking recognition for self-worth',
      'treating disagreement as an attack on the self',
      'performing strength rather than feeling it',
      'giving generously but struggling to receive without orchestrating it',
      'needing the spotlight to stay on in order to stay lit',
    ],
    growth: [
      'when the sovereignty is offered from an inner source, not claimed by audience',
      'when generosity no longer requires applause to keep giving',
    ],
  },

  Virgo: {
    element: 'Earth', modality: 'Mutable', ruler: 'Mercury', polarity: 'Pisces',
    archetype: 'the craftsperson',
    keyword: 'I analyze',
    bodyAssociation: 'digestion, intestines, nervous system',
    expressions: [
      'observant, discerning, and practical',
      'attentive to detail in a way others find almost magical',
      'process-minded, refining rather than declaring',
      'modest in tone, precise in execution',
      'oriented toward usefulness over display',
      'quietly capable, a steady hand in small things',
    ],
    strengths: [
      'the ability to notice exactly what is breaking before it breaks',
      'craft — actual competence earned by many revisions',
      'service that improves systems without needing credit',
      'a clear mind for diagnosis when everyone else is catastrophizing',
      'patience with detail that turns good work into excellent work',
      'the instinct to quietly fix what others only complain about',
    ],
    challenges: [
      'treating imperfection as failure instead of information',
      'shrinking your contribution to stay below criticism',
      'criticizing yourself harder than you would ever criticize a friend',
      'mistaking worry for preparation',
      'getting lost in micro-adjustments while the larger shape drifts',
      'serving others so well that your own needs go un-logged',
    ],
    growth: [
      'when precision serves life instead of policing it',
      'when discernment learns to include self-kindness in its calculations',
    ],
  },

  Libra: {
    element: 'Air', modality: 'Cardinal', ruler: 'Venus', polarity: 'Aries',
    archetype: 'the diplomat',
    keyword: 'I balance',
    bodyAssociation: 'kidneys, lower back, skin',
    expressions: [
      'balanced, relational, and socially aware',
      'attentive to tone, fairness, and the weight of words',
      'drawn to symmetry, beauty, and elegant resolution',
      'collaborative, seeing the self through the other',
      'tactful, attuned to the politics of small spaces',
      'graceful in manner, careful with how a room is left feeling',
    ],
    strengths: [
      'the ability to mediate without taking sides against the truth',
      'a talent for designing spaces and agreements people can breathe in',
      'fairness that insists on including the quiet voice',
      'charm that opens doors without manipulating',
      'an eye for harmony that makes rooms and relationships more livable',
      'partnership intelligence — knowing how two people actually work',
    ],
    challenges: [
      'avoiding conflict at the cost of your own position',
      'performing agreement you do not actually feel',
      'deferring decisions until the moment passes',
      'losing yourself inside relationships that flatter you',
      'polishing the surface while the foundation goes unexamined',
      'confusing niceness with kindness',
    ],
    growth: [
      'when balance includes the courage to take a side',
      'when diplomacy serves honesty instead of postponing it',
    ],
  },

  Scorpio: {
    element: 'Water', modality: 'Fixed', ruler: 'Pluto (Mars)', polarity: 'Taurus',
    archetype: 'the alchemist',
    keyword: 'I desire',
    bodyAssociation: 'reproductive organs, eliminative system',
    expressions: [
      'intense, private, and transformative',
      'perceptive past the surface, hard to deceive',
      'loyal at depths most relationships never reach',
      'quietly powerful, reserved until trust is earned',
      'unafraid of darkness, at ease with what others flinch from',
      'magnetic, emotionally literate, slow to forget',
    ],
    strengths: [
      'the ability to sit with intensity without flinching',
      'psychological insight that reads motive beneath motive',
      'loyalty that survives what ordinary loyalty would not',
      'the power to regenerate after losses that would flatten others',
      'an appetite for truth over comfort',
      'the emotional courage to let something end so something truer can begin',
    ],
    challenges: [
      'controlling what cannot be controlled and calling it love',
      'keeping so much hidden that intimacy is starved of oxygen',
      'nursing grievance longer than the situation deserves',
      'confusing secrecy with self-possession',
      'testing loyalty instead of trusting it',
      'turning power inward as a weapon against yourself',
    ],
    growth: [
      'when depth becomes a place others are invited into, not locked out of',
      'when the transformative instinct is turned on your own patterns first',
    ],
  },

  Sagittarius: {
    element: 'Fire', modality: 'Mutable', ruler: 'Jupiter', polarity: 'Gemini',
    archetype: 'the seeker',
    keyword: 'I understand',
    bodyAssociation: 'hips, thighs, liver',
    expressions: [
      'expansive, adventurous, and meaning-seeking',
      'candid in a way that refreshes some and startles others',
      'oriented toward horizon, travel, and the larger arc',
      'philosophical, hungry for first principles',
      'restless with small talk, alive with big questions',
      'optimistic, built to keep moving through disappointment',
    ],
    strengths: [
      'the ability to zoom out when everyone else is in the weeds',
      'honesty offered without cruelty, just without padding',
      'faith that keeps doors open long enough for them to actually open',
      'a mind that connects cultures, disciplines, and worldviews',
      'the gift of turning experience into teachable wisdom',
      'an appetite for meaning that resists settling for less',
    ],
    challenges: [
      'overstating the case until nuance gets trampled',
      'escaping commitment by reframing it as freedom',
      'preaching before fully learning',
      'leaving when the work of staying becomes ordinary',
      'promising more than any one life can actually deliver',
      'treating restlessness as a spiritual virtue',
    ],
    growth: [
      'when wisdom is earned by staying through a full cycle, not by sampling many',
      'when candor is tempered by care for the listener',
    ],
  },

  Capricorn: {
    element: 'Earth', modality: 'Cardinal', ruler: 'Saturn', polarity: 'Cancer',
    archetype: 'the architect',
    keyword: 'I build',
    bodyAssociation: 'bones, knees, skin, teeth',
    expressions: [
      'disciplined, strategic, and reality-based',
      'long-gaze, willing to pay in years for what matters',
      'reserved on the surface, purposeful underneath',
      'composed under pressure, allergic to theatrics',
      'realistic in a way that looks pessimistic to optimists',
      'quietly ambitious, measured in speech, decisive in action',
    ],
    strengths: [
      'the capacity to build something that outlasts the mood that started it',
      'discipline that converts talent into actual accomplishment',
      'a realism that saves the project when optimism runs out',
      'responsibility taken without being asked for credit',
      'the patience to pay slow costs for durable outcomes',
      'leadership that does what it says, over years',
    ],
    challenges: [
      'letting the work replace the life that was supposed to contain it',
      'treating vulnerability as an obstacle to competence',
      'measuring worth in output and calling the rest leisure',
      'inheriting seriousness from earlier generations and confusing it with identity',
      'denying yourself pleasures you have already earned',
      'controlling the schedule so tightly that grace has no way in',
    ],
    growth: [
      'when authority is carried lightly enough to still be kind',
      'when the climb leaves room for warmth, rest, and people',
    ],
  },

  Aquarius: {
    element: 'Air', modality: 'Fixed', ruler: 'Uranus (Saturn)', polarity: 'Leo',
    archetype: 'the outsider',
    keyword: 'I know',
    bodyAssociation: 'ankles, circulation, nervous system',
    expressions: [
      'independent, original, and future-oriented',
      'principled, loyal to ideas rather than hierarchies',
      'cool in delivery, warm in private conviction',
      'detached enough to see the system, not just the seat',
      'allergic to groupthink, drawn to oddity and signal',
      'conceptual, steady, inventive on a long timescale',
    ],
    strengths: [
      'the ability to think past what is currently fashionable',
      'loyalty to principle even when it costs social smoothness',
      'vision for how systems could work instead of how they do',
      'a mind that welcomes difference without needing to flatten it',
      'staying power — convictions that hold through long, unsexy years',
      'the gift of belonging to many groups without being captured by any',
    ],
    challenges: [
      'staying in the observer seat past the point where life asked you to join',
      'treating emotional needs as static in the signal',
      'confusing contrarianism with actual originality',
      'defending the idea over the relationship it is supposed to serve',
      'intimacy that stalls because distance feels safer than dependence',
      'valuing freedom so absolutely that ordinary bonds feel like compromise',
    ],
    growth: [
      'when independence includes the courage to let someone matter',
      'when vision is tested against warm, specific people, not only ideals',
    ],
  },

  Pisces: {
    element: 'Water', modality: 'Mutable', ruler: 'Neptune (Jupiter)', polarity: 'Virgo',
    archetype: 'the mystic',
    keyword: 'I dream',
    bodyAssociation: 'feet, lymphatic system, pineal',
    expressions: [
      'intuitive, compassionate, and porous',
      'responsive to undercurrent, music, and atmosphere',
      'imaginative in a way that blurs fact and longing',
      'soft-edged, receptive, willing to feel what is in the room',
      'spiritually oriented, drawn to what cannot be measured',
      'empathic to the point of losing the seam between self and other',
    ],
    strengths: [
      'empathy that reads what is unsaid and still holds it',
      'imagination that turns raw feeling into art, image, or prayer',
      'spiritual intelligence — a native sense that there is more than this',
      'the ability to forgive without sentimentality',
      'a compassionate patience that can hold suffering without fixing it',
      'an ear for the music under everyday speech',
    ],
    challenges: [
      'dissolving into whoever is in the room with you',
      'choosing the fantasy over the work of the real thing',
      'using softness as a way to avoid taking your own position',
      'taking on pain that was never yours to carry',
      'losing edges so completely that agency drifts away',
      'drifting toward escape when discernment is what the moment asks for',
    ],
    growth: [
      'when compassion includes a self that can say no',
      'when imagination is paired with the discipline to give it form',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────
// PLANETS
// ─────────────────────────────────────────────────────────────────────

export const PLANETS = {
  Sun: {
    rep: 'core identity, vitality, and conscious will',
    domain: ['selfhood', 'creative purpose', 'the way you shine'],
    strengths: [
      'a steady sense of who you are',
      'a clear inner authority that others can feel',
      'the willingness to show up as yourself in public',
      'an instinct for what is actually yours to do',
      'creative vitality that keeps renewing its own source',
      'the warmth of someone comfortable taking up real space',
    ],
    challenges: [
      'over-identifying with the role you play in public',
      'mistaking recognition for self-worth',
      'performing a version of yourself that looks better than it feels',
      'confusing ego with the deeper self it is supposed to serve',
      'seeking outside confirmation for an inner authority that is already there',
      'shining so deliberately that spontaneity leaves the room',
    ],
    dignity: {
      domicile: ['Leo'],
      exaltation: ['Aries'],
      detriment: ['Aquarius'],
      fall: ['Libra'],
    },
    tone: 'classical-personal',
  },

  Moon: {
    rep: 'emotional nature, instinct, and the felt sense of home',
    domain: ['inner life', 'belonging', 'how you self-soothe'],
    strengths: [
      'emotional responsiveness that keeps relationships alive',
      'a memory for what the people you love actually need',
      'the ability to read a room without being told what is wrong',
      'instincts that arrive faster than reasoning does',
      'a gift for creating soft, lived-in places',
      'the skill of translating feeling into care',
    ],
    challenges: [
      'letting mood dictate decisions that need a longer view',
      'confusing protectiveness with control',
      'carrying unprocessed feeling as background weather',
      'assuming others know what you need without being told',
      'retreating from closeness the moment it asks something of you',
      'outsourcing self-soothing to food, habit, or distraction',
    ],
    dignity: {
      domicile: ['Cancer'],
      exaltation: ['Taurus'],
      detriment: ['Capricorn'],
      fall: ['Scorpio'],
    },
    tone: 'classical-personal',
  },

  Mercury: {
    rep: 'mind, speech, learning, and the movement of information',
    domain: ['thinking', 'communication', 'how you link one thing to another'],
    strengths: [
      'a mind that keeps learning without being asked',
      'the ability to translate between people who are not quite hearing each other',
      'language that reaches the specific point instead of circling it',
      'quick pattern recognition across unrelated domains',
      'an instinct for the right question instead of the polished answer',
      'fluency in whatever form — writing, speech, code, teaching — the moment calls for',
    ],
    challenges: [
      'arguing the point instead of inhabiting it',
      'collecting information faster than you digest it',
      'overthinking a choice the body already made',
      'letting wit stand in for sincerity',
      'scattering attention across too many open loops',
      'mistaking articulation for understanding',
    ],
    dignity: {
      domicile: ['Gemini', 'Virgo'],
      exaltation: ['Virgo'],
      detriment: ['Sagittarius', 'Pisces'],
      fall: ['Pisces'],
    },
    tone: 'classical-personal',
  },

  Venus: {
    rep: 'love, beauty, values, and the way you draw things toward you',
    domain: ['affection', 'pleasure', 'what you say yes to'],
    strengths: [
      'an instinct for what makes ordinary hours feel worth living',
      'social grace that opens doors without manipulation',
      'a sense of beauty that is practical, not decorative',
      'the ability to stay inside pleasure long enough to actually receive it',
      'warmth that makes other people feel chosen',
      'a talent for designing agreements that still feel human a year later',
    ],
    challenges: [
      'preferring harmony to the conversation that would earn it',
      'staying with what is pleasant past the point of genuine desire',
      'confusing being wanted with being loved',
      'indulging comfort when a harder honesty is needed',
      'avoiding the friction that intimacy actually requires',
      'outsourcing self-worth to the mirror of approval',
    ],
    dignity: {
      domicile: ['Taurus', 'Libra'],
      exaltation: ['Pisces'],
      detriment: ['Aries', 'Scorpio'],
      fall: ['Virgo'],
    },
    tone: 'classical-personal',
  },

  Mars: {
    rep: 'drive, assertion, friction, and willed action',
    domain: ['ambition', 'desire', 'how you push back against the world'],
    strengths: [
      'a clean signal between what you want and what you do',
      'the courage to go first when the group is still deliberating',
      'an appetite that converts into actual initiative',
      'the ability to defend something that matters to you',
      'stamina in the hard, unglamorous middle of an effort',
      'a decisive edge that cuts through analysis paralysis',
    ],
    challenges: [
      'leading from heat rather than judgment',
      'confusing volume with conviction',
      'spending anger on targets that cannot actually change anything',
      'mistaking speed for strategy',
      'competing where cooperation would serve the outcome better',
      'holding frustration in the body until it becomes symptom',
    ],
    dignity: {
      domicile: ['Aries', 'Scorpio'],
      exaltation: ['Capricorn'],
      detriment: ['Taurus', 'Libra'],
      fall: ['Cancer'],
    },
    tone: 'classical-personal',
  },

  Jupiter: {
    rep: 'growth, meaning, faith, and the instinct to expand',
    domain: ['opportunity', 'belief', 'how life gets bigger'],
    strengths: [
      'an optimism that keeps doors open long enough for them to open',
      'the ability to turn experience into teachable wisdom',
      'generosity that invests in other people without keeping score',
      'a feel for when to say yes to something bigger than current evidence',
      'natural encouragement — people leave your company believing more',
      'a sense of meaning that survives specific disappointments',
    ],
    challenges: [
      'overstating the case and ignoring the fine print',
      'treating enthusiasm as a substitute for follow-through',
      'expanding in ways that outrun the infrastructure',
      'mistaking your belief in something for the thing being true',
      'promising more than a single life can actually deliver',
      'mistaking excess for abundance',
    ],
    dignity: {
      domicile: ['Sagittarius', 'Pisces'],
      exaltation: ['Cancer'],
      detriment: ['Gemini', 'Virgo'],
      fall: ['Capricorn'],
    },
    tone: 'social-boundary',
  },

  Saturn: {
    rep: 'structure, discipline, limit, and the reality principle',
    domain: ['responsibility', 'mastery', 'what time actually demands'],
    strengths: [
      'the endurance to build something worth inheriting',
      'an integrity that does what it said it would, long after the enthusiasm faded',
      'discipline that turns raw talent into real craft',
      'realism that keeps projects alive after optimism runs out',
      'the ability to take a hard truth without flinching from it',
      'authority that others quietly, steadily trust',
    ],
    challenges: [
      'confusing seriousness with depth',
      'inheriting limits from earlier generations and calling them your own',
      'measuring your worth only by what is finished',
      'letting responsibility harden into a cage',
      'delaying joy as if it were a reward you have not yet earned',
      'carrying burdens so tightly that warmth leaves the room',
    ],
    dignity: {
      domicile: ['Capricorn', 'Aquarius'],
      exaltation: ['Libra'],
      detriment: ['Cancer', 'Leo'],
      fall: ['Aries'],
    },
    tone: 'social-boundary',
  },

  Uranus: {
    rep: 'disruption, freedom, originality, and sudden awakening',
    domain: ['individuation', 'rebellion', 'the break from inherited pattern'],
    strengths: [
      'the courage to step outside a script that no longer fits',
      'originality that arrives in working form, not just rebellion',
      'a nose for where a system is quietly obsolete',
      'an instinct for what the future already wants but has not named',
      'independence that protects your actual signal',
      'the gift of permissioning others to be their stranger selves',
    ],
    challenges: [
      'mistaking contrarianism for originality',
      'breaking things before understanding why they were built',
      'choosing distance whenever intimacy asks for presence',
      'changing the surface to avoid a deeper change',
      'valuing freedom so absolutely that ordinary bonds feel like traps',
      'treating consistency as failure of imagination',
    ],
    dignity: {
      domicile: ['Aquarius'],
      exaltation: ['Scorpio'],
      detriment: ['Leo'],
      fall: ['Taurus'],
    },
    tone: 'generational',
  },

  Neptune: {
    rep: 'imagination, dissolution, compassion, and the pull of the ideal',
    domain: ['dream', 'spiritual longing', 'what blurs the ordinary'],
    strengths: [
      'imagination strong enough to feel like perception',
      'compassion that includes what others flinch from',
      'an ear for the music under ordinary speech',
      'artistic intuition that arrives before argument',
      'a spiritual instinct that makes room for mystery',
      'the ability to forgive without pretending nothing happened',
    ],
    challenges: [
      'mistaking the longing for the thing itself',
      'using softness as a way to stay out of agency',
      'blurring boundaries until your own edges go missing',
      'idealizing people past the point of actually seeing them',
      'escaping into image when the real thing is hard',
      'confusing diffuse feeling with spiritual depth',
    ],
    dignity: {
      domicile: ['Pisces'],
      exaltation: ['Cancer'],
      detriment: ['Virgo'],
      fall: ['Capricorn'],
    },
    tone: 'generational',
  },

  Pluto: {
    rep: 'transformation, depth, power, and regeneration',
    domain: ['psyche', 'crisis', 'what gets burned down so something truer can grow'],
    strengths: [
      'the ability to sit with what others cannot bear to look at',
      'psychological insight that reads motive beneath motive',
      'the capacity to rebuild after losses that would flatten most people',
      'an intimacy with your own shadow that makes you hard to manipulate',
      'power that does not need to announce itself to be felt',
      'a feel for when an ending is the only honest door forward',
    ],
    challenges: [
      'controlling what cannot be controlled and calling it love',
      'mistaking intensity for connection',
      'turning psychological vision into a weapon',
      'staying loyal to a past version of yourself that is already dying',
      'testing others in ways that confirm old suspicions',
      'forcing change before trust is ready to carry it',
    ],
    dignity: {
      domicile: ['Scorpio'],
      exaltation: ['Leo'],
      detriment: ['Taurus'],
      fall: ['Aquarius'],
    },
    tone: 'generational',
  },
};

// ─────────────────────────────────────────────────────────────────────
// HOUSES
// ─────────────────────────────────────────────────────────────────────

export const HOUSES = {
  1: {
    title: 'First House',
    keyword: 'self, body, beginnings',
    domain: ['embodiment', 'first impressions', 'the visible self'],
    expressions: [
      'becomes part of how you walk into a room',
      'is something people read on you before you speak',
      'shapes the texture of your personality at first contact',
      'is worn close to the surface — there is no hiding it here',
    ],
    section: 'angular',
  },
  2: {
    title: 'Second House',
    keyword: 'resources, values, what you own',
    domain: ['material stability', 'personal values', 'the body as resource'],
    expressions: [
      'runs through what you earn, hold, and quietly consider yours',
      'shows up in how you measure worth and what you refuse to sell',
      'colors your relationship to comfort, money, and the body that carries both',
      'becomes part of how you decide what is genuinely valuable',
    ],
    section: 'succedent',
  },
  3: {
    title: 'Third House',
    keyword: 'communication, learning, immediate world',
    domain: ['speech', 'siblings and peers', 'the near environment'],
    expressions: [
      'moves through how you talk, think out loud, and circulate information',
      'shapes the daily rhythm of errands, messages, short trips, and quick study',
      'shows up in sibling relationships and the peers who shaped your earliest language',
      'threads itself through how you learn by encountering the next thing',
    ],
    section: 'cadent',
  },
  4: {
    title: 'Fourth House',
    keyword: 'home, roots, lineage',
    domain: ['family of origin', 'private life', 'inner foundation'],
    expressions: [
      'reaches into your roots, your lineage, and the emotional weather of home',
      'shapes what private life feels like behind the closed door',
      'connects to your sense of where you actually come from',
      'lives in the foundation — what holds the whole chart up from underneath',
    ],
    section: 'angular',
  },
  5: {
    title: 'Fifth House',
    keyword: 'creativity, play, romance, children',
    domain: ['self-expression', 'love affairs', 'creative output'],
    expressions: [
      'plays out in what you make, who you flirt with, and how you take pleasure',
      'colors your relationship to performance, risk, and creative visibility',
      'shows up in romance, in play, and in whatever you bring into the world that has your name on it',
      'runs through the creative channel — children of the body, children of the imagination',
    ],
    section: 'succedent',
  },
  6: {
    title: 'Sixth House',
    keyword: 'work, health, daily practice',
    domain: ['routine', 'service', 'the body in its hours'],
    expressions: [
      'works itself into your routines, your hours of labor, and the quiet discipline of days',
      'shows up in how you tend the body, organize work, and refine the small-scale machinery of life',
      'threads through the service you give and the crafts you slowly perfect',
      'lives in the texture of ordinary weekdays — work, health, obligation, and care',
    ],
    section: 'cadent',
  },
  7: {
    title: 'Seventh House',
    keyword: 'partnership, open enemies, the mirror',
    domain: ['one-to-one relationships', 'contracts', 'the other'],
    expressions: [
      'meets you in the mirror of one-to-one relationships',
      'shapes how you partner, negotiate, and balance yourself against another',
      'shows up in the contracts you sign and the enemies who carry your disowned parts',
      'runs through marriage, close collaboration, and the art of two people making one thing',
    ],
    section: 'angular',
  },
  8: {
    title: 'Eighth House',
    keyword: 'intimacy, shared resources, death and rebirth',
    domain: ['merged finances', 'sexuality', 'transformation through crisis'],
    expressions: [
      'moves through the shared resources — bodies, money, intimacy — that cannot be split cleanly',
      'shows up in the transformations you only survive by going through, not around',
      'colors your relationship to power, sexuality, and the inheritances you did not ask for',
      'lives where grief, trust, and regeneration all share the same room',
    ],
    section: 'succedent',
  },
  9: {
    title: 'Ninth House',
    keyword: 'philosophy, travel, higher mind',
    domain: ['worldview', 'long journeys', 'the search for meaning'],
    expressions: [
      'runs through your search for meaning and the horizon line of your worldview',
      'shows up in long travel, foreign cultures, and the teachers that rearranged your mind',
      'colors the philosophy you live by, even when you have not named it',
      'threads itself through how you seek truth across the usual boundaries',
    ],
    section: 'cadent',
  },
  10: {
    title: 'Tenth House',
    keyword: 'vocation, public role, legacy',
    domain: ['career', 'reputation', 'the visible contribution'],
    expressions: [
      'is visible in public life, in career, and in the role the world hands you',
      'shapes the vocation that actually fits the shape of your character',
      'runs through how you contribute something durable to the larger field',
      'lives where ambition meets what the world will actually accept from you',
    ],
    section: 'angular',
  },
  11: {
    title: 'Eleventh House',
    keyword: 'community, friendship, ideals',
    domain: ['chosen people', 'groups', 'long-range vision'],
    expressions: [
      'plays out in your chosen people, your groups, and the causes you lend yourself to',
      'colors what kind of future you are quietly building toward',
      'shows up in friendships and in the communities that become another kind of family',
      'runs through the ideals you hold and the companions you pursue them with',
    ],
    section: 'succedent',
  },
  12: {
    title: 'Twelfth House',
    keyword: 'unconscious, retreat, dissolution',
    domain: ['solitude', 'hidden patterns', 'transcendence'],
    expressions: [
      'works in the background, in dreams, in what dissolves the daylit self',
      'shows up in solitude, in retreat, and in the inheritances you cannot quite see',
      'colors the hidden patterns that steer decisions from underneath',
      'lives in the places where the ego quiets and something larger takes over',
    ],
    section: 'cadent',
  },
};

// Utility maps the composer pulls from.

export const ORDINALS = {
  1: 'First', 2: 'Second', 3: 'Third', 4: 'Fourth', 5: 'Fifth', 6: 'Sixth',
  7: 'Seventh', 8: 'Eighth', 9: 'Ninth', 10: 'Tenth', 11: 'Eleventh', 12: 'Twelfth',
};

// Ascendant & Midheaven — compressed persona notes used directly by buildAsc/buildMc.

export const ASC_NOTES = {
  Aries: {
    firstRead: 'quick, direct, and ready to move',
    presence: 'forward-leaning and a little hot at the edges',
    body: 'alert posture, sharper features, a pace that walks in before introduction',
    pitfall: 'coming across as combative when you meant only to be decisive',
  },
  Taurus: {
    firstRead: 'calm, composed, and genuinely here',
    presence: 'settled, tactile, unhurried in pace and voice',
    body: 'a steady stance and warmth that slows the room by a breath',
    pitfall: 'reading as passive when you are actually deciding in private',
  },
  Gemini: {
    firstRead: 'bright, verbal, and intellectually alive',
    presence: 'animated, quick-eyed, drawn to the nearest interesting sentence',
    body: 'expressive hands, changing tempo, a face that keeps narrating',
    pitfall: 'scattering attention so finely that people feel half-met',
  },
  Cancer: {
    firstRead: 'gentle, attentive, a little reserved at first',
    presence: 'receptive, soft-edged, quietly reading the room',
    body: 'a protective set to the shoulders, watchful eyes, warmth kept close',
    pitfall: 'appearing withdrawn when you are simply still checking for safety',
  },
  Leo: {
    firstRead: 'warm, self-possessed, and memorable',
    presence: 'visible in a way that does not require effort — heart-forward and generous',
    body: 'upright carriage, expressive features, a voice that fills the space it enters',
    pitfall: 'reading as performative when you are only being fully present',
  },
  Virgo: {
    firstRead: 'neat, thoughtful, and slightly cautious',
    presence: 'composed, observant, arriving with the details already sorted',
    body: 'precise movements, clean edges, an attention tuned to accuracy',
    pitfall: 'coming across as reserved or critical when you are simply watching carefully',
  },
  Libra: {
    firstRead: 'gracious, balanced, and socially fluent',
    presence: 'pleasant, aesthetic, attentive to the feel of an encounter',
    body: 'symmetric carriage, considered speech, an eye for harmony in self-presentation',
    pitfall: 'polishing the surface so well that the depth stays hidden',
  },
  Scorpio: {
    firstRead: 'intense, contained, and harder to read than you sound',
    presence: 'magnetic in reserve, watchful, emotionally literate beneath the quiet',
    body: 'steady gaze, low voice, presence that does not volunteer more than it must',
    pitfall: 'reading as suspicious when you are simply taking the room seriously',
  },
  Sagittarius: {
    firstRead: 'open, enthusiastic, and blunt in the best sense',
    presence: 'expansive, curious, keeping one foot pointed toward the horizon',
    body: 'easy laugh, long stride, a face that narrates the story already',
    pitfall: 'sounding tactless when you meant only to be candid',
  },
  Capricorn: {
    firstRead: 'serious, composed, and quietly capable',
    presence: 'reserved on the surface, steady underneath, clearly not wasting effort',
    body: 'contained posture, measured voice, an economy of gesture',
    pitfall: 'reading as cold when you are simply working',
  },
  Aquarius: {
    firstRead: 'independent, distinctive, a little hard to classify',
    presence: 'cool-surfaced but principled, alert to the bigger pattern',
    body: 'a particular style, an observer’s distance, a mind visibly running',
    pitfall: 'appearing detached when you are actually just refusing the script',
  },
  Pisces: {
    firstRead: 'soft, receptive, and elusive at the edges',
    presence: 'porous, atmospheric, picking up feeling the way others pick up words',
    body: 'gentle gaze, flowing movement, an aura more than an outline',
    pitfall: 'blurring your own edges to meet whoever is in front of you',
  },
};

export const MC_NOTES = {
  Aries: {
    callingShape: 'initiative, leadership, and work that rewards the one who goes first',
    publicImage: 'direct, courageous, entrepreneurial',
    trap: 'burning through roles faster than they can reward the investment',
    peak: 'when the willingness to start is disciplined into something that can also finish',
  },
  Taurus: {
    callingShape: 'craft, stewardship of resources, and work built slowly and well',
    publicImage: 'reliable, grounded, tasteful',
    trap: 'staying in a comfortable role long after growth has quietly left it',
    peak: 'when patient mastery compounds into something that outlives the trend',
  },
  Gemini: {
    callingShape: 'communication, teaching, translation, and work that spans multiple channels',
    publicImage: 'articulate, adaptable, informed',
    trap: 'touching many fields lightly instead of choosing one to go deep on',
    peak: 'when curiosity concentrates into a body of work with a recognizable voice',
  },
  Cancer: {
    callingShape: 'care, hospitality, education, and roles that hold people at a human scale',
    publicImage: 'trustworthy, warm, quietly indispensable',
    trap: 'taking professional matters personally enough to carry them home',
    peak: 'when the instinct to nurture becomes a structure others can rely on',
  },
  Leo: {
    callingShape: 'creative leadership, performance, and work that requires real presence',
    publicImage: 'charismatic, generous, unmistakable',
    trap: 'needing applause on a schedule the work cannot sustainably provide',
    peak: 'when vocation becomes a genuine expression of character rather than a stage',
  },
  Virgo: {
    callingShape: 'skilled service, analysis, craft, and the improvement of systems',
    publicImage: 'competent, precise, quietly essential',
    trap: 'undervaluing your own authority until you are overworked by it',
    peak: 'when excellence no longer requires perfection to feel like enough',
  },
  Libra: {
    callingShape: 'partnership, design, diplomacy, and work that lives in between people',
    publicImage: 'fair, polished, relationally skilled',
    trap: 'managing image so well that the position itself goes unexamined',
    peak: 'when fairness is paired with the courage to state a real preference',
  },
  Scorpio: {
    callingShape: 'research, psychology, finance, strategy, or any work that handles depth and transformation',
    publicImage: 'powerful, focused, self-possessed',
    trap: 'accumulating influence quietly and then distrusting anyone who notices',
    peak: 'when power becomes a resource others can safely draw on',
  },
  Sagittarius: {
    callingShape: 'teaching, publishing, travel, cross-cultural work, and roles tied to vision',
    publicImage: 'inspiring, broad-minded, candid',
    trap: 'promising bigger than the infrastructure currently supports',
    peak: 'when vision is tested in specific, bounded projects and earns its scale',
  },
  Capricorn: {
    callingShape: 'leadership, long-form building, administration, and work that rewards endurance',
    publicImage: 'authoritative, disciplined, credible',
    trap: 'defining the self entirely by what the career has measured',
    peak: 'when the achievement includes a life that is still worth living inside it',
  },
  Aquarius: {
    callingShape: 'reform, technology, science, social systems, and work with a longer horizon than most',
    publicImage: 'original, principled, forward-looking',
    trap: 'holding such a long view that the present role feels like a compromise',
    peak: 'when the future you are building is hospitable to specific, warm-blooded people',
  },
  Pisces: {
    callingShape: 'art, healing, spiritual service, charity, and work that reaches the felt layer of life',
    publicImage: 'compassionate, inspired, atmospheric',
    trap: 'drifting between callings whenever a real decision is asked for',
    peak: 'when imagination is disciplined into actual form and actually shared',
  },
};

// Glyphs + short metadata — kept here so natalReadings.js stays lean.

export const PLANET_GLYPHS = {
  Sun: '\u2609', Moon: '\u263D', Mercury: '\u263F', Venus: '\u2640', Mars: '\u2642',
  Jupiter: '\u2643', Saturn: '\u2644', Uranus: '\u2645', Neptune: '\u2646', Pluto: '\u2647',
};

export const PLANET_RULES = {
  Sun: 'Leo',
  Moon: 'Cancer',
  Mercury: 'Gemini / Virgo',
  Venus: 'Taurus / Libra',
  Mars: 'Aries / Scorpio',
  Jupiter: 'Sagittarius / Pisces',
  Saturn: 'Capricorn / Aquarius',
  Uranus: 'Aquarius',
  Neptune: 'Pisces',
  Pluto: 'Scorpio',
};

export const PLANET_KEYWORDS = {
  Sun: 'Identity & Purpose',
  Moon: 'Emotions & Instinct',
  Mercury: 'Mind & Communication',
  Venus: 'Love & Values',
  Mars: 'Drive & Assertion',
  Jupiter: 'Growth & Wisdom',
  Saturn: 'Structure & Discipline',
  Uranus: 'Revolution & Freedom',
  Neptune: 'Transcendence & Illusion',
  Pluto: 'Transformation & Power',
};

export const PLANET_DESCRIPTIONS = {
  Sun: 'The Sun describes your core identity, vitality, and conscious sense of purpose. It shows how you seek to shine, create meaning, and become fully yourself.',
  Moon: 'The Moon reflects your emotional nature, instincts, and need for safety and belonging. It reveals how you react, remember, and seek comfort beneath the surface.',
  Mercury: 'Mercury describes how you think, learn, speak, and make connections. It shows the style of your mind and the way you exchange information with the world.',
  Venus: 'Venus describes love, attraction, values, pleasure, and aesthetic taste. It reveals how you relate, what you appreciate, and what helps life feel harmonious.',
  Mars: 'Mars describes drive, assertion, anger, sexuality, and the urge to act. It shows how you pursue desire, defend yourself, and meet challenge head on.',
  Jupiter: 'Jupiter describes growth, faith, wisdom, opportunity, and the impulse to expand. It shows how you seek meaning, trust life, and develop confidence through experience.',
  Saturn: 'Saturn describes structure, duty, limits, and the discipline required for mastery. It reveals where life asks for patience, realism, and mature responsibility.',
  Uranus: 'Uranus describes freedom, rebellion, originality, and sudden awakening. It shows where you resist stagnation and seek a more authentic, liberated way of living.',
  Neptune: 'Neptune describes imagination, spirituality, ideals, and the dissolution of ordinary boundaries. It reveals how you dream, empathize, idealize, and search for transcendence.',
  Pluto: 'Pluto describes transformation, power, compulsion, and deep regeneration. It shows where life strips away what is superficial so something stronger and more truthful can emerge.',
};

export const HOUSE_KEYWORDS = {
  1: 'Self & Identity',
  2: 'Resources & Values',
  3: 'Communication & Learning',
  4: 'Home & Roots',
  5: 'Creativity & Pleasure',
  6: 'Work & Health',
  7: 'Partnerships & Marriage',
  8: 'Transformation & Shared Resources',
  9: 'Philosophy & Travel',
  10: 'Career & Public Image',
  11: 'Community & Ideals',
  12: 'Unconscious & Transcendence',
};

export const HOUSE_DESCRIPTIONS = {
  1: 'The First House governs your self presentation, physical presence, and the way you begin things. It describes how you meet life directly and how others first experience you.',
  2: 'The Second House governs money, possessions, talents, and personal values. It describes what helps you feel secure and how you build material and inner stability.',
  3: 'The Third House governs communication, learning, siblings, and the local environment. It describes how you exchange ideas, gather information, and move through everyday life.',
  4: 'The Fourth House governs home, family, ancestry, and emotional foundations. It describes your private life, your roots, and the place you return to for belonging.',
  5: 'The Fifth House governs creativity, romance, pleasure, performance, and children. It describes how you express joy, take risks, and bring something personal into the world.',
  6: 'The Sixth House governs work, routines, health, service, and daily responsibilities. It describes how you manage practical life and maintain order in body and schedule.',
  7: 'The Seventh House governs partnerships, marriage, contracts, and significant one to one bonds. It describes what you seek in others and how you learn through relationship.',
  8: 'The Eighth House governs intimacy, shared resources, loss, regeneration, and deep psychological change. It describes the processes that transform you through surrender, trust, and crisis.',
  9: 'The Ninth House governs philosophy, higher education, long distance travel, and the search for truth. It describes how you expand your worldview and pursue meaning beyond the familiar.',
  10: 'The Tenth House governs career, reputation, achievement, and public standing. It describes how you seek to contribute visibly and what you are known for in the wider world.',
  11: 'The Eleventh House governs friends, groups, collective causes, and future aspirations. It describes the communities you join and the ideals you hope to build with others.',
  12: 'The Twelfth House governs the unconscious, retreat, endings, spirituality, and hidden patterns. It describes what operates behind the scenes and how you dissolve into something larger than the ego.',
};

// ─────────────────────────────────────────────────────────────────────
// MARQUEE — hand-tuned top-shelf paragraphs for 24 flagship placements.
// The composer checks this map first; if a key exists, it is used verbatim.
// ─────────────────────────────────────────────────────────────────────

export const MARQUEE_PLANET_SIGN = {
  // ── Personal planets in domicile ──────────────────────────────
  'Sun-Leo':
    'Sun in Leo is the placement at its own address. The planet of identity sits in the sign that runs on warmth, visibility, and the courage to be specifically yourself — there is nothing borrowed in this light. You tend to lead with heart rather than argument, and people generally feel lifted just by being near the room you are in. The strength is a dignity that does not need external permission to keep itself upright. The trap is believing the warmth must be performed to stay lit, so recognition becomes a proxy for an inner authority that was always there. This placement matures when the sovereignty is offered from the inside outward — when you shine because it is your nature, not because an audience has confirmed the license.',

  'Moon-Cancer':
    'Moon in Cancer is the planet of feeling in the sign it rules, which means the emotional instrument is unusually fine-grained and unusually honest. You read atmospheres the way other people read headlines, and your memory for who needs what runs deeper than most. The gift is a gravitational tenderness: the people around you quietly organize their sense of home around the places you tend. The cost is that every small shift in the weather lands somewhere real in the body, and the shell closes faster than thought does. Growth asks the protectiveness to learn the difference between a present threat and an old one, so the care you offer outward can also flow inward without apology.',

  'Mercury-Gemini':
    'Mercury in Gemini is the thinking planet in its home sign — the mind is fast, plural, and built for connection-making across unrelated fields. You notice patterns before you can justify them, translate easily between worlds that rarely speak, and ask the question no one else thought of asking. The strength is lateral intelligence: solutions arrive by going sideways rather than by grinding forward. The shadow is a dozen open tabs in a single sentence — information outpacing digestion, wit outrunning sincerity. This placement earns its gift when the quickness learns to slow enough to actually finish a thought, and when mastery of one thing stops losing to the novelty of the next.',

  'Mercury-Virgo':
    'Mercury in Virgo is both domicile and exaltation — the planet of analysis in the sign that refines until the form finally fits. You think in drafts, revisions, and edge cases, and your mind finds the flaw before the flaw can find the project. The strength is a craftsman-level attention: useful, specific, quietly essential to whatever system you are part of. The hazard is that the same acuity turns on yourself and narrates a running list of what is still not quite right. Maturity arrives when discernment serves the work without auditing the worker, and when precision is paired with a self-kindness the craft itself cannot provide.',

  'Venus-Taurus':
    'Venus in Taurus is the planet of love in its earth home — steady, sensory, and unembarrassed about pleasure as a real form of intelligence. You move at your own pace in affection and taste, trust what can be touched and returned to, and build the kind of bonds that age well rather than burn bright. The strength is fidelity: to people, to quality, to the long arc of a relationship. The trap is comfort masquerading as love — staying because the room is familiar rather than because it is still alive. This placement deepens when loyalty includes loyalty to your own growth, and when the senses welcome change as part of what makes the real thing real.',

  'Venus-Libra':
    'Venus in Libra is the planet of relationship in the sign of relationship, which means the instinct for partnership is refined, aesthetic, and unusually attuned to the space between two people. You notice tone, timing, and fairness the way others notice furniture — it is the architecture you actually live in. The gift is collaborative grace: designing agreements two people can breathe inside of. The shadow is avoiding the friction a real bond requires, polishing the surface until the foundation stops being examined. Maturity here asks diplomacy to stop postponing honesty, and lets balance include the courage to name a preference that is actually yours.',

  'Mars-Aries':
    'Mars in Aries is at home — the planet of drive, friction, and willed action sits in the sign that runs on initiative. Your appetite for movement is unmistakable: you tend to act first and revise from inside the doing, which is its own form of intelligence even when others read it as impulsive. The strength here is a clean signal between what you want and what you do, with very little static in between. The trap, predictably, is mistaking speed for strategy — leading from heat rather than judgment, and burning the people who cannot keep up. This placement matures when courage is paired with patience, not replaced by it: the fire is the gift, the timing is the discipline.',

  'Mars-Scorpio':
    'Mars in Scorpio is the other side of Mars at home — drive in its deeper, subterranean form, with stamina that does not need to announce itself. Where the Aries version acts in daylight, this one concentrates, waits, and commits with a seriousness other placements reserve for ceremony. The strength is willpower that survives opposition, and a desire that does not forget what it wanted. The hazard is intensity turning into control, and strategy turning into the quiet management of other people rather than the pursuit of your own aim. This placement is at its best when depth is aimed at your own transformation first — the same ferocity that can dominate a room can also rebuild a life.',

  // ── Personal planets in detriment ─────────────────────────────
  'Sun-Aquarius':
    'Sun in Aquarius is the vitality principle in the sign of its polarity, and the friction is real: identity here is organized around idea, principle, and group rather than around personal centrality. You tend to locate yourself through participation in something larger — a scene, a project, a cause — and your warmth often reaches people through the work rather than directly. The gift is an ego that naturally makes room for others, refusing to let the room collapse around a single personality. The cost is a self that can hide behind the collective until it no longer knows what it personally wants. This placement comes into its own when the individual signal is claimed without apology, and when community becomes the place you stand out in rather than the place you disappear.',

  'Moon-Capricorn':
    'Moon in Capricorn is the feeling body in the sign of structure, which tends to produce an emotional life that does its best to be adult ahead of schedule. You metabolize vulnerability through responsibility — turning feelings into tasks, and asking what can be built from what hurts. The strength is an emotional spine other people borrow in a crisis, and a capacity to endure that outlasts easier placements. The hardship is that softness often waits for permission that never quite arrives, so tenderness stays in the wings while competence handles the room. This placement heals when the inner caretaker is allowed to be as young as it actually is, and when rest stops needing to justify itself to the foreman inside.',

  'Mercury-Sagittarius':
    'Mercury in Sagittarius runs detail through a mind built for horizon, which means the thinking here is sweeping, principled, and sometimes impatient with specifics. You grasp the big shape of an idea before you have verified every line, and your speech tends toward vision rather than granular accuracy. The gift is a teacher-mind: the ability to frame, to inspire, to see the meaning of what smaller minds are still sorting. The shadow is overshooting the evidence, or preferring the bold claim to the qualified one. Growth here asks the philosophical reach to slow for fact-checking without losing flavor, and for candor to be aimed with the same care as it is delivered.',

  'Mercury-Pisces':
    'Mercury in Pisces is the mind soaked in water — thinking happens through image, atmosphere, and felt sense as much as through language. You pick up what has not been said, intuit the mood beneath an argument, and often know something before you can explain how. The strength is poetic, associative intelligence — the kind that notices music under ordinary speech. The trouble is that precision dissolves easily and facts blur when feeling is strong, so communication can drift when accuracy is what the situation requires. This placement earns itself when the intuitive channel is paired with the discipline of written form, and when the boundaries of a sentence are respected as much as its feeling.',

  'Venus-Aries':
    'Venus in Aries is the planet of affection in the sign that runs on pursuit, which gives love a first-move energy and a short patience for circling. You are drawn to directness, like to know where you stand, and tend to open with heat rather than strategy. The gift is unguarded availability — when you say yes, there is nothing coy about it, and the people you love get the full signal early. The shadow is wanting the beginning more than the middle, and mistaking the spark for the fire it is supposed to start. Maturity arrives when desire is allowed to keep burning after the chase has ended, and when staying becomes as alive a move as arriving was.',

  'Venus-Scorpio':
    'Venus in Scorpio is love in its least polite form — an affection that goes deep, asks for the whole person, and is allergic to the surface. You do not tend to fall halfway, and your bonds are tested less by distance than by the depth they are asked to hold. The strength is an erotic and emotional seriousness that refuses decoration and wants the real thing. The cost is that intimacy can narrow into possession, and love can turn into the careful management of whoever you love. This placement comes into its gift when the intensity is aimed at your own depths first, so what you offer others is presence rather than grip.',

  'Mars-Taurus':
    'Mars in Taurus is drive asked to move through slow, sensory terrain, so the action here is steady, physical, and resistant to being rushed. You do not usually act on impulse; when you move, it is because the ground under the decision has been tested. The gift is stamina — the capacity to keep going long after the first burst has faded, and to finish what flashier placements abandon. The difficulty is that frustration accumulates in the body before it reaches speech, and conflict gets postponed rather than metabolized. This placement matures when the patience is not used as a way to avoid confrontation, and when anger is given language before it leaks into the shoulders, the jaw, and the long silences.',

  'Mars-Libra':
    'Mars in Libra is assertion in the sign of partnership, which means your drive has to move through negotiation rather than through the direct strike. You are often strongest in cooperative action — defending a fairness, advocating for someone else, making a clean argument on behalf of the relationship itself. The gift is diplomatic force: real pressure applied in civil form. The shadow is difficulty standing up for yourself alone — the push is easy when it is for us, harder when it is only for me. Maturity here asks assertion to include your own unshared preferences, so fairness is something you also extend toward yourself.',

  // ── Saturn in its dignities ───────────────────────────────────
  'Saturn-Capricorn':
    'Saturn in Capricorn is the planet of structure in the sign it rules, and the combination is unmistakable: you treat time as the raw material everything else is carved from. Responsibility arrives early, ambition compounds quietly, and the work you build tends to outlast the moods that started it. The gift is an integrity other people can quietly plan their lives around — what you commit to, you carry. The hazard is inheriting seriousness from earlier generations and confusing it with identity, so the achievement crowds out the life that was supposed to live inside it. This placement matures when authority is carried lightly enough to still be kind, and when mastery includes the pleasures it has already earned.',

  'Saturn-Aquarius':
    'Saturn in Aquarius is discipline in the sign of the collective and the unusual, and the result is a responsibility directed at systems rather than at private climbs. You take long views, commit to structures that serve more than yourself, and build slowly in directions that are not immediately rewarded. The strength is principled endurance — staying through the unsexy middle of reforms that only pay out in the next decade. The trap is using the long view as a way to stay distant from the actual humans the work is for, so the vision becomes a cool architecture no one can warmly inhabit. Growth here asks the future you are building to include specific, warm-blooded people — not just the elegant system that will one day hold them.',

  'Saturn-Cancer':
    'Saturn in Cancer is the structure principle in the sign of emotional home, which tends to produce a careful, sometimes guarded relationship to the very places others feel most soft. You take family, home, and inner life seriously — perhaps more seriously than anyone asked you to — and the private world can feel like a responsibility rather than a refuge. The gift is a reliable inner foundation, built deliberately rather than inherited, that others come to lean on. The cost is that tenderness tends to wait for permission that never arrives, and belonging is something you earn rather than allow. This placement heals when the inner child is welcomed without having to prove itself first, and when home stops being an achievement and becomes an invitation.',

  'Saturn-Leo':
    'Saturn in Leo is discipline applied to the creative heart, which can feel like carrying a crown and an audit at the same time. You may want to create, lead, and be seen, yet the permission to shine tends to come in small, measured increments you have to keep earning. The gift, when the slow work is honored, is creative authority that has paid for itself — a presence no one can wave off as luck. The trap is performing worthiness on a stage the inner critic will never actually leave. This placement comes into its own when the heart stops auditioning for its own sovereignty and starts simply exercising it, one unrehearsed act of generosity at a time.',

  // ── Jupiter in its dignities ──────────────────────────────────
  'Jupiter-Sagittarius':
    'Jupiter in Sagittarius is the planet of expansion in the sign it rules, so the reach is unmistakable: you are built for horizons, first principles, and the kind of conviction that keeps doors open long enough for them to actually open. The strength is a native faith that turns experience into wisdom rather than into wound, and the courage to say yes to something larger than current evidence. The hazard is the same impulse in excess — overstating the case, escaping commitment by reframing it as freedom, and preaching before fully learning. This placement matures when the big view is earned by staying through a full cycle of something specific, rather than by sampling many. The gift is vision; the discipline is follow-through.',

  'Jupiter-Pisces':
    'Jupiter in Pisces is expansion in the sign of imagination and dissolution, and the blessing here is a spiritual generosity that reaches the layers of life most placements cannot touch. You are built to forgive without pretending, to imagine without cynicism, and to carry faith through seasons other people abandon it in. The strength is compassion that does not flinch from what needs softening. The trap is idealization past the point of clarity — believing the longing is the thing itself, and letting vision drift when specific form is what the moment asks for. This placement earns itself when the imaginative channel is paired with the discipline to give it form, and when mercy learns when to include a necessary no.',

  'Jupiter-Gemini':
    'Jupiter in Gemini is the expansion planet in the sign of multiplicity, which produces a mind hungry for connection across every available channel. You pick up fluencies easily, move between worlds that rarely speak, and can sound authoritative on more subjects than any one life should technically allow. The gift is a cross-pollinating intelligence that finds meaning in the seams between fields. The shadow is breadth outrunning depth, and cleverness taking the seat that genuine conviction was meant to occupy. Maturity here asks the many interests to converge into something with a throughline — a body of work that keeps your name on it across years, not just a shelf of interesting beginnings.',

  'Jupiter-Virgo':
    'Jupiter in Virgo is expansion in the sign of precision, and the two do not instantly agree: the vision wants to sweep while the craft wants to refine. The result, when it works, is wisdom applied in small, actually-usable forms — the opposite of grand pronouncement. The strength is a faith that keeps the detail honest, a generosity aimed at practical improvement rather than abstract ideal. The trap is letting worry impersonate diligence, shrinking the scope until the blessing cannot breathe. This placement matures when the critical eye is trained on the work and then turned away from the worker, so precision becomes service rather than self-policing, and the larger meaning is allowed to sit comfortably inside ordinary, well-made things.',
};
