// TEMPORARY diagnostic endpoint — verifies the customer_creation fix from
// inside the Vercel runtime (where STRIPE_SECRET_KEY is readable). Guarded by a
// SHA-256 token so the public repo never exposes the secret. REMOVE after use.
import Stripe from 'stripe';
import crypto from 'node:crypto';
import { sendTelegramMessage } from './_telegram.js';

const TOKEN_SHA = '54616e6abea2b2fa01ae495b0e9948cd1605b6b7e8dd22f046dd25f1b659d4a1';

export default async function handler(req, res) {
  const token = (req.query && req.query.token) || '';
  const ok = token && crypto.createHash('sha256').update(String(token)).digest('hex') === TOKEN_SHA;
  if (!ok) return res.status(404).json({ error: 'Not found' });

  const out = { ts: new Date().toISOString() };
  try {
    // 1. Which relevant env vars exist — names + short prefixes only, never full values.
    const env = {};
    for (const k of Object.keys(process.env)) {
      if (/STRIPE|TELEGRAM|RESEND|WEBHOOK/i.test(k)) {
        const v = process.env[k] || '';
        env[k] = v ? `${v.slice(0, 8)}…(len ${v.length})` : 'EMPTY';
      }
    }
    out.env = env;

    const key = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRICE_ID;

    // 2. Create a REAL checkout session exactly like the live guest path, then
    //    read it back from Stripe. Creating a session charges nobody.
    if (key && priceId) {
      const stripe = new Stripe(key);
      const created = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: 'diagnostic-noreply@example.com',
        customer_creation: 'always',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: 'https://natalnavigator.com/result?payment=success',
        cancel_url: 'https://natalnavigator.com/create',
        metadata: { diagnostic: '1' },
      });
      const s = await stripe.checkout.sessions.retrieve(created.id);
      out.session = {
        id: s.id,
        livemode: s.livemode,
        mode: s.mode,
        customer_creation: s.customer_creation, // expect "always"
        customer: s.customer,                   // null until the buyer completes payment
        status: s.status,
      };

      // 3. Control: same call WITHOUT the param → shows the old (broken) default.
      const legacy = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: 'diagnostic-noreply@example.com',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: 'https://natalnavigator.com/result?payment=success',
        cancel_url: 'https://natalnavigator.com/create',
        metadata: { diagnostic: '1' },
      });
      out.legacySessionDefault = legacy.customer_creation; // expect "if_required"

      // 4. Current Customers list (count + newest ids) so we can watch it fill up.
      const custs = await stripe.customers.list({ limit: 5 });
      out.customers = { seen: custs.data.length, ids: custs.data.map(c => ({ id: c.id, email: c.email, created: c.created })) };
    } else {
      out.session = 'SKIPPED — STRIPE_SECRET_KEY or STRIPE_PRICE_ID not present in this environment';
    }

    // 5. Optional: exercise the Telegram path the webhook uses (?telegram=1).
    if (req.query && req.query.telegram === '1') {
      await sendTelegramMessage('🔧 Natal Navigator: Stripe-Diagnose-Test (kein echter Kauf). customer_creation-Fix wird geprüft.');
      out.telegram = 'sent';
    }
  } catch (e) {
    out.error = e && e.message ? e.message : String(e);
  }
  return res.status(200).json(out);
}
