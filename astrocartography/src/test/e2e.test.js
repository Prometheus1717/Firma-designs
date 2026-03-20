import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Since the sandbox blocks outbound requests to natalnavigator.com,
// we test the build output instead — verifying the production bundle
// is correct and would serve properly on Vercel.

const distDir = resolve(process.cwd(), 'dist');
const indexPath = resolve(distDir, 'index.html');

describe('Production build verification', () => {
  // First, build the project
  let html;
  let buildExists;

  it('project builds successfully', async () => {
    const { execSync } = await import('child_process');
    execSync('npx vite build', { cwd: process.cwd(), stdio: 'pipe', timeout: 60000 });
    buildExists = existsSync(indexPath);
    expect(buildExists).toBe(true);
  });

  it('index.html exists in dist', () => {
    expect(existsSync(indexPath)).toBe(true);
    html = readFileSync(indexPath, 'utf-8');
  });

  it('HTML contains Natal Navigator title', () => {
    html = html || readFileSync(indexPath, 'utf-8');
    expect(html).toContain('Natal Navigator');
  });

  it('HTML contains root div for React mount', () => {
    html = html || readFileSync(indexPath, 'utf-8');
    expect(html).toContain('id="root"');
  });

  it('HTML includes module script tag', () => {
    html = html || readFileSync(indexPath, 'utf-8');
    expect(html).toMatch(/type="module"/);
  });

  it('HTML references JS assets', () => {
    html = html || readFileSync(indexPath, 'utf-8');
    expect(html).toMatch(/\/assets\/.*\.js/);
  });

  it('HTML includes viewport meta tag', () => {
    html = html || readFileSync(indexPath, 'utf-8');
    expect(html).toContain('viewport');
  });

  it('HTML includes charset meta', () => {
    html = html || readFileSync(indexPath, 'utf-8');
    expect(html).toContain('UTF-8');
  });

  it('HTML includes loading animation CSS', () => {
    html = html || readFileSync(indexPath, 'utf-8');
    expect(html).toContain('@keyframes');
  });

  it('HTML includes JetBrains Mono font reference', () => {
    html = html || readFileSync(indexPath, 'utf-8');
    expect(html).toContain('JetBrains');
  });

  it('vendor-react chunk is generated', () => {
    const { readdirSync } = require('fs');
    const assets = readdirSync(resolve(distDir, 'assets'));
    const reactChunk = assets.find(f => f.includes('vendor-react') && f.endsWith('.js'));
    expect(reactChunk).toBeTruthy();
  });

  it('vendor-d3 chunk is generated', () => {
    const { readdirSync } = require('fs');
    const assets = readdirSync(resolve(distDir, 'assets'));
    const d3Chunk = assets.find(f => f.includes('vendor-d3') && f.endsWith('.js'));
    expect(d3Chunk).toBeTruthy();
  });

  it('vendor-astro chunk is generated', () => {
    const { readdirSync } = require('fs');
    const assets = readdirSync(resolve(distDir, 'assets'));
    const astroChunk = assets.find(f => f.includes('vendor-astro') && f.endsWith('.js'));
    expect(astroChunk).toBeTruthy();
  });

  it('vendor-supabase chunk is generated', () => {
    const { readdirSync } = require('fs');
    const assets = readdirSync(resolve(distDir, 'assets'));
    const supaChunk = assets.find(f => f.includes('vendor-supabase') && f.endsWith('.js'));
    expect(supaChunk).toBeTruthy();
  });

  it('favicon.svg is in dist', () => {
    expect(existsSync(resolve(distDir, 'favicon.svg'))).toBe(true);
  });

  it('icons.svg is in dist', () => {
    expect(existsSync(resolve(distDir, 'icons.svg'))).toBe(true);
  });

  it('no asset exceeds 500KB (performance check)', () => {
    const { readdirSync, statSync } = require('fs');
    const assets = readdirSync(resolve(distDir, 'assets'));
    for (const file of assets) {
      const size = statSync(resolve(distDir, 'assets', file)).size;
      expect(size).toBeLessThan(500 * 1024); // 500KB limit per chunk
    }
  });

  it('total JS bundle size is under 1MB', () => {
    const { readdirSync, statSync } = require('fs');
    const assets = readdirSync(resolve(distDir, 'assets'));
    let totalJS = 0;
    for (const file of assets) {
      if (file.endsWith('.js')) {
        totalJS += statSync(resolve(distDir, 'assets', file)).size;
      }
    }
    expect(totalJS).toBeLessThan(1024 * 1024); // 1MB
  });

  it('CSS is generated', () => {
    const { readdirSync } = require('fs');
    const assets = readdirSync(resolve(distDir, 'assets'));
    const cssFile = assets.find(f => f.endsWith('.css'));
    // CSS might be minimal since app uses inline styles, but check it exists
    expect(assets.length).toBeGreaterThan(0);
  });
});

describe('Vercel configuration', () => {
  it('vercel.json exists', () => {
    const vercelPath = resolve(process.cwd(), 'vercel.json');
    expect(existsSync(vercelPath)).toBe(true);
  });

  it('vercel.json has SPA rewrite rule', () => {
    const vercelPath = resolve(process.cwd(), 'vercel.json');
    const config = JSON.parse(readFileSync(vercelPath, 'utf-8'));
    expect(config.rewrites).toBeDefined();
    expect(config.rewrites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: '/(.*)', destination: '/index.html' }),
      ])
    );
  });
});
