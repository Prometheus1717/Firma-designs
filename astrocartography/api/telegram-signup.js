/* global process, Buffer */

import { createClient } from '@supabase/supabase-js';
import { applySecurityHeaders, getClientIp, getCorsHeaders, isUuid } from './_security.js';
import { buildSignupMessage, sendTelegramMessage } from './_telegram.js';

const _rateMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;
const MAX_SIGNUP_AGE_MS = 24 * 60 * 60 * 1000;

function isRateLimited(key) {
  const now = Date.now();
  let entry = _rateMap.get(key);
  if (!entry || now - entry.start > RATE_WINDOW) {
    entry = { start: now, count: 1 };
    _rateMap.set(key, entry);
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

let _supabaseAdmin = null;
function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '')
    .replace(/\/+$/, '').replace(/\/rest\/v\d+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  _supabaseAdmin = createClient(url, key);
  return _supabaseAdmin;
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  const CORS_HEADERS = getCorsHeaders(req);
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  const clientIp = getClientIp(req);
  if (isRateLimited(`telegram-signup:${clientIp}`)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const userId = body?.userId;
  const email = String(body?.email || '').trim().toLowerCase();
  if (!isUuid(userId) || !email) {
    return res.status(400).json({ error: 'Invalid signup payload' });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    const user = data?.user;

    if (error || !user || String(user.email || '').toLowerCase() !== email) {
      console.warn('[telegram-signup] User verification failed:', error?.message || userId);
      return res.status(202).json({ ok: true });
    }

    const createdAtMs = user.created_at ? new Date(user.created_at).getTime() : 0;
    if (!createdAtMs || Date.now() - createdAtMs > MAX_SIGNUP_AGE_MS) {
      console.warn('[telegram-signup] Ignoring non-recent signup notification:', userId);
      return res.status(202).json({ ok: true });
    }

    await sendTelegramMessage(buildSignupMessage({
      userId: user.id,
      email: user.email,
      createdAt: user.created_at,
    }));

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[telegram-signup] Unexpected error:', err);
    return res.status(202).json({ ok: true });
  }
}
