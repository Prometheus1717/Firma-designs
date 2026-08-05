/* global process, fetch */
import { applySecurityHeaders } from './_security.js';

/**
 * Täglicher Gesundheitsbericht nach Telegram (Vercel-Cron, siehe vercel.json).
 *
 * Hintergrund: Am 26./27.07.2026 lud ein `vercel --prebuilt`-Deploy ein Bundle
 * ohne Build-Env hoch. Der Supabase-Client warf beim Modul-Eval
 * `supabaseUrl is required`, React mountete nie, sichtbar blieb nur die
 * statische LCP-Shell aus index.html. Dabei lieferte JEDER Request HTTP 200.
 * Ein gewöhnlicher Uptime-Ping hätte 24 Stunden lang "alles gut" gemeldet.
 *
 * Deshalb prüft dieser Report nicht Statuscodes, sondern ob die Build-Env
 * tatsächlich im ausgelieferten JavaScript steht — das ist der Fingerabdruck
 * genau dieses Fehlers und er ist von außen ohne Browser feststellbar.
 *
 * Am 03.08.2026 kam ein zweiter Fehlertyp dazu: ein Deployment aus einem
 * fremden Branch wurde auf Produktion promotet und warf den Code um sechs
 * Wochen zurück. Auch dabei war alles HTTP 200, die Build-Env stand im
 * Bundle, React mountete. Kaputt war nur der Kaufweg, und das 40 Stunden
 * lang unbemerkt. Deshalb prüft der Report seit dem zusätzlich, WOHER das
 * laufende Deployment stammt und ob der Weg zur Kasse im Bundle überhaupt
 * noch existiert.
 */

const SITE = 'https://natalnavigator.com';

// Muss im ausgelieferten Bundle stehen. Fehlt sie, wurde ohne
// VITE_SUPABASE_URL gebaut und das Frontend ist tot.
const SUPABASE_REF = 'kbwjxtvqdkcicaydtixp';

// Der einzige Branch, aus dem Produktion gebaut werden darf.
const PROD_BRANCH = 'claude/astrocartography-globe-dashboard-aBjui';

// Dieser Throw wurde am 01.07.2026 mit Commit 6df38cf entfernt. Taucht er
// wieder im Bundle auf, läuft ein Stand von vor dem Payment-Deadlock-Fix und
// zahlende Kunden hängen zwischen Paywall und Geburtsdaten fest.
const DEADLOCK_MARKER = 'Payment required before entering birth data.';

const checks = [];

async function check(name, fn) {
  try {
    checks.push({ name, ok: true, detail: (await fn()) || '' });
  } catch (err) {
    checks.push({ name, ok: false, detail: err.message });
  }
}

function must(condition, message) {
  if (!condition) throw new Error(message);
}

async function runChecks() {
  let indexHtml = '';
  let anonKey = '';
  let entryJs = '';

  // Vercel setzt diese Variablen im Deployment, das den Request bedient. Der
  // Report läuft als Cron auf dem Produktions-Deployment und sieht damit
  // dessen echte Herkunft — nicht die, die im Repo stehen sollte.
  await check('Herkunft des Deployments', async () => {
    const ref = process.env.VERCEL_GIT_COMMIT_REF;
    const sha = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7);

    // Ein CLI-Deploy (`vercel --prod`) setzt die Git-Variablen nicht. Das ist
    // kein Fehler, aber es heißt, dass niemand mehr sagen kann, welcher Stand
    // live ist — also melden statt stillschweigend durchwinken.
    must(ref, 'keine Git-Herkunft im Deployment — vermutlich per CLI deployt, Stand nicht nachvollziehbar');

    must(
      ref === PROD_BRANCH,
      `läuft aus Branch "${ref}" statt "${PROD_BRANCH}" — es wurde ein fremdes Deployment auf Produktion promotet`
    );
    return `${ref}@${sha || '?'}`;
  });

  await check('Startseite', async () => {
    const res = await fetch(`${SITE}/`, { redirect: 'follow' });
    must(res.status === 200, `HTTP ${res.status}`);
    indexHtml = await res.text();
    must(indexHtml.includes('<div id="root">'), 'kein #root im HTML');
    return `${(indexHtml.length / 1024).toFixed(0)} KB`;
  });

  await check('Build-Env im Bundle', async () => {
    must(indexHtml, 'Startseite nicht geladen');
    const entry = indexHtml.match(/src="(\/assets\/index-[A-Za-z0-9_-]+\.js)"/)?.[1];
    must(entry, 'kein Entry-Bundle im HTML');

    const res = await fetch(`${SITE}${entry}`);
    must(res.status === 200, `Bundle HTTP ${res.status}`);
    const js = await res.text();
    entryJs = js;

    must(
      js.includes(SUPABASE_REF),
      'VITE_SUPABASE_URL fehlt — ohne Env gebaut, React mountet nicht, nur die statische Shell ist sichtbar'
    );
    must(js.includes('phc_'), 'VITE_POSTHOG_KEY fehlt — ohne Env gebaut');

    anonKey = js.match(/sb_publishable_[A-Za-z0-9_-]{20,}/)?.[0]
      || js.match(/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/)?.[0]
      || '';

    return entry.replace('/assets/', '');
  });

  await check('App-Chunks abrufbar', async () => {
    must(indexHtml, 'Startseite nicht geladen');
    const preloads = [...indexHtml.matchAll(/href="(\/assets\/vendor-[A-Za-z0-9_-]+\.js)"/g)].map(m => m[1]);
    must(preloads.length >= 2, `nur ${preloads.length} Vendor-Chunks verlinkt`);

    for (const chunk of preloads) {
      const res = await fetch(`${SITE}${chunk}`, { method: 'HEAD' });
      must(res.status === 200, `${chunk} HTTP ${res.status}`);
    }
    return `${preloads.length} Chunks ok`;
  });

  await check('Server-Env vollständig', async () => {
    const res = await fetch(`${SITE}/api/health`);
    const body = await res.json().catch(() => ({}));
    must(res.status === 200, `Status "${body.status || res.status}" — eine Server-Variable fehlt`);
    return body.status || 'ok';
  });

  // Der Kern der Frage "können Leute kaufen". Statuscodes beantworten sie
  // nicht: am 03.08. antwortete alles mit 200, während der komplette
  // Guest-Funnel aus dem Bundle verschwunden und der alte Deadlock zurück war.
  await check('Kaufweg im Bundle', async () => {
    must(entryJs, 'Entry-Bundle nicht geladen');

    must(
      !entryJs.includes(DEADLOCK_MARKER),
      'der Payment-Deadlock von Juni ist zurück — bezahlte Kunden kommen nicht an ihre Karte'
    );
    must(entryJs.includes('/create'), 'die Route /create fehlt im Bundle — der Kauf-Funnel ist weg');

    // Die Bestellseite liegt in einem eigenen Lazy-Chunk; der Entry verweist
    // nur auf den Dateinamen. Ohne diesen Chunk führt /create ins Leere.
    const chunk = entryJs.match(/assets\/CreatePage-[A-Za-z0-9_-]+\.js/)?.[0];
    must(chunk, 'kein CreatePage-Chunk im Bundle referenziert');

    const res = await fetch(`${SITE}/${chunk}`);
    must(res.status === 200, `CreatePage-Chunk HTTP ${res.status}`);
    const createJs = await res.text();
    must(!createJs.includes(DEADLOCK_MARKER), 'Payment-Deadlock im CreatePage-Chunk');
    must(createJs.includes('guest_checkout'), 'Guest-Checkout fehlt — /create führt nicht mehr zu Stripe');

    return chunk.replace('assets/', '');
  });

  await check('Kauf-Abschluss erreichbar', async () => {
    // Nach der Rückkehr von Stripe schaltet verify-session den Kauf frei.
    // Fehlt der Endpunkt, hat der Kunde bezahlt und bekommt nichts.
    const res = await fetch(`${SITE}/api/verify-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    must(res.status !== 404, 'verify-session fehlt — bezahlte Kunden werden nicht freigeschaltet');
    must(res.status < 500, `HTTP ${res.status}`);
    return `antwortet ${res.status}`;
  });

  await check('Checkout-Endpunkt', async () => {
    const res = await fetch(`${SITE}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    must(res.status < 500, `HTTP ${res.status} — Stripe-Env fehlt oder Function kaputt`);
    return `antwortet ${res.status}`;
  });

  await check('Supabase + Anon-Key', async () => {
    must(anonKey, 'kein Anon-Key im Bundle gefunden');
    const res = await fetch(`https://${SUPABASE_REF}.supabase.co/auth/v1/health`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    must(res.status !== 401, 'Anon-Key abgelehnt — Login und Kauf sind tot');
    must(res.ok, `HTTP ${res.status}`);
    return 'Key akzeptiert';
  });

  await check('Sitemap', async () => {
    const res = await fetch(`${SITE}/sitemap.xml`);
    must(res.status === 200, `HTTP ${res.status}`);
    const n = ((await res.text()).match(/<loc>/g) || []).length;
    must(n >= 100, `nur ${n} URLs (erwartet >= 100)`);
    return `${n} URLs`;
  });

  await check('robots.txt + OG-Bild', async () => {
    const robots = await fetch(`${SITE}/robots.txt`);
    must(robots.status === 200, `robots.txt HTTP ${robots.status}`);
    must((await robots.text()).includes('Sitemap'), 'robots.txt ohne Sitemap-Verweis');

    const og = await fetch(`${SITE}/og.png`, { method: 'HEAD' });
    must(og.status === 200, `og.png HTTP ${og.status}`);
    const size = Number(og.headers.get('content-length') || 0);
    must(size > 10000, `og.png nur ${size} Bytes`);
    return `og.png ${(size / 1024).toFixed(0)} KB`;
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Eigene Zustellung statt sendTelegramMessage(): der gemeinsame Helfer
 * protokolliert Sendefehler nur auf der Konsole und schluckt sie sonst. Für
 * einen Wächter ist das die falsche Richtung — wenn der Alarmkanal selbst
 * kaputt ist (Token rotiert, Bot aus dem Kanal geworfen), muss das im
 * Antwort-Body sichtbar sein, sonst hält man Stille für "alles in Ordnung".
 */
async function notifyTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = (process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_IDS || '')
    .split(',').map(s => s.trim()).filter(Boolean);

  if (!token || !chatIds.length) {
    return { delivered: 0, failed: 0, error: 'TELEGRAM_BOT_TOKEN oder TELEGRAM_CHAT_ID fehlt' };
  }

  let delivered = 0, failed = 0, error;
  for (const chatId of chatIds) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      });
      if (res.ok) {
        delivered++;
      } else {
        failed++;
        // description enthält Telegrams Klartextgrund, z.B. "chat not found".
        const body = await res.json().catch(() => ({}));
        error = `${res.status} ${body.description || ''}`.trim();
      }
    } catch (err) {
      failed++;
      error = err.message;
    }
  }
  return { delivered, failed, ...(error ? { error } : {}) };
}

export default async function handler(req, res) {
  applySecurityHeaders(res);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel schickt bei Cron-Läufen automatisch `Authorization: Bearer $CRON_SECRET`,
  // sobald die Variable im Projekt gesetzt ist. Ohne diese Sperre könnte jeder
  // den Endpunkt aufrufen und den Telegram-Kanal fluten.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  checks.length = 0;
  await runChecks();

  const failed = checks.filter(c => !c.ok);
  const now = new Date().toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin', dateStyle: 'short', timeStyle: 'short',
  });

  const lines = [
    failed.length
      ? `🚨 <b>natalnavigator.com — ${failed.length} Problem${failed.length > 1 ? 'e' : ''}</b>`
      : '✅ <b>natalnavigator.com läuft</b>',
    `<i>${escapeHtml(now)} Uhr</i>`,
    '',
    ...checks.map(c => `${c.ok ? '✅' : '❌'} ${escapeHtml(c.name)}${c.detail ? ` — ${escapeHtml(c.detail)}` : ''}`),
  ];

  if (failed.length) {
    lines.push(
      '',
      'Die zwei bekannten Ursachen zuerst prüfen:',
      '1. Wurde ein fremdes Deployment auf Produktion promotet? (Vercel → Deployments)',
      '2. Wurde ohne Build-Env deployt, etwa mit --prebuilt?'
    );
  }

  // Bei "quiet" nur melden, wenn etwas kaputt ist — für Aufrufe direkt nach
  // einem Deploy, die nicht jedes Mal eine Erfolgsmeldung auslösen sollen.
  const quiet = req.query?.quiet === '1';
  const telegram = (failed.length || !quiet)
    ? await notifyTelegram(lines.join('\n'))
    : { delivered: 0, failed: 0, skipped: 'quiet' };

  // Eine unzustellbare Meldung ist selbst ein Ausfall — sonst schweigt der
  // Wächter und niemand merkt es.
  const broken = failed.length > 0 || telegram.failed > 0 || Boolean(telegram.error);

  return res.status(broken ? 503 : 200).json({
    status: failed.length ? 'failing' : 'ok',
    telegram,
    checks,
  });
}
