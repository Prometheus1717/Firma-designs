import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = ['https://natalnavigator.com', 'https://www.natalnavigator.com'];

// Only these templates can be sent from the client
const ALLOWED_TEMPLATES = ['welcome', 'verification', 'passwordReset', 'notification'];

function getCorsHeaders(req) {
  const origin = req.headers.origin || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin) ||
    (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost'));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ─── In-memory rate limiter (per Vercel instance) ───
const _rateMap = new Map();
const RATE_LIMIT = 5;        // max requests
const RATE_WINDOW = 60_000;  // per 60 seconds

function isRateLimited(key) {
  const now = Date.now();
  let entry = _rateMap.get(key);
  if (!entry || now - entry.start > RATE_WINDOW) {
    entry = { start: now, count: 1 };
    _rateMap.set(key, entry);
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT) return true;
  return false;
}

// Validate email format
function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length < 255;
}

// Singleton Supabase admin client — reuse across warm function invocations
let _supabase = null;
function getSupabase() {
  if (_supabase) return _supabase;
  // VITE_SUPABASE_URL preferred (frontend-confirmed); strip any /rest/v\d+ suffix
  // mistakenly set in SUPABASE_URL — supabase-js expects the bare project URL.
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '')
    .replace(/\/+$/, '').replace(/\/rest\/v\d+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _supabase = createClient(url, key);
  return _supabase;
}

// Verify Supabase JWT and return user
async function verifyAuth(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export default async function handler(req, res) {
  const CORS_HEADERS = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set CORS headers on all responses
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  // Rate limit by IP
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(`email:${clientIp}`)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[send-email] RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const { to, subject, html } = req.body || {};

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
  }

  // Validate recipient email
  const recipient = Array.isArray(to) ? to[0] : to;
  if (!isValidEmail(recipient)) {
    return res.status(400).json({ error: 'Invalid recipient email' });
  }

  // Only allow sending to a single recipient
  if (Array.isArray(to) && to.length > 1) {
    return res.status(400).json({ error: 'Only single recipient allowed' });
  }

  // Verify auth — email can only be sent to the authenticated user's own email.
  // Previously the "no auth = pass" branch existed for hypothetical server-to-
  // server callers (no real caller used it — the Stripe webhook has its own
  // Resend instance). That left this endpoint as an open relay where anyone
  // could send phishing mails from info@natalnavigator.com, throttled only by
  // a per-IP rate limit. Auth is now mandatory.
  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (user.email !== recipient) {
    return res.status(403).json({ error: 'Can only send emails to your own address' });
  }

  // Sanitize: never allow client to override the from address
  const from = 'NatalNavigator <info@natalnavigator.com>';

  // Limit HTML size to prevent abuse (50KB max)
  if (typeof html === 'string' && html.length > 50_000) {
    return res.status(400).json({ error: 'Email content too large' });
  }

  // Limit subject length
  if (typeof subject === 'string' && subject.length > 200) {
    return res.status(400).json({ error: 'Subject too long' });
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: [recipient],
      subject: subject.slice(0, 200),
      html,
    });

    if (error) {
      console.error('[send-email] Resend error:', error);
      return res.status(400).json({ error: error.message || 'Resend rejected the request' });
    }

    return res.status(200).json({ data });
  } catch (err) {
    console.error('[send-email] Unexpected error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
