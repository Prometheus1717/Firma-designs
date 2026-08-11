/* global process */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

const distDir = resolve(process.cwd(), 'dist');
const indexPath = resolve(distDir, 'index.html');

// Build once before all tests
let html, assets;
beforeAll(() => {
  execSync('npx vite build', { cwd: process.cwd(), stdio: 'pipe', timeout: 60000 });
  html = readFileSync(indexPath, 'utf-8');
  assets = readdirSync(resolve(distDir, 'assets'));
});

describe('Production build', () => {
  it('generates index.html with correct structure', () => {
    expect(html).toContain('Natal Navigator');
    expect(html).toContain('id="root"');
    expect(html).toMatch(/type="module"/);
    expect(html).toMatch(/\/assets\/.*\.js/);
    expect(html).toContain('viewport');
    expect(html).toContain('UTF-8');
    expect(html).toContain('@keyframes');
    expect(html).toContain('JetBrains');
  });

  it('generates all vendor chunks', () => {
    for (const chunk of ['vendor-react', 'dashboard-globe', 'vendor-astro', 'vendor-supabase']) {
      expect(assets.find(f => f.includes(chunk) && f.endsWith('.js'))).toBeTruthy();
    }
  });

  it('copies static assets', () => {
    expect(existsSync(resolve(distDir, 'favicon.svg'))).toBe(true);
    expect(existsSync(resolve(distDir, 'icons.svg'))).toBe(true);
  });

  it('no JavaScript asset exceeds 500KB', () => {
    for (const file of assets) {
      if (!file.endsWith('.js')) continue;
      const size = statSync(resolve(distDir, 'assets', file)).size;
      expect(size).toBeLessThan(500 * 1024);
    }
  });
});

describe('Vercel configuration', () => {
  // A blanket /((?!api/).*) fallback made every unknown URL a soft 404 (200 +
  // homepage canonical), so the rewrite now enumerates the app routes and
  // everything else falls through to the static 404.
  it('has SPA rewrite rule covering every client route', () => {
    const config = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf-8'));
    const spa = config.rewrites.find((r) => r.destination === '/index.html');
    expect(spa).toBeDefined();
    expect(spa.source).not.toContain('(?!api/)');
    for (const route of [
      'demo', 'create', 'result', 'auth', 'birth-data', 'dashboard', 'admin',
      'reset-password', 'landing', 'impressum', 'datenschutz', 'agb', 'widerruf', 'kontakt',
    ]) {
      expect(spa.source).toContain(route);
    }
  });

  it('redirects the retired /en and /de folders', () => {
    const config = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf-8'));
    for (const source of ['/en', '/en/(.*)', '/de', '/de/(.*)']) {
      expect(config.redirects).toEqual(
        expect.arrayContaining([expect.objectContaining({ source, permanent: true })])
      );
    }
  });
});
