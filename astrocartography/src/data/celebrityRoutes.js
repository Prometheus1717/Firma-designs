export const CELEBRITY_LANGS = ['en', 'de', 'it', 'es', 'tr', 'ru', 'pt', 'ja', 'zh', 'ar', 'ko', 'pl', 'nl'];

export const CELEBRITY_SLUGS = {
  en: 'celebrities',
  de: 'de/prominente',
  it: 'it/celebrita',
  es: 'es/celebridades',
  tr: 'tr/unluler',
  ru: 'ru/znamenitosti',
  pt: 'pt/celebridades',
  ja: 'ja/celebrity',
  zh: 'zh/mingren',
  ar: 'ar/mashahir',
  ko: 'ko/celebrity',
  pl: 'pl/celebryci',
  nl: 'nl/beroemdheden',
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
  it: 'astrocartografia', es: 'astrocartografia', tr: 'astrokartografi',
  ru: 'astrokartografiya', pt: 'astrocartografia', ja: 'astrocartography',
  zh: 'astrocartography', ar: 'astrocartography', ko: 'astrocartography',
  pl: 'astrokartografia', nl: 'astrocartografie',
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
