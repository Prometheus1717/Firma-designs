/* global process */
import { Buffer } from 'node:buffer';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { applySecurityHeaders } from './_security.js';

/**
 * Täglicher Gesundheitsbericht nach Telegram.
 *
 * Zuverlässigkeitsmodell:
 * - jeder externe Request hat eine feste Abbruchgrenze;
 * - Telegram wird bei transienten Fehlern mit Backoff erneut versucht;
 * - Supabase hält pro Berliner Kalendertag einen Zustellnachweis und eine
 *   kurze Lease, damit doppelte Cron-Ereignisse keine doppelten Nachrichten
 *   erzeugen und abgebrochene Läufe später übernommen werden können;
 * - ein optionaler unabhängiger Supabase-Cron kann denselben, idempotenten
 *   Handler nach dem Vercel-Zeitfenster erneut aufrufen und einen Dead-man-
 *   Alarm auslösen.
 */

const SITE = 'https://natalnavigator.com';
const SUPABASE_REF = 'kbwjxtvqdkcicaydtixp';
const DEADLOCK_MARKER = 'Payment required before entering birth data.';
const CHECK_TIMEOUT_MS = 7_000;
const TELEGRAM_TIMEOUT_MS = 8_000;
const TELEGRAM_ATTEMPTS = 4;
const TELEGRAM_CHUNK_SIZE = 3_900;
const RUN_LEASE_SECONDS = 180;

let monitorSupabase;

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function logEvent(level, event, data = {}) {
  const payload = {
    level,
    event,
    monitor: 'natal-navigator-daily-health',
    timestamp: new Date().toISOString(),
    ...data,
  };
  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warning') console.warn(line);
  else console.log(line);
}

function safeEqual(value, expected) {
  if (!value || !expected) return false;
  const actualBuffer = Buffer.from(String(value));
  const expectedBuffer = Buffer.from(String(expected));
  return actualBuffer.length === expectedBuffer.length
    && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function isAuthorized(authorization, env = process.env) {
  const secrets = [env.CRON_SECRET, env.MONITOR_FALLBACK_SECRET].filter(Boolean);
  if (!secrets.length) return false;
  return secrets.some(secret => safeEqual(authorization, `Bearer ${secret}`));
}

export function reportDateBerlin(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export async function fetchWithTimeout(
  url,
  init = {},
  timeoutMs = CHECK_TIMEOUT_MS,
  fetchImpl = fetch
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const parentSignal = init.signal;
  const abortFromParent = () => controller.abort();
  if (parentSignal) {
    if (parentSignal.aborted) controller.abort();
    else parentSignal.addEventListener('abort', abortFromParent, { once: true });
  }

  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted && !parentSignal?.aborted) {
      throw new Error(`Timeout nach ${timeoutMs} ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener?.('abort', abortFromParent);
  }
}

function must(condition, message) {
  if (!condition) throw new Error(message);
}

export function deploymentProvenance(env = process.env) {
  must(
    env.VERCEL_ENV === 'production',
    `Deployment läuft in Umgebung "${env.VERCEL_ENV || 'unbekannt'}" statt Produktion`
  );

  const ref = env.VERCEL_GIT_COMMIT_REF;
  const sha = (env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7);
  return ref
    ? `${ref}@${sha || '?'} (production)`
    : `CLI-Deployment (${env.VERCEL_URL || 'production'})`;
}

async function captureCheck(name, fn) {
  const startedAt = Date.now();
  try {
    return {
      name,
      ok: true,
      detail: (await fn()) || '',
      ms: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: errorMessage(error),
      ms: Date.now() - startedAt,
    };
  }
}

/**
 * Die Prüfungen bleiben absichtlich in einer stabilen Reihenfolge. Nach dem
 * Laden von HTML und Entry-Bundle laufen unabhängige Grenzen parallel, damit
 * ein langsamer Dienst nicht alle übrigen Prüfungen und Telegram blockiert.
 */
export async function runChecks({
  fetchImpl = fetch,
  timeoutMs = CHECK_TIMEOUT_MS,
  env = process.env,
} = {}) {
  let indexHtml = '';
  let anonKey = '';
  let entryJs = '';
  const request = (url, init) => fetchWithTimeout(url, init, timeoutMs, fetchImpl);

  const provenance = await captureCheck(
    'Herkunft des Deployments',
    async () => deploymentProvenance(env)
  );

  const homepage = await captureCheck('Startseite', async () => {
    const response = await request(`${SITE}/`, { redirect: 'follow' });
    must(response.status === 200, `HTTP ${response.status}`);
    indexHtml = await response.text();
    must(indexHtml.includes('<div id="root">'), 'kein #root im HTML');
    return `${(indexHtml.length / 1024).toFixed(0)} KB`;
  });

  const bundle = await captureCheck('Build-Env im Bundle', async () => {
    must(indexHtml, 'Startseite nicht geladen');
    const entry = indexHtml.match(/src="(\/assets\/index-[A-Za-z0-9_-]+\.js)"/)?.[1];
    must(entry, 'kein Entry-Bundle im HTML');

    const response = await request(`${SITE}${entry}`);
    must(response.status === 200, `Bundle HTTP ${response.status}`);
    entryJs = await response.text();
    must(
      entryJs.includes(SUPABASE_REF),
      'VITE_SUPABASE_URL fehlt — ohne Env gebaut, React mountet nicht'
    );
    must(entryJs.includes('phc_'), 'VITE_POSTHOG_KEY fehlt — ohne Env gebaut');
    anonKey = entryJs.match(/sb_publishable_[A-Za-z0-9_-]{20,}/)?.[0]
      || entryJs.match(/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/)?.[0]
      || '';
    return entry.replace('/assets/', '');
  });

  const remaining = await Promise.all([
    captureCheck('App-Chunks abrufbar', async () => {
      must(indexHtml, 'Startseite nicht geladen');
      const chunks = [...indexHtml.matchAll(/href="(\/assets\/vendor-[A-Za-z0-9_-]+\.js)"/g)]
        .map(match => match[1]);
      must(chunks.length >= 2, `nur ${chunks.length} Vendor-Chunks verlinkt`);
      await Promise.all(chunks.map(async chunk => {
        const response = await request(`${SITE}${chunk}`, { method: 'HEAD' });
        must(response.status === 200, `${chunk} HTTP ${response.status}`);
      }));
      return `${chunks.length} Chunks ok`;
    }),

    captureCheck('Server-Env vollständig', async () => {
      const response = await request(`${SITE}/api/health`);
      const body = await response.json().catch(() => ({}));
      must(response.status === 200, `Status "${body.status || response.status}" — Server-Variable fehlt`);
      return body.status || 'ok';
    }),

    captureCheck('Kaufweg im Bundle', async () => {
      must(entryJs, 'Entry-Bundle nicht geladen');
      must(!entryJs.includes(DEADLOCK_MARKER), 'Payment-Deadlock von Juni ist zurück');
      must(entryJs.includes('/create'), 'Route /create fehlt — Kauf-Funnel ist weg');
      const chunk = entryJs.match(/assets\/CreatePage-[A-Za-z0-9_-]+\.js/)?.[0];
      must(chunk, 'kein CreatePage-Chunk im Bundle referenziert');
      const response = await request(`${SITE}/${chunk}`);
      must(response.status === 200, `CreatePage-Chunk HTTP ${response.status}`);
      const createJs = await response.text();
      must(!createJs.includes(DEADLOCK_MARKER), 'Payment-Deadlock im CreatePage-Chunk');
      must(createJs.includes('guest_checkout'), 'Guest-Checkout fehlt');
      return chunk.replace('assets/', '');
    }),

    captureCheck('Kauf-Abschluss erreichbar', async () => {
      const response = await request(`${SITE}/api/verify-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      must(response.status !== 404, 'verify-session fehlt');
      must(response.status < 500, `HTTP ${response.status}`);
      return `antwortet ${response.status}`;
    }),

    captureCheck('Checkout-Endpunkt', async () => {
      const response = await request(`${SITE}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      must(response.status < 500, `HTTP ${response.status} — Stripe-Env oder Function kaputt`);
      return `antwortet ${response.status}`;
    }),

    captureCheck('Supabase + Anon-Key', async () => {
      must(anonKey, 'kein Anon-Key im Bundle gefunden');
      const response = await request(`https://${SUPABASE_REF}.supabase.co/auth/v1/health`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      });
      must(response.status !== 401, 'Anon-Key abgelehnt — Login und Kauf sind tot');
      must(response.ok, `HTTP ${response.status}`);
      return 'Key akzeptiert';
    }),

    captureCheck('Sitemap', async () => {
      const response = await request(`${SITE}/sitemap.xml`);
      must(response.status === 200, `HTTP ${response.status}`);
      const count = ((await response.text()).match(/<loc>/g) || []).length;
      must(count >= 100, `nur ${count} URLs (erwartet >= 100)`);
      return `${count} URLs`;
    }),

    captureCheck('robots.txt + OG-Bild', async () => {
      const [robots, og] = await Promise.all([
        request(`${SITE}/robots.txt`),
        request(`${SITE}/og.png`, { method: 'HEAD' }),
      ]);
      must(robots.status === 200, `robots.txt HTTP ${robots.status}`);
      must((await robots.text()).includes('Sitemap'), 'robots.txt ohne Sitemap-Verweis');
      must(og.status === 200, `og.png HTTP ${og.status}`);
      const size = Number(og.headers.get('content-length') || 0);
      must(size > 10_000, `og.png nur ${size} Bytes`);
      return `og.png ${(size / 1024).toFixed(0)} KB`;
    }),
  ]);

  return [provenance, homepage, bundle, ...remaining];
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function splitTelegramText(text, limit = TELEGRAM_CHUNK_SIZE) {
  if (text.length <= limit) return [text];
  const chunks = [];
  let current = '';
  for (const line of text.split('\n')) {
    if (line.length > limit) {
      if (current) chunks.push(current);
      for (let offset = 0; offset < line.length; offset += limit) {
        chunks.push(line.slice(offset, offset + limit));
      }
      current = '';
      continue;
    }
    const candidate = current ? `${current}\n${line}` : line;
    if (candidate.length > limit) {
      chunks.push(current);
      current = line;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableTelegramStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

async function sendTelegramChunk({
  token,
  chatId,
  text,
  chatIndex,
  chunkIndex,
  fetchImpl,
  sleepImpl,
  random,
  timeoutMs,
  maxAttempts,
  runId,
}) {
  let lastError = 'unbekannter Telegram-Fehler';
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const startedAt = Date.now();
    try {
      const response = await fetchWithTimeout(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
        },
        timeoutMs,
        fetchImpl
      );
      const body = await response.json().catch(() => ({}));
      if (response.ok && body.ok === true) {
        logEvent('info', 'monitor.delivery.attempt', {
          runId,
          chatIndex,
          chunkIndex,
          attempt,
          ok: true,
          ms: Date.now() - startedAt,
        });
        return { ok: true, messageId: body.result?.message_id };
      }

      lastError = `${response.status} ${body.description || 'Telegram lehnte die Nachricht ab'}`.trim();
      const retryable = isRetryableTelegramStatus(response.status)
        || (response.ok && body.ok !== true);
      logEvent(retryable ? 'warning' : 'error', 'monitor.delivery.attempt', {
        runId,
        chatIndex,
        chunkIndex,
        attempt,
        ok: false,
        status: response.status,
        retryable,
        ms: Date.now() - startedAt,
      });
      if (!retryable || attempt === maxAttempts) break;
      const retryAfterMs = Number(body.parameters?.retry_after || 0) * 1_000;
      const backoffMs = Math.min(8_000, 500 * (2 ** (attempt - 1)));
      await sleepImpl(Math.max(retryAfterMs, Math.round(backoffMs * (0.5 + random()))));
    } catch (error) {
      lastError = errorMessage(error);
      logEvent('warning', 'monitor.delivery.attempt', {
        runId,
        chatIndex,
        chunkIndex,
        attempt,
        ok: false,
        retryable: true,
        error: lastError,
        ms: Date.now() - startedAt,
      });
      if (attempt === maxAttempts) break;
      const backoffMs = Math.min(8_000, 500 * (2 ** (attempt - 1)));
      await sleepImpl(Math.round(backoffMs * (0.5 + random())));
    }
  }
  return { ok: false, error: lastError };
}

export async function notifyTelegram(text, {
  env = process.env,
  fetchImpl = fetch,
  sleepImpl = sleep,
  random = Math.random,
  timeoutMs = TELEGRAM_TIMEOUT_MS,
  maxAttempts = TELEGRAM_ATTEMPTS,
  runId = 'unknown',
} = {}) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatIds = (env.TELEGRAM_CHAT_ID || env.TELEGRAM_CHAT_IDS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  if (!token || !chatIds.length) {
    return {
      delivered: 0,
      failed: 0,
      error: 'TELEGRAM_BOT_TOKEN oder TELEGRAM_CHAT_ID fehlt',
    };
  }

  const chunks = splitTelegramText(text);
  const chatResults = await Promise.all(chatIds.map(async (chatId, chatIndex) => {
    const messageIds = [];
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
      const result = await sendTelegramChunk({
        token,
        chatId,
        text: chunks[chunkIndex],
        chatIndex,
        chunkIndex,
        fetchImpl,
        sleepImpl,
        random,
        timeoutMs,
        maxAttempts,
        runId,
      });
      if (!result.ok) return result;
      if (result.messageId != null) messageIds.push(result.messageId);
    }
    return { ok: true, messageIds };
  }));

  const delivered = chatResults.filter(result => result.ok).length;
  const failed = chatResults.length - delivered;
  const errors = [...new Set(chatResults.filter(result => !result.ok).map(result => result.error))];
  return {
    delivered,
    failed,
    chunks: chunks.length,
    messageIds: chatResults.filter(result => result.ok).flatMap(result => result.messageIds || []),
    ...(errors.length ? { error: errors.join('; ') } : {}),
  };
}

function getMonitorSupabase(env = process.env) {
  if (monitorSupabase) return monitorSupabase;
  const url = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || '')
    .replace(/\/+$/, '')
    .replace(/\/rest\/v\d+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase-Monitor-Env fehlt');
  monitorSupabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return monitorSupabase;
}

async function claimDailyRun(supabase, { reportDate, runId, trigger }) {
  const { data, error } = await supabase.rpc('claim_health_report_run', {
    p_report_date: reportDate,
    p_attempt_id: runId,
    p_trigger: trigger,
    p_lease_seconds: RUN_LEASE_SECONDS,
  });
  if (error) throw error;
  return data === true;
}

async function completeDailyRun(supabase, {
  reportDate,
  runId,
  status,
  checks,
  telegram,
  error,
}) {
  const { data, error: rpcError } = await supabase.rpc('complete_health_report_run', {
    p_report_date: reportDate,
    p_attempt_id: runId,
    p_status: status,
    p_checks: checks,
    p_telegram: telegram,
    p_error: error || null,
  });
  if (rpcError) throw rpcError;
  return data === true;
}

function getTrigger(req) {
  if (req.query?.source === 'supabase' || String(req.query?.trigger || '').startsWith('supabase-')) {
    return String(req.query?.trigger || 'supabase-fallback');
  }
  if (String(req.headers['user-agent'] || '').includes('vercel-cron/')) return 'vercel-cron';
  return 'manual';
}

function buildReport(checks, now) {
  const failed = checks.filter(check => !check.ok);
  const localTime = now.toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const lines = [
    failed.length
      ? `🚨 <b>natalnavigator.com — ${failed.length} Problem${failed.length > 1 ? 'e' : ''}</b>`
      : '✅ <b>natalnavigator.com läuft</b>',
    `<i>${escapeHtml(localTime)} Uhr</i>`,
    '',
    ...checks.map(check => (
      `${check.ok ? '✅' : '❌'} ${escapeHtml(check.name)}`
      + `${check.detail ? ` — ${escapeHtml(check.detail)}` : ''}`
    )),
  ];
  if (failed.length) {
    lines.push(
      '',
      'Zuerst prüfen:',
      '1. Letzten Produktions-Deploy und Function-Logs prüfen.',
      '2. Build-Env und betroffenen externen Dienst prüfen.'
    );
  }
  return { failed, text: lines.join('\n') };
}

export async function handleHealthReport(req, res, dependencies = {}) {
  applySecurityHeaders(res);
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const env = dependencies.env || process.env;
  if (!isAuthorized(req.headers.authorization, env)) {
    const misconfigured = !env.CRON_SECRET && !env.MONITOR_FALLBACK_SECRET;
    return res.status(misconfigured ? 503 : 401).json({
      error: misconfigured ? 'Monitor authentication is not configured' : 'Unauthorized',
    });
  }

  const now = dependencies.now ? dependencies.now() : new Date();
  const runId = dependencies.randomUUID ? dependencies.randomUUID() : randomUUID();
  const reportDate = reportDateBerlin(now);
  const trigger = getTrigger(req);
  const quiet = req.query?.quiet === '1';
  const force = req.query?.force === '1';
  const startedAt = Date.now();
  let supabase;
  let ledgerAvailable = false;

  logEvent('info', 'monitor.run.start', { runId, reportDate, trigger, quiet, force });

  if (!quiet && !force) {
    try {
      supabase = dependencies.getSupabaseClient
        ? dependencies.getSupabaseClient(env)
        : getMonitorSupabase(env);
      ledgerAvailable = true;
      const claimed = await claimDailyRun(supabase, { reportDate, runId, trigger });
      if (!claimed) {
        logEvent('info', 'monitor.run.skipped', {
          runId,
          reportDate,
          trigger,
          reason: 'already-delivered-or-active',
        });
        return res.status(200).json({
          status: 'already-delivered',
          reportDate,
          trigger,
        });
      }
    } catch (error) {
      // Zustellung hat Vorrang vor perfekter Deduplizierung: fällt das Ledger
      // aus, wird weitergesendet. Eine seltene Dublette ist besser als Stille.
      logEvent('warning', 'monitor.ledger.claim_failed', {
        runId,
        reportDate,
        trigger,
        error: errorMessage(error),
      });
      ledgerAvailable = false;
    }
  }

  const checks = await runChecks({
    fetchImpl: dependencies.fetchImpl || fetch,
    timeoutMs: dependencies.checkTimeoutMs || CHECK_TIMEOUT_MS,
    env,
  });
  for (const check of checks) {
    logEvent(check.ok ? 'info' : 'error', 'monitor.check', {
      runId,
      name: check.name,
      ok: check.ok,
      detail: check.detail,
      ms: check.ms,
    });
  }

  const { failed, text } = buildReport(checks, now);
  const telegram = (failed.length || !quiet)
    ? await notifyTelegram(text, {
      env,
      fetchImpl: dependencies.fetchImpl || fetch,
      sleepImpl: dependencies.sleepImpl || sleep,
      random: dependencies.random || Math.random,
      timeoutMs: dependencies.telegramTimeoutMs || TELEGRAM_TIMEOUT_MS,
      maxAttempts: dependencies.telegramAttempts || TELEGRAM_ATTEMPTS,
      runId,
    })
    : { delivered: 0, failed: 0, skipped: 'quiet' };

  const delivered = telegram.skipped === 'quiet'
    || (telegram.delivered > 0 && telegram.failed === 0 && !telegram.error);
  const status = !delivered ? 'delivery_failed' : failed.length ? 'failing' : 'ok';

  if (ledgerAvailable && !quiet) {
    try {
      await completeDailyRun(supabase, {
        reportDate,
        runId,
        status: status === 'delivery_failed' ? 'error' : status,
        checks,
        telegram,
        error: delivered ? null : telegram.error || 'Telegram nicht vollständig zugestellt',
      });
    } catch (error) {
      logEvent('error', 'monitor.ledger.complete_failed', {
        runId,
        reportDate,
        trigger,
        error: errorMessage(error),
      });
    }
  }

  logEvent(delivered ? 'info' : 'error', 'monitor.run.complete', {
    runId,
    reportDate,
    trigger,
    status,
    failedChecks: failed.length,
    telegramDelivered: telegram.delivered,
    telegramFailed: telegram.failed,
    ms: Date.now() - startedAt,
  });

  // Ein kaputter Web-Check ist erfolgreich gemeldet worden und erhält 200.
  // Nur eine fehlende Zustellung ist 503; das verhindert Backup-Dubletten.
  return res.status(delivered ? 200 : 503).json({
    status,
    reportDate,
    trigger,
    telegram,
    checks,
  });
}

export default async function handler(req, res) {
  return handleHealthReport(req, res);
}
