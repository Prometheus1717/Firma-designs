import Stripe from 'stripe';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { applySecurityHeaders, isUuid } from './_security.js';
import { buildPaymentMessage, sendTelegramMessage } from './_telegram.js';

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

const APP_ORIGIN = 'https://natalnavigator.com';

// ─── Guest one-tap login link ───
// After a guest payment we provision the account server-side; the visitor's
// browser has no session yet, so we email them a magic link to claim/access
// their saved map on any device. Best-effort: a failure here never fails the
// webhook (the local post-payment unlock already shows their result).
async function sendGuestLoginLink(supabase, email) {
  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${APP_ORIGIN}/dashboard` },
    });
    const link = data?.properties?.action_link;
    if (error || !link) {
      console.error('[stripe-webhook] generateLink failed:', error?.message || 'no action_link');
      return;
    }
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: 'NatalNavigator <info@natalnavigator.com>',
      to: [email],
      subject: 'Your Natal Navigator map is ready — one-tap login',
      html: `<div style="font-family:Arial,Helvetica,sans-serif;background:#0A1018;color:#8A9BB0;padding:40px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#0D1520;border:1px solid #1A2840;border-radius:12px;padding:36px 28px;text-align:center;">
    <div style="font-family:'Courier New',monospace;font-size:20px;font-weight:700;color:#00D88A;letter-spacing:5px;">NATAL&nbsp;NAVIGATOR</div>
    <div style="font-size:26px;padding:22px 0 6px;">✨</div>
    <div style="font-family:'Courier New',monospace;font-size:18px;font-weight:700;color:#00D88A;padding-bottom:14px;">Premium Activated!</div>
    <p style="font-size:14px;line-height:1.7;color:#8A9BB0;margin:0 0 24px;">Your payment is confirmed and your personal astrocartography map is saved. Tap below to open it on any device — no password needed.</p>
    <a href="${link}" style="display:inline-block;background:#00D88A;color:#0A1018;font-family:'Courier New',monospace;font-size:13px;font-weight:700;letter-spacing:1px;text-decoration:none;padding:14px 34px;border-radius:8px;">OPEN MY MAP</a>
    <p style="font-size:11px;color:#5A7088;margin:26px 0 0;">One-time purchase · lifetime access. If the button expires, use "Sign in" on natalnavigator.com with this email.</p>
  </div>
</div>`,
    }).catch(err => console.error('[stripe-webhook] Login-link email failed:', err));
  } catch (err) {
    console.error('[stripe-webhook] sendGuestLoginLink error:', err);
  }
}

// ─── Guest provisioning ───
// Find-or-create the account for the paying email, mark it premium, persist the
// birth data captured at checkout, and email the login link. Returns the userId.
async function provisionGuestAccount(supabase, meta, customerEmail, stripeCustomerId) {
  const email = String(meta.email || customerEmail || '').trim().toLowerCase();
  if (!email) throw new Error('guest checkout: no email');

  // Create the account (auto-confirmed — Stripe already verified a real email).
  let userId = null;
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (!createErr && created?.user?.id) {
    userId = created.user.id;
  } else {
    // Already registered (returning visitor / earlier sign-up) — the profile row
    // (id = auth user id) is created for every user by the handle_new_user trigger.
    const { data: existing } = await supabase
      .from('profiles').select('id').eq('email', email).maybeSingle();
    if (existing?.id) userId = existing.id;
  }
  if (!userId) throw new Error(`guest checkout: could not resolve account for ${email}`);

  const { error: upErr } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email,
      is_premium: true,
      stripe_customer_id: stripeCustomerId,
      birth_date: meta.birth_date || null,
      birth_time: meta.birth_time || null,
      birth_city: meta.birth_city || null,
      birth_lat: meta.birth_lat != null && meta.birth_lat !== '' ? parseFloat(meta.birth_lat) : null,
      birth_lng: meta.birth_lng != null && meta.birth_lng !== '' ? parseFloat(meta.birth_lng) : null,
      display_name: meta.display_name || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  if (upErr) throw upErr;

  await sendGuestLoginLink(supabase, email);
  return userId;
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
    const meta = session.metadata || {};
    const userId = meta.userId;

    if (session.payment_status && session.payment_status !== 'paid') {
      console.error('[stripe-webhook] Checkout completed but not paid', session.id, session.payment_status);
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // ── Guest checkout (data-first funnel): provision the account on payment ──
    if (meta.guest === '1') {
      try {
        const supabase = getSupabaseAdmin();
        const provisionedId = await provisionGuestAccount(supabase, meta, customerEmail, stripeCustomerId);
        console.log(`[stripe-webhook] Guest premium provisioned for ${provisionedId}`);
        if (customerEmail) sendPaymentConfirmationEmail(customerEmail, amountTotal, currency);
        sendTelegramMessage(buildPaymentMessage({
          userId: provisionedId, email: customerEmail, amount: amountTotal,
          currency, stripeCustomerId, sessionId: session.id,
        })).catch(err => console.error('[stripe-webhook] Telegram notification failed:', err));
        return res.status(200).json({ received: true });
      } catch (err) {
        // Payment succeeded but provisioning failed — alert the owner and return
        // 5xx so Stripe retries. The buyer already sees their result locally.
        console.error('[stripe-webhook] Guest provisioning failed:', err);
        sendTelegramMessage(`⚠️ Guest checkout paid but provisioning FAILED for ${customerEmail || meta.email || 'unknown'} (session ${session.id}): ${err?.message || err}`)
          .catch(() => {});
        return res.status(500).json({ error: 'Guest provisioning failed' });
      }
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

      // Notify the owner after entitlement was successfully activated.
      sendTelegramMessage(buildPaymentMessage({
        userId,
        email: customerEmail,
        amount: amountTotal,
        currency,
        stripeCustomerId,
        sessionId: session.id,
      })).catch(err => console.error('[stripe-webhook] Telegram notification failed:', err));
    } catch (err) {
      console.error('[stripe-webhook] Unexpected error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // Always return 200 to acknowledge receipt (Stripe retries on non-2xx)
  return res.status(200).json({ received: true });
}
