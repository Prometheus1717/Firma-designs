import Stripe from 'stripe';
import { applySecurityHeaders, getCorsHeaders } from './_security.js';
import { buildPaymentMessage, sendTelegramMessage } from './_telegram.js';
import { getSupabaseAdmin, provisionGuestAccount } from './_guestProvision.js';

// Server-side confirmation that a Stripe Checkout session was actually paid —
// AND the second, webhook-independent delivery path for guest purchases.
//
// The funnel returns a buyer to /result?payment=success&session_id=…; the
// client calls this endpoint. Beyond answering "was this paid?", a paid guest
// session is provisioned right here (account + premium + birth data + login
// link) when the webhook hasn't done it yet. Provisioning is idempotent, so
// webhook + verify-session can both run in any order — whichever is first does
// the work, the other becomes a no-op. A hand-typed ?payment=success without a
// real paid session unlocks nothing: entitlement always derives from Stripe's
// own record.
export default async function handler(req, res) {
  const CORS_HEADERS = getCorsHeaders(req);
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  const sessionId = req.query?.session_id || (req.body && req.body.session_id);
  if (!sessionId || typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
    return res.status(400).json({ error: 'Missing or invalid session_id' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = !!session && session.payment_status === 'paid';
    const email = session?.customer_details?.email || session?.customer_email || null;

    // Fallback provisioning for paid guest sessions. Never let a provisioning
    // hiccup break the buyer's unlock — their entitlement is Stripe's payment
    // record; the webhook retries independently.
    let provisioned = false;
    if (paid && session.metadata?.guest === '1') {
      try {
        const supabase = getSupabaseAdmin();
        const { userId, alreadyProvisioned } = await provisionGuestAccount(
          supabase, session.metadata, email, session.customer
        );
        provisioned = true;
        if (!alreadyProvisioned) {
          console.log(`[verify-session] Guest premium provisioned for ${userId} (webhook pending/down)`);
          sendTelegramMessage(buildPaymentMessage({
            userId, email, amount: session.amount_total,
            currency: session.currency, stripeCustomerId: session.customer, sessionId: session.id,
          })).catch(err => console.error('[verify-session] Telegram notification failed:', err));
        }
      } catch (err) {
        console.error('[verify-session] Fallback provisioning failed:', err);
        sendTelegramMessage(`⚠️ verify-session: guest paid but fallback provisioning failed for ${email || 'unknown'} (session ${sessionId}): ${err?.message || err}`)
          .catch(() => {});
      }
    }

    return res.status(200).json({ paid, provisioned, email });
  } catch (err) {
    console.error('[verify-session] Error:', err);
    return res.status(500).json({ error: 'Verification failed' });
  }
}
