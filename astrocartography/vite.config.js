import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/d3-geo') || id.includes('node_modules/d3-array') || id.includes('node_modules/d3-path')) {
            return 'vendor-d3';
          }
          if (id.includes('node_modules/astronomy-engine')) {
            return 'vendor-astro';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('/lib/i18n') || id.includes('/lib/cityReadingsI18n')) {
            return 'i18n';
          }
          if (id.includes('/data/cities')) {
            return 'cities';
          }
          // Dashboard is lazy-loaded. Split its large visual/data modules so
          // no single production asset breaches the 500 KB budget.
          if (id.includes('/components/Globe.jsx')) {
            return 'dashboard-globe';
          }
          if (id.includes('/components/NatalWheel') || id.includes('/components/Tutorial.jsx')) {
            return 'dashboard-visuals';
          }
          if (id.includes('/data/natalReadings')) {
            return 'dashboard-readings';
          }
        },
      },
    },
    // Inline small assets EXCEPT fonts. @fontsource ships every unicode-range
    // subset (latin, cyrillic, vietnamese, …) as a small woff/woff2 that fell
    // under the 8 KB limit — Vite inlined them ALL as base64 into the main CSS
    // (~100 KB of render-blocking data: URIs, dozens of console font errors,
    // and the browser decodes every subset instead of fetching only latin via
    // unicode-range). Keeping fonts as files restores lazy per-subset loading.
    assetsInlineLimit: (filePath, content) => {
      if (/\.(woff2?|ttf|otf|eot)(\?|$)/i.test(filePath)) return false;
      return content.length < 8192;
    },
  },
})
