// Adds Vercel's cookieless Web Analytics and Speed Insights loaders to every
// standalone HTML page. The React application already mounts the matching
// components; this covers static guides that never execute the SPA bundle.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const MARKER = 'data-natal-observability';
const SNIPPET = `\n  <script defer src="/_vercel/insights/script.js" ${MARKER}></script>\n  <script defer src="/_vercel/speed-insights/script.js" ${MARKER}></script>\n`;

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.isFile() && entry.name.endsWith('.html') ? [path] : [];
  }));
  return nested.flat();
}

let changed = 0;
for (const file of await htmlFiles(PUBLIC)) {
  const html = await readFile(file, 'utf8');
  if (html.includes(MARKER)) continue;
  if (!html.includes('</body>')) throw new Error(`No </body> in ${file}`);
  await writeFile(file, html.replace('</body>', `${SNIPPET}</body>`), 'utf8');
  changed += 1;
}

console.log(`inject-static-observability: instrumented ${changed} static HTML page(s).`);
