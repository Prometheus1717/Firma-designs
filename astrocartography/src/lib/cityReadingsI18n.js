// ── Unified city reading translations ──
// Merges translations from both data files + English fallbacks

// Import translation data files
import { CITY_READINGS_I18N, CITY_FALLBACKS_I18N } from './cityReadingsI18nData.js';
import { CITY_READINGS_I18N_2, CITY_FALLBACKS_I18N_2 } from './cityReadingsI18n2.js';

// English reading templates (always available)
const EN = {
  'Sun-MC-thrive': '{city} lies on your Sun MC line \u2014 the most powerful place for your career and public recognition. Here you step into authority naturally. People see you as a leader and your professional ambitions gain real traction. This is where you can build a lasting reputation and be celebrated for who you truly are.',
  'Sun-IC-thrive': '{city} lies on your Sun IC line \u2014 a place of deep inner vitality and connection to your roots. Living here strengthens your sense of self at the most fundamental level. Family bonds deepen, your home life feels radiant and warm, and you discover a quiet but powerful inner confidence.',
  'Sun-ASC-thrive': '{city} lies on your Sun ASC line \u2014 here your personality shines at full wattage. You feel genuinely alive, confident, and visible. Others are drawn to your energy. This is an ideal place to reinvent yourself, start fresh, or simply feel like the best version of you.',
  'Sun-DC-thrive': '{city} lies on your Sun DC line \u2014 partnerships become a source of joy and empowerment here. You attract confident, generous people who elevate your life. Romantic and business relationships flourish, and collaborations feel balanced and mutually energizing.',
  'Moon-MC-thrive': '{city} lies on your Moon MC line \u2014 your emotional intelligence becomes your greatest public asset here. People feel connected to you on a deep level. You can thrive in nurturing professions \u2014 counseling, hospitality, healthcare, teaching \u2014 anything where empathy is valued. The public embraces your warmth.',
  'Moon-IC-thrive': '{city} lies on your Moon IC line \u2014 this is your soul\'s home. No other placement creates such a profound sense of belonging. Living here feels like coming home after a long journey. Emotional healing happens naturally, your intuition sharpens, and domestic life is deeply fulfilling.',
  'Moon-ASC-thrive': '{city} lies on your Moon ASC line \u2014 here your emotional world is visible and magnetic. Others sense your depth and respond with care. You become more intuitive, more empathetic, more attuned to the moods around you. Ideal for creative self-expression and emotional growth.',
  'Moon-DC-thrive': '{city} lies on your Moon DC line \u2014 deep emotional bonds form here almost effortlessly. Partnerships feel fated and nurturing. You attract caring, emotionally available people. Romantic connections are tender and intuitive. This is a powerful place for building family.',
  'Mercury-MC-neutral': '{city} is near your Mercury MC line \u2014 your communication skills gain visibility here. Writing, speaking, teaching, and media work flow more easily. You may attract intellectual recognition, though the energy is subtle rather than dramatic. Good for networking and building a voice in your field.',
  'Mercury-IC-neutral': '{city} is near your Mercury IC line \u2014 your mental life deepens here. You think more clearly in private, journaling and study feel natural, and ideas come easily at home. The effect is gentle \u2014 a quiet intellectual sharpening rather than a dramatic shift. Good for writing retreats or academic work.',
  'Mercury-ASC-neutral': '{city} is near your Mercury ASC line \u2014 you come across as quick-witted and articulate here. Communication defines how others see you. The influence is moderate \u2014 you won\'t be transformed, but you\'ll notice conversations flow more easily and your ideas land with more impact.',
  'Mercury-DC-neutral': '{city} is near your Mercury DC line \u2014 intellectual connections thrive here. You attract smart, communicative partners and collaborators. Conversations spark new ideas. The effect is subtle but enriching \u2014 ideal for short-term collaborations, study abroad, or finding like-minded communities.',
  'Venus-MC-thrive': '{city} lies on your Venus MC line \u2014 you are perceived as charming, beautiful, and artistically gifted here. This is one of the best places for creative careers, fashion, art, music, and anything aesthetic. Social success comes easily \u2014 people want to be around you, and doors open through your natural magnetism.',
  'Venus-IC-thrive': '{city} lies on your Venus IC line \u2014 your home life becomes a sanctuary of beauty and comfort. Living here nourishes your soul through art, nature, and sensory pleasure. Relationships with family soften, your living space feels like a work of art, and daily life takes on a graceful, pleasurable quality.',
  'Venus-ASC-thrive': '{city} lies on your Venus ASC line \u2014 personal beauty, charm, and grace define your presence here. Others find you irresistible. This is an incredible placement for romance, social life, and self-confidence. You naturally attract love, compliments, and harmonious experiences wherever you go.',
  'Venus-DC-thrive': '{city} lies on your Venus DC line \u2014 this is one of the most powerful places for love and partnership. Romantic connections are harmonious, passionate, and enduring. You attract partners who value beauty, affection, and balance. Business partnerships also benefit from Venus\'s grace and diplomacy.',
  'Mars-MC-neutral': '{city} is near your Mars MC line \u2014 career ambition intensifies here, but so does conflict with authority. You feel driven to compete, achieve, and lead, yet power struggles with bosses or institutions may arise. Channel this energy into entrepreneurship, athletics, or any field that rewards bold action.',
  'Mars-IC-avoid': '{city} falls on your Mars IC line \u2014 domestic life becomes volatile here. Arguments at home, property disputes, and family tensions are more likely. You may feel restless, irritable, or combative within your own walls. Short visits can energize you, but long-term residence risks chronic stress and conflict at your foundation.',
  'Mars-ASC-neutral': '{city} is near your Mars ASC line \u2014 physical energy and assertiveness spike here. You become bolder, more direct, and physically active. This can be channeled into sports, fitness, or courageous action. But impulsivity and confrontations also rise. Visit with awareness \u2014 this energy needs conscious direction.',
  'Mars-DC-avoid': '{city} falls on your Mars DC line \u2014 relationships become a battleground here. Partners provoke conflict, power struggles erupt, and arguments escalate. You attract combative, aggressive people. Existing relationships may fracture under the pressure. Avoid settling here long-term if harmony in partnerships matters to you.',
  'Jupiter-MC-thrive': '{city} lies on your Jupiter MC line \u2014 this is one of the luckiest places for your career. Opportunities expand, mentors appear, and professional success feels almost effortless. You are seen as wise, generous, and trustworthy. Ideal for entrepreneurship, academia, law, publishing, or international business.',
  'Jupiter-IC-thrive': '{city} lies on your Jupiter IC line \u2014 home life feels abundant and generous here. Your living space expands, family relationships are warm and supportive, and there\'s a feeling of inner wealth and contentment. This is an excellent place to raise a family, buy property, or build a deeply satisfying private life.',
  'Jupiter-ASC-thrive': '{city} lies on your Jupiter ASC line \u2014 optimism, growth, and good fortune define your experience here. You feel larger than life \u2014 confident, adventurous, and open to possibility. Others see you as generous and inspiring. Travel, education, and philosophical exploration thrive in this location.',
  'Jupiter-DC-thrive': '{city} lies on your Jupiter DC line \u2014 partnerships expand and flourish here. You attract generous mentors, beneficial business partners, and warm romantic connections. Relationships bring growth, adventure, and mutual upliftment. This is an ideal place to find collaborators who share your vision.',
  'Saturn-MC-neutral': '{city} is near your Saturn MC line \u2014 career takes on a serious, disciplined quality here. Success is possible but demands hard work, patience, and resilience. You may face heavy responsibilities, rigid structures, or slow advancement. Those who persist build something enduring, but it will not come easy or quickly.',
  'Saturn-IC-avoid': '{city} falls on your Saturn IC line \u2014 home life feels heavy and burdensome here. Family obligations weigh on you, the living environment may feel cold or restrictive, and emotional warmth is hard to find. Loneliness, depression, or a sense of being trapped at home can develop over time. Not recommended for long-term living.',
  'Saturn-ASC-avoid': '{city} falls on your Saturn ASC line \u2014 your sense of self contracts here. You may feel older, heavier, more limited. Spontaneity fades, self-expression feels blocked, and others perceive you as stern or withdrawn. Chronic fatigue, low mood, or health issues related to restriction may surface. Best avoided for extended stays.',
  'Saturn-DC-avoid': '{city} falls on your Saturn DC line \u2014 relationships become heavy, demanding, and isolating here. Partners may be controlling, critical, or emotionally unavailable. Loneliness within partnerships is common. Commitments feel like burdens rather than choices. Long-term residence risks deep relational dissatisfaction.',
  'Uranus-MC-neutral': '{city} is near your Uranus MC line \u2014 your career takes unexpected turns here. Sudden breakthroughs, radical pivots, and unconventional professional paths are likely. This can bring exciting innovation, but also instability. Freelancers, tech founders, and creative rebels thrive here \u2014 traditional careers may feel disrupted.',
  'Uranus-IC-avoid': '{city} falls on your Uranus IC line \u2014 domestic stability is difficult here. Sudden relocations, housing disruptions, and unpredictable family dynamics keep you off-balance. You may feel unable to put down roots or create lasting security at home. The restless energy makes long-term settling challenging and stressful.',
  'Uranus-ASC-neutral': '{city} is near your Uranus ASC line \u2014 radical self-expression and individuality intensify here. Others see you as eccentric, visionary, or unpredictable. This can be liberating \u2014 you feel free to be yourself without compromise. But it can also make you feel alienated or misunderstood. Best for creative breakthroughs and reinvention.',
  'Uranus-DC-avoid': '{city} falls on your Uranus DC line \u2014 partnerships are unstable and unpredictable here. Relationships may begin suddenly and end without warning. Partners can be unreliable, commitment-averse, or emotionally erratic. If you value relational stability and consistency, this is not the place to build lasting bonds.',
  'Neptune-MC-avoid': '{city} falls on your Neptune MC line \u2014 career direction becomes foggy and confused here. Professional boundaries dissolve, you may be deceived by colleagues, or your public reputation suffers from misunderstandings. Creative and spiritual work can still channel this energy, but practical career goals need extreme clarity and vigilance.',
  'Neptune-IC-avoid': '{city} falls on your Neptune IC line \u2014 your sense of home and roots dissolves here. Boundaries blur, you may feel ungrounded or lost. Housing problems, water damage, or deceptive living situations are more likely. Emotional confusion about where you belong can make long-term residence deeply disorienting.',
  'Neptune-ASC-avoid': '{city} falls on your Neptune ASC line \u2014 your identity becomes elusive and blurred here. Others project fantasies onto you, and you may lose clarity about who you really are. While this creates a mysterious, ethereal presence, it also risks confusion, escapism, and susceptibility to deception. Artistic types may find inspiration, but grounding is essential.',
  'Neptune-DC-avoid': '{city} falls on your Neptune DC line \u2014 partnerships are idealized but potentially deceptive here. You attract partners who seem magical but turn out to be unreliable, dishonest, or emotionally unavailable. Romantic illusions shatter painfully. Existing relationships may suffer from hidden lies or unclear boundaries. Approach with caution.',
  'Pluto-MC-avoid': '{city} falls on your Pluto MC line \u2014 intense power struggles define your career here. You encounter formidable opponents, manipulation in professional settings, and relentless pressure to transform. While some experience profound career metamorphosis, the process is grueling. Not for the faint of heart \u2014 only settle here if you\'re ready for total professional reinvention.',
  'Pluto-IC-avoid': '{city} falls on your Pluto IC line \u2014 psychological intensity at home reaches extreme levels here. Buried family secrets surface, power struggles within the household erupt, and deep emotional crises force confrontation with your past. While transformative, this energy is overwhelming for most people. Long-term residence demands extraordinary emotional resilience.',
  'Pluto-ASC-avoid': '{city} falls on your Pluto ASC line \u2014 your identity undergoes forced, intense transformation here. Others perceive you as powerful but intimidating. You attract obsessive attention and power dynamics. While this can catalyze profound personal rebirth, the process often involves crisis, loss, and ego death. Not suitable for those seeking stability.',
  'Pluto-DC-avoid': '{city} falls on your Pluto DC line \u2014 relationships become intense, obsessive, and potentially manipulative here. Partners may try to control or dominate you, and you may find yourself drawn into toxic power dynamics. Existing bonds deepen to an almost unbearable degree. Only settle here if you can handle extreme emotional intensity in partnerships.',
};

const EN_FALLBACKS = {
  thrive: '{city} lies on your {line} line \u2014 a zone of activation where this planetary energy amplifies your strengths. Spending time here supports growth in {area}.',
  avoid: '{city} falls on your {line} line \u2014 a zone of challenge where this planetary energy brings tension. Short visits may teach valuable lessons, but long-term residence requires conscious effort to navigate.',
  neutral: '{city} is near your {line} line \u2014 a zone of subtle influence. The effects are moderate and depend on how you engage with the energy. Neither strongly positive nor negative, this placement offers nuance rather than extremes.',
};

// Merge all translations into unified lookups
const READINGS = {};
const FALLBACK_TRANSLATIONS = {};

// Merge group 1 (en, de, fr, it, es, tr, ru, pt)
if (CITY_READINGS_I18N) {
  for (const [k, v] of Object.entries(CITY_READINGS_I18N)) {
    READINGS[k] = { ...(READINGS[k] || {}), ...v };
  }
}
if (CITY_FALLBACKS_I18N) {
  for (const [k, v] of Object.entries(CITY_FALLBACKS_I18N)) {
    FALLBACK_TRANSLATIONS[k] = { ...(FALLBACK_TRANSLATIONS[k] || {}), ...v };
  }
}
// Merge group 2 (ja, zh, ar, ko, pl, nl)
if (CITY_READINGS_I18N_2) {
  for (const [k, v] of Object.entries(CITY_READINGS_I18N_2)) {
    READINGS[k] = { ...(READINGS[k] || {}), ...v };
  }
}
if (CITY_FALLBACKS_I18N_2) {
  for (const [k, v] of Object.entries(CITY_FALLBACKS_I18N_2)) {
    FALLBACK_TRANSLATIONS[k] = { ...(FALLBACK_TRANSLATIONS[k] || {}), ...v };
  }
}

/**
 * Get a translated city reading.
 * @param {object} c - City object with { name, line, q, dist }
 * @param {string} lang - Language code
 * @param {function} getAngleEffect - Function to get angle area for fallbacks
 * @returns {string} Translated reading paragraph
 */
export function getCityReading(c, lang, getAngleEffect) {
  const parts = c.line.split(' ');
  const planet = parts[0];
  const angle = parts[1];
  const key = `${planet}-${angle}-${c.q}`;
  const l = lang || 'en';

  // Try translated version first
  let template = null;
  if (l !== 'en' && READINGS[key] && READINGS[key][l]) {
    template = READINGS[key][l];
  }
  // Fall back to English
  if (!template) {
    template = EN[key];
  }

  if (template) {
    return template.replace(/\{city\}/g, c.name);
  }

  // Fallback templates
  const area = getAngleEffect ? (getAngleEffect(angle, l)?.area || '') : '';
  let fb = null;
  if (l !== 'en' && FALLBACK_TRANSLATIONS[c.q] && FALLBACK_TRANSLATIONS[c.q][l]) {
    fb = FALLBACK_TRANSLATIONS[c.q][l];
  }
  if (!fb) {
    fb = EN_FALLBACKS[c.q] || EN_FALLBACKS.neutral;
  }
  return fb.replace(/\{city\}/g, c.name).replace(/\{line\}/g, c.line).replace(/\{area\}/g, area);
}

