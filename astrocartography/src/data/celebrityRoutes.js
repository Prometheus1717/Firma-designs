// Only languages with a real content cluster on the domain keep celebrity pages.
// The nine other UI languages were retired on 2026-09-07 (never indexed, thin
// scaled-translation signal); their URLs answer 410 via vercel.json -> /api/gone.
export const CELEBRITY_LANGS = ['en', 'de', 'es', 'pt'];
export const RETIRED_CELEBRITY_LANGS = ['fr', 'it', 'tr', 'ru', 'ja', 'zh', 'ar', 'ko', 'pl', 'nl'];

export const CELEBRITY_SLUGS = {
  en: 'celebrities',
  de: 'de/prominente',
  es: 'es/celebridades',
  pt: 'pt/celebridades',
};

export const CELEBRITY_PROFILES = {
  jackson: { name: 'Michael Jackson', slug: 'michael-jackson' },
  musk: { name: 'Elon Musk', slug: 'elon-musk' },
  diana: { name: 'Princess Diana', slug: 'princess-diana' },
  einstein: { name: 'Albert Einstein', slug: 'albert-einstein' },
  monroe: { name: 'Marilyn Monroe', slug: 'marilyn-monroe' },
  jobs: { name: 'Steve Jobs', slug: 'steve-jobs' },
  kahlo: { name: 'Frida Kahlo', slug: 'frida-kahlo' },
};

const ASTROCARTOGRAPHY_SUFFIX = {
  en: 'astrocartography', de: 'astrokartographie',
  es: 'astrocartografia', pt: 'astrocartografia',
};

export function getCelebritySlug(key, lang = 'en') {
  const safeLang = CELEBRITY_LANGS.includes(lang) ? lang : 'en';
  const profile = CELEBRITY_PROFILES[key] || CELEBRITY_PROFILES.jackson;
  return `${CELEBRITY_SLUGS[safeLang]}/${profile.slug}-${ASTROCARTOGRAPHY_SUFFIX[safeLang]}`;
}

export function getCelebrityRoute(key, lang = 'en') {
  return `/${getCelebritySlug(key, lang)}`;
}

export function getCelebrityAlternates(key) {
  return Object.fromEntries(CELEBRITY_LANGS.map((lang) => [lang, getCelebritySlug(key, lang)]));
}
