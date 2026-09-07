import { describe, expect, it } from 'vitest';
import { LP_LANGS } from '../lib/landingContent';
import {
  CELEBRITY_LANGS,
  CELEBRITY_PROFILES,
  RETIRED_CELEBRITY_LANGS,
  getCelebrityAlternates,
  getCelebrityRoute,
  getCelebritySlug,
} from '../data/celebrityRoutes';

describe('celebrity SEO routes', () => {
  it('keeps celebrity pages only for the four languages with a real content cluster', () => {
    expect(CELEBRITY_LANGS).toEqual(['en', 'de', 'es', 'pt']);
    for (const lang of CELEBRITY_LANGS) expect(LP_LANGS).toContain(lang);
    for (const lang of RETIRED_CELEBRITY_LANGS) expect(CELEBRITY_LANGS).not.toContain(lang);

    const routes = CELEBRITY_LANGS.flatMap((lang) =>
      Object.keys(CELEBRITY_PROFILES).map((key) => getCelebritySlug(key, lang))
    );

    expect(routes).toHaveLength(28);
    expect(new Set(routes).size).toBe(28);
  });

  it('targets the primary Michael Jackson search terms and keeps localized German routing', () => {
    expect(getCelebrityRoute('jackson', 'en')).toBe('/celebrities/michael-jackson-astrocartography');
    expect(getCelebrityRoute('jackson', 'de')).toBe('/de/prominente/michael-jackson-astrokartographie');
    for (const lang of RETIRED_CELEBRITY_LANGS) {
      expect(getCelebrityAlternates('jackson')).not.toHaveProperty(lang);
      expect(getCelebrityRoute('jackson', lang)).toBe('/celebrities/michael-jackson-astrocartography');
    }
  });

  it('falls back safely to Michael Jackson in English', () => {
    expect(getCelebrityRoute('missing', 'missing')).toBe('/celebrities/michael-jackson-astrocartography');
  });
});
