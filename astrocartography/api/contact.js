import { Resend } from 'resend';
import { applySecurityHeaders, getClientIp, getCorsHeaders } from './_security.js';

// ─── Public contact form endpoint ───
// Unauthenticated by design (anonymous visitors must be able to reach the
// operator — this is the § 5 DDG "second contact channel"). It is NOT an open
// relay: the recipient and the From address are hardcoded server-side, so a
// caller can only deliver a message to the operator's own inbox — never send
// mail to arbitrary third parties or spoof the From. Abuse is limited to the
// operator's own inbox, throttled by per-IP rate limiting and a honeypot.
const RECIPIENT = 'info@natalnavigator.com';
const FROM = 'NatalNavigator Kontakt <info@natalnavigator.com>';

// ─── In-memory rate limiter (per Vercel instance) ───
const _rateMap = new Map();
const RATE_LIMIT = 3;        // max submissions
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

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length < 255;
}

// Escape user input before embedding it in the notification HTML, so a message
// can never inject markup or break out into the email template.
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
  if (isRateLimited(`contact:${clientIp}`)) {
    return res.status(429).json({ error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' });
  }

  const { name, email, message, company } = req.body || {};

  // Honeypot: real users never fill the hidden "company" field. Bots do.
  // Pretend success so the bot does not learn the field is a trap.
  if (company) {
    return res.status(200).json({ ok: true });
  }

  if (!email || !message) {
    return res.status(400).json({ error: 'Bitte E-Mail und Nachricht angeben.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Bitte eine gültige E-Mail-Adresse angeben.' });
  }
  if (typeof message !== 'string' || message.length < 2 || message.length > 5000) {
    return res.status(400).json({ error: 'Die Nachricht ist zu kurz oder zu lang.' });
  }
  const senderName = typeof name === 'string' ? name.slice(0, 120) : '';

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[contact] RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Kontaktformular ist nicht konfiguriert.' });
  }

  const html = `
    <h2>Neue Kontaktanfrage über natalnavigator.com</h2>
    <p><strong>Name:</strong> ${escapeHtml(senderName) || '—'}</p>
    <p><strong>E-Mail:</strong> ${escapeHtml(email)}</p>
    <p><strong>Nachricht:</strong></p>
    <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
  `;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: [RECIPIENT],
      replyTo: email,
      subject: `Kontaktanfrage von ${senderName || email}`,
      html,
    });
    if (error) {
      console.error('[contact] Resend error:', error);
      return res.status(400).json({ error: 'Die Nachricht konnte nicht gesendet werden.' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[contact] Unexpected error:', err);
    return res.status(500).json({ error: 'Die Nachricht konnte nicht gesendet werden.' });
  }
}
