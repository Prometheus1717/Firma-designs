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
    for (const chunk of ['vendor-react', 'vendor-d3', 'vendor-astro', 'vendor-supabase']) {
      expect(assets.find(f => f.includes(chunk) && f.endsWith('.js'))).toBeTruthy();
    }
  });

  it('copies static assets', () => {
    expect(existsSync(resolve(distDir, 'favicon.svg'))).toBe(true);
    expect(existsSync(resolve(distDir, 'icons.svg'))).toBe(true);
  });

  it('no asset exceeds 500KB, total JS under 1MB', () => {
    let totalJS = 0;
    for (const file of assets) {
      const size = statSync(resolve(distDir, 'assets', file)).size;
      expect(size).toBeLessThan(500 * 1024);
      if (file.endsWith('.js')) totalJS += size;
    }
    expect(totalJS).toBeLessThan(1024 * 1024);
  });
});

describe('Vercel configuration', () => {
  it('has SPA rewrite rule', () => {
    const config = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf-8'));
    expect(config.rewrites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: '/((?!api/).*)', destination: '/index.html' }),
      ])
    );
  });
});
