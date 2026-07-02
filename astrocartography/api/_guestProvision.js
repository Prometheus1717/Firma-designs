import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// Shared guest-checkout provisioning, used by BOTH delivery paths:
//   1. api/stripe-webhook.js   — Stripe pushes checkout.session.completed
//   2. api/verify-session.js   — the buyer's own return to /result?session_id=…
// Two independent triggers mean a webhook outage, a misconfigured endpoint or
// a preview deployment (whose webhook points elsewhere) can never produce a
// "paid but got nothing" customer: whichever path runs first provisions, the
// other recognises the account is already set up and does nothing.

let _supabaseAdmin = null;
export function getSupabaseAdmin() {
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

const APP_ORIGIN = 'https://natalnavigator.com';

// ─── Guest one-tap login link ───
// The buyer's browser has no session after a guest payment, so we email a
// magic link to claim/access the saved map on any device. Best-effort: a
// failure here never fails provisioning (the local post-payment page already
// shows their result, and "Sign in" → email link works any time later).
async function sendGuestLoginLink(supabase, email) {
  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${APP_ORIGIN}/dashboard` },
    });
    const link = data?.properties?.action_link;
    if (error || !link) {
      console.error('[guest-provision] generateLink failed:', error?.message || 'no action_link');
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
    <p style="font-size:11px;color:#5A7088;margin:26px 0 0;">One-time purchase · lifetime access. If the button expires, use "Sign in" on natalnavigator.com with this email — a fresh login link is sent every time.</p>
  </div>
</div>`,
    }).catch(err => console.error('[guest-provision] Login-link email failed:', err));
  } catch (err) {
    console.error('[guest-provision] sendGuestLoginLink error:', err);
  }
}

// ─── Guest provisioning ───
// Find-or-create the account for the paying email, mark it premium, persist the
// birth data captured at checkout, and email the login link. Idempotent: when
// the profile is already premium with this Stripe customer (the other delivery
// path won the race), it returns without re-writing or re-emailing.
// Returns { userId, alreadyProvisioned }.
export async function provisionGuestAccount(supabase, meta, customerEmail, stripeCustomerId) {
  const email = String(meta.email || customerEmail || '').trim().toLowerCase();
  if (!email) throw new Error('guest checkout: no email');

  // Create the account (auto-confirmed — Stripe already verified a real email).
  let userId = null;
  let existingProfile = null;
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (!createErr && created?.user?.id) {
    userId = created.user.id;
  } else {
    // Already registered (returning visitor, earlier sign-up, or the other
    // delivery path was faster) — the profile row (id = auth user id) exists
    // for every user via the handle_new_user trigger.
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, is_premium, stripe_customer_id, birth_date')
      .eq('email', email)
      .maybeSingle();
    if (existing?.id) {
      userId = existing.id;
      existingProfile = existing;
    }
  }
  if (!userId) throw new Error(`guest checkout: could not resolve account for ${email}`);

  // Already fully provisioned for this purchase → nothing to do, no duplicate
  // emails. (Same customer id, premium set — the other path completed.)
  if (
    existingProfile?.is_premium === true &&
    stripeCustomerId && existingProfile?.stripe_customer_id === stripeCustomerId
  ) {
    return { userId, alreadyProvisioned: true };
  }

  const update = {
    id: userId,
    email,
    is_premium: true,
    stripe_customer_id: stripeCustomerId,
    display_name: meta.display_name || null,
    updated_at: new Date().toISOString(),
  };
  // Never overwrite existing birth data with nulls — a signed-up user who
  // already entered their details and then bought as a guest keeps them.
  if (meta.birth_date) {
    update.birth_date = meta.birth_date;
    update.birth_time = meta.birth_time || null;
    update.birth_city = meta.birth_city || null;
    update.birth_lat = meta.birth_lat != null && meta.birth_lat !== '' ? parseFloat(meta.birth_lat) : null;
    update.birth_lng = meta.birth_lng != null && meta.birth_lng !== '' ? parseFloat(meta.birth_lng) : null;
  }
  const { error: upErr } = await supabase.from('profiles').upsert(update, { onConflict: 'id' });
  if (upErr) throw upErr;

  await sendGuestLoginLink(supabase, email);
  return { userId, alreadyProvisioned: false };
}
