import { readFile } from 'node:fs/promises'

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')

const legacyShellMarkers = [
  /id=(["'])lp-shell\1/,
  /__lpShellRemove/,
]

if (legacyShellMarkers.some((pattern) => pattern.test(html))) {
  console.error(
    'Build blocked: index.html contains the retired beige landing-page shell. ' +
    'The real React landing page must be the only homepage UI.',
  )
  process.exit(1)
}

console.log('Landing shell guard: OK')
