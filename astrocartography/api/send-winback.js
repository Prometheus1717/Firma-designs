import { Resend } from 'resend';
import { applySecurityHeaders } from './_security.js';

// ─── TEMPORARY one-shot endpoint (2026-07-03) ───
// Sends the owner-approved win-back emails to the 10 signups stranded by the
// June pay-first deadlock. Runs server-side because RESEND_API_KEY is a
// sensitive env var (not pullable locally). Guarded by a random secret known
// only to the operator session. DELETE THIS FILE after the one send.

const SECRET = 'c0c1fe88227c2ca4d14b3f828307a6a8187dba7c2d7a343b';

const STANDARD = [
  'leledinoodle@gmail.com',
  'priwik22@gmail.com',
  'mashafarrr@gmail.com',
  'aciu.ioana@yahoo.com',
  'l.a.u.r.a_p.a.u.l@gmx.de',
  'anita.huwiler@anhu.ch',
  'noora.alhussini92@gmail.com',
  'n.92.n@icloud.com',
  'sayana.flow@outlook.com',
];
const RAIMONDS = 'raimonds.keris@gmail.com';

const shell = (inner) => `<div style="font-family:Arial,Helvetica,sans-serif;background:#0A1018;color:#8A9BB0;padding:40px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#0D1520;border:1px solid #1A2840;border-radius:12px;padding:36px 28px;text-align:center;">
    <div style="font-family:'Courier New',monospace;font-size:20px;font-weight:700;color:#00D88A;letter-spacing:5px;">NATAL&nbsp;NAVIGATOR</div>
    ${inner}
    <p style="font-size:11px;color:#5A7088;margin:26px 0 0;">Natal Navigator &middot; natalnavigator.com</p>
  </div>
</div>`;

const btn = (href, label) => `<a href="${href}" style="display:inline-block;background:#00D88A;color:#0A1018;font-family:'Courier New',monospace;font-size:13px;font-weight:700;letter-spacing:1px;text-decoration:none;padding:14px 34px;border-radius:8px;">${label}</a>`;

const signinUrl = (email) => `https://natalnavigator.com/auth?mode=login&email=${encodeURIComponent(email)}`;

const stdHtml = (email) => shell(`
    <div style="font-size:26px;padding:22px 0 6px;">&#128295;</div>
    <div style="font-family:'Courier New',monospace;font-size:18px;font-weight:700;color:#00D88A;padding-bottom:14px;">Sorry — that was on us</div>
    <p style="font-size:14px;line-height:1.7;color:#8A9BB0;margin:0 0 16px;">You created a Natal Navigator account recently, and a technical problem on our side made it unnecessarily hard to get to your astrocartography map. That bug is fixed.</p>
    <p style="font-size:14px;line-height:1.7;color:#8A9BB0;margin:0 0 24px;">If you're still curious where on Earth you thrive: your account is ready. Tap below, we'll email you a one-tap sign-in link (no password), enter your birth details — and your personal map appears.</p>
    ${btn(signinUrl(email), 'OPEN MY ACCOUNT')}
    <p style="font-size:11px;color:#5A7088;margin:26px 0 0;">If you're no longer interested, just ignore this email — we won't send another one.</p>`);

const raimondsHtml = (email) => shell(`
    <div style="font-size:26px;padding:22px 0 6px;">&#127873;</div>
    <div style="font-family:'Courier New',monospace;font-size:18px;font-weight:700;color:#00D88A;padding-bottom:14px;">Your refund is done — and Pro is still yours</div>
    <p style="font-size:14px;line-height:1.7;color:#8A9BB0;margin:0 0 16px;">A technical problem on our side broke your experience after your purchase — that was our fault, and it's now fixed. Your refund has been issued and is on its way back to you.</p>
    <p style="font-size:14px;line-height:1.7;color:#8A9BB0;margin:0 0 24px;">As an apology, we've kept full Pro access on your account — at no cost, it stays yours. Sign in below (one tap, no password), add your birth details in your account, and your complete astrocartography map unlocks.</p>
    ${btn(signinUrl(email), 'OPEN MY MAP — FREE')}`);

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (req.headers['x-winback-secret'] !== SECRET) return res.status(401).json({ error: 'Unauthorized' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'No RESEND_API_KEY' });
  const resend = new Resend(apiKey);

  // Batch endpoint: one API call for all 10 mails — no per-send rate limit,
  // no serverless-timeout risk from a sequential loop.
  const payload = [
    ...STANDARD.map((addr) => ({
      from: 'NatalNavigator <info@natalnavigator.com>',
      to: [addr],
      subject: 'Sorry — a technical issue on our side (now fixed)',
      html: stdHtml(addr),
    })),
    {
      from: 'NatalNavigator <info@natalnavigator.com>',
      to: [RAIMONDS],
      subject: 'Your refund is on its way — and your Pro access stays',
      html: raimondsHtml(RAIMONDS),
    },
  ];

  try {
    const { data, error } = await resend.batch.send(payload);
    if (error) return res.status(500).json({ error: error.message || String(error) });
    const ids = data?.data || data || [];
    return res.status(200).json({ sent: Array.isArray(ids) ? ids.length : 0, total: payload.length, ids });
  } catch (err) {
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
