/* global process, fetch */
import { applySecurityHeaders } from './_security.js';
import { sendTelegramMessage } from './_telegram.js';

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
 */

const SITE = 'https://natalnavigator.com';

// Muss im ausgelieferten Bundle stehen. Fehlt sie, wurde ohne
// VITE_SUPABASE_URL gebaut und das Frontend ist tot.
const SUPABASE_REF = 'kbwjxtvqdkcicaydtixp';

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
    lines.push('', 'Letzter Deploy ohne Env gebaut? Prüfe, ob jemand mit --prebuilt deployt hat.');
  }

  // Bei "quiet" nur melden, wenn etwas kaputt ist — für Aufrufe direkt nach
  // einem Deploy, die nicht jedes Mal eine Erfolgsmeldung auslösen sollen.
  const quiet = req.query?.quiet === '1';
  let notified = false;
  if (failed.length || !quiet) {
    await sendTelegramMessage(lines.join('\n'));
    notified = true;
  }

  return res.status(failed.length ? 503 : 200).json({
    status: failed.length ? 'failing' : 'ok',
    notified,
    checks,
  });
}
