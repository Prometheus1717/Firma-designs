import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
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
        },
      },
    },
    assetsInlineLimit: 8192,
  },
})
