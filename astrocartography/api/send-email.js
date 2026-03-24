import { Resend } from 'resend';

const ALLOWED_ORIGINS = ['https://natalnavigator.com', 'https://www.natalnavigator.com'];

function getCorsHeaders(req) {
  const origin = req.headers.origin || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin) ||
    (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost'));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// ─── In-memory rate limiter (per Vercel instance) ───
const _rateMap = new Map();
const RATE_LIMIT = 10;       // max requests
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

  const { to, subject, html, from } = req.body || {};

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: from || 'NatalNavigator <info@natalnavigator.com>',
      to: Array.isArray(to) ? to : [to],
      subject,
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
