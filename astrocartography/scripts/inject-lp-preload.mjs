// Postbuild: preload the lazy LandingPage chunk on "/" only.
// The chunk is route-split (dashboard users must not pay for it), but on the
// landing it sits on the LCP critical path: index.js exec -> dynamic import ->
// download -> exec -> demo-poster paint. A modulepreload started during HTML
// parse removes the serial download leg (~1s simulated mobile).
// Hash changes every build, so this runs after vite build and patches dist/.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const assets = readdirSync('dist/assets');
const lp = assets.find((f) => /^LandingPage-.*\.js$/.test(f));
if (!lp) throw new Error('LandingPage chunk not found in dist/assets');

const htmlPath = 'dist/index.html';
let html = readFileSync(htmlPath, 'utf8');
const marker = 'imagesizes="(max-width: 760px) 92vw, 1200px">\');}</script>';
if (!html.includes(marker)) throw new Error('poster-preload marker not found in dist/index.html');
const inject = marker + `<script>if(location.pathname==='/'){document.head.insertAdjacentHTML('beforeend','<link rel="modulepreload" crossorigin href="/assets/${lp}">');}</script>`;
html = html.replace(marker, inject);
writeFileSync(htmlPath, html);
console.log(`inject-lp-preload: ${lp} preloaded on "/"`);
