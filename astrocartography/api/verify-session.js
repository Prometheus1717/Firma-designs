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
    let tokenHash = null;
    if (paid && session.metadata?.guest === '1') {
      try {
        const supabase = getSupabaseAdmin();
        const { userId, email: accountEmail, alreadyProvisioned } = await provisionGuestAccount(
          supabase, session.metadata, email, session.customer, session.id
        );
        provisioned = true;
        if (!alreadyProvisioned) {
          console.log(`[verify-session] Guest premium provisioned for ${userId} (claim winner)`);
          await sendTelegramMessage(buildPaymentMessage({
            userId, email, amount: session.amount_total,
            currency: session.currency, stripeCustomerId: session.customer, sessionId: session.id,
          })).catch(err => console.error('[verify-session] Telegram notification failed:', err));
        }
        // Auto-login for the purchase device: mint a one-time token the client
        // exchanges via verifyOtp — the buyer lands signed-in on /dashboard
        // with their name and saved chart, no email round-trip. The Stripe
        // session id (unguessable, known only to the buyer's browser) is the
        // bearer secret guarding this endpoint.
        try {
          const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: accountEmail,
          });
          if (!linkErr) tokenHash = linkData?.properties?.hashed_token || null;
          else console.error('[verify-session] generateLink failed:', linkErr.message);
        } catch (err) {
          console.error('[verify-session] auto-login token error:', err);
        }
      } catch (err) {
        console.error('[verify-session] Fallback provisioning failed:', err);
        await sendTelegramMessage(`⚠️ verify-session: guest paid but fallback provisioning failed for ${email || 'unknown'} (session ${sessionId}): ${err?.message || err}`)
          .catch(() => {});
      }
    }

    return res.status(200).json({ paid, provisioned, email, token_hash: tokenHash });
  } catch (err) {
    console.error('[verify-session] Error:', err);
    return res.status(500).json({ error: 'Verification failed' });
  }
}
