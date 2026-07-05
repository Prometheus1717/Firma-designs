import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts (no external requests to Google Fonts — bundled and served
// from our own origin). Family names match the previous Google Fonts, so all
// existing `font-family` rules resolve unchanged.
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/600.css'
import '@fontsource/jetbrains-mono/700.css'
import '@fontsource/instrument-sans/400.css'
import '@fontsource/instrument-sans/600.css'
import '@fontsource/instrument-sans/700.css'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import './index.css'
// Browsers only request a web font once the first rendered text uses it — in
// an SPA that's AFTER React mounts, so the swap lands post-first-paint and
// shifts the layout (hero headline re-wraps, demo stage moves: the top mobile
// CLS culprit). Preloading the three above-the-fold fonts at module-eval time
// puts them in cache well before the first render, so the first paint already
// uses the final fonts and no swap-shift can occur.
import serifUrl from '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2?url'
import serifItalicUrl from '@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2?url'
import monoUrl from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2?url'
import App from './App.jsx'

for (const href of [serifUrl, serifItalicUrl, monoUrl]) {
  const l = document.createElement('link')
  l.rel = 'preload'
  l.as = 'font'
  l.type = 'font/woff2'
  l.crossOrigin = ''
  l.href = href
  document.head.appendChild(l)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service Worker registration lives in index.html so it can run during HTML
// parsing (alongside the version-bump cache purge). Registering it again here
// would race with that script and is redundant.
