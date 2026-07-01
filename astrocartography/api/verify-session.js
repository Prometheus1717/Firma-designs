import Stripe from 'stripe';
import { applySecurityHeaders, getCorsHeaders } from './_security.js';

// Server-side confirmation that a Stripe Checkout session was actually paid.
// The data-first funnel returns a guest to /result?payment=success&session_id=…;
// the client calls this before lifting the teaser gate, so a hand-typed
// ?payment=success cannot unlock the paid content. Entitlement itself still
// lives server-side (profiles.is_premium, set by the webhook) — this only gates
// the local, already-computed preview.
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
    return res.status(200).json({ paid, email: session?.customer_details?.email || null });
  } catch (err) {
    console.error('[verify-session] Error:', err);
    return res.status(500).json({ error: 'Verification failed' });
  }
}
