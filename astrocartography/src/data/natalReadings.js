// ── Multilingual Natal Readings ──
// Composes personalized astrological readings from translated fragments
// English data is inline; other languages loaded from translation files

import { NATAL_I18N } from './natalReadingsI18n.js';
import { NATAL_I18N_2 } from './natalReadingsI18n2.js';
import { t as tUI } from '../lib/i18n.js';

const ALL_I18N = { ...(NATAL_I18N || {}), ...(NATAL_I18N_2 || {}) };

// ── Localized names for planets, signs, elements, modalities ──
// Planet + sign names are translated via the main i18n table (pSun, sAries, mCardinal).
// Element names are only used in readings, so we keep them inline here.
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

function locPlanet(planet, lang) {
  return tUI('p' + planet, lang) || planet;
}
function locSign(sign, lang) {
  return tUI('s' + sign, lang) || sign;
}
function locElement(element, lang) {
  const table = ELEMENT_I18N[lang] || ELEMENT_I18N.en;
  return (table[element] || element).toLowerCase();
}
function locModality(modality, lang) {
  const table = MODALITY_I18N[lang] || MODALITY_I18N.en;
  return (table[modality] || modality).toLowerCase();
}

const PLANETS = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const HOUSES = [1,2,3,4,5,6,7,8,9,10,11,12];

// ── English source data ──

const EN_ORDINALS = { 1:'First',2:'Second',3:'Third',4:'Fourth',5:'Fifth',6:'Sixth',7:'Seventh',8:'Eighth',9:'Ninth',10:'Tenth',11:'Eleventh',12:'Twelfth' };

const EN_SIGN_DATA = {
  Aries: { element:'Fire', modality:'Cardinal', ruler:'Mars', style:'direct, courageous, and self-starting', behavior:'act quickly, trust your instincts, and prefer honesty over hesitation', strength:'initiative, boldness, and the willingness to go first', challenge:'impatience, impulsiveness, or unnecessary conflict when reflection would help' },
  Taurus: { element:'Earth', modality:'Fixed', ruler:'Venus', style:'steady, sensual, and grounded', behavior:'move at your own pace, value consistency, and build slowly but securely', strength:'stability, loyalty, and enduring strength', challenge:'stubbornness, inertia, or clinging to what is familiar long after growth asks for change' },
  Gemini: { element:'Air', modality:'Mutable', ruler:'Mercury', style:'curious, adaptable, and mentally quick', behavior:'process life through language, comparison, and constant movement between ideas', strength:'versatility, wit, and the ability to make connections quickly', challenge:'restlessness, inconsistency, or staying on the surface when more depth is needed' },
  Cancer: { element:'Water', modality:'Cardinal', ruler:'Moon', style:'sensitive, protective, and emotionally responsive', behavior:'take things personally, remember deeply, and seek emotional safety before opening fully', strength:'empathy, loyalty, and the instinct to care for what matters', challenge:'defensiveness, moodiness, or retreating into self-protection when you feel exposed' },
  Leo: { element:'Fire', modality:'Fixed', ruler:'Sun', style:'warm, expressive, and heart-centered', behavior:'need to create, radiate, and live with dignity and personal meaning', strength:'confidence, generosity, and the ability to energize others', challenge:'pride, stubbornness, or over-identifying with recognition and approval' },
  Virgo: { element:'Earth', modality:'Mutable', ruler:'Mercury', style:'observant, discerning, and practical', behavior:'notice details, refine systems, and look for useful ways to improve life', strength:'precision, skill, and grounded intelligence', challenge:'worry, perfectionism, or excessive self-criticism when reality feels untidy' },
  Libra: { element:'Air', modality:'Cardinal', ruler:'Venus', style:'balanced, relational, and socially aware', behavior:'seek fairness, weigh perspectives, and understand yourself through interaction', strength:'diplomacy, grace, and the ability to create cooperation', challenge:'indecision, people-pleasing, or avoiding conflict at the cost of honesty' },
  Scorpio: { element:'Water', modality:'Fixed', ruler:'Pluto + Mars', style:'intense, private, and transformative', behavior:'feel deeply, read beneath the surface, and move through life with emotional depth', strength:'resilience, insight, and the power to regenerate', challenge:'control, suspicion, or holding on too tightly when vulnerability feels risky' },
  Sagittarius: { element:'Fire', modality:'Mutable', ruler:'Jupiter', style:'expansive, adventurous, and meaning-seeking', behavior:'look for the larger truth, value freedom, and learn through direct experience', strength:'optimism, candor, and a broad, inspiring perspective', challenge:'carelessness, overstatement, or escaping limits before learning from them' },
  Capricorn: { element:'Earth', modality:'Cardinal', ruler:'Saturn', style:'disciplined, strategic, and reality-based', behavior:'measure progress carefully, take responsibility seriously, and respect time and structure', strength:'endurance, maturity, and the ability to build something lasting', challenge:'rigidity, pessimism, or becoming overly defined by duty and achievement' },
  Aquarius: { element:'Air', modality:'Fixed', ruler:'Uranus + Saturn', style:'independent, original, and future-oriented', behavior:'think outside convention, value freedom, and care about principles as much as people', strength:'innovation, objectivity, and courage to challenge old patterns', challenge:'detachment, contrariness, or valuing distance so much that intimacy becomes harder' },
  Pisces: { element:'Water', modality:'Mutable', ruler:'Neptune + Jupiter', style:'intuitive, compassionate, and porous', behavior:'absorb atmosphere easily, live close to imagination, and respond to subtle undercurrents', strength:'empathy, imagination, and spiritual receptivity', challenge:'confusion, escapism, or blurred boundaries when life becomes overwhelming' },
};

const EN_PLANET_ROLE = {
  Sun: { rep:'your core identity, vitality, and conscious purpose', strength:'confidence and creative self-definition', challenge:'ego rigidity or measuring your worth through recognition alone' },
  Moon: { rep:'your emotional nature, instincts, and need for security', strength:'emotional intelligence and instinctive responsiveness', challenge:'mood-driven reactions or difficulty naming what you need' },
  Mercury: { rep:'your mind, communication style, and way of learning', strength:'clarity, adaptability, and mental agility', challenge:'overthinking, miscommunication, or scattering your attention' },
  Venus: { rep:'love, values, attraction, pleasure, and relationship style', strength:'social grace, aesthetic instinct, and capacity for warmth', challenge:'avoidance, dependency, or confusing comfort with true compatibility' },
  Mars: { rep:'drive, assertion, anger, courage, and sexual energy', strength:'initiative, bravery, and decisive action', challenge:'impatience, conflict, or using force where strategy would serve you better' },
  Jupiter: { rep:'growth, faith, opportunity, wisdom, and expansion', strength:'optimism, generosity, and broad perspective', challenge:'excess, overconfidence, or promising more than life can sustain' },
  Saturn: { rep:'structure, discipline, responsibility, and the reality principle', strength:'endurance, integrity, and practical wisdom', challenge:'fear, rigidity, or carrying burdens so tightly that life loses warmth' },
  Uranus: { rep:'freedom, originality, disruption, and awakening', strength:'innovation, courage to change, and independent vision', challenge:'instability, rebellion for its own sake, or resistance to emotional continuity' },
  Neptune: { rep:'imagination, spirituality, ideals, compassion, and dissolution', strength:'sensitivity, inspiration, and spiritual imagination', challenge:'confusion, escapism, or idealizing what needs clearer boundaries' },
  Pluto: { rep:'transformation, power, depth, compulsion, and regeneration', strength:'resilience, psychological insight, and power to renew yourself', challenge:'control, obsession, or forcing change before trust is ready' },
};

const EN_HOUSE_DATA = {
  1: { title:'First House', keyword:'Self & Identity', long:'your identity, body, style, and the way you meet life directly', short:'how you present yourself and initiate experience' },
  2: { title:'Second House', keyword:'Resources & Values', long:'your money, possessions, talents, and personal values', short:'what helps you feel secure and materially grounded' },
  3: { title:'Third House', keyword:'Communication & Learning', long:'communication, learning, siblings, and everyday movement', short:'how you think on your feet and exchange information' },
  4: { title:'Fourth House', keyword:'Home & Roots', long:'home, family, ancestry, and emotional foundations', short:'your private life and what gives you inner belonging' },
  5: { title:'Fifth House', keyword:'Creativity & Pleasure', long:'creativity, romance, joy, children, and self-expression', short:'how you play, create, and reveal your heart' },
  6: { title:'Sixth House', keyword:'Work & Health', long:'work, health, routine, service, and daily maintenance', short:'how you handle practical obligations and refine your habits' },
  7: { title:'Seventh House', keyword:'Partnerships & Marriage', long:'partnerships, marriage, contracts, and important one-to-one bonds', short:'how you relate to equals and learn through connection' },
  8: { title:'Eighth House', keyword:'Transformation & Shared Resources', long:'intimacy, shared resources, crisis, loss, and transformation', short:'where you merge, confront depth, and undergo inner change' },
  9: { title:'Ninth House', keyword:'Philosophy & Travel', long:'philosophy, travel, higher learning, and the search for truth', short:'how you expand your worldview beyond the familiar' },
  10: { title:'Tenth House', keyword:'Career & Public Image', long:'career, reputation, achievement, and public standing', short:'how you contribute visibly and define your path in the world' },
  11: { title:'Eleventh House', keyword:'Community & Ideals', long:'friends, groups, causes, and future hopes', short:'how you participate in communities and imagine the future' },
  12: { title:'Twelfth House', keyword:'Unconscious & Transcendence', long:'the unconscious, retreat, endings, spirituality, and hidden patterns', short:'what operates behind the scenes and asks for surrender or compassion' },
};

const EN_HOUSE_EFFECT = {
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

const EN_ASC_DATA = {
  Aries: { outer:'active, direct, and alert', first:'straightforward, courageous, and quick to act', persona:'move first and explain later', challenge:'impatient or overly sharp when life slows down' },
  Taurus: { outer:'calm, grounded, and composed', first:'steady, reliable, and hard to rush', persona:'prefer a measured pace and clear sensory reality', challenge:'stubborn or resistant when pushed too quickly' },
  Gemini: { outer:'quick, curious, and animated', first:'bright, talkative, and mentally agile', persona:'adapt rapidly and take in many impressions at once', challenge:'scattered or overly cerebral under pressure' },
  Cancer: { outer:'gentle, watchful, and emotionally receptive', first:'caring, private, and protective', persona:'scan for safety before fully opening', challenge:'guarded or moody when you feel exposed' },
  Leo: { outer:'warm, noticeable, and self-possessed', first:'confident, expressive, and memorable', persona:'bring heart, style, and personal drama into the room', challenge:'proud or overly performative when insecure' },
  Virgo: { outer:'neat, observant, and modest', first:'competent, thoughtful, and discerning', persona:'notice details quickly and prefer a composed presentation', challenge:'self-conscious or overly critical of yourself' },
  Libra: { outer:'gracious, balanced, and socially aware', first:'pleasant, refined, and cooperative', persona:'pay attention to tone, fairness, and aesthetic harmony', challenge:'indecisive or too accommodating for the sake of peace' },
  Scorpio: { outer:'intense, contained, and magnetic', first:'private, perceptive, and hard to read', persona:'hold energy close and observe carefully before trusting', challenge:'suspicious or overly controlled when vulnerable' },
  Sagittarius: { outer:'open, lively, and forward-moving', first:'candid, enthusiastic, and adventurous', persona:'meet life as something to explore and expand', challenge:'restless or tactless when confined' },
  Capricorn: { outer:'reserved, self-controlled, and capable', first:'serious, reliable, and composed', persona:'prefer competence and clear structure over display', challenge:'overly guarded or severe when stressed' },
  Aquarius: { outer:'unconventional, detached, and mentally alert', first:'independent, interesting, and somewhat unpredictable', persona:'want room to be yourself without too much social pressure', challenge:'distant or contrarian when closeness feels restrictive' },
  Pisces: { outer:'soft, receptive, and elusive', first:'gentle, imaginative, and empathic', persona:'pick up atmosphere quickly and blur hard edges naturally', challenge:'diffuse or hard to define when strong boundaries are needed' },
};

const EN_MC_DATA = {
  Aries: { fields:'initiative, leadership, entrepreneurship, and pioneering work', image:'bold, independent, and willing to take risks', challenge:'impatience or conflict with authority' },
  Taurus: { fields:'stability, craftsmanship, finance, design, beauty, or any work built slowly and well', image:'reliable, steady, and grounded', challenge:'stagnation or overattachment to security' },
  Gemini: { fields:'communication, writing, teaching, media, sales, translation, or multi-track careers', image:'quick-minded, adaptable, and informed', challenge:'scattered ambition or difficulty committing to one direction' },
  Cancer: { fields:'care, hospitality, education, healing, family-oriented work, or roles that protect and nurture', image:'supportive, intuitive, and trustworthy', challenge:'taking professional matters too personally' },
  Leo: { fields:'creative leadership, performance, visibility, management, branding, or work that requires strong personal presence', image:'confident, expressive, and charismatic', challenge:'pride or dependence on recognition' },
  Virgo: { fields:'service, analysis, editing, health, research, craft, systems, or improvement-oriented professions', image:'competent, precise, and helpful', challenge:'perfectionism or undervaluing your own authority' },
  Libra: { fields:'diplomacy, law, design, art, mediation, consulting, partnership work, or refined public roles', image:'fair, polished, and relationally skilled', challenge:'indecision or excessive image management' },
  Scorpio: { fields:'psychology, finance, research, investigation, strategy, healing, crisis management, or transformative work', image:'intense, powerful, and self-possessed', challenge:'control struggles or secrecy' },
  Sagittarius: { fields:'teaching, publishing, travel, law, philosophy, coaching, international work, or roles tied to vision', image:'optimistic, broad-minded, and inspiring', challenge:'overpromising or resisting necessary limits' },
  Capricorn: { fields:'administration, management, governance, long-term leadership, business, or any path requiring endurance', image:'authoritative, disciplined, and credible', challenge:'overwork or defining yourself only through achievement' },
  Aquarius: { fields:'technology, reform, science, social systems, networks, innovation, or unconventional professional paths', image:'original, progressive, and principled', challenge:'alienation or resistance to ordinary structures' },
  Pisces: { fields:'art, film, music, healing, spiritual service, charity, imagination-led work, or fluid callings', image:'compassionate, inspired, and elusive', challenge:'confusion, drift, or weak professional boundaries' },
};

const EN_PLANET_INFO = {
  Sun: { glyph:'\u2609', name:'Sun', keyword:'Identity & Purpose', rules:'Leo', description:'The Sun describes your core identity, vitality, and conscious sense of purpose. It shows how you seek to shine, create meaning, and become fully yourself.' },
  Moon: { glyph:'\u263D', name:'Moon', keyword:'Emotions & Instinct', rules:'Cancer', description:'The Moon reflects your emotional nature, instincts, and need for safety and belonging. It reveals how you react, remember, and seek comfort beneath the surface.' },
  Mercury: { glyph:'\u263F', name:'Mercury', keyword:'Mind & Communication', rules:'Gemini / Virgo', description:'Mercury describes how you think, learn, speak, and make connections. It shows the style of your mind and the way you exchange information with the world.' },
  Venus: { glyph:'\u2640', name:'Venus', keyword:'Love & Values', rules:'Taurus / Libra', description:'Venus describes love, attraction, values, pleasure, and aesthetic taste. It reveals how you relate, what you appreciate, and what helps life feel harmonious.' },
  Mars: { glyph:'\u2642', name:'Mars', keyword:'Drive & Assertion', rules:'Aries / Scorpio', description:'Mars describes drive, assertion, anger, sexuality, and the urge to act. It shows how you pursue desire, defend yourself, and meet challenge head on.' },
  Jupiter: { glyph:'\u2643', name:'Jupiter', keyword:'Growth & Wisdom', rules:'Sagittarius / Pisces', description:'Jupiter describes growth, faith, wisdom, opportunity, and the impulse to expand. It shows how you seek meaning, trust life, and develop confidence through experience.' },
  Saturn: { glyph:'\u2644', name:'Saturn', keyword:'Structure & Discipline', rules:'Capricorn / Aquarius', description:'Saturn describes structure, duty, limits, and the discipline required for mastery. It reveals where life asks for patience, realism, and mature responsibility.' },
  Uranus: { glyph:'\u2645', name:'Uranus', keyword:'Revolution & Freedom', rules:'Aquarius', description:'Uranus describes freedom, rebellion, originality, and sudden awakening. It shows where you resist stagnation and seek a more authentic, liberated way of living.' },
  Neptune: { glyph:'\u2646', name:'Neptune', keyword:'Transcendence & Illusion', rules:'Pisces', description:'Neptune describes imagination, spirituality, ideals, and the dissolution of ordinary boundaries. It reveals how you dream, empathize, idealize, and search for transcendence.' },
  Pluto: { glyph:'\u2647', name:'Pluto', keyword:'Transformation & Power', rules:'Scorpio', description:'Pluto describes transformation, power, compulsion, and deep regeneration. It shows where life strips away what is superficial so something stronger and more truthful can emerge.' },
};

const EN_HOUSE_INFO = {
  1: { name:'First House', keyword:'Self & Identity', description:'The First House governs your self presentation, physical presence, and the way you begin things. It describes how you meet life directly and how others first experience you.' },
  2: { name:'Second House', keyword:'Resources & Values', description:'The Second House governs money, possessions, talents, and personal values. It describes what helps you feel secure and how you build material and inner stability.' },
  3: { name:'Third House', keyword:'Communication & Learning', description:'The Third House governs communication, learning, siblings, and the local environment. It describes how you exchange ideas, gather information, and move through everyday life.' },
  4: { name:'Fourth House', keyword:'Home & Roots', description:'The Fourth House governs home, family, ancestry, and emotional foundations. It describes your private life, your roots, and the place you return to for belonging.' },
  5: { name:'Fifth House', keyword:'Creativity & Pleasure', description:'The Fifth House governs creativity, romance, pleasure, performance, and children. It describes how you express joy, take risks, and bring something personal into the world.' },
  6: { name:'Sixth House', keyword:'Work & Health', description:'The Sixth House governs work, routines, health, service, and daily responsibilities. It describes how you manage practical life and maintain order in body and schedule.' },
  7: { name:'Seventh House', keyword:'Partnerships & Marriage', description:'The Seventh House governs partnerships, marriage, contracts, and significant one to one bonds. It describes what you seek in others and how you learn through relationship.' },
  8: { name:'Eighth House', keyword:'Transformation & Shared Resources', description:'The Eighth House governs intimacy, shared resources, loss, regeneration, and deep psychological change. It describes the processes that transform you through surrender, trust, and crisis.' },
  9: { name:'Ninth House', keyword:'Philosophy & Travel', description:'The Ninth House governs philosophy, higher education, long distance travel, and the search for truth. It describes how you expand your worldview and pursue meaning beyond the familiar.' },
  10: { name:'Tenth House', keyword:'Career & Public Image', description:'The Tenth House governs career, reputation, achievement, and public standing. It describes how you seek to contribute visibly and what you are known for in the wider world.' },
  11: { name:'Eleventh House', keyword:'Community & Ideals', description:'The Eleventh House governs friends, groups, collective causes, and future aspirations. It describes the communities you join and the ideals you hope to build with others.' },
  12: { name:'Twelfth House', keyword:'Unconscious & Transcendence', description:'The Twelfth House governs the unconscious, retreat, endings, spirituality, and hidden patterns. It describes what operates behind the scenes and how you dissolve into something larger than the ego.' },
};

// English templates
const EN_TEMPLATES = {
  planetSignLine1: {
    Sun: 'Your Sun describes {rep}, and in {sign} it becomes {style}.',
    Moon: 'Your Moon describes {rep}, and in {sign} your inner life becomes {style}.',
    Mercury: 'Your Mercury describes {rep}, and in {sign} your mind becomes {style}.',
    Venus: 'Your Venus describes {rep}, and in {sign} your way of loving becomes {style}.',
    Mars: 'Your Mars describes {rep}, and in {sign} your drive becomes {style}.',
    Jupiter: 'Your Jupiter describes {rep}, and in {sign} your growth instinct becomes {style}.',
    Saturn: 'Your Saturn describes {rep}, and in {sign} your disciplined side becomes {style}.',
    Uranus: 'Your Uranus describes {rep}, and in {sign} your urge for freedom becomes {style}.',
    Neptune: 'Your Neptune describes {rep}, and in {sign} your imagination becomes {style}.',
    Pluto: 'Your Pluto describes {rep}, and in {sign} your transformative power becomes {style}.',
  },
  planetSignLine2: {
    Sun: 'You usually {behavior}, and this is obvious in the way you shape identity and purpose.',
    Moon: 'You usually {behavior}, and this strongly shapes what helps you feel safe and how you recover from stress.',
    Mercury: 'You usually {behavior}, and this influences how you speak, learn, and decide what matters.',
    Venus: 'You usually {behavior}, and this colors attraction, affection, taste, and relationship patterns.',
    Mars: 'You usually {behavior}, and this affects how you pursue desire, take initiative, and handle conflict.',
    Jupiter: 'You usually {behavior}, and this influences what encourages you and how you pursue larger horizons.',
    Saturn: 'You usually {behavior}, and this affects how you handle effort, boundaries, and long-term responsibility.',
    Uranus: 'You usually {behavior}, and this shapes how you break patterns and insist on authenticity.',
    Neptune: 'You usually {behavior}, and this colors your ideals, intuition, and sensitivity to subtle atmosphere.',
    Pluto: 'You usually {behavior}, and this shapes how you confront truth, intensity, and the need for renewal.',
  },
  strengthChallenge: 'One of your strengths here is {planetStrength}, supported by {signStrength}. One challenge is {planetChallenge}, especially through {signChallenge}.',
  planetSignLine5: {
    Sun: 'You notice this influence clearly in real situations. You develop best when confidence includes self-awareness and not only force of will.',
    Moon: 'You notice this influence clearly in real situations. You grow emotionally when sensitivity is paired with steadiness and clear self-knowledge.',
    Mercury: 'You notice this influence clearly in real situations. You think at your best when curiosity is matched by reflection and consequence.',
    Venus: 'You notice this influence clearly in real situations. You love best when pleasure stays connected to honesty, reciprocity, and emotional reality.',
    Mars: 'You notice this influence clearly in real situations. You use this placement best when courage stays connected to timing and strategy.',
    Jupiter: 'You notice this influence clearly in real situations. You benefit most when enthusiasm is grounded by judgment and lived wisdom.',
    Saturn: 'You notice this influence clearly in real situations. You mature most fully when discipline supports life instead of hardening it.',
    Uranus: 'You notice this influence clearly in real situations. You use this placement best when freedom serves awakening rather than chaos.',
    Neptune: 'You notice this influence clearly in real situations. You thrive when inspiration is protected by discernment and healthy boundaries.',
    Pluto: 'You notice this influence clearly in real situations. You use this placement best when power becomes conscious, ethical, and regenerative.',
  },
  generational: {
    Uranus: ' Because Uranus moves slowly, this also describes a generational style of questioning old rules and seeking new freedom.',
    Neptune: ' Because Neptune moves slowly, this also speaks to a generational dream, ideal, or illusion shared by your age group.',
    Pluto: ' Because Pluto moves slowly, this also marks a generational process of deep change around power, crisis, and renewal.',
  },
  planetInHouse: {
    opening: 'With {planet} in the {houseTitle}, {houseShort} becomes a major channel for {rep}.',
    middle: 'You are likely to experience this planet most directly through {houseLong}, and your everyday behavior often reflects it in practical ways.',
    endings: {
      Sun: 'You may feel most alive when you can take ownership of this area and shape it according to your values and purpose.',
      Moon: 'You may instinctively protect this area, fluctuate strongly with it, and need greater emotional awareness around it than other people seem to require.',
      Mercury: 'You may talk about this area often, analyze it constantly, and become especially skillful wherever information or coordination is required.',
      Venus: 'You may attract ease here, care deeply about harmony in this domain, and often make choices based on what feels graceful or relationally right.',
      Mars: 'You may become especially proactive here, sometimes productive and courageous, sometimes reactive when blocked or challenged.',
      Jupiter: 'You may naturally expect more from this area, seek opportunities through it, and grow by trusting its possibilities while keeping perspective.',
      Saturn: 'You may meet delays or pressure here, yet with time this can become one of the strongest and most reliable parts of your life.',
      Uranus: 'You may behave unpredictably here, crave autonomy, and resist anyone who tries to force this area into lifeless routines.',
      Neptune: 'You may bring compassion and imagination here, but you may also need to check facts, limits, and assumptions more carefully.',
      Pluto: 'You may be changed deeply by what happens here, and control issues or profound healing work can surface through this life domain.',
    },
  },
  asc: {
    line1: 'Your Ascendant describes your outer style, first impression, and the way you instinctively approach new situations, and in {sign} it gives you a presentation that feels {outer}.',
    line2: 'Other people often read you as {first}, even before they know your deeper nature, because this rising sign shapes your posture, pacing, tone, and social signal.',
    line3: 'You tend to {persona}, which means your persona is often built around the {element} and {modality} qualities of {sign}.',
    line4: 'At your best, this gives you {signStrength} in how you meet the world. One challenge is appearing {ascChallenge}.',
    line5: 'You use this Ascendant well when your surface style becomes an honest gateway to the deeper person behind it, rather than a mask that does all the talking for you.',
  },
  mc: {
    line1: 'Your Midheaven describes career direction, public image, visible achievement, and the kind of life purpose you want to grow into, and in {sign} it points toward work shaped by {fields}.',
    line2: 'You are often seen publicly as {image}, because this sign colors the way ambition and responsibility are expressed.',
    line3: 'There is usually a need to build a vocation that feels {style}, so your path works best when it reflects your natural way of contributing.',
    line4: 'One challenge can be {mcChallenge}. Your fulfillment grows when professional life becomes a genuine expression of character and long-term meaning.',
  },
};

// ── Helper: get data for a language, falling back to English ──
function getData(lang) {
  const l = lang || 'en';
  if (l === 'en') return {
    lang: 'en',
    ordinals: EN_ORDINALS, signData: EN_SIGN_DATA, planetRole: EN_PLANET_ROLE,
    houseData: EN_HOUSE_DATA, houseEffect: EN_HOUSE_EFFECT, ascData: EN_ASC_DATA,
    mcData: EN_MC_DATA, planetInfo: EN_PLANET_INFO, houseInfo: EN_HOUSE_INFO,
    templates: EN_TEMPLATES,
  };

  const i = ALL_I18N[l];
  if (!i) return getData('en');

  return {
    lang: l,
    ordinals: i.ORDINALS || EN_ORDINALS,
    signData: mergeSignData(i.SIGN_DATA),
    planetRole: i.PLANET_ROLE || EN_PLANET_ROLE,
    houseData: i.HOUSE_DATA || EN_HOUSE_DATA,
    houseEffect: i.HOUSE_EFFECT || EN_HOUSE_EFFECT,
    ascData: i.ASC_DATA || EN_ASC_DATA,
    mcData: i.MC_DATA || EN_MC_DATA,
    planetInfo: mergePlanetInfo(i.PLANET_INFO),
    houseInfo: mergeHouseInfo(i.HOUSE_INFO),
    templates: i.TEMPLATES || EN_TEMPLATES,
  };
}

// Merge translated sign data with English structural data (element, modality, ruler)
function mergeSignData(translated) {
  if (!translated) return EN_SIGN_DATA;
  const merged = {};
  for (const sign of SIGNS) {
    merged[sign] = {
      element: EN_SIGN_DATA[sign].element,
      modality: EN_SIGN_DATA[sign].modality,
      ruler: EN_SIGN_DATA[sign].ruler,
      style: translated[sign]?.style || EN_SIGN_DATA[sign].style,
      behavior: translated[sign]?.behavior || EN_SIGN_DATA[sign].behavior,
      strength: translated[sign]?.strength || EN_SIGN_DATA[sign].strength,
      challenge: translated[sign]?.challenge || EN_SIGN_DATA[sign].challenge,
    };
  }
  return merged;
}

function mergePlanetInfo(translated) {
  if (!translated) return EN_PLANET_INFO;
  const merged = {};
  for (const p of PLANETS) {
    merged[p] = {
      glyph: EN_PLANET_INFO[p].glyph,
      name: EN_PLANET_INFO[p].name,
      rules: EN_PLANET_INFO[p].rules,
      keyword: translated[p]?.keyword || EN_PLANET_INFO[p].keyword,
      description: translated[p]?.description || EN_PLANET_INFO[p].description,
    };
  }
  return merged;
}

function mergeHouseInfo(translated) {
  if (!translated) return EN_HOUSE_INFO;
  const merged = {};
  for (const h of HOUSES) {
    merged[h] = {
      name: EN_HOUSE_INFO[h].name,
      keyword: translated[h]?.keyword || EN_HOUSE_INFO[h].keyword,
      description: translated[h]?.description || EN_HOUSE_INFO[h].description,
    };
  }
  return merged;
}

// ── Template string replacer ──
function tpl(template, vars) {
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), v);
  }
  return s;
}

// ── Builders (language-aware) ──

function buildPlanetInSign(planet, sign, d) {
  const role = d.planetRole[planet] || EN_PLANET_ROLE[planet];
  const signInfo = d.signData[sign] || EN_SIGN_DATA[sign];
  const t = d.templates || EN_TEMPLATES;
  const signLoc = locSign(sign, d.lang);

  const line1Tpl = t.planetSignLine1?.[planet] || EN_TEMPLATES.planetSignLine1[planet];
  const line2Tpl = t.planetSignLine2?.[planet] || EN_TEMPLATES.planetSignLine2[planet];
  const scTpl = t.strengthChallenge || EN_TEMPLATES.strengthChallenge;
  const line5 = t.planetSignLine5?.[planet] || EN_TEMPLATES.planetSignLine5[planet];
  const gen = t.generational?.[planet] || EN_TEMPLATES.generational?.[planet] || '';

  return (
    tpl(line1Tpl, { rep: role.rep, sign: signLoc, style: signInfo.style }) + ' ' +
    tpl(line2Tpl, { behavior: signInfo.behavior }) + ' ' +
    tpl(scTpl, { planetStrength: role.strength, signStrength: signInfo.strength, planetChallenge: role.challenge, signChallenge: signInfo.challenge }) + ' ' +
    line5 + (gen || '')
  );
}

function buildPlanetInHouse(planet, house, d) {
  const role = d.planetRole[planet] || EN_PLANET_ROLE[planet];
  const houseInfo = d.houseData[house] || EN_HOUSE_DATA[house];
  const effect = (d.houseEffect || EN_HOUSE_EFFECT)[planet];
  const t = d.templates || EN_TEMPLATES;
  const pih = t.planetInHouse || EN_TEMPLATES.planetInHouse;
  const planetLoc = locPlanet(planet, d.lang);

  const opening = tpl(pih.opening || EN_TEMPLATES.planetInHouse.opening, { planet: planetLoc, houseTitle: houseInfo.title, houseShort: houseInfo.short, rep: role.rep });
  const middle = tpl(pih.middle || EN_TEMPLATES.planetInHouse.middle, { houseLong: houseInfo.long });
  const ending = pih.endings?.[planet] || EN_TEMPLATES.planetInHouse.endings[planet];

  return opening + ' ' + middle + ' ' + effect + ' ' + ending;
}

function buildAsc(sign, d) {
  const signInfo = d.signData[sign] || EN_SIGN_DATA[sign];
  const asc = (d.ascData || EN_ASC_DATA)[sign];
  const t = (d.templates || EN_TEMPLATES).asc || EN_TEMPLATES.asc;
  const signLoc = locSign(sign, d.lang);
  const elementLoc = locElement(signInfo.element, d.lang);
  const modalityLoc = locModality(signInfo.modality, d.lang);

  return (
    tpl(t.line1, { sign: signLoc, outer: asc.outer }) + ' ' +
    tpl(t.line2, { first: asc.first }) + ' ' +
    tpl(t.line3, { persona: asc.persona, element: elementLoc, modality: modalityLoc, sign: signLoc }) + ' ' +
    tpl(t.line4, { signStrength: signInfo.strength, ascChallenge: asc.challenge }) + ' ' +
    t.line5
  );
}

function buildMc(sign, d) {
  const signInfo = d.signData[sign] || EN_SIGN_DATA[sign];
  const mc = (d.mcData || EN_MC_DATA)[sign];
  const t = (d.templates || EN_TEMPLATES).mc || EN_TEMPLATES.mc;
  const signLoc = locSign(sign, d.lang);

  return (
    tpl(t.line1, { sign: signLoc, fields: mc.fields }) + ' ' +
    tpl(t.line2, { image: mc.image }) + ' ' +
    tpl(t.line3, { style: signInfo.style }) + ' ' +
    tpl(t.line4, { mcChallenge: mc.challenge })
  );
}

// ── Cache for generated readings per language ──
const _cache = {};

/**
 * Get all natal readings for a specific language.
 * Returns { PLANET_IN_SIGN, PLANET_IN_HOUSE, ASC_IN_SIGN, MC_IN_SIGN, PLANET_INFO, HOUSE_INFO }
 */
export function getNatalReadings(lang) {
  const l = lang || 'en';
  if (_cache[l]) return _cache[l];

  const d = getData(l);

  const PLANET_IN_SIGN = {};
  for (const planet of PLANETS) {
    for (const sign of SIGNS) {
      PLANET_IN_SIGN[planet + '-' + sign] = {
        title: planet + ' in ' + sign,
        text: buildPlanetInSign(planet, sign, d),
      };
    }
  }

  const PLANET_IN_HOUSE = {};
  for (const planet of PLANETS) {
    for (const house of HOUSES) {
      PLANET_IN_HOUSE[planet + '-' + String(house)] = {
        title: planet + ' in the ' + (d.ordinals[house] || EN_ORDINALS[house]) + ' House',
        text: buildPlanetInHouse(planet, house, d),
      };
    }
  }

  const ASC_IN_SIGN = {};
  for (const sign of SIGNS) {
    ASC_IN_SIGN[sign] = {
      title: 'Ascendant in ' + sign,
      text: buildAsc(sign, d),
    };
  }

  const MC_IN_SIGN = {};
  for (const sign of SIGNS) {
    MC_IN_SIGN[sign] = {
      title: 'Midheaven in ' + sign,
      text: buildMc(sign, d),
    };
  }

  const result = {
    PLANET_IN_SIGN,
    PLANET_IN_HOUSE,
    ASC_IN_SIGN,
    MC_IN_SIGN,
    PLANET_INFO: d.planetInfo,
    HOUSE_INFO: d.houseInfo,
  };

  _cache[l] = result;
  return result;
}

// ── Backward-compatible exports (English only, for any code that imports directly) ──
const _en = getNatalReadings('en');
export const PLANET_IN_SIGN = _en.PLANET_IN_SIGN;
export const PLANET_IN_HOUSE = _en.PLANET_IN_HOUSE;
export const ASC_IN_SIGN = _en.ASC_IN_SIGN;
export const MC_IN_SIGN = _en.MC_IN_SIGN;
export const PLANET_INFO = _en.PLANET_INFO;
export const HOUSE_INFO = _en.HOUSE_INFO;
