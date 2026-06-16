import Stripe from 'stripe';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { applySecurityHeaders, isUuid } from './_security.js';

// Supabase admin client (service role — bypasses RLS)
// Singleton: reuse across warm function invocations to avoid connection pool exhaustion
let _supabaseAdmin = null;
function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;
  // VITE_SUPABASE_URL preferred (frontend-confirmed); strip any /rest/v\d+ suffix
  // mistakenly set in SUPABASE_URL — supabase-js expects the bare project URL.
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '')
    .replace(/\/+$/, '').replace(/\/rest\/v\d+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  _supabaseAdmin = createClient(url, key);
  return _supabaseAdmin;
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

// ─── Payment confirmation email ───
async function sendPaymentConfirmationEmail(email, amount, currency) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.error('[stripe-webhook] No RESEND_API_KEY, skipping email'); return; }

  const resend = new Resend(apiKey);
  const cur = (currency || 'eur').toUpperCase();
  const formattedAmount = amount ? `${(amount / 100).toFixed(2)} ${cur}` : `9.99 ${cur}`;

  await resend.emails.send({
    from: 'NatalNavigator <info@natalnavigator.com>',
    to: [email],
    subject: 'Payment Confirmed — NatalNavigator Premium Activated',
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <title>NatalNavigator</title>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #0A1018;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0A1018;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width: 560px; width: 100%;">
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 700; color: #00D88A; letter-spacing: 6px;">
                    NATAL&nbsp;&nbsp;NAVIGATOR
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #5A7088; letter-spacing: 3px; padding-top: 6px;">
                    YOUR PERSONAL ASTROCARTOGRAPHY MAP
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0D1520; border: 1px solid #1A2840; border-radius: 12px; padding: 40px 32px;" bgcolor="#0D1520">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 20px; font-size: 32px;">&#10024;</td>
                </tr>
                <tr>
                  <td align="center" style="font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: 700; color: #00D88A; padding-bottom: 16px;">
                    Premium Activated!
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #8A9BB0; line-height: 1.7; padding-bottom: 8px;">
                    Your payment of <strong style="color: #E8A838;">${formattedAmount}</strong> has been confirmed.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #8A9BB0; line-height: 1.7; padding-bottom: 28px;">
                    Your personal astrocartography chart is now unlocked. Explore your planetary lines, discover your best cities, and navigate your natal map.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                      <tr>
                        <td align="center" bgcolor="#00D88A" style="background-color: #00D88A; border-radius: 8px;">
                          <a href="https://natalnavigator.com/dashboard" target="_blank" style="display: inline-block; background-color: #00D88A; color: #0A1018; font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-decoration: none; padding: 14px 36px; border-radius: 8px;">
                            OPEN YOUR CHART
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #5A7088;">
                    This is a one-time purchase. You have lifetime access to NatalNavigator Premium.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #2A3A50;">
                    NATAL NAVIGATOR &copy; 2026
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  }).catch(err => console.error('[stripe-webhook] Email send failed:', err));
}

export default async function handler(req, res) {
  applySecurityHeaders(res);

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
    const amountTotal = session.amount_total;
    const currency = session.currency;
    const userId = session.metadata?.userId;

    if (session.payment_status && session.payment_status !== 'paid') {
      console.error('[stripe-webhook] Checkout completed but not paid', session.id, session.payment_status);
      return res.status(400).json({ error: 'Payment not completed' });
    }

    if (!isUuid(userId)) {
      console.error('[stripe-webhook] Missing or invalid metadata.userId in session', session.id);
      return res.status(400).json({ error: 'Invalid checkout metadata' });
    }

    try {
      const supabase = getSupabaseAdmin();

      // Update the exact server-authenticated user captured at checkout
      // creation. Email is used only for the receipt, never for entitlement.
      const { error } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('[stripe-webhook] Supabase update failed:', error.message);
        return res.status(500).json({ error: 'Database update failed' });
      }

      console.log(`[stripe-webhook] Premium activated for user ${userId}`);

      // Send confirmation email (fire-and-forget)
      if (customerEmail) sendPaymentConfirmationEmail(customerEmail, amountTotal, currency);
    } catch (err) {
      console.error('[stripe-webhook] Unexpected error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // Always return 200 to acknowledge receipt (Stripe retries on non-2xx)
  return res.status(200).json({ received: true });
}
