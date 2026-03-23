import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Supabase admin client (service role — bypasses RLS)
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key);
}

export const config = {
  api: { bodyParser: false }, // Stripe needs the raw body for signature verification
};

// Read raw body from request stream
async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    console.error('[stripe-webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const stripe = new Stripe(stripeSecretKey);
  const rawBody = await readRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // ─── Handle checkout.session.completed ───
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_details?.email || session.customer_email;
    const stripeCustomerId = session.customer;

    if (!customerEmail) {
      console.error('[stripe-webhook] No customer email in session', session.id);
      return res.status(400).json({ error: 'No customer email' });
    }

    try {
      const supabase = getSupabaseAdmin();

      // Update profile: mark as premium + store Stripe customer ID
      const { error } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString(),
        })
        .eq('email', customerEmail);

      if (error) {
        console.error('[stripe-webhook] Supabase update failed:', error.message);
        return res.status(500).json({ error: 'Database update failed' });
      }

      console.log(`[stripe-webhook] ✓ Premium activated for ${customerEmail}`);
    } catch (err) {
      console.error('[stripe-webhook] Unexpected error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // Always return 200 to acknowledge receipt (Stripe retries on non-2xx)
  return res.status(200).json({ received: true });
}
