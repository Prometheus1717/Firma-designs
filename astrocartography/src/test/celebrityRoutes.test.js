import { describe, expect, it } from 'vitest';
import { LP_LANGS } from '../lib/landingContent';
import {
  CELEBRITY_LANGS,
  CELEBRITY_PROFILES,
  getCelebrityAlternates,
  getCelebrityRoute,
  getCelebritySlug,
} from '../data/celebrityRoutes';

describe('celebrity SEO routes', () => {
  it('covers every landing-page language with a unique route for all seven profiles', () => {
    expect(LP_LANGS).toEqual(CELEBRITY_LANGS);

    const routes = CELEBRITY_LANGS.flatMap((lang) =>
      Object.keys(CELEBRITY_PROFILES).map((key) => getCelebritySlug(key, lang))
    );

    expect(routes).toHaveLength(91);
    expect(new Set(routes).size).toBe(91);
    expect(CELEBRITY_LANGS).not.toContain('fr');
  });

  it('targets the primary Michael Jackson search terms and keeps localized German routing', () => {
    expect(getCelebrityRoute('jackson', 'en')).toBe('/celebrities/michael-jackson-astrocartography');
    expect(getCelebrityRoute('jackson', 'de')).toBe('/de/prominente/michael-jackson-astrokartographie');
    expect(getCelebrityAlternates('jackson')).not.toHaveProperty('fr');
    expect(getCelebrityRoute('jackson', 'fr')).toBe('/celebrities/michael-jackson-astrocartography');
  });

  it('falls back safely to Michael Jackson in English', () => {
    expect(getCelebrityRoute('missing', 'missing')).toBe('/celebrities/michael-jackson-astrocartography');
  });
});
